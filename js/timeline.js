/* UX 2040 — timeline.js
   Scrollytelling mechanics for #timeline:
   - active-beat tracking (IntersectionObserver center band → .is-active)
   - spine fill (--tl-progress custom property, rAF-throttled)
   Reveals and footnote expanders are shared utilities in main.js. */

(function () {
  "use strict";

  var tl = document.getElementById("tl");
  if (!tl) return;

  var beats = Array.prototype.slice.call(tl.querySelectorAll("[data-beat]"));

  /* ------------------------------------------------------------------
     Active beat
     A band around the viewport's center decides which year is "now".
     First intersecting beat in document order wins; when the band is
     between beats, the last active year holds.
     ------------------------------------------------------------------ */
  if ("IntersectionObserver" in window && beats.length) {
    var inBand = new Set();

    var setActive = function (target) {
      beats.forEach(function (beat) {
        beat.classList.toggle("is-active", beat === target);
      });
    };

    var watcher = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            inBand.add(entry.target);
          } else {
            inBand.delete(entry.target);
          }
        });

        for (var i = 0; i < beats.length; i++) {
          if (inBand.has(beats[i])) {
            setActive(beats[i]);
            return;
          }
        }
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: 0 }
    );

    beats.forEach(function (beat) {
      watcher.observe(beat);
    });
  }

  /* ------------------------------------------------------------------
     Spine fill
     Maps how far the viewport's reading line has traveled through the
     timeline onto --tl-progress (0 → 1), consumed by .tl::after.
     Proportional to actual position — never eased or exaggerated.
     ------------------------------------------------------------------ */
  var ticking = false;

  function updateSpine() {
    ticking = false;
    var rect = tl.getBoundingClientRect();
    var line = window.innerHeight * 0.45; /* matches the observer band */
    var p = (line - rect.top) / rect.height;
    p = Math.min(1, Math.max(0, p));
    tl.style.setProperty("--tl-progress", p.toFixed(4));
  }

  function requestSpine() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateSpine);
    }
  }

  window.addEventListener("scroll", requestSpine, { passive: true });
  window.addEventListener("resize", requestSpine, { passive: true });
  updateSpine();
})();
