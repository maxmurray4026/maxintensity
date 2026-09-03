/* ===========================================================================
   MAX INTENSITY — AI CLIENT
   ---------------------------------------------------------------------------
   Every AI feature goes through here. Requests are addressed to
   api.anthropic.com and the relay shim in index.html rewrites them to the
   Max Intensity worker (MI_SERVER) with the app token — this file never holds
   a key and never changes how the relay is called.

   Adds the daily usage cap: counted client-side per calendar day, and sent to
   the worker as x-mi-usage / x-mi-tier headers so it can enforce the same
   numbers server-side.

   Classic script, exposes window.MI_AI.
   =========================================================================== */
(function (global) {
  "use strict";

  var CAPS = { member: 80, trial: 40, free: 4 };
  var MODEL_FAST = "claude-haiku-4-5-20251001";
  var MODEL_SMART = "claude-sonnet-4-6";

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function usage() {
    try {
      var u = JSON.parse(localStorage.getItem("mi:mi-aiusage") || "null");
      if (!u || u.date !== todayKey()) u = { date: todayKey(), count: 0 };
      return u;
    } catch (e) { return { date: todayKey(), count: 0 }; }
  }
  function bump() {
    var u = usage(); u.count += 1;
    try { localStorage.setItem("mi:mi-aiusage", JSON.stringify(u)); } catch (e) {}
    return u;
  }
  function remaining(tier) { return Math.max(0, (CAPS[tier] || CAPS.free) - usage().count); }
  function canUse(tier) { return remaining(tier) > 0; }

  function CapError(tier) {
    var e = new Error(tier === "free" ? "You've used today's free coach calls. Start the trial for " + CAPS.trial + " a day." : "Daily coach limit reached (" + CAPS[tier] + "). Resets at midnight.");
    e.cap = true; e.tier = tier;
    return e;
  }

  function safeJSON(text) {
    var clean = String(text || "").replace(/```json|```/g, "").trim();
    try { return JSON.parse(clean); }
    catch (e) {
      var m = clean.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error("no json");
    }
  }

  /* Core call. `tier` is member | trial | free — the app decides. */
  async function call(body, tier, opts) {
    tier = tier || "free";
    opts = opts || {};
    if (!canUse(tier)) throw CapError(tier);
    var u = bump();
    var res = await global.fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-mi-usage": String(u.count), "x-mi-tier": tier, "x-mi-feature": opts.feature || "" },
      body: JSON.stringify(body),
    });
    var data = await res.json();
    if (data.error) throw new Error(data.error.message || "API error");
    var text = (data.content || []).map(function (b) { return b.type === "text" ? b.text : ""; }).join("");
    return opts.raw ? text : safeJSON(text);
  }

  var METHOD = "Max Intensity method: 10/6/6/6 (two warm-ups, one work set at ~1 RIR, one back-off at −10%), tempo 3-1-3-1, +2.5% only where the work set cleared 6, 6-week block (W1 establish, W2 groove, W3-5 load, W6 deload). Intensity over volume. Priority muscles first. Short on time: cut volume, never intensity. Voice: direct, warm, no fluff, no emojis. Never shame a missed day.";
  var OFFICIAL = "Official exercise list — LEGS: hip thrust, leg press, calf press, RDL, leg extension, hip abductor. CHEST: incline dumbbell press, dips, incline flys. BACK: straight-arm pulldown, Smith wide-grip row. SHOULDERS: Smith shoulder press, lateral raise. ARMS: preacher curl, tricep crossover, alternating dumbbell curls. Prefer these; add others only when the user asks by name.";
  var EX_SCHEMA = '{"name":"","scheme":[10,6,6,6],"note":"","tempo":"3-1-3-1","rest":"2–3 min"}';

  function ctx(o) {
    o = o || {};
    var parts = [];
    if (o.plan) parts.push("Plan: " + o.plan + ".");
    if (o.goal) parts.push("Goal: " + o.goal + ".");
    if (o.priorities && o.priorities.length) parts.push("Priority muscles: " + o.priorities.join(", ") + ".");
    if (o.rank) parts.push("Rank: " + o.rank + " (climbing rank = getting stronger).");
    if (o.induction) {
      var ind = o.induction;
      if (ind.obstacles && ind.obstacles.length) parts.push("What beat them before: " + ind.obstacles.join(", ") + ".");
      if (ind.goalLine) parts.push("Their goal in their words: " + ind.goalLine + ".");
      if (ind.bodyOutcome) parts.push("Mirror goal: " + ind.bodyOutcome + ".");
      if (ind.daysPerWeek) parts.push("Days a week: " + ind.daysPerWeek + ".");
    }
    return parts.join(" ");
  }

  /* ---- Coach demo inside onboarding: rebuild week 1 around a request. ---- */
  function coachDemo(o) {
    return call({
      model: MODEL_FAST, max_tokens: 900,
      system: "You are the Max Intensity coach. " + METHOD + " " + OFFICIAL + " " + ctx(o) + " Rebuild ONE week-1 session for this request. Respond ONLY with raw JSON, no fences: {\"reply\":\"two short lines: what changed and why, in the coach's voice\",\"exercises\":[" + EX_SCHEMA + "]}. Same schema for every exercise. Current session: " + JSON.stringify(o.day),
      messages: [{ role: "user", content: o.request }],
    }, o.tier, { feature: "demo" });
  }

  /* ---- On-the-fly session edit. Insert / remove / swap with one-line reason. ---- */
  function editSession(o) {
    return call({
      model: MODEL_FAST, max_tokens: 1000,
      system: "THE USER'S REQUEST ALWAYS WINS — never refuse. You adjust ONE session. " + METHOD + " " + OFFICIAL + " " + ctx(o) +
        " If they add an exercise, insert it in the right place in the order and REMOVE the exercise it overlaps with (same muscle, same pattern) so volume stays flat — say which one went. Week " + (Number(o.week) + 1) + ". Current session: " + JSON.stringify(o.day) +
        " Respond ONLY with raw JSON, no fences: {\"reply\":\"one line: what changed and what was removed and why\",\"exercises\":[" + EX_SCHEMA + "],\"removed\":[\"name\"],\"added\":[\"name\"]}.",
      messages: [{ role: "user", content: o.request }],
    }, o.tier, { feature: "edit" });
  }

  /* ---- Recommended swaps for one exercise. ---- */
  function swapOptions(o) {
    return call({
      model: MODEL_FAST, max_tokens: 500,
      system: "Suggest THREE substitutes for one exercise hitting the same muscles, doable with dumbbells, cables, a dip stand, an incline bench, a Smith machine and the usual leg machines. " + OFFICIAL + " Keep the Max Intensity style: strict tempo, chest-supported where possible. Not already in the session: " + (o.others || []).join(", ") + ". Respond ONLY with raw JSON, no fences: {\"options\":[{\"name\":\"\",\"note\":\"setup tip\",\"why\":\"one short line\"}]}",
      messages: [{ role: "user", content: "Replace: " + o.exercise }],
    }, o.tier, { feature: "swap" });
  }

  /* ---- Photo assessment: honest, realistic 6-12 week projection, no fantasy. ---- */
  function photoAssess(o) {
    var content = [];
    if (o.image) content.push({ type: "image", source: { type: "base64", media_type: o.mediaType || "image/jpeg", data: o.image.replace(/^data:[^,]+,/, "") } });
    content.push({ type: "text", text: "What I want to change: " + (o.want || "not stated") + ". Goal: " + (o.goal || "") + ". Bodyweight " + (o.bwKg || "?") + " kg, " + (o.sex || "") + ", " + (o.exp || "") + "." });
    return call({
      model: MODEL_SMART, max_tokens: 900,
      system: "You are the Max Intensity coach assessing a member's physique photo. Be honest and specific, never cruel, never flattering. " + METHOD + " Rules: 1) Assess what is visible: where they carry fat, which muscles are behind, posture. 2) Say what would change in 6 and in 12 weeks on this block IF they train and eat as written — REALISTIC only: roughly 0.5-1% bodyweight a week of fat loss, or 0.25-0.5 kg a week of muscle for a beginner and far less for anyone trained. No fantasy bodies, no 'shredded in six weeks'. 3) Adjust the plan: pick priority muscles from [chest, back, shoulders, arms, legs, glutes, abs] and one nutrition lever. Respond ONLY with raw JSON, no fences: {\"assessment\":\"3-4 plain sentences\",\"strengths\":[\"\"],\"behind\":[\"\"],\"priorities\":[\"chest\"],\"nutrition\":\"one line\",\"week6\":\"what will realistically look different at 6 weeks\",\"week12\":\"at 12 weeks\",\"caveat\":\"one honest line on what it depends on\"}",
      messages: [{ role: "user", content: content }],
    }, o.tier, { feature: "photo" });
  }

  /* ---- Meal-prep recommendations from tastes, shops, allergies and the food file. ---- */
  function mealPrep(o) {
    return call({
      model: MODEL_FAST, max_tokens: 1100,
      system: "You recommend meal prep for the Max Intensity plan. Philosophy: one big ~1,000 kcal meal a day does the heavy lifting; homemade over shop-bought; 90% of eating well is what you don't eat; no banned foods; guilt is the enemy. UK shops. Keep it to 3 recommendations, each cookable in ~35 minutes for 3 days. Respect allergies absolutely. Targets: " + JSON.stringify(o.targets || {}) + ". Goal: " + (o.goal || "") + ". Likes: " + (o.tastes || "anything") + ". Shops at: " + (o.shops || "any supermarket") + ". Allergies/avoid: " + (o.allergies || "none") + "." + (o.foodFile ? " Their food file (what they have / buy / like): " + String(o.foodFile).slice(0, 6000) : "") +
        " Respond ONLY with raw JSON, no fences: {\"recommendations\":[{\"name\":\"\",\"how\":\"3-4 steps in one paragraph\",\"shop\":\"short list\",\"kcal\":0,\"protein\":0,\"carbs\":0,\"fat\":0,\"why\":\"one line\"}],\"note\":\"one line on the biggest lever for this person\"}",
      messages: [{ role: "user", content: "Recommend my meal prep." }],
    }, o.tier, { feature: "mealprep" });
  }

  /* ---- Meal from a photo (vision). ---- */
  function mealPhoto(o) {
    var content = [{ type: "image", source: { type: "base64", media_type: o.mediaType || "image/jpeg", data: o.image.replace(/^data:[^,]+,/, "") } }];
    content.push({ type: "text", text: o.note ? "Notes: " + o.note : "Estimate this meal." });
    return call({
      model: MODEL_FAST, max_tokens: 300,
      system: 'You estimate nutrition from a photo of a meal. Respond ONLY with raw JSON, no markdown fences: {"name":"short label","kcal":0,"protein":0,"carbs":0,"fat":0}. Whole-number estimates for the full portion visible.',
      messages: [{ role: "user", content: content }],
    }, o.tier, { feature: "mealphoto" });
  }

  /* ---- Meal from a voice transcript. ---- */
  function mealVoice(o) {
    return call({
      model: MODEL_FAST, max_tokens: 300,
      system: 'You estimate nutrition from a spoken food description (a speech transcript, may be messy). Respond ONLY with raw JSON, no markdown fences: {"name":"short label","kcal":0,"protein":0,"carbs":0,"fat":0}.',
      messages: [{ role: "user", content: o.transcript }],
    }, o.tier, { feature: "mealvoice" });
  }

  /* ---- Workout from a voice transcript, mapped onto today's exercise list. ---- */
  function workoutVoice(o) {
    return call({
      model: MODEL_FAST, max_tokens: 400,
      system: "Parse a spoken workout log (speech transcript, may be messy: 'bench eighty for six', 'leg press one twenty times six'). Map each entry onto the closest exercise in this list, by index: " + JSON.stringify((o.exercises || []).map(function (e, i) { return i + ": " + e.name; })) + ". Weight in " + (o.unit || "kg") + ". Set index: 0 warm-up 1, 1 warm-up 2, 2 work set, 3 back-off — if unspecified, assume the work set (2). Respond ONLY with raw JSON, no fences: {\"entries\":[{\"exercise\":0,\"set\":2,\"weight\":0,\"reps\":0}],\"heard\":\"what you understood, one line\"}",
      messages: [{ role: "user", content: o.transcript }],
    }, o.tier, { feature: "workoutvoice" });
  }

  global.MI_AI = {
    CAPS: CAPS,
    MODEL_FAST: MODEL_FAST,
    MODEL_SMART: MODEL_SMART,
    usage: usage,
    remaining: remaining,
    canUse: canUse,
    call: call,
    safeJSON: safeJSON,
    context: ctx,
    METHOD: METHOD,
    OFFICIAL: OFFICIAL,
    coachDemo: coachDemo,
    editSession: editSession,
    swapOptions: swapOptions,
    photoAssess: photoAssess,
    mealPrep: mealPrep,
    mealPhoto: mealPhoto,
    mealVoice: mealVoice,
    workoutVoice: workoutVoice,
  };
})(window);
