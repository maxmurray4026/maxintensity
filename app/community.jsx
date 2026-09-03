/* MAX INTENSITY — community: the Wall (worker /wall), the Board (worker
   /board) with rank badges, XP levels and a video-verification queue.
   Exposes MI.Community.

   Worker contract this client expects (tolerant on read):
     GET  /wall                 → { posts: [{ id, handle, type, text, image?, rank?, level?, streak?, kg?, ts, likes? }] }
     POST /wall  { handle, type, text, image?, rank, rankIndex, level, streak, points }
     POST /wall  { like: id, handle }
     GET  /board                → { rows: [{ handle, points, streak, gymDays, bestName, bestKg, rank?, rankIndex?, level?, verified?, pending? }] }
     POST /board { handle, points, streak, gymDays, bestName, bestKg, rank, rankIndex, level }
     POST /board { handle, verify: { url, lift, kg, rank } }        — a member submits a clip for review
     GET  /board?pending=1 (x-mi-admin header) → { rows: [...pending] } — admin queue
     POST /board { admin: code, approve: handle } / { admin, reject: handle }
   Anything the worker does not support yet fails soft: the UI keeps a local
   copy so the member never loses a post. */
try {
(function (MI) {
  const { useState, useEffect } = React;
  const { card, chip, cta, ghost, eyebrow } = MI.ui;

  const rowsOf = (r) => (r && (r.posts || r.rows || r.items)) || [];

  MI.Community = ({ handle, setHandle, game, rank, history, bestLift, boardCall, wallCall, unit, wOut, prs, projection, planName, adminCode, setAdminCode, checkins, beforePhoto }) => {
    const [view, setView] = useState("wall");
    const [posts, setPosts] = useState(null);
    const [board, setBoard] = useState(null);
    const [busy, setBusy] = useState(false);
    const [compose, setCompose] = useState(null); // { type, text, image }
    const [handleIn, setHandleIn] = useState("");
    const [verify, setVerify] = useState({ url: "", lift: "", kg: "" });
    const [verifyState, setVerifyState] = useState(null);
    const [pending, setPending] = useState(null);
    const [msg, setMsg] = useState("");
    const level = window.MI_PROJ ? window.MI_PROJ.levelFor(game.points) : { level: 1, title: "Recruit" };
    const rankIndex = window.MI_RANK ? window.MI_RANK.TIERS.indexOf(rank) : 0;
    const me = (handle || "").toLowerCase().replace(/^@/, "");

    const localKey = "mi-wall-local";
    const loadLocal = () => { try { return JSON.parse(localStorage.getItem("mi:" + localKey) || "[]"); } catch (e) { return []; } };
    const saveLocal = (arr) => { try { localStorage.setItem("mi:" + localKey, JSON.stringify(arr.slice(0, 20))); } catch (e) {} };

    const loadWall = async () => {
      try { const r = await wallCall("GET"); const remote = rowsOf(r); setPosts(mergeLocal(remote)); }
      catch (e) { setPosts(mergeLocal([])); }
    };
    const mergeLocal = (remote) => {
      const local = loadLocal().filter((l) => !remote.some((r) => r.text === l.text && r.handle === l.handle));
      return [...local.map((l) => ({ ...l, pending: true })), ...remote].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    };
    const loadBoard = async () => { try { const r = await boardCall("GET"); setBoard(rowsOf(r)); } catch (e) { setBoard([]); } };
    useEffect(() => { if (view === "wall" && posts === null) loadWall(); if (view === "board" && board === null) loadBoard(); }, [view]); // eslint-disable-line

    const post = async () => {
      if (!compose || !compose.text.trim() || busy) return;
      const body = { handle: me, type: compose.type, text: compose.text.trim(), image: compose.image || undefined, rank, rankIndex, level: level.level, streak: game.streak, points: game.points, ts: Date.now() };
      setBusy(true);
      try {
        const r = await wallCall("POST", body);
        if (r && r.error) throw new Error(r.error);
        setMsg("Posted to the wall.");
      } catch (e) {
        saveLocal([body, ...loadLocal()]);
        setMsg("Saved on your phone — it posts when the wall is reachable.");
      }
      setCompose(null); setBusy(false); setPosts(null); loadWall();
    };
    const like = async (p) => {
      if (!p.id) return;
      setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, likes: (x.likes || 0) + 1, liked: true } : x)));
      try { await wallCall("POST", { like: p.id, handle: me }); } catch (e) {}
    };
    const goalCardText = () => {
      const nxt = window.MI_RANK && rank ? window.MI_RANK.TIERS[Math.min(6, rankIndex + 1)] : "Silver";
      const proj = projection && projection.at6 ? `${projection.label.toLowerCase()} ${projection.start} → ${projection.at6} ${projection.unit} in 6 weeks` : "";
      return `My goal on ${planName || "the block"}: ${rank || "Bronze"} → ${nxt}. ${proj ? "On track for " + proj + "." : ""} Every session +2.5%.`;
    };
    const submitVerify = async () => {
      if (!verify.url.trim() || !verify.kg) { setVerifyState("Add the clip link and the weight."); return; }
      setBusy(true);
      try {
        const r = await boardCall("POST", { handle: me, verify: { url: verify.url.trim(), lift: verify.lift || (bestLift && bestLift.name) || "", kg: Number(verify.kg), rank } });
        if (r && r.error) throw new Error(r.error);
        setVerifyState("Submitted. Max reviews clips by hand — a verified tick lands on your row once it's approved.");
        try { localStorage.setItem("mi:mi-verify-pending", JSON.stringify({ ...verify, ts: Date.now() })); } catch (e) {}
      } catch (e) { setVerifyState("Couldn't reach the board. Check your connection and submit again."); }
      setBusy(false);
    };
    const loadPending = async () => { try { const r = await boardCall("GET", null, "?pending=1", { "x-mi-admin": adminCode }); setPending(rowsOf(r)); } catch (e) { setPending([]); } };
    const decide = async (h, ok) => { try { await boardCall("POST", { admin: adminCode, [ok ? "approve" : "reject"]: h }); } catch (e) {} loadPending(); };

    const Badge = ({ r }) => r.rank ? <MI.RankBadge name={r.rank} index={r.rankIndex} size={22} /> : <MI.RankBadge name="Bronze" index={0} size={22} className="opacity-40" />;
    const seg = (v, l) => <button key={v} onClick={() => setView(v)} className={"dp flex-1 rounded-md py-2 text-xs uppercase tracking-wide " + (view === v ? "bg-[#FF2B2B] text-white" : "text-neutral-500")}>{l}</button>;

    return (
      <main className="px-4 pb-32 pt-3">
        <MI.PlateHeader plate="skeleton" eyebrow="Community" title="The wall" right={<MI.LevelPill points={game.points} />} />
        <div className="mt-2 flex rounded-lg border border-neutral-800 p-0.5">{seg("wall", "Wall")}{seg("board", "Leaderboard")}{seg("verify", "Verify")}</div>

        {!me && (
          <div className={card + " mt-3 p-4"}>
            <p className="dp text-sm uppercase text-neutral-200">Put your name up</p>
            <p className="mt-1 text-xs text-neutral-500">Your Instagram handle goes on your posts and your row on the board. Rank, level and streak go with it — progress is status here.</p>
            <div className="mt-2 flex gap-2">
              <input value={handleIn} onChange={(e) => setHandleIn(e.target.value)} placeholder="@yourhandle" autoCapitalize="off" className="mono flex-1 rounded-lg bg-neutral-900 px-3 py-3 text-sm placeholder-neutral-700" />
              <button onClick={() => { const v = handleIn.replace(/^@/, "").trim(); if (/^[a-zA-Z0-9._]{2,30}$/.test(v)) setHandle(v); else setMsg("Enter a valid Instagram handle."); }} className={cta + " px-4 text-xs"}>Join</button>
            </div>
          </div>
        )}
        {msg && <p className="mono mt-2 text-[10px] text-[#FF2B2B]">{msg}</p>}

        {/* ---------- WALL ---------- */}
        {view === "wall" && (
          <>
            {me && !compose && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[["transformation", "Transformation"], ["testimony", "Testimony"], ["goal", "Goal card"]].map(([t, l]) => (
                  <button key={t} onClick={() => setCompose({ type: t, text: t === "goal" ? goalCardText() : "", image: null })} className={card + " px-2 py-3 text-center"}>
                    <MI.Ic d={t === "transformation" ? MI.PATHS.BODY : t === "testimony" ? MI.PATHS.HEART : MI.PATHS.TROPHY} className="mx-auto h-5 w-5 text-[#FF2B2B]" />
                    <p className="dp mt-1 text-[11px] uppercase tracking-wide text-neutral-200">{l}</p>
                  </button>
                ))}
              </div>
            )}
            {compose && (
              <div className={card + " mt-3 border-[#7f1d1d] p-4"}>
                <p className={eyebrow}>{compose.type === "goal" ? "Your goal card" : compose.type === "transformation" ? "Your transformation" : "Your testimony"}</p>
                <textarea value={compose.text} onChange={(e) => setCompose({ ...compose, text: e.target.value })} rows={4} placeholder={compose.type === "transformation" ? "What changed, in numbers. Bodyweight, the bar, the rank." : "What the method did for you. Plain words."} className="mt-2 w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600" />
                {compose.type === "transformation" && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className={ghost + " cursor-pointer px-3 py-2 text-[10px]"}>
                      {compose.image ? "Change photo" : "Add a photo (optional)"}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (f) setCompose({ ...compose, image: await MI.downscale(f, 480, 0.6) }); }} />
                    </label>
                    {compose.image && <img src={compose.image} alt="" className="h-12 w-12 rounded object-cover" />}
                    {!compose.image && beforePhoto && (checkins || []).length > 0 && (
                      <button onClick={() => setCompose({ ...compose, image: checkins[checkins.length - 1].data })} className="mono text-[10px] text-neutral-500 underline">use latest check-in</button>
                    )}
                  </div>
                )}
                <p className="mono mt-2 text-[9px] text-neutral-600">Posts show your handle, rank {rank ? "(" + rank + ")" : ""}, level {level.level} and streak. Only what you type and attach is shared.</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={post} disabled={busy} className={cta + " flex-1 py-3 text-xs disabled:opacity-50"}>{busy ? "…" : "Post to the wall"}</button>
                  <button onClick={() => setCompose(null)} className={ghost + " px-4 text-xs"}>Cancel</button>
                </div>
              </div>
            )}
            <div className="mt-3 space-y-2">
              {posts === null && <p className="mono text-xs text-neutral-500">Loading the wall…</p>}
              {posts && posts.length === 0 && <div className={card + " p-5 text-center"}><p className="text-sm text-neutral-400">Nothing on the wall yet.</p><p className="mono mt-1 text-[10px] text-neutral-600">First transformation up here is yours.</p></div>}
              {(posts || []).map((p, i) => (
                <div key={p.id || i} className={card + " relative overflow-hidden p-4 " + (p.pending ? "border-dashed" : "")}>
                  {p.type === "transformation" && <MI.Plate plate="skeleton" opacity={0.08} />}
                  <div className="relative flex items-center gap-2">
                    <Badge r={p} />
                    <p className="truncate text-xs font-semibold text-neutral-200">@{p.handle}</p>
                    <span className="mono ml-auto shrink-0 text-[9px] uppercase tracking-wider text-neutral-600">{p.type}{p.level ? " · L" + p.level : ""}{p.streak ? " · " + p.streak + "d" : ""}</span>
                  </div>
                  {p.image && <img src={p.image} alt="" className="relative mt-3 max-h-64 w-full rounded-lg object-cover" />}
                  <p className="relative mt-2 text-sm leading-relaxed text-neutral-200">{p.text}</p>
                  <div className="relative mt-2 flex items-center gap-3">
                    <button onClick={() => like(p)} disabled={p.liked || !p.id} className={"mono text-[10px] " + (p.liked ? "text-[#FF2B2B]" : "text-neutral-500")}>Respect · {p.likes || 0}</button>
                    {p.pending && <span className="mono text-[9px] text-neutral-600">waiting to post</span>}
                    {p.ts && <span className="mono ml-auto text-[9px] text-neutral-600">{new Date(p.ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- BOARD ---------- */}
        {view === "board" && (
          <div className="mt-3">
            <MI.PlateCard plate="skeleton" opacity={0.12} rule innerClassName="p-4">
              <div className="flex items-center justify-between">
                <p className="dp text-lg uppercase text-[#F2EFE8]">Leaderboard</p>
                <button onClick={loadBoard} className="mono rounded-md border border-neutral-800 px-2.5 py-1 text-[10px] text-neutral-400">Refresh</button>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">Rank first, then points. Climbing rank = getting stronger. A tick means the lift was verified on video.</p>
              {board === null && <p className="mono mt-3 text-xs text-neutral-500">Loading…</p>}
              {board && board.length === 0 && <p className="mt-3 text-xs text-neutral-600">Nobody on the board yet — you're about to be first.</p>}
              {board && board.length > 0 && (
                <div className="mt-3 space-y-1">
                  {[...board].sort((a, b) => ((b.rankIndex || 0) - (a.rankIndex || 0)) || ((b.points || 0) - (a.points || 0))).map((r, ri) => {
                    const mine = (r.handle || "").toLowerCase() === me;
                    return (
                      <div key={r.handle + ri} className={"flex items-center gap-2 rounded-lg px-2.5 py-2 " + (mine ? "bg-[#1c0808]" : ri % 2 ? "bg-neutral-900/40" : "")}>
                        <span className={"dp w-6 shrink-0 text-sm " + (ri === 0 ? "text-[#FF2B2B]" : "text-neutral-600")}>{ri + 1}</span>
                        <Badge r={r} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-neutral-200">@{r.handle} {r.verified && <span className="mono ml-1 rounded bg-[#FF2B2B] px-1 text-[8px] uppercase text-white">verified</span>}</p>
                          <p className="mono truncate text-[9px] text-neutral-600">{r.rank || "Unranked"}{r.level ? " · L" + r.level : ""}{r.bestKg > 0 ? " · " + wOut(String(r.bestKg)) + " " + unit + " " + (r.bestName || "") : ""}</p>
                        </div>
                        <div className="mono shrink-0 text-right">
                          <p className="text-xs font-semibold text-[#FF2B2B]">{r.points}</p>
                          <p className="text-[8px] uppercase text-neutral-600">{r.streak}d streak</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </MI.PlateCard>
          </div>
        )}

        {/* ---------- VERIFY ---------- */}
        {view === "verify" && (
          <div className="mt-3 space-y-3">
            <div className={card + " p-4"}>
              <div className="flex items-center gap-2"><MI.Ic d={MI.PATHS.SHIELD} className="h-4 w-4 text-[#FF2B2B]" /><p className="dp text-sm uppercase text-neutral-200">Video verification</p></div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">Diamond and above get a verified tick once a clip is approved. Film the work set — full reps, strict tempo, weight visible — post it (Instagram, TikTok, Drive) and paste the link. Max reviews by hand.</p>
              <input value={verify.url} onChange={(e) => setVerify({ ...verify, url: e.target.value })} placeholder="Link to your clip" autoCapitalize="off" className="mono mt-3 w-full rounded-lg bg-neutral-900 px-3 py-3 text-sm placeholder-neutral-700" />
              <div className="mt-2 flex gap-2">
                <input value={verify.lift} onChange={(e) => setVerify({ ...verify, lift: e.target.value })} placeholder={(bestLift && bestLift.name) || "Lift"} className="flex-1 rounded-lg bg-neutral-900 px-3 py-3 text-sm placeholder-neutral-700" />
                <input value={verify.kg} onChange={(e) => setVerify({ ...verify, kg: e.target.value })} inputMode="decimal" placeholder={unit} className="mono w-24 rounded-lg bg-neutral-900 px-3 py-3 text-right text-sm placeholder-neutral-700" />
              </div>
              <button onClick={submitVerify} disabled={busy || !me} className={cta + " mt-3 w-full py-3.5 text-sm disabled:opacity-50"}>{me ? "Submit for review" : "Join the board first"}</button>
              {verifyState && <p className="mono mt-2 text-[10px] text-neutral-400">{verifyState}</p>}
            </div>
            <div className={card + " p-4"}>
              <p className="mono text-[10px] uppercase tracking-widest text-neutral-500">Admin</p>
              <div className="mt-2 flex gap-2">
                <input value={adminCode || ""} onChange={(e) => setAdminCode(e.target.value)} placeholder="Admin code" className="mono flex-1 rounded-lg bg-neutral-900 px-3 py-2.5 text-sm placeholder-neutral-700" />
                <button onClick={loadPending} disabled={!adminCode} className={ghost + " px-3 text-[10px] disabled:opacity-40"}>Load queue</button>
              </div>
              {pending && pending.length === 0 && <p className="mono mt-2 text-[10px] text-neutral-600">Queue empty.</p>}
              {(pending || []).map((r, i) => (
                <div key={i} className="mt-2 rounded-lg bg-neutral-900/60 p-3">
                  <p className="text-xs font-semibold text-neutral-200">@{r.handle} · {r.verify ? r.verify.lift + " " + r.verify.kg + " kg" : ""}</p>
                  {r.verify && r.verify.url && <a href={r.verify.url} target="_blank" rel="noreferrer" className="mono mt-1 block truncate text-[10px] text-[#FF2B2B] underline">{r.verify.url}</a>}
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => decide(r.handle, true)} className={cta + " flex-1 py-2 text-[10px]"}>Approve</button>
                    <button onClick={() => decide(r.handle, false)} className={ghost + " flex-1 py-2 text-[10px]"}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  };
})(window.MI);
} catch (e) { showErr("community: " + e.message); }
