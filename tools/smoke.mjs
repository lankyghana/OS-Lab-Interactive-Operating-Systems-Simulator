import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/noop.js');
const { chromium } = require('playwright');
const file = 'file:///home/claude/os-lab/dist/os-lab-demo.html';
const out = '/home/claude/os-lab/tools/.tmp/shots';
const browser = await chromium.launch();
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('CONSOLE ' + m.text()));
const H = (h) => { const [p, q=''] = h.split('?'); const segs = p.split('/').filter(Boolean); const ps = new URLSearchParams(q); const m = segs[0]==='practice' ? ps.get('module') : segs[0]==='resources' ? ps.get('topic') : null; if (m) segs.push(m); return segs.join('--') || 'dashboard'; };
const go = async (h) => { await page.goto(file + '#' + H(h)); await page.waitForTimeout(250); };
const shot = (n) => page.screenshot({ path: `${out}/${n}.png`, fullPage: true });
const step = async (name, fn) => { try { await fn(); console.log('ok  ', name); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); } };

for (const r of ['/about', '/contribute', '/resources', '/', '/learn', '/learn/cpu-rr', '/learn/process-states', '/process', '/cpu', '/memory', '/paging', '/disk', '/practice', '/progress', '/sign-in', '/sign-up', '/nope']) {
  await step('route ' + r, async () => { await go(r); await shot(('r' + r).replace(/\//g, '_')); });
}

await step('cpu visual play', async () => {
  await go('/cpu');
  await page.selectOption('#cpu-algo', 'RR');
  await page.getByRole('button', { name: /^Start/ }).click();
  await page.getByRole('button', { name: '8×' }).click();
  await page.waitForTimeout(3200);
  await shot('cpu_visual_running');
  await page.locator('input[type=range]').fill('22');
  await page.waitForTimeout(200);
  await shot('cpu_visual_done');
});
await step('cpu text calc', async () => {
  await page.getByRole('tab', { name: /Calculator/ }).click();
  await page.selectOption('#cpu-algo', 'FCFS');
  await page.getByRole('button', { name: 'Calculate results' }).click();
  const txt = await page.textContent('main');
  if (!txt.includes('5.75') || !txt.includes('11.25')) throw new Error('FCFS averages missing');
  await shot('cpu_text');
});
await step('cpu compare', async () => { await page.getByRole('tab', { name: /Compare/ }).click(); await page.waitForTimeout(300); await shot('cpu_compare'); });
await step('cpu validation', async () => {
  await page.getByLabel('P1 burst time').fill('0');
  await page.waitForTimeout(100);
  if (!(await page.textContent('main')).includes('burst time must be')) throw new Error('no validation message');
});

await step('process sandbox', async () => {
  await go('/process');
  await page.getByRole('button', { name: 'Admit' }).first().click();
  await page.getByRole('button', { name: 'Dispatch' }).first().click();
  await page.getByRole('button', { name: 'I/O or event wait' }).first().click();
  await shot('process_sandbox');
});
await step('process auto', async () => {
  await page.getByRole('tab', { name: 'Auto scenario' }).click();
  await page.getByRole('button', { name: /^Start/ }).click();
  await page.getByRole('button', { name: '8×' }).click();
  await page.waitForTimeout(2500);
  await shot('process_auto');
});
await step('process console', async () => {
  await page.getByRole('tab', { name: /Command console/ }).click();
  const box = page.getByLabel('Command');
  for (const c of ['help', 'create editor 1', 'admit editor', 'dispatch editor', 'dispatch 2', 'ps']) { await box.fill(c); await box.press('Enter'); }
  const t = await page.textContent('main');
  if (!t.includes('only valid from READY') && !t.includes('CPU is busy')) throw new Error('expected an error message for invalid dispatch');
  await shot('process_console');
});

await step('memory', async () => {
  await go('/memory');
  await page.getByRole('button', { name: /^Start/ }).click();
  await page.getByRole('button', { name: '8×' }).click();
  await page.waitForTimeout(1500); await shot('memory_visual');
  await page.getByRole('tab', { name: /Calculator/ }).click();
  await page.getByRole('button', { name: 'Calculate allocation' }).click(); await shot('memory_text');
  await page.getByRole('tab', { name: /Compare/ }).click(); await shot('memory_compare');
});
await step('paging', async () => {
  await go('/paging');
  await page.getByRole('button', { name: 'Next reference' }).click();
  await page.getByRole('button', { name: 'Next reference' }).click();
  await page.locator('input[type=range]').fill('9');
  await shot('paging_visual');
  await page.getByRole('tab', { name: /Calculator/ }).click();
  await page.getByRole('button', { name: 'Calculate page faults' }).click();
  await page.getByRole('tab', { name: /Compare/ }).click();
  await page.getByRole('button', { name: 'Belady’s anomaly' }).click();
  await page.waitForTimeout(200);
  if (!(await page.textContent('main')).includes('Belady’s anomaly detected')) throw new Error('belady not detected');
  await shot('paging_compare');
});
await step('disk', async () => {
  await go('/disk');
  await page.selectOption('#dk-algo', 'C_SCAN');
  await page.getByRole('button', { name: /^Start/ }).click();
  await page.getByRole('button', { name: '8×' }).click();
  await page.waitForTimeout(1600); await shot('disk_visual');
  await page.getByRole('tab', { name: /Calculator/ }).click();
  await page.getByRole('button', { name: 'Calculate head movement' }).click();
  if (!(await page.textContent('main')).includes('382')) throw new Error('C-SCAN total missing');
  await shot('disk_text');
  await page.getByRole('tab', { name: /Compare/ }).click(); await shot('disk_compare');
});
await step('learn -> simulator preset + mark read', async () => {
  await go('/learn/paging-lru');
  await page.getByRole('button', { name: 'Mark as read' }).click();
  await page.getByRole('button', { name: /Open this example/ }).click();
  await page.waitForTimeout(300);
  if ((await page.inputValue('#pg-algo')) !== 'LRU') throw new Error('preset not applied');
});
await step('practice exercise + quiz', async () => {
  await go('/practice?module=disk');
  await page.getByRole('button', { name: /Show worked solution/ }).click();
  await page.getByRole('button', { name: 'Check answers' }).click();
  await shot('practice_ex');
  await page.getByRole('tab', { name: 'Quizzes' }).click();
  for (let i = 0; i < 6; i++) {
    await page.locator('main').getByRole('radio').first().click();
    await page.getByRole('button', { name: /Next question|Finish quiz/ }).click();
  }
  await shot('practice_quiz_done');
});
await step('dashboard after activity', async () => { await go('/'); await shot('dashboard_after'); await go('/progress'); await shot('progress_after'); });

const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
m.on('pageerror', (e) => errors.push('PAGEERROR(m) ' + e.message));
for (const r of ['/', '/cpu', '/disk', '/process']) { await m.goto(file + '#' + H(r)); await m.waitForTimeout(300); await m.screenshot({ path: `${out}/m${r.replace(/\//g, '_')}.png`, fullPage: true }); }
await step('mobile drawer', async () => { await m.getByLabel('Open navigation').click(); await m.waitForTimeout(300); await m.screenshot({ path: `${out}/m_drawer.png` }); });
// horizontal overflow check
for (const r of ['/', '/cpu', '/memory', '/paging', '/disk', '/process', '/practice', '/learn/cpu-fcfs', '/about', '/contribute', '/resources']) {
  await m.goto(file + '#' + H(r)); await m.waitForTimeout(250);
  const w = await m.evaluate(() => document.documentElement.scrollWidth);
  if (w > 392) console.log('OVERFLOW', r, w);
}
console.log('ERRORS:', errors.length); errors.slice(0, 15).forEach((e) => console.log(' ', e));
await browser.close();

// ── Gallery hover / focus reveal ──
{
  const b2 = await chromium.launch();
  const g = await b2.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = [];
  g.on('pageerror', (e) => errs.push(e.message));
  await g.goto(file + '#dashboard');
  await g.waitForTimeout(300);
  await g.screenshot({ path: `${out}/g_dashboard_idle.png` });
  const card = g.getByRole('article').first();
  const overlay = card.locator('div.absolute.inset-0').nth(1);
  console.log('idle opacity', await overlay.evaluate((e) => getComputedStyle(e).opacity));
  await card.hover();
  await g.waitForTimeout(400);
  console.log('hover opacity', await overlay.evaluate((e) => getComputedStyle(e).opacity), 'transition', await overlay.evaluate((e) => getComputedStyle(e).transitionDuration + ' ' + getComputedStyle(e).transitionTimingFunction));
  await g.screenshot({ path: `${out}/g_dashboard_hover.png` });
  await g.mouse.move(5, 5);
  await g.waitForTimeout(400);
  console.log('after leave', await overlay.evaluate((e) => getComputedStyle(e).opacity));
  // keyboard: tab to a card
  await g.keyboard.press('Tab');
  for (let i = 0; i < 25; i++) { const role = await g.evaluate(() => document.activeElement?.getAttribute('role')); if (role === 'article') break; await g.keyboard.press('Tab'); }
  await g.waitForTimeout(400);
  console.log('focused article', await g.evaluate(() => document.activeElement?.getAttribute('aria-label')?.slice(0, 40)));
  await g.screenshot({ path: `${out}/g_dashboard_focus.png` });
  await g.keyboard.press('Enter');
  await g.waitForTimeout(300);
  console.log('after Enter hash', await g.evaluate(() => location.hash));
  // View button click
  await g.goto(file + '#learn');
  await g.waitForTimeout(300);
  const c2 = g.getByRole('article').nth(1);
  await c2.hover(); await g.waitForTimeout(300);
  await g.screenshot({ path: `${out}/g_learn_hover.png`, fullPage: false });
  await c2.getByRole('button', { name: 'Read' }).click();
  await g.waitForTimeout(300);
  console.log('after Read hash', await g.evaluate(() => location.hash));
  await g.screenshot({ path: `${out}/g_topic.png` });
  // reduced motion: no translate
  const rm = await b2.newPage({ viewport: { width: 1200, height: 900 }, reducedMotion: 'reduce' });
  await rm.goto(file + '#dashboard'); await rm.waitForTimeout(300);
  console.log('reduced-motion transform', await rm.getByRole('article').first().locator('div.absolute.inset-0').nth(1).evaluate((e) => getComputedStyle(e).transform));
  console.log('gallery errors', errs.length);
  await b2.close();
}

// ── Theme switching ──
{
  const b3 = await chromium.launch();
  const ctx = await b3.newContext({ viewport: { width: 1440, height: 1000 } });
  const t = await ctx.newPage();
  const errs = [];
  t.on('pageerror', (e) => errs.push(e.message));
  await t.goto(file + '#dashboard'); await t.waitForTimeout(300);
  console.log('default theme', await t.evaluate(() => document.documentElement.dataset.theme));
  await t.screenshot({ path: `${out}/t_dash_light.png` });
  await t.getByRole('radio', { name: 'Dark' }).first().click();
  await t.waitForTimeout(350);
  console.log('after Dark', await t.evaluate(() => document.documentElement.dataset.theme), await t.evaluate(() => getComputedStyle(document.body).backgroundColor));
  await t.screenshot({ path: `${out}/t_dash_dark.png` });
  await t.reload(); await t.waitForTimeout(300);
  console.log('persisted', await t.evaluate(() => document.documentElement.dataset.theme));
  for (const [h, n] of [['cpu', 'cpu'], ['process', 'process'], ['learn', 'learn']]) {
    for (const mode of ['Light', 'Dark']) {
      await t.goto(file + '#' + h); await t.waitForTimeout(250);
      await t.getByRole('radio', { name: mode }).first().click(); await t.waitForTimeout(250);
      if (h === 'cpu') { await t.getByRole('button', { name: /^(Start|Replay)/ }).click(); await t.waitForTimeout(2200); }
      await t.screenshot({ path: `${out}/t_${n}_${mode.toLowerCase()}.png` });
    }
  }
  // System follows the OS
  await t.getByRole('radio', { name: 'System' }).first().click();
  await t.emulateMedia({ colorScheme: 'dark' }); await t.waitForTimeout(200);
  console.log('system+os dark', await t.evaluate(() => document.documentElement.dataset.theme));
  await t.emulateMedia({ colorScheme: 'light' }); await t.waitForTimeout(200);
  console.log('system+os light', await t.evaluate(() => document.documentElement.dataset.theme));
  console.log('theme errors', errs.length);
  await b3.close();
}

// ── Resources ──
{
  const b4 = await chromium.launch();
  const r = await b4.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = [];
  r.on('pageerror', (e) => errs.push(e.message));
  await r.goto(file + '#resources'); await r.waitForTimeout(300);
  const count = async () => (await r.locator('[aria-live="polite"] span').first().textContent());
  console.log('all:', await count());
  await r.screenshot({ path: `${out}/res_light.png`, fullPage: true });
  await r.getByRole('tab', { name: 'Videos' }).click(); console.log('videos:', await count());
  await r.getByRole('tab', { name: 'All' }).click();
  await r.getByLabel('Search resources').fill('semaphore'); await r.waitForTimeout(100); console.log('search semaphore:', await count());
  await r.getByRole('button', { name: 'Clear filters' }).click();
  await r.getByLabel('Free only').check(); console.log('free only:', await count());
  await r.getByLabel('Free only').uncheck();
  // save + done on first library row
  const row = r.locator('main ul.divide-y > li').first();
  await row.getByRole('button', { name: 'Save' }).click();
  await row.getByRole('button', { name: 'Mark done' }).click();
  await r.getByLabel('Saved').check(); console.log('saved filter:', await count());
  await r.getByLabel('Saved').uncheck();
  // external links open in new tab
  console.log('ext links target', await r.locator('main a[href^="https://"]').first().getAttribute('target'));
  // deep link from Learn
  await r.goto(file + '#learn--disk-scan'); await r.waitForTimeout(300);
  console.log('further reading items', await r.locator('section[aria-labelledby="further-h"] li').count());
  await r.screenshot({ path: `${out}/res_learn_further.png`, fullPage: true });
  await r.getByRole('link', { name: /More disk resources/ }).click(); await r.waitForTimeout(300);
  console.log('deep link hash', await r.evaluate(() => location.hash), 'topic', await r.getByLabel('Topic', { exact: true }).inputValue(), await count());
  await r.goto(file + '#progress'); await r.waitForTimeout(300);
  console.log('progress shows saved', (await r.textContent('main')).includes('Operating Systems: Three Easy Pieces') || (await r.textContent('main')).includes('Done'));
  await r.goto(file + '#resources'); await r.waitForTimeout(200);
  await r.getByRole('radio', { name: 'Dark' }).first().click(); await r.waitForTimeout(250);
  await r.screenshot({ path: `${out}/res_dark.png` });
  const m = await b4.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(file + '#resources'); await m.waitForTimeout(300);
  console.log('mobile width', await m.evaluate(() => document.documentElement.scrollWidth));
  await m.screenshot({ path: `${out}/res_mobile.png`, fullPage: true });
  console.log('resource errors', errs.length);
  await b4.close();
}

// ── About / Contribute ──
{
  const b5 = await chromium.launch();
  const ctx = await b5.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const a = await ctx.newPage();
  const errs = [];
  a.on('pageerror', (e) => errs.push(e.message));
  await a.goto(file + '#about'); await a.waitForTimeout(300);
  console.log('about h1/name', await a.locator('h1').first().textContent(), '|', await a.locator('#dev-h').textContent());
  console.log('linkedin link', await a.getByRole('link', { name: 'LinkedIn' }).getAttribute('href'));
  await a.screenshot({ path: `${out}/about_light.png`, fullPage: true });
  await a.getByRole('link', { name: /How to contribute/ }).click(); await a.waitForTimeout(300);
  console.log('to contribute', await a.evaluate(() => location.hash));
  await a.screenshot({ path: `${out}/contribute_light.png`, fullPage: true });
  // in-page nav keeps the route
  await a.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Add an algorithm' }).click(); await a.waitForTimeout(700);
  console.log('after jump hash', await a.evaluate(() => location.hash), 'scrollY>0', (await a.evaluate(() => window.scrollY)) > 0);
  await a.locator('#walkthrough').getByRole('button', { name: 'Copy code' }).first().click(); await a.waitForTimeout(150);
  console.log('copied', (await a.evaluate(() => navigator.clipboard.readText())).slice(0, 40));
  await a.getByRole('radio', { name: 'Dark' }).first().click(); await a.waitForTimeout(250);
  await a.screenshot({ path: `${out}/contribute_dark.png` });
  await a.goto(file + '#about'); await a.waitForTimeout(250);
  await a.screenshot({ path: `${out}/about_dark.png` });
  const m = await b5.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(file + '#contribute'); await m.waitForTimeout(300);
  await m.screenshot({ path: `${out}/contribute_mobile.png`, fullPage: true });
  console.log('about/contribute errors', errs.length);
  await b5.close();
}
