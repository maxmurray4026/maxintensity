# Worker: iOS routes

Two routes and one job to add to the Max Intensity worker (Cloudflare). Drop
`apns.js` and `iap.js` next to the worker source and wire the handlers below
into the existing router (the app token check stays the same as for `/board`).

## Secrets / bindings

| Name | What | Where it comes from |
|---|---|---|
| `APNS_KEY_ID` | 10-character key ID | developer.apple.com → Certificates, Identifiers & Profiles → Keys → the "Max Intensity APNs" key |
| `APNS_TEAM_ID` | your Team ID | developer.apple.com → Membership |
| `APNS_KEY_P8` | the .p8 file contents (PEM) | downloaded once when the key is created — keep it out of the repo |
| `APNS_TOPIC` | `com.maxintensity.app` | fixed |
| `APNS_ENV` | `sandbox` for TestFlight/dev, `production` for the App Store | switch when you go live |
| `ASC_ISSUER_ID`, `ASC_KEY_ID`, `ASC_KEY_P8` | App Store Server API key | App Store Connect → Users and Access → Integrations → In-App Purchase |
| `MI_KV` | a KV namespace | stores device tokens and memberships |

## Routes

```
POST /push/register   { token, platform: "ios", handle, bundle }      → { ok }
POST /iap/verify      { jws, productId, originalTransactionId, expires, handle } → { ok, member, expires }
GET  /iap/status?handle=...                                            → { member, expires, productId }
```

- `/push/register` stores `token` under `push:ios:<handle or token>`; the
  existing web-push subscriptions (`POST /board { push }`) stay as they are.
- `/iap/verify` decodes the StoreKit 2 JWS (`iap.js#verifyJWS`), checks the
  bundle id and product id, stores `{ productId, originalTransactionId,
  expires }` under `member:<handle>` and returns it. The web app reads the same
  record (`x-mi-member` header when `GET /iap/status` says member), so web and
  app agree on one membership.
- Sending: `apns.js#send(token, { title, body, url })` signs an ES256 JWT with
  the .p8 key (cached 50 minutes) and posts to
  `https://api.push.apple.com/3/device/<token>` (`api.sandbox.push.apple.com`
  while `APNS_ENV=sandbox`). Use it from the existing jobs that today send web
  push: overtaken on the leaderboard, weekly photo check-in. Streak-at-risk and
  "not going gym today?" are scheduled on the phone as local notifications, so
  the worker does not need to send those.

## Payload

```json
{ "aps": { "alert": { "title": "…", "body": "…" }, "sound": "default", "badge": 1 }, "url": "./?mini=1" }
```

The app opens the two-set session when `url` contains `mini=1`.
