// Screenshot a web page or a local HTML file — optionally just one element.
//
// Usage:
//   node capture.js --src <url|file.html> --out shot.png [options]
//
// Options:
//   --src        URL (http/https) or local HTML file path                  (required)
//   --out        output PNG path                                  (default screenshot.png)
//   --selector   CSS selector — screenshot only this element (first match)
//   --full-page  capture the entire scrollable page (ignored if --selector)
//   --scale      deviceScaleFactor; 2 = retina/crisp                        (default 2)
//   --width      viewport width                                            (default 1280)
//   --height     viewport height                                           (default 900)
//   --wait       extra ms to wait after load (for late-rendered content)   (default 2500)

const path = require('path');
const { chromium } = require('./_playwright');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v; // bare flag vs value
}

(async () => {
  const src = arg('src');
  if (!src) {
    console.error('ERR: --src <url|file.html> is required');
    process.exit(1);
  }
  const out = arg('out', 'screenshot.png');
  const selector = arg('selector', null);
  const fullPage = arg('full-page', false) === true || arg('full-page', '') === 'true';
  const scale = parseFloat(arg('scale', '2'));
  const width = parseInt(arg('width', '1280'), 10);
  const height = parseInt(arg('height', '900'), 10);
  const wait = parseInt(arg('wait', '2500'), 10);

  const url = /^https?:\/\//.test(src) ? src : 'file://' + path.resolve(src);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });

  // networkidle is best for dynamic pages; fall back to load if it times out.
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  } catch {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  }
  await page.waitForTimeout(wait);

  if (selector) {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    const box = await el.boundingBox();
    if (!box) {
      console.error(`ERR: selector "${selector}" matched nothing visible. Run probe.js to find a valid selector.`);
      await browser.close();
      process.exit(1);
    }
    await el.screenshot({ path: out });
    console.log(`saved ${out}  (element ${selector}: ${Math.round(box.width)}x${Math.round(box.height)})`);
  } else {
    await page.screenshot({ path: out, fullPage });
    console.log(`saved ${out}  (${fullPage ? 'full page' : 'viewport'})`);
  }

  await browser.close();
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
