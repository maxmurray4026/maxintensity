// In-app walkthrough after enrollment: seeds storage as a finished member, then exercises
// the train edit, session + RIR + recap, progress page, wall/board, photo check-in, eat tab.
const { launch } = require('./harness'); const mock = require('./mock');
const S = process.env.S || __dirname; require('fs').mkdirSync(S + '/shots', { recursive: true }); let n = 0;
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
  // round 4: first visit from iPhone Safari → the two-step Add to Home Screen sheet
  console.log('install sheet on first visit:', await page.locator('[data-install-sheet]').count(), '| steps:', (await page.locator('[data-install-sheet]').innerText()).match(/STEP \d/g)?.join(' '));
  await shot('install-sheet');
  await page.getByRole('button', { name: 'Got it' }).click(); await page.waitForTimeout(300);
  await shot('today');
  const today = await page.innerText('main');
  console.log('today has:', ["LET'S", 'TODAY\'S SESSION', 'WEEKLY QUESTS', 'TODAY\'S INTAKE', 'YOUR LEAGUE', 'SHIELD'].map((k) => k + '=' + today.toUpperCase().includes(k)).join(' '));
  await page.getByRole('button', { name: 'Train', exact: true }).click(); await page.waitForTimeout(400); await shot('train');
  const train = await page.innerText('main');
  console.log('train has:', ["TODAY'S SESSION", 'DAYS / WEEK', 'MASS GAINER', 'CALENDAR'].map((k) => k + '=' + train.toUpperCase().includes(k)).join(' '));
  // --- round 3b: no week tabs, day strip + CALENDAR button, cards expand in place, fixed plate map ---
  console.log('train week tabs:', await page.locator('header').getByRole('button', { name: /^W[1-6]/ }).count(), '(expect 0) | day chips:', await page.locator('main [aria-pressed]').count(), '(expect 7) | calendar btn:', await page.getByRole('button', { name: 'Calendar', exact: true }).count());
  const expanded = async () => (await page.locator('[data-expanded="true"]').evaluateAll((els) => els.map((e) => e.dataset.session))).join(',') || '(none)';
  const collapsed = async () => await page.locator('[data-expanded="false"]').count();
  console.log('expanded:', await expanded(), '| collapsed:', await collapsed(), '| button on top:', (await page.locator('[data-expanded="true"] button').nth(1).innerText()).trim(), '| exercises listed:', await page.locator('[data-expanded="true"] ul li').count());
  await page.getByRole('button', { name: 'Expand Legs 1' }).click(); await page.waitForTimeout(300);
  console.log('tap Legs 1 → expanded:', await expanded(), '| collapsed:', await collapsed(), '| legs exercises:', await page.locator('[data-expanded="true"] ul li').count());
  await shot('train-legs1');
  await page.getByRole('button', { name: 'Collapse Legs 1' }).click(); await page.waitForTimeout(300);
  console.log('tap again → expanded:', await expanded(), '| collapsed:', await collapsed());
  const plates = await page.locator('[data-session]').evaluateAll((els) => els.map((e) => e.dataset.session + '→' + (e.querySelector('img')?.getAttribute('src') || '').replace(/.*\//, '')));
  console.log('session plates:', plates.join(' '));
  await page.getByRole('button', { name: 'Expand Upper 1' }).click(); await page.waitForTimeout(300);
  await page.locator('[data-expanded="true"]').getByRole('button', { name: 'See the whole block' }).click(); await page.waitForTimeout(400);
  console.log('whole block opens calendar:', (await page.innerText('body')).includes('ESTABLISH'));
  await page.getByRole('button', { name: 'Done', exact: true }).click(); await page.waitForTimeout(300);
  // --- round 3: swipe, calendar, infographics, form ---
  const swipe = async (fromX, toX, y = 520) => { await page.mouse.move(fromX, y); await page.mouse.down(); for (let i = 1; i <= 8; i++) { await page.mouse.move(fromX + ((toX - fromX) * i) / 8, y); await page.waitForTimeout(12); } await page.mouse.up(); await page.waitForTimeout(600); };
  await page.getByRole('button', { name: 'Today', exact: true }).click(); await page.waitForTimeout(300);
  const dateBefore = (await page.getByRole('button', { name: 'Open calendar' }).innerText()).trim();
  await swipe(320, 60);
  const dateAfter = (await page.getByRole('button', { name: 'Open calendar' }).innerText()).trim();
  console.log('swipe today:', dateBefore, '→', dateAfter, '| changed:', dateBefore !== dateAfter, '| tomorrow:', /tomorrow/i.test(dateAfter));
  await shot('today-tomorrow');
  await swipe(60, 320);
  console.log('swipe back:', (await page.getByRole('button', { name: 'Open calendar' }).innerText()).trim() === dateBefore);
  await page.getByRole('button', { name: 'Open calendar' }).click(); await page.waitForTimeout(500); await shot('calendar');
  const cal = await page.innerText('body');
  console.log('calendar weeks:', ['WEEK 1', 'ESTABLISH', 'GROOVE', 'DELOAD'].map((k) => k + '=' + cal.includes(k)).join(' '));
  const dots = {}; for (const st of ['scheduled', 'done', 'rest']) dots[st] = await page.locator(`[data-status="${st}"]`).count();
  console.log('calendar dots:', JSON.stringify(dots));
  await page.locator('[data-status="scheduled"]').first().click(); await page.waitForTimeout(300);
  const dayTxt = await page.innerText('body');
  console.log('day detail:', /SCHEDULED — .* — NOT STARTED/.test(dayTxt), '| start btn:', await page.getByRole('button', { name: /Start session|Log this session/ }).count());
  await shot('calendar-day');
  await page.getByRole('button', { name: 'Week 3' }).click(); await page.waitForTimeout(300);
  console.log('week jump ok:', await page.evaluate(() => JSON.parse(localStorage.getItem('mi:mi-week'))) === 2);
  await page.getByRole('button', { name: 'Week 2' }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Done', exact: true }).click(); await page.waitForTimeout(300);
  // train: swipe moves the day (the same strip as Today); the week is untouched
  await page.getByRole('button', { name: 'Train', exact: true }).click(); await page.waitForTimeout(300);
  const chip = async () => (await page.locator('main [aria-pressed="true"]').innerText()).replace(/\n/g, ' ');
  const c0 = await chip(); await swipe(320, 60, 420);
  const c1 = await chip(); console.log('train swipe day:', c0, '→', c1, '| changed:', c0 !== c1);
  await swipe(60, 320, 420);
  console.log('train swipe back:', (await chip()) === c0, '| week unchanged:', await page.evaluate(() => JSON.parse(localStorage.getItem('mi:mi-week'))) === 1);
  const infos = await page.locator('button[aria-label^="Muscles worked"]').count();
  console.log('infographics on train:', infos);
  await page.locator('ul li button[aria-label^="Muscles worked"]').first().click(); await page.waitForTimeout(500); await shot('muscle-sheet');
  console.log('muscle sheet:', (await page.locator('.rounded-t-2xl').innerText()).includes('PRIMARY'));
  await page.locator('.rounded-t-2xl').getByRole('button', { name: 'Form' }).click(); await page.waitForTimeout(900); await shot('form-sheet');
  const form = await page.locator('.rounded-t-2xl').last().innerText();
  console.log('form sheet:', form.includes('FORM VIDEO COMING'), '| cues:', (form.match(/\n[123]\n/g) || []).length, '| slot:', /assets\/form\/[a-z0-9-]+\.mp4/.test(form));
  await page.getByRole('button', { name: 'Close' }).last().click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^Form video for/ }).first().click(); await page.waitForTimeout(600);
  console.log('form from card:', (await page.locator('.rounded-t-2xl').last().innerText()).includes('FORM VIDEO COMING'));
  await page.getByRole('button', { name: 'Close' }).last().click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300);
  await shot('train-cards');

  // --- add bench via plain language ---
  await page.getByRole('button', { name: 'Add bench' }).click(); await page.waitForTimeout(1200); await shot('add-bench');
  const banner = await page.locator('main').innerText();
  console.log('override:', banner.match(/Adjusted[^\n]*/)?.[0], '|', banner.match(/\+ Flat[^\n]*/)?.[0]);
  // --- short on time sheet ---
  await page.getByRole('button', { name: 'Undo — full session' }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Short on time' }).click(); await page.waitForTimeout(400); await shot('short-sheet');
  await page.getByRole('button', { name: '30 min' }).click(); await page.getByRole('button', { name: 'Rebuild for 30' }).click(); await page.waitForTimeout(400);
  console.log('short:', (await page.locator('main').innerText()).match(/Short on time ·[^\n]*/)?.[0]);
  console.log('undo present:', await page.getByRole('button', { name: 'Undo — full session' }).count());
  await page.getByRole('button', { name: 'Undo — full session' }).click(); await page.waitForTimeout(200);
  console.log('undone:', !(await page.locator('main').innerText()).includes('Short on time ·'));
  // --- swaps sheet ---
  await page.getByRole('button', { name: 'Edit', exact: true }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Swaps' }).nth(1).click(); await page.waitForTimeout(900); await shot('swaps');
  console.log('swap options:', (await page.locator('.rounded-t-2xl').innerText()).replace(/\n+/g, ' | ').slice(0, 200));
  await page.locator('.rounded-t-2xl').getByRole('button', { name: 'Incline Flys' }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Done editing' }).click(); await page.waitForTimeout(200);
  console.log('second exercise now:', (await page.locator('ul li').nth(1).innerText()).replace(/\n+/g,' | ').slice(0,80));
  // --- session with RIR + PR + recap ---
  await page.getByRole('button', { name: 'Train', exact: true }).click(); await page.waitForTimeout(300);
  if (await page.locator('[data-session="Upper 1"][data-expanded="false"]').count()) { await page.getByRole('button', { name: 'Expand Upper 1' }).click(); await page.waitForTimeout(300); }
  await page.locator('[data-expanded="true"]').getByRole('button', { name: /^(Start session|Train anyway|Start early|Log this session)$/ }).first().click(); await page.waitForTimeout(400); await shot('session');
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
  await page.getByRole('button', { name: 'Progress', exact: true }).click(); await page.waitForTimeout(300);
  await page.locator('main').getByRole('button', { name: 'Progress', exact: true }).click(); await page.waitForTimeout(600); await shot('progress-top');
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
  await page.getByRole('button', { name: 'Leaderboard and wall' }).click(); await page.waitForTimeout(900);
  await page.getByRole('button', { name: 'Feed', exact: true }).click(); await page.waitForTimeout(900); await shot('wall');
  const wall = await page.innerText('main'); console.log('wall posts:', wall.includes('jess.lifts'), wall.includes('Hip thrust 80'));
  await page.getByRole('button', { name: 'Testimony' }).click(); await page.waitForTimeout(200);
  await page.locator('textarea').fill('Week 2 and the bar already moved. First time I know what I am doing in there.');
  await page.getByRole('button', { name: 'Post to the feed' }).click(); await page.waitForTimeout(900);
  // upvote + comment
  await page.getByRole('button', { name: 'Upvote' }).first().click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: /comments?$/ }).first().click(); await page.waitForTimeout(200);
  await page.getByPlaceholder('Say something useful').fill('Massive. What did the hip thrust start at?'); await page.getByRole('button', { name: 'Post', exact: true }).click(); await page.waitForTimeout(500);
  const lp = mock.calls.filter((c) => c.path === '/wall' && c.method === 'POST' && (c.body.like || c.body.comment)); console.log('like/comment POSTs:', lp.map((c) => c.body.like ? 'like' : 'comment').join(','));
  await page.getByRole('button', { name: 'Recent', exact: true }).click(); await page.waitForTimeout(200); await shot('feed-recent');
  // before/after composer
  await page.getByRole('button', { name: 'Before / after' }).click(); await page.waitForTimeout(300);
  const bi = page.locator('input[type=file]'); await bi.nth(0).setInputFiles({ name: 'b.png', mimeType: 'image/png', buffer: PNG }); await bi.nth(1).setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG }); await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Build the image' }).click(); await page.waitForTimeout(1200); await shot('before-after');
  console.log('before/after built:', await page.locator('img[alt="Before and after"]').count());
  await page.getByRole('button', { name: 'Post to the feed' }).click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Post to the feed' }).click(); await page.waitForTimeout(800);
  const ip = mock.calls.filter((c) => c.path === '/wall' && c.method === 'POST' && c.body.image); console.log('image post sent:', ip.length > 0, 'image bytes:', ip[0] ? ip[0].body.image.length : 0);
  console.log('image visible on feed:', await page.locator('main img[alt=""]').count() > 0);
  const wp = mock.calls.filter((c) => c.path === '/wall' && c.method === 'POST'); console.log('wall POST:', wp.length, JSON.stringify(wp[0] && wp[0].body).slice(0, 160));
  await page.getByRole('button', { name: 'League', exact: true }).click(); await page.waitForTimeout(900); await shot('board');
  console.log('promotion line:', (await page.innerText('main')).includes('PROMOTION LINE'));
  const board = await page.innerText('main'); await page.getByRole('button', { name: 'Show all ranks' }).click(); await page.waitForTimeout(200);
  const board2 = await page.innerText('main'); console.log('board:', board2.includes('maxmurray'), board2.includes('VERIFIED'), board2.includes('Diamond'));
  await page.getByRole('button', { name: 'Verify' }).click(); await page.waitForTimeout(300);
  await page.getByPlaceholder('Link to your clip').fill('https://instagram.com/p/abc');
  await page.getByPlaceholder('kg').fill('100');
  await page.getByRole('button', { name: 'Submit for review' }).click(); await page.waitForTimeout(600); await shot('verify');
  const vp = mock.calls.filter((c) => c.path === '/board' && c.method === 'POST' && c.body.verify); console.log('verify POST:', vp.length, JSON.stringify(vp[0] && vp[0].body.verify));
  // --- meals (round 4): ring + LOG above the fold, everything else behind PLAN ---
  await page.getByRole('button', { name: 'Meals', exact: true }).click(); await page.waitForTimeout(500); await shot('eat-top');
  const foldBox = await page.locator('[data-meals-fold]').boundingBox(); const logBox = await page.getByRole('button', { name: 'Log a meal' }).boundingBox();
  console.log('meals fold: ring card bottom', Math.round(foldBox.y + foldBox.height), '| LOG bottom', Math.round(logBox.y + logBox.height), '| fits 844:', logBox.y + logBox.height <= 844);
  const mealsMain = (await page.innerText('main')).toUpperCase();
  console.log('meals main clutter-free:', ['APPROVED FOODS', 'SWAP MACHINE', 'MEAL PREP', 'MICRONUTRIENT', 'RECALC'].map((k) => k + '=' + !mealsMain.includes(k)).join(' '));
  console.log('coach tip:', await page.locator('[data-coach-tip]').innerText());
  await page.getByRole('button', { name: 'Plan', exact: true }).click(); await page.waitForTimeout(400); await shot('plan-sheet');
  const planTxt = (await page.locator('.rounded-t-2xl').innerText()).toUpperCase();
  console.log('plan sheet has:', ['YOUR NUMBERS', 'TIMING', 'MEAL PREP FOR YOU', 'SWAP MACHINE', 'APPROVED FOODS', 'MICRONUTRIENT'].map((k) => k + '=' + planTxt.includes(k)).join(' '));
  await page.getByRole('button', { name: 'Set up' }).click(); await page.waitForTimeout(200);
  await page.getByPlaceholder('What you like').fill('mince, rice, eggs'); await page.getByPlaceholder('Where you shop').fill('Aldi'); await page.getByPlaceholder('Allergies').fill('none');
  await page.locator('input[type=file][accept*=".txt"]').setInputFiles({ name: 'food.txt', mimeType: 'text/plain', buffer: Buffer.from('chicken thighs\nrice\neggs\nbutter') });
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Recommend my meal prep' }).click(); await page.waitForTimeout(1000); await shot('mealprep');
  const mp = mock.calls.filter((c) => c.path === '/' && String(c.body.system).includes('meal prep')); console.log('mealprep call has food file:', String(mp[0] && mp[0].body.system).includes('chicken thighs'));
  await page.locator('.rounded-t-2xl').getByRole('button', { name: 'Log', exact: true }).first().click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Close', exact: true }).click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300);
  console.log('prep meal logged as card:', (await page.locator('[data-meals-list]').innerText()).includes('Mince & rice tray'), '| star:', await page.locator('[data-meals-list] svg').count() > 0);
  // LOG sheet — Photo · Voice · Type
  await page.getByRole('button', { name: 'Log a meal' }).click(); await page.waitForTimeout(300);
  console.log('log tabs:', (await page.getByRole('tab').allInnerTexts()).join(' · '));
  await page.getByRole('tab', { name: 'Type' }).click();
  await page.getByPlaceholder('e.g. 300g mince').fill('300g mince, potatoes, milk'); await page.locator('.rounded-t-2xl').getByRole('button', { name: 'Log', exact: true }).click(); await page.waitForTimeout(900);
  console.log('typed meal logged + sheet closed:', (await page.innerText('main')).includes('Mince, potatoes, milk'), await page.locator('.rounded-t-2xl').count() === 0);
  await page.getByRole('button', { name: 'Log a meal' }).click(); await page.waitForTimeout(300);
  await page.getByRole('tab', { name: 'Photo' }).click(); await page.waitForTimeout(900); await shot('log-photo');
  const shutter = await page.getByRole('button', { name: 'Take photo' }).count();
  if (shutter) await page.getByRole('button', { name: 'Take photo' }).click();
  else await page.locator('.rounded-t-2xl input[type=file][capture=environment]').first().setInputFiles({ name: 'meal.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForTimeout(1400);
  console.log('photo meal logged:', (await page.innerText('main')).includes('Eggs on sourdough'), '| via', shutter ? 'shutter (live frame)' : 'file input');
  // voice — twice in a row, both kept, both playable
  await page.getByRole('button', { name: 'Log a meal' }).click(); await page.waitForTimeout(300);
  await page.getByRole('tab', { name: 'Voice' }).click(); await page.waitForTimeout(300); await shot('log-voice');
  const vstate = async () => await page.locator('[data-voice-state]').getAttribute('data-voice-state');
  const take = async (text) => {
    await page.getByRole('button', { name: 'Start recording' }).click(); await page.waitForTimeout(1500);
    const rec = await vstate(); const bars = await page.evaluate(() => Array.from(document.querySelectorAll('.rounded-t-2xl .h-12 span')).filter((b) => parseInt(b.style.height) > 2).length);
    await page.getByRole('button', { name: 'Stop recording' }).click(); await page.waitForTimeout(900);
    const done = await vstate();
    await page.getByRole('textbox', { name: 'Transcript' }).fill(text);
    await page.getByRole('button', { name: 'Log it' }).click(); await page.waitForTimeout(1100);
    return rec + ' (' + bars + ' live bars) → ' + done + ' → ' + (await vstate());
  };
  console.log('voice take 1:', await take('three eggs, sourdough and a banana')); await shot('voice-saved');
  await page.getByRole('button', { name: 'Log another' }).click(); await page.waitForTimeout(300);
  console.log('voice take 2:', await take('a bulking shake with oats'));
  await page.getByRole('button', { name: 'Close', exact: true }).click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300);
  const voiceEntries = await page.evaluate(() => { const f = JSON.parse(localStorage.getItem('mi:mi-food') || '{}'); const k = new Date().toISOString().slice(0, 10); return (f[k] || []).filter((e) => e.via === 'voice').map((e) => ({ name: e.name, audio: !!e.audio && String(e.audio).startsWith('data:audio'), bytes: (e.audio || '').length, s: e.duration })); });
  console.log('voice entries kept:', JSON.stringify(voiceEntries), '| play buttons:', await page.getByRole('button', { name: /^Play voice note/ }).count());
  const playable = await page.evaluate(async () => { const f = JSON.parse(localStorage.getItem('mi:mi-food') || '{}'); const k = new Date().toISOString().slice(0, 10); const out = []; for (const e of (f[k] || []).filter((e) => e.audio)) { out.push(await new Promise((res) => { const a = new Audio(e.audio); const t = setTimeout(() => res('timeout'), 4000); a.oncanplay = () => { clearTimeout(t); res('canplay'); }; a.onerror = () => { clearTimeout(t); res('error'); }; a.load(); })); } return out; });
  console.log('voice notes playable:', playable.join(', '));
  await page.getByRole('button', { name: /^Play voice note/ }).first().click(); await page.waitForTimeout(200);
  await shot('eat-list');
  // tap to edit, swipe to delete
  await page.locator('[data-meals-list] li').first().locator('.p-3\\.5').click(); await page.waitForTimeout(300);
  console.log('edit sheet:', await page.getByRole('textbox', { name: 'Meal name' }).count());
  await page.getByRole('button', { name: 'Mark as the big meal' }).click(); await page.getByRole('button', { name: 'Save', exact: true }).click(); await page.waitForTimeout(300);
  const before = await page.locator('[data-meals-list] li').count();
  await page.locator('[data-meals-list] li').last().evaluate((el) => el.scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
  const row = await page.locator('[data-meals-list] li').last().boundingBox();
  await page.mouse.move(row.x + row.width - 40, row.y + row.height / 2); await page.mouse.down(); for (let i = 1; i <= 8; i++) { await page.mouse.move(row.x + row.width - 40 - i * 20, row.y + row.height / 2); await page.waitForTimeout(15); } await page.mouse.up(); await page.waitForTimeout(400);
  console.log('swipe to delete:', before, '→', await page.locator('[data-meals-list] li').count());
  // --- coach usage line + settings ---
  await page.getByRole('button', { name: 'Coach', exact: true }).first().click(); await page.waitForTimeout(300);
  console.log('learn segment:', await page.getByRole('button', { name: 'Learn', exact: true }).count());
  console.log('coach line:', (await page.innerText('main')).match(/\d+ coach calls left[^\n]*/)?.[0]);
  await page.getByRole('button', { name: 'Settings' }).click(); await page.waitForTimeout(900); await shot('settings');
  console.log('form admin:', (await page.innerText('body')).includes('FORM VIDEOS'), '| slots listed:', (await page.locator('text=/assets\\/form\\/[a-z0-9-]+\\.mp4/').count()));
  await page.evaluate(() => document.querySelector('.z-\\[80\\]').scrollTo(0, 700)); await page.waitForTimeout(200); await shot('settings-2');
  console.log('usage:', await page.evaluate(() => localStorage.getItem('mi:mi-aiusage')));
  const e404 = page.errors.filter((e) => /404/.test(e)).length;
  console.log('expected 404s (empty form slots):', e404);
  console.log('errors:', page.errors.filter((e) => !/ERR_FAILED|404/.test(e)));
  console.log('errbox:', await page.$eval('#errbox', (e) => e.textContent));
  // --- round 4: "Not going gym today?" nudge + the two-set mini session ---
  await page.getByRole('button', { name: 'Done', exact: true }).first().click(); await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Today', exact: true }).click(); await page.waitForTimeout(300);
  const nd = await page.evaluate(() => ({ due: window.MI_nudge.due, at: window.MI_nudge.hour + ':00', plan: window.MI_nudge.plan, now: new Date().getHours() }));
  console.log('nudge:', JSON.stringify(nd), '| banner now:', await page.locator('[data-nudge]').count());
  await page.evaluate(() => window.MI_nudge.show()); await page.waitForTimeout(300);
  console.log('nudge banner:', (await page.locator('[data-nudge]').innerText()).replace(/\n/g, ' | ')); await shot('nudge');
  await page.locator('[data-nudge]').getByRole('button', { name: 'Two sets' }).click(); await page.waitForTimeout(600);
  const miniTxt = await page.locator('[data-mini]').innerText();
  console.log('mini session:', /TWO SETS ·/.test(miniTxt), '| timer:', await page.locator('[data-mini-timer]').innerText(), '| rows:', (miniTxt.match(/Work ×6|Back-off ×6/g) || []).length, '| lift:', await page.locator('[data-mini] p.text-\\[22px\\]').innerText());
  await shot('mini');
  await page.getByRole('textbox', { name: 'Work ×6 @1 RIR weight' }).fill('30'); await page.getByRole('textbox', { name: 'Work ×6 @1 RIR reps' }).fill('6'); await page.getByRole('textbox', { name: 'Back-off ×6 (−10%) reps' }).fill('6');
  await page.getByRole('button', { name: 'Log both sets' }).click(); await page.waitForTimeout(400);
  console.log('mini done:', (await page.locator('[data-mini]').innerText()).includes('TWO SETS IN'), '| history mini:', await page.evaluate(() => { const hh = JSON.parse(localStorage.getItem('mi:mi-history') || '{}'); const k = new Date().toISOString().slice(0, 10); return !!(hh[k] && hh[k].mini); }));
  await page.getByRole('button', { name: 'Done', exact: true }).click(); await page.waitForTimeout(300);
  const ev = mock.calls.filter((c) => c.path === '/event').map((c) => c.body.e); console.log('analytics events:', Array.from(new Set(ev)).join(', '), '| identity fields:', Object.keys(mock.calls.find((c) => c.path === '/event')?.body || {}).join(','));
  // --- round 4: the ?mini=1 deep link (what the notification opens), trial without a card, member code ---
  await page.evaluate(() => { localStorage.setItem('mi:mi-pro', 'false'); localStorage.setItem('mi:mi-trial', String(Date.now())); });
  await page.goto('http://localhost:8768/index.html?mini=1'); await page.waitForTimeout(3000);
  await page.waitForSelector('[data-mini]', { timeout: 8000 }).catch(() => {});
  await shot('deeplink');
  console.log('deep link opens mini:', await page.locator('[data-mini]').count(), '| url cleaned:', await page.evaluate(() => location.search) === '');
  await page.getByRole('button', { name: 'Close mini session' }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Settings' }).click(); await page.waitForTimeout(700);
  console.log('trial without a card:', (await page.innerText('body')).match(/Trial — \d+ days? left/)?.[0]);
  await page.getByPlaceholder('ACCESS CODE').fill('MAXTEST'); await page.getByRole('button', { name: 'Unlock' }).click(); await page.waitForTimeout(900);
  console.log('member code unlock:', (await page.innerText('body')).includes('Unlocked — full access'));
  for (const f of ['404.html', 'offline.html']) { await page.goto('http://localhost:8768/' + f); await page.waitForTimeout(300); console.log(f + ':', (await page.innerText('h1')).replace(/\n/g, ' '), '| link:', await page.getAttribute('a.btn', 'href')); await shot(f.replace('.html', '')); }
  await h.close();
})().catch(async (e) => { console.error('FAIL', e.stack.split('\n').filter((l) => /app.js/.test(l)).slice(0, 2).join(' | ') || e.message.split('\n')[0]); if (page) await page.screenshot({ path: S + '/shots/a99-fail.png' }); process.exit(1); });
