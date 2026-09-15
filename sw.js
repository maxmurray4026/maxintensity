/* MAX INTENSITY — service worker.
   1. Offline shell: the page, its modules, the manifest, the icons and the
      anatomy plates are cached on install. Navigations and same-origin scripts
      are network-first (the app always loads fresh when it can) with the cache
      as the fallback; plates, icons and CDN scripts/fonts are cache-first once
      seen. With no network and no cached shell, offline.html is served.
   2. Notifications: web push (when the worker sends one), local alerts the page
      asks for via postMessage, and notification clicks that open the app at the
      URL the notification carries (e.g. ./?mini=1 for the two-set session). */
const VERSION = "mi-shell-v5";
const SHELL = [
  "./", "index.html", "offline.html", "manifest.webmanifest",
  "app/ui.jsx", "app/anatomy.jsx", "app/funnel.jsx", "app/recap.jsx", "app/community.jsx", "app/progress.jsx", "app/muscles.jsx", "app/calendar.jsx",
  "coach-knowledge.js", "mi-projection.js", "mi-ai.js", "rank-standards.js",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png",
];
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)\//;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))); // one missing file never blocks the install
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const put = async (req, res) => { try { if (res && (res.ok || res.type === "opaque")) { const c = await caches.open(VERSION); await c.put(req, res.clone()); } } catch (e) {} return res; };
const networkFirst = async (req, fallback) => {
  try { return await put(req, await fetch(req)); }
  catch (e) { return (await caches.match(req)) || (fallback ? await caches.match(fallback) : undefined) || Response.error(); }
};
const cacheFirst = async (req) => (await caches.match(req)) || put(req, await fetch(req).catch(() => Response.error()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // never cache the relay or API-style calls; everything else is the shell
    if (req.mode === "navigate") { e.respondWith(networkFirst(req, "offline.html")); return; }
    if (/\.(jpg|jpeg|png|webp|mp4|woff2?)$/i.test(url.pathname)) { e.respondWith(cacheFirst(req)); return; }
    e.respondWith(networkFirst(req));
    return;
  }
  if (CDN.test(req.url)) { e.respondWith(cacheFirst(req)); }
  // anything else (the AI worker, analytics) goes straight to the network
});

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: "Max Intensity", body: e.data ? e.data.text() : "" }; }
  const title = data.title || "Max Intensity";
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || "",
    tag: data.tag || "mi",
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: { url: data.url || "./" },
  }));
});

self.addEventListener("message", (e) => {
  const m = e.data || {};
  if (m.type === "notify") {
    self.registration.showNotification(m.title || "Max Intensity", { body: m.body || "", tag: m.tag || "mi", icon: "icon-192.png", badge: "icon-192.png", data: { url: m.url || "./" } });
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if ("focus" in c) { try { if ("navigate" in c && url !== "./") return c.navigate(new URL(url, self.registration.scope).href).then((w) => w && w.focus()); } catch (err) {} return c.focus(); }
    }
    return self.clients.openWindow(new URL(url, self.registration.scope).href);
  }));
});
