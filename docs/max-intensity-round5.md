# MAX INTENSITY WEB — ROUND 5 FINAL (consolidated; paste once)
Targeted changes only. Do not restyle or rework anything not listed. Work to completion without pausing, verify at phone width, commit and push to main. Save this file as docs/max-intensity-round5.md.

## A. BUGS (first)
1. Onboarding email field: each typed letter jumps focus to the field above. Fix focus handling; test a full email on iPhone Safari.
2. "Who's training?" does nothing when pressed. Fix.
3. Meal and workout logging fail before the trial has started. Logging must work for every user, pre-trial included; only premium features gate on trial/membership.

## B. SPLASH / LOADING SCREEN
4. Replace the plain "Max Intensity loading — pull down to refresh" screen with a branded splash: black background, a bold RED PADLOCK (#FF2B2B) centred and large — in your face. While loading it sits closed; when the app is ready it UNLOCKS with a satisfying animation (shackle springs up, slight scale/bounce, quick red flash) and dissolves into the app. Add a short unlock sound (subtle click-clack, ≤0.4s) that plays only after a user gesture where the browser requires it; otherwise silent. No wordmark, no text under the padlock. Never show raw loading copy or "pull down" text anywhere.

## C. NAMING
5. Rename session days: LEGS 1 → LOWER 1, LEGS 2 → LOWER 2, everywhere (Today, Train, calendar, coach, plates map). GLUTE FOCUS stays as is.
6. Goal options in onboarding: Lose fat · Build muscle · More athletic · LEAN & DEFINED (subline: "lose fat, build muscle, look toned"). LEAN & DEFINED replaces the "Lose fat + build muscle / recomp" option and is the headline choice. Store as goal=lean_defined.

## D. CALENDAR
7. Scheduled-but-not-started sessions: the whole day cell fills solid red; completed = bone fill; rest = dim. No dots anywhere.
8. Week strip: "WEEK 1 ESTABLISH" etc. labels and the day dates must sit INSIDE their boxes at phone width. Fix the layout/overflow.

## E. PLATES & MUSCLE HIGHLIGHTS
9. Muscle highlight masks currently light up wrong shapes (back/lats, shoulders). Rebuild masks to follow the actual muscle outline on the plate; dark red (#7A1414 → #A11B1B); only the worked muscle lit, nothing else.
10. Glute Focus (and Lower 2) hero: use the dedicated back-of-legs plate if present in assets/anatomy (legs-back.jpg); otherwise crop muscles-back to the lower half. Either way the GLUTES are filled red on that day like every other day shows its muscles.
11. Onboarding: a different plate on EVERY screen — no two consecutive screens share one. Use the full a-/b- library.
12. Final onboarding screen uses the deep-red-on-black arm plate (option B), large, bleeding off the right edge.

## F. ONBOARDING CONTENT
13. Add a method screen: "Muscle growth from a session lasts up to two days. So we train upper and lower every two days — each muscle gets a growth signal three times a week." With a two-column comparison: BRO SPLIT (1 signal/week) vs MAX INTENSITY (3 signals/week). Why this beats the bro split, in one line.
14. Pricing: move all prices, trial length and the pre-selected plan into one config file (pricing.json). Keep current live prices unchanged for now; Max will set the experiment later. Paywall copy renders from config.

## G. MEALS — "PLAN MY WEEK" (Mise-style flow, inside Meals behind PLAN)
15. Keep the clean Meals main page from round 4 (ring + LOG + today's meals). Behind the PLAN button build a 7-step setup, one decision per screen, big cards, our design system:
   1. Choose your shop — Tesco, Sainsbury's, Asda, Morrisons, Aldi, Lidl, Co-op, M&S ("we'll plan your weekly shop around it")
   2. How many are you cooking for? — stepper
   3. Which days will you cook? — day chips
   4. Weekly budget — slider showing £ this week
   5. What are you in the mood for? — pick up to 3: Speedy meals · Low calorie · Protein packed · Fakeaway · Healthy comfort · Family favs · Gut friendly · British staples
   6. What appliances do you have? — oven, hob, microwave, air fryer, slow cooker (tap to select)
   7. Any dietary needs? — None · Vegetarian · Vegan · Pescatarian · allergies (free text)
   Then a "Building your week…" screen with three checklist lines animating (matching meals to your shop + budget · lining up your big meals · putting together your grocery list).
16. Output: a WEEKLY PLAN built around Max's method — ONE BIG MEAL per day (the star), plus a quick breakfast and 1–2 snacks — not three dinners. Each day card: photo/plate placeholder, meal name, tag chip (from mood tags), time, serves, cost. Tap a meal → detail: kcal, time, serves, carbs/protein/fat, ingredients with quantities, numbered instructions, "Your notes", and a SWAP THIS MEAL button. Grocery list tab aggregates the week by shop aisle.
17. Seed the recommendation library with Max's items first: Quick breakfast — 200–300g 0% Greek yogurt + 100–200g fruit. Generate the rest with the coach using the approved foods and greenlist, spices free, low-calorie sauces, halve-the-bad-stuff rule.

## H. COACH / PROGRAM
18. Home workout plan: when a user has no gym access, the coach builds the full at-home version of the block (bodyweight/dumbbell equivalents, same structure and rules). Add a "No gym today" option on Train that swaps the day to its home version.

## I. PENDING (add when Max supplies details; skip if absent)
19. The "method line" Max dislikes — screen and line TBD.
20. The "admin" label on community posts Max finds unprofessional — remove/replace; exact element TBD (default: hide any admin badge/username on wall posts; verification badges only).

## VERIFY, THEN SHIP
Email typing works; Who's training works; pre-trial logging works; padlock splash unlocks with animation (and sound after gesture); LOWER 1/2 naming everywhere; LEAN & DEFINED goal present; solid red day cells; week strip labels inside boxes; muscle shapes correct and dark red; glutes red on Glute Focus; onboarding plate changes every screen; final screen uses option B; frequency screen present; pricing from config; PLAN flow all 7 steps → weekly plan around one big meal → meal detail → grocery list; home workout swap. Commit and push to main.
