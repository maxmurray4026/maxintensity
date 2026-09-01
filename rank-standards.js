/* ===========================================================================
   MAX INTENSITY — RANK STANDARDS
   ---------------------------------------------------------------------------
   Single source of truth for the seven-tier rank ladder. Loaded as a plain
   classic script before the app, so it works with no build step and can be
   reused verbatim by content tooling later (rank cards, TikTok formats, the
   in-app leaderboard).

   Exposes window.MI_RANK.

   TIERS (ascending)
     Bronze      pre-novice, first weeks
     Silver      novice, ~3-6 months consistent
     Gold        intermediate, 1-2 years
     Diamond     advanced, ~3-5 years, top ~10% of gym-goers
     Champion    highly advanced
     Elite       competitive raw powerlifter, regional-to-national total
     Iridescent  national-class / meet podium. Rare, not fictional.

   BARBELL numbers are estimated 1RM as a MULTIPLE OF BODYWEIGHT, raw, drug
   free, belt allowed. Squat to parallel, conventional deadlift from the floor,
   strict standing press (no leg drive), full-ROM bench.

   Anchored to the consensus of ExRx, StrengthLevel and Symmetric Strength,
   stretched from their five published bands to seven tiers, then corrected:
     - Iridescent sits at ~78-80% of the all-time IPF raw record total for the
       adjacent class in BOTH sexes. That is national-class, not world-class.
       Do not describe it as world class in copy.
     - Female bench was rescaled up (F/M was 0.65, records say 0.71).
     - Male bench top two tiers pulled down so a balanced lifter does not top
       out a full tier lower on bench than on squat.
     - Female upper-body multiples sit further below male than lower-body ones,
       which matches per-kg record ratios (bench 0.71, squat 0.88, DL 0.92).

   CAVEATS worth knowing before reusing this table:
     - Bodyweight multiples over-reward light lifters and punish heavy ones.
       Bronze and Silver are therefore capped at the reference bodyweight (see
       tierThreshold below) so a 110kg beginner is not ranked below the entry
       tier on his first session.
     - No age adjustment. A masters lifter ranks low here.
     - Female deadlift Bronze/Silver fall under the 60kg minimum you can load on
       a standard bar with full-size plates. That is fine for a self-reported
       estimate, but if a future feature verifies lifts against real gym loads,
       those two tiers need bumpers/blocks or a rack-pull entry.
   =========================================================================== */
