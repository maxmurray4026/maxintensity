/* MAX INTENSITY — vintage anatomy layer.
   Plates sit BEHIND stat cards, graphs, progress bars and section headers at
   12–25% opacity, deep red on the black, the app's grain on top; the hero tier
   is the same figure at full strength.
   Text stays AA-legible: the plate never exceeds 25% and the card ground is
   #141414 or darker. Exposes MI.Plate, MI.PlateCard, MI.MuscleMap. */
try {
(function (MI) {
  const { useState, useEffect } = React;

  /* Canonical plates. `lum: true` = raster engraving, red ink on cream paper:
     rendered by luminance — inverted so the paper falls to black and vanishes
     under screen blending while the ink carries the bone/red duotone. */
  const A = "assets/anatomy/";
  MI.PLATES = {
    skeleton: { file: A + "skeleton.jpg", lum: true, pos: "right 0%", size: "auto 150%" },
    legs: { file: A + "legs.jpg", lum: true, pos: "right 30%", size: "auto 150%" },
    back: { file: A + "back.jpg", lum: true, pos: "right 15%", size: "auto 160%" },
    torso: { file: A + "torso-heart.jpg", lum: true, pos: "right 20%", size: "auto 150%" },
    arm: { file: A + "arm.jpg", lum: true, pos: "right 10%", size: "auto 150%" },
    musclesFront: { file: A + "muscles-front.jpg", lum: true, pos: "right 10%", size: "auto 150%" },
    musclesBack: { file: A + "muscles-back.jpg", lum: true, pos: "right 10%", size: "auto 150%" },
    classroom: { file: A + "classroom.jpg", lum: true, pos: "center 40%", size: "cover" },
    hero: { file: A + "hero.jpg", lum: true, pos: "center 20%", size: "cover", clip: "inset(7%)" },
  };
  /* Library plates for backgrounds. The enrollment funnel walks muscles →
     skeleton → classroom as the story moves from the body to the rank to the plan. */
  MI.LIBRARY = {
    muscles: ["b-muscles-front", "a-muscles-back", "a-shoulder-arm", "b-arm-flexed", "a-arm-back", "b-muscles-back", "a-muscles-front", "b-legs-front", "a-legs", "b-head-neck", "a-knee", "b-hand", "b-foot", "a-muscles-front-2"],
    skeleton: ["b-skeleton", "a-skeleton", "a-skeleton-2", "a-torso-heart", "b-torso-heart"],
    classroom: ["b-study-sheet", "classroom", "hero", "a-hands-organs", "a-heart", "b-study-sheet", "classroom", "hero", "b-study-sheet"],
  };
  MI.libraryPlate = (phase, i) => {
    const list = MI.LIBRARY[phase] || MI.LIBRARY.muscles;
    const name = list[Math.max(0, i) % list.length];
    const wide = name === "classroom" || name === "hero" || name === "b-study-sheet";
    return { file: A + name + ".jpg", lum: true, pos: wide ? "center 30%" : "right 15%", size: wide ? "cover" : "auto 120%" };
  };

    /* Deep-red treatment (round 3b). Every raster plate is rendered by its ink:
     the engraving is inverted to a grey figure on black, multiplied into a
     colour fill, and the whole group is screened onto the card — so the paper
     vanishes, the muscle mass sits in deep blood-red (#7A1414–#A11B1B), the
     dense line-work lifts toward brand red, and skeletons read as a dim warm
     grey. Rich and moody, never white, never pink. */
  MI.TONES = {
    red: [
      { fill: "#B01414", filter: "invert(1) grayscale(1) brightness(.8) contrast(1.9)", op: 1 },
      { fill: "#FF2B2B", filter: "invert(1) grayscale(1) brightness(.62) contrast(3.2)", op: 0.3 },
    ],
    bone: [
      { fill: "#8C8178", filter: "invert(1) grayscale(1) brightness(.8) contrast(1.9)", op: 0.9 },
      { fill: "#C9BFB3", filter: "invert(1) grayscale(1) brightness(.62) contrast(3.2)", op: 0.3 },
    ],
  };
  MI.toneFor = (p, tone) => tone || p.tone || (/skeleton/i.test(p.file || "") ? "bone" : "red");

  /* One ink layer: a colour-filled box shrink-wrapped to the image, the image
     multiplied into it, the box screened onto whatever is behind. `geo` is the
     box's absolute geometry (or { cover: true } to fill the parent). */
  const InkLayer = ({ file, geo, layer, opacity, clip, objectPosition }) => {
    const box = geo.cover
      ? { position: "absolute", inset: 0 }
      : { position: "absolute", width: "max-content", display: "flex", justifyContent: geo.justify || "flex-end", height: geo.height, top: geo.top, bottom: geo.bottom, left: geo.left, right: geo.right, transform: geo.transform };
    const img = geo.cover
      ? { width: "100%", height: "100%", objectFit: "cover", objectPosition, transform: "scale(1.06)" }
      : { height: "100%", width: "auto", maxWidth: "none", display: "block" };
    return (
      <div aria-hidden style={{ ...box, background: layer.fill, mixBlendMode: "screen", opacity: Math.min(1, opacity * layer.op), overflow: "hidden", clipPath: clip, WebkitClipPath: clip }}>
        <img src={file} alt="" aria-hidden draggable={false} style={{ ...img, filter: layer.filter, mixBlendMode: "multiply" }} />
      </div>
    );
  };
  MI.InkLayer = InkLayer;

  /* background-position / background-size → box geometry. size "auto N%" sets
     the height; "cover" fills. pos "right|left|center V%" places the box. */
  const geoFor = (pos, size, flip) => {
    if (!size || size === "cover") return { cover: true };
    const hm = /auto\s+([\d.]+)%/.exec(size);
    const H = hm ? Number(hm[1]) : 100;
    const [px = "right", py = "0%"] = String(pos || "right 0%").split(/\s+/);
    const top = ((100 - H) * (parseFloat(py) || 0)) / 100;
    const g = { height: H + "%", top: top + "%" };
    const tf = [];
    if (px === "left") { g.left = 0; g.justify = "flex-start"; }
    else if (px === "center") { g.left = "50%"; tf.push("translateX(-50%)"); g.justify = "center"; }
    else g.right = 0;
    if (flip) tf.push("scaleX(-1)");
    if (tf.length) g.transform = tf.join(" ");
    return g;
  };

  /* Which plate a section gets. Sessions use the fixed map below; torso/heart
     behind nutrition, skeleton behind rank and progress. */
  MI.plateFor = (section, dayName) => {
    const d = (dayName || "").toLowerCase();
    if (section === "session" || section === "train") return MI.sessionPlate(dayName).plate;
    if (section === "nutrition" || section === "eat") return "torso";
    if (section === "arms") return "arm";
    return "skeleton";
  };

  /* Fixed plate per session (round 3b §2) with the hero geometry that frames
     the right part of the figure. Legs 1 → front of the legs (quads). Legs 2
     and Glute Focus → the lower half of the back view (glutes, hamstrings,
     calves). Upper 1 → the back-and-arm torso. Upper 2 → chest and shoulders. */
  MI.SESSION_PLATES = {
    "legs 1": { plate: "legs", h: 165, x: -14, y: -28 },
    "legs 2": { plate: "musclesBack", h: 270, x: -10, y: -140 },
    "glute focus": { plate: "musclesBack", h: 270, x: -10, y: -112 },
    "upper 1": { plate: "hero", h: 175, x: -6, y: -34 },
    "upper 2": { plate: "musclesFront", h: 255, x: -12, y: -4 },
  };
  MI.sessionPlate = (dayName) => {
    const d = (dayName || "").toLowerCase().trim();
    if (MI.SESSION_PLATES[d]) return MI.SESSION_PLATES[d];
    if (/glute/.test(d)) return MI.SESSION_PLATES["glute focus"];
    if (/leg/.test(d)) return MI.SESSION_PLATES[/2/.test(d) ? "legs 2" : "legs 1"];
    if (/arm|back|pull/.test(d)) return MI.SESSION_PLATES["upper 1"];
    if (/chest|push|shoulder/.test(d)) return MI.SESSION_PLATES["upper 2"];
    return MI.SESSION_PLATES[/2/.test(d) ? "upper 2" : "upper 1"];
  };

  /* Absolutely positioned backdrop. Parent needs `relative overflow-hidden`. */
  /* `plate` is a key of MI.PLATES or a plate object (see MI.libraryPlate).
     `hero` = the HERO tier: one plate large, 60–90% opacity, full red, filling
     50–70% of the screen and bleeding off an edge; the text sits beside it. */
  MI.Plate = ({ plate = "skeleton", opacity = 0.18, position, size, flip, red = 0.55, className, style, hero, tone }) => {
    const p = typeof plate === "object" && plate ? plate : (MI.PLATES[plate] || MI.PLATES.skeleton);
    const url = `url(${p.file})`;
    const pos = position || p.pos, sz = size || p.size;
    if (p.lum) {
      /* Raster engraving in the deep-red treatment (see MI.TONES). The hero
         tier is the same figure at full strength; the texture tier is the
         same red, faded — never white. */
      const geo = geoFor(pos, sz, flip);
      const layers = MI.TONES[MI.toneFor(p, tone)] || MI.TONES.red;
      return (
        <div aria-hidden className={"pointer-events-none absolute inset-0 overflow-hidden " + (className || "")} style={style}>
          {layers.map((L, i) => <InkLayer key={i} file={p.file} geo={geo} layer={L} opacity={opacity} objectPosition={pos} />)}
        </div>
      );
    }
    const mask = { WebkitMaskImage: url, maskImage: url, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: pos, maskPosition: pos, WebkitMaskSize: sz, maskSize: sz };
    return (
      <div aria-hidden className={"pointer-events-none absolute inset-0 z-0 " + (className || "")}
        style={{ opacity, transform: flip ? "scaleX(-1)" : undefined, ...mask, background: `linear-gradient(155deg, #F2EFE8 ${Math.round((1 - red) * 100)}%, #FF2B2B 100%)`, ...(style || {}) }} />
    );
  };

  /* Hero plate with the clear-space gradient the type sits in. `side` = where
     the plate bleeds off: "right" (text left) or "bottom" (text top). */
  /* The plate is an <img> so its paper frame can be clipped away (inset 3.5%),
     sized as a % of the container height (h), bled off the right (x, negative =
     past the edge) or the bottom (side="bottom", y negative = past the edge). */
  MI.Hero = ({ plate, opacity = 0.85, side = "right", h = 110, x = -30, y = 4, flip, className, tone, grad: gradOn = true }) => {
    const p = typeof plate === "object" && plate ? plate : (MI.PLATES[plate] || MI.PLATES.hero);
    const geo = side === "bottom"
      ? { height: h + "%", left: "50%", bottom: y + "%", transform: "translateX(-50%)" + (flip ? " scaleX(-1)" : ""), justify: "center" }
      : { height: h + "%", right: x + "%", top: y + "%", transform: flip ? "scaleX(-1)" : undefined };
    const layers = MI.TONES[MI.toneFor(p, tone)] || MI.TONES.red;
    const grad = side === "bottom"
      ? "linear-gradient(180deg, rgba(5,5,5,.94) 0%, rgba(5,5,5,.7) 32%, rgba(5,5,5,0) 58%)"
      : "linear-gradient(90deg, rgba(5,5,5,.96) 0%, rgba(5,5,5,.78) 36%, rgba(5,5,5,0) 66%)";
    return (
      <div aria-hidden className={"pointer-events-none absolute inset-0 overflow-hidden " + (className || "")}>
        {layers.map((L, i) => <InkLayer key={i} file={p.file} geo={geo} layer={L} opacity={opacity} clip={p.clip || "inset(3.5%)"} />)}
        {gradOn && <div className="absolute inset-0" style={{ background: grad }} />}
      </div>
    );
  };

  /* Crossfading plate: when `plate` changes the old one fades out while the new
     one fades in with a slight pan, so the funnel never hard-jumps. */
  MI.Crossfade = ({ plate, opacity, position, size, red, className }) => {
    const [layers, setLayers] = useState([{ plate, id: 0 }]);
    useEffect(() => {
      setLayers((L) => {
        const last = L[L.length - 1];
        if (last && last.plate && plate && last.plate.file === plate.file) return L;
        return [...L.slice(-1), { plate, id: (last ? last.id : 0) + 1 }];
      });
    }, [plate && plate.file]); // eslint-disable-line
    return (
      <div aria-hidden className={"pointer-events-none absolute inset-0 overflow-hidden " + (className || "")}>
        <style>{`
          @keyframes mi-plate-in { from { opacity: 0; transform: translateX(14px) scale(1.02); } to { opacity: 1; transform: none; } }
          @keyframes mi-plate-out { from { opacity: 1; } to { opacity: 0; } }
          .mi-plate-in { animation: mi-plate-in 1.1s cubic-bezier(.2,.7,.2,1) both; }
          .mi-plate-out { animation: mi-plate-out .9s ease-out both; }
          @media (prefers-reduced-motion: reduce) { .mi-plate-in, .mi-plate-out { animation: none; } .mi-plate-out { opacity: 0; } }
        `}</style>
        {layers.map((L, i) => (
          <div key={L.id} className={"absolute inset-0 " + (i === layers.length - 1 ? "mi-plate-in" : "mi-plate-out")}>
            {L.plate && <MI.Plate plate={L.plate} opacity={opacity} position={position} size={size} red={red} />}
          </div>
        ))}
      </div>
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
  MI.PlateHeader = ({ plate, eyebrow, title, right, opacity = 0.22 }) => (
    <div className="relative -mx-4 overflow-hidden px-4 py-3">
      <MI.Plate plate={plate} opacity={opacity} position="right 22%" size="auto 300%" />
      <div className="relative z-10">
        {eyebrow && <div className={MI.ui.eyebrow}>{eyebrow}</div>}
        <div className="mt-1 flex items-end justify-between">
          <h2 className="dp text-[46px] uppercase leading-[0.9] text-[#F2EFE8]">{title}</h2>
          {right && <span className="rounded-md bg-[#050505]/75 px-1.5 py-0.5">{right}</span>}
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
