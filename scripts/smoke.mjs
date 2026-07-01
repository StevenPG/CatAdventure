/**
 * Browser smoke test: boots the game headless, starts level 1, cycles cats,
 * and fails on any page error or missing-asset 404.
 *
 * Usage:
 *   npm run dev            # in one terminal (or set SMOKE_URL)
 *   npm run smoke          # in another
 *
 * Requires a Chromium binary; set CHROMIUM_PATH if it isn't auto-found.
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'fs';

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/';
const CANDIDATES = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean);

const executablePath = CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('No Chromium found. Set CHROMIUM_PATH to a Chrome/Chromium binary.');
  process.exit(2);
}

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--use-gl=swiftshader'] });
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
});
page.on('response', (r) => {
  if (r.status() >= 400 && /assets\//.test(r.url())) problems.push(`${r.status()} ${r.url()}`);
});

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  const canvas = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return c ? { w: c.width, h: c.height } : null;
  });
  if (!canvas) problems.push('no canvas rendered');

  // Start level 1, run right, jump, attack, cycle through every cat.
  await page.keyboard.press('1');
  await page.waitForTimeout(900);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyJ');
  await page.keyboard.up('ArrowRight');
  for (let i = 0; i < 13; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(400);
} catch (err) {
  problems.push(`fatal: ${err.message}`);
}

await browser.close();
if (problems.length) {
  console.error('SMOKE FAILED:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('smoke OK — level loads, cats cycle, no errors, no asset 404s');
