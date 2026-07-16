/* UX 2040 — fork.js
   The "choose your 2040" selector:
   - four path cards (aria-pressed) → one outcome panel (shared .collapse)
   - deep link: #fork=<path>, restored on load, synced on hashchange
   - reversible: back button, Escape, or re-clicking the selected card
   - announces changes via the #fork-status live region */

(function () {
  "use strict";

  var section = document.getElementById("fork");
  if (!section) return;

  var cards = Array.prototype.slice.call(section.querySelectorAll("[data-path]"));
  var paths = document.getElementById("fork-paths");
  var status = document.getElementById("fork-status");
  var current = null;

  var HASH_RE = /^#fork=([a-z]+)$/;

  function cardFor(path) {
    return cards.filter(function (c) { return c.dataset.path === path; })[0] || null;
  }

  function outcomeFor(card) {
    return document.getElementById(card.getAttribute("aria-controls"));
  }

  function nameFor(card) {
    return card.querySelector(".path-name").textContent;
  }

  function announce(message) {
    if (status) status.textContent = message;
  }

  function setHash(fragment) {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", fragment);
    }
  }

  function apply(path) {
    cards.forEach(function (card) {
      var on = card.dataset.path === path;
      card.classList.toggle("is-selected", on);
      card.setAttribute("aria-pressed", on ? "true" : "false");
      outcomeFor(card).classList.toggle("is-open", on);
    });
    if (path) {
      paths.setAttribute("data-selected", path);
    } else {
      paths.removeAttribute("data-selected");
    }
    current = path;
  }

  function select(path, opts) {
    opts = opts || {};
    var card = cardFor(path);
    if (!card || current === path) return;
    apply(path);
    if (!opts.silentHash) setHash("#fork=" + path);
    announce(nameFor(card) + " selected. Your 2040 outcome is shown below.");
  }

  function clear(opts) {
    opts = opts || {};
    if (!current) return;
    var previous = cardFor(current);
    apply(null);
    if (!opts.silentHash) setHash("#fork");
    announce("Selection cleared. All four paths are shown.");
    if (opts.refocus && previous) previous.focus();
  }

  /* Cards: select, or re-click to step back out */
  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      if (current === card.dataset.path) {
        clear({ refocus: true });
      } else {
        select(card.dataset.path);
      }
    });
  });

  /* Back buttons inside each outcome */
  Array.prototype.slice.call(section.querySelectorAll("[data-fork-back]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      clear({ refocus: true });
    });
  });

  /* Escape anywhere in the section steps back out */
  section.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && current) {
      clear({ refocus: true });
    }
  });

  /* Deep link: restore on load, follow hash edits */
  function syncFromHash(isLoad) {
    var match = HASH_RE.exec(window.location.hash);
    if (match && cardFor(match[1])) {
      select(match[1], { silentHash: true });
      if (isLoad) {
        /* Jump, don't animate: a deep link should land instantly, and CSS
           scroll-behavior:smooth would otherwise animate the whole trip. */
        var root = document.documentElement;
        var prior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        section.scrollIntoView();
        root.style.scrollBehavior = prior;
      }
    } else if (!match && window.location.hash === "#fork") {
      /* plain #fork: navigation only — leave any selection alone */
    } else if (!match && current) {
      clear({ silentHash: true });
    }
  }

  window.addEventListener("hashchange", function () { syncFromHash(false); });
  syncFromHash(true);
})();
