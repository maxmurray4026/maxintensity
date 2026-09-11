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

  /* ---- image downscale (photos stay on the phone, small) ----
     Robust to what phones actually hand over: tries createImageBitmap (handles
     HEIC on iOS Safari and EXIF orientation), then an <img> decode, and if the
     browser cannot decode the file at all it falls back to the original bytes
     when they are small enough, so the user always sees their photo. */
  MI.downscale = async (file, max = 900, q = 0.72) => {
    const draw = (w, h, paint) => {
      const scale = Math.min(1, max / Math.max(w, h));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
      paint(c.getContext("2d"), c.width, c.height);
      return c.toDataURL("image/jpeg", q);
    };
    try {
      if (window.createImageBitmap) {
        const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => createImageBitmap(file));
        const out = draw(bmp.width, bmp.height, (g, w, h) => g.drawImage(bmp, 0, 0, w, h));
        bmp.close && bmp.close();
        return out;
      }
    } catch (e) { /* fall through */ }
    const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onerror = rej; r.onload = () => res(r.result); r.readAsDataURL(file); });
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
      return draw(img.naturalWidth || img.width, img.naturalHeight || img.height, (g, w, h) => g.drawImage(img, 0, 0, w, h));
    } catch (e) {
      if (file.size <= 2.5 * 1024 * 1024) return dataUrl; // undecodable here (e.g. HEIC on desktop) — keep the original, the phone will show it
      throw new Error("That photo couldn't be read. Try a JPEG or take it with the camera.");
    }
  };
  MI.previewUrl = (file) => { try { return URL.createObjectURL(file); } catch (e) { return null; } };

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

  /* ---- horizontal swipe with momentum. Touch and pointer. Vertical scrolling
     is left to the browser (touch-action: pan-y); a gesture that starts within
     24px of a screen edge is ignored so iOS Safari's back/forward edge swipe is
     never fought. Commit on distance (>70px) or velocity (>0.45 px/ms). ---- */
  MI.Swipe = ({ onPrev, onNext, children, className, style, edge = 24 }) => {
    const [dx, setDx] = useState(0);
    const [phase, setPhase] = useState("idle"); // idle | drag | out-left | out-right | in
    const st = useRef(null);
    const block = useRef(false); // a horizontal drag must never land as a click on what's under the finger
    const pt = (e) => (e.touches ? e.touches[0] : e.changedTouches ? e.changedTouches[0] : e);
    const begin = (e) => {
      if (phase !== "idle" && phase !== "drag") return;
      const p = pt(e);
      if (p.clientX < edge || p.clientX > window.innerWidth - edge) { st.current = null; return; }
      st.current = { x: p.clientX, y: p.clientY, t: performance.now(), axis: null, last: p.clientX, lastT: performance.now() };
    };
    const move = (e) => {
      const s = st.current; if (!s) return;
      const p = pt(e);
      const ddx = p.clientX - s.x, ddy = p.clientY - s.y;
      if (!s.axis) { if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return; s.axis = Math.abs(ddx) > Math.abs(ddy) * 1.2 ? "x" : "y"; if (s.axis === "x") setPhase("drag"); }
      if (s.axis !== "x") return;
      s.last = p.clientX; s.lastT = performance.now();
      setDx(ddx);
    };
    const end = () => {
      const s = st.current; st.current = null;
      if (!s || s.axis !== "x") { setDx(0); setPhase("idle"); return; }
      block.current = true; setTimeout(() => { block.current = false; }, 400);
      const v = (s.last - s.x) / Math.max(1, s.lastT - s.t);
      const d = s.last - s.x;
      const commit = Math.abs(d) > 70 || Math.abs(v) > 0.45;
      if (commit && d < 0 && onNext) { setPhase("out-left"); setTimeout(() => { onNext(); setDx(0); setPhase("in"); setTimeout(() => setPhase("idle"), 220); }, 160); }
      else if (commit && d > 0 && onPrev) { setPhase("out-right"); setTimeout(() => { onPrev(); setDx(0); setPhase("in"); setTimeout(() => setPhase("idle"), 220); }, 160); }
      else { setDx(0); setPhase("idle"); }
    };
    const tf = phase === "out-left" ? "translateX(-110%)" : phase === "out-right" ? "translateX(110%)" : phase === "drag" ? `translateX(${dx}px)` : "translateX(0)";
    const trans = phase === "drag" ? "none" : phase === "in" ? "transform .22s cubic-bezier(.2,.8,.2,1), opacity .22s" : "transform .16s ease-in, opacity .16s";
    return (
      <div className={className} style={{ touchAction: "pan-y", overscrollBehaviorX: "none", ...(style || {}) }}
        onClickCapture={(e) => { if (block.current) { e.stopPropagation(); e.preventDefault(); } }}
        onTouchStart={begin} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}
        onPointerDown={(e) => { if (e.pointerType === "mouse") begin(e); }} onPointerMove={(e) => { if (e.pointerType === "mouse" && st.current) move(e); }} onPointerUp={(e) => { if (e.pointerType === "mouse") end(); }} onPointerLeave={(e) => { if (e.pointerType === "mouse" && st.current) end(); }}>
        <div style={{ transform: tf, transition: trans, opacity: phase.startsWith("out") ? 0.4 : 1, willChange: "transform" }}>{children}</div>
      </div>
    );
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

  /* ---- voice recorder (round 4). One instance per take: start() acquires the
     mic, records audio (MediaRecorder) for playback, meters it for the waveform
     and runs speech recognition alongside for the transcript; stop() releases
     everything (tracks, audio context, recogniser) and resolves the take, so the
     next start() is a clean new recording. States: idle → recording →
     processing → done (or error). ---- */
  MI.useRecorder = () => {
    const [state, setState] = useState("idle");
    const [levels, setLevels] = useState([]);
    const [secs, setSecs] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState("");
    const ref = useRef(null);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const release = () => {
      const r = ref.current; ref.current = null;
      if (!r) return;
      r.active = false;
      try { r.sr && (r.sr.onend = null, r.sr.onresult = null, r.sr.abort()); } catch (e) {}
      try { r.stream && r.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
      try { r.ac && r.ac.close(); } catch (e) {}
      clearInterval(r.timer); cancelAnimationFrame(r.raf);
    };
    const start = async () => {
      release();
      setTranscript(""); setLevels([]); setSecs(0); setError("");
      const r = { chunks: [], t0: Date.now(), active: true, base: "" };
      ref.current = r;
      try { r.stream = navigator.mediaDevices ? await navigator.mediaDevices.getUserMedia({ audio: true }) : null; } catch (e) { r.stream = null; }
      if (ref.current !== r) return; // stopped while waiting for permission
      if (r.stream && window.MediaRecorder) {
        try { const mr = new MediaRecorder(r.stream); mr.ondataavailable = (e) => { if (e.data && e.data.size) r.chunks.push(e.data); }; r.mr = mr; mr.start(250); } catch (e) {}
        try {
          const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC(); const an = ac.createAnalyser(); an.fftSize = 256;
          ac.createMediaStreamSource(r.stream).connect(an); r.ac = ac;
          const buf = new Uint8Array(an.fftSize);
          const tick = () => { if (!r.active) return; an.getByteTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; } const rms = Math.sqrt(sum / buf.length); setLevels((L) => [...L.slice(-47), Math.min(1, rms * 4)]); r.raf = requestAnimationFrame(tick); };
          tick();
        } catch (e) {}
      }
      if (SR) {
        try {
          const sr = new SR(); sr.lang = "en-GB"; sr.interimResults = true; sr.continuous = true;
          sr.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setTranscript((r.base + " " + t).trim()); };
          sr.onerror = () => {};
          sr.onend = () => { if (r.active) { setTranscript((cur) => { r.base = cur; return cur; }); try { sr.start(); } catch (e) {} } };
          r.sr = sr; sr.start();
        } catch (e) {}
      }
      if (!r.stream && !SR) { setError("No microphone here — type it instead."); setState("error"); release(); return; }
      r.timer = setInterval(() => setSecs(Math.round((Date.now() - r.t0) / 1000)), 500);
      setState("recording");
    };
    const stop = () => new Promise((resolve) => {
      const r = ref.current;
      if (!r) { setState("idle"); return resolve(null); }
      setState("processing");
      r.active = false;
      clearInterval(r.timer); cancelAnimationFrame(r.raf);
      try { r.sr && (r.sr.onend = null, r.sr.stop()); } catch (e) {}
      const finish = () => {
        const dur = Math.round((Date.now() - r.t0) / 1000);
        const blob = r.chunks.length ? new Blob(r.chunks, { type: (r.mr && r.mr.mimeType) || "audio/webm" }) : null;
        release();
        if (!blob) { setState("done"); return resolve({ audio: null, duration: dur }); }
        const fr = new FileReader();
        fr.onload = () => { setState("done"); resolve({ audio: fr.result, duration: dur }); };
        fr.onerror = () => { setState("done"); resolve({ audio: null, duration: dur }); };
        fr.readAsDataURL(blob);
      };
      if (r.mr && r.mr.state !== "inactive") { r.mr.onstop = finish; try { r.mr.stop(); } catch (e) { finish(); } }
      else finish();
    });
    const reset = () => { release(); setState("idle"); setLevels([]); setSecs(0); setTranscript(""); setError(""); };
    useEffect(() => release, []); // eslint-disable-line
    return { state, setState, levels, secs, transcript, setTranscript, error, start, stop, reset, supported: !!((navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || SR) };
  };

  /* Live waveform: the last ~48 level samples as bars; idle shows a flat line. */
  MI.Waveform = ({ levels = [], active, className }) => (
    <div className={"flex h-12 items-center gap-[2px] " + (className || "")} aria-hidden>
      {Array.from({ length: 48 }, (_, i) => {
        const v = levels[levels.length - 48 + i] || 0;
        return <span key={i} className={"w-[3px] flex-1 rounded-full " + (active ? "bg-[#FF2B2B]" : "bg-neutral-700")} style={{ height: Math.max(2, Math.round(v * 44)) + "px", transition: "height .08s" }} />;
      })}
    </div>
  );

  /* Voice take with a visible state line. onResult({ transcript, audio, duration }). */
  MI.VoiceTake = ({ onResult, hint = "Say what you ate — “300 grams of mince, rice and a glass of milk”", busy, saved, onAgain }) => {
    const rec = MI.useRecorder();
    const fmt = (n) => Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
    const label = saved ? "Saved" : busy ? "Processing" : rec.state === "recording" ? "Recording · " + fmt(rec.secs) : rec.state === "processing" ? "Processing" : rec.state === "done" ? "Ready to log" : rec.state === "error" ? "Microphone unavailable" : "Ready";
    const take = useRef(null);
    const stop = async () => { take.current = await rec.stop(); };
    const use = () => { const t = take.current || {}; onResult({ transcript: rec.transcript.trim(), audio: t.audio || null, duration: t.duration || 0 }); };
    return (
      <div>
        <div className="flex items-center justify-between">
          <span className={"mono text-[10px] uppercase tracking-widest " + (rec.state === "recording" ? "text-[#FF2B2B]" : saved ? "text-[#F2EFE8]" : "text-neutral-500")} data-voice-state={saved ? "saved" : busy || rec.state === "processing" ? "processing" : rec.state}>
            {rec.state === "recording" && <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-[#FF2B2B] align-middle" />}{label}
          </span>
          {rec.state === "recording" && <span className="mono text-[10px] text-neutral-500">tap stop when you're done</span>}
        </div>
        <MI.Waveform levels={rec.levels} active={rec.state === "recording"} className="mt-2" />
        {saved ? (
          <button onClick={onAgain} className={MI.ui.ghost + " mt-3 w-full py-3.5 text-sm"}>Log another</button>
        ) : rec.state === "recording" ? (
          <button onClick={stop} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#FF2B2B] bg-[#1c0808] py-4 text-[#FF2B2B]" aria-label="Stop recording">
            <span className="h-4 w-4 rounded-sm bg-[#FF2B2B]" /><span className="dp text-lg uppercase">Stop</span>
          </button>
        ) : rec.state === "processing" || busy ? (
          <div className="mt-3 flex w-full items-center justify-center rounded-lg border border-neutral-800 py-4"><span className="dp text-lg uppercase text-neutral-400">Working…</span></div>
        ) : (
          <button onClick={rec.start} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-700 py-4 text-neutral-100" aria-label="Start recording">
            <MI.Ic d={MI.PATHS.MIC} className="h-6 w-6" /><span className="dp text-lg uppercase">{rec.state === "done" ? "Record again" : "Tap and speak"}</span>
          </button>
        )}
        {!saved && <textarea value={rec.transcript} onChange={(e) => rec.setTranscript(e.target.value)} rows={2} placeholder={rec.state === "error" ? "Type it here" : hint} className="mt-3 w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600" aria-label="Transcript" />}
        {!saved && rec.state !== "recording" && <button onClick={use} disabled={busy || !rec.transcript.trim()} className={MI.ui.cta + " mt-3 w-full py-3.5 text-sm disabled:opacity-50"}>{busy ? "Working…" : "Log it"}</button>}
        {rec.error && <p className="mono mt-2 text-[10px] text-neutral-500">{rec.error}</p>}
      </div>
    );
  };

  /* Camera frame with a shutter. Live preview where the camera API allows it;
     otherwise the same frame opens the device camera through a file input. */
  MI.CameraFrame = ({ onCapture, busy }) => {
    const vid = useRef(null);
    const [live, setLive] = useState(false);
    const [stream, setStream] = useState(null);
    useEffect(() => {
      let st = null, dead = false;
      (async () => {
        try {
          st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
          if (dead) { st.getTracks().forEach((t) => t.stop()); return; }
          setStream(st); setLive(true);
          if (vid.current) { vid.current.srcObject = st; vid.current.play().catch(() => {}); }
        } catch (e) { setLive(false); }
      })();
      return () => { dead = true; try { (st || stream) && (st || stream).getTracks().forEach((t) => t.stop()); } catch (e) {} };
    }, []); // eslint-disable-line
    const shutter = () => {
      const v = vid.current; if (!v || !v.videoWidth) return;
      const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      c.toBlob((b) => b && onCapture(new File([b], "meal.jpg", { type: "image/jpeg" })), "image/jpeg", 0.8);
    };
    return (
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d]">
          <video ref={vid} playsInline muted className={"h-full w-full object-cover " + (live ? "" : "hidden")} />
          {!live && <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 text-neutral-500">
            <MI.Ic d={MI.PATHS.CAMERA} className="h-8 w-8" /><span className="mono text-[10px] uppercase tracking-widest">Tap to open the camera</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" disabled={busy} onChange={(e) => e.target.files && e.target.files[0] && onCapture(e.target.files[0])} />
          </label>}
          <div className="pointer-events-none absolute inset-3 rounded-lg border border-[#F2EFE8]/25" />
        </div>
        {live ? (
          <button onClick={shutter} disabled={busy} className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#F2EFE8] disabled:opacity-50" aria-label="Take photo">
            <span className={"h-12 w-12 rounded-full " + (busy ? "bg-neutral-600" : "bg-[#FF2B2B]")} />
          </button>
        ) : (
          <label className={MI.ui.cta + " mt-4 flex w-full cursor-pointer items-center justify-center py-3.5 text-sm"}>{busy ? "Reading…" : "Open camera"}<input type="file" accept="image/*" capture="environment" className="hidden" disabled={busy} onChange={(e) => e.target.files && e.target.files[0] && onCapture(e.target.files[0])} /></label>
        )}
        <p className="mono mt-2 text-center text-[9px] text-neutral-600">{busy ? "The coach is reading the plate…" : "Frame the whole plate. One shot."}</p>
      </div>
    );
  };

  /* Calorie ring: eaten / target, big number in the centre. */
  MI.Ring = ({ value = 0, target = 1, size = 176, stroke = 12, label = "kcal", sub }) => {
    const r = (size - stroke) / 2, C = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(1, value / (target || 1)));
    const over = value > target;
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f1f1f" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={over ? "#F2EFE8" : "#FF2B2B"} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="dp text-[44px] leading-none text-[#F2EFE8]">{Math.round(value)}</span>
          <span className="mono mt-1 text-[10px] uppercase tracking-widest text-neutral-500">{sub || `of ${Math.round(target)} ${label}`}</span>
        </div>
      </div>
    );
  };

  /* Row you swipe left to delete (touch or mouse). Tap = onTap. */
  MI.SwipeRow = ({ onDelete, onTap, children, className, deleteLabel = "Delete" }) => {
    const [dx, setDx] = useState(0);
    const st = useRef(null);
    const pt = (e) => (e.touches ? e.touches[0] : e.changedTouches ? e.changedTouches[0] : e);
    const begin = (e) => { if (e.target && e.target.closest && e.target.closest("button, a, input, textarea")) { st.current = null; return; } const p = pt(e); st.current = { x: p.clientX, y: p.clientY, axis: null, moved: false }; };
    const move = (e) => {
      const s = st.current; if (!s) return; const p = pt(e);
      const ddx = p.clientX - s.x, ddy = p.clientY - s.y;
      if (!s.axis) { if (Math.abs(ddx) < 6 && Math.abs(ddy) < 6) return; s.axis = Math.abs(ddx) > Math.abs(ddy) ? "x" : "y"; }
      if (s.axis !== "x") return;
      s.moved = true;
      setDx(Math.max(-140, Math.min(0, ddx)));
    };
    const end = () => {
      const s = st.current; st.current = null; if (!s) return;
      if (s.moved && dx < -90) { setDx(-400); setTimeout(() => onDelete && onDelete(), 160); return; }
      if (s.moved) { setDx(dx < -50 ? -88 : 0); return; }
      if (dx !== 0) { setDx(0); return; }
      onTap && onTap();
    };
    return (
      <div className={"relative overflow-hidden rounded-xl " + (className || "")} style={{ touchAction: "pan-y" }}>
        <button onClick={() => { setDx(-400); setTimeout(() => onDelete && onDelete(), 160); }} className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center bg-[#FF2B2B] text-white" aria-label={deleteLabel} tabIndex={dx < 0 ? 0 : -1}>
          <span className="mono text-[10px] uppercase tracking-widest">{deleteLabel}</span>
        </button>
        <div className="relative bg-[#141414]" style={{ transform: `translateX(${dx}px)`, transition: st.current ? "none" : "transform .18s ease-out" }}
          onTouchStart={begin} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}
          onPointerDown={(e) => { if (e.pointerType === "mouse") begin(e); }} onPointerMove={(e) => { if (e.pointerType === "mouse" && st.current) move(e); }} onPointerUp={(e) => { if (e.pointerType === "mouse") end(); }}>
          {children}
        </div>
      </div>
    );
  };

  /* ---- analytics (round 4): a handful of product events, no identity. Counted
     locally, and sent to the worker's /event endpoint as {e, p, t, s} with a
     random per-session id only — no handle, no email, nothing persistent.
     Honours Do Not Track / Global Privacy Control by keeping events local. ---- */
  const SID = Math.random().toString(36).slice(2, 10);
  MI.track = (name, props) => {
    try {
      const day = MI.todayKey();
      const all = JSON.parse(localStorage.getItem("mi:mi-events") || "{}");
      const d = all[day] || {}; d[name] = (d[name] || 0) + 1;
      const keep = {}; Object.keys(all).sort().slice(-14).forEach((k) => (keep[k] = all[k])); keep[day] = d;
      localStorage.setItem("mi:mi-events", JSON.stringify(keep));
    } catch (e) {}
    try {
      const dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
      if (dnt || !window.MI_SERVER || !window.MI_APP_TOKEN) return;
      const body = JSON.stringify({ e: name, p: props || {}, t: Date.now(), s: SID, v: window.MI_VERSION || "" });
      fetch(window.MI_SERVER + "/event", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", "x-mi-app": window.MI_APP_TOKEN }, body }).catch(() => {});
    } catch (e) {}
  };

  /* iPhone install sheet: Safari only allows notifications and a full-screen
     app from the Home Screen. Two steps, drawn, shown once on first visit. */
  MI.InstallSheet = ({ open, onClose }) => {
    if (!open) return null;
    const Step = ({ n, title, sub, icon }) => (
      <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-[#141414] p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0d0d0d] text-[#F2EFE8]">{icon}</div>
        <div className="min-w-0">
          <p className="mono text-[10px] uppercase tracking-widest text-[#FF2B2B]">Step {n}</p>
          <p className="dp mt-0.5 text-lg uppercase leading-none text-[#F2EFE8]">{title}</p>
          <p className="mt-1 text-xs text-neutral-400">{sub}</p>
        </div>
      </div>
    );
    return (
      <div className="fixed inset-0 z-[90] flex flex-col justify-end" data-install-sheet="1">
        <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/75" />
        <div className="relative rounded-t-2xl border-t border-neutral-800 bg-[#0d0d0d] px-5 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-800" />
          <p className={MI.ui.eyebrow}>Add to Home Screen</p>
          <h3 className="dp mt-1 text-[30px] uppercase leading-[0.95] text-[#F2EFE8]">Put it on your <span className="text-[#FF2B2B]">phone.</span></h3>
          <p className="mt-2 text-sm text-neutral-400">Full screen, offline, and the only way iPhone lets us send you a nudge. Two taps.</p>
          <div className="mt-4 space-y-2">
            <Step n={1} title="Tap Share" sub="The square with the arrow, in Safari's bar at the bottom." icon={<svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8" /></svg>} />
            <Step n={2} title="Add to Home Screen" sub="Scroll the sheet a little, tap it, then Add." icon={<svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8.5v7M8.5 12h7" /></svg>} />
          </div>
          <button onClick={onClose} className={MI.ui.cta + " mt-4 w-full py-3.5 text-sm"}>Got it</button>
        </div>
      </div>
    );
  };

  MI.fmtDate = (k) => new Date(k + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  MI.todayKey = () => new Date().toISOString().slice(0, 10);
})(window.MI);
} catch (e) { showErr("ui: " + e.message); }
