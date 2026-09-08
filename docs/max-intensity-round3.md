# MAX INTENSITY WEB — ROUND 3 (run after round 2 is live and phone-tested)

Targeted changes only. Do not restyle or rework anything not listed. Work to completion, verify at phone width, commit and push to main.

## 1. NAVIGATION — swipe, don't click

* Day-to-day and week-to-week movement on Today/Train is by horizontal SWIPE (touch gestures, with momentum), not arrow buttons. Keep small arrows as a fallback but swiping is primary. The current click-a-week-at-a-time nav feels clunky — kill that feel.
* The date header at the top is a tappable button that opens the CALENDAR view (see 2).

## 2. CALENDAR VIEW — the block at a glance

* Tapping the date header opens a month calendar in our style (black, bone type, red accents, anatomy texture behind).
* Each training day shows a coloured dot: red = session scheduled, bone = completed, dim = rest.
* The 6-week block is visible as a week strip across the top: WEEK 1 ESTABLISH · WEEK 2 GROOVE · … · WEEK 6 DELOAD (use the block's real week names from the program). Tap a week to jump to it; the current week is highlighted.
* Tapping a day opens that day's session list: "Scheduled — Upper 1 — Not started" with the exercise list in order, START SESSION button.

## 3. PER-EXERCISE MUSCLE INFOGRAPHIC

* Every exercise card shows a small infographic of the muscles it works, built from our anatomy plates with the worked muscles filled `#FF2B2B`: arm exercises show the arm plate, leg exercises the legs plate, chest/back/shoulders the torso front/back plates.
* Primary muscles solid red, secondary muscles lighter red. Consistent crop and size across all cards. Tapping expands to a full plate view with the muscle names.
* Reuse the same red-fill muscle mapping for the muscle-priority picker so the two stay in sync.

## 4. FORM LIBRARY (video)

* Each exercise gets a "Form" button that plays a short reference video. Videos will be Max demonstrating the movement (shirt on) — filmed later; build the player and slots now with a placeholder card ("Form video coming") and a simple admin way to drop an .mp4 per exercise into assets/form/<exercise-slug>.mp4.
* Show 2–3 written form cues under the video from the exercise data.
* (Future, separate project: AI form check comparing the user's clip to Max's reference.)

## VERIFY

Swipe works on iPhone Safari without fighting the browser's back gesture; calendar opens from the header; week strip shows real block week names; dots render; exercise infographics show the right plate and muscles; form slots present. Commit and push to main.
