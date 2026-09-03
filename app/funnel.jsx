/* MAX INTENSITY — enrollment funnel. One decision a screen, big tap targets,
   every screen says what it gets you. Exposes MI.Funnel and MI.Paywall.

   Props
     initial    answers to start from (the app's `ob`)
     buildDay   (priorities, goal) => week-1 session used by the coach demo
     onPhoto    (dataUrl) persist the before photo as soon as it's taken
     loadProof  () => Promise<{ members, topStreak, bestLift, posts }|null>
     onFinish   (result) hand everything back to the app
     trialDays  number */
try {
(function (MI) {
  const { useState, useEffect, useRef } = React;
  const { card, cta, ghost, eyebrow } = MI.ui;

  const OBSTACLES = [
    ["motivation", "Lost motivation after a couple of weeks", "Every session moves your rank and your streak. You see the number you have to beat before you walk in, and the flame you lose if you don't."],
    ["direction", "Didn't know what to do next", "Six weeks, four sessions, every set written down. You never decide the session at the gym again."],
    ["time", "No time", "Short-on-time mode cuts warm-ups and rests, pairs a circuit and keeps the work set. Thirty minutes still counts."],
    ["injury", "A niggle turned into a stop", "Tempo 3-1-3-1 at one rep in reserve. Nothing bounced, nothing maxed. Tell the coach and it swaps the exercise, not the session."],
    ["diet", "Food fell apart at the weekend", "One big meal a day, five days a week. Guilt is the enemy — one day back on track counts as progress, not failure."],
    ["travel", "Travel and shifts", "Rebuild any session in plain language: 'hotel gym, dumbbells only'. Plan rest days on the calendar so a missed day isn't a missed week."],
    ["burnout", "Went too hard and burned out", "Low volume, high intensity, full rest between sets. Week 6 is a deload written into the block, not a sign you failed."],
    ["alone", "Nobody noticed", "A rank, a leaderboard and a wall where people post real results. Here, progress is status."],
  ];

  const BLOCKER_ANSWER = {
    direction: "You'll know the exact weight before you walk in.",
    momentum: "Every session moves the rank. That's what keeps you in it.",
    time: "Two sessions a week, upper and legs. That's the floor that still works.",
    ceiling: "+2.5% a session, every session. That's the ceiling moving.",
  };

  const PRICES = { monthly: 30, yearly: 240, human: 200 };

  MI.Funnel = ({ initial, buildDay, onPhoto, loadProof, onFinish, trialDays = 7 }) => {
    const [ob, setOb] = useState(() => ({
      name: "", email: "", handle: "", sex: "", goal: "", exp: "", daysPerWeek: 4, unit: "kg", bw: "80",
      hardWorkNoChange: "", quitBefore: "", trainingStatus: "", sessionUnplanned: "", mainBlocker: "",
      bodyOutcome: "", beforePhoto: null, knowsLiftNumbers: "lifts", strength: {}, rank: null,
      priorities: [], obstacles: [], ...(initial || {}),
    }));
    const [step, setStep] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [demo, setDemo] = useState({ phase: "proposed" });
    const [demoLine, setDemoLine] = useState(0);
    const [flame, setFlame] = useState(false);
    const [proof, setProof] = useState(undefined);
    const [plan, setPlan] = useState("yearly");
    const [downsell, setDownsell] = useState(false);

    const set = (k, v) => setOb((o) => ({ ...o, [k]: v }));

    /* ---- the screens, in order ---- */
    const STEPS = [
      { k: "hardWorkNoChange", kind: "choice", q: "Do you train hard and still look the same?", sub: "The work goes in. The mirror does not move.",
        opts: [["yes", "Yes"], ["sometimes", "Some of the time"], ["notyet", "I'm not training yet"]], out: "Effort isn't the problem. Direction is. That's fixable in six weeks." },
      { k: "quitBefore", kind: "choice", q: "Have you started a program and quit before it finished?", sub: "Most programs have no end date, so they end whenever you stop. Six weeks has an end date.",
        opts: [["once", "Yes"], ["multiple", "More than once"], ["never", "No"]], out: "A block with an end date is a block you can finish." },
      { k: "trainingStatus", kind: "choice", q: "Where is your training right now?", sub: "It only changes where you start.",
        opts: [["none", "Not training", "Starting from zero"], ["intermittent", "On and off", "Some weeks yes, some no"], ["consistent", "In every week", "Already showing up"]], out: "Wherever you start, the first two weeks set your loads. Nothing is assumed." },
      { k: "sessionUnplanned", kind: "choice", q: "Do you decide the session when you get there?", sub: "You turn up. Your program should already know the number you have to beat.",
        opts: [["yes", "Yes"], ["sometimes", "Sometimes"], ["no", "No"]], out: "Every set is written before you walk in. You just beat last week." },
      { k: "mainBlocker", kind: "choice", q: "What actually gets in the way?", sub: "Whichever one it actually is.",
        opts: [["direction", "Not knowing what to do next"], ["momentum", "Losing momentum"], ["time", "Time"], ["ceiling", "Nothing — I want more out of what I already do"]], out: "The system is built to handle exactly this. You'll see how before you're done." },
      { k: "goal", kind: "choice", q: "What do you want out of the next six weeks?", sub: "Say it plainly. The block gets built around this.",
        opts: [["Lose fat", "Lose fat", "Keep your strength, drop the weight"], ["Build muscle", "Build muscle", "Add size where you want it"], ["More athletic", "More athletic", "Fitter, faster, harder to tire out"]], out: "This names your plan. Never 'general' — yours." },
      { k: "bodyOutcome", kind: "choice", q: "What do you want to see in the mirror?", sub: "Six weeks from now, same light, same photo.",
        opts: [["lean", "Lean and defined", "Less around the middle, shape you can see"], ["big", "Bigger and heavier", "More size on your arms, chest and back"], ["capable", "Strong and capable", "Lift heavy, move well, stay hard to break"]], out: "Your before photo and your rank measure this. Not a feeling — a number and a picture." },
      { k: "sex", kind: "choice", q: "Strength standards are set by sex.", sub: "It sets your rank thresholds and your food targets. Nothing else.",
        opts: [["Male", "Male"], ["Female", "Female"]], out: "Fair thresholds, so your rank means something." },
      { k: "bw", kind: "weight", q: "What do you weigh right now?", sub: "Rough is fine. It is the number your progress gets measured from.", out: "Rank is strength relative to bodyweight. A lighter bar still counts." },
      { k: "exp", kind: "choice", q: "Time in the gym", sub: "Sets how fast the projection expects you to move.",
        opts: [["Just starting", "Just starting", "First block ever"], ["1–3 years", "1–3 years", "Know the movements"], ["3+ years", "3+ years", "Know exactly what stalls"]], out: "Beginners move fastest. The projection is honest about that either way." },
      { k: "knowsLiftNumbers", kind: "choice", q: "Do you know what you lift?", sub: "Either answer, you walk out of here with a number to beat.",
        opts: [["lifts", "I know my numbers", "Bench, squat, overhead press"], ["bodyweight", "I train without tracking numbers", "Your rank comes off reps in one set"]], out: "Three numbers. That's your rank." },
      { k: "strength", kind: "numbers", q: "Set your three numbers", sub: "Best single rep you are confident in. A close estimate is enough.", out: "Climbing rank is how you'll get stronger. This is where you start." },
      { k: "beforePhoto", kind: "photo", q: "Take your before photo", sub: "In six weeks this is the only thing that will not argue with you. Stored on your phone, never uploaded.", out: "Weekly check-ins go next to this. Before vs now, side by side." },
      { k: "rankArmed", kind: "armed", q: "Seven ranks. Every one you climb is a heavier bar.", sub: "Bronze to Iridescent. Everyone on the app sits somewhere on this ladder." },
      { k: "rank", kind: "reveal", q: "" },
      { k: "projection", kind: "projection", q: "" },
      { k: "priorities", kind: "priorities", q: "What do you want to build first?", sub: "Priority muscles go first in every session — they get your best energy. Pick up to three.", out: "The order of the session is the program. What you pick leads." },
      { k: "demo", kind: "demo", q: "" },
      { k: "plan", kind: "plan", q: "" },
      { k: "obstacles", kind: "multi", q: "What beat you before?", sub: "Pick everything that applies. The next screen shows how the system handles each one.", out: "Nothing here is new. It's all been solved for someone before you." },
      { k: "induction", kind: "induction", q: "How the system handles it", sub: "One answer for each thing you picked." },
      { k: "daysPerWeek", kind: "choice", q: "Days per week", sub: "The block is built on 4. Pick what you'll actually hit.",
        opts: [[3, "3", "Upper, Legs, Upper — still works"], [4, "4", "The block as written"], [5, "5", "Four sessions plus a focus day"]], out: "Showing up is the skill. Pick the number you'll keep." },
      { k: "commit", kind: "hold", q: "Ignite the streak", sub: "Hold the flame. Day 1 starts now." },
      { k: "account", kind: "account", q: "Who's training?", sub: "Your name goes on your rank card. Email is optional — it's for your backup and the Day 5 reminder.", out: "Your rank card, your projection, your plan — saved to you." },
      { k: "proof", kind: "proof", q: "" },
      { k: "timeline", kind: "timeline", q: "" },
      { k: "paywall", kind: "paywall", q: "" },
    ];
    const N = STEPS.length;
    const st = STEPS[Math.min(step, N - 1)];
    const val = ob[st.k];

    /* ---- helpers ---- */
    const bwKg = () => { const n = Number(ob.bw); if (!n) return 0; return ob.unit === "lb" ? n / 2.2046 : n; };
    const rankRows = () => ob.knowsLiftNumbers === "bodyweight"
      ? [
          { key: "pushups", label: "Press-ups", unit: "in one set", step: 1, min: 0, max: 200 },
          { key: "bwsquats", label: "Bodyweight squats", unit: "in one set", step: 1, min: 0, max: 300 },
          { key: "pullups", label: "Pull-ups", unit: "in one set", step: 1, min: 0, max: 100 },
        ]
      : [
          { key: "bench", label: "Bench press", unit: "kg", step: 2.5, min: 20, max: 300 },
          { key: "squat", label: "Back squat", unit: "kg", step: 2.5, min: 20, max: 400 },
          { key: "ohp", label: "Overhead press", unit: "kg", step: 2.5, min: 15, max: 200 },
        ];
    const rankSeed = (key) => {
      const bw = bwKg();
      if (key === "bench") return bw ? Math.max(20, Math.round((bw * 0.5) / 2.5) * 2.5) : 40;
      if (key === "squat") return bw ? Math.max(20, Math.round((bw * 0.75) / 2.5) * 2.5) : 60;
      if (key === "ohp") return bw ? Math.max(15, Math.round((bw * 0.35) / 2.5) * 2.5) : 30;
      if (key === "pushups") return 10;
      if (key === "bwsquats") return 20;
      if (key === "pullups") return 2;
      return 0;
    };
    const rankVal = (key) => (ob.strength && ob.strength[key] !== undefined ? ob.strength[key] : rankSeed(key));
    const bumpRank = (key, delta, min, max) => setOb((o) => {
      const cur = o.strength && o.strength[key] !== undefined ? o.strength[key] : rankSeed(key);
      return { ...o, strength: { ...(o.strength || {}), [key]: Math.min(max, Math.max(min, cur + delta)) } };
    });
    const rankEntries = () => rankRows().map((r) => ({ key: r.key, value: rankVal(r.key) }));
    const computedRank = () => (window.MI_RANK ? window.MI_RANK.computeRank(rankEntries(), ob.sex, bwKg()) : null);
    const projOb = () => ({ goal: ob.goal, bwKg: bwKg(), exp: ob.exp, knowsLiftNumbers: ob.knowsLiftNumbers, strength: { ...ob.strength, bench: rankVal("bench"), pushups: rankVal("pushups") } });
    const planInfo = () => (window.MI_PROJ ? window.MI_PROJ.planName(ob.goal) : { name: "MASS GAINER", line: "" });

    const readPhoto = async (file) => {
      try { const data = await MI.downscale(file, 720, 0.7); set("beforePhoto", data); onPhoto && onPhoto(data); } catch (e) {}
    };

    const next = () => { if (step >= N - 1) return; setStep(step + 1); };
    const back = () => setStep(Math.max(0, step - 1));
    const pick = (k, v) => { set(k, v); setTimeout(() => setStep((s) => Math.min(N - 1, s + 1)), 180); };

    /* reveal: flip the card a beat after it mounts */
    useEffect(() => {
      if (st.kind !== "reveal") { setFlipped(false); return; }
      const t = setTimeout(() => { setFlipped(true); MI.sound("reveal"); }, 650);
      return () => clearTimeout(t);
    }, [step]); // eslint-disable-line
    /* proof: load once */
    useEffect(() => {
      if (st.kind !== "proof" || proof !== undefined) return;
      setProof(null);
      (async () => { try { setProof((await (loadProof ? loadProof() : null)) || false); } catch (e) { setProof(false); } })();
    }, [step]); // eslint-disable-line
    /* demo: cycle the thinking lines */
    useEffect(() => {
      if (demo.phase !== "thinking") return;
      const t = setInterval(() => setDemoLine((n) => n + 1), 1100);
      return () => clearInterval(t);
    }, [demo.phase]);

    const finish = (extra) => {
      const p = planInfo();
      const first = (ob.priorities || [])[0];
      const split = first === "legs" || first === "glutes" ? "legglute" : first === "shoulders" ? "shoulder" : first === "chest" ? "chest" : first === "arms" ? "arm" : "balanced";
      onFinish && onFinish({
        ...ob,
        name: (ob.name || "").trim() || "Athlete",
        split,
        plan: p.name,
        induction: {
          obstacles: (ob.obstacles || []).map((k) => (OBSTACLES.find((o) => o[0] === k) || [])[1]).filter(Boolean),
          obstacleKeys: ob.obstacles || [],
          blocker: ob.mainBlocker, bodyOutcome: ob.bodyOutcome, goalLine: ob.goal, daysPerWeek: ob.daysPerWeek,
          demoReply: demo.result ? demo.result.reply : "",
        },
        projection: window.MI_PROJ ? window.MI_PROJ.projection(projOb()) : null,
        ...extra,
      });
    };

    const runDemo = async () => {
      const day = buildDay ? buildDay(ob.priorities || [], ob.goal) : { name: "Upper 1", exercises: [] };
      setDemo({ phase: "thinking", day });
      setDemoLine(0);
      const request = "I've only got 40 minutes today";
      try {
        if (!window.MI_AI) throw new Error("no ai");
        const out = await window.MI_AI.coachDemo({ day, request, tier: "free", plan: planInfo().name, goal: ob.goal, priorities: ob.priorities, induction: { bodyOutcome: ob.bodyOutcome } });
        if (!out || !out.exercises || !out.exercises.length) throw new Error("empty");
        setDemo({ phase: "rebuilt", day, result: out, offline: false });
      } catch (e) {
        const fb = window.MI_PROJ ? window.MI_PROJ.shortOnTime(day, 40, (ob.priorities || [])[0]) : { exercises: day.exercises, reply: "" };
        setDemo({ phase: "rebuilt", day, result: fb, offline: true, err: e && e.cap ? e.message : "" });
      }
    };

    /* ---- pieces ---- */
    const Outcome = ({ text }) => text ? (
      <p className="mono mt-4 shrink-0 text-[11px] leading-relaxed text-neutral-500"><span className="text-[#FF2B2B]">→ </span>{text}</p>
    ) : null;

    const SessionList = ({ exercises, removed = [], added = [], dim }) => (
      <ol className={"space-y-1.5 " + (dim ? "opacity-60" : "")}>
        {exercises.map((e, i) => (
          <li key={i} className={card + " flex items-center gap-3 px-3.5 py-2.5 " + (added.some((a) => a && e.name.toLowerCase().includes(String(a).toLowerCase())) ? "border-[#FF2B2B]" : "")}>
            <span className="dp w-6 text-base text-neutral-600">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <p className="dp truncate text-[15px] uppercase tracking-wide text-neutral-100">{e.name}</p>
              <p className="mono text-[10px] text-neutral-500">{(e.scheme || []).join(" / ")} · {e.tempo || "3-1-3-1"} · {e.rest || "2–3 min"}</p>
            </div>
          </li>
        ))}
        {removed.filter(Boolean).map((r, i) => (
          <li key={"r" + i} className="mono px-3.5 text-[10px] uppercase tracking-wider text-neutral-600 line-through">{r}</li>
        ))}
      </ol>
    );

    const Choice = () => (
      <div className="space-y-2.5">
        {st.opts.map((o) => {
          const v = o[0], l = o[1], hint = o[2];
          const on = val === v;
          return (
            <button key={String(v)} onClick={() => pick(st.k, v)}
              className={"block w-full rounded-lg border px-5 py-[18px] text-left transition-colors " + (on ? "border-[#FF2B2B] bg-[#FF2B2B] text-white" : "border-neutral-800 bg-[#111] text-neutral-300 active:border-[#FF2B2B]")}>
              <span className="dp block text-lg uppercase tracking-wide">{l}</span>
              {hint && <span className={"mono mt-1 block text-[11px] " + (on ? "text-red-100" : "text-neutral-500")}>{hint}</span>}
            </button>
          );
        })}
      </div>
    );

    const Weight = () => {
      const lb = ob.unit === "lb";
      const cur = Number(ob.bw) || (lb ? 176 : 80);
      const min = lb ? 88 : 40, max = lb ? 440 : 200, stp = lb ? 1 : 0.5;
      const setW = (n) => set("bw", String(Math.min(max, Math.max(min, Math.round(n / stp) * stp))));
      return (
        <div>
          <div className="flex items-center justify-end gap-1">
            {["kg", "lb"].map((u) => (
              <button key={u} onClick={() => setOb((o) => { const n = Number(o.bw) || 80; const conv = u === "lb" ? n * 2.2046 : n / 2.2046; return { ...o, unit: u, bw: String(Math.round(conv * 2) / 2) }; })}
                className={"mono rounded px-2.5 py-1 text-[11px] " + (ob.unit === u ? "bg-[#FF2B2B] text-white" : "bg-neutral-900 text-neutral-500")}>{u}</button>
            ))}
          </div>
          <p className="mono mt-6 text-center text-[64px] font-semibold leading-none text-[#F2EFE8]">{cur}<span className="ml-2 text-xl text-neutral-500">{ob.unit}</span></p>
          <div className="mt-8 flex items-center gap-4">
            <button onClick={() => setW(cur - stp)} className="dp h-12 w-12 shrink-0 rounded-lg border border-neutral-800 bg-[#111] text-xl text-neutral-400" aria-label="Less">−</button>
            <input type="range" min={min} max={max} step={stp} value={cur} onChange={(e) => setW(Number(e.target.value))} className="mi-range h-2 flex-1" aria-label="Bodyweight" />
            <button onClick={() => setW(cur + stp)} className="dp h-12 w-12 shrink-0 rounded-lg border border-neutral-800 bg-[#111] text-xl text-neutral-400" aria-label="More">+</button>
          </div>
        </div>
      );
    };

    const Numbers = () => (
      <div className="space-y-3">
        {rankRows().map((r) => (
          <div key={r.key} className={card + " px-4 py-3"}>
            <p className="mono text-[11px] uppercase tracking-wider text-neutral-500">{r.label}</p>
            <div className="mt-1.5 flex items-center gap-3">
              <button onClick={() => bumpRank(r.key, -r.step, r.min, r.max)} className="dp h-12 w-12 shrink-0 rounded-lg border border-neutral-800 bg-[#111] text-lg text-neutral-400" aria-label={"Less " + r.label}>−</button>
              <p className="mono flex-1 text-center text-2xl font-semibold text-[#F2EFE8]">{rankVal(r.key)}<span className="ml-1.5 text-xs text-neutral-600">{r.unit}</span></p>
              <button onClick={() => bumpRank(r.key, r.step, r.min, r.max)} className="dp h-12 w-12 shrink-0 rounded-lg border border-neutral-800 bg-[#111] text-lg text-neutral-400" aria-label={"More " + r.label}>+</button>
            </div>
          </div>
        ))}
      </div>
    );

    const Photo = () => (
      <div>
        {ob.beforePhoto ? <img src={ob.beforePhoto} alt="Your before photo" className="mx-auto max-h-[38vh] rounded-lg border border-neutral-800" />
          : <div className="flex h-[38vh] items-center justify-center rounded-lg border border-dashed border-neutral-800 bg-[#0d0d0d]"><p className="mono text-xs text-neutral-700">Nothing yet</p></div>}
        <label className={cta + " mt-6 block w-full cursor-pointer py-4 text-center text-base"}>
          {ob.beforePhoto ? "Retake" : "Take photo"}
          <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) readPhoto(f); }} />
        </label>
        <p className="mono mt-3 text-center text-[10px] text-neutral-600">Stored on your phone only.</p>
      </div>
    );

    const Armed = () => (
      <div className="relative flex h-full flex-col justify-end overflow-hidden">
        <MI.Plate plate="skeleton" opacity={0.2} position="center 20%" size="auto 120%" />
        <div className="relative mb-6 flex flex-wrap gap-1.5">
          {(window.MI_RANK ? window.MI_RANK.TIERS : []).map((t, i) => (
            <span key={t} className="mono rounded border border-neutral-800 bg-[#050505]/70 px-2 py-1 text-[10px] uppercase tracking-wider" style={{ color: MI.RANK_COLORS[t] === "url(#mi-irid)" ? "#F2EFE8" : MI.RANK_COLORS[t] }}>{i + 1} · {t}</span>
          ))}
        </div>
      </div>
    );

    const Reveal = () => {
      const r = ob.rank;
      if (!r) return null;
      const blocker = BLOCKER_ANSWER[ob.mainBlocker];
      return (
        <div className="flex h-full flex-col justify-center">
          <div className="mi-card3d mx-auto w-full max-w-[320px]">
            <div className={"mi-card3d-inner " + (flipped ? "flipped" : "")}>
              <div className="mi-face relative flex h-[380px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-[#121212]">
                <MI.Plate plate="skeleton" opacity={0.2} position="center 30%" size="auto 140%" />
                <p className="dp relative text-[120px] leading-none text-neutral-800">?</p>
                <p className={eyebrow + " relative"}>Calibrating</p>
              </div>
              <div className="mi-face back absolute inset-0 flex h-[380px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#FF2B2B] bg-[#121212]">
                <MI.Plate plate="skeleton" opacity={0.16} position="center 30%" size="auto 140%" red={0.8} />
                <div className="absolute inset-x-0 top-0 h-1 bg-[#FF2B2B]" />
                <MI.RankBadge name={r.name} index={r.index} size={96} className="relative" />
                <p className={eyebrow + " relative mt-4"}>Your rank</p>
                <p className="dp relative mt-1 text-[56px] uppercase leading-[0.9] text-[#FF2B2B]">{r.name}</p>
                <p className="dp relative mt-1 text-[20px] uppercase text-[#F2EFE8]">Rank {r.index + 1} of 7</p>
              </div>
            </div>
          </div>
          <div className={card + " mt-5 px-5 py-4 transition-opacity duration-500 " + (flipped ? "opacity-100" : "opacity-0")}>
            <p className="text-sm leading-relaxed text-neutral-300">
              {r.next ? <>Climbing ranks is how you get stronger — <span className="text-[#F2EFE8]">{r.next.name}</span> takes {r.next.phrase}. Competing on rank will get you there.</>
                : <>Climbing ranks is how you get stronger — you're at the top, so all that's left is holding it at +2.5% a block.</>}
            </p>
            {blocker && <p className="mono mt-3 text-[11px] leading-relaxed text-neutral-500">{blocker}</p>}
          </div>
        </div>
      );
    };

    const Projection = () => {
      const P = window.MI_PROJ ? window.MI_PROJ.projection(projOb()) : null;
      if (!P) return null;
      const rp = window.MI_PROJ.rankProjection(rankEntries(), ob.sex, bwKg(), ob.exp);
      const W = 320, H = 170, padL = 34, padR = 30, padT = 26, padB = 26;
      const vals = P.points.map((p) => p.v);
      const mn = Math.min(...vals), mx = Math.max(...vals);
      const span = mx - mn || 1;
      const X = (w) => padL + (w / 6) * (W - padL - padR);
      const Y = (v) => padT + (1 - (v - mn) / span) * (H - padT - padB);
      const d = P.points.map((p, i) => (i ? "L" : "M") + X(p.w).toFixed(1) + "," + Y(p.v).toFixed(1)).join(" ");
      const fmt = (v) => (P.unit === "kg" ? v + " kg" : v + " reps");
      const up = P.points[6].v >= P.points[0].v;
      return (
        <div className="flex h-full flex-col">
          <p className={eyebrow}>Your projection</p>
          <p className="dp mt-2 text-[30px] uppercase leading-[0.95] text-[#F2EFE8]">Following this protocol, {P.label.toLowerCase()} <span className="text-[#FF2B2B]">here at 3 weeks, here at 6.</span></p>
          <div className="relative mt-5 overflow-hidden rounded-2xl border border-neutral-800 bg-[#0f0f0f]">
            <MI.Plate plate="skeleton" opacity={0.14} position="right 40%" size="auto 190%" />
            <div className="relative p-4">
              <div className="flex items-baseline justify-between">
                <p className="mono text-[10px] uppercase tracking-widest text-neutral-500">{P.label}</p>
                <p className="mono text-[10px] text-neutral-600">today → week 6</p>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" style={{ height: 190 }} aria-label="Projected progress">
                {[0, 3, 6].map((w) => <line key={w} x1={X(w)} x2={X(w)} y1={padT - 6} y2={H - padB + 4} stroke="#2a2a2a" strokeWidth="1" strokeDasharray="2 3" />)}
                <path d={d} fill="none" stroke="#2a2a2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke="#FF2B2B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="mi-draw" />
                <circle cx={X(0)} cy={Y(P.points[0].v)} r="4" fill="#F2EFE8" />
                <circle cx={X(3)} cy={Y(P.points[3].v)} r="5" fill="#050505" stroke="#FF2B2B" strokeWidth="2.5" className="mi-pop1" />
                <g className="mi-pop2" transform={`translate(${X(6) - 12}, ${Y(P.points[6].v) - 26})`}>
                  <circle cx="12" cy="26" r="6" fill="#FF2B2B" />
                  <path d={MI.PATHS.TROPHY} transform="translate(0,-4) scale(1)" fill="none" stroke="#F2EFE8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <text x={X(0)} y={Y(P.points[0].v) + (up ? -10 : 18)} textAnchor="start" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#9a9a9a">{fmt(P.start)}</text>
                <text x={X(3)} y={Y(P.points[3].v) + (up ? 20 : -12)} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#F2EFE8" className="mi-pop1">{fmt(P.at3)}</text>
                <text x={X(6) + 2} y={Y(P.points[6].v) + (up ? 24 : -16)} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="12" fontWeight="600" fill="#FF2B2B" className="mi-pop2">{fmt(P.at6)}</text>
                <text x={X(0)} y={H - 6} fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#666">TODAY</text>
                <text x={X(3)} y={H - 6} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#666">3 WKS</text>
                <text x={X(6)} y={H - 6} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#666">6 WKS</text>
              </svg>
              {rp && ob.rank && rp.index > ob.rank.index && (
                <div className="mt-2 flex items-center gap-2 border-t border-neutral-800 pt-3">
                  <MI.RankBadge name={ob.rank.name} index={ob.rank.index} size={26} />
                  <span className="mono text-[10px] text-neutral-500">→</span>
                  <MI.RankBadge name={rp.name} index={rp.index} size={26} />
                  <p className="mono text-[11px] text-neutral-300">On track for <span className="text-[#FF2B2B]">{rp.name}</span> by the end of the block</p>
                </div>
              )}
              <p className="mono mt-3 text-[10px] leading-relaxed text-neutral-500">{P.caption}</p>
            </div>
          </div>
        </div>
      );
    };

    const Priorities = () => {
      const sel = ob.priorities || [];
      const toggle = (k) => set("priorities", sel.includes(k) ? sel.filter((x) => x !== k) : sel.length >= 3 ? sel : [...sel, k]);
      return (
        <div>
          <MI.MuscleMap worked={sel} priority={sel} height={200} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {MI.MUSCLES.map(([k, l]) => {
              const on = sel.includes(k);
              return (
                <button key={k} onClick={() => toggle(k)} className={"rounded-lg border px-4 py-3.5 text-left " + (on ? "border-[#FF2B2B] bg-[#FF2B2B] text-white" : "border-neutral-800 bg-[#111] text-neutral-300")}>
                  <span className="dp block text-base uppercase tracking-wide">{l}</span>
                  <span className={"mono mt-0.5 block text-[10px] " + (on ? "text-red-100" : "text-neutral-500")}>{on ? "Priority " + (sel.indexOf(k) + 1) : k === "abs" ? "Adds a 10-min abs block" : "Goes first"}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    };

    const Demo = () => {
      const day = demo.day || (buildDay ? buildDay(ob.priorities || [], ob.goal) : { name: "Upper 1", exercises: [] });
      const lines = ["Reading your session", "Cutting warm-ups, keeping the work sets", "Reordering for your priority", "Tightening the rests"];
      return (
        <div className="flex h-full flex-col">
          <p className={eyebrow}>Live coach</p>
          {demo.phase === "proposed" && (
            <>
              <p className="dp mt-2 text-[30px] uppercase leading-[0.95] text-[#F2EFE8]">Your coach proposes week 1, <span className="text-[#FF2B2B]">{day.name}</span></p>
              <p className="mt-2 text-sm text-neutral-500">10/6/6/6, tempo 3-1-3-1, the third set is the work set. Now tell it you're short on time and watch it rebuild.</p>
              <div className="mt-4"><SessionList exercises={day.exercises} /></div>
            </>
          )}
          {demo.phase === "thinking" && (
            <>
              <p className="dp mt-2 text-[30px] uppercase leading-[0.95] text-[#F2EFE8]">"I've only got <span className="text-[#FF2B2B]">40 min</span>"</p>
              <div className={card + " mt-4 p-4"}>
                <p className="mono text-xs text-[#FF2B2B]">Coach is rebuilding…</p>
                <p className="mono mt-2 text-sm text-neutral-300">{lines[demoLine % lines.length]}</p>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-900"><div className="mi-scan h-1 w-1/3 rounded-full bg-[#FF2B2B]" /></div>
              </div>
              <div className="mt-4"><SessionList exercises={day.exercises} dim /></div>
            </>
          )}
          {demo.phase === "rebuilt" && (
            <>
              <p className="dp mt-2 text-[30px] uppercase leading-[0.95] text-[#F2EFE8]">Rebuilt for <span className="text-[#FF2B2B]">40 minutes</span></p>
              <div className={card + " mt-3 border-[#7f1d1d] px-4 py-3"}>
                <p className="text-sm leading-relaxed text-neutral-200">{demo.result.reply}</p>
                {demo.offline && <p className="mono mt-2 text-[10px] text-neutral-500">{demo.err || "Coach unreachable right now — this is the method's rule-based rebuild. The live coach does this in plain language once you're in."}</p>}
              </div>
              <div className="mt-3"><SessionList exercises={demo.result.exercises} removed={demo.result.removed || day.exercises.filter((e) => !demo.result.exercises.some((x) => x.name === e.name)).map((e) => e.name)} /></div>
            </>
          )}
        </div>
      );
    };

    const Plan = () => {
      const p = planInfo();
      const pri = (ob.priorities || []).map((k) => (MI.MUSCLES.find((m) => m[0] === k) || [])[1]).filter(Boolean);
      return (
        <div className="relative flex h-full flex-col justify-center overflow-hidden">
          <MI.Plate plate={pri[0] === "Legs" || pri[0] === "Glutes" ? "legs" : pri[0] === "Arms" ? "arm" : "back"} opacity={0.18} position="center 40%" size="auto 130%" />
          <div className="relative">
            <p className={eyebrow}>Your plan</p>
            <p className="dp stamp mt-2 text-[64px] uppercase leading-[0.9] text-[#FF2B2B]">{p.name}</p>
            <p className="mt-3 text-base text-neutral-300">{p.line}</p>
            <div className={card + " mt-6 space-y-2 bg-[#0f0f0f]/90 p-4"}>
              <p className="mono text-[11px] text-neutral-400"><span className="text-[#F2EFE8]">6-week block</span> · W1 Establish → W6 Deload</p>
              <p className="mono text-[11px] text-neutral-400"><span className="text-[#F2EFE8]">4-day split</span> · Upper / Legs{pri.includes("Glutes") ? " + Glute Focus" : ""}</p>
              <p className="mono text-[11px] text-neutral-400"><span className="text-[#F2EFE8]">10 / 6 / 6 / 6</span> · tempo 3-1-3-1 · ~1 in reserve</p>
              <p className="mono text-[11px] text-neutral-400"><span className="text-[#F2EFE8]">Leads with</span> · {pri.length ? pri.join(", ") : "a balanced order"}</p>
              {ob.rank && <p className="mono text-[11px] text-neutral-400"><span className="text-[#F2EFE8]">Starts at</span> · {ob.rank.name}{ob.rank.next ? " — " + ob.rank.next.name + " takes " + ob.rank.next.phrase : ""}</p>}
            </div>
          </div>
        </div>
      );
    };

    const Multi = () => {
      const sel = ob.obstacles || [];
      const toggle = (k) => set("obstacles", sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]);
      return (
        <div className="space-y-2">
          {OBSTACLES.map(([k, l]) => {
            const on = sel.includes(k);
            return (
              <button key={k} onClick={() => toggle(k)} className={"flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left " + (on ? "border-[#FF2B2B] bg-[#1c0808] text-[#F2EFE8]" : "border-neutral-800 bg-[#111] text-neutral-300")}>
                <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded border " + (on ? "border-[#FF2B2B] bg-[#FF2B2B] text-white" : "border-neutral-700")}>{on && <MI.Ic d={MI.PATHS.CHECK} className="h-3.5 w-3.5" />}</span>
                <span className="dp text-[15px] uppercase tracking-wide">{l}</span>
              </button>
            );
          })}
        </div>
      );
    };

    const Induction = () => {
      const sel = (ob.obstacles || []).length ? ob.obstacles : ["motivation", "direction"];
      return (
        <div className="space-y-2.5">
          {sel.map((k) => {
            const o = OBSTACLES.find((x) => x[0] === k); if (!o) return null;
            return (
              <div key={k} className={card + " overflow-hidden"}>
                <div className="h-0.5 w-full bg-[#FF2B2B]" />
                <div className="p-4">
                  <p className="mono text-[10px] uppercase tracking-widest text-neutral-500">{o[1]}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-200">{o[2]}</p>
                </div>
              </div>
            );
          })}
          <p className="mono pt-1 text-[10px] text-neutral-600">Saved. Your coach reads this before every answer.</p>
        </div>
      );
    };

    const Hold = () => (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <MI.HoldButton ms={1600} done={flame} label="Hold to ignite your streak" className={flame ? "mi-glow" : ""}
          onComplete={() => { setFlame(true); MI.sound("ignite"); setTimeout(() => setStep((s) => Math.min(N - 1, s + 1)), 1100); }}>
          {(p) => (
            <MI.Ic d={MI.PATHS.FLAME} fill className={"transition-all duration-150 " + (flame ? "h-24 w-24 text-[#FF2B2B]" : p > 0 ? "h-20 w-20 text-[#FF2B2B]" : "h-16 w-16 text-neutral-600")} />
          )}
        </MI.HoldButton>
        <p className={"dp mt-8 text-2xl uppercase " + (flame ? "text-[#FF2B2B]" : "text-[#F2EFE8]")}>{flame ? "Day 1. It's lit." : "Hold to ignite"}</p>
        <p className="mono mt-2 text-xs text-neutral-500">{flame ? "The flame grows every day you open the app. Miss a day, it goes out." : "One and a half seconds. Don't let go."}</p>
      </div>
    );

    const Account = () => (
      <div className="space-y-5">
        <div>
          <p className={MI.ui.label}>Name</p>
          <input autoFocus value={ob.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className="mt-1 w-full border-b-2 border-neutral-800 bg-transparent pb-3 text-2xl text-[#F2EFE8] placeholder-neutral-700 focus:border-[#FF2B2B] focus:outline-none" />
        </div>
        <div>
          <p className={MI.ui.label}>Email <span className="text-neutral-700">optional</span></p>
          <input type="email" inputMode="email" autoCapitalize="off" value={ob.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className="mono mt-1 w-full border-b-2 border-neutral-800 bg-transparent pb-3 text-lg text-[#F2EFE8] placeholder-neutral-700 focus:border-[#FF2B2B] focus:outline-none" />
        </div>
        <div>
          <p className={MI.ui.label}>Instagram handle <span className="text-neutral-700">for the leaderboard, optional</span></p>
          <input value={ob.handle || ""} onChange={(e) => set("handle", e.target.value.replace(/^@/, ""))} placeholder="@yourhandle" autoCapitalize="off" className="mono mt-1 w-full border-b-2 border-neutral-800 bg-transparent pb-3 text-lg text-[#F2EFE8] placeholder-neutral-700 focus:border-[#FF2B2B] focus:outline-none" />
        </div>
        <p className="mono text-[10px] leading-relaxed text-neutral-600">Everything stays on this phone. Export a backup any time from Settings.</p>
      </div>
    );

    const Proof = () => {
      const p = proof;
      return (
        <div className="flex h-full flex-col">
          <p className={eyebrow}>On the method</p>
          <p className="dp mt-2 text-[34px] uppercase leading-[0.95] text-[#F2EFE8]">People are already <span className="text-[#FF2B2B]">climbing</span></p>
          {p === null && <p className="mono mt-4 text-xs text-neutral-500">Loading the board…</p>}
          {p && (
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={card + " py-3"}><p className="dp text-3xl text-[#FF2B2B]">{p.members}</p><p className="mono text-[9px] uppercase text-neutral-500">on the ladder</p></div>
                <div className={card + " py-3"}><p className="dp text-3xl text-[#F2EFE8]">{p.topStreak}</p><p className="mono text-[9px] uppercase text-neutral-500">top streak</p></div>
                <div className={card + " py-3"}><p className="dp text-3xl text-[#F2EFE8]">{p.bestLift && p.bestLift.kg ? p.bestLift.kg : "—"}</p><p className="mono text-[9px] uppercase text-neutral-500">{p.bestLift && p.bestLift.name ? "kg " + p.bestLift.name : "best lift"}</p></div>
              </div>
              {(p.posts || []).slice(0, 2).map((post, i) => (
                <div key={i} className={card + " p-4"}>
                  <p className="text-sm leading-relaxed text-neutral-200">{post.text}</p>
                  <p className="mono mt-2 text-[10px] text-neutral-500">@{post.handle}{post.rank ? " · " + post.rank : ""}</p>
                </div>
              ))}
            </div>
          )}
          {p === false && (
            <div className="mt-5 space-y-3">
              <div className={card + " overflow-hidden"}>
                <div className="h-1 w-full bg-[#FF2B2B]" />
                <div className="p-4">
                  <p className="dp text-lg uppercase text-[#F2EFE8]">Founding cohort</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">The board is filling up now. The first 50 members lock their rate for life, and their names sit at the top of the ladder for good.</p>
                </div>
              </div>
              <div className={card + " p-4"}>
                <p className="text-sm leading-relaxed text-neutral-300">The method is the one a professional heavyweight fighter trains on: one hard work set, strict tempo, +2.5% every time you clear it. It doesn't need testimonials. It needs six weeks.</p>
              </div>
            </div>
          )}
        </div>
      );
    };

    const Timeline = () => {
      const nodes = [
        ["Today", "Full access", "Coach, session rebuilds, meal builder, photo assessment. Everything unlocked, no card."],
        ["Day 5", "A reminder", "We tell you two days before the trial ends. No surprises."],
        ["Day " + trialDays, "Trial ends", "Keep climbing for £" + PRICES.monthly + "/mo, or £" + PRICES.yearly + "/yr. Cancel any time before and pay nothing."],
      ];
      return (
        <div className="flex h-full flex-col">
          <p className={eyebrow}>Your trial</p>
          <p className="dp mt-2 text-[34px] uppercase leading-[0.95] text-[#F2EFE8]">{trialDays} days. <span className="text-[#FF2B2B]">Nothing to pay today.</span></p>
          <div className="relative mt-6 ml-3 border-l-2 border-neutral-800 pl-6">
            {nodes.map(([d, t, b], i) => (
              <div key={d} className={"relative pb-7 " + (i === nodes.length - 1 ? "pb-0" : "")}>
                <span className={"absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 " + (i === 0 ? "border-[#FF2B2B] bg-[#FF2B2B]" : "border-neutral-700 bg-[#050505]")} />
                <p className="mono text-[10px] uppercase tracking-widest text-[#FF2B2B]">{d}</p>
                <p className="dp mt-0.5 text-xl uppercase text-[#F2EFE8]">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">{b}</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const Paywall = () => {
      const p = planInfo();
      return (
        <div className="flex h-full flex-col">
          <p className={eyebrow}>The bridge</p>
          <p className="dp mt-2 text-[32px] uppercase leading-[0.95] text-[#F2EFE8]">A coach in your corner for <span className="text-[#FF2B2B]">£{PRICES.monthly} a month</span>, not £{PRICES.human}.</p>
          <div className={card + " mt-4 p-3.5"}>
            <div className="mono flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Human coach, weekly check-in</span><span className="text-neutral-500">£{PRICES.human}/mo</span>
            </div>
            <div className="mono mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-[#F2EFE8]">Max Intensity — on call, every set</span><span className="text-[#FF2B2B]">£{PRICES.monthly}/mo</span>
            </div>
            <div className="mt-2 h-1 rounded-full bg-neutral-900"><div className="h-1 w-[15%] rounded-full bg-[#FF2B2B]" /></div>
          </div>
          <div className="mt-4 space-y-2.5">
            {[["yearly", "Yearly", "£" + PRICES.yearly + "/yr", "£" + Math.round(PRICES.yearly / 12) + "/mo · 4 months free", "Best value"], ["monthly", "Monthly", "£" + PRICES.monthly + "/mo", "Cancel any time", null]].map(([k, l, price, subl, tag]) => {
              const on = plan === k;
              return (
                <button key={k} onClick={() => setPlan(k)} className={"relative flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left " + (on ? "border-[#FF2B2B] bg-[#1c0808]" : "border-neutral-800 bg-[#111]")}>
                  <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 " + (on ? "border-[#FF2B2B]" : "border-neutral-700")}>{on && <span className="h-3 w-3 rounded-full bg-[#FF2B2B]" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="dp block text-lg uppercase tracking-wide text-[#F2EFE8]">{l} <span className="text-[#FF2B2B]">{price}</span></span>
                    <span className="mono block text-[10px] text-neutral-500">{subl}</span>
                  </span>
                  {tag && <span className="mono absolute -top-2 right-3 rounded bg-[#FF2B2B] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white">{tag}</span>}
                </button>
              );
            })}
          </div>
          <p className="mono mt-3 text-[10px] leading-relaxed text-neutral-500">{p.name} plan, rank tracking, projection vs actual, session rebuilds in plain language, meal builder, photo check-ins and the community wall. Free {trialDays} days, then your plan. Founding members: DM Max for a locked-for-life rate — first 50 only.</p>
        </div>
      );
    };

    const Downsell = () => (
      <div className="fixed inset-0 z-[95] flex flex-col bg-[#050505] px-6 pb-8 pt-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 34px) + 20px)" }}>
        <p className={eyebrow}>No pressure</p>
        <p className="dp mt-2 text-[34px] uppercase leading-[0.95] text-[#F2EFE8]">Keep the tracker. <span className="text-[#FF2B2B]">Come for the coach when you're ready.</span></p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">The program, the rank, the calendar and the projection stay free. The coach, the rebuilds and the photo assessment are the paid part, and the trial is still {trialDays} days, no card.</p>
        <div className="mt-auto space-y-3">
          <button onClick={() => finish({ trial: true, subPlan: "monthly" })} className={cta + " w-full py-4 text-base"}>Try it monthly — free {trialDays} days, then £{PRICES.monthly}</button>
          <button onClick={() => finish({ trial: false, subPlan: null })} className={ghost + " w-full py-4 text-sm"}>Continue with the free tracker</button>
        </div>
      </div>
    );

    /* ---- continue bar per kind ---- */
    const Continue = () => {
      const k = st.kind;
      const btn = (label, fn, extra) => <button onClick={fn} className={cta + " mt-5 w-full shrink-0 py-4 text-base " + (extra || "")}>{label}</button>;
      if (k === "weight" || k === "numbers" || k === "induction" || k === "projection" || k === "plan") return btn("Continue", next);
      if (k === "account") return btn("Continue", () => { if ((ob.name || "").trim()) next(); });
      if (k === "priorities") return btn((ob.priorities || []).length ? "Build around " + (ob.priorities || []).map((x) => (MI.MUSCLES.find((m) => m[0] === x) || [])[1]).join(", ") : "Keep it balanced", next);
      if (k === "multi") return btn((ob.obstacles || []).length ? "Show me how you handle " + (ob.obstacles.length === 1 ? "it" : "them") : "Nothing beat me — continue", next);
      if (k === "photo") return <div className="mt-5 shrink-0"><button onClick={next} className={ob.beforePhoto ? cta + " w-full py-4 text-base" : "mono w-full py-4 text-sm text-neutral-500"}>{ob.beforePhoto ? "Continue" : "Skip for now"}</button></div>;
      if (k === "armed") return btn("Show my rank", () => { const r = computedRank(); set("rank", r); setTimeout(next, 200); });
      if (k === "reveal") return btn("See where this goes", next, flipped ? "" : "opacity-0 pointer-events-none");
      if (k === "demo") {
        if (demo.phase === "proposed") return btn("“I've only got 40 min”", runDemo);
        if (demo.phase === "thinking") return btn("Rebuilding…", () => {}, "opacity-60");
        return btn("That's my coach — continue", next);
      }
      if (k === "hold") return null;
      if (k === "proof") return btn("Continue", next, proof === null ? "" : "");
      if (k === "timeline") return btn("Start my " + trialDays + "-day free trial", next);
      if (k === "paywall") return (
        <div className="mt-4 shrink-0">
          <button onClick={() => finish({ trial: true, subPlan: plan })} className={cta + " w-full py-4 text-base"}>Start free trial → then {plan === "yearly" ? "£" + PRICES.yearly + "/yr" : "£" + PRICES.monthly + "/mo"}</button>
          <button onClick={() => setDownsell(true)} className="mono mt-3 w-full py-2 text-xs text-neutral-500">Not now</button>
        </div>
      );
      return null;
    };

    const noHeader = ["reveal", "projection", "demo", "plan", "proof", "timeline", "paywall"].includes(st.kind);

    return (
      <div className="fixed inset-0 z-[90] flex flex-col overflow-y-auto bg-[#050505] px-6 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}>
        <style>{`
          .mi-card3d { perspective: 1100px; }
          .mi-card3d-inner { position: relative; transform-style: preserve-3d; transition: transform .85s cubic-bezier(.2,.8,.2,1); }
          .mi-card3d-inner.flipped { transform: rotateY(180deg); }
          .mi-face { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
          .mi-face.back { transform: rotateY(180deg); }
          .mi-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: mi-draw 1.6s cubic-bezier(.4,0,.2,1) .2s forwards; }
          @keyframes mi-draw { to { stroke-dashoffset: 0; } }
          .mi-pop1 { opacity: 0; animation: mi-pop .4s ease-out 1.0s forwards; }
          .mi-pop2 { opacity: 0; animation: mi-pop .5s cubic-bezier(.2,1.6,.4,1) 1.7s forwards; }
          @keyframes mi-pop { from { opacity: 0; } to { opacity: 1; } }
          .mi-scan { animation: mi-scan 1.2s ease-in-out infinite alternate; }
          @keyframes mi-scan { from { transform: translateX(0); } to { transform: translateX(200%); } }
          .mi-glow { box-shadow: 0 0 0 0 rgba(255,43,43,.6); animation: mi-glow 1.2s ease-out forwards; }
          @keyframes mi-glow { to { box-shadow: 0 0 80px 20px rgba(255,43,43,.25); } }
          @media (prefers-reduced-motion: reduce) { .mi-card3d-inner { transition: none; } .mi-draw, .mi-pop1, .mi-pop2 { animation: none; opacity: 1; stroke-dashoffset: 0; } }
        `}</style>
        {downsell && <Downsell />}
        <div className="h-[3px] w-full shrink-0 rounded-full bg-neutral-900">
          <div className="h-[3px] rounded-full bg-[#FF2B2B] transition-all duration-300" style={{ width: `${((step + 1) / N) * 100}%` }} />
        </div>
        <div className="mt-4 flex shrink-0 items-center justify-between">
          {step > 0 && st.kind !== "reveal" && st.kind !== "hold" ? <button onClick={back} className="mono py-2 pr-4 text-sm text-neutral-500" aria-label="Back">‹ Back</button> : <span />}
          <span className="mono text-[10px] text-neutral-600">{step + 1} / {N}</span>
        </div>

        {!noHeader && (
          <>
            <p className="dp mt-7 text-[34px] uppercase leading-[0.95] text-[#F2EFE8]">{st.q}</p>
            {st.sub && <p className="mt-3 text-sm leading-relaxed text-neutral-500">{st.sub}</p>}
          </>
        )}

        <div className={"flex-1 " + (noHeader ? "mt-6" : "mt-7")}>
          {st.kind === "choice" && <Choice />}
          {st.kind === "weight" && <Weight />}
          {st.kind === "numbers" && <Numbers />}
          {st.kind === "photo" && <Photo />}
          {st.kind === "armed" && <Armed />}
          {st.kind === "reveal" && <Reveal />}
          {st.kind === "projection" && <Projection />}
          {st.kind === "priorities" && <Priorities />}
          {st.kind === "demo" && <Demo />}
          {st.kind === "plan" && <Plan />}
          {st.kind === "multi" && <Multi />}
          {st.kind === "induction" && <Induction />}
          {st.kind === "hold" && <Hold />}
          {st.kind === "account" && <Account />}
          {st.kind === "proof" && <Proof />}
          {st.kind === "timeline" && <Timeline />}
          {st.kind === "paywall" && <Paywall />}
        </div>

        <Continue />
        <Outcome text={st.out} />
      </div>
    );
  };

  /* ---- In-app paywall (trial ended / locked feature). Same framing. ---- */
  MI.Paywall = ({ open, onClose, onTrial, trialStart, trialDays = 7, codeIn, setCodeIn, redeemCode, pro }) => {
    const [plan, setPlan] = useState("yearly");
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[85] flex flex-col overflow-y-auto bg-[#050505] px-6 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 34px) + 20px)" }}>
        <div className="flex items-center justify-between">
          <p className={eyebrow}>Max AI</p>
          <button onClick={onClose} className="mono py-2 text-xs text-neutral-500">Close</button>
        </div>
        <p className="dp mt-2 text-[34px] uppercase leading-[0.95] text-[#F2EFE8]">A coach in your corner for <span className="text-[#FF2B2B]">£{PRICES.monthly} a month</span>, not £{PRICES.human}.</p>
        <div className="mt-5 space-y-2.5">
          {[["yearly", "Yearly", "£" + PRICES.yearly + "/yr", "£" + Math.round(PRICES.yearly / 12) + "/mo · 4 months free"], ["monthly", "Monthly", "£" + PRICES.monthly + "/mo", "Cancel any time"]].map(([k, l, price, subl]) => (
            <button key={k} onClick={() => setPlan(k)} className={"flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left " + (plan === k ? "border-[#FF2B2B] bg-[#1c0808]" : "border-neutral-800 bg-[#111]")}>
              <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 " + (plan === k ? "border-[#FF2B2B]" : "border-neutral-700")}>{plan === k && <span className="h-3 w-3 rounded-full bg-[#FF2B2B]" />}</span>
              <span><span className="dp block text-lg uppercase text-[#F2EFE8]">{l} <span className="text-[#FF2B2B]">{price}</span></span><span className="mono block text-[10px] text-neutral-500">{subl}</span></span>
            </button>
          ))}
        </div>
        <div className={card + " mt-4 p-3.5"}>
          <div className="mono flex items-center justify-between text-[11px]"><span className="text-neutral-400">Human coach, weekly check-in</span><span className="text-neutral-500">£{PRICES.human}/mo</span></div>
          <div className="mono mt-1.5 flex items-center justify-between text-[11px]"><span className="text-[#F2EFE8]">Max Intensity — on call, every set</span><span className="text-[#FF2B2B]">£{PRICES.monthly}/mo</span></div>
          <div className="mt-2 h-1 rounded-full bg-neutral-900"><div className="h-1 w-[15%] rounded-full bg-[#FF2B2B]" /></div>
        </div>
        <div className="mt-4 space-y-2">
          {["Coach chat that reads your induction, rank and plan", "Rebuild any session in plain language — add bench, short on time, no cables", "Honest photo assessment with a realistic 6-12 week projection", "Meal prep from your foods, photo and voice logging"].map((l) => (
            <div key={l} className="flex items-start gap-2.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF2B2B]"><MI.Ic d={MI.PATHS.CHECK} className="h-2.5 w-2.5 text-white" /></span><p className="text-sm text-neutral-300">{l}</p></div>
          ))}
        </div>
        <div className="mt-auto pt-5">
          {!trialStart ? (
            <button onClick={() => { onTrial(plan); onClose(); }} className={cta + " w-full py-4 text-base"}>Begin my {trialDays}-day free trial</button>
          ) : (
            <div>
              <p className="mono text-xs text-neutral-500">Trial used. DM Max on Instagram for your access code — founder rates for the first 50.</p>
              <div className="mt-2 flex gap-2">
                <input value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder="ACCESS CODE" className="mono flex-1 rounded-lg bg-neutral-900 px-3 py-3 text-sm uppercase placeholder-neutral-700" />
                <button onClick={redeemCode} className={cta + " px-4 text-xs"}>Unlock</button>
              </div>
            </div>
          )}
          <p className="mono mt-2 text-center text-[10px] text-neutral-500">Then £{PRICES.monthly}/mo or £{PRICES.yearly}/yr — cancel any time. No card needed today.</p>
        </div>
      </div>
    );
  };
  MI.PRICES = PRICES;
  MI.OBSTACLES = OBSTACLES;
})(window.MI);
} catch (e) { showErr("funnel: " + e.message); }
