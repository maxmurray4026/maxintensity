/* MAX INTENSITY — PLAN MY WEEK (round 5).
   Behind PLAN on Meals: a seven-step setup (one decision a screen), a building
   screen, then a week built around Max's method — ONE BIG MEAL a day, a quick
   breakfast and one or two snacks — with a meal detail (ingredients, steps,
   notes, swap) and a grocery list aggregated by aisle. The coach generates the
   week when Max AI is available; the built-in library (Max's items first) does
   it otherwise, and always fills any gaps.
   Exposes MI.PlanWeek, MI.buildWeekLocal, MI.normaliseWeek, MI.groceryFor. */
try {
(function (MI) {
  const { useState, useEffect } = React;
  const { card, cta, ghost, eyebrow } = MI.ui;

  const SHOPS = ["Tesco", "Sainsbury's", "Asda", "Morrisons", "Aldi", "Lidl", "Co-op", "M&S"];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MOODS = ["Speedy meals", "Low calorie", "Protein packed", "Fakeaway", "Healthy comfort", "Family favs", "Gut friendly", "British staples"];
  const APPLIANCES = ["Oven", "Hob", "Microwave", "Air fryer", "Slow cooker"];
  const DIETS = ["None", "Vegetarian", "Vegan", "Pescatarian"];
  const AISLES = ["Fruit & veg", "Meat & fish", "Dairy & eggs", "Bakery", "Rice, pasta & grains", "Tins & jars", "Frozen", "Spices & sauces", "Drinks"];
  MI.PLAN_OPTIONS = { SHOPS, DAYS, MOODS, APPLIANCES, DIETS, AISLES };

  /* ---- the library: Max's items first, then meals built from the approved foods.
     cost = £ per serve, time = minutes, serves = base portions, diet = meat | fish | veg | vegan. ---- */
  const ing = (name, qty, unit, aisle) => ({ name, qty, unit, aisle });
  const BREAKFASTS = [
    { id: "b-yog", name: "0% Greek yogurt + fruit", tag: "Max's quick breakfast", kcal: 260, protein: 28, carbs: 30, fat: 1, time: 3, serves: 1, cost: 0.95, diet: "veg",
      ingredients: [ing("0% Greek yogurt", 250, "g", "Dairy & eggs"), ing("Berries or chopped fruit", 150, "g", "Fruit & veg")],
      steps: ["200–300 g of 0% Greek yogurt in a bowl.", "100–200 g of fruit on top — berries, banana, whatever you like.", "Done. Eat it, move on."] },
    { id: "b-oats", name: "Overnight oats with berries", tag: "Speedy meals", kcal: 380, protein: 18, carbs: 58, fat: 8, time: 5, serves: 1, cost: 0.7, diet: "veg",
      ingredients: [ing("Oats", 60, "g", "Rice, pasta & grains"), ing("Semi-skimmed milk", 150, "ml", "Dairy & eggs"), ing("0% Greek yogurt", 100, "g", "Dairy & eggs"), ing("Frozen berries", 80, "g", "Frozen"), ing("Honey", 1, "tsp", "Spices & sauces")],
      steps: ["Oats, milk and yogurt in a jar the night before.", "Berries on top, lid on, fridge.", "Honey in the morning if you want it."] },
    { id: "b-eggs", name: "Eggs on sourdough", tag: "Protein packed", kcal: 420, protein: 26, carbs: 34, fat: 19, time: 8, serves: 1, cost: 1.1, diet: "veg",
      ingredients: [ing("Eggs", 3, "", "Dairy & eggs"), ing("Sourdough", 2, "slices", "Bakery"), ing("Spray oil", 1, "", "Spices & sauces")],
      steps: ["Spray the pan, three eggs in, low heat.", "Toast the sourdough.", "Salt, pepper, hot sauce if you like it."] },
  ];
  const SNACKS = [
    { id: "s-fruit", name: "Cut fruit", kcal: 90, protein: 1, carbs: 22, fat: 0, cost: 0.5, diet: "vegan", ingredients: [ing("Apples, pears or melon", 150, "g", "Fruit & veg")] },
    { id: "s-nuts", name: "Handful of nuts", kcal: 180, protein: 6, carbs: 5, fat: 16, cost: 0.6, diet: "vegan", ingredients: [ing("Mixed nuts", 30, "g", "Fruit & veg")] },
    { id: "s-banana", name: "Banana or grapes", kcal: 100, protein: 1, carbs: 25, fat: 0, cost: 0.3, diet: "vegan", ingredients: [ing("Bananas", 1, "", "Fruit & veg")] },
    { id: "s-yog", name: "Greek yogurt pot", kcal: 130, protein: 18, carbs: 8, fat: 1, cost: 0.6, diet: "veg", ingredients: [ing("0% Greek yogurt", 170, "g", "Dairy & eggs")] },
    { id: "s-eggs", name: "Two boiled eggs", kcal: 150, protein: 13, carbs: 1, fat: 10, cost: 0.5, diet: "veg", ingredients: [ing("Eggs", 2, "", "Dairy & eggs")] },
    { id: "s-tuna", name: "Tuna backup", kcal: 180, protein: 28, carbs: 10, fat: 2, cost: 1.0, diet: "fish", ingredients: [ing("Tinned tuna", 1, "tin", "Tins & jars"), ing("Rice cakes", 3, "", "Bakery")] },
  ];
  const BIG = [
    { id: "m-mince-rice", name: "Beef mince & rice tray", tags: ["Protein packed", "Speedy meals"], diet: "meat", needs: ["Hob"], kcal: 980, protein: 82, carbs: 96, fat: 30, time: 30, serves: 4, cost: 2.0,
      ingredients: [ing("5% beef mince", 800, "g", "Meat & fish"), ing("Basmati rice", 320, "g", "Rice, pasta & grains"), ing("Chopped tomatoes", 2, "tins", "Tins & jars"), ing("Onions", 2, "", "Fruit & veg"), ing("Peppers", 2, "", "Fruit & veg"), ing("Garlic", 4, "cloves", "Fruit & veg"), ing("Smoked paprika & cumin", 1, "", "Spices & sauces")],
      steps: ["Brown the mince in a dry pan, no oil needed. Drain.", "Onions, peppers, garlic in for five minutes.", "Tomatoes, paprika, cumin, salt. Simmer 15 minutes.", "Rice cooked, plate up, portion the rest for three days."] },
    { id: "m-chilli", name: "Chilli con carne with rice", tags: ["Family favs", "Healthy comfort", "British staples"], diet: "meat", needs: ["Hob"], kcal: 1020, protein: 78, carbs: 108, fat: 28, time: 40, serves: 4, cost: 2.1,
      ingredients: [ing("5% beef mince", 800, "g", "Meat & fish"), ing("Kidney beans", 2, "tins", "Tins & jars"), ing("Chopped tomatoes", 2, "tins", "Tins & jars"), ing("Basmati rice", 320, "g", "Rice, pasta & grains"), ing("Onions", 2, "", "Fruit & veg"), ing("Chilli powder & cumin", 1, "", "Spices & sauces"), ing("0% Greek yogurt", 100, "g", "Dairy & eggs")],
      steps: ["Brown the mince, drain. Onions in for five.", "Tomatoes, beans, spices, a splash of water. Simmer 25 minutes.", "Rice on. Yogurt instead of sour cream on top.", "Freeze two portions — that's the backup."] },
    { id: "m-thigh-tray", name: "Chicken thigh & potato tray bake", tags: ["Healthy comfort", "Protein packed", "British staples"], diet: "meat", needs: ["Oven"], kcal: 940, protein: 70, carbs: 82, fat: 34, time: 45, serves: 4, cost: 2.4,
      ingredients: [ing("Chicken thighs (skinless)", 900, "g", "Meat & fish"), ing("Potatoes", 1000, "g", "Fruit & veg"), ing("Red onions", 2, "", "Fruit & veg"), ing("Broccoli", 1, "head", "Fruit & veg"), ing("Lemon", 1, "", "Fruit & veg"), ing("Spray oil", 1, "", "Spices & sauces"), ing("Paprika, oregano, garlic granules", 1, "", "Spices & sauces")],
      steps: ["Oven 200°C. Potatoes chunked, spray of oil, spices, 20 minutes.", "Thighs and onions on top, lemon squeezed over, 25 more.", "Broccoli steamed in the microwave for the last three.", "One tray, four plates."] },
    { id: "m-tikka", name: "Fakeaway chicken tikka & rice", tags: ["Fakeaway", "Protein packed"], diet: "meat", needs: ["Oven", "Hob"], kcal: 960, protein: 76, carbs: 100, fat: 22, time: 35, serves: 4, cost: 2.6,
      ingredients: [ing("Chicken breast", 800, "g", "Meat & fish"), ing("0% Greek yogurt", 200, "g", "Dairy & eggs"), ing("Tikka spice mix", 1, "", "Spices & sauces"), ing("Basmati rice", 320, "g", "Rice, pasta & grains"), ing("Cucumber", 1, "", "Fruit & veg"), ing("Lemon", 1, "", "Fruit & veg"), ing("Onions", 1, "", "Fruit & veg")],
      steps: ["Chicken in yogurt, tikka spice and lemon. 20 minutes if you have it.", "Oven 220°C, 18 minutes on a rack, or the air fryer.", "Rice on. Cucumber and onion salad with a squeeze of lemon.", "The takeaway, without the takeaway."] },
    { id: "m-cottage", name: "Cottage pie", tags: ["Family favs", "British staples", "Healthy comfort"], diet: "meat", needs: ["Oven", "Hob"], kcal: 900, protein: 64, carbs: 84, fat: 30, time: 60, serves: 4, cost: 2.3,
      ingredients: [ing("5% beef mince", 800, "g", "Meat & fish"), ing("Potatoes", 1200, "g", "Fruit & veg"), ing("Carrots", 3, "", "Fruit & veg"), ing("Onions", 2, "", "Fruit & veg"), ing("Beef stock cube", 1, "", "Spices & sauces"), ing("Semi-skimmed milk", 100, "ml", "Dairy & eggs"), ing("Worcestershire sauce", 1, "", "Spices & sauces")],
      steps: ["Mince browned with onions and carrots. Stock, Worcestershire, simmer 15.", "Potatoes boiled and mashed with a splash of milk, no butter needed.", "Mash on top, fork the surface, oven 200°C for 25.", "Feeds the house twice."] },
    { id: "m-sardine-pasta", name: "Sardine & tomato pasta", tags: ["Low calorie", "Speedy meals", "Gut friendly"], diet: "fish", needs: ["Hob"], kcal: 720, protein: 42, carbs: 90, fat: 20, time: 20, serves: 2, cost: 1.4,
      ingredients: [ing("Tinned sardines in tomato", 2, "tins", "Tins & jars"), ing("Pasta", 180, "g", "Rice, pasta & grains"), ing("Chopped tomatoes", 1, "tin", "Tins & jars"), ing("Garlic", 3, "cloves", "Fruit & veg"), ing("Chilli flakes", 1, "", "Spices & sauces"), ing("Spinach", 100, "g", "Fruit & veg")],
      steps: ["Pasta on.", "Garlic and chilli flakes in a spray of oil, tomatoes in, five minutes.", "Sardines broken in, spinach wilted through.", "Toss with the pasta. Twenty minutes, done."] },
    { id: "m-salmon", name: "Air-fryer salmon, new potatoes & greens", tags: ["Protein packed", "Low calorie"], diet: "fish", needs: ["Air fryer"], kcal: 780, protein: 52, carbs: 60, fat: 34, time: 25, serves: 2, cost: 3.4,
      ingredients: [ing("Salmon fillets", 2, "", "Meat & fish"), ing("New potatoes", 500, "g", "Fruit & veg"), ing("Green beans", 200, "g", "Fruit & veg"), ing("Lemon", 1, "", "Fruit & veg"), ing("Dill or mixed herbs", 1, "", "Spices & sauces")],
      steps: ["Potatoes halved, spray of oil, air fryer 12 minutes at 200°C.", "Salmon on top, herbs, lemon, 9 more minutes.", "Beans steamed in the microwave.", "Plate. Squeeze the lemon over everything."] },
    { id: "m-stew", name: "Slow cooker beef stew with potatoes", tags: ["Healthy comfort", "British staples", "Family favs"], diet: "meat", needs: ["Slow cooker"], kcal: 880, protein: 66, carbs: 78, fat: 28, time: 20, serves: 4, cost: 2.5,
      ingredients: [ing("Lean stewing beef", 800, "g", "Meat & fish"), ing("Potatoes", 1000, "g", "Fruit & veg"), ing("Carrots", 4, "", "Fruit & veg"), ing("Onions", 2, "", "Fruit & veg"), ing("Beef stock cubes", 2, "", "Spices & sauces"), ing("Tomato purée", 2, "tbsp", "Tins & jars"), ing("Thyme & bay", 1, "", "Spices & sauces")],
      steps: ["Everything in the slow cooker in the morning. Twenty minutes of chopping.", "Low for eight hours, or high for four.", "Salt at the end, not the start.", "Plates itself. Fridge the rest."] },
    { id: "m-jacket", name: "Jacket potato, tuna & cottage cheese", tags: ["Speedy meals", "Low calorie"], diet: "fish", needs: ["Microwave"], kcal: 640, protein: 48, carbs: 76, fat: 12, time: 15, serves: 1, cost: 1.5,
      ingredients: [ing("Baking potatoes", 1, "", "Fruit & veg"), ing("Tinned tuna", 1, "tin", "Tins & jars"), ing("Cottage cheese", 150, "g", "Dairy & eggs"), ing("Sweetcorn", 1, "tin", "Tins & jars"), ing("Hot sauce", 1, "", "Spices & sauces")],
      steps: ["Potato pricked, microwave 9 minutes. Oven 10 minutes after if you want the skin.", "Tuna, cottage cheese and sweetcorn mixed.", "Pile it on. Hot sauce, black pepper.", "The no-cook backup that stops a takeaway."] },
    { id: "m-shakshuka", name: "Shakshuka with sourdough", tags: ["Gut friendly", "Low calorie", "Healthy comfort"], diet: "veg", needs: ["Hob"], kcal: 680, protein: 34, carbs: 62, fat: 30, time: 25, serves: 2, cost: 1.6,
      ingredients: [ing("Eggs", 6, "", "Dairy & eggs"), ing("Chopped tomatoes", 2, "tins", "Tins & jars"), ing("Peppers", 2, "", "Fruit & veg"), ing("Onions", 1, "", "Fruit & veg"), ing("Sourdough", 4, "slices", "Bakery"), ing("Cumin & smoked paprika", 1, "", "Spices & sauces"), ing("Feta", 60, "g", "Dairy & eggs")],
      steps: ["Onion and peppers softened, spices in.", "Tomatoes in, simmer ten minutes till thick.", "Wells for the eggs, lid on, six minutes.", "Feta crumbled over, sourdough for scooping."] },
    { id: "m-lentil", name: "Lentil & sweet potato curry with rice", tags: ["Gut friendly", "Healthy comfort", "Low calorie"], diet: "vegan", needs: ["Hob"], kcal: 760, protein: 28, carbs: 128, fat: 14, time: 35, serves: 4, cost: 1.3,
      ingredients: [ing("Red lentils", 300, "g", "Rice, pasta & grains"), ing("Sweet potatoes", 600, "g", "Fruit & veg"), ing("Light coconut milk", 1, "tin", "Tins & jars"), ing("Chopped tomatoes", 1, "tin", "Tins & jars"), ing("Curry powder & turmeric", 1, "", "Spices & sauces"), ing("Basmati rice", 320, "g", "Rice, pasta & grains"), ing("Spinach", 150, "g", "Fruit & veg")],
      steps: ["Lentils, sweet potato, tomatoes, coconut milk and spices in a pot.", "Simmer 25 minutes, stir now and then.", "Spinach stirred through at the end.", "Rice, plate, spices are free."] },
    { id: "m-burgers", name: "Turkey fakeaway burgers & wedges", tags: ["Fakeaway", "Family favs"], diet: "meat", needs: ["Air fryer", "Oven"], kcal: 860, protein: 62, carbs: 88, fat: 26, time: 30, serves: 4, cost: 2.2,
      ingredients: [ing("Turkey mince", 700, "g", "Meat & fish"), ing("Burger buns", 4, "", "Bakery"), ing("Potatoes", 900, "g", "Fruit & veg"), ing("Onions", 1, "", "Fruit & veg"), ing("Lettuce & tomato", 1, "", "Fruit & veg"), ing("Light mayo", 1, "", "Spices & sauces"), ing("Garlic granules & paprika", 1, "", "Spices & sauces")],
      steps: ["Mince, grated onion, garlic, paprika, salt. Four patties.", "Wedges sprayed, air fryer 18 minutes at 200°C, shake halfway.", "Patties 12 minutes, flip once.", "Bun, lettuce, tomato, light mayo. Fakeaway sorted."] },
    { id: "m-steak", name: "Steak, mash & greens", tags: ["Protein packed", "British staples"], diet: "meat", needs: ["Hob"], kcal: 900, protein: 72, carbs: 70, fat: 34, time: 30, serves: 2, cost: 3.8,
      ingredients: [ing("Sirloin steak", 2, "", "Meat & fish"), ing("Potatoes", 700, "g", "Fruit & veg"), ing("Tenderstem broccoli", 200, "g", "Fruit & veg"), ing("Semi-skimmed milk", 60, "ml", "Dairy & eggs"), ing("Mustard", 1, "", "Spices & sauces")],
      steps: ["Potatoes on to boil. Mash with milk and mustard, not butter.", "Steak out of the fridge early, dry, salted. Hot pan, three minutes a side.", "Rest it five. Broccoli steamed.", "Slice, plate, the mash carries you to bed."] },
    { id: "m-stirfry", name: "Chicken & rice stir fry", tags: ["Speedy meals", "Protein packed", "Fakeaway"], diet: "meat", needs: ["Hob"], kcal: 820, protein: 66, carbs: 96, fat: 16, time: 20, serves: 2, cost: 2.0,
      ingredients: [ing("Chicken breast", 400, "g", "Meat & fish"), ing("Microwave rice", 2, "pouches", "Rice, pasta & grains"), ing("Stir fry veg", 400, "g", "Fruit & veg"), ing("Soy sauce", 1, "", "Spices & sauces"), ing("Garlic & ginger", 1, "", "Fruit & veg"), ing("Eggs", 2, "", "Dairy & eggs")],
      steps: ["Chicken sliced thin, hot pan, five minutes.", "Veg in, garlic, ginger, three minutes.", "Rice and soy in, egg cracked through at the end.", "Twenty minutes. Faster than the delivery app."] },
  ];
  MI.WEEK_LIBRARY = { BREAKFASTS, SNACKS, BIG };

  const dietOk = (m, diet) => {
    if (!diet || diet === "None") return true;
    if (diet === "Vegan") return m.diet === "vegan";
    if (diet === "Vegetarian") return m.diet === "veg" || m.diet === "vegan";
    if (diet === "Pescatarian") return m.diet !== "meat";
    return true;
  };
  const allergyOk = (m, allergies) => {
    const a = String(allergies || "").toLowerCase().split(/[,\s]+/).filter((w) => w.length > 2);
    if (!a.length) return true;
    const text = (m.name + " " + (m.ingredients || []).map((i) => i.name).join(" ")).toLowerCase();
    return !a.some((w) => text.includes(w.replace(/s$/, "")));
  };
  const applianceOk = (m, apps) => !apps || !apps.length || !m.needs || m.needs.some((n) => apps.includes(n));
  const score = (m, moods) => (m.tags || []).filter((t) => (moods || []).includes(t)).length;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* Candidates for the big meal, best fit first. */
  MI.weekCandidates = (prefs) => {
    const { moods = [], appliances = [], diet = "None", allergies = "" } = prefs || {};
    let list = BIG.filter((m) => dietOk(m, diet) && allergyOk(m, allergies) && applianceOk(m, appliances));
    if (!list.length) list = BIG.filter((m) => dietOk(m, diet) && allergyOk(m, allergies));
    if (!list.length) list = BIG.slice();
    return list.sort((a, b) => score(b, moods) - score(a, moods) || a.cost - b.cost);
  };

  /* The week: cook days get a fresh big meal, the days between eat what was
     cooked (batch), any day with nothing before it gets the no-cook backup. */
  MI.buildWeekLocal = (prefs, targets) => {
    const P = Object.assign({ shop: "Tesco", people: 1, cookDays: ["Sun", "Wed"], budget: 60, moods: [], appliances: [], diet: "None", allergies: "" }, prefs || {});
    const people = Math.max(1, Number(P.people) || 1);
    const cands = MI.weekCandidates(P);
    const used = [];
    const pick = () => { const m = cands.find((c) => !used.includes(c.id)) || cands[used.length % cands.length]; used.push(m.id); return clone(m); };
    let last = null;
    const bf = BREAKFASTS.filter((b) => dietOk(b, P.diet) && allergyOk(b, P.allergies));
    const sn = SNACKS.filter((x) => dietOk(x, P.diet) && allergyOk(x, P.allergies));
    const days = DAYS.map((d, i) => {
      const cook = P.cookDays.includes(d);
      let big;
      if (cook) { big = pick(); big.cookedOn = d; last = big; }
      else if (last) { big = clone(last); big.leftover = true; big.tag = "Leftovers"; big.time = 5; }
      else { big = clone(BIG.find((m) => m.id === "m-jacket") || cands[0]); big.tag = "No-cook backup"; }
      if (!big.tag) big.tag = (big.tags || []).find((t) => P.moods.includes(t)) || (big.tags || [])[0] || "Big meal";
      const breakfast = clone(bf[0] || BREAKFASTS[0]);
      const snacks = [clone(sn[i % sn.length] || SNACKS[0]), ...(i % 2 ? [clone(sn[(i + 3) % sn.length] || SNACKS[1])] : [])];
      return { key: d, cook, big, breakfast, snacks };
    });
    // budget: swap the dearest cooked meals for cheaper ones until the week fits
    const cost = (ds) => ds.reduce((t, x) => t + (x.cook ? x.big.cost * people : 0) + x.breakfast.cost * people + x.snacks.reduce((u, s) => u + s.cost * people, 0), 0);
    let guard = 0;
    while (cost(days) > P.budget && guard++ < 10) {
      const cooked = days.filter((x) => x.cook).sort((a, b) => b.big.cost - a.big.cost);
      const dear = cooked[0]; if (!dear) break;
      const cheaper = cands.find((c) => c.cost < dear.big.cost && !days.some((x) => x.big.id === c.id));
      if (!cheaper) break;
      const idx = days.indexOf(dear);
      days[idx].big = { ...clone(cheaper), cookedOn: dear.key, tag: (cheaper.tags || [])[0] };
      for (let j = idx + 1; j < days.length && !days[j].cook; j++) days[j].big = { ...clone(cheaper), leftover: true, tag: "Leftovers", time: 5 };
    }
    return MI.normaliseWeek({ days, source: "library" }, P);
  };

  /* Fill in ids, scale, grocery. Works on the coach's JSON too. */
  MI.normaliseWeek = (raw, prefs) => {
    const P = Object.assign({ people: 1 }, prefs || {});
    const days = (raw.days || []).slice(0, 7).map((d, i) => {
      const fix = (m, kind) => {
        if (!m) return null;
        const o = { id: m.id || (kind + "-" + i + "-" + Math.random().toString(36).slice(2, 7)), name: m.name || "Meal", tag: m.tag || (m.tags || [])[0] || "", kcal: Number(m.kcal) || 0, protein: Number(m.protein) || 0, carbs: Number(m.carbs) || 0, fat: Number(m.fat) || 0, time: Number(m.time) || 0, serves: Number(m.serves) || 1, cost: Number(m.cost) || 0, ingredients: (m.ingredients || []).map((x) => (typeof x === "string" ? ing(x, 1, "", "Tins & jars") : { name: x.name || "", qty: Number(x.qty) || 0, unit: x.unit || "", aisle: AISLES.includes(x.aisle) ? x.aisle : "Tins & jars" })), steps: m.steps || [], tags: m.tags || [], leftover: !!m.leftover, cookedOn: m.cookedOn };
        return o;
      };
      return { key: d.key || DAYS[i], cook: d.cook !== false && !(d.big && d.big.leftover), big: fix(d.big, "big"), breakfast: fix(d.breakfast, "bf") || clone(BREAKFASTS[0]), snacks: (d.snacks || []).map((s) => fix(s, "sn")).filter(Boolean) };
    });
    while (days.length < 7) days.push({ key: DAYS[days.length], cook: false, big: clone(BIG[8]), breakfast: clone(BREAKFASTS[0]), snacks: [clone(SNACKS[0])] });
    const plan = { createdAt: Date.now(), source: raw.source || "coach", prefs: P, days, notes: raw.notes || {}, ticks: raw.ticks || {} };
    plan.grocery = MI.groceryFor(plan);
    return plan;
  };

  /* Grocery list: the week's ingredients scaled to the household, grouped by aisle. */
  MI.groceryFor = (plan) => {
    const people = Math.max(1, Number(plan.prefs && plan.prefs.people) || 1);
    const acc = {};
    const add = (m, mult) => (m.ingredients || []).forEach((x) => { const k = x.name.toLowerCase() + "|" + x.unit; if (!acc[k]) acc[k] = { name: x.name, unit: x.unit, qty: 0, aisle: x.aisle }; acc[k].qty += x.qty * mult; });
    plan.days.forEach((d) => {
      if (d.big && !d.big.leftover && d.big.name) add(d.big, people / Math.max(1, d.big.serves));
      if (d.breakfast) add(d.breakfast, people);
      (d.snacks || []).forEach((s) => add(s, people));
    });
    const fmt = (q, u) => { const n = Math.round(q * 10) / 10; if (u === "g" && n >= 1000) return (Math.round(n / 50) * 50 / 1000) + " kg"; if (u === "ml" && n >= 1000) return (Math.round(n / 100) / 10) + " L"; if (!u) return n > 1 ? String(Math.ceil(n)) : ""; return (Number.isInteger(n) ? n : Math.ceil(n)) + " " + u; };
    return AISLES.map((aisle) => ({ aisle, items: Object.values(acc).filter((x) => x.aisle === aisle).map((x) => ({ name: x.name, qty: fmt(x.qty, x.unit) })) })).filter((a) => a.items.length);
  };
  MI.weekCost = (plan) => { const people = Math.max(1, Number(plan.prefs && plan.prefs.people) || 1); return plan.days.reduce((t, d) => t + (d.cook && d.big ? d.big.cost * people : 0) + (d.breakfast ? d.breakfast.cost * people : 0) + (d.snacks || []).reduce((u, s) => u + s.cost * people, 0), 0); };

  /* ---------------- the flow ---------------- */
  const Bar = ({ n, of }) => <div className="flex gap-1">{Array.from({ length: of }, (_, i) => <span key={i} className={"h-[3px] flex-1 rounded-full " + (i < n ? "bg-[#FF2B2B]" : "bg-neutral-900")} />)}</div>;
  const Big = ({ on, onClick, children, className, ariaPressed }) => <button onClick={onClick} aria-pressed={ariaPressed} className={"rounded-xl border p-4 text-left transition-colors " + (on ? "border-[#FF2B2B] bg-[#1c0808]" : "border-neutral-800 bg-[#141414]") + " " + (className || "")}>{children}</button>;

  MI.PlanWeek = ({ open, onClose, prefs, setPrefs, plan, setPlan, generate, onLog, onMore }) => {
    const [view, setView] = useState(plan ? "plan" : "setup");
    const [step, setStep] = useState(1);
    const [tab, setTab] = useState("week");
    const [detail, setDetail] = useState(null); // { dayIdx, kind, snackIdx }
    const [ticks, setTicks] = useState(0);
    const [err, setErr] = useState("");
    useEffect(() => { if (open) { setView(plan ? "plan" : "setup"); setStep(1); setTab("week"); setDetail(null); } }, [open]); // eslint-disable-line
    if (!open) return null;
    const P = Object.assign({ shop: "", people: 1, cookDays: ["Sun", "Wed"], budget: 60, moods: [], appliances: [], diet: "None", allergies: "" }, prefs || {});
    const upd = (patch) => setPrefs({ ...P, ...patch });
    const toggle = (key, v, max) => { const cur = P[key] || []; if (cur.includes(v)) upd({ [key]: cur.filter((x) => x !== v) }); else if (!max || cur.length < max) upd({ [key]: [...cur, v] }); };

    const build = async () => {
      setView("building"); setTicks(0); setErr("");
      const t0 = Date.now();
      const tick = setInterval(() => setTicks((t) => Math.min(3, t + 1)), 750);
      let out = null;
      try { out = await generate(P); } catch (e) { out = null; setErr(String(e && e.message || "")); }
      if (!out) out = MI.buildWeekLocal(P);
      const wait = Math.max(0, 2600 - (Date.now() - t0));
      setTimeout(() => { clearInterval(tick); setTicks(3); setPlan(out); setView("plan"); setTab("week"); MI.track && MI.track("week_planned", { source: out.source, shop: P.shop }); }, wait);
    };
    const canNext = step === 1 ? !!P.shop : step === 3 ? (P.cookDays || []).length > 0 : true;
    const next = () => { if (!canNext) return; if (step < 7) setStep(step + 1); else build(); };

    const Setup = () => {
      const titles = ["Choose your shop", "How many are you cooking for?", "Which days will you cook?", "Weekly budget", "What are you in the mood for?", "What appliances do you have?", "Any dietary needs?"];
      const subs = ["We'll plan your weekly shop around it.", "Portions and the grocery list scale to this.", "Two prep sessions cover a week. Pick the days you'll actually be in the kitchen.", "What you want to spend on food this week.", "Pick up to three. The big meals follow this.", "Tap what you've got. Meals only use what you have.", "Nothing off limits unless you say so."];
      return (
        <>
          <p className={eyebrow}>Plan my week · {step} of 7</p>
          <h2 className="dp mt-1 text-[32px] uppercase leading-[0.95] text-[#F2EFE8]">{titles[step - 1]}</h2>
          <p className="mt-2 text-sm text-neutral-400">{subs[step - 1]}</p>
          <div className="mt-5 flex-1">
            {step === 1 && <div className="grid grid-cols-2 gap-2">{SHOPS.map((s) => <Big key={s} on={P.shop === s} ariaPressed={P.shop === s} onClick={() => upd({ shop: s })} className="py-6"><span className="dp text-xl uppercase text-[#F2EFE8]">{s}</span></Big>)}</div>}
            {step === 2 && (
              <div className={card + " flex items-center justify-between p-5"}>
                <button onClick={() => upd({ people: Math.max(1, P.people - 1) })} className="dp h-14 w-14 rounded-lg border border-neutral-700 text-2xl text-neutral-200" aria-label="Fewer people">−</button>
                <div className="text-center"><p className="dp text-[64px] leading-none text-[#F2EFE8]">{P.people}</p><p className="mono mt-1 text-[10px] uppercase tracking-widest text-neutral-500">{P.people === 1 ? "just you" : "people"}</p></div>
                <button onClick={() => upd({ people: Math.min(8, P.people + 1) })} className="dp h-14 w-14 rounded-lg border border-neutral-700 text-2xl text-neutral-200" aria-label="More people">+</button>
              </div>
            )}
            {step === 3 && <div className="grid grid-cols-4 gap-2">{DAYS.map((d) => <Big key={d} on={P.cookDays.includes(d)} ariaPressed={P.cookDays.includes(d)} onClick={() => toggle("cookDays", d)} className="py-5 text-center"><span className="dp text-lg uppercase text-[#F2EFE8]">{d}</span></Big>)}</div>}
            {step === 4 && (
              <div className={card + " p-5"}>
                <p className="dp text-[64px] leading-none text-[#F2EFE8]">£{P.budget}</p>
                <p className="mono mt-1 text-[10px] uppercase tracking-widest text-neutral-500">this week · about £{Math.round(P.budget / 7)} a day</p>
                <input type="range" min="20" max="200" step="5" value={P.budget} onChange={(e) => upd({ budget: Number(e.target.value) })} className="mt-5 w-full accent-[#FF2B2B]" aria-label="Weekly budget" />
                <div className="mono mt-1 flex justify-between text-[9px] text-neutral-600"><span>£20</span><span>£200</span></div>
              </div>
            )}
            {step === 5 && <div className="grid grid-cols-2 gap-2">{MOODS.map((m) => <Big key={m} on={P.moods.includes(m)} ariaPressed={P.moods.includes(m)} onClick={() => toggle("moods", m, 3)} className="py-5"><span className="dp text-base uppercase text-[#F2EFE8]">{m}</span></Big>)}</div>}
            {step === 6 && <div className="grid grid-cols-2 gap-2">{APPLIANCES.map((a) => <Big key={a} on={P.appliances.includes(a)} ariaPressed={P.appliances.includes(a)} onClick={() => toggle("appliances", a)} className="py-5"><span className="dp text-base uppercase text-[#F2EFE8]">{a}</span></Big>)}</div>}
            {step === 7 && (
              <div>
                <div className="grid grid-cols-2 gap-2">{DIETS.map((d) => <Big key={d} on={P.diet === d} ariaPressed={P.diet === d} onClick={() => upd({ diet: d })} className="py-5"><span className="dp text-base uppercase text-[#F2EFE8]">{d}</span></Big>)}</div>
                <input value={P.allergies} onChange={(e) => upd({ allergies: e.target.value })} placeholder="Allergies or foods to avoid — e.g. nuts, shellfish" className="mt-3 w-full rounded-lg border border-neutral-800 bg-[#0d0d0d] px-3.5 py-3 text-sm placeholder-neutral-600" aria-label="Allergies" />
              </div>
            )}
          </div>
          <button onClick={next} disabled={!canNext} className={cta + " mt-5 w-full py-4 text-base disabled:opacity-40"}>{step === 7 ? "Build my week" : "Continue"}</button>
        </>
      );
    };

    const Building = () => (
      <div className="flex flex-1 flex-col justify-center" data-building="1">
        <p className={eyebrow}>Plan my week</p>
        <h2 className="dp mt-1 text-[36px] uppercase leading-[0.95] text-[#F2EFE8]">Building your <span className="text-[#FF2B2B]">week…</span></h2>
        <div className="mt-6 space-y-3">
          {["Matching meals to your shop + budget", "Lining up your big meals", "Putting together your grocery list"].map((l, i) => (
            <div key={l} className={"flex items-center gap-3 transition-opacity " + (ticks > i ? "opacity-100" : "opacity-40")}>
              <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border " + (ticks > i ? "border-[#FF2B2B] bg-[#FF2B2B] text-white" : "border-neutral-700")}>{ticks > i ? <MI.Ic d={MI.PATHS.CHECK} className="h-3.5 w-3.5" /> : <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-600" />}</span>
              <p className="text-sm text-neutral-200">{l}</p>
            </div>
          ))}
        </div>
      </div>
    );

    const mealAt = (d) => (d ? (d.kind === "big" ? plan.days[d.dayIdx].big : d.kind === "bf" ? plan.days[d.dayIdx].breakfast : plan.days[d.dayIdx].snacks[d.snackIdx]) : null);
    const setNote = (id, text) => setPlan({ ...plan, notes: { ...(plan.notes || {}), [id]: text } });
    const swap = (d) => {
      const day = plan.days[d.dayIdx];
      const inWeek = plan.days.map((x) => x.big && x.big.id);
      const cands = MI.weekCandidates(plan.prefs || P).filter((c) => !inWeek.includes(c.id));
      const nxt = cands[0] || MI.weekCandidates(plan.prefs || P).find((c) => c.id !== day.big.id);
      if (!nxt) return;
      const days = plan.days.map((x, i) => (i === d.dayIdx ? { ...x, cook: true, big: { ...clone(nxt), cookedOn: x.key, tag: (nxt.tags || []).find((t) => (plan.prefs || P).moods.includes(t)) || (nxt.tags || [])[0] } } : x));
      for (let j = d.dayIdx + 1; j < days.length && !days[j].cook; j++) days[j] = { ...days[j], big: { ...clone(nxt), leftover: true, tag: "Leftovers", time: 5 } };
      const np = { ...plan, days }; np.grocery = MI.groceryFor(np); setPlan(np);
    };
    const tickItem = (k) => setPlan({ ...plan, ticks: { ...(plan.ticks || {}), [k]: !(plan.ticks || {})[k] } });

    const Plan = () => {
      const cost = MI.weekCost(plan);
      return (
        <>
          <div className="flex items-end justify-between gap-2">
            <div><p className={eyebrow}>Plan my week · {plan.prefs.shop || "your shop"}</p><h2 className="dp mt-1 text-[32px] uppercase leading-[0.95] text-[#F2EFE8]">Your week</h2></div>
            <button onClick={() => { setView("setup"); setStep(1); }} className="mono mb-1 text-[10px] uppercase tracking-widest text-neutral-500">Redo setup</button>
          </div>
          <p className="mono mt-1 text-[10px] text-neutral-500">One big meal a day, a quick breakfast, a snack or two · about £{Math.round(cost)} of your £{plan.prefs.budget} · {plan.source === "coach" ? "built by the coach" : "from Max's library"}</p>
          <div className="mt-3 flex rounded-lg border border-neutral-800 p-0.5" role="tablist">
            {[["week", "Week"], ["grocery", "Grocery list"]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={"dp flex-1 rounded-md py-2 text-xs uppercase tracking-wide " + (tab === k ? "bg-[#FF2B2B] text-white" : "text-neutral-400")}>{l}</button>)}
          </div>
          {tab === "week" && (
            <div className="mt-3 space-y-2" data-week-days="1">
              {plan.days.map((d, i) => (
                <div key={d.key} className={card + " overflow-hidden"} data-day={d.key}>
                  <button onClick={() => setDetail({ dayIdx: i, kind: "big" })} className="flex w-full items-stretch gap-3 p-3 text-left">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#0d0d0d]">
                      <MI.Plate plate="torso" opacity={0.28} position="center 30%" size="auto 160%" />
                      <MI.Ic d={MI.PATHS.STAR} fill className="absolute left-1.5 top-1.5 h-4 w-4 text-[#FF2B2B]" />
                      <span className="mono absolute bottom-1.5 left-1.5 text-[9px] uppercase tracking-wider text-neutral-400">{d.key}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5"><span className="mono rounded bg-[#1c0808] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#FF2B2B]">{d.big.tag}</span>{d.cook && <span className="mono text-[9px] uppercase tracking-wider text-neutral-500">cook day</span>}</div>
                      <p className="dp mt-1 text-[18px] uppercase leading-none text-[#F2EFE8]">{d.big.name}</p>
                      <p className="mono mt-1 text-[10px] text-neutral-500">{d.big.time} min · serves {d.big.serves} · £{d.big.cost.toFixed(2)}/serve · {d.big.kcal} kcal</p>
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-1.5 border-t border-neutral-800 px-3 py-2">
                    <button onClick={() => setDetail({ dayIdx: i, kind: "bf" })} className="mono rounded-md border border-neutral-800 px-2 py-1 text-[10px] text-neutral-300">Breakfast · {d.breakfast.name}</button>
                    {d.snacks.map((s, si) => <button key={si} onClick={() => setDetail({ dayIdx: i, kind: "sn", snackIdx: si })} className="mono rounded-md border border-neutral-800 px-2 py-1 text-[10px] text-neutral-400">Snack · {s.name}</button>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "grocery" && (
            <div className="mt-3 space-y-3" data-grocery="1">
              <p className="mono text-[10px] text-neutral-500">{plan.grocery.reduce((t, a) => t + a.items.length, 0)} items · by aisle at {plan.prefs.shop || "your shop"} · for {plan.prefs.people}</p>
              {plan.grocery.map((a) => (
                <div key={a.aisle} className={card + " p-3"}>
                  <p className="dp text-sm uppercase text-neutral-200">{a.aisle}</p>
                  <ul className="mt-1.5 space-y-1">
                    {a.items.map((it) => { const k = a.aisle + "|" + it.name; const on = !!(plan.ticks || {})[k]; return (
                      <li key={it.name}><button onClick={() => tickItem(k)} className="flex w-full items-center gap-2.5 py-1 text-left" aria-pressed={on}>
                        <span className={"flex h-5 w-5 shrink-0 items-center justify-center rounded border " + (on ? "border-[#FF2B2B] bg-[#FF2B2B] text-white" : "border-neutral-700")}>{on && <MI.Ic d={MI.PATHS.CHECK} className="h-3 w-3" />}</span>
                        <span className={"flex-1 text-sm " + (on ? "text-neutral-600 line-through" : "text-neutral-200")}>{it.name}</span>
                        <span className="mono text-[10px] text-neutral-500">{it.qty}</span>
                      </button></li>); })}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <button onClick={onMore} className="mono mt-5 w-full py-2 text-[10px] uppercase tracking-widest text-neutral-500">Numbers, timing & foods →</button>
        </>
      );
    };

    const m = mealAt(detail);
    const people = Math.max(1, Number(plan && plan.prefs.people) || 1);
    const mult = m ? (detail.kind === "big" ? people / Math.max(1, m.serves) : people) : 1;
    return (
      <div className="fixed inset-0 z-[86] flex flex-col overflow-y-auto bg-[#050505] px-5 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }} data-plan-week="1">
        <div className="flex items-center justify-between">
          {view === "setup" ? <button onClick={() => (step > 1 ? setStep(step - 1) : onClose())} className="mono py-2 text-xs text-neutral-500" aria-label="Back">‹ Back</button> : <span />}
          <button onClick={onClose} className="mono py-2 text-xs text-neutral-500" aria-label="Close plan">Close</button>
        </div>
        {view === "setup" && <div className="mb-4"><Bar n={step} of={7} /></div>}
        <div className="flex flex-1 flex-col">
          {view === "setup" && <Setup />}
          {view === "building" && <Building />}
          {view === "plan" && plan && <Plan />}
          {err && view === "plan" && <p className="mono mt-2 text-[9px] text-neutral-600">Coach unavailable, so this week came from Max's library.</p>}
        </div>

        <MI.Sheet open={!!m} onClose={() => setDetail(null)} title={m ? m.name : ""} z={87}>
          {m && (
            <div data-meal-detail="1">
              <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                {[[m.kcal, "kcal"], [m.time + " min", "time"], [people, "serves"], ["£" + (m.cost * people).toFixed(2), "cost"]].map(([v, l]) => <div key={l} className={card + " py-2"}><p className="dp text-lg leading-none text-[#F2EFE8]">{v}</p><p className="mono mt-1 text-[9px] uppercase tracking-widest text-neutral-500">{l}</p></div>)}
              </div>
              <p className="mono mt-2 text-[10px] text-neutral-400">Carbs {m.carbs} g · Protein {m.protein} g · Fat {m.fat} g{detail.kind === "big" && m.leftover ? " · leftovers, cooked " + (m.cookedOn || "earlier") : ""}</p>
              <p className={eyebrow + " mt-4"}>Ingredients</p>
              <ul className="mt-1.5 space-y-1">{m.ingredients.map((x, i) => <li key={i} className="flex justify-between text-sm text-neutral-200"><span>{x.name}</span><span className="mono text-[11px] text-neutral-500">{x.qty ? Math.round(x.qty * mult * 10) / 10 : ""} {x.unit}</span></li>)}</ul>
              {m.steps && m.steps.length > 0 && <><p className={eyebrow + " mt-4"}>Instructions</p><ol className="mt-1.5 space-y-1.5">{m.steps.map((st, i) => <li key={i} className="flex gap-2.5 text-sm text-neutral-300"><span className="dp w-5 shrink-0 text-base text-[#FF2B2B]">{i + 1}</span><span>{st}</span></li>)}</ol></>}
              <p className={eyebrow + " mt-4"}>Your notes</p>
              <textarea value={(plan.notes || {})[m.id] || ""} onChange={(e) => setNote(m.id, e.target.value)} rows={2} placeholder="Swap the rice for potatoes, double the chilli…" className="mt-1.5 w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600" aria-label="Your notes" />
              <div className="mt-3 flex gap-2">
                <button onClick={() => { onLog && onLog({ name: m.name, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat, big: detail.kind === "big" }); setDetail(null); }} className={cta + " flex-1 py-3.5 text-sm"}>Log this meal</button>
                {detail.kind === "big" && <button onClick={() => { swap(detail); }} className={ghost + " flex-1 py-3.5 text-sm"}>Swap this meal</button>}
              </div>
            </div>
          )}
        </MI.Sheet>
      </div>
    );
  };
})(window.MI);
} catch (e) { showErr("mealplan: " + e.message); }
