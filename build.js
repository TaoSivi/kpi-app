// node build.js → dist/index.html (GitHub Pages, ຝັງຟອນ Phetsarath OT) + dist/Code.gs (Apps Script)
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const join = files => files.map(f => `/* ===== ${f} ===== */\n` + src(f)).join('\n\n');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

const gs = join(['scoring.js', 'server.js', 'store-gas.js', 'gas-main.js']);
fs.writeFileSync(path.join(__dirname, 'dist', 'Code.gs'), gs, 'utf8');

const font = fs.readFileSync(path.join(__dirname, 'src', 'fonts', 'NotoSansLao-subset.woff2')).toString('base64');  // variable wght 400–800, SIL OFL
const css = `@font-face{font-family:"Noto Sans Lao";font-weight:400 800;font-display:block;src:url(data:font/woff2;base64,${font}) format("woff2")}\n` + src('styles.css');
const b64 = f => fs.readFileSync(path.join(__dirname, 'src', 'assets', f)).toString('base64');
const lh = `const LETTERHEAD = { top: 'data:image/jpeg;base64,${b64('lh-top.jpg')}', bot: 'data:image/jpeg;base64,${b64('lh-bot.jpg')}' };\n`;
const js = "'use strict';\n" + lh + join(['scoring.js', 'seed.js', 'server.js', 'store-demo.js', 'app.js']);
if (/<\/script/i.test(js)) throw new Error('JS ມີ </script> — ຕ້ອງ escape');
const html = src('index.html').replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');  // GitHub Pages serves the repo root
console.log('built dist/index.html', (html.length / 1024).toFixed(0) + ' KB; dist/Code.gs', (gs.length / 1024).toFixed(0) + ' KB');
