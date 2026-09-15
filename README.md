# Max Intensity

Six-week strength block, coach in your pocket. A single-page web app — no build
step, host the folder as-is.

```
python3 -m http.server 8765   # then open http://localhost:8765
```

- `index.html` — the app (React + Babel in the browser)
- `app/*.jsx` — funnel, community, progress, recap, anatomy layer, UI kit
- `coach-knowledge.js` — the coach's knowledge and voice (mirrors `docs/coach-knowledge.md`); every AI prompt is built from it
- `pricing.json` — prices, trial length and the pre-selected plan; the paywall and trial copy render from it
- `mi-projection.js`, `mi-ai.js`, `rank-standards.js` — pure logic
- `assets/anatomy/` — engraving plates and credits
- `tests/` — offline Playwright walkthroughs at phone width
- `sw.js`, `manifest.webmanifest`, `icon-*.png` — the PWA: offline shell, icons, notifications
- `offline.html`, `404.html` — the styled fallbacks (GitHub Pages and most hosts serve `404.html` automatically)
- `CHANGES.md` — what was built, decisions and assumptions

## Hosting

Every path is relative, so the folder works at a root domain, a sub-path or a
custom domain unchanged. The only absolute URL is the AI relay (`MI_SERVER` in
`index.html`). Web push: the VAPID public key is `window.MI_PUSH_PUBLIC_KEY` in
`index.html`; the matching private key lives only in the worker (generated once,
never committed — see `.gitignore`). Subscriptions arrive at `POST /board` as
`{ handle, push }`; the worker signs pushes with the private key and the
subject `mailto:` address, and may send `{ title, body, tag, url }`. The worker also receives `POST /event` for the anonymous
product events (`{e, p, t, s, v}`, no identity) and, once it holds a VAPID key
(`window.MI_PUSH_PUBLIC_KEY`), web push subscriptions; a push payload may carry
`url` (e.g. `./?mini=1`) and the notification opens the app there.
