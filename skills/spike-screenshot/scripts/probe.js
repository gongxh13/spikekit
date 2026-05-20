// Probe a page's DOM to discover good selectors for an element screenshot.
//
// When you want to screenshot ONE region of a page (an issue card, a chart, a
// table) you first need a selector that maps to it. This lists sizeable visible
// elements with their class, box, and a text snippet so you can pick the right one.
//
// Usage:
//   node probe.js <url|file.html> [keyword]
//
//   keyword (optional) filters to elements whose class OR text contains it —
//   e.g. `node probe.js https://site/issues/450 "背景描述"` to home in on the body.

const path = require('path');
const { chromium } = require('./_playwright');

(async () => {
  const src = process.argv[2];
  if (!src) {
    console.error('Usage: node probe.js <url|file.html> [keyword]');
    process.exit(1);
  }
  const keyword = process.argv[3] || '';
  const url = /^https?:\/\//.test(src) ? src : 'file://' + path.resolve(src);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  } catch {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  }
  await page.waitForTimeout(2500);

  const cands = await page.evaluate((kw) => {
    const out = [];
    const seen = new Set();
    document.querySelectorAll('*[class]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height < 60 || r.width < 80) return; // skip tiny elements
      const cls = el.className && el.className.toString ? el.className.toString() : '';
      const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
      if (kw && !(cls.includes(kw) || txt.includes(kw))) return;
      const key = cls + '|' + Math.round(r.top) + '|' + Math.round(r.height);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: cls.slice(0, 70),
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        txt: txt.slice(0, 60),
      });
    });
    return out.slice(0, 40);
  }, keyword);

  console.log('TITLE:', await page.title());
  console.log(JSON.stringify(cands, null, 1));
  await browser.close();
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
