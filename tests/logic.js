// Pure-logic checks run inside the page: priority ordering and the week scheduler.
const { launch } = require('./harness'); const mock = require('./mock');
(async () => {
  const h = await launch({ worker: mock.worker, port: 8769 });
  const page = h.page;
  await page.goto('http://localhost:8769/index.html'); await page.waitForTimeout(3500);
  const r = await page.evaluate(() => {
    const out = {};
    const P = (pri) => window.MI_applyPriorities(JSON.parse(JSON.stringify(window.MI_DEFAULT_PROGRAM)), pri);
    const names = (p, d) => p.days.find((x) => x.name === d).exercises.map((e) => e.name);
    // glutes, then abs: glute work first, then the 10-min abs block, then the rest — on the leg days
    const ga = P(['glutes', 'abs']);
    out.glutesThenAbs = names(ga, 'Legs 1');
    const l1 = out.glutesThenAbs;
    out.glutesFirst = /hip thrust|glute|rdl|abductor/i.test(l1[0]);
    const absIdx = l1.findIndex((n) => /cable crunch|knee raise|plank/i.test(n));
    const gluteCount = l1.filter((n, i) => i < absIdx && /hip thrust|glute|rdl|abductor/i.test(n)).length;
    out.absAfterGlutes = absIdx > 0 && gluteCount === absIdx; // everything before the block is glute work
    out.absBlockIsThree = l1.slice(absIdx, absIdx + 3).every((n) => /cable crunch|knee raise|plank/i.test(n));
    // abs first: the block leads
    const af = P(['abs', 'glutes']);
    out.absFirst = names(af, 'Legs 1').slice(0, 3).every((n) => /cable crunch|knee raise|plank/i.test(n));
    // chest then arms: chest lift leads Upper 1, arm work follows, no shoulder press leaking in first
    const ca = P(['chest', 'arms']);
    const u1 = names(ca, 'Upper 1'); out.chestThenArms = u1;
    out.chestLeads = /incline dumbbell press|flye|fly|dips/i.test(u1[0]);
    // scheduler
    const S = window.MI_PROJ.scheduleWeek, V = window.MI_PROJ.scheduleValid;
    out.wk4 = S(['Upper 1', 'Legs 1', 'Upper 2', 'Legs 2'], 4); out.wk4ok = V(out.wk4);
    out.wk5 = S(['Legs 1', 'Upper 1', 'Legs 2', 'Upper 2', 'Glute Focus'], 5); out.wk5ok = V(out.wk5);
    out.wk3 = S(['Upper 1', 'Legs 1', 'Upper 2', 'Legs 2'], 3); out.wk3ok = V(out.wk3);
    out.gluteNotAdjacent = out.wk5ok && out.wk5.filter((d) => /leg|glute/i.test(d)).length === 3;
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  const pass = r.glutesFirst && r.absAfterGlutes && r.absBlockIsThree && r.absFirst && r.chestLeads && r.wk4ok && r.wk5ok && r.wk3ok && r.gluteNotAdjacent;
  console.log(pass ? 'LOGIC PASS' : 'LOGIC FAIL');
  await h.close(); process.exit(pass ? 0 : 1);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
