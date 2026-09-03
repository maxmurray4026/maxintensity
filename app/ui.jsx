/* MAX INTENSITY — shared UI kit. Loaded by Babel before the app. Exposes window.MI. */
try {
window.MI = window.MI || {};
(function (MI) {
  const { useState, useEffect, useRef } = React;

  MI.RED = "#FF2B2B"; MI.BLACK = "#050505"; MI.BONE = "#F2EFE8";
  MI.ui = {
    card: "rounded-xl border border-neutral-800 bg-[#141414]",
    chip: "rounded-md px-3 py-1.5 text-xs font-semibold",
    cta: "dp rounded-lg bg-[#FF2B2B] text-white uppercase tracking-[0.12em] active:bg-red-700",
    ghost: "dp rounded-lg border border-neutral-700 bg-transparent text-neutral-300 uppercase tracking-[0.12em]",
    eyebrow: "mono text-[10px] uppercase tracking-[0.25em] text-[#FF2B2B]",
    label: "mono text-[10px] uppercase tracking-widest text-neutral-500",
  };

  MI.PATHS = {
    FLAME: "M12 2c1.5 4.5-3 5.5-3 9.5a3 3 0 006 0c0-2-1-3-1-5 3 2 5 4.5 5 7.5a7 7 0 11-14 0C5 8.5 10 7 12 2z",
    STAR: "M12 3l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7L12 3z",
    GEAR: "M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9L19 19M19 5l-2.1 2.1M7.1 16.9L5 19",
    LOCK: "M7 10.5V7a5 5 0 0110 0v3.5M5 10.5h14V21H5v-10.5z",
    CHART: "M4 20V10M10 20V4M16 20v-8M20 20H4",
    TROPHY: "M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 20h8",
    SHIELD: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z",
    MIC: "M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v4M9 21h6",
    CAMERA: "M4 8h3l2-3h6l2 3h3v11H4V8zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
    CHECK: "M5 12l4.5 4.5L19 7",
    PLUS: "M12 5v14M5 12h14",
    USERS: "M9 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20a6 6 0 0112 0M16 11a3 3 0 100-6M21 20a5 5 0 00-5-5",
    BODY: "M12 6a2 2 0 100-4 2 2 0 000 4zM8 9h8l-1 6h-1l-1 7h-2l-1-7H9L8 9z",
    UPLOAD: "M12 16V4M6 10l6-6 6 6M4 20h16",
    ARROW: "M5 12h14M13 6l6 6-6 6",
    BOLT: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
    HEART: "M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z",
    FILE: "M6 3h8l4 4v14H6V3zM14 3v4h4M9 12h6M9 16h6",
  };

  MI.Ic = ({ d, className, fill }) => (
    <svg viewBox="0 0 24 24" className={className} fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );

  /* ---- rank badges: one ink per tier, chevrons count the tier ---- */
  MI.RANK_COLORS = {
    Bronze: "#B9733A", Silver: "#C9C9C9", Gold: "#E6B422", Diamond: "#8FD3FF",
    Champion: "#FF2B2B", Elite: "#F2EFE8", Iridescent: "url(#mi-irid)",
  };
  MI.RankBadge = ({ name, index, size = 64, className }) => {
    const i = index == null ? (window.MI_RANK ? window.MI_RANK.TIERS.indexOf(name) : 0) : index;
    const col = MI.RANK_COLORS[name] || "#B9733A";
    const chev = Math.max(1, i + 1);
    return (
      <svg viewBox="0 0 64 72" width={size} height={size * 1.125} className={className} aria-label={name + " rank"}>
        <defs>
          <linearGradient id="mi-irid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF2B2B" /><stop offset=".35" stopColor="#F2EFE8" /><stop offset=".7" stopColor="#8FD3FF" /><stop offset="1" stopColor="#FF2B2B" />
          </linearGradient>
        </defs>
        <path d="M32 3l26 9v22c0 16-11 27-26 34C17 61 6 50 6 34V12l26-9z" fill="#0d0d0d" stroke={col} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M32 9l20 7v18c0 12-8 21-20 27-12-6-20-15-20-27V16l20-7z" fill="none" stroke={col} strokeWidth="1" opacity=".5" />
        {Array.from({ length: Math.min(chev, 7) }).map((_, k) => {
          const y = 48 - k * 5.2;
          return <path key={k} d={`M20 ${y} L32 ${y - 8} L44 ${y}`} fill="none" stroke={col} strokeWidth={k === chev - 1 ? 3 : 1.6} strokeLinecap="round" strokeLinejoin="round" opacity={k === chev - 1 ? 1 : 0.55} />;
        })}
      </svg>
    );
  };

  MI.LevelPill = ({ points, className }) => {
    const L = window.MI_PROJ ? window.MI_PROJ.levelFor(points) : { level: 1, title: "Recruit", pct: 0 };
    return (
      <span className={"mono inline-flex items-center gap-1.5 rounded-md border border-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-300 " + (className || "")}>
        <span className="text-[#FF2B2B]">L{L.level}</span>{L.title}
      </span>
    );
  };

  /* ---- sounds (WebAudio, no assets) ---- */
  MI.sound = (kind) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const note = (f, t0, dur, g0, type) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = type || "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
        g.gain.exponentialRampToValueAtTime(g0, ctx.currentTime + t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur);
        o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur + 0.05);
      };
      if (kind === "pr") { note(523.25, 0, 0.18, 0.16); note(659.25, 0.12, 0.18, 0.16); note(783.99, 0.24, 0.22, 0.18); note(1046.5, 0.36, 0.55, 0.2); note(1568, 0.4, 0.35, 0.05, "sine"); }
      else if (kind === "rankup") { note(392, 0, 0.25, 0.14); note(523.25, 0.2, 0.25, 0.16); note(659.25, 0.4, 0.3, 0.18); note(783.99, 0.6, 0.9, 0.2); note(1567.98, 0.7, 0.6, 0.05, "sine"); }
      else if (kind === "ignite") { note(110, 0, 0.6, 0.18, "sawtooth"); note(220, 0.05, 0.5, 0.1, "square"); note(880, 0.1, 0.25, 0.04, "sine"); }
      else if (kind === "tick") { note(1200, 0, 0.05, 0.06, "sine"); }
      else if (kind === "reveal") { note(261.6, 0, 0.5, 0.12); note(392, 0.15, 0.8, 0.14); }
      if (navigator.vibrate && kind !== "tick") navigator.vibrate(kind === "pr" || kind === "rankup" ? [60, 40, 120] : 40);
    } catch (e) {}
  };

  MI.Confetti = ({ n = 44 }) => (
    <>
      {Array.from({ length: n }).map((_, ci) => (
        <span key={ci} aria-hidden className="confetti absolute top-0" style={{
          left: ((ci * 47) % 100) + "%",
          background: ["#FF2B2B", "#F2EFE8", "#FFD24A", "#FF7A2B"][ci % 4],
          width: 5 + ((ci * 13) % 6) + "px", height: 9 + ((ci * 7) % 8) + "px",
          animationDelay: ((ci * 83) % 1100) / 1000 + "s", animationDuration: 2.1 + ((ci * 29) % 12) / 10 + "s",
        }} />
      ))}
    </>
  );

  /* ---- long-press with progress ring ---- */
  MI.HoldButton = ({ ms = 1600, onComplete, label = "Hold", done, children, className }) => {
    const [p, setP] = useState(0);
    const raf = useRef(null), t0 = useRef(0), fired = useRef(false);
    const stop = () => { cancelAnimationFrame(raf.current); if (!fired.current) setP(0); };
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0.current) / ms);
      setP(k);
      if (k >= 1) { if (!fired.current) { fired.current = true; onComplete && onComplete(); } return; }
      raf.current = requestAnimationFrame(tick);
    };
    const start = (e) => { if (fired.current || done) return; e.preventDefault(); t0.current = performance.now(); raf.current = requestAnimationFrame(tick); };
    useEffect(() => () => cancelAnimationFrame(raf.current), []);
    const R = 54, C = 2 * Math.PI * R;
    return (
      <button
        onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={(e) => e.preventDefault()}
        className={"relative flex h-40 w-40 select-none items-center justify-center rounded-full " + (className || "")}
        style={{ touchAction: "none", WebkitUserSelect: "none" }} aria-label={label}
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#1f1f1f" strokeWidth="4" />
          <circle cx="60" cy="60" r={R} fill="none" stroke="#FF2B2B" strokeWidth="4" strokeDasharray={C} strokeDashoffset={C * (1 - (done ? 1 : p))} strokeLinecap="round" />
        </svg>
        <span className="relative">{typeof children === "function" ? children(done ? 1 : p) : children}</span>
      </button>
    );
  };

  /* ---- bottom sheet ---- */
  MI.Sheet = ({ open, onClose, title, children, z = 75 }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: z }}>
        <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
        <div className="relative max-h-[88vh] overflow-y-auto rounded-t-2xl border-t border-neutral-800 bg-[#0d0d0d] px-5 pb-8 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-800" />
          {title && <p className="dp text-2xl uppercase text-[#F2EFE8]">{title}</p>}
          {children}
        </div>
      </div>
    );
  };

  /* ---- image downscale (photos stay on the phone, small) ---- */
  MI.downscale = (file, max = 900, q = 0.72) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", q));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  /* ---- share a canvas as an image (Web Share with files → download → copy text) ---- */
  MI.shareCanvas = async (canvas, filename, text) => {
    try {
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return "shared"; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      return "downloaded";
    } catch (e) {
      try { await navigator.clipboard.writeText(text); return "copied"; } catch (e2) { return "failed"; }
    }
  };

  /* ---- Web Speech API hook with graceful fallback ---- */
  MI.useSpeech = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const rec = useRef(null);
    const start = () => {
      if (!SR) return false;
      try {
        const r = new SR(); r.lang = "en-GB"; r.interimResults = true; r.continuous = false;
        r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setTranscript(t); };
        r.onend = () => setListening(false);
        r.onerror = () => setListening(false);
        rec.current = r; setTranscript(""); r.start(); setListening(true);
        return true;
      } catch (e) { return false; }
    };
    const stop = () => { try { rec.current && rec.current.stop(); } catch (e) {} setListening(false); };
    return { supported: !!SR, listening, transcript, start, stop, setTranscript };
  };

  /* ---- muscle keyword mapping shared by picker, recap and coach ---- */
  MI.MUSCLES = [
    ["chest", "Chest"], ["back", "Back"], ["shoulders", "Shoulders"], ["arms", "Arms"], ["legs", "Legs"], ["glutes", "Glutes"], ["abs", "Abs"],
  ];
  MI.musclesFor = (name) => {
    const n = (name || "").toLowerCase();
    const out = [];
    if (/incline|flye|fly|dip|chest|clavicular|bench/.test(n)) out.push("chest");
    if (/row|pulldown|lat |lat$|pull-up|pullup|chin/.test(n)) out.push("back");
    if (/lateral|shoulder|press behind|overhead|ohp|smith press/.test(n)) out.push("shoulders");
    if (/curl(?!.*leg)|tricep|crossover|skull|pushdown|preacher/.test(n)) out.push("arms");
    if (/leg press|extension|squat|calf|adductor|abductor|leg curl|rdl|romanian|lunge/.test(n)) out.push("legs");
    if (/hip thrust|glute|rdl|romanian|abductor/.test(n)) out.push("glutes");
    if (/crunch|abs|plank|knee raise|leg raise|core/.test(n)) out.push("abs");
    if (/dip/.test(n)) out.push("arms");
    return Array.from(new Set(out));
  };

  MI.fmtDate = (k) => new Date(k + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  MI.todayKey = () => new Date().toISOString().slice(0, 10);
})(window.MI);
} catch (e) { showErr("ui: " + e.message); }
