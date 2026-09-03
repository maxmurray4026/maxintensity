# Max Intensity

Six-week strength block, coach in your pocket. A single-page web app — no build
step, host the folder as-is.

```
python3 -m http.server 8765   # then open http://localhost:8765
```

- `index.html` — the app (React + Babel in the browser)
- `app/*.jsx` — funnel, community, progress, recap, anatomy layer, UI kit
- `mi-projection.js`, `mi-ai.js`, `rank-standards.js` — pure logic
- `assets/anatomy/` — engraving plates and credits
- `tests/` — offline Playwright walkthroughs at phone width
- `CHANGES.md` — what was built, decisions and assumptions
