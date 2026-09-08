# CHANGES

## Round 3 — swipe, calendar, muscle infographics, form library

**1 Navigation.** Today is a day carousel: swipe left/right (touch or mouse,
momentum on distance or velocity) moves a day; Train swipes the block week.
`MI.Swipe` in `app/ui.jsx` uses `touch-action: pan-y` so vertical scrolling
stays native, ignores gestures that start within 24px of either screen edge
so iOS Safari's back/forward edge swipe is never fought, and swallows the
click that would otherwise land under the finger after a drag. Small ‹ ›
arrows remain as the fallback on both screens. The date header on Today and
the week line on Train are buttons that open the calendar.

**2 Calendar view** (`app/calendar.jsx`). Full-screen month grid, black/bone
/red with the skeleton plate behind. Dots: red scheduled, bone completed, dim
rest; the current block week is tinted. Week strip across the top uses the
block's real names from `WEEK_PLAN` (WEEK 1 ESTABLISH … WEEK 6 DELOAD),
tapping jumps the app week and scrolls the grid to it. Tapping a day shows
"Scheduled — Upper 1 — Not started" (or Completed with the logged sets, or
Rest) with the exercise list in order and START SESSION. Block start = first
logged session (today until then).

**3 Per-exercise muscle infographic** (`app/muscles.jsx`). Muscle regions are
polygons in each plate's pixel space over muscles-front, muscles-back, legs
and arm; the plate renders as texture and the worked regions fill `#FF2B2B`
(primary solid, secondary at 40%). Every exercise card, the session screen,
the Today session card and the calendar day list carry a 2:3 thumbnail with
the same crop; tapping opens the full plate with muscle names. Exercise →
plate/muscles is a keyword table (`MI.EXERCISES`) with a muscle-group
fallback for unknown names. Glute-dominant moves (hip thrust, RDL) use the
posterior plate because glutes are not visible on the anterior legs plate.
`MI.MuscleMap` is overridden so the priority picker (funnel and Settings) and
the recap use the same plates and fills.

**4 Form library.** Every exercise has a Form button (cards, session chips,
the muscle sheet) opening a player for `assets/form/<slug>.mp4` with 2–3 cues
from the exercise table. Missing files show the "Form video coming" card and
a link to a reference demo. Settings → Form videos lists every slot with a
live ready/missing check; `assets/form/README.md` documents the convention.
Dropping a file in is the whole admin step.

Verified at 390×844 (`tests/app.js`): swipe changes the day and the week and
swipes back, the date header opens the calendar, week names and dots render,
the day detail reads "Scheduled — … — Not started", infographics appear on
every card, the muscle sheet lists primaries and secondaries, the form sheet
shows the placeholder, three cues and the slot path, the admin list is in
Settings. The 404s in the console are the expected probes of empty slots.

## Round 2 — fix pass (docs/max-intensity-round2-fixes.md)

Housekeeping: stray files removed from `assets/anatomy` (contact sheet, the
Deltoideus PNG, the Wellcome Vesalius scan, the two duplicate JPGs); the round-2
brief is saved at `docs/max-intensity-round2-fixes.md`.

**§0 Shell.** Bottom bar is TODAY · TRAIN · MEALS · COACH · PROGRESS. TODAY:
"LET'S WORK." with the level + XP badge, streak ring with two weekly rest-day
shields (a shield covers one missed day), TODAY'S SESSION card (muscle groups,
exercise and set counts, START SESSION), WEEKLY QUESTS with XP that is awarded
once on completion, FUEL intake bars, and the YOUR LEAGUE card. TRAIN: block
header (week, days/week, plan name) and session cards in order with UP NEXT
highlighted; tapping a card selects it and the full session detail sits below.
Learn lives inside Coach as a segment; the community (League with promotion
line + Feed) opens from the Today league card and from Progress. Everything
that existed is still reachable.

**§1 + §7 Enrollment visuals.** Every enrollment screen has a plate behind it
at 16–20% via `MI.Crossfade` (fade + slight pan, keyed per screen): muscles on
screens 1–11, skeleton 12–16, classroom 17–25. HERO tier (`MI.Hero`): hero
(torso-arm) on the three openers, skeleton on the rank reveal, muscles-front
bleeding off the bottom of the projection, muscles-back on the Progress header,
arm on the recap. Hero plates are `<img>` layers clipped 3.5% so the paper
frame never shows, 85% opacity, red via inverted luminance, with a gradient
behind the type. Grain sits over the funnel.

