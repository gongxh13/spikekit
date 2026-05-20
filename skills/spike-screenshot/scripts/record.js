// Record a short screen video of a page (auto-scrolls to show the whole thing).
//
// Playwright records WebM. For a few-second walkthrough of a page or a rendered
// HTML figure this is enough; convert to mp4/gif with ffmpeg if you need that.
//
// Usage:
//   node record.js <url|file.html> [outDir] [seconds]
//
//   outDir   directory to write the video into        (default ./recording)
//   seconds  rough length; the page auto-scrolls over this time   (default 8)
//
// Convert afterwards if needed:
//   ffmpeg -i recording/<hash>.webm out.mp4
//   ffmpeg -i recording/<hash>.webm -vf "fps=10,scale=900:-1" out.gif

const path = require('path');
const { chromium } = require('./_playwright');

(async () => {
  const src = process.argv[2];
  if (!src) {
    console.error('Usage: node record.js <url|file.html> [outDir] [seconds]');
    process.exit(1);
  }
  const outDir = process.argv[3] || './recording';
  const seconds = parseInt(process.argv[4] || '8', 10);
  const url = /^https?:\/\//.test(src) ? src : 'file://' + path.resolve(src);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: outDir, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  } catch {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  }

  // Auto-scroll through the page across the requested duration so the recording
  // shows the whole content rather than a static first screen.
  for (let i = 0; i < seconds; i++) {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.8)));
    await page.waitForTimeout(1000);
  }

  await context.close(); // finalizes and flushes the video file
  await browser.close();
  console.log(`saved video (.webm) under ${outDir}`);
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
