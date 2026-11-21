// End-to-end smoke tests. Run against a built site:
//   npm run build && npm run preview &  (serves http://localhost:4173/Plans/)
//   npm run test:e2e
// Set CHROME_PATH to a Chrome/Chromium binary if it is not in the default location.
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://localhost:4173/Plans/';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const VIEWS = ['dashboard', 'planner', 'growth', 'profile', 'focus', 'journal', 'settings'];
const failures = [];
const check = (name, ok, detail = '') => { if (!ok) failures.push(`${name} ${detail}`); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${detail}`); };
const readState = page => page.evaluate(() => JSON.parse(localStorage.getItem('myLifeState') || '{}'));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'fa-IR' });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    for (const view of VIEWS) {
      await page.goto(`${BASE}#${view}`, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${view} no horizontal overflow @${width}`, overflow <= 0, `(${overflow}px)`);
    }
    check(`no uncaught errors @${width}`, errors.length === 0, errors.join('; ').slice(0, 200));
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'fa-IR' });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.goto(`${BASE}#planner`, { waitUntil: 'networkidle' });
  await page.fill('#task-input', 'Test task');
  await page.click('#task-form button[type=submit]');
  check('task added', await page.locator('.task-item').count() === 1);
  await page.click('.task-check');
  check('task completion gives 10 XP', (await readState(page)).xp === 10);

  const habitsBefore = await page.locator('.habit-item').count();
  await page.fill('#habit-input', 'Test habit');
  await page.click('#habit-form button');
  check('habit added', await page.locator('.habit-item').count() === habitsBefore + 1);
  await page.locator('.habit-row').last().locator('[data-action=habit-delete]').click();
  check('habit deleted', await page.locator('.habit-item').count() === habitsBefore);

  await page.goto(`${BASE}#settings`, { waitUntil: 'networkidle' });
  await page.fill('#plus-water-target', '10');
  await page.click('#plus-water-form button');
  check('water target saved', (await readState(page)).settings?.waterTarget === 10);
  await page.fill('#plus-water-target', '99');
  await page.click('#plus-water-form button');
  check('out-of-range water target rejected', (await readState(page)).settings?.waterTarget === 10);

  await page.goto(`${BASE}#profile`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { const st = JSON.parse(localStorage.getItem('myLifeState')); st.gems = 500; localStorage.setItem('myLifeState', JSON.stringify(st)); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('[data-profile-tab=shop]');
  await page.locator('[data-shop-item]').first().click();
  check('shop purchase deducts gems and equips', (await readState(page)).gems < 500 && (await readState(page)).profile?.unlocked?.length === 1);
  check('purchase shows celebration', await page.locator('.confetti-layer').count() === 1);
  await page.click('[data-profile-tab=character]');
  await page.locator('.look-stage-card .ml-avatar-stage').click();
  check('tapping character shows hearts', await page.locator('.av-heart').count() >= 1);
  await page.waitForTimeout(1300);
  await page.reload({ waitUntil: 'networkidle' });
  check('owned shop item persists', (await readState(page)).profile?.unlocked?.length === 1);

  await page.reload({ waitUntil: 'networkidle' });
  check('state persists across reload', (await readState(page)).settings?.waterTarget === 10);
  await page.close();
} finally {
  await browser.close();
}

if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nall checks passed');
