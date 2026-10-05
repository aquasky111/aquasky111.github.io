# Spring Tree

A GitHub Pages site where every page is a leaf. Oldest pages sit at the bottom of the tree, newest at the top.

## Setup
1. Push this repo to GitHub.
2. In **Settings > Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow tests, builds, and deploys.

## Add a page
Copy `content/_template.md` to `content/my-page.md`, fill in `title` and `date` (YYYY-MM-DD), push. Files starting with `_` and pages with `draft: true` are skipped. The build fails with a clear message if `title` or `date` is missing or invalid.

## Tune the tree
All sizing lives in `growth()` in `src/tree-layout.js`. Colors and motion are in `src/style.css`.

## Local preview
`npm install && npm run build && npx serve dist`