**§2 Content.** Goal screen leads with "Lose fat + build muscle" (plan name
RECOMP, projection uses the lift curve with a flat-bodyweight caption).
Projection labels are chips off the line; the in-app projection graph got the
same treatment. Method screen: rep numbers replaced by ADD REPS → ADD WEIGHT →
ADD REPS → REPEAT. One-set framing removed everywhere (demo screen, session
UI, tutorial, the lesson, the coach prompts): the stimulus is the working set
and the back-off. Motivation answer adds friends' scores. Openers 4 and 5 cut;
25 screens.

**§3 Bugs.** Photo upload shows an instant preview (object URL), decodes via
`createImageBitmap` (HEIC-safe on iOS) with an `<img>` fallback and a plain
error message; a Library button joins the camera button. Feed posts keep a
local echo with the image so the member sees their photo immediately even when
the worker strips or refuses images (text is retried without the image).
Short-on-time has "Undo — full session" in the banner and inside the session.
Priority ordering rewritten: the session follows the stated order exactly, abs
is a 10-minute block placed where "abs" sits in the list (first if first) on the
lower-body days — `tests/logic.js` covers glutes→abs, abs→glutes and
chest→arms. Week scheduling now comes from `MI_PROJ.scheduleWeek`, which never
puts two lower-body days adjacent (including Sun→Mon); the calendar planner
refuses an adjacent lower day with a message. Tested for 3, 4 and 5 days.

**§4 Features.** Feed: upvotes on posts and on comments, comments per post,
Top/Recent sort. Before/after composer: two photos → one 1080×1080 image with
the arm mark, BEFORE/NOW labels and dates → share or post. Push: `sw.js` +
`manifest.webmanifest`, "Turn alerts on" in Settings, overtaken-on-the-league
and 7 pm streak-at-risk alerts fired through the service worker, iPhone
Add-to-Home-Screen card on Today. True web push subscribes when
`MI_PUSH_PUBLIC_KEY` is set to the worker's VAPID key and posts the
subscription to `/board`; until then alerts are local.

**§5 Coach.** Interim rules in the coach knowledge and the relay prompts: ask
one specific question when information is missing; coach eating TIMING not
foods; explain under-PR sessions (also shown in-app during the rest after a
set logged below a previous best, with what to do next); follow priority
requests literally and in order. Approved foods list widened well beyond the
core greenlist.

**§6 Verified** at 390×844 with the offline suite (`tests/`): new shell and
tabs, plates changing through the funnel, recomposition option, chip labels,
loop screen, two-set copy, 25 screens, photo → preview → feed post with image,
short-on-time undo, priority ordering and scheduler (logic test), upvotes and
comments, before/after composer, league promotion line. Push permission cannot
be granted in headless Chromium; the flow is wired and degrades to a message.

---

# Round 1 — full build pass

Everything in the brief is implemented. This file records the decisions that
were mine to make, the assumptions behind them, and what could not be verified
from the build environment.

## What did not change

- The program and its philosophy: 6-week block (W1 Establish → W6 Deload),
  4-day Upper/Legs split with the Glute Focus variant, 10/6/6/6 with the third
  set as the work set, tempo 3-1-3-1, +2.5% when 6 is cleared, ~1 RIR.
  `DEFAULT_PROGRAM`, `WEEK_PLAN`, `applySplit`, the lessons, pillars, rules and
  the coach's knowledge block are untouched.
- The official exercise list. The coach prompts now carry it explicitly and are
  told to prefer it.
- Meal basics: calculator formulas, one-big-meal rule, swap machine, greenlist,
  guilt-is-the-enemy.
- Red `#FF2B2B` / black `#050505` / bone `#F2EFE8`, Anton + IBM Plex Mono, the
  arm-mark logo, no emojis (icons are inline SVG).
- The AI relay: every AI call still goes to `api.anthropic.com/v1/messages` and
  the shim in `index.html` rewrites it to the worker with the app token.
  `/board` is called exactly as before, plus new fields.
- `rank-standards.js` is unchanged.

## Structure

`index.html` was 3,000 lines in one component. The app now loads modules with
Babel (`<script type="text/babel" src=…>`), no build step, same hosting:

