/* MAX INTENSITY — session recap ("wrapped"). Volume, PRs, grade, muscle map,
   a shareable card. Exposes MI.Recap. */
try {
(function (MI) {
  const { useState, useRef, useEffect } = React;
  const { card, cta, ghost, eyebrow } = MI.ui;

  /* Draws the shareable card on a canvas: black, red rule, Anton-ish caps. */
  function drawCard(o) {
    const W = 1080, H = 1350;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#050505"; g.fillRect(0, 0, W, H);
    // grain
    for (let i = 0; i < 9000; i++) { g.fillStyle = "rgba(242,239,232," + (Math.random() * 0.05) + ")"; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    g.fillStyle = "#FF2B2B"; g.fillRect(0, 0, W, 14);
    const font = (px, fam) => { g.font = px + "px " + (fam === "mono" ? "'IBM Plex Mono', monospace" : "'Anton', 'Arial Narrow', Impact, sans-serif"); };
    g.fillStyle = "#FF2B2B"; font(30, "mono"); g.fillText("MAX INTENSITY · SESSION RECAP", 80, 120);
    g.fillStyle = "#F2EFE8"; font(150); g.fillText(o.day.toUpperCase(), 80, 280);
    g.fillStyle = "#9a9a9a"; font(34, "mono"); g.fillText("WEEK " + o.week + " · " + o.plan + " · " + o.date, 80, 340);
    const stat = (x, y, big, small, red) => { g.fillStyle = red ? "#FF2B2B" : "#F2EFE8"; font(130); g.fillText(big, x, y); g.fillStyle = "#9a9a9a"; font(28, "mono"); g.fillText(small.toUpperCase(), x, y + 44); };
    stat(80, 560, o.grade, "session grade", true);
    stat(420, 560, String(o.volume.toLocaleString()), "kg moved", false);
    stat(80, 800, String(o.prs), o.prs === 1 ? "personal record" : "personal records", o.prs > 0);
    stat(420, 800, String(o.streak), "day streak", false);
    g.fillStyle = "#F2EFE8"; font(40, "mono"); g.fillText("RANK", 80, 960);
    g.fillStyle = "#FF2B2B"; font(90); g.fillText((o.rank || "Bronze").toUpperCase(), 80, 1050);
    if (o.prLine) { g.fillStyle = "#F2EFE8"; font(34, "mono"); g.fillText(o.prLine, 80, 1130); }
    g.fillStyle = "#666"; font(26, "mono"); g.fillText("+" + o.pts + " PTS · LEVEL " + o.level + " · " + o.line.toUpperCase().slice(0, 48), 80, 1230);
    g.fillStyle = "#FF2B2B"; g.fillRect(80, 1270, 160, 6);
    return c;
  }

  MI.Recap = ({ day, week, plan, items, prs, pts, streak, points, rank, unit, wOut, worked, priority, name, onDone, onResume, avgRir }) => {
    const P = window.MI_PROJ;
    const volume = P ? P.volume(items) : 0;
    const setsLogged = (items || []).reduce((t, it) => t + (it.sets || []).filter((s) => s.w || s.r).length, 0);
    const setsPlanned = (items || []).reduce((t, it) => t + Math.max((it.sets || []).length, 4), 0);
    const grade = P ? P.sessionGrade({ setsLogged, setsPlanned, prs: (prs || []).length, gainPct: 0, avgRir }) : { letter: "A", line: "" };
    const level = P ? P.levelFor(points) : { level: 1 };
    const [shared, setShared] = useState("");
    const [stage, setStage] = useState(0);
    useEffect(() => { const t = setInterval(() => setStage((s) => Math.min(4, s + 1)), 420); return () => clearInterval(t); }, []);
    const show = (n) => "transition-all duration-500 " + (stage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3");
    const prLine = (prs || []).length ? prs.map((p) => p.name + " " + wOut(String(p.w)) + " " + unit).join(" · ") : "";
    const share = async () => {
      const c = drawCard({ day, week, plan, date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }), grade: grade.letter, volume, prs: (prs || []).length, streak, rank, pts, level: level.level, line: grade.line, prLine });
      const r = await MI.shareCanvas(c, "max-intensity-" + MI.todayKey() + ".png", `${day} · Week ${week} · ${volume.toLocaleString()} kg moved · grade ${grade.letter} · ${rank}`);
      setShared(r === "shared" ? "Shared." : r === "downloaded" ? "Saved to your photos." : r === "copied" ? "Copied the recap text." : "Couldn't share on this device.");
    };
    return (
      <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[#050505] px-5 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 18px)" }}>
        <div className="relative -mx-5 overflow-hidden px-5 pb-4 pt-2">
          <MI.Plate plate={MI.plateFor("session", day)} opacity={0.18} position="right -20%" size="auto 220%" />
          <p className={eyebrow + " relative"}>Session complete · wrapped</p>
          <p className="dp relative mt-1 text-[52px] uppercase leading-[0.9] text-[#F2EFE8]">{day}<br /><span className="text-[#FF2B2B]">Week {week}</span></p>
          <p className="mono relative mt-2 text-xs text-neutral-400">{plan} · {setsLogged} sets · {name}</p>
        </div>
        <div className={"grid grid-cols-2 gap-2 " + show(1)}>
          <div className={card + " relative overflow-hidden p-4"}>
            <MI.Plate plate="skeleton" opacity={0.1} />
            <p className="dp relative text-[64px] leading-none text-[#FF2B2B]">{grade.letter}</p>
            <p className="mono relative mt-1 text-[9px] uppercase tracking-widest text-neutral-500">Session grade</p>
          </div>
          <div className={card + " p-4"}>
            <p className="dp text-[44px] leading-none text-[#F2EFE8]">{volume.toLocaleString()}</p>
            <p className="mono mt-1 text-[9px] uppercase tracking-widest text-neutral-500">kg moved</p>
          </div>
        </div>
        <p className={"mt-2 text-sm text-neutral-400 " + show(1)}>{grade.line}</p>
        <div className={"mt-3 " + show(2)}>
          <div className={card + " relative overflow-hidden p-4 " + ((prs || []).length ? "border-[#FF2B2B]" : "")}>
            {(prs || []).length > 0 && <MI.Confetti n={30} />}
            <div className="flex items-center gap-2"><MI.Ic d={MI.PATHS.TROPHY} className="h-4 w-4 text-[#FF2B2B]" /><p className="dp text-sm uppercase text-neutral-200">{(prs || []).length ? (prs.length === 1 ? "New best" : prs.length + " new bests") : "Records"}</p></div>
            {(prs || []).length ? prs.map((p, i) => <p key={i} className="mono mt-1.5 text-sm text-[#F2EFE8]">{p.name} · <span className="text-[#FF2B2B]">{wOut(String(p.w))} {unit}</span></p>)
              : <p className="mt-1.5 text-xs text-neutral-500">No all-time best today. Clear 6 on the work set and it's +2.5% next time — that's how the next one lands.</p>}
          </div>
        </div>
        <div className={"mt-3 " + show(3)}>
          <MI.MuscleMapCard worked={worked} priority={priority} title="Worked today" sub={worked.map((w) => (MI.MUSCLES.find((m) => m[0] === w) || [])[1]).filter(Boolean).join(" · ")} plate={MI.plateFor("session", day)} />
        </div>
        <div className={"mt-3 grid grid-cols-3 gap-2 text-center " + show(4)}>
          <div className={card + " py-3"}><p className="dp text-2xl text-[#FF2B2B]">+{pts}</p><p className="mono text-[9px] uppercase text-neutral-500">points</p></div>
          <div className={card + " py-3"}><p className="dp text-2xl text-[#F2EFE8]">{streak}</p><p className="mono text-[9px] uppercase text-neutral-500">day streak</p></div>
          <div className={card + " flex flex-col items-center py-2"}><MI.RankBadge name={rank} size={30} /><p className="mono mt-0.5 text-[9px] uppercase text-neutral-500">{rank}</p></div>
        </div>
        <div className={"mt-5 " + show(4)}>
          <button onClick={share} className={cta + " w-full py-4 text-base"}>Share the card</button>
          {shared && <p className="mono mt-2 text-center text-[10px] text-neutral-500">{shared}</p>}
          <button onClick={onDone} className={ghost + " mt-3 w-full py-3.5 text-sm"}>Done — leave and grow</button>
          <button onClick={onResume} className="mono mt-3 w-full py-1 text-xs text-neutral-600">‹ Not finished — go back</button>
        </div>
      </div>
    );
  };
})(window.MI);
} catch (e) { showErr("recap: " + e.message); }