(function (global) {
  "use strict";

  var TIERS = ["Bronze", "Silver", "Gold", "Diamond", "Champion", "Elite", "Iridescent"];

  /* Bronze and Silver are capped at this bodyweight — see tierThreshold(). */
  var REFERENCE_BW = { male: 80, female: 65 };

  /* Estimated 1RM as a multiple of bodyweight. Index = tier index. */
  var LIFTS = [
    {
      key: "bench",
      label: "Bench press",
      male:   [0.45, 0.75, 1.05, 1.35, 1.65, 1.92, 2.20],
      female: [0.30, 0.48, 0.70, 0.92, 1.15, 1.38, 1.65],
    },
    {
      key: "squat",
      label: "Back squat",
      male:   [0.55, 0.90, 1.25, 1.65, 2.05, 2.45, 2.90],
      female: [0.40, 0.70, 1.00, 1.35, 1.70, 2.05, 2.45],
    },
    {
      key: "deadlift",
      label: "Deadlift",
      male:   [0.75, 1.10, 1.50, 1.90, 2.30, 2.70, 3.15],
      female: [0.55, 0.85, 1.20, 1.60, 2.00, 2.40, 2.75],
    },
    {
      key: "ohp",
      label: "Overhead press",
      male:   [0.30, 0.45, 0.62, 0.80, 0.98, 1.17, 1.35],
      female: [0.20, 0.30, 0.42, 0.55, 0.68, 0.82, 0.95],
    },
  ];

  /* Minimum reps in one unbroken set, strict form. Index = tier index.
     Form standards matter — without them these inflate 30-50%:
       push-up  chest to fist height, straight line head to heel, no sag
       pull-up  dead hang, chin over bar, no kip
       dip      shoulder below elbow at the bottom, no swing
       squat    hip crease below knee, ~1 rep per 2 seconds

     Bodyweight squats above Gold measure local endurance, not strength — they
     saturate, so they carry a low weight in the composite (see WEIGHTS). */
  var BODYWEIGHT = [
    {
      key: "pushups",
      label: "Press-ups",
      unit: "in one set",
      male:   [2, 10, 20, 30, 45, 60, 85],
      female: [1,  5, 12, 20, 30, 42, 60],
    },
    {
      key: "pullups",
      label: "Pull-ups",
      unit: "in one set",
      male:   [1, 4, 10, 15, 20, 26, 35],
      female: [0, 1,  3,  6, 10, 14, 20],
    },
    {
      key: "dips",
      label: "Dips",
      unit: "in one set",
      male:   [1, 5, 12, 18, 25, 34, 45],
      female: [0, 1,  3,  6, 10, 15, 22],
    },
    {
      key: "bwsquats",
      label: "Bodyweight squats",
      unit: "in one set",
      /* Near sex parity is deliberate — women commonly match or beat men on
         high-rep bodyweight squat endurance. */
      male:   [15, 30, 50, 75, 100, 140, 195],
      female: [15, 30, 50, 72,  98, 135, 185],
    },
  ];

  /* Composite weighting. Bodyweight squats are a weak strength signal. */
  var WEIGHTS = { bench: 1, squat: 1, deadlift: 1, ohp: 1, pushups: 1, pullups: 1, dips: 1, bwsquats: 0.4 };

  function sexKey(sex) {
    return String(sex || "").toLowerCase().indexOf("f") === 0 ? "female" : "male";
  }

  function findLift(key) {
    for (var i = 0; i < LIFTS.length; i++) if (LIFTS[i].key === key) return LIFTS[i];
    return null;
  }

  function findBw(key) {
    for (var i = 0; i < BODYWEIGHT.length; i++) if (BODYWEIGHT[i].key === key) return BODYWEIGHT[i];
    return null;
  }

  /* The load in kg that puts a lifter of this bodyweight into `tier`.
     Bronze and Silver are capped at the reference bodyweight so heavy
     beginners are not ranked below the entry tier on day one. */
  function tierThreshold(liftKey, tier, sex, bwKg) {
    var lift = findLift(liftKey);
    if (!lift || tier < 0 || tier >= TIERS.length) return null;
    var s = sexKey(sex);
    var mult = lift[s][tier];
    var bw = Number(bwKg) > 0 ? Number(bwKg) : REFERENCE_BW[s];
    var effective = tier <= 1 ? Math.min(bw, REFERENCE_BW[s]) : bw;
    return mult * effective;
  }

  function bwThreshold(exKey, tier, sex) {
    var ex = findBw(exKey);
    if (!ex || tier < 0 || tier >= TIERS.length) return null;
    return ex[sexKey(sex)][tier];
  }

  /* Highest tier index whose threshold this value clears. -1 = below Bronze. */
  function tierFor(value, thresholds) {
    var t = -1;
    for (var i = 0; i < thresholds.length; i++) if (value >= thresholds[i]) t = i;
    return t;
  }

  /* Always rounds UP, so a target is never restated as a number already hit. */
  function ceil2p5(n) { return Math.ceil(n / 2.5) * 2.5; }

  /* --------------------------------------------------------------------- */
  /* computeRank
     entries: [{ key, value }] where key is a lift key (kg) or a bodyweight
              exercise key (reps). Mixing the two is allowed.
     Returns { tier, name, index, parts, next } — next is null at Iridescent.
     The user lands on the weighted average of their entries, floored at Bronze:
     nobody who can perform the movement ranks below the entry tier.          */
  function computeRank(entries, sex, bwKg) {
    var parts = [];
    var wSum = 0;
    var tSum = 0;

    (entries || []).forEach(function (e) {
      if (!e || e.value === "" || e.value === null || e.value === undefined) return;
      var value = Number(e.value);
      if (!isFinite(value)) return;

      var isLift = !!findLift(e.key);
      var thresholds = [];
      for (var t = 0; t < TIERS.length; t++) {
        thresholds.push(isLift ? tierThreshold(e.key, t, sex, bwKg) : bwThreshold(e.key, t, sex));
      }

      var tier = tierFor(value, thresholds);
      var w = WEIGHTS[e.key] || 1;
      wSum += w;
      tSum += Math.max(0, tier) * w;

      parts.push({
        key: e.key,
        label: (isLift ? findLift(e.key) : findBw(e.key)).label,
        isLift: isLift,
        value: value,
        tier: tier,
        thresholds: thresholds,
      });
    });

    if (!wSum) return null;

    var index = Math.max(0, Math.min(TIERS.length - 1, Math.round(tSum / wSum)));

    /* The next target: whichever of their own numbers sits closest to a
       threshold it has NOT yet cleared, so the gap reads as reachable and is
       never a number they already hit. A lift that is already past the
       composite's next tier is measured against its own next step instead —
       otherwise a strong bench would be handed back as a target it beats. */
    var next = null;
    if (index < TIERS.length - 1) {
      var best = null;
      parts.forEach(function (p) {
        var t = Math.max(index + 1, p.tier + 1);
        if (t >= TIERS.length) return;
        var need = p.thresholds[t];
        if (!need || need <= 0 || need <= p.value) return;
        /* Scaled by the composite weight so a near-tie does not send the user
           chasing bodyweight squats, which measure endurance, not strength. */
        var closeness = (p.value / need) * (WEIGHTS[p.key] || 1);
        if (!best || closeness > best.closeness) best = { part: p, need: need, closeness: closeness };
      });
      if (best) {
        var need = best.part.isLift ? ceil2p5(best.need) : Math.ceil(best.need);
        next = {
          name: TIERS[index + 1],
          key: best.part.key,
          label: best.part.label,
          need: need,
          /* Reads as "a 92.5kg bench" / "20 press-ups in one set" */
          phrase: best.part.isLift
            ? "a " + need + "kg " + best.part.label.toLowerCase()
            : need + " " + best.part.label.toLowerCase() + " in one set",
        };
      }
    }

    return { index: index, name: TIERS[index], tier: TIERS[index], parts: parts, next: next };
  }

  global.MI_RANK = {
    TIERS: TIERS,
    LIFTS: LIFTS,
    BODYWEIGHT: BODYWEIGHT,
    WEIGHTS: WEIGHTS,
    REFERENCE_BW: REFERENCE_BW,
    tierThreshold: tierThreshold,
    bwThreshold: bwThreshold,
    computeRank: computeRank,
  };
})(window);