| File | What |
| --- | --- |
| `mi-projection.js` | Projection maths, plan naming, XP levels, session grade, deterministic short-on-time rebuild, RIR advice. Pure functions. |
| `mi-ai.js` | Every AI feature (coach demo, session edit, swaps, photo assessment, meal prep, meal photo/voice, workout voice) plus the daily usage cap. |
| `app/ui.jsx` | Design tokens, icons, rank badges, level pill, sounds, confetti, long-press button, bottom sheet, image downscale, share, Web Speech hook, muscle keyword map. |
| `app/anatomy.jsx` | Vintage anatomy layer: `Plate`, `PlateCard`, `PlateHeader`, `MuscleMap`. |
| `app/funnel.jsx` | The 27-screen enrollment funnel and the in-app paywall. |
| `app/recap.jsx` | Session recap "wrapped" with the shareable card. |
| `app/community.jsx` | Wall, leaderboard, verification queue. |
| `app/progress.jsx` | Projection-vs-actual graph, rank card, rank-up overlay, photo check-in, photo assessment. |
| `assets/anatomy/` | Plates, generator, credits. |
| `tests/` | Offline Playwright walkthroughs (see `tests/README.md`). |

## Part 1 — funnel (27 screens)

1–5 problem-awareness openers (no personal data) · 6 goal · 7 mirror outcome ·
8 sex · 9 bodyweight · 10 time in the gym · 11 knows numbers · 12 three numbers
· 13 before photo · 14 the ladder · 15 **rank reveal** (card flip, red accent,
badge) · 16 **projection graph** (animated curve, trophy at week 6, one
credibility caption, rank-by-block-end line) · 17 muscle priority picker ·
18 **live coach demo** (proposes week 1, "I've only got 40 min", real worker
call, rebuilt session with removed exercises struck through) · 19 plan name
(MASS GAINER / SHREDDER / ATHLETE) · 20 obstacles · 21 how the system handles
each · 22 days per week · 23 **long-press ignite** · 24 account (name, optional
email and handle) · 25 social proof · 26 trial timeline (Today → Day 5 → Day 7)
· 27 paywall (yearly pre-selected, £30/mo vs £200/mo human coach) → soft
downsell (monthly, or keep the free tracker).

Every screen has one decision, ≥56px tap targets and an outcome line.

Decisions:
- **Order.** "Time in the gym" moved before the numbers so the projection can
  use it. Photo comes after the numbers (starting point = weight, lifts, photo).
- **Coach demo fallback.** If the worker is unreachable or the free cap is
  spent, the rule-based rebuild from `mi-projection.js` is shown and labelled as
  such. The funnel never dead-ends on a network error.
- **Social proof uses real data only.** Member count, top streak and best lift
  come from `/board`; up to two posts come from `/wall`. With no data it shows
  the founding-cohort framing. No testimonials were invented.
- **Account creation is local.** There is no auth backend in this repo. Name,
  email and handle are stored on-device; email is described honestly as "for
  your backup and the Day 5 reminder". The Day 5 reminder is delivered in-app
  (banner on Train when the trial has ≤2 days left).
- **Payment.** No checkout exists; access is by code via DM as before. Picking a
  plan starts the 7-day trial and records `subPlan` for when checkout lands.
- **Prices.** £30/mo, £240/yr (as the existing copy said), £200/mo human coach.

## Part 2 — features

Tier 1
- Ranks app-wide: badge in the header, profile card in Settings, rank card on
  Progress, badges on the wall and the board. Rank-up celebration (confetti,
  sound, plate) fires when the block's logged work-set gain lifts the induction
  numbers over the next threshold, or when the member updates their numbers.
- Progress: projection (dashed) vs actual (solid red) on one graph. Actual is
  bodyweight by block week for SHREDDER, otherwise the bench estimate moved by
  the average work-set gain. PR moments list with replay; PRs fire confetti +
  sound in-session as before.
- Recap "wrapped": grade, kg moved, PRs, worked-muscle map, points, streak,
  rank, shareable 1080×1350 card (Web Share → download → copy text).
- Muscle priorities: up to three, ordered. Abs adds a 10-minute block first on
  both leg days (Cable Crunch, Hanging Knee Raise, Weighted Plank — the official
  list has no abs work, so this is the one place new movements were added; the
  block is tagged so it can be stripped and re-applied).
- Plain-language session edit: "Anything you want to change about today?" with
  quick chips (Short on time, Add bench, Swap an exercise). The coach inserts,
  removes the overlap and explains in one line; added/removed names show.
- Recommended swaps: three options per exercise (coach if Max AI, rule-based
  list otherwise).
- Short-on-time mode: deterministic, works offline and free — cuts warm-ups and
  rests, circuits under 40 minutes, asks what to prioritise, never touches the
  work set. Coach path optional.
