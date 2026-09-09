# MAX INTENSITY WEB — ROUND 3b (run immediately after round 3 completes)
Targeted changes only. Work to completion, verify at phone width, commit and push to main.

## 1. PLATE COLOUR — the figure should be deep red, not white/grey
The anatomy plates near workouts currently render as white/grey line-work on black. Change the treatment so the human figure reads DEEP RED: muscle mass in a deep blood-red (around #7A1414 to #A11B1B), highlights lifting toward brand red #FF2B2B, bone/skeleton elements a dim warm grey, background stays black. Rich and moody, not bright, not pink, not "bloody" gore — set the tone. Apply this everywhere plates appear near training content; the faint texture tier can stay subtle but should be red-tinted too, never white.

## 2. PLATE PER SESSION (fixed mapping)
- LEGS 1 → front-of-legs plate (quads)
- LEGS 2 → back-of-legs plate (hamstrings/glutes)
- UPPER 1 → back and arms plate (muscles-back / torso-arm hero)
- UPPER 2 → chest and shoulders plate (muscles-front, torso)
- GLUTE FOCUS → glute/hamstring plate
Each session card and its expanded view uses its mapped plate as the hero image.

## 3. TRAIN TAB — layout
- REMOVE the Week 1 / Week 2 / Week 3 / Week 4 tabs from the top of Train.
- Top of Train gets the SAME day strip as the Today tab (Mon–Sun, swipeable, tap a day), so both tabs feel identical.
- Next to the day strip, a DISTINCT calendar button: calendar icon + the word "CALENDAR" (not just two lines). Tapping it opens the block calendar (round 3 §2) with the week names across the top.
- Under the header: "TODAY'S SESSION" and the session cards for the block in order (Upper 1, Legs 1, Upper 2, Legs 2, Glute Focus…).
- Tapping a session card (e.g. UPPER 1) EXPANDS IT IN PLACE: START SESSION button at the top of the expanded card, then the full exercise list in order directly underneath (incline dumbbell press, dips, incline flys, Smith wide-grip row, straight-arm pulldown, Smith shoulder press, lateral raise… per the program), each with its sets/reps and its small muscle infographic. Other session cards collapse to a single line while one is expanded. Tap again to collapse.
- No more list of "Legs 2 / Upper 2 / Glute Focus" sitting expanded under the current session — collapsed one-liners only until tapped.

## VERIFY
Plates are deep red near training; Legs 1/2 and Upper 1/2 show the right plates; Train tab has the day strip + CALENDAR button and no week tabs; Upper 1 expands to Start Session + full exercise list; others collapse. Commit and push to main.

## 4. FROM THE CURRENT-BUILD SCREENSHOTS (fix in this pass)
- Today header text is truncated: "MONDAY 7 SEP · YESTE >" — the label overflows and clips. Shorten the format (e.g. "MON 7 SEP · YESTERDAY") or let it wrap; it must never clip.
- The session hero plate currently renders in sepia/gold. This is the plate that becomes deep red per §1.
- The small per-exercise muscle figures under the session card are good — KEEP them, just recolour to the deep-red treatment and make sure each one maps to the correct exercise.
- On Train, START SESSION currently sits at the very bottom under a separate "UPPER 1 — Today on the plan" block. Remove that separate block; the button lives at the top of the expanded session card (§3).
- Keep "SEE THE WHOLE BLOCK →" but make it open the same block calendar as the CALENDAR button.
