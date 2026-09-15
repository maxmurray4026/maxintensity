// Service worker: the shell is cached on install and served when the network is gone.
const { launch } = require('./harness');
(async () => {
  const h = await launch({ port: 8769, sw: true });
  const { page, ctx } = h;
  await page.goto('http://localhost:8769/tests/sw-page.html');
  await page.waitForFunction(() => window.swReg || window.swErr, null, { timeout: 10000 });
  console.log('registered:', await page.evaluate(() => window.swErr || 'ok'));
  await page.waitForFunction(async () => (await caches.keys()).includes('mi-shell-v6') && !!(await caches.match('/index.html')) && !!(await caches.match('/offline.html')), null, { timeout: 15000 });
  await page.waitForTimeout(800);
  const cached = await page.evaluate(() => caches.open('mi-shell-v6').then((c) => c.keys()).then((ks) => ks.map((r) => new URL(r.url).pathname)));
  console.log('cached shell:', cached.length, 'files —', cached.filter((p) => /index|offline|ui\.jsx|mi-ai|icon-192|manifest/.test(p)).join(' '));
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
  await ctx.setOffline(true);
  await page.goto('http://localhost:8769/nothing-here.html'); await page.waitForTimeout(300);
  console.log('offline unknown page →', (await page.innerText('h1')).replace(/\n/g, ' '));
  await page.goto('http://localhost:8769/index.html'); await page.waitForTimeout(500);
  console.log('offline index served from cache:', await page.title());
  await ctx.setOffline(false);
  await page.goto('http://localhost:8769/tests/sw-page.html'); await page.waitForTimeout(300);
  console.log('back online ok:', await page.title());
  await h.close();
})().catch((e) => { console.error('SW TEST FAILED:', e.message); process.exit(1); });
