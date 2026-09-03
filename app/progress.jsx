/* MAX INTENSITY — progress pieces: projection vs actual graph, rank card,
   rank-up celebration, private photo check-in, photo assessment.
   Exposes MI.ProjectionGraph, MI.RankCard, MI.RankUp, MI.PhotoCheckin, MI.PhotoAssess. */
try {
(function (MI) {
  const { useState, useEffect, useRef } = React;
  const { card, chip, cta, ghost, eyebrow } = MI.ui;

  /* Projected (dashed) vs actual (solid) on one graph. actual: [{ w, v }] */
  MI.ProjectionGraph = ({ projection, actual, unit, wOut, title, sub }) => {
    if (!projection) return null;
    const P = projection;
    const W = 320, H = 150, padL = 8, padR = 34, padT = 20, padB = 22;
    const all = P.points.map((p) => p.v).concat((actual || []).map((a) => a.v));
    const mn = Math.min(...all), mx = Math.max(...all), span = mx - mn || 1;
    const X = (w) => padL + (Math.min(6, Math.max(0, w)) / 6) * (W - padL - padR);
    const Y = (v) => padT + (1 - (v - mn) / span) * (H - padT - padB);
    const dP = P.points.map((p, i) => (i ? "L" : "M") + X(p.w).toFixed(1) + "," + Y(p.v).toFixed(1)).join(" ");
    const dA = (actual || []).length ? actual.map((p, i) => (i ? "L" : "M") + X(p.w).toFixed(1) + "," + Y(p.v).toFixed(1)).join(" ") : null;
    const last = (actual || []).length ? actual[actual.length - 1] : null;
    const projAt = last ? P.points[Math.min(6, Math.round(last.w))].v : null;
    const fmt = (v) => (P.unit === "kg" ? wOut(String(v)) + " " + unit : v + " reps");
    const delta = last && projAt != null ? Math.round((last.v - projAt) * 10) / 10 : null;
    const ahead = delta != null && (P.metric === "bodyweight" ? (P.goal === "Lose fat" ? delta <= 0 : delta >= 0) : delta >= 0);
    return (
      <MI.PlateCard plate="skeleton" opacity={0.13} rule innerClassName="p-4">
        <div className="flex items-center gap-2"><MI.Ic d={MI.PATHS.CHART} className="h-4 w-4 text-[#FF2B2B]" /><p className="dp text-sm uppercase text-neutral-200">{title || "Projection vs actual"}</p></div>
        <p className="mt-1 text-[11px] text-neutral-500">{sub || `${P.label}: the line you were promised, and the line you're logging.`}</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" style={{ height: 160 }} aria-label="Projection versus actual">
          {[0, 3, 6].map((w) => <line key={w} x1={X(w)} x2={X(w)} y1={padT - 4} y2={H - padB + 2} stroke="#2a2a2a" strokeDasharray="2 3" />)}
          <path d={dP} fill="none" stroke="#F2EFE8" strokeOpacity=".55" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
          {dA && <path d={dA} fill="none" stroke="#FF2B2B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {(actual || []).map((p, i) => <circle key={i} cx={X(p.w)} cy={Y(p.v)} r="3.2" fill="#FF2B2B" />)}
          <g transform={`translate(${X(6) - 6}, ${Y(P.points[6].v) - 6})`}><path d={MI.PATHS.TROPHY} transform="scale(.5)" fill="none" stroke="#F2EFE8" strokeWidth="2.5" /></g>
          <text x={X(6) + 6} y={Y(P.points[6].v) + 18} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#9a9a9a">est. {fmt(P.at6)}</text>
          {last && <text x={Math.min(X(last.w) + 4, W - 30)} y={Y(last.v) - 8} fontFamily="IBM Plex Mono, monospace" fontSize="10" fontWeight="600" fill="#FF2B2B">{fmt(last.v)}</text>}
          <text x={X(0)} y={H - 6} fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#666">W1</text>
          <text x={X(3)} y={H - 6} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#666">W4</text>
          <text x={X(6)} y={H - 6} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#666">W6</text>
        </svg>
        <div className="mono mt-1 flex items-center gap-3 text-[9px] text-neutral-500">
          <span><span className="inline-block h-0.5 w-4 align-middle" style={{ borderTop: "2px dashed #F2EFE8" }} /> estimated</span>
          <span><span className="inline-block h-0.5 w-4 bg-[#FF2B2B] align-middle" /> real</span>
          {delta != null && <span className={"ml-auto " + (ahead ? "text-[#FF2B2B]" : "text-neutral-400")}>{ahead ? "ahead of" : "behind"} the curve by {Math.abs(delta)} {P.unit === "kg" ? unit : "reps"}</span>}
        </div>
        {!dA && <p className="mono mt-2 text-[10px] text-neutral-600">{P.metric === "bodyweight" ? "Weigh in on the Calendar and the real line appears here." : "Log work sets and the real line appears here."}</p>}
      </MI.PlateCard>
    );
  };

  /* Rank card for profile/progress: current rank, estimated from the block, next target. */
  MI.RankCard = ({ rank, estRank, name, onUpdate, gainPct, prCount }) => {
    if (!rank) return null;
    const est = estRank && estRank.index > rank.index ? estRank : null;
    return (
      <MI.PlateCard plate="skeleton" opacity={0.16} rule innerClassName="p-4">
        <div className="flex items-center gap-4">
          <MI.RankBadge name={rank.name} index={rank.index} size={64} />
          <div className="min-w-0 flex-1">
            <p className={eyebrow}>{name ? name + " · rank" : "Your rank"}</p>
            <p className="dp text-[34px] uppercase leading-none text-[#F2EFE8]">{rank.name}</p>
            <p className="mono mt-1 text-[10px] text-neutral-500">Rank {rank.index + 1} of 7{gainPct ? " · block +" + gainPct + "% on the bar" : ""}</p>
          </div>
        </div>
        <div className="mt-3 border-t border-neutral-800 pt-3">
          {rank.next ? <p className="text-sm text-neutral-300">Climbing rank is getting stronger. <span className="text-[#F2EFE8]">{rank.next.name}</span> takes {rank.next.phrase}.</p>
            : <p className="text-sm text-neutral-300">Top of the ladder. Hold it at +2.5% a block.</p>}
          {est && <p className="mono mt-2 text-[11px] text-[#FF2B2B]">Your logged sets say you're already lifting like {est.name}. Update your numbers to claim it.</p>}
          <button onClick={onUpdate} className={ghost + " mt-3 w-full py-3 text-xs"}>Update my numbers</button>
        </div>
      </MI.PlateCard>
    );
  };

  /* Rank-up celebration overlay. */
  MI.RankUp = ({ from, to, onClose }) => {
    useEffect(() => { MI.sound("rankup"); }, []);
    return (
      <button onClick={onClose} className="fixed inset-0 z-[89] flex flex-col items-center justify-center overflow-hidden bg-[#050505] px-8 text-center">
        <MI.Confetti n={50} />
        <MI.Plate plate="skeleton" opacity={0.14} position="center 30%" size="auto 120%" red={0.8} />
        <p className={eyebrow + " relative"}>Rank up</p>
        <div className="relative mt-4 flex items-center gap-5">
          <MI.RankBadge name={from} size={44} className="opacity-50" />
          <MI.Ic d={MI.PATHS.ARROW} className="h-6 w-6 text-[#FF2B2B]" />
          <MI.RankBadge name={to} size={110} className="popin" />
        </div>
        <p className="dp relative mt-5 text-[60px] uppercase leading-[0.9] text-[#FF2B2B]">{to}</p>
        <p className="relative mt-3 max-w-xs text-sm text-neutral-300">You climbed a rank. That's not a badge — that's a heavier bar than the one you started with.</p>
        <p className="mono relative mt-8 text-[10px] uppercase tracking-[0.25em] text-neutral-600">Tap to continue</p>
      </button>
    );
  };

  /* Private weekly photo check-in: reminder, gallery, before vs now. */
  MI.PhotoCheckin = ({ checkins, beforePhoto, onAdd, onDelete, onAssess }) => {
    const [cmp, setCmp] = useState(null);
    const last = (checkins || []).length ? checkins[checkins.length - 1] : null;
    const daysSince = last ? Math.floor((Date.now() - new Date(last.date + "T12:00:00").getTime()) / 86400000) : beforePhoto ? 7 : 0;
    const due = !last ? !!beforePhoto : daysSince >= 7;
    const now = cmp || last;
    return (
      <MI.PlateCard plate="torso" opacity={0.12} rule innerClassName="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><MI.Ic d={MI.PATHS.CAMERA} className="h-4 w-4 text-[#FF2B2B]" /><p className="dp text-sm uppercase text-neutral-200">Weekly check-in</p></div>
          <span className="mono text-[9px] uppercase tracking-wider text-neutral-600">private · on this phone</span>
        </div>
        {due && <p className="mono mt-2 rounded-md bg-[#1c0808] px-3 py-2 text-[11px] text-[#FF2B2B]">{last ? "It's been " + daysSince + " days. Same light, same spot — take this week's photo." : "Take your first check-in. Same light, same spot as the before photo."}</p>}
        {!due && last && <p className="mono mt-2 text-[10px] text-neutral-500">Next check-in in {7 - daysSince} day{7 - daysSince === 1 ? "" : "s"}.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-[#0d0d0d]" style={{ aspectRatio: "3 / 4" }}>
            {beforePhoto ? <img src={beforePhoto} alt="Before" className="h-full w-full object-cover" /> : <p className="mono absolute inset-0 flex items-center justify-center text-[10px] text-neutral-700">no before photo</p>}
            <span className="mono absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-neutral-300">Before</span>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-[#0d0d0d]" style={{ aspectRatio: "3 / 4" }}>
            {now ? <img src={now.data} alt="Now" className="h-full w-full object-cover" /> : <p className="mono absolute inset-0 flex items-center justify-center text-[10px] text-neutral-700">nothing yet</p>}
            <span className="mono absolute left-2 top-2 rounded bg-[#FF2B2B] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white">{now ? MI.fmtDate(now.date) : "Now"}</span>
          </div>
        </div>
        <label className={cta + " mt-3 block w-full cursor-pointer py-3.5 text-center text-sm"}>
          {last ? "Add this week's photo" : "Take check-in photo"}
          <input type="file" accept="image/*" capture="user" className="hidden" onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (f) onAdd(await MI.downscale(f, 720, 0.7)); }} />
        </label>
        {(checkins || []).length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {checkins.map((c, i) => (
              <div key={c.date + i} className="relative shrink-0">
                <button onClick={() => setCmp(c)} className={"block overflow-hidden rounded-md border " + ((now && now.date === c.date) ? "border-[#FF2B2B]" : "border-neutral-800")}><img src={c.data} alt="" className="h-20 w-14 object-cover" /></button>
                <p className="mono mt-0.5 text-center text-[8px] text-neutral-600">{MI.fmtDate(c.date)}</p>
                <button onClick={() => onDelete(c.date)} aria-label="Delete" className="mono absolute -right-1 -top-1 h-5 w-5 rounded-full bg-neutral-900 text-[10px] text-neutral-400">✕</button>
              </div>
            ))}
          </div>
        )}
        {onAssess && <button onClick={onAssess} className={ghost + " mt-3 w-full py-3 text-xs"}>Get an honest assessment</button>}
      </MI.PlateCard>
    );
  };

  /* Photo assessment sheet: what do you want to change → honest read → adjusted plan. */
  MI.PhotoAssess = ({ open, onClose, photo, ob, tier, hasAI, onApply, onStartTrial, projection12 }) => {
    const [want, setWant] = useState("");
    const [img, setImg] = useState(photo || null);
    const [busy, setBusy] = useState(false);
    const [out, setOut] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => { if (open) { setImg(photo || null); setOut(null); setErr(""); } }, [open, photo]);
    const run = async () => {
      if (!img || !want.trim() || busy) return;
      setBusy(true); setErr("");
      try { setOut(await window.MI_AI.photoAssess({ image: img, want, goal: ob.goal, bwKg: ob.bwKg, sex: ob.sex, exp: ob.exp, tier })); }
      catch (e) { setErr(e.cap ? e.message : "Couldn't reach the coach. Try again in a minute."); }
      setBusy(false);
    };
    return (
      <MI.Sheet open={open} onClose={onClose} title="Honest assessment" z={86}>
        <p className="mt-1 text-xs text-neutral-500">Say what you want to change. The coach reads the photo, tells you straight, and adjusts the plan. Any "what you could look like" is a realistic 6-12 week projection on this block — never a fantasy body.</p>
        {!hasAI && <div className={card + " mt-3 p-4"}><p className="text-sm text-neutral-300">Photo assessment is part of Max AI.</p><button onClick={onStartTrial} className={cta + " mt-3 w-full py-3 text-xs"}>Start the free trial</button></div>}
        {hasAI && !out && (
          <>
            <div className="mt-3 flex items-center gap-3">
              {img ? <img src={img} alt="" className="h-24 w-18 rounded-md object-cover" style={{ width: 72 }} /> : <div className="flex h-24 w-[72px] items-center justify-center rounded-md border border-dashed border-neutral-800"><MI.Ic d={MI.PATHS.CAMERA} className="h-5 w-5 text-neutral-600" /></div>}
              <label className={ghost + " cursor-pointer px-3 py-2.5 text-[10px]"}>{img ? "Use a different photo" : "Choose a photo"}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (f) setImg(await MI.downscale(f, 900, 0.7)); }} /></label>
            </div>
            <textarea value={want} onChange={(e) => setWant(e.target.value)} rows={3} placeholder="e.g. Lose the belly and get some shape on my shoulders" className="mt-3 w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600" />
            <button onClick={run} disabled={busy || !img || !want.trim()} className={cta + " mt-3 w-full py-3.5 text-sm disabled:opacity-50"}>{busy ? "Reading the photo…" : "Assess me honestly"}</button>
            {err && <p className="mono mt-2 text-[10px] text-[#FF2B2B]">{err}</p>}
            <p className="mono mt-2 text-[9px] text-neutral-600">The photo is sent to the coach for this one answer and not stored anywhere but your phone.</p>
          </>
        )}
        {out && (
          <div className="mt-3 space-y-2.5">
            <div className={card + " p-4"}><p className={eyebrow}>The read</p><p className="mt-1.5 text-sm leading-relaxed text-neutral-200">{out.assessment}</p></div>
            <div className="grid grid-cols-2 gap-2">
              <div className={card + " p-3"}><p className="mono text-[9px] uppercase tracking-widest text-neutral-500">Working for you</p>{(out.strengths || []).map((s, i) => <p key={i} className="mt-1 text-xs text-neutral-300">{s}</p>)}</div>
              <div className={card + " p-3"}><p className="mono text-[9px] uppercase tracking-widest text-[#FF2B2B]">Behind</p>{(out.behind || []).map((s, i) => <p key={i} className="mt-1 text-xs text-neutral-300">{s}</p>)}</div>
            </div>
            <MI.PlateCard plate="torso" opacity={0.12} innerClassName="p-4">
              <p className={eyebrow}>What realistically changes</p>
              <p className="mono mt-2 text-[10px] uppercase tracking-widest text-neutral-500">6 weeks</p><p className="text-sm text-neutral-200">{out.week6}</p>
              <p className="mono mt-2 text-[10px] uppercase tracking-widest text-neutral-500">12 weeks</p><p className="text-sm text-neutral-200">{out.week12}</p>
              {projection12 && <p className="mono mt-2 text-[10px] text-neutral-500">On the numbers: {projection12.label.toLowerCase()} {projection12.start} → {projection12.at6} → {projection12.at12} {projection12.unit}.</p>}
              {out.caveat && <p className="mono mt-2 text-[10px] text-neutral-500">{out.caveat}</p>}
            </MI.PlateCard>
            <div className={card + " p-4"}>
              <p className={eyebrow}>Adjusted plan</p>
              <p className="mt-1.5 text-sm text-neutral-200">Priorities: <span className="text-[#F2EFE8]">{(out.priorities || []).join(", ") || "unchanged"}</span></p>
              {out.nutrition && <p className="mt-1 text-sm text-neutral-300">{out.nutrition}</p>}
              <button onClick={() => { onApply(out); onClose(); }} className={cta + " mt-3 w-full py-3 text-xs"}>Apply to my plan</button>
              <button onClick={() => setOut(null)} className="mono mt-2 w-full py-1 text-[10px] text-neutral-500">Ask again</button>
            </div>
          </div>
        )}
      </MI.Sheet>
    );
  };
})(window.MI);
} catch (e) { showErr("progress: " + e.message); }
