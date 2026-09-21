# Max Intensity — iOS: what was built and what to click

The web app is the product. This wraps it in a native iOS shell with Capacitor,
adds the native pieces Apple expects, and stops at the line that needs your
Apple account: signing, the archive, and the upload. Everything up to that
line is in the repo and verified where it can be (the offline bundle runs with
no network in the test suite; the Swift and Xcode changes need Xcode).

## What is in the repo

| Piece | Where |
|---|---|
| Capacitor config (appId `com.maxintensity.app`, name "Max Intensity", webDir `www`) | `capacitor.config.json` |
| iOS project (Swift Package Manager, no CocoaPods) | `ios/App/App.xcodeproj`, `ios/App/CapApp-SPM` |
| Offline web bundle build: vendors React/ReactDOM/Tailwind, precompiles the JSX, bundles the fonts, rewrites nothing else | `scripts/build-web.js` → `www/` (git-ignored, rebuilt by `npm run build:web`) |
| Native bridge (a no-op on the web) | `native.js` |
| Bounce-free, pinch-free web view; black behind everything; light status bar | `ios/App/App/MIViewController.swift` (set on `Main.storyboard`) |
| StoreKit 2 plugin: products, purchase, restore, current entitlement, signed transactions | `ios/App/App/MIStorePlugin.swift` |
| Entitlements: push (`aps-environment`), Sign in with Apple | `ios/App/App/App.entitlements` |
| Usage strings (camera, photos, microphone, speech, Health), portrait only, background push | `ios/App/App/Info.plist` |
| App icon (1024, from the red mark) and the padlock launch screen | `ios/App/App/Assets.xcassets`, `ios/App/App/Base.lproj/LaunchScreen.storyboard`, `scripts/make-icons.js`, `assets/brand/` |
| Fastlane: `beta` (bump, archive, TestFlight), `record` (App Store Connect record + metadata), `web` (rebuild + sync) | `ios/App/fastlane/` |
| Placeholder metadata | `ios/App/fastlane/metadata/en-GB/` |
| Worker routes for APNs and purchase verification | `worker/apns.js`, `worker/iap.js`, `worker/README-ios.md` |
| Product / price config (iOS product ids, trial plan) | `pricing.json` → `ios` |

### What the app does natively

- **Push (APNs)**: turning alerts on in Settings registers the device with APNs
  and POSTs the token to the worker (`/push/register`). The worker sends
  overtaken-on-the-leaderboard and weekly photo check-in through APNs
  (`worker/apns.js`). Streak-at-risk (19:00) and "Not going gym today?" (15:00
  on training days) are scheduled on the phone as local notifications for the
  week ahead and re-planned whenever you log something. Tapping the gym nudge
  opens the two-set session.
- **Haptics**: padlock unlock, PR, rank-up, set logged.
- **Sign in with Apple**: on the "Who's training?" screen and in Settings.
- **Share sheet**: the before/after picture and the session recap card.
- **Subscriptions**: StoreKit 2 only — the paywall shows App Store prices in
  the member's currency, buys through Apple, has Restore purchases (paywall and
  Settings), and syncs the signed transaction to the worker so web and app
  agree. No Stripe, no web prices, in the app.
- **HealthKit**: code path behind `HEALTHKIT_ENABLED = false` in `native.js`
  (steps + workouts, read only). Flip it on later: add the HealthKit capability
  in Xcode and a HealthKit Capacitor plugin.
- **Shell**: dark status bar on black, safe areas respected (the app already
  uses `env(safe-area-inset-*)`), no rubber-band, no pinch-zoom, offline bundle
  with API calls going to the worker exactly as on the web.

## Do this on your Mac (in order)

### 0. One-time setup

```bash
git pull
npm install                       # Capacitor + plugins
npm run build:web                 # builds www/
npx cap sync ios                  # copies www/ into ios/App/App/public and resolves the Swift packages
sudo gem install fastlane         # or: brew install fastlane
npx cap open ios                  # opens ios/App/App.xcodeproj in Xcode
```

### 1. Xcode signing (2 minutes)

1. In Xcode, select the **App** target → **Signing & Capabilities**.
2. Tick **Automatically manage signing**, pick your **Team** (your Apple Developer account).
   Bundle identifier is already `com.maxintensity.app`.
3. Check the capabilities that are already listed from `App.entitlements`:
   **Push Notifications** and **Sign in with Apple**. If Xcode shows either in
   red, click **+ Capability** and add it; Xcode will register it on the App ID.
4. Product → **Run** on your iPhone once (Xcode may ask you to trust the
   developer on the phone: Settings → General → VPN & Device Management).
   You should see the padlock, then the app.

### 2. developer.apple.com (5 minutes)

- **APNs key**: Certificates, Identifiers & Profiles → **Keys** → **+** → name
  "Max Intensity APNs", tick **Apple Push Notifications service (APNs)** →
  Continue → Register → **Download** the `.p8` (only offered once). Note the
  **Key ID** on that page and your **Team ID** (Membership page). Put the three
  into the worker as `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`
  (`worker/README-ios.md`). Set `APNS_ENV=sandbox` for TestFlight.
