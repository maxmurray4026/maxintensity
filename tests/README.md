# Tests

Offline Playwright walkthroughs at phone width (390×844). The harness serves the
repo root, replaces the CDN scripts (React, Babel, Tailwind) with local copies
from `tests/node_modules`, and answers the worker with `mock.js`, so no network
is needed.

```
cd tests && npm install && npx playwright install chromium
npm test            # syntax check → full funnel → in-app walkthrough
```

- `syntax.js` compiles every JSX module and the main script with Babel.
- `funnel.js` taps through all 27 enrollment screens (rank reveal, projection,
  live coach demo, plan name, induction, ignite, account, proof, trial, paywall,
  downsell) and checks what lands in storage.
- `app.js` seeds a member and exercises: plain-language edit ("add bench"),
  short-on-time, recommended swaps, a session with RIR coaching and a PR, the
  recap, rank-up, progress page, photo check-in, photo assessment, wall post,
  leaderboard, verification, meal prep with a food file, photo and voice meal
  logging, the usage cap.

Screenshots land in `tests/shots/`. Set `CHROME=/path/to/chrome` to use a
specific Chromium build.