- RIR coaching: after warm-up 2 and after the work set, "how's the weight
  feeling / reps in reserve?" 0–3+. Advice tunes the next set (warm-up→work
  jump, back-off depth) and is stored on the set; the +2.5% rule still decides
  next week.
- Private weekly photo check-in: reminder on Train and in the card, on-device
  gallery, before vs now side by side.
- Photo assessment: what you want to change → honest read → priorities and a
  nutrition lever applied to the plan. The projection is text plus the numeric
  12-week curve; the prompt forbids fantasy outcomes.

Tier 2
- Wall (`/wall`): transformation, testimony and goal-card posts with rank badge,
  level and streak; "Respect" likes; local copy kept if the worker is down.
- Leaderboard (`/board`): rank badges, level, verified tick, sorted rank then
  points. Verification queue: member pastes a clip link + lift + weight; an
  admin code (Settings) loads the pending queue and approves/rejects.
- Streak, XP level (`levelFor`) and rank shown on posts, board rows, the wall
  header and the recap.

Tier 3
- Meal prep: tastes, shops, allergies, optional food file (text/CSV, ≤200 KB,
  first 20 KB sent) → three recommendations. Not a planner.
- Meal logging by photo (vision) and voice (Web Speech API, typed fallback);
  workout logging by voice in-session.
- Daily AI cap: member 80, trial 40, free 4 — counted client-side per day and
  sent as `x-mi-usage` / `x-mi-tier` headers so the worker can enforce.
- Wearables: HealthKit note + manual import (steps, sleep, resting HR) and
  `window.MI_HEALTH.import(payload)` for the iOS shell.
- Induction memory: obstacles, goal, mirror outcome, days, the demo reply and
  the plan are stored in `settings.induction` and injected into every coach
  prompt.

## Part 3 — anatomy layer

Plates sit behind stat cards, graphs, section headers and the rank/projection
screens at 12–25% opacity, bone→red duotone via CSS mask, grain on top. Legs
plate behind lower-body sessions, back/shoulder behind upper, torso/heart behind
nutrition, skeleton behind rank/progress, arm behind arm-priority sessions and
PR moments. The muscle map fills worked/prioritised regions `#FF2B2B`.

**Plates (round 2).** The generated SVG placeholders are gone. The canonical
plates in `assets/anatomy/` (skeleton, legs, back, torso-heart, arm,
muscles-front, muscles-back, classroom, hero) are wired into `MI.PLATES` with
`lum: true`; the `a-*` / `b-*` library plates back the enrollment screens,
progressing muscles → skeleton → classroom as the story moves from the body to
the rank to the plan. The plates are red ink on cream paper, so `lum: true`
renders by inverted luminance: two screen-blended layers (bone base, red fade)
with brightness-before-contrast so the paper falls to black and vanishes, solid
ink fills stay quiet and only the engraved line-work lifts. Credits are in
`assets/anatomy/CREDITS.md`.

Legibility: text sits on `#121212`/`#141414` with the plate never above 25%,
so bone and neutral-300 text stay above AA; small neutral-500 labels are the
app's pre-existing choice.

## Worker contract assumptions

`/board` GET/POST as before. New fields sent with the board POST: `rank`,
`rankIndex`, `level`. Assumed additions (all fail soft in the UI):

- `POST /board { handle, verify: { url, lift, kg, rank } }`
- `GET /board?pending=1` with `x-mi-admin` header → `{ rows }`
- `POST /board { admin, approve | reject: handle }`
- `GET /wall` → `{ posts: [...] }` (also accepts `rows`/`items`)
- `POST /wall { handle, type, text, image?, rank, rankIndex, level, streak, points, ts }`
- `POST /wall { like: id, handle }`
- Vision requests send image content blocks in the standard Messages format
  through the relay.
- Usage headers `x-mi-usage`, `x-mi-tier`, `x-mi-feature` on every relay call.

## Verification

Playwright at 390×844 (see `tests/`): full funnel tap-by-tap, rank reveal,
projection draw, coach demo, "add bench", short-on-time, swaps, session with
RIR + PR + recap + rank-up, progress cards, photo check-in save, assessment
apply, wall read/write, board read, verification submit, meal prep with food
file, photo and voice logging, usage counter. No console or page errors.

**Not verifiable here:** the real worker (`maxintensity-ai.maxmurray4026.workers.dev`)
and the CDN hosts were blocked by the sandbox's egress policy, so the tests use
local copies of React/Babel/Tailwind and a mock worker that follows the contract
above. The live coach demo, wall and board should be checked once against the
deployed worker.
