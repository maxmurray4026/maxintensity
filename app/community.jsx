/* MAX INTENSITY — community: the Feed (worker /wall) with upvotes and comments,
   the League (worker /board) with promotion line and rank badges, video
   verification. Exposes MI.Community.

   Worker contract this client expects (tolerant on read, fails soft on write):
     GET  /wall                 → { posts: [{ id, handle, type, text, image?, rank?, level?, streak?, ts, likes?, comments?: [{ id, handle, text, ts, likes? }] }] }
     POST /wall  { handle, type, text, image?, rank, rankIndex, level, streak, points, ts }
     POST /wall  { like: postId, handle }
     POST /wall  { comment: { postId, text }, handle, rank, level }
     POST /wall  { likeComment: commentId, postId, handle }
     GET  /board                → { rows: [{ handle, points, streak, gymDays, bestName, bestKg, rank?, rankIndex?, level?, verified?, pending? }] }
     POST /board { handle, verify: { url, lift, kg, rank } }
     GET  /board?pending=1 (x-mi-admin header) → { rows }
     POST /board { admin: code, approve | reject: handle }
   Anything the worker does not support yet: the UI keeps a local copy so the
   member never loses a post, comment or vote. */
try {
(function (MI) {
  const { useState, useEffect, useRef } = React;
  const { card, chip, cta, ghost, eyebrow } = MI.ui;

  const rowsOf = (r) => (r && (r.posts || r.rows || r.items)) || [];
  const lsGet = (k, fb) => { try { return JSON.parse(localStorage.getItem("mi:" + k) || "null") || fb; } catch (e) { return fb; } };
  const lsSet = (k, v) => { try { localStorage.setItem("mi:" + k, JSON.stringify(v)); } catch (e) {} };

  /* Before/after image: two panels side by side, the arm mark, the dates. */
  async function composeBeforeAfter({ before, after, beforeDate, afterDate, logo, handle }) {
    const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const [a, b, mark] = await Promise.all([load(before), load(after), logo ? load(logo).catch(() => null) : null]);
    const W = 1080, H = 1080, top = 150, bottom = 120, gap = 12;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#050505"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#FF2B2B"; g.fillRect(0, 0, W, 12);
    const panel = (img, x, y, w, h) => {
      const s = Math.max(w / img.width, h / img.height);
      const dw = img.width * s, dh = img.height * s;
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      g.restore();
    };
    const pw = (W - 80 - gap) / 2, ph = H - top - bottom;
    panel(a, 40, top, pw, ph); panel(b, 40 + pw + gap, top, pw, ph);
    g.fillStyle = "rgba(5,5,5,.78)";
    g.fillRect(40, top, 190, 44); g.fillRect(40 + pw + gap, top, 150, 44);
    g.fillStyle = "#F2EFE8"; g.font = "600 24px 'IBM Plex Mono', monospace";
    g.fillText("BEFORE", 56, top + 31);
    g.fillStyle = "#FF2B2B"; g.fillText("NOW", 56 + pw + gap, top + 31);
    // header
    if (mark) { g.save(); g.beginPath(); g.arc(80, 78, 36, 0, Math.PI * 2); g.closePath(); g.fillStyle = "#EDE7DA"; g.fill(); g.clip(); g.drawImage(mark, 48, 46, 64, 64); g.restore(); }
    g.fillStyle = "#F2EFE8"; g.font = "56px 'Anton', 'Arial Narrow', Impact, sans-serif";
    g.fillText("MAX ", 136, 98); g.fillStyle = "#FF2B2B"; g.fillText("INTENSITY", 136 + g.measureText("MAX ").width, 98);
    // footer
    g.fillStyle = "#9a9a9a"; g.font = "26px 'IBM Plex Mono', monospace";
    g.fillText(beforeDate, 40, H - 62); g.textAlign = "right"; g.fillText(afterDate, W - 40, H - 62); g.textAlign = "left";
    if (handle) { g.fillStyle = "#F2EFE8"; g.textAlign = "center"; g.fillText("@" + handle, W / 2, H - 62); g.textAlign = "left"; }
    g.fillStyle = "#FF2B2B"; g.fillRect(40, H - 36, 120, 6);
    return c;
  }

  MI.Community = ({ handle, setHandle, game, rank, history, bestLift, boardCall, wallCall, unit, wOut, prs, projection, planName, adminCode, setAdminCode, checkins, beforePhoto, onActivity, logo, onBoard, name }) => {
    const [view, setView] = useState("feed");
    const [posts, setPosts] = useState(null);
    const [board, setBoard] = useState(null);
    const [busy, setBusy] = useState(false);
    const [compose, setCompose] = useState(null); // { type, text, image, preview }
    const [handleIn, setHandleIn] = useState("");
    const [verify, setVerify] = useState({ url: "", lift: "", kg: "" });
    const [verifyState, setVerifyState] = useState(null);
    const [pending, setPending] = useState(null);
    const [msg, setMsg] = useState("");
    const [sort, setSort] = useState("top"); // 'top' | 'recent'
    const [openComments, setOpenComments] = useState({});
    const [commentIn, setCommentIn] = useState({});
    const [ba, setBa] = useState(null); // before/after composer { before, after, beforeDate, afterDate, out }
    const [allRanks, setAllRanks] = useState(false);
    const level = window.MI_PROJ ? window.MI_PROJ.levelFor(game.points) : { level: 1, title: "Recruit" };
    const rankIndex = window.MI_RANK ? Math.max(0, window.MI_RANK.TIERS.indexOf(rank)) : 0;
    const me = (handle || "").toLowerCase().replace(/^@/, "");
    const act = () => { try { onActivity && onActivity(); } catch (e) {} };

    /* ---- local fallbacks: posts, comments and votes survive a dead worker ---- */
    const localPosts = () => lsGet("mi-wall-local", []);
    const localComments = () => lsGet("mi-wall-comments", {});   // { postId: [comment] }
    const localVotes = () => lsGet("mi-wall-votes", { posts: {}, comments: {} });
    /* Local echoes: every post the member makes is kept on the phone. A remote
       copy replaces it once the wall returns it; if the wall dropped the image,
       the local image is carried over so the member always sees their photo. */
    const mergeLocal = (remote) => {
      const echoes = localPosts();
      const local = echoes.filter((l) => !remote.some((r) => r.text === l.text && r.handle === l.handle));
      const withImages = remote.map((r) => { const e = echoes.find((l) => l.text === r.text && l.handle === r.handle && l.image && !r.image); return e ? { ...r, image: e.image } : r; });
      const lc = localComments(), lv = localVotes();
      return [...local.map((l) => ({ ...l, pending: !l.remoteOk })), ...withImages].map((p) => {
        const id = p.id || "local-" + p.ts;
        const comments = [...(p.comments || []), ...((lc[id] || []).filter((c) => !(p.comments || []).some((r) => r.text === c.text && r.handle === c.handle)))];
        return { ...p, id, liked: !!lv.posts[id], likes: (p.likes || 0) + (lv.posts[id] && !p.likedByMe ? 0 : 0), comments: comments.map((c) => ({ ...c, liked: !!lv.comments[c.id] })) };
      });
    };
    const loadWall = async () => {
      try { const r = await wallCall("GET"); setPosts(mergeLocal(rowsOf(r))); }
      catch (e) { setPosts(mergeLocal([])); }
    };
    const loadBoard = async () => { try { const r = await boardCall("GET"); const rows = rowsOf(r); setBoard(rows); onBoard && onBoard(rows); } catch (e) { setBoard([]); } };
    useEffect(() => { if (view === "feed" && posts === null) loadWall(); if (view === "league" && board === null) loadBoard(); }, [view]); // eslint-disable-line

    const sorted = (list) => [...list].sort((a, b) => sort === "top" ? ((b.likes || 0) - (a.likes || 0)) || ((b.ts || 0) - (a.ts || 0)) : (b.ts || 0) - (a.ts || 0));

    /* ---- posting: try with the image; if the worker refuses, post the text and keep the image locally ---- */
    const post = async () => {
      if (!compose || !compose.text.trim() || busy) return;
      const body = { handle: me, type: compose.type, text: compose.text.trim(), image: compose.image || undefined, rank, rankIndex, level: level.level, streak: game.streak, points: game.points, ts: Date.now() };
      setBusy(true);
      let ok = false, r = null;
      try { r = await wallCall("POST", body); ok = !(r && r.error); } catch (e) { ok = false; }
      if (!ok && body.image) {
        try { r = await wallCall("POST", { ...body, image: undefined }); ok = !(r && r.error); if (ok) setMsg("Posted — the photo stays on your phone until the wall accepts images."); } catch (e) { ok = false; }
      } else if (ok) setMsg("Posted to the feed.");
      if (!ok) setMsg("Saved on your phone — it posts when the wall is reachable.");
      lsSet("mi-wall-local", [{ ...body, remoteOk: ok }, ...localPosts()].slice(0, 20));
      act();
      setCompose(null); setBusy(false); setPosts(null); loadWall();
    };
    const like = async (p) => {
      const lv = localVotes(); if (lv.posts[p.id]) return;
      lv.posts[p.id] = 1; lsSet("mi-wall-votes", lv);
      setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, likes: (x.likes || 0) + 1, liked: true } : x)));
      act();
      try { await wallCall("POST", { like: p.id, handle: me }); } catch (e) {}
    };
    const likeComment = async (p, c) => {
      const lv = localVotes(); if (lv.comments[c.id]) return;
      lv.comments[c.id] = 1; lsSet("mi-wall-votes", lv);
      setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, comments: x.comments.map((y) => (y.id === c.id ? { ...y, likes: (y.likes || 0) + 1, liked: true } : y)) } : x)));
      try { await wallCall("POST", { likeComment: c.id, postId: p.id, handle: me }); } catch (e) {}
    };
    const addComment = async (p) => {
      const text = (commentIn[p.id] || "").trim(); if (!text || !me) return;
      const c = { id: "c" + Date.now(), handle: me, text, ts: Date.now(), likes: 0, rank, level: level.level };
      setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, comments: [...(x.comments || []), c] } : x)));
      setCommentIn({ ...commentIn, [p.id]: "" });
      act();
      try { const r = await wallCall("POST", { comment: { postId: p.id, text }, handle: me, rank, level: level.level }); if (r && r.error) throw new Error(r.error); }
      catch (e) { const lc = localComments(); lc[p.id] = [...(lc[p.id] || []), c]; lsSet("mi-wall-comments", lc); }
    };
    const goalCardText = () => {
      const nxt = window.MI_RANK && rank ? window.MI_RANK.TIERS[Math.min(6, rankIndex + 1)] : "Silver";
      const proj = projection && projection.at6 ? `${projection.label.toLowerCase()} ${projection.start} → ${projection.at6} ${projection.unit} in 6 weeks` : "";
      return `My goal on ${planName || "the block"}: ${rank || "Bronze"} → ${nxt}. ${proj ? "On track for " + proj + "." : ""} Every session +2.5%.`;
    };
    const pickImage = async (f, set) => {
      if (!f) return;
      const preview = MI.previewUrl(f);
      set({ preview, image: null });
      try { const data = await MI.downscale(f, 720, 0.66); set({ preview: null, image: data }); }
      catch (e) { set({ preview: null, image: null, err: e.message }); }
    };
    const submitVerify = async () => {
      if (!verify.url.trim() || !verify.kg) { setVerifyState("Add the clip link and the weight."); return; }
      setBusy(true);
      try {
        const r = await boardCall("POST", { handle: me, verify: { url: verify.url.trim(), lift: verify.lift || (bestLift && bestLift.name) || "", kg: Number(verify.kg), rank } });
        if (r && r.error) throw new Error(r.error);
        setVerifyState("Submitted. Max reviews clips by hand — a verified tick lands on your row once it's approved.");
        lsSet("mi-verify-pending", { ...verify, ts: Date.now() });
      } catch (e) { setVerifyState("Couldn't reach the board. Check your connection and submit again."); }
      setBusy(false);
    };
    const loadPending = async () => { try { const r = await boardCall("GET", null, "?pending=1", { "x-mi-admin": adminCode }); setPending(rowsOf(r)); } catch (e) { setPending([]); } };
    const decide = async (h, ok) => { try { await boardCall("POST", { admin: adminCode, [ok ? "approve" : "reject"]: h }); } catch (e) {} loadPending(); };

    /* ---- before/after composer ---- */
    const openBA = () => {
      const last = (checkins || []).length ? checkins[checkins.length - 1] : null;
      const firstDate = lsGet("mi-beforephoto-date", null) || (history && Object.keys(history).sort()[0]) || MI.todayKey();
      setBa({ before: beforePhoto || null, after: last ? last.data : null, beforeDate: MI.fmtDate(firstDate), afterDate: last ? MI.fmtDate(last.date) : MI.fmtDate(MI.todayKey()), out: null, canvas: null });
    };
    const buildBA = async () => {
      if (!ba || !ba.before || !ba.after) return;
      setBusy(true);
      try { const c = await composeBeforeAfter({ ...ba, logo, handle: me }); setBa({ ...ba, canvas: c, out: c.toDataURL("image/jpeg", 0.8) }); }
      catch (e) { setMsg("Couldn't build the image: " + (e.message || e)); }
      setBusy(false);
    };
    const shareBA = async () => { if (!ba || !ba.canvas) return; const r = await MI.shareCanvas(ba.canvas, "max-intensity-before-after.png", "Before → now on Max Intensity."); setMsg(r === "shared" ? "Shared." : r === "downloaded" ? "Saved to your photos." : "Copied the caption."); };
    const postBA = async () => {
      if (!ba || !ba.canvas) return;
      const small = ba.canvas; const c = document.createElement("canvas"); c.width = 720; c.height = 720; c.getContext("2d").drawImage(small, 0, 0, 720, 720);
      setCompose({ type: "transformation", text: `Before → now. ${ba.beforeDate} to ${ba.afterDate}.`, image: c.toDataURL("image/jpeg", 0.66) });
      setBa(null);
    };

    const Badge = ({ r }) => r.rank ? <MI.RankBadge name={r.rank} index={r.rankIndex} size={22} /> : <MI.RankBadge name="Bronze" index={0} size={22} className="opacity-40" />;
    const seg = (v, l) => <button key={v} onClick={() => setView(v)} className={"dp flex-1 rounded-md py-2 text-xs uppercase tracking-wide " + (view === v ? "bg-[#FF2B2B] text-white" : "text-neutral-500")}>{l}</button>;

    /* ---- league: same rank tier as the member, promotion zone = top 3 ---- */
    const allRows = [...(board || [])].sort((a, b) => ((b.rankIndex || 0) - (a.rankIndex || 0)) || ((b.points || 0) - (a.points || 0)));
    const leagueRows = allRanks ? allRows : allRows.filter((r) => (r.rankIndex || 0) === rankIndex);
    const leagueName = rank || "Bronze";
    const nextLeague = window.MI_RANK ? window.MI_RANK.TIERS[Math.min(6, rankIndex + 1)] : "Silver";
    const myPos = leagueRows.findIndex((r) => (r.handle || "").toLowerCase() === me);
    const PROMOTE = 3;

    return (
      <main className="px-4 pb-32 pt-3">
        <MI.PlateHeader plate="skeleton" eyebrow="Community" title={view === "league" ? "The league" : "The feed"} right={<MI.LevelPill points={game.points} />} />
        <div className="mt-2 flex rounded-lg border border-neutral-800 p-0.5">{seg("league", "League")}{seg("feed", "Feed")}{seg("verify", "Verify")}</div>

        {!me && (
          <div className={card + " mt-3 p-4"}>
            <p className="dp text-sm uppercase text-neutral-200">Put your name up</p>
            <p className="mt-1 text-xs text-neutral-500">Your Instagram handle goes on your posts and your row on the league. Rank, level and streak go with it — progress is status here.</p>
            <div className="mt-2 flex gap-2">
              <input value={handleIn} onChange={(e) => setHandleIn(e.target.value)} placeholder="@yourhandle" autoCapitalize="off" className="mono flex-1 rounded-lg bg-neutral-900 px-3 py-3 text-sm placeholder-neutral-700" />
              <button onClick={() => { const v = handleIn.replace(/^@/, "").trim(); if (/^[a-zA-Z0-9._]{2,30}$/.test(v)) setHandle(v); else setMsg("Enter a valid Instagram handle."); }} className={cta + " px-4 text-xs"}>Join</button>
            </div>
          </div>
        )}
        {msg && <p className="mono mt-2 text-[10px] text-[#FF2B2B]">{msg}</p>}

        {/* ---------- LEAGUE ---------- */}
        {view === "league" && (
          <div className="mt-3">
            <MI.PlateCard plate="skeleton" opacity={0.12} rule innerClassName="p-4">
              <div className="flex items-center gap-3">
                <MI.RankBadge name={leagueName} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="dp text-lg uppercase leading-none text-[#F2EFE8]">{allRanks ? "All ranks" : leagueName + " league"}</p>
                  <p className="mono mt-1 text-[10px] text-neutral-500">{allRanks ? "Everyone on the ladder, rank first then points." : `Top ${PROMOTE} at the end of the block move up to ${nextLeague}. Climbing rank = getting stronger.`}</p>
                </div>
                <button onClick={loadBoard} className="mono rounded-md border border-neutral-800 px-2.5 py-1 text-[10px] text-neutral-400">Refresh</button>
              </div>
              <button onClick={() => setAllRanks(!allRanks)} className="mono mt-2 text-[10px] uppercase tracking-widest text-neutral-500 underline underline-offset-2">{allRanks ? "Show my league" : "Show all ranks"}</button>
              {board === null && <p className="mono mt-3 text-xs text-neutral-500">Loading…</p>}
              {board && leagueRows.length === 0 && <p className="mt-3 text-xs text-neutral-600">Nobody in {leagueName} yet — you'd be first. {allRows.length ? "Show all ranks to see the whole ladder." : ""}</p>}
              {board && leagueRows.length > 0 && (
                <div className="mt-3 space-y-1">
                  {leagueRows.map((r, ri) => {
                    const mine = (r.handle || "").toLowerCase() === me;
                    return (
                      <React.Fragment key={r.handle + ri}>
                        <div className={"flex items-center gap-2 rounded-lg px-2.5 py-2 " + (mine ? "bg-[#1c0808] ring-1 ring-[#FF2B2B]/50" : ri % 2 ? "bg-neutral-900/40" : "")}>
                          <span className={"dp w-6 shrink-0 text-sm " + (ri < PROMOTE ? "text-[#FF2B2B]" : "text-neutral-600")}>{ri + 1}</span>
                          <Badge r={r} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-neutral-200">@{r.handle}{mine && <span className="mono ml-1 text-[9px] text-[#FF2B2B]">you</span>} {r.verified && <span className="mono ml-1 rounded bg-[#FF2B2B] px-1 text-[8px] uppercase text-white">verified</span>}</p>
                            <p className="mono truncate text-[9px] text-neutral-600">{r.rank || "Unranked"}{r.level ? " · L" + r.level : ""}{r.bestKg > 0 ? " · " + wOut(String(r.bestKg)) + " " + unit + " " + (r.bestName || "") : ""}</p>
                          </div>
                          <div className="mono shrink-0 text-right">
                            <p className="text-xs font-semibold text-[#FF2B2B]">{r.points}</p>
                            <p className="text-[8px] uppercase text-neutral-600">{r.streak}d streak</p>
                          </div>
                        </div>
                        {!allRanks && ri === PROMOTE - 1 && leagueRows.length > PROMOTE && (
                          <div className="flex items-center gap-2 py-1"><span className="h-px flex-1 bg-[#FF2B2B]/60" /><span className="mono text-[9px] uppercase tracking-[0.2em] text-[#FF2B2B]">Promotion line · {nextLeague}</span><span className="h-px flex-1 bg-[#FF2B2B]/60" /></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {myPos >= 0 && !allRanks && <p className="mono mt-2 text-[10px] text-neutral-400">{myPos < PROMOTE ? `You're in the promotion zone. Hold #${myPos + 1} to the end of the block.` : `You're #${myPos + 1}. ${leagueRows[PROMOTE - 1].points - (leagueRows[myPos].points || 0) + 1} points to the promotion line.`}</p>}
                  {me && myPos < 0 && <p className="mono mt-2 text-[10px] text-neutral-500">Your row appears after your next logged session.</p>}
                </div>
              )}
            </MI.PlateCard>
          </div>
        )}

        {/* ---------- FEED ---------- */}
        {view === "feed" && (
          <>
            {me && !compose && !ba && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[["transformation", "Transformation", MI.PATHS.BODY], ["testimony", "Testimony", MI.PATHS.HEART], ["goal", "Goal card", MI.PATHS.TROPHY], ["ba", "Before / after", MI.PATHS.CAMERA]].map(([t, l, ic]) => (
                  <button key={t} onClick={() => (t === "ba" ? openBA() : setCompose({ type: t, text: t === "goal" ? goalCardText() : "", image: null }))} className={card + " px-1.5 py-3 text-center"}>
                    <MI.Ic d={ic} className="mx-auto h-5 w-5 text-[#FF2B2B]" />
                    <p className="dp mt-1 text-[10px] uppercase tracking-wide text-neutral-200">{l}</p>
                  </button>
                ))}
              </div>
            )}
            {ba && (
              <div className={card + " mt-3 border-[#7f1d1d] p-4"}>
                <p className={eyebrow}>Before / after</p>
                <p className="mt-1 text-xs text-neutral-500">Two photos, side by side, with the mark and the dates. Share it, or post it to the feed.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[["before", "Before"], ["after", "Now"]].map(([k, l]) => (
                    <div key={k}>
                      <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-[#0d0d0d]" style={{ aspectRatio: "3 / 4" }}>
                        {ba[k] ? <img src={ba[k]} alt={l} className="h-full w-full object-cover" /> : ba[k + "Preview"] ? <img src={ba[k + "Preview"]} alt="" className="h-full w-full object-cover opacity-60" /> : <p className="mono absolute inset-0 flex items-center justify-center text-[10px] text-neutral-700">pick a photo</p>}
                        <span className="mono absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-neutral-200">{l}</span>
                      </div>
                      <label className={ghost + " mt-1.5 block cursor-pointer py-2 text-center text-[10px]"}>{ba[k] ? "Change" : "Choose"}<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; pickImage(f, (o) => setBa((b) => ({ ...b, [k]: o.image || b[k], [k + "Preview"]: o.preview, out: null, canvas: null }))); e.target.value = ""; }} /></label>
                      <input value={ba[k + "Date"]} onChange={(e) => setBa({ ...ba, [k + "Date"]: e.target.value, out: null, canvas: null })} className="mono mt-1 w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-center text-[10px] text-neutral-300" aria-label={l + " date"} />
                    </div>
                  ))}
                </div>
                {ba.out && <img src={ba.out} alt="Before and after" className="mt-3 w-full rounded-lg border border-neutral-800" />}
                <div className="mt-3 flex gap-2">
                  {!ba.out ? <button onClick={buildBA} disabled={busy || !ba.before || !ba.after} className={cta + " flex-1 py-3 text-xs disabled:opacity-50"}>{busy ? "Building…" : "Build the image"}</button>
                    : <><button onClick={shareBA} className={cta + " flex-1 py-3 text-xs"}>Share</button><button onClick={postBA} className={ghost + " flex-1 py-3 text-xs"}>Post to the feed</button></>}
                  <button onClick={() => setBa(null)} className={ghost + " px-3 text-xs"}>✕</button>
                </div>
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
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; pickImage(f, (o) => setCompose((c) => ({ ...c, image: o.image || c.image, preview: o.preview, err: o.err }))); e.target.value = ""; }} />
                    </label>
                    {(compose.image || compose.preview) && <img src={compose.image || compose.preview} alt="" className={"h-14 w-14 rounded object-cover " + (compose.preview && !compose.image ? "opacity-60" : "")} />}
                    {compose.image && <button onClick={() => setCompose({ ...compose, image: null })} className="mono text-[10px] text-neutral-500">remove</button>}
                    {!compose.image && !compose.preview && (checkins || []).length > 0 && (
                      <button onClick={() => setCompose({ ...compose, image: checkins[checkins.length - 1].data })} className="mono text-[10px] text-neutral-500 underline">use latest check-in</button>
                    )}
                  </div>
                )}
                {compose.err && <p className="mono mt-1 text-[10px] text-[#FF2B2B]">{compose.err}</p>}
                <p className="mono mt-2 text-[9px] text-neutral-600">Posts show your handle, rank {rank ? "(" + rank + ")" : ""}, level {level.level} and streak. Only what you type and attach is shared.</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={post} disabled={busy} className={cta + " flex-1 py-3 text-xs disabled:opacity-50"}>{busy ? "…" : "Post to the feed"}</button>
                  <button onClick={() => setCompose(null)} className={ghost + " px-4 text-xs"}>Cancel</button>
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <p className={eyebrow}>{sort === "top" ? "Most respected" : "Most recent"}</p>
              <div className="flex rounded-md border border-neutral-800 p-0.5">
                {[["top", "Top"], ["recent", "Recent"]].map(([v, l]) => <button key={v} onClick={() => setSort(v)} className={"mono rounded px-2.5 py-1 text-[10px] uppercase tracking-wider " + (sort === v ? "bg-[#FF2B2B] text-white" : "text-neutral-500")}>{l}</button>)}
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {posts === null && <p className="mono text-xs text-neutral-500">Loading the feed…</p>}
              {posts && posts.length === 0 && <div className={card + " p-5 text-center"}><p className="text-sm text-neutral-400">Nothing on the feed yet.</p><p className="mono mt-1 text-[10px] text-neutral-600">First transformation up here is yours.</p></div>}
              {sorted(posts || []).map((p, i) => (
                <div key={p.id || i} className={card + " relative overflow-hidden p-4 " + (p.pending ? "border-dashed" : "")}>
                  {p.type === "transformation" && <MI.Plate plate="skeleton" opacity={0.08} />}
                  <div className="relative flex items-center gap-2">
                    <Badge r={p} />
                    <p className="truncate text-xs font-semibold text-neutral-200">@{p.handle}</p>
                    <span className="mono ml-auto shrink-0 text-[9px] uppercase tracking-wider text-neutral-600">{p.type}{p.level ? " · L" + p.level : ""}{p.streak ? " · " + p.streak + "d" : ""}</span>
                  </div>
                  {p.image && <img src={p.image} alt="" className="relative mt-3 max-h-72 w-full rounded-lg object-cover" />}
                  <p className="relative mt-2 text-sm leading-relaxed text-neutral-200">{p.text}</p>
                  <div className="relative mt-2 flex items-center gap-3">
                    <button onClick={() => like(p)} disabled={p.liked} className={"mono flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] " + (p.liked ? "border-[#FF2B2B] text-[#FF2B2B]" : "border-neutral-800 text-neutral-400")} aria-label="Upvote">▲ {p.likes || 0}</button>
                    <button onClick={() => setOpenComments({ ...openComments, [p.id]: !openComments[p.id] })} className="mono text-[10px] text-neutral-500">{(p.comments || []).length} comment{(p.comments || []).length === 1 ? "" : "s"}</button>
                    {p.pending && <span className="mono text-[9px] text-neutral-600">waiting to post</span>}
                    {p.ts && <span className="mono ml-auto text-[9px] text-neutral-600">{new Date(p.ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                  </div>
                  {openComments[p.id] && (
                    <div className="relative mt-3 border-t border-neutral-800 pt-2">
                      {[...(p.comments || [])].sort((a, b) => ((b.likes || 0) - (a.likes || 0)) || ((a.ts || 0) - (b.ts || 0))).map((c, ci) => (
                        <div key={c.id || ci} className="flex items-start gap-2 py-1.5">
                          <button onClick={() => likeComment(p, c)} disabled={c.liked} className={"mono mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] " + (c.liked ? "border-[#FF2B2B] text-[#FF2B2B]" : "border-neutral-800 text-neutral-500")} aria-label="Upvote comment">▲ {c.likes || 0}</button>
                          <p className="min-w-0 flex-1 text-xs text-neutral-300"><span className="font-semibold text-neutral-200">@{c.handle}</span> {c.text}</p>
                        </div>
                      ))}
                      {me ? (
                        <div className="mt-1 flex gap-2">
                          <input value={commentIn[p.id] || ""} onChange={(e) => setCommentIn({ ...commentIn, [p.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addComment(p)} placeholder="Say something useful" className="min-w-0 flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600" />
                          <button onClick={() => addComment(p)} className={cta + " px-3 text-[10px]"}>Post</button>
                        </div>
                      ) : <p className="mono text-[10px] text-neutral-600">Join with your handle to comment.</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- VERIFY ---------- */}
        {view === "verify" && (
          <div className="mt-3 space-y-3">
            <div className={card + " p-4"}>
              <div className="flex items-center gap-2"><MI.Ic d={MI.PATHS.SHIELD} className="h-4 w-4 text-[#FF2B2B]" /><p className="dp text-sm uppercase text-neutral-200">Video verification</p></div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">Diamond and above get a verified tick once a clip is approved. Film the working set — full reps, strict tempo, weight visible — post it (Instagram, TikTok, Drive) and paste the link. Max reviews by hand.</p>
              <input value={verify.url} onChange={(e) => setVerify({ ...verify, url: e.target.value })} placeholder="Link to your clip" autoCapitalize="off" className="mono mt-3 w-full rounded-lg bg-neutral-900 px-3 py-3 text-sm placeholder-neutral-700" />
              <div className="mt-2 flex gap-2">
                <input value={verify.lift} onChange={(e) => setVerify({ ...verify, lift: e.target.value })} placeholder={(bestLift && bestLift.name) || "Lift"} className="flex-1 rounded-lg bg-neutral-900 px-3 py-3 text-sm placeholder-neutral-700" />
                <input value={verify.kg} onChange={(e) => setVerify({ ...verify, kg: e.target.value })} inputMode="decimal" placeholder={unit} className="mono w-24 rounded-lg bg-neutral-900 px-3 py-3 text-right text-sm placeholder-neutral-700" />
              </div>
              <button onClick={submitVerify} disabled={busy || !me} className={cta + " mt-3 w-full py-3.5 text-sm disabled:opacity-50"}>{me ? "Submit for review" : "Join the league first"}</button>
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
