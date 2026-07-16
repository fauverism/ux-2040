/* UX 2040 — main.js
   Scroll-progress bar + nav scrollspy. No dependencies. */

(function () {
  "use strict";

  /* Signals "JS is running" — reveal hidden-states are scoped to .js so
     content is never invisible without a script to reveal it. */
  document.documentElement.classList.add("js");

  /* ------------------------------------------------------------------
     Scroll-progress bar
     Maps document scroll position to scaleX on the bar. rAF-throttled.
     ------------------------------------------------------------------ */
  var bar = document.getElementById("progress-bar");
  var ticking = false;

  function updateProgress() {
    ticking = false;
    if (!bar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = "scaleX(" + p + ")";
  }

  function requestProgress() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    }
  }

  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress, { passive: true });
  updateProgress();

  /* ------------------------------------------------------------------
     Nav scrollspy
     Watches a horizontal band around the viewport's center. The first
     watched section (in document order) inside the band is "current".
     Smooth scrolling itself is CSS (scroll-behavior), gated behind
     prefers-reduced-motion there; anchor targets carry tabindex="-1"
     so fragment navigation moves focus natively.
     ------------------------------------------------------------------ */
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = links
    .map(function (link) {
      return document.getElementById(link.hash.slice(1));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var inBand = new Set();

    var setCurrent = function (id) {
      links.forEach(function (link) {
        var active = link.hash.slice(1) === id;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            inBand.add(entry.target.id);
          } else {
            inBand.delete(entry.target.id);
          }
        });

        var current = "";
        for (var i = 0; i < sections.length; i++) {
          if (inBand.has(sections[i].id)) {
            current = sections[i].id;
            break;
          }
        }
        setCurrent(current);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* ------------------------------------------------------------------
     Intro chips (hero)
     Disclosure row: one panel open at a time; clicking the open chip
     closes it. Buttons carry aria-expanded + aria-controls; the panel
     height animates in CSS (grid-template-rows 0fr → 1fr).
     ------------------------------------------------------------------ */
  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-chip]"));

  function setChip(btn, open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (panel) {
      panel.classList.toggle("is-open", open);
    }
  }

  chips.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var wasOpen = btn.getAttribute("aria-expanded") === "true";
      chips.forEach(function (other) {
        setChip(other, false);
      });
      if (!wasOpen) {
        setChip(btn, true);
      }
    });
  });

  /* ------------------------------------------------------------------
     Footnote expanders ("dig deeper")
     Independent toggles: superscript marker button ↔ inline aside.
     ------------------------------------------------------------------ */
  var fnRefs = Array.prototype.slice.call(document.querySelectorAll("[data-fn]"));

  fnRefs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) {
        panel.classList.toggle("is-open", open);
      }
    });
  });

  /* ------------------------------------------------------------------
     Scroll reveals
     Adds .is-visible once as an element enters; reveal-once keeps the
     page calm on the way back up. No IO → everything visible.
     ------------------------------------------------------------------ */
  var revealables = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && revealables.length) {
    var revealer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    revealables.forEach(function (el) {
      revealer.observe(el);
    });
  } else {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
