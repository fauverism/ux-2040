# UX 2040

**Designed by machines. Directed by the few who saw it coming.**

A scrollytelling forecast of where UX/UI design goes by 2040 as AI takes the
production layer — written in first person by a designer-engineer who has
survived three platform deaths. Six timeline beats (2026 → 2040), a
choose-your-path fork into four futures, a small data dashboard, a survival
guide, and a sources apparatus.

Built with vanilla HTML/CSS/JS on the [Fauverism design system](https://robertfauver.com).
No framework, no build step, no npm. The one external dependency is Chart.js,
lazy-loaded from a pinned CDN when the data section nears the viewport.
The site was designed and built by directing AI — which is the argument, demonstrated.

**Live:** <https://fauverism.github.io/ux-2040/>
**Repo:** <https://github.com/fauverism/ux-2040>

## Run it locally

Any static server works. From this folder:

```sh
python3 -m http.server 4020
# → http://localhost:4020
```

(or `npx serve .` if you prefer Node.)

## Deploy

Already live on GitHub Pages (see above) — `main` deploys automatically on
every push. To change anything, edit, commit, and push:

```sh
git add -A && git commit -m "describe the change"
git push
```

**Mirroring elsewhere — Netlify:** go to <https://app.netlify.com/drop> and
drag this folder onto the page. Done.

**Standing up a fresh copy under a different repo:**

```sh
git init -b main && git add -A && git commit -m "UX 2040"
gh repo create <owner>/<repo> --public --source . --push
gh api "repos/<owner>/<repo>/pages" -X POST -f "source[branch]=main" -f "source[path]=/"
# → https://<owner>.github.io/<repo>/
```

If you fork or rename the repo, update the `og:image` / `twitter:image` /
canonical URLs in `index.html`'s `<head>` — social scrapers need an
**absolute** URL, and they currently point at `fauverism.github.io/ux-2040`.

## Where to edit things

| What | Where |
|---|---|
| All copy (hero, timeline beats, fork outcomes, humans, coda) | `index.html` — sections are marked by ids: `#hero #timeline #fork #data #humans #about` |
| Timeline stats & footnotes | each beat's `.tl-stat` figure and `.fn` aside in `index.html` |
| Chart data & colors | `js/charts.js` (the values mirror the visible `<details>` tables — keep both in sync) |
| S-curves / churn counters | inline SVG + counter markup in `index.html` (`#viz-curves`, `#churn`) |
| Design tokens (colors, type, spacing, motion) | `css/styles.css` §1–3 (vendored from the Fauverism Claude Design project) |
| Sources & citations | `#sources` list in `index.html`; footnotes link down to it |
| Research basis | `../UX-2040-ClaudeCode-Prompt-Playbook.md` — the Research Pack is the source of truth for every number |

**Debug hooks** (intentional): `window.UX2040_CHARTS` holds the three Chart.js
instances; dispatching `window.dispatchEvent(new Event("ux2040:init-charts"))`
force-loads the charts before scroll.

## Rules this site keeps

- Every statistic is cited or explicitly labeled as directional/illustrative —
  if a number and its label disagree, trust the label.
- WCAG AA contrast, keyboard operability, visible focus, reduced-motion
  fallbacks, and a data-table twin for every chart.
