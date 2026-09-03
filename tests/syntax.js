const Babel = require('@babel/standalone');
const fs = require('fs'); process.chdir(require('path').join(__dirname, '..'));
const files = ['app/ui.jsx','app/anatomy.jsx','app/funnel.jsx','app/recap.jsx','app/community.jsx','app/progress.jsx'];
let ok = true;
for (const f of files) {
  try { Babel.transform(fs.readFileSync(f,'utf8'), { presets: ['env','react'], filename: f }); console.log('OK  ', f); }
  catch (e) { ok = false; console.log('FAIL', f, e.message.split('\n')[0]); }
}
const html = fs.readFileSync('index.html','utf8');
const m = html.match(/<script type="text\/babel" data-presets="env,react">([\s\S]*?)<\/script>/);
try { Babel.transform(m[1], { presets: ['env','react'], filename: 'index.html' }); console.log('OK   index.html main script'); }
catch (e) { ok = false; console.log('FAIL index.html', e.message.split('\n').slice(0,3).join(' | ')); }
for (const f of ['mi-projection.js','mi-ai.js','rank-standards.js']) { try { new Function(fs.readFileSync(f,'utf8')); console.log('OK  ', f); } catch (e) { ok = false; console.log('FAIL', f, e.message); } }
process.exit(ok ? 0 : 1);