- **Identifiers → App IDs → com.maxintensity.app**: confirm Push Notifications
  and Sign in with Apple are ticked (Xcode step 1 usually does this).

### 3. App Store Connect (10 minutes)

**App record** (skip if it exists): My Apps → **+** → New App → iOS, name
**Max Intensity**, primary language English (UK), bundle ID
`com.maxintensity.app`, SKU `maxintensity-ios`. Or from the Mac:
`cd ios/App && bundle exec fastlane record` (uses the placeholder metadata).

**Subscriptions** (Monetization → Subscriptions → **+ Subscription Group**):

| | value |
|---|---|
| Group | `Max Intensity Membership` |
| Product 1 | Reference name `Weekly` · Product ID **`com.maxintensity.app.weekly`** · duration 1 week |
| Product 2 | Reference name `Monthly` · Product ID **`com.maxintensity.app.monthly`** · duration 1 month |
| Product 3 | Reference name `Yearly` · Product ID **`com.maxintensity.app.yearly`** · duration 1 year |

For each: set the price (App Store pricing, your currency; it is shown to
members in theirs), add the en-GB display name and description, and a review
screenshot (any screenshot of the paywall). On **Yearly** (the pre-selected
plan in `pricing.json`), add an **Introductory Offer** → **Free trial → 7 days
→ all countries**. Keep the ids exactly as above; they are in `pricing.json`
and `worker/iap.js`.

**App Store Server API key** (for the worker to verify purchases): Users and
Access → Integrations → **In-App Purchase** → **+** → download the `.p8`; put
issuer id, key id and the key into the worker as `ASC_*` (`worker/README-ios.md`).

**Sandbox tester**: Users and Access → Sandbox → **+** → a test Apple ID for
purchases on TestFlight builds.

**Internal testers**: TestFlight → Internal Testing → **+** group "Max" → add
your Apple ID.

### 4. Ship to TestFlight

Either in Xcode: Product → **Archive** → Distribute App → **App Store Connect**
→ Upload (automatic signing), or from the terminal:

```bash
cd ios/App
bundle install
bundle exec fastlane beta          # rebuilds www, bumps the build number, archives, uploads
```

Then in App Store Connect → TestFlight: the build appears after processing
(10–30 min), answer the export-compliance question if asked (the app uses
only HTTPS: **No** to custom encryption — `ITSAppUsesNonExemptEncryption` is
already `false` in Info.plist), add it to the internal group, install from the
TestFlight app on your phone.

### 5. Before App Review

- Screenshots: 6.7" (iPhone 15 Pro Max) and 6.1" sets. Take them from the
  TestFlight build: Today, Train, a session, Meals, the calendar, the coach.
- Privacy: App Privacy → Data types: Health & Fitness (workouts, food logs,
  photos — stored on device; the coach receives what the member sends), Contact
  Info (email, optional), Identifiers (none), Purchases. "Data not linked to
  you" where it is stored on the phone.
- Privacy policy URL and support URL: the placeholders point at
  `maxintensity.app/privacy` and `maxintensity.app` — put real pages there.
- Age rating: 4+ (no objectionable content). Category: Health & Fitness.
- Review notes: give App Review a sandbox account and say the coach features
  are behind the subscription with a free trial; mention that "Sign in with
  Apple" is offered because email sign-up exists.

## What Apple's review is likely to flag, and the fix

| Flag | Why | Fix (mostly done) |
|---|---|---|
| Guideline 4.2 "minimum functionality" (a website in a wrapper) | web-view apps get looked at | Push, haptics, share sheet, Sign in with Apple, StoreKit, local notifications, offline bundle are all native. Say so in the review notes. |
| 3.1.1 In-App Purchase | any hint of an outside payment | On iOS the paywall only uses StoreKit prices; no web prices, no Stripe, no "DM Max for a code" as a payment route. The member-code field is an unlock for existing members, not a purchase — if Review objects, hide it on iOS (`native.js` sets `html.native`; wrap that field). |
| 3.1.2 Subscription disclosures | required copy | The paywall shows price, period and the free trial from StoreKit; add Terms of Use (EULA) and Privacy Policy links to the paywall footer before submission (App Store Connect → App Information → EULA, plus a link in the app). |
| 4.8 Sign in with Apple | you offer email sign-up | Added (account screen + Settings). |
| 5.1.1 Permissions | usage strings must say why | Plain-English strings for camera, photos, microphone, speech, Health are in Info.plist. |
| 2.3.10 accurate metadata | placeholders | Replace the `[PLACEHOLDER]` text in `ios/App/fastlane/metadata/en-GB/` and in App Store Connect. |
| HealthKit without use | entitlement present but unused | Not added yet — the capability and plugin go in when the feature ships (flag in `native.js`). |
| Push permission on launch | asking too early | The app asks only when you tap Notifications in Settings. |

## Keeping web and app in sync

`npm run ios:sync` (build the bundle + `cap sync`) after any web change, then
archive again. The site on GitHub Pages keeps loading from the CDN exactly as
before; only `www/` is rewritten.
