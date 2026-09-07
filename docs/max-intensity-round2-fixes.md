# ROUND 2 — COMPLETE INSTRUCTIONS (paste in full)

## HOUSEKEEPING FIRST

* Delete from assets/anatomy: CONTACT-SHEET.png, "Deltoideus_posterior (1).png", the Vesalius Wellcome jpg, classroom-table.jpg and torso-arm-hero.jpg (duplicates). Keep the credits line accurate: the folder holds only our commissioned plates.
* Create docs/ and save this entire document there as docs/max-intensity-round2-fixes.md so future sessions can find it.

This is a targeted fix pass on the build in commit b703ea6. Change ONLY what is listed. Do not restyle, rename or rework anything that isn't mentioned. Work to completion without pausing, then commit and push to main.

## 0. LAYOUT FIRST (do this before anything else)

Adopt the layout of the iOS build for the main app shell, keeping OUR colours (black #050505, red #FF2B2B, bone #F2EFE8) and type (Anton / IBM Plex Mono):

* Bottom tab bar: TODAY · TRAIN · MEALS · COACH · PROGRESS
* TODAY: header "LET'S WORK." with level + XP badge top-right; streak ring card ("0 DAYS — log anything today to light it up" + rest-day shields); "TODAY'S SESSION" card (e.g. UPPER A · Chest · Back · Shoulders · 5 exercises · 20 sets · START SESSION); WEEKLY QUESTS list with XP rewards; FUEL "TODAY'S INTAKE" card (kcal + protein bars, "Log a meal →"); COMMUNITY "YOUR LEAGUE" card
* TRAIN: block header (WEEK 1 · 4 DAYS / WEEK · plan name), session cards in order with UP NEXT highlighted, each listing muscle groups + exercise names
* Community: league leaderboard with promotion line + Feed tab
  Every current feature must remain reachable inside this shell.

## 1. ENROLLMENT VISUALS — real anatomy, changing as you go

* Replace ALL generated/AI-drawn engravings with real public-domain plates from /assets/anatomy (filenames per assets/anatomy/CREDITS.md). Never show the generated ones again.
* Put the anatomy plates in the BACKGROUND of every enrollment screen, tinted bone/red on black at 15-25% opacity, with the grain over the top, so there is always something to look at.
* Progress the imagery through the funnel: muscle plates on the opening screens → skeleton plates through the middle → classic scientific "classroom" plates (Vesalius / Bourgery-style full-page tables) toward the end. Shift subtly screen to screen (crossfade, slight pan), never a hard jump.
* Text contrast must stay AA-legible over every plate.

## 2. ENROLLMENT CONTENT FIXES

* Goal screen: ADD "Lose fat + build muscle" (body recomposition) as an option — make it the first/headline option. Keep Lose fat / Build muscle / More athletic.
* Screen 16 (projection graph): the red data label sits on the red line and is unreadable. Move labels off the line (white/bone label chips with dark background, offset above the point). Check every chart label in the app for the same problem.
* Screen 19 (method screen): keep "6-week block" and "4-day split"; REMOVE the rep-scheme numbers; replace with the progression loop shown as a simple cycle: ADD REPS → ADD WEIGHT → ADD REPS → REPEAT.
* Screens 17-18 (stimulus explanation): remove the "one set is the session / one set is the main stimulus" framing. Correct framing: the main stimulus is TWO sets — the working set and the back-off set. Rewrite copy accordingly.
* Motivation problem → solution: add "see your friends' scores and stay competitive" alongside streaks and the coach.
* Cut opener screens 4 and 5 (keep three problem-awareness openers max). Renumber; keep total flow tight.

## 3. BUGS

* Photo check-in / wall: uploaded photo is not visible after upload and wall photos won't post. Fix upload → preview → post so the user sees their image immediately and it appears on the wall.
* Short-on-time mode: after pressing it there is no way back. Add a Back/Undo that restores the full session.
* Muscle priority ordering: when the user picks "glutes, then abs" the session order must follow the user's stated priority exactly (first priority first; abs-first means a full 10-minute abs block at the start). Ordering is currently wrong — fix and add a test.
* Scheduling rule: a leg-focus / glute-focus day must never be scheduled adjacent to the Lower day. Space them across the week.

## 4. FEATURES

* Wall: upvotes on testimony posts AND on comments (add comments if not present). Sort by upvotes with a Recent toggle.
* Wall: before/after composer — user picks two photos, app combines them side by side into one shareable before/after image with the logo mark and dates.
* Push notifications (web push, PWA): notify when someone overtakes you on the leaderboard; also streak-at-risk reminder. Include the Add-to-Home-Screen prompt for iPhone since iOS Safari requires it for push.

## 5. COACH BEHAVIOUR (interim rules until the full knowledge doc lands)

* When the coach lacks information it needs, it asks a specific question instead of guessing.
* Nutrition: coach the TIMING of eating (around training, the one big meal) rather than prescribing specific foods; expand the approved foods list generously beyond the core greenlist.
* Under-PR sessions: when a user logs below a previous PR, the coach explains why that's normal (fatigue, sleep, stress, deload week, accumulated volume) so they don't worry, and tells them what to do next.
* Priority requests are followed literally and in order; the user's request always wins after one honest line.

## 6. VERIFY, THEN SHIP

Phone-width pass: new shell and tabs; enrollment plates visible and changing; recomposition goal present; chart labels readable; screen 19 loop; 17-18 copy; openers cut; photo upload → visible → wall post works; short-on-time back button; glutes-then-abs ordering correct; leg-focus not adjacent to Lower; upvotes; before/after composer; push permission flow. Commit and push to main.

## 7. ART DIRECTION ADDENDUM — TWO TIERS OF ANATOMY

TEXTURE tier (as built): 15-25% opacity behind cards and data-heavy screens. HERO tier (new): on the enrollment openers, the rank reveal, the projection screen, the Progress page header and the session recap card, place one library plate LARGE — 60-90% opacity, full red saturation, scaled to fill 50-70% of the screen and bleeding off the right or bottom edge, positioned off-centre so the text sits in the clear space beside it. Match plate to moment: hero (torso-arm) on openers, skeleton on rank reveal, muscles-front on projection, muscles-back on Progress, arm (flexed) on recap. Text stays AA-legible; where a plate is busy behind text add a soft gradient behind the type — never shrink the plate. It should feel like a design statement, not wallpaper.

## THEN

Run everything above in full without pausing, verify at phone width, commit and push to main.
