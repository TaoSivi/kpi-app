// node build.js → dist/index.html (GitHub Pages, ຝັງຟອນ Phetsarath OT) + dist/Code.gs (Apps Script)
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const join = files => files.map(f => `/* ===== ${f} ===== */\n` + src(f)).join('\n\n');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

const gs = join(['scoring.js', 'server.js', 'store-gas.js', 'gas-main.js']);
fs.writeFileSync(path.join(__dirname, 'dist', 'Code.gs'), gs, 'utf8');

const font = fs.readFileSync(path.join(__dirname, 'src', 'fonts', 'PhetsarathOT.ttf')).toString('base64');
const css = `@font-face{font-family:"Phetsarath OT";font-weight:400 700;font-display:block;src:url(data:font/ttf;base64,${font}) format("truetype")}\n` + src('styles.css');
const js = "'use strict';\n" + join(['scoring.js', 'seed.js', 'server.js', 'store-demo.js', 'app.js']);
if (/<\/script/i.test(js)) throw new Error('JS ມີ </script> — ຕ້ອງ escape');
const html = src('index.html').replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html, 'utf8');
console.log('built dist/index.html', (html.length / 1024).toFixed(0) + ' KB; dist/Code.gs', (gs.length / 1024).toFixed(0) + ' KB');
