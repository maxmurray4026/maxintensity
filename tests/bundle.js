// The iOS web bundle (www/) must run with no network at all: no CDN, no fonts, no worker.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'www');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
(async () => {
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) { console.log('BUNDLE: run npm run build:web first'); process.exit(1); }
  const srv = http.createServer((req, r) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(8790);
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', offline: false });
  let external = 0;
  await ctx.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith('http://localhost:8790')) return route.continue(); external++; return route.abort(); });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.addInitScript(() => { const set = (k, v) => localStorage.setItem('mi:' + k, JSON.stringify(v)); set('mi-settings', { done: true, name: 'Max', sex: 'Male', goal: 'Build muscle', daysPerWeek: 4, unit: 'kg', bw: '85' }); set('mi-tut', true); set('mi-pwseen', true); set('mi-a2hs-seen', true); });
  await page.goto('http://localhost:8790/index.html'); await page.waitForTimeout(2500);
  const txt = await page.innerText('body');
  console.log('bundle renders app:', /LET'S|WORK/.test(txt), '| tabs:', ['TODAY', 'TRAIN', 'MEALS', 'COACH', 'PROGRESS'].every((t) => txt.includes(t)), '| external requests blocked:', external, '| page errors:', errors.length ? errors : 'none');
  console.log('fonts local:', await page.evaluate(() => Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => f.family).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '(none loaded yet)'));
  console.log('no babel at runtime:', !(await page.evaluate(() => !!window.Babel)));
  await page.screenshot({ path: path.join(__dirname, 'shots', 'bundle-today.png') });
  await b.close(); srv.close();
  if (!/LET'S|WORK/.test(txt) || errors.length) process.exit(1);
})();
