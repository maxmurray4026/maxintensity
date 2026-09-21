#!/usr/bin/env node
/* Builds the offline web bundle for the iOS app into www/ (Capacitor's webDir).
   The web app on the site is untouched: this copies it, vendors the CDN
   libraries (React, ReactDOM, Tailwind), precompiles the JSX with Babel so the
   phone never compiles at start-up, bundles the fonts, and keeps API calls
   pointed at the worker exactly as today. Run: npm run build:web */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "www");
const babel = require("@babel/standalone");

const rmrf = (p) => fs.rmSync(p, { recursive: true, force: true });
const mkdirp = (p) => fs.mkdirSync(p, { recursive: true });
const copy = (src, dst) => { mkdirp(path.dirname(dst)); fs.copyFileSync(src, dst); };
const copyDir = (src, dst, filter) => { for (const f of fs.readdirSync(src)) { const s = path.join(src, f), d = path.join(dst, f); if (fs.statSync(s).isDirectory()) copyDir(s, d, filter); else if (!filter || filter(s)) copy(s, d); } };
const compile = (code, name) => babel.transform(code, { presets: ["env", "react"], filename: name, compact: false, sourceMaps: false }).code;

rmrf(OUT); mkdirp(OUT);

// 1. static files and folders
["coach-knowledge.js", "mi-projection.js", "mi-ai.js", "rank-standards.js", "pricing.json", "native.js", "manifest.webmanifest", "offline.html", "404.html", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"].forEach((f) => { if (fs.existsSync(path.join(ROOT, f))) copy(path.join(ROOT, f), path.join(OUT, f)); });
copyDir(path.join(ROOT, "assets"), path.join(OUT, "assets"), (f) => !/CREDITS|README|\.py$/.test(f));

// 2. vendored libraries
const V = path.join(OUT, "vendor"); mkdirp(V);
copy(path.join(ROOT, "node_modules/react/umd/react.production.min.js"), path.join(V, "react.min.js"));
copy(path.join(ROOT, "node_modules/react-dom/umd/react-dom.production.min.js"), path.join(V, "react-dom.min.js"));
copy(path.join(ROOT, "node_modules/@tailwindcss/browser/dist/index.global.js"), path.join(V, "tailwind.js"));

// 3. the modules, precompiled
const APP = path.join(OUT, "app"); mkdirp(APP);
for (const f of fs.readdirSync(path.join(ROOT, "app"))) {
  if (!f.endsWith(".jsx")) continue;
  const code = compile(fs.readFileSync(path.join(ROOT, "app", f), "utf8"), f);
  fs.writeFileSync(path.join(APP, f.replace(/\.jsx$/, ".js")), code);
}

// 4. index.html: CDN scripts → vendor, JSX modules → compiled JS, the main script compiled inline, fonts local
let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
html = html
  .replace(/<script crossorigin src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/react\/[^"]+"><\/script>/, '<script src="vendor/react.min.js"></script>')
  .replace(/<script crossorigin src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/react-dom\/[^"]+"><\/script>/, '<script src="vendor/react-dom.min.js"></script>')
  .replace(/<script crossorigin src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/babel-standalone\/[^"]+"><\/script>\s*/, "")
  .replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, '<script src="vendor/tailwind.js"></script>')
  .replace(/<script type="text\/babel" data-presets="env,react" src="app\/([a-z]+)\.jsx"><\/script>/g, '<script src="app/$1.js"></script>')
  .replace(/@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);/, "@import url('assets/fonts/fonts.css');");
html = html.replace(/<script type="text\/babel" data-presets="env,react">([\s\S]*?)<\/script>/g, (m, code) => "<script>\n" + compile(code, "index.html") + "\n</script>");
if (/text\/babel/.test(html)) throw new Error("a babel script survived the rewrite");
html = html.replace("<title>Max Intensity</title>", "<title>Max Intensity</title>\n<meta name=\"mi-bundle\" content=\"ios\" />");
fs.writeFileSync(path.join(OUT, "index.html"), html);

const size = (d) => fs.readdirSync(d).reduce((t, f) => { const p = path.join(d, f); return t + (fs.statSync(p).isDirectory() ? size(p) : fs.statSync(p).size); }, 0);
console.log("www built:", (size(OUT) / 1e6).toFixed(1), "MB");
