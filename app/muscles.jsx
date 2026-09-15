/* MAX INTENSITY — per-exercise muscle infographics and the form library.

   Muscle regions are polygons in each plate's own pixel space (viewBox = the
   JPG size), drawn over the plate with the worked muscles filled #FF2B2B:
   primary solid, secondary lighter. The same regions drive the priority
   picker and the recap map (MI.MuscleMap), so the three stay in sync.

   Exposes MI.REGIONS, MI.EXERCISES, MI.exerciseInfo, MI.slug, MI.MuscleFigure,
   MI.ExerciseInfographic, MI.MuscleSheet, MI.FormSheet, and overrides MI.MuscleMap. */
try {
(function (MI) {
  const { useState, useEffect, useRef } = React;
  const { card, cta, ghost, eyebrow } = MI.ui;
  const A = "assets/anatomy/";

  /* ---- regions per plate (polygons as "x,y x,y …"), mirrored where the body is symmetric ---- */
  const mirror = (poly, W) => poly.split(" ").map((pt) => { const [x, y] = pt.split(",").map(Number); return (W - x) + "," + y; }).join(" ");
  const both = (poly, W) => [poly, mirror(poly, W)];
  const F = 295, B = 223, L = 295;
  /* Traced on a 25px grid over each plate (see docs: tests/scratch grids). The
     polygons follow the drawn muscle bellies, not the limb outlines. */
  MI.REGIONS = {
    front: {
      file: A + "muscles-front.jpg", W: 295, H: 500,
      chest: both("147,106 120,104 102,116 98,138 108,152 128,158 147,152", F),
      shoulders: both("82,98 104,102 108,116 104,134 90,142 78,132 76,112", F),
      biceps: both("84,140 104,136 100,190 86,204 72,196 70,160", F),
      forearms: both("72,198 100,192 92,250 70,268 50,266 46,236", F),
      abs: ["128,152 166,152 170,200 168,246 148,262 128,246 124,200"],
      obliques: both("100,150 126,158 124,246 108,242 96,200", F),
      quads: both("100,250 146,252 150,300 146,352 118,364 96,320", F),
      adductors: both("146,256 166,262 160,300 150,340 146,300", F),
      calves: both("104,388 140,386 142,430 134,468 108,468 98,430", F),
      tibialis: both("112,392 134,394 130,462 112,460", F),
    },
    back: {
      file: A + "muscles-back.jpg", W: 223, H: 372,
      traps: ["90,74 132,74 150,104 126,136 111,146 96,136 72,104"],
      rearDelts: both("56,78 84,76 88,102 76,116 58,110 50,94", B),
      lats: both("68,112 104,128 106,160 100,196 84,196 66,160 62,132", B),
      lowerBack: ["98,150 124,150 128,196 94,196"],
      triceps: both("50,108 74,110 70,160 50,166 44,138", B),
      forearms: both("44,166 70,162 68,214 42,220 34,192", B),
      glutes: both("80,190 111,196 111,238 86,240 70,216", B),
      hamstrings: both("82,240 110,240 108,306 84,308 76,272", B),
      calves: both("82,312 110,310 108,352 86,354 78,332", B),
    },
    legs: {
      file: A + "legs.jpg", W: 295, H: 500,
      abductors: both("56,40 96,48 90,100 62,110 50,80", L),
      quads: both("70,44 132,48 140,120 136,210 100,222 64,190 58,110", L),
      adductors: both("128,60 148,64 148,150 134,160 122,120", L),
      hamstrings: both("60,150 74,200 72,230 58,220", L),
      calves: both("64,268 84,262 88,330 82,392 66,384 58,330", L),
      tibialis: both("96,262 130,260 126,400 104,400", L),
      glutes: both("58,0 120,0 116,44 62,46", L),
    },
    arm: {
      file: A + "arm.jpg", W: 295, H: 500,
      shoulders: ["118,34 200,30 236,96 200,150 130,134 106,86"],
      chest: ["20,30 112,34 108,84 60,150 24,120"],
      biceps: ["150,150 214,146 236,236 204,300 166,286 148,220"],
      triceps: ["206,116 246,112 262,190 250,270 224,296 236,236"],
      forearms: ["150,300 210,300 214,400 160,410 140,350"],
      hands: ["20,400 150,392 156,440 60,500 20,470"],
    },
  };

  /* Priority-picker groups → plate regions, so the picker and the cards agree. */
  MI.GROUP_REGIONS = {
    chest: { front: ["chest"], back: [] },
    back: { front: [], back: ["lats", "traps", "lowerBack"] },
    shoulders: { front: ["shoulders"], back: ["rearDelts"] },
    arms: { front: ["biceps", "forearms"], back: ["triceps", "forearms"] },
    legs: { front: ["quads", "calves", "adductors"], back: ["hamstrings", "calves"] },
    glutes: { front: [], back: ["glutes"] },
    abs: { front: ["abs", "obliques"], back: [] },
  };

  MI.MUSCLE_LABELS = { chest: "Chest", shoulders: "Deltoids", rearDelts: "Rear deltoids", biceps: "Biceps", triceps: "Triceps", forearms: "Forearms", abs: "Abdominals", obliques: "Obliques", quads: "Quadriceps", adductors: "Adductors", abductors: "Hip abductors", hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves", tibialis: "Tibialis", lats: "Lats", traps: "Trapezius", lowerBack: "Lower back", hands: "Grip" };

  /* ---- exercise data: which plate, primary/secondary muscles, form cues.
     Matched by keyword, first hit wins; unknown exercises fall back by muscle group. ---- */
  MI.EXERCISES = [
    { m: /incline dumbbell press|incline press|dumbbell press/i, plate: "front", primary: ["chest", "shoulders"], secondary: ["triceps"], cues: ["30° bench, dumbbells start over the shoulders, elbows about 45° from the body.", "Three seconds down to a full stretch, one-second hold, three up — no bounce.", "Squeeze the chest at the top without locking the elbows out hard."] },
    { m: /bench/i, plate: "front", primary: ["chest"], secondary: ["shoulders", "triceps"], cues: ["Shoulder blades pinned back and down, feet planted.", "Bar to the lower chest, elbows tucked about 45°.", "Drive the bar back over the shoulders; exhale on the press."] },
    { m: /clavicular|flye|fly/i, plate: "front", primary: ["chest"], secondary: ["shoulders"], cues: ["Slight bend in the elbows, held the whole way.", "Open to a deep stretch across the chest, three seconds out.", "Bring the hands together and squeeze — the chest closes the arc, not the arms."] },
    { m: /dip/i, plate: "front", primary: ["chest", "triceps"], secondary: ["shoulders"], cues: ["Lean forward slightly, shoulders below the elbows at the bottom.", "Assistance on so every rep holds the 3-1-3-1 tempo.", "No swing — the body stays still, the arms do the work."] },
    { m: /straight-arm|straight arm/i, plate: "back", primary: ["lats"], secondary: ["triceps", "rearDelts"], cues: ["Arms almost straight, hinge slightly at the hips.", "Sweep the bar down to the thighs with the lats — elbows stay fixed.", "Let it rise slowly to a full stretch overhead."] },
    { m: /wide-grip row|wide grip row|smith row|chest supported/i, plate: "back", primary: ["lats", "traps"], secondary: ["rearDelts", "biceps"], cues: ["Chest on the pad, elbows wide and high.", "Pull to the lower chest, squeeze the shoulder blades together for the hold.", "Lower for three seconds to a full stretch — let the blades spread."] },
    { m: /lat row|one-arm|row/i, plate: "back", primary: ["lats"], secondary: ["biceps", "rearDelts"], cues: ["Brace the hip, keep the torso still.", "Drive the elbow back and down toward the hip.", "Three seconds back out — reach at the bottom."] },
    { m: /pulldown|pull-up|pullup|chin/i, plate: "back", primary: ["lats"], secondary: ["biceps", "rearDelts"], cues: ["Chest up, pull the elbows down to the ribs.", "Hold a second at the bottom, then three seconds up to a dead hang.", "No kip, no lean-back."] },
    { m: /press behind|shoulder press|overhead|ohp|smith press/i, plate: "front", primary: ["shoulders"], secondary: ["triceps"], cues: ["Seated, bar just clear of the head, grip a little wider than the shoulders.", "Lower slowly to ear height — never force depth.", "Press up without locking out hard; keep the ribs down."] },
    { m: /lateral/i, plate: "front", primary: ["shoulders"], secondary: [], cues: ["Slight forward lean, elbows lead the movement.", "Raise to shoulder height, one-second hold, three seconds down.", "If the traps take over, the weight is too heavy."] },
    { m: /preacher/i, plate: "arm", primary: ["biceps"], secondary: ["forearms"], cues: ["Armpits on the top of the pad, elbows still.", "Curl to a full squeeze, hold, then three seconds down to nearly straight.", "Don't bounce out of the bottom — that's where the tempo counts."] },
    { m: /curl/i, plate: "arm", primary: ["biceps"], secondary: ["forearms"], cues: ["Elbows pinned to the sides, no swing.", "Turn the palm up as you curl, squeeze at the top.", "Three seconds down under control."] },
    { m: /tricep|crossover|pushdown|skull/i, plate: "arm", primary: ["triceps"], secondary: [], cues: ["Elbows fixed by the ribs; only the forearms move.", "Extend fully and hold for one — flex the tricep.", "Three seconds back up, the elbows never drift forward."] },
    { m: /hip thrust|glute raise|glute bridge/i, plate: "back", primary: ["glutes"], secondary: ["hamstrings"], cues: ["Shoulder blades on the bench, bar over the hips, chin tucked.", "Drive through the heels to a full lockout and squeeze the glutes for one.", "Lower for three — hips only, the ribs stay down."] },
    { m: /rdl|romanian/i, plate: "back", primary: ["hamstrings"], secondary: ["glutes", "lowerBack"], cues: ["Soft knees, hinge at the hips, flat back the whole way.", "Bar stays close; slide it down the thighs until the hamstrings pull.", "Drive the hips forward to stand — don't lean back at the top."] },
    { m: /leg curl/i, plate: "back", primary: ["hamstrings"], secondary: ["calves"], cues: ["Hips pinned to the pad.", "Curl to a full squeeze and hold for one.", "Three seconds back to nearly straight — control the stretch."] },
    { m: /leg press/i, plate: "legs", primary: ["quads", "glutes"], secondary: ["adductors", "calves"], cues: ["Feet mid-platform, shoulder width, heels planted.", "Lower for three until the thighs are near the chest — hips stay on the seat.", "Press through the whole foot; never lock the knees hard."] },
    { m: /extension/i, plate: "legs", primary: ["quads"], secondary: [], cues: ["Pad on the shins just above the ankle.", "Extend to a full squeeze and hold for one — flex the quad.", "Three seconds down, don't let the stack touch."] },
    { m: /calf/i, plate: "back", primary: ["calves"], secondary: [], cues: ["Balls of the feet on the edge, heels dropped to a full stretch.", "Rise as high as possible and hold for one.", "Three seconds down — the stretch is half the rep."] },
    { m: /adductor/i, plate: "legs", primary: ["adductors"], secondary: [], cues: ["Sit tall, pads inside the knees.", "Squeeze the legs together and hold for one.", "Three seconds back out to a comfortable stretch."] },
    { m: /abductor/i, plate: "legs", primary: ["abductors", "glutes"], secondary: [], cues: ["Lean forward slightly to load the glutes.", "Push the knees out wide and hold for one.", "Three seconds back in — don't let the stack drop."] },
    { m: /squat|lunge|split squat/i, plate: "legs", primary: ["quads", "glutes"], secondary: ["hamstrings", "adductors"], cues: ["Brace, chest up, knees track over the toes.", "Three seconds down to parallel or below.", "Drive up through the whole foot."] },
    { m: /crunch|knee raise|leg raise|plank|abs/i, plate: "front", primary: ["abs"], secondary: ["obliques"], cues: ["Round the spine — it's a curl, not a hinge.", "Exhale hard and hold the squeeze for one.", "Three seconds back to a full stretch under control."] },
  ];
  const GROUP_FALLBACK = { chest: "front", back: "back", shoulders: "front", arms: "arm", legs: "legs", glutes: "back", abs: "front" };

  MI.slug = (name) => String(name || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  MI.exerciseInfo = (name) => {
    const hit = MI.EXERCISES.find((e) => e.m.test(name || ""));
    if (hit) return { ...hit, slug: MI.slug(name) };
    const groups = MI.musclesFor(name);
    const g = groups[0] || "chest";
    const plate = GROUP_FALLBACK[g];
    const regs = groups.flatMap((k) => (MI.GROUP_REGIONS[k] || {})[plate === "arm" ? "front" : plate] || []);
    return { plate, primary: regs.slice(0, 2), secondary: regs.slice(2), cues: ["Three seconds down, hold one, three up, hold one.", "Own the tempo before the load.", "Working set at one in reserve; back-off at −10%."], slug: MI.slug(name) };
  };

  /* ---- the figure: plate texture (deep red, see MI.TONES) + red-filled regions ---- */
  MI.MuscleFigure = ({ plate = "front", primary = [], secondary = [], className, style, labels, plateOpacity = 0.32 }) => {
    const R = MI.REGIONS[plate] || MI.REGIONS.front;
    const poly = (name, fill, op, k) => (R[name] || []).map((pts, i) => <polygon key={name + i + k} points={pts} fill={fill} fillOpacity={op} stroke="#A11B1B" strokeOpacity={Math.min(1, op + 0.15)} strokeWidth="1" strokeLinejoin="round" />);
    return (
      <div className={"relative overflow-hidden bg-[#0d0d0d] " + (className || "")} style={{ aspectRatio: `${R.W} / ${R.H}`, ...(style || {}) }}>
        {MI.TONES.red.map((L, i) => (
          <div key={i} aria-hidden className="absolute inset-0" style={{ background: L.fill, mixBlendMode: "screen", opacity: Math.min(1, plateOpacity * L.op) }}>
            <img src={R.file} alt="" aria-hidden className="h-full w-full" style={{ objectFit: "fill", filter: L.filter, mixBlendMode: "multiply" }} />
          </div>
        ))}
        <svg viewBox={`0 0 ${R.W} ${R.H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          <defs><linearGradient id="mi-muscle-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A11B1B" /><stop offset="1" stopColor="#7A1414" /></linearGradient></defs>
          {secondary.map((n) => poly(n, "url(#mi-muscle-red)", 0.45, "s"))}
          {primary.map((n) => poly(n, "url(#mi-muscle-red)", 0.92, "p"))}
          {labels && [...primary, ...secondary].map((n) => (R[n] || []).slice(0, 1).map((pts) => {
            const c = pts.split(" ").map((p) => p.split(",").map(Number));
            const cx = c.reduce((t, p) => t + p[0], 0) / c.length, cy = c.reduce((t, p) => t + p[1], 0) / c.length;
            return <text key={"l" + n} x={cx} y={cy} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={R.W > 250 ? 9 : 7} fill="#F2EFE8" stroke="#050505" strokeWidth="2.5" paintOrder="stroke">{MI.MUSCLE_LABELS[n] || n}</text>;
          }))}
        </svg>
      </div>
    );
  };

  /* Card thumbnail: consistent 2:3 crop, whole plate, tap to expand. */
  MI.ExerciseInfographic = ({ name, onOpen, size = 44 }) => {
    const info = MI.exerciseInfo(name);
    return (
      <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen(name); }} className="shrink-0 overflow-hidden rounded-md border border-neutral-800" style={{ width: size, height: Math.round(size * 1.5) }} aria-label={"Muscles worked by " + name}>
        <MI.MuscleFigure plate={info.plate} primary={info.primary} secondary={info.secondary} className="h-full w-full" style={{ aspectRatio: "auto" }} plateOpacity={0.5} />
      </button>
    );
  };

  /* Full plate with names. */
  MI.MuscleSheet = ({ name, onClose, onForm }) => {
    if (!name) return null;
    const info = MI.exerciseInfo(name);
    return (
      <MI.Sheet open={!!name} onClose={onClose} title={name} z={82}>
        <p className="mono mt-1 text-[10px] uppercase tracking-widest text-neutral-500">Muscles worked</p>
        <div className="mt-3 flex gap-3">
          <MI.MuscleFigure plate={info.plate} primary={info.primary} secondary={info.secondary} labels className="w-[46%] rounded-lg border border-neutral-800" plateOpacity={0.6} />
          <div className="min-w-0 flex-1">
            <p className={eyebrow}>Primary</p>
            {info.primary.map((n) => <p key={n} className="mt-1 flex items-center gap-2 text-sm text-neutral-100"><span className="h-3 w-3 rounded-sm bg-[#FF2B2B]" />{MI.MUSCLE_LABELS[n] || n}</p>)}
            {info.secondary.length > 0 && <p className={eyebrow + " mt-3"}>Secondary</p>}
            {info.secondary.map((n) => <p key={n} className="mt-1 flex items-center gap-2 text-sm text-neutral-300"><span className="h-3 w-3 rounded-sm bg-[#FF2B2B]/40" />{MI.MUSCLE_LABELS[n] || n}</p>)}
            <p className="mono mt-4 text-[10px] text-neutral-500">Plate: {info.plate === "front" ? "muscles, anterior" : info.plate === "back" ? "muscles, posterior" : info.plate === "legs" ? "lower limb" : "arm"}.</p>
            {onForm && <button onClick={() => { onClose(); onForm(name); }} className={ghost + " mt-4 w-full py-2.5 text-[10px]"}>▶ Form</button>}
          </div>
        </div>
      </MI.Sheet>
    );
  };

  /* ---- form library: assets/form/<slug>.mp4, placeholder until Max films it ---- */
  MI.formSrc = (name) => "assets/form/" + MI.slug(name) + ".mp4";
  MI.FormSheet = ({ name, onClose, fallbackUrl }) => {
    const [state, setState] = useState("loading"); // loading | ready | missing
    const [info, setInfo] = useState(null);
    useEffect(() => { if (!name) return; setState("loading"); setInfo(MI.exerciseInfo(name)); }, [name]);
    if (!name) return null;
    const src = MI.formSrc(name);
    return (
      <MI.Sheet open={!!name} onClose={onClose} title={name} z={83}>
        <p className="mono mt-1 text-[10px] uppercase tracking-widest text-neutral-500">Form · reference</p>
        <div className="relative mt-3 overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d]" style={{ aspectRatio: "9 / 16", maxHeight: "48vh" }}>
          {state !== "missing" && (
            <video key={src} src={src} controls playsInline preload="metadata" className="h-full w-full object-cover" onLoadedMetadata={() => setState("ready")} onError={() => setState("missing")} />
          )}
          {state === "missing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <MI.Plate plate="arm" opacity={0.16} position="center 30%" size="auto 140%" />
              <MI.Ic d={MI.PATHS.PLAY || "M8 5v14l11-7z"} className="relative h-8 w-8 text-[#FF2B2B]" />
              <p className="dp relative mt-3 text-xl uppercase text-[#F2EFE8]">Form video coming</p>
              <p className="relative mt-1 text-xs text-neutral-400">Max filming the movement, shirt on. Until then, the cues below are the standard.</p>
              {fallbackUrl && <a href={fallbackUrl} target="_blank" rel="noreferrer" className="mono relative mt-3 text-[10px] uppercase tracking-widest text-neutral-500 underline">Watch a reference demo</a>}
            </div>
          )}
          {state === "loading" && <p className="mono absolute bottom-2 left-2 text-[9px] text-neutral-600">checking assets/form/{MI.slug(name)}.mp4</p>}
        </div>
        {info && (
          <div className="mt-4 space-y-2">
            {info.cues.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="dp mt-0.5 w-5 shrink-0 text-base text-[#FF2B2B]">{i + 1}</span>
                <p className="text-sm leading-relaxed text-neutral-200">{c}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mono mt-4 text-[9px] text-neutral-600">Tempo 3-1-3-1 on every rep. Video slot: assets/form/{MI.slug(name)}.mp4</p>
      </MI.Sheet>
    );
  };

  /* Form-video admin: every exercise in the program with its slot and whether the file is there. */
  MI.FormAdmin = ({ names }) => {
    const [status, setStatus] = useState({});
    useEffect(() => {
      let alive = true;
      (async () => {
        const out = {};
        for (const n of names) {
          try { const r = await fetch(MI.formSrc(n), { method: "HEAD" }); out[n] = r.ok ? "ready" : "missing"; } catch (e) { out[n] = "missing"; }
        }
        if (alive) setStatus(out);
      })();
      return () => { alive = false; };
    }, [names.join("|")]); // eslint-disable-line
    return (
      <div className={card + " mt-2 p-4"}>
        <p className="text-xs leading-relaxed text-neutral-400">Drop an .mp4 per exercise into <span className="mono text-neutral-200">assets/form/</span> using the slot name below (portrait, shirt on, one clean set). The app picks it up on the next load — no code change.</p>
        <div className="mt-2 divide-y divide-neutral-800">
          {names.map((n) => (
            <div key={n} className="flex items-center justify-between gap-2 py-1.5">
              <div className="min-w-0"><p className="truncate text-xs text-neutral-200">{n}</p><p className="mono truncate text-[9px] text-neutral-500">assets/form/{MI.slug(n)}.mp4</p></div>
              <span className={"mono shrink-0 text-[9px] uppercase tracking-wider " + (status[n] === "ready" ? "text-[#FF2B2B]" : "text-neutral-600")}>{status[n] || "…"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ---- MuscleMap override: the picker and the recap use the same plates and fills ---- */
  const groupsToRegions = (groups, plate) => Array.from(new Set((groups || []).flatMap((g) => (MI.GROUP_REGIONS[g] || {})[plate] || [])));
  MI.MuscleMap = ({ worked = [], priority = [], view = "both", className, height = 220 }) => {
    const pri = priority, sec = worked.filter((w) => !priority.includes(w));
    const fig = (plate) => <MI.MuscleFigure key={plate} plate={plate} primary={groupsToRegions(pri.length ? pri : worked, plate)} secondary={pri.length ? groupsToRegions(sec, plate) : []} className="h-full rounded-lg border border-neutral-800" style={{ width: "auto" }} plateOpacity={0.5} />;
    return (
      <div className={"flex items-stretch justify-center gap-3 " + (className || "")} style={{ height }}>
        {(view === "both" || view === "front") && fig("front")}
        {(view === "both" || view === "back") && fig("back")}
      </div>
    );
  };
})(window.MI);
} catch (e) { showErr("muscles: " + e.message); }
