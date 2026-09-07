/* MAX INTENSITY — service worker. Notifications only; no offline caching of
   the app shell (the app is a single page that must always load fresh).
   Handles: web push (when the worker sends one), notification clicks, and
   local alerts the page asks for via postMessage. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: "Max Intensity", body: e.data ? e.data.text() : "" }; }
  const title = data.title || "Max Intensity";
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || "",
    tag: data.tag || "mi",
    icon: "apple-touch-icon.png",
    badge: "apple-touch-icon.png",
    data: { url: data.url || "./" },
  }));
});

self.addEventListener("message", (e) => {
  const m = e.data || {};
  if (m.type === "notify") {
    self.registration.showNotification(m.title || "Max Intensity", { body: m.body || "", tag: m.tag || "mi", icon: "apple-touch-icon.png", badge: "apple-touch-icon.png", data: { url: "./" } });
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
