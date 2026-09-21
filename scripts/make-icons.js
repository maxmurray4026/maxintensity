#!/usr/bin/env node
/* Renders the app icon set and the launch-screen padlock from the brand SVGs
   using the bundled Chromium (tests/node_modules/playwright). Run: npm run icons */
const { chromium } = require("../tests/node_modules/playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const ICON = path.join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset");
const SPLASH = path.join(ROOT, "ios/App/App/Assets.xcassets/Splash.imageset");
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const render = async (svgFile, w, h, out, bg) => {
    const page = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const svg = fs.readFileSync(svgFile, "utf8");
    await page.setContent(`<body style="margin:0;background:${bg || "#050505"};display:flex;align-items:center;justify-content:center;width:${w}px;height:${h}px;overflow:hidden">${svg}</body>`);
    await page.waitForTimeout(400);
    await page.screenshot({ path: out, type: "png" });
    await page.close();
  };
  fs.mkdirSync(ICON, { recursive: true }); fs.mkdirSync(SPLASH, { recursive: true });
  for (const f of fs.readdirSync(ICON)) if (f.endsWith(".png")) fs.unlinkSync(path.join(ICON, f));
  await render(path.join(ROOT, "assets/brand/max-intensity-icon-red.svg"), 1024, 1024, path.join(ICON, "AppIcon-1024.png"));
  fs.writeFileSync(path.join(ICON, "Contents.json"), JSON.stringify({ images: [{ filename: "AppIcon-1024.png", idiom: "universal", platform: "ios", size: "1024x1024" }], info: { author: "xcode", version: 1 } }, null, 2));
  // launch screen: the closed padlock, sized for 1x/2x/3x
  for (const f of fs.readdirSync(SPLASH)) if (f.endsWith(".png")) fs.unlinkSync(path.join(SPLASH, f));
  const sizes = [[1, 168, 210], [2, 336, 420], [3, 504, 630]];
  for (const [scale, w, h] of sizes) {
    const svg = fs.readFileSync(path.join(ROOT, "assets/brand/padlock.svg"), "utf8").replace('width="360" height="450"', `width="${w}" height="${h}"`);
    const page = await b.newPage({ viewport: { width: w, height: h } });
    await page.setContent(`<body style="margin:0;background:#050505;overflow:hidden">${svg}</body>`); await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SPLASH, `padlock@${scale}x.png`), type: "png" }); await page.close();
  }
  fs.writeFileSync(path.join(SPLASH, "Contents.json"), JSON.stringify({ images: sizes.map(([s]) => ({ idiom: "universal", filename: `padlock@${s}x.png`, scale: `${s}x` })), info: { author: "xcode", version: 1 } }, null, 2));
  // the site's own icons are left alone
  await b.close();
  console.log("icons:", fs.readdirSync(ICON).join(", "), "| splash:", fs.readdirSync(SPLASH).join(", "));
})();
