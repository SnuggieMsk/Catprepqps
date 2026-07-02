# 🎯 CAT Prep Question Bank

A self-contained, static single-page study app for the **CAT (Common Admission Test)** — built around the **last 10 years of papers (2016–2025)**.

**Live page style:** year-wise sections (VARC · DILR · QA) with an interactive questions page — tap an option, get instant right/wrong feedback plus a fully worked solution, difficulty filters, CAT-style +3/−1 scoring, shuffle, reading mode, search, dark mode and progress tracking.

## Running

No build step. Serve the folder (or just open `index.html`):

```bash
npx http-server .
# or
python3 -m http.server
```

For **GitHub Pages**: Settings → Pages → deploy from branch → root. The app uses hash routing (`#/ch/253/questions`), so no server config is needed.

## Structure

| File | Purpose |
|---|---|
| `index.html` | Shell: topbar, sidebar, content area; loads all data files |
| `app.js` | Router, sidebar, quiz engine (parsing, scoring, filters, progress) |
| `style.css` | Theme (light/dark) and all component styles |
| `content.js` | Home-page exam guide |
| `data/cat20XX.js` | One file per CAT year: VARC, DILR and QA chapters (paper insights + question bank) |
| `data/FORMAT.md` | The authoring format for data files |

## Content note

Questions are **original re-creations** modeled on the publicly known pattern, topic mix and difficulty of each year's actual CAT paper — practice equivalents, not the official papers. Not affiliated with or endorsed by the IIMs.
