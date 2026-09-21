/* ===========================================================================
   MAX INTENSITY — NATIVE BRIDGE (iOS via Capacitor)
   ---------------------------------------------------------------------------
   A no-op on the web. Inside the iOS app (window.Capacitor present) it exposes
   window.MI_NATIVE, which the web app checks at a handful of points:
     push.enable(handle)   APNs registration → POST /push/register on the worker
     reminders(list)       local notifications (streak at risk, "not going gym today?")
     notifyNow(n)          an immediate local notification
     haptic(kind)          unlock, pr, rankup, set
     share(blob, name)     the iOS share sheet for the before/after and the recap card
     apple.signIn()        Sign in with Apple
     store.*               StoreKit 2 (products, purchase, restore, current)
     health.*              HealthKit, feature-flagged off (HEALTHKIT_ENABLED)
   Nothing here changes what the app does on the web. Classic script.
   =========================================================================== */
(function () {
  "use strict";
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;

  var HEALTHKIT_ENABLED = false; // wire later: flip on, add the HealthKit capability + plugin (see docs/ios-ship.md)
  var P = function (name) { try { return Cap.registerPlugin(name); } catch (e) { return null; } };
  var Push = P("PushNotifications"), Local = P("LocalNotifications"), Haptics = P("Haptics"), Share = P("Share"), FS = P("Filesystem"),
      StatusBar = P("StatusBar"), Splash = P("SplashScreen"), App = P("App"), Apple = P("SignInWithApple"), Store = P("MIStore");
  var N = window.MI_NATIVE = { platform: Cap.getPlatform ? Cap.getPlatform() : "ios", ready: false };

  /* ---- shell: status bar, safe areas, no bounce, the padlock hand-off ---- */
  document.documentElement.classList.add("native");
  try { StatusBar && StatusBar.setStyle({ style: "DARK" }); StatusBar && StatusBar.setBackgroundColor && StatusBar.setBackgroundColor({ color: "#050505" }); } catch (e) {}
  var hideSplash = function () { try { Splash && Splash.hide({ fadeOutDuration: 150 }); } catch (e) {} };
  window.addEventListener("load", function () { setTimeout(hideSplash, 120); });
  setTimeout(hideSplash, 4000);
  // the web padlock opens via MI_unlock; a haptic goes with it
  var origUnlock = window.MI_unlock;
  window.MI_unlock = function () { N.haptic("unlock"); origUnlock && origUnlock(); };

  /* ---- haptics ---- */
  N.haptic = function (kind) {
    if (!Haptics) return;
    try {
      if (kind === "unlock") { Haptics.impact({ style: "MEDIUM" }); setTimeout(function () { Haptics.impact({ style: "LIGHT" }); }, 90); }
      else if (kind === "pr") { Haptics.notification({ type: "SUCCESS" }); }
      else if (kind === "rankup") { Haptics.impact({ style: "HEAVY" }); setTimeout(function () { Haptics.notification({ type: "SUCCESS" }); }, 140); }
      else if (kind === "set") { Haptics.impact({ style: "LIGHT" }); }
      else if (kind === "reveal" || kind === "ignite") { Haptics.impact({ style: "MEDIUM" }); }
    } catch (e) {}
  };
  // sounds carry a haptic with them
  var hookSound = function () {
    if (!window.MI || !window.MI.sound || window.MI.sound.__native) return setTimeout(hookSound, 100);
    var orig = window.MI.sound;
    window.MI.sound = function (kind) { N.haptic(kind); return orig(kind); };
    window.MI.sound.__native = true;
  };
  hookSound();

  /* ---- push (APNs) + local reminders ---- */
  var worker = function (path, body) {
    var url = (window.MI_SERVER || "") + path;
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-mi-app": window.MI_APP_TOKEN || "" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }).catch(function () { return null; });
  };
  var pushToken = null, pushHandle = "";
  if (Push) {
    Push.addListener("registration", function (t) { pushToken = t.value; worker("/push/register", { token: t.value, platform: "ios", handle: pushHandle, bundle: "com.maxintensity.app" }); });
    Push.addListener("registrationError", function () {});
    Push.addListener("pushNotificationActionPerformed", function (a) { var url = a && a.notification && a.notification.data && a.notification.data.url; if (url && /mini=1/.test(url)) { try { window.MI_nudge && window.MI_nudge.openMini(); } catch (e) {} } });
  }
  if (Local) {
    Local.addListener("localNotificationActionPerformed", function (a) { var url = a && a.notification && a.notification.extra && a.notification.extra.url; if (url && /mini=1/.test(url)) { try { window.MI_nudge && window.MI_nudge.openMini(); } catch (e) {} } });
  }
  N.push = {
    enable: async function (handle) {
      pushHandle = handle || "";
      if (!Push) return false;
      var perm = await Push.checkPermissions();
      if (perm.receive !== "granted") perm = await Push.requestPermissions();
      if (perm.receive !== "granted") return false;
      await Push.register();
      if (Local) { try { await Local.requestPermissions(); } catch (e) {} }
      return true;
    },
    token: function () { return pushToken; },
  };
  /* reminders: [{ id, title, body, at: Date|ms, url }] — replaces everything scheduled before */
  N.reminders = async function (list) {
    if (!Local) return;
    try {
      var pending = await Local.getPending();
      if (pending && pending.notifications && pending.notifications.length) await Local.cancel({ notifications: pending.notifications.map(function (n) { return { id: n.id }; }) });
      var now = Date.now();
      var notes = (list || []).filter(function (r) { return new Date(r.at).getTime() > now; }).map(function (r) {
        return { id: r.id, title: r.title, body: r.body, schedule: { at: new Date(r.at) }, sound: "default", extra: { url: r.url || "./" }, threadIdentifier: "mi" };
      });
      if (notes.length) await Local.schedule({ notifications: notes });
    } catch (e) {}
  };
  N.notifyNow = async function (n) {
    if (!Local) return false;
    try { await Local.schedule({ notifications: [{ id: Math.floor(Math.random() * 1e6), title: n.title, body: n.body, schedule: { at: new Date(Date.now() + 500) }, sound: "default", extra: { url: n.url || "./" } }] }); return true; } catch (e) { return false; }
  };

  /* ---- share sheet ---- */
  N.share = async function (blob, filename, text) {
    if (!Share || !FS) return false;
    var dataUrl = await new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(blob); });
    var w = await FS.writeFile({ path: filename, data: String(dataUrl).split(",")[1], directory: "CACHE" });
    await Share.share({ title: "Max Intensity", text: text || "", files: [w.uri], dialogTitle: "Share" });
    return true;
  };

  /* ---- Sign in with Apple ---- */
  N.apple = {
    available: !!Apple,
    signIn: async function () {
      if (!Apple) throw new Error("Sign in with Apple is not available");
      var r = await Apple.authorize({ clientId: "com.maxintensity.app", redirectURI: "https://maxintensity.app/", scopes: "email name", state: String(Date.now()) });
      var u = (r && r.response) || {};
      return { user: u.user || "", email: u.email || "", name: [u.givenName, u.familyName].filter(Boolean).join(" "), identityToken: u.identityToken || "" };
    },
  };

  /* ---- StoreKit 2 (local plugin MIStore, ios/App/App/MIStorePlugin.swift) ---- */
  var cfg = window.MI_PRICING || {};
  var IDS = (cfg.ios && cfg.ios.products) || { weekly: "com.maxintensity.app.weekly", monthly: "com.maxintensity.app.monthly", yearly: "com.maxintensity.app.yearly" };
  N.store = {
    available: !!Store,
    ids: IDS,
    products: async function () {
      if (!Store) return [];
      var r = await Store.getProducts({ ids: Object.values(IDS) });
      var plans = Object.keys(IDS);
      return (r.products || []).map(function (p) { var plan = plans.find(function (k) { return IDS[k] === p.id; }) || p.id; return Object.assign({ plan: plan }, p); });
    },
    purchase: async function (plan) { if (!Store) throw new Error("Store unavailable"); var r = await Store.purchase({ id: IDS[plan] || plan }); if (r && r.ok) N.store._sync(r); return r; },
    restore: async function () { if (!Store) throw new Error("Store unavailable"); var r = await Store.restore(); if (r && r.ok) N.store._sync(r); return r; },
    current: async function () { if (!Store) return { ok: false }; return Store.current(); },
    _sync: function (r) { worker("/iap/verify", { jws: r.jws, productId: r.productId, originalTransactionId: r.originalTransactionId, expires: r.expires, handle: pushHandle }); },
  };

  /* ---- HealthKit (flag off; steps + workouts read only when wired) ---- */
  N.health = {
    enabled: HEALTHKIT_ENABLED,
    available: HEALTHKIT_ENABLED && !!(Cap.isPluginAvailable && Cap.isPluginAvailable("CapacitorHealthkit")),
    request: async function () { if (!N.health.available) return false; var HK = P("CapacitorHealthkit"); await HK.requestAuthorization({ all: [], read: ["steps", "workouts"], write: [] }); return true; },
  };

  if (App) { App.addListener("appStateChange", function (s) { if (s.isActive) { try { window.dispatchEvent(new Event("mi:resume")); } catch (e) {} } }); }
  N.ready = true;
  try { window.dispatchEvent(new Event("mi:native")); } catch (e) {}
})();
