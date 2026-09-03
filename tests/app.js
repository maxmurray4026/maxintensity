// In-app walkthrough after enrollment: seeds storage as a finished member, then exercises
// the train edit, session + RIR + recap, progress page, wall/board, photo check-in, eat tab.
const { launch } = require('./harness'); const mock = require('./mock');
const S = process.env.S || __dirname + '/shots'; require('fs').mkdirSync(S, { recursive: true }); let n = 0;
let PNG = null;
let page;
(async () => {
  const h = await launch({ worker: mock.worker, port: 8768 });
  page = h.page;
  const shot = async (name) => { n++; await page.screenshot({ path: `${S}/shots/a${String(n).padStart(2, '0')}-${name}.png`, fullPage: !!process.env.FULL }); };
  const rank = { index: 0, name: 'Bronze', tier: 'Bronze', next: { name: 'Silver', key: 'bench', label: 'Bench press', need: 60, phrase: 'a 60kg bench press' }, parts: [] };
  await page.addInitScript((rank) => {
    if (localStorage.getItem('mi:seeded')) return;
    localStorage.setItem('mi:seeded', '1');
    const set = (k, v) => localStorage.setItem('mi:' + k, JSON.stringify(v));
    set('mi-settings', { done: true, name: 'Max', sex: 'Male', goal: 'Build muscle', exp: '1–3 years', daysPerWeek: 4, unit: 'kg', bw: '85', knowsLiftNumbers: 'lifts', strength: { bench: 70, squat: 100, ohp: 45 }, rank, priorities: ['chest'], split: 'chest', plan: 'MASS GAINER', induction: { obstacles: ['No time'], goalLine: 'Build muscle', bodyOutcome: 'big', daysPerWeek: 4 }, handle: 'maxtest' });
    set('mi-rank', { ...rank, entries: [{ key: 'bench', value: 70 }, { key: 'squat', value: 100 }, { key: 'ohp', value: 45 }], via: 'induction' });
    set('mi-rankseen', rank.index);
    set('mi-pro', true); set('mi-tut', true); set('mi-pwseen', true); set('mi-handle', 'maxtest');
    set('mi-beforephoto', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA7ljmRAAAAEklEQVR4nGP4z8DAwMDAwMAAAAwAA//8gCk4AAAAAElFTkSuQmCC');
    const logs = {};
    const w0 = {}; for (let i = 0; i < 6; i++) w0[i] = { sets: [{ weight: '20', reps: '10' }, { weight: '26', reps: '6' }, { weight: '30', reps: '6' }, { weight: '27', reps: '6' }], done: true }; logs['w0-d0'] = w0;
    set('mi-logs', logs);
    const d = new Date(); d.setDate(d.getDate() - 8); const k = d.toISOString().slice(0, 10);
    set('mi-history', { [k]: { week: 1, day: 'Upper 1', items: [] } });
    set('mi-weights', { [k]: 85, [new Date().toISOString().slice(0, 10)]: 85.4 });
    set('mi-week', 1);
    set('mi-profile', { kg: 85, activityIdx: 2, goalIdx: 2 }); set('mi-targets', { kcal: 3680, protein: 154, carbs: 420, fat: 84 });
  }, rank);
  await page.goto('http://localhost:8768/index.html'); await page.waitForTimeout(3500);
  PNG = Buffer.from((await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 60; c.height = 80; const g = c.getContext('2d'); g.fillStyle = '#444'; g.fillRect(0, 0, 60, 80); g.fillStyle = '#F2EFE8'; g.fillRect(20, 10, 20, 60); return c.toDataURL('image/png'); })).split(',')[1], 'base64');
  await shot('train');
  console.log('header:', (await page.innerText('header')).replace(/\n+/g, ' | ').slice(0, 160));
  // --- add bench via plain language ---
  await page.getByRole('button', { name: 'Add bench' }).click(); await page.waitForTimeout(1200); await shot('add-bench');
  const banner = await page.locator('main').innerText();
  console.log('override:', banner.match(/Adjusted[^\n]*/)?.[0], '|', banner.match(/\+ Flat[^\n]*/)?.[0]);
  // --- short on time sheet ---
  await page.getByRole('button', { name: 'Revert' }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Short on time' }).click(); await page.waitForTimeout(400); await shot('short-sheet');
  await page.getByRole('button', { name: '30 min' }).click(); await page.getByRole('button', { name: 'Rebuild for 30' }).click(); await page.waitForTimeout(400);
  console.log('short:', (await page.locator('main').innerText()).match(/Short on time ·[^\n]*/)?.[0]);
  await page.getByRole('button', { name: 'Revert' }).click(); await page.waitForTimeout(200);
  // --- swaps sheet ---
  await page.getByRole('button', { name: 'Edit', exact: true }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Swaps' }).nth(1).click(); await page.waitForTimeout(900); await shot('swaps');
  console.log('swap options:', (await page.locator('.rounded-t-2xl').innerText()).replace(/\n+/g, ' | ').slice(0, 200));
  await page.locator('.rounded-t-2xl').getByRole('button', { name: 'Incline Flys' }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Done editing' }).click(); await page.waitForTimeout(200);
  console.log('second exercise now:', (await page.locator('ul li').nth(1).innerText()).replace(/\n+/g,' | ').slice(0,80));
  // --- session with RIR + PR + recap ---
  await page.getByRole('button', { name: 'Start session' }).click(); await page.waitForTimeout(400); await shot('session');
  const logSet = async (w, r) => { await page.fill('#sess-w', w); await page.fill('#sess-r', r); await page.getByRole('button', { name: 'Log set' }).first().click(); await page.waitForTimeout(400); };
  await logSet('20', '10');
  await page.getByRole('button', { name: 'Skip' }).click(); await page.waitForTimeout(300);
  await logSet('26', '6'); await page.waitForTimeout(300); await shot('rir-ask');
  console.log('rir ask visible:', await page.getByText("How's the weight feeling?").count());
  await page.getByRole('button', { name: '3+' }).click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Skip' }).click(); await page.waitForTimeout(400); await shot('rir-advice');
  console.log('advice:', (await page.locator('.fixed.inset-0.z-\\[60\\]').innerText()).match(/Coach ·[^\n]*/)?.[0]);
  await logSet('35', '6'); await page.waitForTimeout(600); await shot('pr');
  console.log('PR overlay:', await page.getByText('New').count() > 0);
  await page.locator('.z-\\[66\\]').click().catch(() => {}); await page.waitForTimeout(300);
  for (let i = 0; i < 80; i++) {
    if (await page.getByRole('button', { name: 'Done — leave and grow' }).count()) break;
    const rir = page.getByRole('button', { name: '1', exact: true });
    if (await rir.count()) { await rir.click(); await page.waitForTimeout(150); continue; }
    const rest = page.getByRole('button', { name: 'Skip →' });
    if (await rest.count()) { await rest.click(); await page.waitForTimeout(150); continue; }
    const skip = page.getByRole('button', { name: 'skip this set' });
    if (await skip.count()) { await skip.click(); await page.waitForTimeout(120); continue; }
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(2200); await shot('recap');
  const recap = await page.innerText('body');
  console.log('recap:', recap.match(/SESSION COMPLETE[^\n]*/)?.[0], '| grade:', recap.match(/\n([A-D]\+?)\nSESSION GRADE/)?.[1], '| kg moved:', recap.match(/(\d[\d,]*)\nKG MOVED/)?.[1]);
  let rankup = await page.locator('.z-\\[89\\]').count();
  console.log('rankup overlay (over recap):', rankup);
  if (rankup) { await shot('rankup'); console.log('rankup text:', (await page.locator('.z-\\[89\\]').innerText()).replace(/\n+/g, ' | ').slice(0, 120)); await page.locator('.z-\\[89\\]').click(); await page.waitForTimeout(300); }
  await shot('recap-2');
  await page.getByRole('button', { name: 'Done — leave and grow' }).click(); await page.waitForTimeout(800);
  // --- progress page ---
  await page.getByRole('button', { name: 'Log', exact: true }).click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Progress' }).click(); await page.waitForTimeout(600); await shot('progress-top');
  await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(300); await shot('progress-mid');
  await page.evaluate(() => window.scrollTo(0, 1800)); await page.waitForTimeout(300); await shot('progress-low');
  const prog = await page.innerText('main');
  console.log('progress has:', ['PROJECTION VS ACTUAL', 'PR MOMENTS', 'WEEKLY CHECK-IN', 'YOUR RANK', 'RANK'].map((k) => k + '=' + prog.includes(k)).join(' '));
  // photo check-in
  const fi = page.locator('input[type=file][capture=user]').first();
  await fi.setInputFiles({ name: 'now.png', mimeType: 'image/png', buffer: PNG }); await page.waitForTimeout(600);
  console.log('checkins:', await page.evaluate(() => JSON.parse(localStorage.getItem('mi:mi-checkins') || '[]').length));
  await page.getByRole('button', { name: 'Get an honest assessment' }).click(); await page.waitForTimeout(400);
  await page.getByPlaceholder('e.g. Lose the belly').fill('Get shoulders and lose the belly');
  await page.getByRole('button', { name: 'Assess me honestly' }).click(); await page.waitForTimeout(1200); await shot('assessment');
  console.log('assessment:', (await page.locator('.rounded-t-2xl').innerText()).includes('Waist down'));
  await page.getByRole('button', { name: 'Apply to my plan' }).click(); await page.waitForTimeout(500);
  console.log('priorities after apply:', await page.evaluate(() => JSON.parse(localStorage.getItem('mi:mi-settings')).priorities));
  // --- wall & board ---
  await page.getByRole('button', { name: 'Wall', exact: true }).click(); await page.waitForTimeout(900); await shot('wall');
  const wall = await page.innerText('main'); console.log('wall posts:', wall.includes('jess.lifts'), wall.includes('Hip thrust 80'));
  await page.getByRole('button', { name: 'Testimony' }).click(); await page.waitForTimeout(200);
  await page.locator('textarea').fill('Week 2 and the bar already moved. First time I know what I am doing in there.');
  await page.getByRole('button', { name: 'Post to the wall' }).click(); await page.waitForTimeout(900);
  const wp = mock.calls.filter((c) => c.path === '/wall' && c.method === 'POST'); console.log('wall POST:', wp.length, JSON.stringify(wp[0] && wp[0].body).slice(0, 160));
  await page.getByRole('button', { name: 'Leaderboard' }).click(); await page.waitForTimeout(900); await shot('board');
  const board = await page.innerText('main'); console.log('board:', board.includes('maxmurray'), board.includes('VERIFIED'), board.includes('Diamond'));
  await page.getByRole('button', { name: 'Verify' }).click(); await page.waitForTimeout(300);
  await page.getByPlaceholder('Link to your clip').fill('https://instagram.com/p/abc');
  await page.getByPlaceholder('kg').fill('100');
  await page.getByRole('button', { name: 'Submit for review' }).click(); await page.waitForTimeout(600); await shot('verify');
  const vp = mock.calls.filter((c) => c.path === '/board' && c.method === 'POST' && c.body.verify); console.log('verify POST:', vp.length, JSON.stringify(vp[0] && vp[0].body.verify));
  // --- eat tab ---
  await page.getByRole('button', { name: 'Eat', exact: true }).click(); await page.waitForTimeout(500); await shot('eat-top');
  await page.getByRole('button', { name: 'Set up' }).click(); await page.waitForTimeout(200);
  await page.getByPlaceholder('What you like').fill('mince, rice, eggs'); await page.getByPlaceholder('Where you shop').fill('Aldi'); await page.getByPlaceholder('Allergies').fill('none');
  await page.locator('input[type=file][accept*=".txt"]').setInputFiles({ name: 'food.txt', mimeType: 'text/plain', buffer: Buffer.from('chicken thighs\nrice\neggs\nbutter') });
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Recommend my meal prep' }).click(); await page.waitForTimeout(1000); await shot('mealprep');
  const mp = mock.calls.filter((c) => c.path === '/' && String(c.body.system).includes('meal prep')); console.log('mealprep call has food file:', String(mp[0] && mp[0].body.system).includes('chicken thighs'));
  await page.locator('input[type=file][capture=environment]').setInputFiles({ name: 'meal.png', mimeType: 'image/png', buffer: PNG }); await page.waitForTimeout(900);
  console.log('photo meal logged:', (await page.innerText('main')).includes('Eggs on sourdough'));
  await page.getByRole('button', { name: 'Voice note' }).click(); await page.waitForTimeout(300); await shot('voice');
  await page.locator('.rounded-t-2xl textarea').fill('three eggs, sourdough and a banana');
  await page.getByRole('button', { name: 'Log it' }).click(); await page.waitForTimeout(900);
  console.log('voice meal logged:', (await page.innerText('main')).includes('Eggs, sourdough, banana'));
  // --- coach usage line + settings ---
  await page.getByRole('button', { name: 'Coach', exact: true }).click(); await page.waitForTimeout(300);
  console.log('coach line:', (await page.innerText('main')).match(/\d+ coach calls left[^\n]*/)?.[0]);
  await page.getByRole('button', { name: 'Settings' }).click(); await page.waitForTimeout(400); await shot('settings');
  await page.evaluate(() => document.querySelector('.z-\\[80\\]').scrollTo(0, 700)); await page.waitForTimeout(200); await shot('settings-2');
  console.log('usage:', await page.evaluate(() => localStorage.getItem('mi:mi-aiusage')));
  console.log('errors:', page.errors.filter((e) => !/ERR_FAILED/.test(e)));
  console.log('errbox:', await page.$eval('#errbox', (e) => e.textContent));
  await h.close();
})().catch(async (e) => { console.error('FAIL', e.message.split('\n')[0]); if (page) await page.screenshot({ path: S + '/shots/a99-fail.png' }); process.exit(1); });
