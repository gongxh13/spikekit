// Robustly resolve the `playwright` module no matter where it's installed.
//
// Why this exists: a globally-installed playwright (e.g. via Homebrew at
// /opt/homebrew/lib/node_modules) is often NOT on the default require path, and
// `npm root -g` may point somewhere else entirely. Rather than make every caller
// fiddle with NODE_PATH, we probe the common locations here so the capture
// scripts can just `require('./_playwright')` and run with a plain `node`.

const { execSync } = require('child_process');
const path = require('path');

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

function loadPlaywright() {
  const candidates = [];
  if (process.env.PLAYWRIGHT_MODULE) candidates.push(process.env.PLAYWRIGHT_MODULE);
  candidates.push('playwright'); // local node_modules or NODE_PATH

  const npmRoot = sh('npm root -g');
  if (npmRoot) candidates.push(path.join(npmRoot, 'playwright'));

  // Resolve the `playwright` CLI symlink back to its real install dir.
  const cli = sh('readlink -f "$(command -v playwright)" 2>/dev/null');
  if (cli) candidates.push(path.dirname(cli));

  candidates.push(
    '/opt/homebrew/lib/node_modules/playwright',
    '/usr/local/lib/node_modules/playwright',
  );

  const tried = [];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      tried.push(c);
    }
  }

  console.error('[playwright] module not found. Tried:\n  ' + tried.join('\n  '));
  console.error('Install with:  npm i -g playwright && playwright install chromium');
  process.exit(2);
}

module.exports = loadPlaywright();
