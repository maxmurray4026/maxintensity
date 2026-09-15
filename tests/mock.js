// Mock of the Max Intensity worker for offline testing. Mirrors the contract the app expects.
const calls = [];
function worker(route) {
  const req = route.request(); const url = new URL(req.url()); const method = req.method();
  const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
  if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  let body = {}; try { body = JSON.parse(req.postData() || '{}'); } catch {}
  calls.push({ method, path: url.pathname + url.search, headers: req.headers(), body });
  if (url.pathname === '/board') {
    if (method === 'GET') return json({ rows: [
      { handle: 'maxmurray', points: 4820, streak: 41, gymDays: 62, bestName: 'Leg Press', bestKg: 260, rank: 'Diamond', rankIndex: 3, level: 7, verified: true },
      { handle: 'jess.lifts', points: 1910, streak: 12, gymDays: 20, bestName: 'Hip Thrust', bestKg: 120, rank: 'Gold', rankIndex: 2, level: 4 },
      { handle: 'tomk', points: 640, streak: 5, gymDays: 8, bestName: 'Incline Dumbbell Press', bestKg: 30, rank: 'Silver', rankIndex: 1, level: 3 },
      { handle: 'ryan.b', points: 1210, streak: 9, gymDays: 14, bestName: 'Leg Press', bestKg: 140, rank: 'Silver', rankIndex: 1, level: 4 },
      { handle: 'amira', points: 980, streak: 7, gymDays: 11, bestName: 'Hip Thrust', bestKg: 90, rank: 'Silver', rankIndex: 1, level: 3 },
      { handle: 'dev_k', points: 410, streak: 2, gymDays: 5, bestName: 'Smith Shoulder Press', bestKg: 40, rank: 'Silver', rankIndex: 1, level: 2 },
    ] });
    return json({ ok: true });
  }
  if (url.pathname === '/event') return json({ ok: true });
  if (url.pathname === '/wall') {
    if (method === 'GET') return json({ posts: [
      { id: 'p1', handle: 'jess.lifts', type: 'transformation', text: 'Six weeks. Hip thrust 80 → 120 kg, bodyweight 71 → 68. Silver to Gold.', ts: Date.now() - 86400000 * 2, rank: 'Gold', rankIndex: 2, level: 4, streak: 12, likes: 9 },
      { id: 'p2', handle: 'tomk', type: 'testimony', text: 'First program I have ever finished. The number to beat is on the screen before I walk in.', ts: Date.now() - 86400000 * 5, rank: 'Silver', rankIndex: 1, level: 3, streak: 5, likes: 4 },
    ] });
    return json({ ok: true, post: { id: 'p' + Date.now(), ...body } });
  }
  // relay (messages API) — a member code unlocks via the x-mi-member header on any call
  if ((req.headers()['x-mi-code'] || '') === 'MAXTEST') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-mi-member', 'x-mi-member': '1' }, body: JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }) });
  const sys = String(body.system || '');
  const say = (o) => json({ content: [{ type: 'text', text: JSON.stringify(o) }] });
  if (sys.includes('Rebuild ONE week-1 session')) {
    const day = JSON.parse(sys.slice(sys.indexOf('Current session: ') + 17));
    const ex = day.exercises.slice(0, 4).map((e) => ({ ...e, scheme: [6, 6], rest: '90 s' }));
    return say({ reply: 'Warm-up 1 dropped, rests cut to 90 s, last two exercises out. Your work sets are untouched — that is the session.', exercises: ex });
  }
  if (sys.includes('You adjust ONE session')) {
    const day = JSON.parse(sys.slice(sys.indexOf('Current session: ') + 17, sys.indexOf(' Respond ONLY')));
    const ex = day.exercises.filter((e) => !/incline dumbbell press/i.test(e.name));
    ex.splice(0, 0, { name: 'Flat Barbell Bench Press', scheme: [10, 6, 6, 6], note: 'feet planted, bar to lower chest', tempo: '3-1-3-1', rest: '2–3 min' });
    return say({ reply: 'Bench in first. Incline dumbbell press out — same pattern, same muscles, so volume stays flat.', exercises: ex, removed: ['Incline Dumbbell Press'], added: ['Flat Barbell Bench Press'] });
  }
  if (sys.includes('THREE substitutes')) return say({ options: [{ name: 'Incline Flys', note: 'dumbbells', why: 'Same upper chest' }, { name: 'Assisted Dips (machine)', note: 'assistance on', why: 'Chest + triceps' }, { name: 'Machine Chest Press', note: 'seat high', why: 'Stable, easy to load' }] });
  if (sys.includes('physique photo')) return say({ assessment: 'You carry most of your fat around the middle and lower back; shoulders and arms are underdeveloped relative to your frame. Posture is fine.', strengths: ['Decent leg mass', 'Good posture'], behind: ['Shoulders', 'Upper back'], priorities: ['shoulders', 'back'], nutrition: 'Protein first at every meal, one big meal a day.', week6: 'Waist down 2-3 cm, shoulders slightly fuller. Visible, not dramatic.', week12: 'Clear shoulder cap, waist down 5-6 cm, upper abs showing in good light.', caveat: 'Depends on hitting 4 sessions a week and the food targets 5 days out of 7.' });
  if (sys.includes('meal prep')) return say({ recommendations: [{ name: 'Mince & rice tray', how: 'Brown 1 kg 10% mince, add tinned tomatoes and spice, portion over rice for 3 days.', shop: 'Aldi', kcal: 980, protein: 82, carbs: 90, fat: 30, why: 'One decision, three days.' }], note: 'The biggest lever is the evening: cook once, eat three times.' });
  if (sys.includes('spoken workout log')) return say({ entries: [{ exercise: 0, set: 2, weight: 32, reps: 6 }], heard: 'Incline press, 32 kg for 6 on the work set' });
  if (sys.includes('weekly meal plan')) { const big = (n, cook) => ({ name: n, tag: 'Protein packed', kcal: 950, protein: 78, carbs: 96, fat: 26, time: 35, serves: 4, cost: 2.2, ingredients: [{ name: '5% beef mince', qty: 800, unit: 'g', aisle: 'Meat & fish' }, { name: 'Basmati rice', qty: 320, unit: 'g', aisle: 'Rice, pasta & grains' }, { name: 'Peppers', qty: 2, unit: '', aisle: 'Fruit & veg' }], steps: ['Brown the mince.', 'Peppers in.', 'Rice, plate.'], leftover: !cook }); const bf = { name: '0% Greek yogurt + fruit', tag: 'Speedy meals', kcal: 260, protein: 28, carbs: 30, fat: 1, time: 3, serves: 1, cost: 0.95, ingredients: [{ name: '0% Greek yogurt', qty: 250, unit: 'g', aisle: 'Dairy & eggs' }, { name: 'Berries', qty: 150, unit: 'g', aisle: 'Fruit & veg' }], steps: ['Yogurt in a bowl, fruit on top.'] }; const sn = { name: 'Handful of nuts', kcal: 180, protein: 6, carbs: 5, fat: 16, cost: 0.6, ingredients: [{ name: 'Mixed nuts', qty: 30, unit: 'g', aisle: 'Fruit & veg' }] }; return say({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((k, i) => ({ key: k, cook: i % 3 === 0, big: big(i % 3 === 0 ? (i === 0 ? 'Coach chilli & rice' : i === 3 ? 'Coach chicken tray bake' : 'Coach salmon & potatoes') : 'Leftovers', i % 3 === 0), breakfast: bf, snacks: [sn] })) }); }
  if (sys.includes('photo of a meal')) return say({ name: 'Eggs on sourdough', kcal: 520, protein: 28, carbs: 40, fat: 26 });
  if (sys.includes('spoken food description')) return say({ name: 'Eggs, sourdough, banana', kcal: 610, protein: 30, carbs: 62, fat: 24 });
  if (sys.includes('plain-text food description')) return say({ name: 'Mince, potatoes, milk', kcal: 900, protein: 70, carbs: 60, fat: 40 });
  if (sys.includes('swap machine')) return say({ swaps: [{ from: 'fizzy drinks', to: 'zero versions', why: 'Same hit, no sugar' }] });
  if (sys.includes('build one specific')) return say({ name: 'Mince & mash', how: 'Fry, mash, plate.', kcal: 800, protein: 60, carbs: 70, fat: 30 });
  return say({ reply: 'Coach here. Keep the work set at 1 in reserve and add 2.5% next week where you cleared 6.', program: null });
}
module.exports = { worker, calls };
