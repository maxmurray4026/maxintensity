/* ===========================================================================
   MAX INTENSITY — PROJECTION, PLAN NAMING, LEVELS, SESSION GRADING
   ---------------------------------------------------------------------------
   Pure functions, no DOM. Classic script, exposes window.MI_PROJ.

   Everything here is deliberately conservative. The projection is the app's
   promise, so it is built from the block's own rule (+2.5% a session once the
   work set clears 6, no load change in W1-2, deload in W6) and from textbook
   bodyweight rates — never from a fantasy body.
   =========================================================================== */
(function (global) {
  "use strict";

  /* ---- plan naming by outcome. Never "General". ---- */
  var PLAN_NAMES = {
    "Build muscle": { name: "MASS GAINER", line: "Built to add size where you want it.", short: "Mass" },
    "Lose fat": { name: "SHREDDER", line: "Built to drop the weight and keep the strength.", short: "Shred" },
    "More athletic": { name: "ATHLETE", line: "Built to make you faster, fitter and harder to tire out.", short: "Athlete" },
  };
  function planName(goal) {
    return PLAN_NAMES[goal] || PLAN_NAMES["Build muscle"];
  }

  /* ---- XP levels. Points already exist (+10 a set, +5 a day, streak bonuses).
     Level thresholds rise quadratically so early levels come fast. ---- */
  var LEVEL_TITLES = ["Recruit", "Regular", "Grinder", "Operator", "Contender", "Veteran", "Enforcer", "Heavyweight", "Champion", "Legend"];
  function levelFor(points) {
    var p = Math.max(0, Number(points) || 0);
    var level = Math.floor(Math.sqrt(p / 120)) + 1; // L2 at 120, L3 at 480, L5 at 1920, L10 at 9720
    var floor = Math.pow(level - 1, 2) * 120;
    var next = Math.pow(level, 2) * 120;
    return {
      level: level,
      title: LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, level - 1)] + (level > LEVEL_TITLES.length ? " " + (level - LEVEL_TITLES.length + 1) : ""),
      floor: floor,
      next: next,
      pct: Math.min(100, Math.round(((p - floor) / (next - floor)) * 100)),
      toNext: Math.max(0, next - p),
    };
  }

  /* ---- Lift curve across the block (week index 0..6, 0 = today).
     W1 establish and W2 groove hold the load; W3, W4, W5 each add 2.5% where 6
     was cleared; W6 deload holds. A beginner's first block carries a larger
     neural gain, capped. `clearRate` is the share of work sets that clear. ---- */
  function liftCurve(start, opts) {
    opts = opts || {};
    var s = Number(start) || 0;
    var exp = opts.exp || "";
    var clearRate = opts.clearRate != null ? opts.clearRate : (exp === "Just starting" ? 0.9 : exp === "3+ years" ? 0.6 : 0.75);
    var novice = exp === "Just starting" ? 1.6 : exp === "1–3 years" ? 1.15 : 1.0;
    var step = 0.025 * clearRate * novice;
    var pts = [], v = s;
    for (var w = 0; w <= 6; w++) {
      if (w >= 3 && w <= 5) v = v * (1 + step);
      pts.push({ w: w, v: round2p5(v, w === 0 ? 0 : 1) });
    }
    return pts;
  }
  function round2p5(v, on) { return on ? Math.round(v / 1.25) * 1.25 : Math.round(v * 10) / 10; }

  /* ---- Bodyweight curve. Rates are per week, as a share of bodyweight. ---- */
  var BW_RATE = { "Lose fat": -0.006, "Build muscle": 0.0025, "More athletic": -0.002 };
  function bodyweightCurve(startKg, goal, weeks) {
    var s = Number(startKg) || 0, r = BW_RATE[goal] != null ? BW_RATE[goal] : 0;
    var n = weeks || 6, pts = [];
    for (var w = 0; w <= n; w++) pts.push({ w: w, v: Math.round(s * (1 + r * w) * 10) / 10 });
    return pts;
  }

  /* ---- Reps curve for the bodyweight-tested route (press-ups etc.). ---- */
  function repsCurve(start, exp) {
    var s = Number(start) || 0, pts = [];
    var gain = exp === "Just starting" ? 0.12 : 0.07;
    var v = s;
    for (var w = 0; w <= 6; w++) { if (w >= 2) v = v * (1 + gain); pts.push({ w: w, v: Math.round(v) }); }
    return pts;
  }

  /* ---- The headline projection for the funnel and the progress page.
     ob: { goal, bw (kg), exp, knowsLiftNumbers, strength:{bench|pushups...} }
     Returns { metric, key, label, unit, points, at3, at6, start, caption }.  ---- */
  function projection(ob) {
    ob = ob || {};
    var goal = ob.goal || "Build muscle";
    var bwKg = Number(ob.bwKg || ob.bw) || 0;
    var strength = ob.strength || {};
    var useBw = goal === "Lose fat" && bwKg > 0;
    if (useBw) {
      var pts = bodyweightCurve(bwKg, goal, 6);
      return {
        metric: "bodyweight", key: "bw", label: "Bodyweight", unit: "kg", points: pts,
        start: pts[0].v, at3: pts[3].v, at6: pts[6].v,
        caption: "Steady fat loss at ~0.6% of bodyweight a week, strength held on the bar. Not a crash.",
      };
    }
    if (ob.knowsLiftNumbers === "bodyweight") {
      var start = Number(strength.pushups) || 10;
      var rp = repsCurve(start, ob.exp);
      return {
        metric: "reps", key: "pushups", label: "Press-ups in one set", unit: "reps", points: rp,
        start: rp[0].v, at3: rp[3].v, at6: rp[6].v,
        caption: "Reps in one strict set. The rank ladder uses the same test.",
      };
    }
    var bench = Number(strength.bench) || (bwKg ? Math.round((bwKg * 0.5) / 2.5) * 2.5 : 40);
    var lc = liftCurve(bench, { exp: ob.exp });
    return {
      metric: "lift", key: "bench", label: "Bench press", unit: "kg", points: lc,
      start: lc[0].v, at3: lc[3].v, at6: lc[6].v,
      caption: "+2.5% every session the work set clears 6. Two weeks to set the loads, three to move them, one to deload. Realistic, not a fantasy.",
    };
  }

  /* ---- Twelve-week view for the photo assessment. Two blocks back to back. ---- */
  function projection12(ob) {
    var p6 = projection(ob);
    var out = p6.points.slice();
    var last = out[out.length - 1].v;
    var second;
    if (p6.metric === "bodyweight") second = bodyweightCurve(last, ob.goal, 6);
    else if (p6.metric === "reps") second = repsCurve(last, ob.exp === "Just starting" ? "1–3 years" : ob.exp);
    else second = liftCurve(last, { exp: ob.exp === "Just starting" ? "1–3 years" : ob.exp });
    second.slice(1).forEach(function (p) { out.push({ w: p.w + 6, v: p.v }); });
    return { metric: p6.metric, label: p6.label, unit: p6.unit, points: out, start: out[0].v, at6: out[6].v, at12: out[12].v };
  }

  /* ---- Rank after the block, if every number moves with the bench curve. ---- */
  function rankProjection(entries, sex, bwKg, exp) {
    if (!global.MI_RANK) return null;
    var factor = liftCurve(100, { exp: exp })[6].v / 100;
    var moved = (entries || []).map(function (e) {
      var isLift = !!global.MI_RANK.LIFTS.some(function (l) { return l.key === e.key; });
      return { key: e.key, value: isLift ? Number(e.value) * factor : Math.round(Number(e.value) * (1 + (factor - 1) * 2.5)) };
    });
    return global.MI_RANK.computeRank(moved, sex, bwKg);
  }

  /* ---- Estimated current strength from the block's logged work sets: the
     rank numbers scaled by the overall work-set gain versus week 1. ---- */
  function blockGain(program, logs) {
    try {
      var weekly = [];
      for (var w = 0; w < 5; w++) {
        var tot = 0, n = 0;
        program.days.forEach(function (d, di) {
          (d.exercises || []).forEach(function (_, ei) {
            var v = Number((((logs["w" + w + "-d" + di] || {})[ei] || {}).sets || [])[2] && logs["w" + w + "-d" + di][ei].sets[2].weight) || 0;
            if (v > 0) { tot += v; n++; }
          });
        });
        if (n > 0) weekly.push({ w: w, avg: tot / n, n: n });
      }
      if (weekly.length < 2) return { pct: 0, weeks: weekly.length, weekly: weekly };
      var first = weekly[0], last = weekly[weekly.length - 1];
      return { pct: Math.round(((last.avg - first.avg) / first.avg) * 1000) / 10, weeks: weekly.length, weekly: weekly };
    } catch (e) { return { pct: 0, weeks: 0, weekly: [] }; }
  }

  /* ---- Session grade. Honest and simple: did the work get done, did it move. ---- */
  function sessionGrade(o) {
    o = o || {};
    var planned = Math.max(1, o.setsPlanned || 1), logged = o.setsLogged || 0;
    var completion = logged / planned;
    var score = completion * 60;                       // showing up and finishing is 60% of the grade
    score += Math.min(25, (o.prs || 0) * 12);          // a PR is worth a lot
    if (o.gainPct > 0) score += Math.min(15, o.gainPct * 3);
    if (o.avgRir != null) score += o.avgRir <= 1.5 ? 5 : o.avgRir >= 3 ? -5 : 0;
    score = Math.max(0, Math.min(100, Math.round(score)));
    var letter = score >= 92 ? "A+" : score >= 82 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D";
    var line = letter === "A+" ? "Textbook. Every set, and the bar moved." : letter === "A" ? "That's the method. Leave and grow." : letter === "B" ? "Solid work. Full session next time and it's an A." : letter === "C" ? "Half a session still counts. Pick it back up." : "Showed up. That's the skill — now finish one.";
    return { score: score, letter: letter, line: line };
  }

  function volume(items) {
    var v = 0;
    (items || []).forEach(function (it) { (it.sets || []).forEach(function (s) { v += (Number(s.w) || 0) * (Number(s.r) || 0); }); });
    return Math.round(v);
  }

  /* ---- Deterministic short-on-time rebuild. Cuts warm-ups and rests first,
     then converts to a circuit, keeping whatever the user asked to prioritise.
     Volume gets cut, intensity never does. ---- */
  function shortOnTime(day, minutes, priority) {
    var exs = (day.exercises || []).map(function (e) { return JSON.parse(JSON.stringify(e)); });
    var pri = (priority || "").toLowerCase();
    if (pri) {
      var hit = [], rest = [];
      exs.forEach(function (e) { ((e.name || "").toLowerCase().indexOf(pri) !== -1 ? hit : rest).push(e); });
      exs = hit.concat(rest);
    }
    var m = Number(minutes) || 40;
    var keep = m >= 45 ? exs.length : m >= 40 ? Math.min(exs.length, 5) : m >= 30 ? Math.min(exs.length, 4) : Math.min(exs.length, 3);
    exs = exs.slice(0, keep);
    var circuit = m < 40;
    exs.forEach(function (e, i) {
      e.scheme = m >= 45 ? [6, 6, 6] : [6, 6];       // drop warm-up 1 (and 2 under 45): the work set is the session
      e.rest = circuit ? "60–90 s, move on" : "90 s";
      e.tempo = "3-1-3-1";
      if (circuit) e.note = (i % 2 === 0 ? "Circuit A" : "Circuit B") + (e.note ? " · " + e.note : "");
    });
    var cut = (day.exercises || []).length - exs.length;
    var reply = m + " min: " + (m >= 45 ? "warm-up 1 dropped, rest tightened" : "warm-ups dropped, rest cut to 60–90 s") +
      (circuit ? ", paired as a circuit" : "") + (cut > 0 ? ", last " + cut + " exercise" + (cut > 1 ? "s" : "") + " cut" : "") +
      (pri ? ". " + capitalise(pri) + " leads." : ". Work sets untouched.");
    return { exercises: exs, reply: reply };
  }
  function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ---- RIR coaching. What the reading on this set means for the next one.
     Consistent with the +2.5% rule: the rule decides next week; RIR only
     tunes today's back-off and the warm-up-to-work jump. ---- */
  function rirAdvice(setIndex, rir, isDeload) {
    var r = Number(rir);
    if (isDeload) return { next: 0, line: "Deload — keep it easy, the fitness shows next block." };
    if (setIndex === 1) {                               // after warm-up 2, before the work set
      if (r >= 4) return { next: 0.05, line: "Plenty left. Go up 5% for the work set — it should be 1 in reserve." };
      if (r >= 3) return { next: 0.025, line: "Add 2.5% for the work set. Own the tempo." };
      if (r <= 1) return { next: -0.05, line: "That was nearly the work set. Drop 5% so the real one lands at 1 in reserve." };
      return { next: 0, line: "Right where it should be. Same load, this one counts." };
    }
    if (setIndex === 2) {                               // after the work set
      if (r >= 3) return { next: -0.05, line: "Too easy for a work set. Back-off at −5% only, and it's +2.5% next week." };
      if (r === 2) return { next: -0.075, line: "Cleared with a bit in hand. Back-off at −7.5%. +2.5% next week." };
      if (r === 1) return { next: -0.1, line: "Textbook — 1 in reserve. Back-off at −10%." };
      return { next: -0.15, line: "Nothing left. Back-off at −15% and hold this load next week until it's 1 in reserve." };
    }
    return { next: 0, line: "" };
  }

  global.MI_PROJ = {
    PLAN_NAMES: PLAN_NAMES,
    planName: planName,
    levelFor: levelFor,
    liftCurve: liftCurve,
    bodyweightCurve: bodyweightCurve,
    repsCurve: repsCurve,
    projection: projection,
    projection12: projection12,
    rankProjection: rankProjection,
    blockGain: blockGain,
    sessionGrade: sessionGrade,
    volume: volume,
    shortOnTime: shortOnTime,
    rirAdvice: rirAdvice,
  };
})(window);
