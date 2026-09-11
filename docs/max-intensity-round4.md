# MAX INTENSITY WEB — ROUND 4 (launch readiness; run after 3b is live)
Targeted changes only. Work to completion, verify at phone width, commit and push to main.

## 1. FOOD PAGE — rebuild clean (highest priority; current one is messy)
Study the layout patterns of the cleanest consumer food apps (Cal AI, MacroFactor, Yazio) and rebuild MEALS in our design system with the same clarity:

* Top: one big daily ring (calories) with protein/carbs/fat as three small bars under it. Numbers big, labels small mono. Nothing else above the fold except the LOG button.
* LOG button opens a sheet with three tabs: Photo · Voice · Type. One tap to start each. Voice shows a live waveform and a clear stop; photo shows the frame and a shutter.
* Below: today's meals as simple cards — time, name, kcal, protein — swipe to delete, tap to edit. One-big-meal gets a star marker.
* A single "Coach tip" line under the list (from the coach, timing-focused per the knowledge doc) — one line, not a paragraph.
* Meal prep / recommendations live behind one "PLAN" button, not on the main page. Remove all other clutter from the main Meals screen. If a thing doesn't help someone log or see their day, it goes behind a button.

## 2. BUG — voice log
Pressing the voice log a second time breaks: the original recording no longer works/plays and the new one fails. Fix the recorder lifecycle (stop → release → allow new), keep both entries, and add a visible state (recording / processing / saved). Test: log twice in a row, then play both.

## 3. NOTIFICATION — "Not going gym today?"
Add a scheduled nudge on training days when nothing has been logged by mid-afternoon: "Not going gym today? Get two sets in." Tapping opens a two-set mini session (the work set + back-off of the main lift only) with a 10-minute timer. Web push where permitted; in-app banner otherwise.

## 4. LAUNCH READINESS (web release)

* PWA: manifest with name, icons (arm mark), theme #050505; service worker for offline shell; iOS "Add to Home Screen" prompt with a two-step visual on first visit from Safari.
* Custom-domain safe: no hardcoded github.io URLs anywhere; all links relative.
* Analytics events on: funnel step reached, rank revealed, trial started, session logged, meal logged, wall post. Lightweight, privacy-respecting.
* Trial start flow works end to end without a card; member-code unlock works.
* 404 and offline states styled, no raw browser errors.

## VERIFY
Meals page fits above the fold with ring + LOG; voice log twice works; nudge schedules on training days; Add to Home Screen prompt shows on iOS Safari; no github.io links; trial start works. Commit and push to main.
