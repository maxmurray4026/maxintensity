/* MAX INTENSITY — vintage anatomy layer.
   Plates sit BEHIND stat cards, graphs, progress bars and section headers at
   12–25% opacity, bone/red duotone on the black, the app's grain on top.
   Text stays AA-legible: the plate never exceeds 25% and the card ground is
   #141414 or darker. Exposes MI.Plate, MI.PlateCard, MI.MuscleMap. */
try {
(function (MI) {
  const { useState } = React;

  MI.PLATES = {
    skeleton: { file: "assets/anatomy/skeleton.svg", pos: "right -10%", size: "auto 150%" },
    legs: { file: "assets/anatomy/legs.svg", pos: "right 20%", size: "auto 150%" },
    back: { file: "assets/anatomy/back.svg", pos: "right 20%", size: "auto 160%" },
    torso: { file: "assets/anatomy/torso-heart.svg", pos: "right 30%", size: "auto 170%" },
    arm: { file: "assets/anatomy/arm.svg", pos: "right 10%", size: "auto 150%" },
  };

  /* Which plate a section gets. Legs behind lower-body, back/shoulder behind
     upper, torso/heart behind nutrition, skeleton behind rank and progress. */
  MI.plateFor = (section, dayName) => {
    const d = (dayName || "").toLowerCase();
    if (section === "session" || section === "train") {
      if (/leg|glute/.test(d)) return "legs";
      if (/arm/.test(d)) return "arm";
      return "back";
    }
    if (section === "nutrition" || section === "eat") return "torso";
    if (section === "arms") return "arm";
    return "skeleton";
  };

  /* Absolutely positioned backdrop. Parent needs `relative overflow-hidden`. */
  MI.Plate = ({ plate = "skeleton", opacity = 0.18, position, size, flip, red = 0.55, className, style }) => {
    const p = MI.PLATES[plate] || MI.PLATES.skeleton;
    const url = `url(${p.file})`;
    const pos = position || p.pos, sz = size || p.size;
    const mask = { WebkitMaskImage: url, maskImage: url, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: pos, maskPosition: pos, WebkitMaskSize: sz, maskSize: sz };
    if (p.lum) { mask.WebkitMaskMode = "luminance"; mask.maskMode = "luminance"; }
    return (
      <div aria-hidden className={"pointer-events-none absolute inset-0 z-0 " + (className || "")}
        style={{ opacity, transform: flip ? "scaleX(-1)" : undefined, ...mask, background: `linear-gradient(155deg, #F2EFE8 ${Math.round((1 - red) * 100)}%, #FF2B2B 100%)`, ...(style || {}) }} />
    );
  };

  /* Card with a plate behind the content. */
  MI.PlateCard = ({ plate, opacity = 0.16, flip, position, size, className, innerClassName, children, rule }) => (
    <div className={"relative overflow-hidden rounded-xl border border-neutral-800 bg-[#121212] " + (className || "")}>
      {rule && <div className="relative z-10 h-1 w-full bg-[#FF2B2B]" />}
      <MI.Plate plate={plate} opacity={opacity} flip={flip} position={position} size={size} />
      <div className={"relative z-10 " + (innerClassName || "")}>{children}</div>
    </div>
  );

  /* Section header with a plate strip behind it. */
  MI.PlateHeader = ({ plate, eyebrow, title, right, opacity = 0.2 }) => (
    <div className="relative -mx-4 overflow-hidden px-4 py-3">
      <MI.Plate plate={plate} opacity={opacity} position="right 28%" size="auto 340%" />
      <div className="relative z-10">
        {eyebrow && <p className={MI.ui.eyebrow}>{eyebrow}</p>}
        <div className="mt-1 flex items-end justify-between">
          <h2 className="dp text-[46px] uppercase leading-[0.9] text-[#F2EFE8]">{title}</h2>
          {right}
        </div>
      </div>
    </div>
  );

  /* ---- muscle map: front + back figure, regions fill red when worked ---- */
  const F = {
    chest: ["M62,76 C78,70 96,72 100,80 L100,112 C88,120 70,116 62,104 Z", "M138,76 C122,70 104,72 100,80 L100,112 C112,120 130,116 138,104 Z"],
    shoulders: ["M60,70 C48,74 44,88 48,100 C56,104 66,98 68,86 C68,78 66,72 60,70 Z", "M140,70 C152,74 156,88 152,100 C144,104 134,98 132,86 C132,78 134,72 140,70 Z"],
    arms: ["M46,102 C40,116 36,140 38,158 C44,160 52,156 54,146 C56,130 54,112 52,102 Z", "M154,102 C160,116 164,140 162,158 C156,160 148,156 146,146 C144,130 146,112 148,102 Z", "M36,162 C32,180 30,200 32,214 C38,214 44,210 44,200 C46,184 46,172 44,162 Z", "M164,162 C168,180 170,200 168,214 C162,214 156,210 156,200 C154,184 154,172 156,162 Z"],
    abs: ["M86,116 L114,116 L112,182 L88,182 Z"],
    legs: ["M76,206 C70,240 70,280 76,304 C84,308 94,304 96,290 C98,260 98,230 96,206 Z", "M124,206 C130,240 130,280 124,304 C116,308 106,304 104,290 C102,260 102,230 104,206 Z", "M76,314 C72,340 72,368 76,384 C82,386 88,382 88,372 C90,350 90,330 88,314 Z", "M124,314 C128,340 128,368 124,384 C118,386 112,382 112,372 C110,350 110,330 112,314 Z"],
    glutes: [],
  };
  const B = {
    back: ["M64,72 C80,74 96,80 100,96 L100,170 C84,170 70,150 64,120 Z", "M136,72 C120,74 104,80 100,96 L100,170 C116,170 130,150 136,120 Z"],
    shoulders: F.shoulders,
    arms: ["M46,102 C40,116 36,140 38,158 C44,160 52,156 54,146 C56,130 54,112 52,102 Z", "M154,102 C160,116 164,140 162,158 C156,160 148,156 146,146 C144,130 146,112 148,102 Z"],
    glutes: ["M74,188 C66,200 66,224 78,236 C90,242 100,236 100,226 L100,192 C92,186 82,184 74,188 Z", "M126,188 C134,200 134,224 122,236 C110,242 100,236 100,226 L100,192 C108,186 118,184 126,188 Z"],
    legs: ["M76,240 C70,266 70,290 76,306 C84,310 94,306 96,292 C98,270 98,250 96,240 Z", "M124,240 C130,266 130,290 124,306 C116,310 106,306 104,292 C102,270 102,250 104,240 Z", "M76,314 C72,340 72,368 76,384 C82,386 88,382 88,372 C90,350 90,330 88,314 Z", "M124,314 C128,340 128,368 124,384 C118,386 112,382 112,372 C110,350 110,330 112,314 Z"],
    abs: [],
  };
  const OUTLINE = "M100,10 C112,10 120,20 120,32 C120,44 112,54 100,54 C88,54 80,44 80,32 C80,20 88,10 100,10 Z M92,56 L108,56 L110,68 L90,68 Z M60,70 L140,70 C150,74 156,88 154,100 L148,150 L160,214 L154,216 L142,160 L130,180 L128,200 L128,300 L126,384 L112,384 L110,314 L100,200 L90,314 L88,384 L74,384 L72,300 L72,200 L70,180 L58,160 L46,216 L40,214 L52,150 L46,100 C44,88 50,74 60,70 Z";

  const Figure = ({ regions, worked, priority, label }) => (
    <svg viewBox="0 0 200 400" className="h-full w-auto" aria-label={label + " view"}>
      <defs>
        <pattern id="mi-mm-hatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#F2EFE8" strokeWidth="0.6" />
        </pattern>
      </defs>
      <path d={OUTLINE} fill="url(#mi-mm-hatch)" fillOpacity=".35" stroke="#F2EFE8" strokeWidth="1" strokeOpacity=".7" strokeLinejoin="round" />
      {Object.keys(regions).map((k) => regions[k].map((d, i) => {
        const on = worked.includes(k), pri = priority.includes(k);
        return <path key={k + i} d={d} fill={on ? "#FF2B2B" : "transparent"} fillOpacity={on ? (pri ? 1 : 0.72) : 0} stroke={pri ? "#FF2B2B" : "#F2EFE8"} strokeWidth={pri ? 1.6 : 0.7} strokeOpacity={on || pri ? 1 : 0.45} />;
      }))}
      <text x="100" y="396" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#F2EFE8" opacity=".5" letterSpacing="2">{label.toUpperCase()}</text>
    </svg>
  );

  MI.MuscleMap = ({ worked = [], priority = [], view = "both", className, height = 220 }) => (
    <div className={"flex items-stretch justify-center gap-3 " + (className || "")} style={{ height }}>
      {(view === "both" || view === "front") && <Figure regions={F} worked={worked} priority={priority} label="front" />}
      {(view === "both" || view === "back") && <Figure regions={B} worked={worked} priority={priority} label="back" />}
    </div>
  );

  MI.MuscleMapCard = ({ worked, priority, title, sub, plate }) => (
    <MI.PlateCard plate={plate || "skeleton"} opacity={0.12} innerClassName="p-4">
      <div className="flex items-center justify-between">
        <p className="dp text-sm uppercase text-neutral-200">{title || "Worked today"}</p>
        {sub && <p className="mono text-[10px] text-neutral-500">{sub}</p>}
      </div>
      <MI.MuscleMap worked={worked} priority={priority} height={200} className="mt-2" />
    </MI.PlateCard>
  );
})(window.MI);
} catch (e) { showErr("anatomy: " + e.message); }
