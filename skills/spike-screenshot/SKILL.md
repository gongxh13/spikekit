---
name: spike-screenshot
description: >-
  Capture images and short videos with Playwright — three things: (1) screenshot a
  live web page or one specific element on it; (2) turn data into a clean figure
  image by rendering HTML/CSS then screenshotting it (directory trees, doc outlines,
  comparison tables, before/after cards — great for article and slide figures); (3)
  record a short screen video of a page or flow. Use this whenever the user wants to
  "screenshot this page", "capture that issue/PR/dashboard", "grab a picture of this
  element", "make a diagram/figure image from this data", "render this table/outline
  as an image", "turn this markdown into a picture for my doc", or "record a video /
  screen recording of" something — even if they don't say the word Playwright. Also
  reach for it when writing docs or articles and a section needs an illustrative
  screenshot or figure rather than a wall of text.
---

# Screenshot & figure capture (Playwright)

## What this is for

Two everyday needs that both come down to "produce a PNG (or short video) from
something rendered in a browser":

- **Capture what already exists on the web** — an issue page, a PR, a dashboard, a
  rendered doc. Sometimes the whole page, often just one card/section/chart.
- **Manufacture a clean figure from data** — you have a directory tree, a table, an
  outline, a before/after comparison, and you want a crisp image for an article or
  slide. Hand-drawing it is slow; instead render purpose-built HTML/CSS and
  screenshot it. This gives you full control over layout and looks far better than a
  raw terminal dump.

Both run through the same bundled scripts. Screen **recording** (a few-second
walkthrough) is the same idea with `record.js`.

## Prerequisites (check once)

Playwright + a browser must be installed:

```bash
command -v playwright && ls ~/Library/Caches/ms-playwright/ 2>/dev/null   # macOS
# If missing:
npm i -g playwright && playwright install chromium
```

The scripts resolve the `playwright` module themselves (global, Homebrew, or local
install all work) — just run them with plain `node`, no `NODE_PATH` needed. If
resolution ever fails the script prints exactly what it tried and how to install.

## Workflow A — screenshot a web page or element

For a quick whole-page or first-screen grab, the script is enough:

```bash
node scripts/capture.js --src "https://example.com/issues/450" --out issue.png --full-page
```

**To capture just one region** (the common case — you rarely want the whole noisy
page), you need a selector. Don't guess it; probe the DOM first:

```bash
node scripts/probe.js "https://example.com/issues/450" "背景描述"
```

`probe.js` lists sizeable visible elements with their class, box size, and a text
snippet. Pick the one whose text/size matches the region you want, then:

```bash
node scripts/capture.js --src "https://example.com/issues/450" \
  --out issue.png --selector ".comment-box-content" --scale 2
```

Notes that save round-trips:
- `--scale 2` renders at retina density — text stays sharp when embedded in docs.
  Drop to 1 only if file size matters more than crispness.
- Dynamic pages: the script waits for `networkidle` then an extra `--wait` (default
  2.5s). Bump `--wait` if content loads late.
- Anti-bot / login walls: if the screenshot comes back showing a "verify" or login
  page, the content is gated — tell the user rather than silently shipping the wall.
  (A logged-in capture needs a persistent profile / cookies, which is out of scope
  here unless the user provides them.)

## Workflow B — render data as a clean figure image

This is the high-value pattern for docs and articles. Steps:

1. Gather the real data first (read the files, run `grep`/`find`/`git show`). The
   figure must reflect reality, not a plausible-looking mock.
2. Write a small self-contained HTML file with inline `<style>`, designed for *this*
   data. There's deliberately no fixed template — a directory tree, a comparison
   table, and an outline each want a different layout, so design what fits. Wrap the
   figure in a single container element (e.g. a `.card` div) so you can screenshot
   just that, and keep it ~600–820px wide so text stays legible at 2x.
3. Screenshot just the container (not the surrounding page padding):

```bash
node scripts/capture.js --src figure.html --out figure.png --selector ".card"
```

Good figures to make this way: a project's directory tree with per-file notes; a
document's section outline (table of contents); a side-by-side / before-after
comparison; a metrics or feature comparison table. The point is a designed image,
not a screenshot of a terminal.

Style tips that tend to read well (suggestions, not rules): a white rounded card on
a light-gray page background; a dark header bar with a title + muted subtitle naming
the figure and its data source; a monospace block for trees/listings; two columns
when there are many short rows; small blue "pill" labels for tags. Adapt freely.

## Workflow C — record a short screen video

```bash
node scripts/record.js "https://example.com/page" ./recording 8
```

Records ~8 seconds while auto-scrolling through the page, into `./recording/*.webm`.
Playwright outputs WebM; convert if the user needs mp4/gif:

```bash
ffmpeg -i recording/<file>.webm out.mp4
ffmpeg -i recording/<file>.webm -vf "fps=10,scale=900:-1" out.gif
```

## After capturing

- Save outputs next to where they'll be referenced. If a Markdown file will embed
  the image with a relative path like `./figure.png`, the PNG must sit in the **same
  directory as that Markdown file** — scripts write relative to the current working
  directory, so move the file if needed.
- Verify the result by viewing the produced PNG before reporting done — a screenshot
  that captured the wrong element or an error page is worse than none.

## Files

- `scripts/capture.js` — screenshot a URL or local HTML; whole page, viewport, or
  one `--selector` element. Main entry point for Workflows A and B.
- `scripts/probe.js` — list candidate selectors for a page so you can target an
  element instead of guessing.
- `scripts/record.js` — record a short auto-scrolling video of a page.
- `scripts/_playwright.js` — shared module resolver (no need to call directly).
