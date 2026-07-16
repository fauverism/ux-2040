/* UX 2040 — charts.js
   The #data dashboard. Chart.js (CDN, lazy-loaded when the section nears
   the viewport) for the three standard charts; the S-curves and counters
   are plain SVG/DOM handled here and in CSS. Every chart's data also
   lives in a visible <details> table — the charts enhance, never gate. */

(function () {
  "use strict";

  var section = document.getElementById("data");
  if (!section) return;

  var CDN = "https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.min.js";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var booted = false;

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ------------------------------------------------------------------
     Lazy boot — load the CDN only when the dashboard is near.
     ------------------------------------------------------------------ */
  function boot() {
    if (booted) return;
    booted = true;
    var script = document.createElement("script");
    script.src = CDN;
    script.onload = buildCharts;
    /* onerror: no charts — the visible data tables carry every value */
    document.head.appendChild(script);
  }

  if ("IntersectionObserver" in window) {
    var near = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            near.disconnect();
            boot();
          }
        });
      },
      { rootMargin: "800px 0px" }
    );
    near.observe(section);
  } else {
    boot();
  }

  /* Manual hook (debugging, tests) + immediate boot when already near */
  window.addEventListener("ux2040:init-charts", boot);
  var rect = section.getBoundingClientRect();
  if (rect.top < window.innerHeight + 800 && rect.bottom > -800) boot();

  /* ------------------------------------------------------------------
     Churn counters — count up on scroll-in; reduced motion or no
     observer leaves the final values that already sit in the HTML.
     ------------------------------------------------------------------ */
  var churn = document.getElementById("churn");

  function animateCount(el) {
    var to = parseInt(el.getAttribute("data-count-to"), 10);
    var start = null;
    var DURATION = 900;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / DURATION);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) window.requestAnimationFrame(frame);
    }

    el.textContent = "0";
    window.requestAnimationFrame(frame);
  }

  if (churn && !reduced && "IntersectionObserver" in window) {
    var counting = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            counting.disconnect();
            Array.prototype.slice
              .call(churn.querySelectorAll("[data-count-to]"))
              .forEach(animateCount);
          }
        });
      },
      { threshold: 0.35 }
    );
    counting.observe(churn);
  }

  /* ------------------------------------------------------------------
     Chart.js — three charts, one look: mono type, hairline solid grid,
     thin marks, paper gaps, tooltips that enhance rather than gate.
     ------------------------------------------------------------------ */
  function buildCharts() {
    if (typeof window.Chart === "undefined") return;
    var Chart = window.Chart;

    var paper = css("--paper");
    var ink = css("--ink");
    var inkSoft = css("--ink-soft");
    var inkMute = css("--ink-mute");
    var ruleHair = "rgba(29, 26, 22, 0.14)";
    var ruleSoft = "rgba(29, 26, 22, 0.28)";
    var mono = css("--font-mono") || "monospace";

    /* Validated categorical palette (dataviz six checks, on paper):
       production #c5311d · research #1e54c4 · strategy #1f8a6d ·
       orchestration #cf9100 (sub-3:1 — relieved by tables/legend/tooltip) */
    var C = {
      production: css("--vermillion-deep"),
      research: css("--cobalt"),
      strategy: "#1f8a6d",
      orchestration: css("--marigold-deep")
    };

    Chart.defaults.font.family = mono;
    Chart.defaults.font.size = 11;
    Chart.defaults.color = inkMute;

    var anim = reduced ? false : { duration: 700, easing: "easeOutQuart" };

    var tooltip = {
      backgroundColor: ink,
      titleColor: paper,
      bodyColor: paper,
      titleFont: { family: mono, size: 11 },
      bodyFont: { family: mono, size: 11 },
      cornerRadius: 3,
      padding: 10,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4
    };

    /* --- plugins ------------------------------------------------- */

    /* Hairline zero baseline for the diverging bar */
    var zeroLine = {
      id: "zeroLine",
      afterDatasetsDraw: function (chart) {
        var x = chart.scales.x;
        if (!x) return;
        var px = x.getPixelForValue(0);
        var ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = ruleSoft;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, chart.chartArea.top);
        ctx.lineTo(px, chart.chartArea.bottom);
        ctx.stroke();
        ctx.restore();
      }
    };

    /* Rank text inside the diverging bars (white on the dark fills) */
    var rolesLabels = {
      id: "rolesLabels",
      afterDatasetsDraw: function (chart) {
        var meta = chart.getDatasetMeta(0);
        var texts = chart.data.rankLabels || [];
        var ctx = chart.ctx;
        ctx.save();
        ctx.font = "11px " + mono;
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        meta.data.forEach(function (bar, i) {
          var text = texts[i];
          if (!text) return;
          var props = bar.getProps(["x", "y", "base"], true);
          var left = Math.min(props.x, props.base);
          var width = Math.abs(props.x - props.base);
          if (ctx.measureText(text).width + 16 > width) return; /* must fit */
          var negative = props.x < props.base;
          ctx.textAlign = negative ? "left" : "right";
          ctx.fillText(text, negative ? left + 8 : left + width - 8, props.y);
        });
        ctx.restore();
      }
    };

    /* Series name at each line's end (text tokens, never series color).
       Skipped on narrow canvases — the legend carries identity there. */
    var END_LABEL_MIN = 560;

    var endLabels = {
      id: "endLabels",
      afterDatasetsDraw: function (chart) {
        if (chart.width < END_LABEL_MIN) return;
        var ctx = chart.ctx;
        ctx.save();
        ctx.font = "11px " + mono;
        ctx.fillStyle = ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        chart.data.datasets.forEach(function (ds, i) {
          var meta = chart.getDatasetMeta(i);
          var last = meta.data[meta.data.length - 1];
          if (last) ctx.fillText(ds.label, last.x + 10, last.y);
        });
        ctx.restore();
      }
    };

    /* Reclaim the end-label gutter when the labels are off */
    function fitEndLabelPadding(chart, size) {
      var want = (size ? size.width : chart.width) >= END_LABEL_MIN ? 88 : 8;
      if (chart.options.layout.padding.right !== want) {
        chart.options.layout.padding.right = want;
        chart.update("none");
      }
    }

    /* Percent labels inside stacked segments — only where they fit and
       where the fill's luminance clears contrast (skip viridian). */
    var stackLabels = {
      id: "stackLabels",
      afterDatasetsDraw: function (chart) {
        var ctx = chart.ctx;
        ctx.save();
        ctx.font = "11px " + mono;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        chart.data.datasets.forEach(function (ds, i) {
          if (ds.labelInk === null) return; /* contrast: table carries it */
          var meta = chart.getDatasetMeta(i);
          meta.data.forEach(function (seg, j) {
            var props = seg.getProps(["x", "y", "base"], true);
            var width = Math.abs(props.x - props.base);
            var text = ds.data[j] + "%";
            if (ctx.measureText(text).width + 14 > width) return;
            ctx.fillStyle = ds.labelInk;
            ctx.fillText(text, (props.x + props.base) / 2, props.y);
          });
        });
        ctx.restore();
      }
    };

    var charts = {};

    /* --- 1 · Diverging bar: WEF roles ----------------------------- */
    charts.roles = new Chart(document.getElementById("chart-roles"), {
      type: "bar",
      data: {
        labels: ["Graphic design", "UI/UX design"],
        rankLabels: ["#11 fastest-declining", "top-10 fastest-growing"],
        datasets: [
          {
            data: [-1, 1],
            backgroundColor: [C.production, C.research],
            barThickness: 24,
            borderRadius: 4,
            borderSkipped: "start"
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: anim,
        layout: { padding: { right: 8 } },
        scales: {
          x: { display: false, min: -1.15, max: 1.15 },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: ink, font: { family: mono, size: 12 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: Object.assign({}, tooltip, {
            callbacks: {
              label: function (item) {
                return item.dataIndex === 0
                  ? "Declining: #11 fastest, #13 largest (WEF)"
                  : "Growing: top-10 fastest-growing (WEF)";
              }
            }
          })
        }
      },
      plugins: [zeroLine, rolesLabels]
    });

    /* --- 2 · Task-automation curves ------------------------------- */
    function series(label, color, points, anchorIndex) {
      var n = points.length;
      var bg = points.map(function (_, i) {
        return i === anchorIndex ? color : paper;
      });
      var radii = points.map(function (_, i) {
        return i === anchorIndex ? 6 : 4;
      });
      return {
        label: label,
        data: points,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        borderDash: [6, 5],
        borderCapStyle: "round",
        borderJoinStyle: "round",
        tension: 0.35,
        pointBackgroundColor: bg,
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointRadius: radii,
        pointHoverRadius: radii.map(function (r) { return r + 2; }),
        fill: false
      };
    }

    var YEARS = [2026, 2028, 2030, 2032, 2035, 2040];
    function pts(values) {
      return values.map(function (v, i) { return { x: YEARS[i], y: v }; });
    }

    charts.automation = new Chart(document.getElementById("chart-automation"), {
      type: "line",
      data: {
        datasets: [
          series("Production", C.production, pts([40, 65, 85, 92, 96, 98]), 0),
          series("Research", C.research, pts([15, 25, 40, 55, 65, 72]), -1),
          series("Strategy", C.strategy, pts([5, 8, 12, 18, 24, 30]), -1)
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: anim,
        layout: { padding: { right: 88 } },
        onResize: fitEndLabelPadding,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            type: "linear",
            min: 2025.4,
            max: 2040.6,
            grid: { display: false },
            border: { color: ruleSoft },
            afterBuildTicks: function (axis) {
              axis.ticks = YEARS.map(function (y) { return { value: y }; });
            },
            ticks: {
              callback: function (v) { return String(v); },
              maxRotation: 0
            }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: ruleHair, drawTicks: false },
            border: { display: false },
            ticks: {
              stepSize: 25,
              callback: function (v) { return v + "%"; }
            }
          }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              pointStyle: "line",
              boxWidth: 22,
              color: inkSoft,
              font: { family: mono, size: 11 },
              padding: 16
            }
          },
          tooltip: Object.assign({}, tooltip, {
            callbacks: {
              title: function (items) { return items.length ? String(items[0].parsed.x) : ""; },
              label: function (item) {
                var tag = item.datasetIndex === 0 && item.parsed.x === 2026 ? " (cited)" : " (projected)";
                return item.dataset.label + ": " + item.parsed.y + "%" + tag;
              }
            }
          })
        }
      },
      plugins: [endLabels]
    });
    fitEndLabelPadding(charts.automation);

    /* --- 3 · Skills shift: 100% stacked --------------------------- */
    function comp(label, color, values, labelInk) {
      return {
        label: label,
        data: values,
        backgroundColor: color,
        borderColor: paper,   /* the 2px surface gap between segments */
        borderWidth: 2,
        barThickness: 24,
        labelInk: labelInk
      };
    }

    charts.skills = new Chart(document.getElementById("chart-skills"), {
      type: "bar",
      data: {
        labels: ["2026", "2040"],
        datasets: [
          comp("Production", C.production, [55, 10], "#ffffff"),
          comp("Research", C.research, [20, 20], "#ffffff"),
          comp("Strategy / taste", C.strategy, [15, 35], null),
          comp("Orchestration", C.orchestration, [10, 35], ink)
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: anim,
        scales: {
          x: {
            stacked: true,
            min: 0,
            max: 100,
            grid: { color: ruleHair, drawTicks: false },
            border: { display: false },
            ticks: {
              stepSize: 25,
              callback: function (v) { return v + "%"; }
            }
          },
          y: {
            stacked: true,
            grid: { display: false },
            border: { display: false },
            ticks: { color: ink, font: { family: mono, size: 13 } }
          }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              pointStyle: "rect",
              boxWidth: 10,
              boxHeight: 10,
              color: inkSoft,
              font: { family: mono, size: 11 },
              padding: 16
            }
          },
          tooltip: Object.assign({}, tooltip, {
            callbacks: {
              label: function (item) {
                return item.dataset.label + ": " + item.parsed.x + "% of the week";
              }
            }
          })
        }
      },
      plugins: [stackLabels]
    });

    window.UX2040_CHARTS = charts;
  }
})();
