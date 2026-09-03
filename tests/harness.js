// Offline harness: serves the repo, intercepts CDN scripts with local copies.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.env.MI_ROOT || path.join(__dirname, '..');
const V = path.join(__dirname, 'node_modules');
const MIME = { '.html':'text/html', '.js':'application/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.json':'application/json', '.webp':'image/webp', '.md':'text/plain', '.txt':'text/plain', '.css':'text/css' };
function serve(port) {
  return new Promise((res) => {
    const srv = http.createServer((req, r) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(ROOT, p);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    });
    srv.listen(port, () => res(srv));
  });
}
async function launch(opts = {}) {
  const srv = await serve(opts.port || 8765);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  await ctx.route('**/*', async (route) => {
    const url = route.request().url();
    const local = (f, ct) => route.fulfill({ status: 200, contentType: ct || 'application/javascript', body: fs.readFileSync(f) });
    if (url.includes('react-dom.production.min.js')) return local(V + '/react-dom/umd/react-dom.production.min.js');
    if (url.includes('react.production.min.js')) return local(V + '/react/umd/react.production.min.js');
    if (url.includes('babel.min.js')) return local(V + '/@babel/standalone/babel.min.js');
    if (url.includes('cdn.tailwindcss.com')) return local(V + '/@tailwindcss/browser/dist/index.global.js');
    if (url.startsWith('https://maxintensity-ai') && opts.worker) return opts.worker(route);
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.continue();
    return route.abort();
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push('console: ' + m.text()); });
  return { browser, ctx, page, srv, close: async () => { await browser.close(); srv.close(); } };
}
module.exports = { launch };
