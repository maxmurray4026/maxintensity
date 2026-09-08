/* MAX INTENSITY — the block at a glance. Full-screen month calendar opened
   from the date header. Red dot = session scheduled, bone = completed, dim =
   rest. Week strip across the top with the block's real week names.
   Exposes MI.CalendarView. */
try {
(function (MI) {
  const { useState, useEffect } = React;
  const { card, cta, ghost, eyebrow } = MI.ui;

  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = (k) => new Date(k + "T12:00:00");

  MI.CalendarView = ({ open, onClose, program, weekPlan, week, setWeek, blockStart, history, dayPlan, rhythm, logs, onStart, onOpenDay, initialDate }) => {
    const [sel, setSel] = useState(initialDate || MI.todayKey());
    const [month, setMonth] = useState(() => { const d = parse(initialDate || MI.todayKey()); return new Date(d.getFullYear(), d.getMonth(), 1); });
    useEffect(() => { if (open) { const d = parse(initialDate || MI.todayKey()); setSel(key(d)); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); } }, [open]); // eslint-disable-line
    if (!open) return null;

    const start = parse(blockStart);
    const weekOf = (k) => Math.floor((parse(k).getTime() - start.getTime()) / (7 * 86400000));
    const plannedFor = (k) => dayPlan[k] || rhythm[(parse(k).getDay() + 6) % 7] || "REST";
    const status = (k) => {
      if (history[k]) return "done";
      const p = plannedFor(k);
      if (p === "REST" || p === "Rest") return "rest";
      return "scheduled";
    };
    const y = month.getFullYear(), m = month.getMonth();
    const firstOffset = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysIn = new Date(y, m + 1, 0).getDate();
    const monthName = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const today = MI.todayKey();
    const selPlan = plannedFor(sel);
    const selStatus = status(sel);
    const dayIdx = program.days.findIndex((d) => d.name === selPlan || (history[sel] && d.name === history[sel].day));
    const day = dayIdx >= 0 ? program.days[dayIdx] : null;
    const selWeek = weekOf(sel);
    const jumpWeek = (i) => {
      setWeek(i);
      const d = new Date(start); d.setDate(start.getDate() + i * 7 - ((start.getDay() + 6) % 7));
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSel(key(d));
    };

    return (
      <div className="fixed inset-0 z-[87] flex flex-col overflow-y-auto bg-[#050505] px-4 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
        <MI.Plate plate="skeleton" opacity={0.14} position="right -10%" size="auto 90%" className="!fixed" />
        <div className="relative flex items-center justify-between">
          <div><p className={eyebrow}>The block at a glance</p><h2 className="dp mt-1 text-[36px] uppercase leading-none text-[#F2EFE8]">Calendar</h2></div>
          <button onClick={onClose} className={ghost + " px-4 py-2 text-xs"}>Done</button>
        </div>

        {/* week strip with the block's real names */}
        <div className="relative mt-4 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {weekPlan.map((w, i) => (
            <button key={w.label} onClick={() => jumpWeek(i)} className={"shrink-0 rounded-md border px-3 py-2 text-left " + (i === week ? "border-[#FF2B2B] bg-[#FF2B2B] text-white" : i < week ? "border-neutral-800 bg-neutral-900 text-neutral-400" : "border-neutral-800 bg-[#141414] text-neutral-500")}>
              <p className="dp text-[12px] uppercase leading-none">Week {i + 1}</p>
              <p className="mono mt-0.5 text-[9px] uppercase tracking-wider">{w.tag}</p>
            </button>
          ))}
        </div>

        <div className="relative mt-4 flex items-center justify-between">
          <button onClick={() => setMonth(new Date(y, m - 1, 1))} className="rounded-lg border border-neutral-800 px-3 py-1 text-sm text-neutral-400" aria-label="Previous month">‹</button>
          <h3 className="dp text-base uppercase tracking-wide text-neutral-200">{monthName}</h3>
          <button onClick={() => setMonth(new Date(y, m + 1, 1))} className="rounded-lg border border-neutral-800 px-3 py-1 text-sm text-neutral-400" aria-label="Next month">›</button>
        </div>
        <div className="mono relative mt-2 grid grid-cols-7 gap-1 text-center text-[9px] text-neutral-600">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="relative mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstOffset }).map((_, i) => <div key={"e" + i} />)}
          {Array.from({ length: daysIn }).map((_, i) => {
            const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            const st = status(k);
            const wk = weekOf(k);
            const inBlock = wk >= 0 && wk < weekPlan.length;
            const isSel = sel === k, isToday = k === today;
            return (
              <button key={k} onClick={() => setSel(k)} data-status={st}
                className={"flex aspect-square flex-col items-center justify-center rounded-lg text-xs " + (isSel ? "bg-[#F2EFE8] text-neutral-950" : isToday ? "border border-[#FF2B2B] text-neutral-100" : inBlock && wk === week ? "bg-[#1a0a0a] text-neutral-200" : "bg-[#141414] text-neutral-400")}>
                <span className="mono">{i + 1}</span>
                <span className={"mt-0.5 h-1.5 w-1.5 rounded-full " + (st === "done" ? (isSel ? "bg-neutral-950" : "bg-[#F2EFE8]") : st === "scheduled" ? "bg-[#FF2B2B]" : (isSel ? "bg-neutral-400" : "bg-neutral-800"))} />
              </button>
            );
          })}
        </div>
        <p className="mono relative mt-1.5 text-[9px] text-neutral-600"><span className="text-[#FF2B2B]">●</span> scheduled · <span className="text-[#F2EFE8]">●</span> completed · <span className="text-neutral-700">●</span> rest</p>

        {/* the day */}
        <div className={card + " relative mt-4 overflow-hidden"}>
          <div className={"h-1 w-full " + (selStatus === "done" ? "bg-[#F2EFE8]" : selStatus === "scheduled" ? "bg-[#FF2B2B]" : "bg-neutral-800")} />
          <div className="p-4">
            <p className="mono text-[10px] uppercase tracking-widest text-neutral-500">{parse(sel).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}{selWeek >= 0 && selWeek < weekPlan.length ? " · Week " + (selWeek + 1) + " " + weekPlan[selWeek].tag : ""}</p>
            <p className="dp mt-1 text-[26px] uppercase leading-none text-[#F2EFE8]">
              {selStatus === "done" ? "Completed" : selStatus === "scheduled" ? "Scheduled" : "Rest"} — {selStatus === "done" ? history[sel].day : selStatus === "scheduled" ? selPlan : "part of the plan"}{selStatus === "scheduled" ? <span className="text-neutral-500"> — Not started</span> : null}
            </p>
            {day && (
              <ol className="mt-3 space-y-1.5">
                {day.exercises.map((e, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="dp w-6 text-base text-neutral-600">{String(i + 1).padStart(2, "0")}</span>
                    <MI.ExerciseInfographic name={e.name} size={26} onOpen={onOpenDay} />
                    <div className="min-w-0 flex-1"><p className="dp truncate text-[14px] uppercase tracking-wide text-neutral-100">{e.name}</p><p className="mono text-[9px] text-neutral-500">{(e.scheme || []).join(" / ")} · {e.tempo}</p></div>
                    {selStatus === "done" && history[sel].items && history[sel].items[i] && <span className="mono shrink-0 text-[9px] text-neutral-500">{(history[sel].items[i].sets || []).filter((s) => s.w || s.r).map((s) => `${s.w || "?"}×${s.r || "?"}`).join(" ")}</span>}
                  </li>
                ))}
              </ol>
            )}
            {selStatus === "rest" && <p className="mt-2 text-xs text-neutral-500">Muscle protein synthesis runs ~48 h after a session. Rest days are growth days.</p>}
            {day && selStatus !== "done" && (
              <button onClick={() => onStart(dayIdx, sel)} className={cta + " mt-4 w-full py-3.5 text-sm"}>{sel === today ? "Start session" : sel < today ? "Log this session" : "Start session early"}</button>
            )}
          </div>
        </div>
      </div>
    );
  };
})(window.MI);
} catch (e) { showErr("calendar: " + e.message); }
