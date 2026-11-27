// Imagen fija (p. ej. post de Instagram 1080x1350) desde un HTML propio, con personajes y escenarios disponibles.
// Uso: node snap.js <pagina.html> <salida.png> [ancho=1080] [alto=1350]
// En la página puedes usar PERSONAJES.build(spec) / PERSONAJES.heroSvg(spec, w, h) y ESCENAS.build(nombre) (ver README).
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const [src, out, w = 1080, h = 1350] = process.argv.slice(2);
const here = __dirname; const dir = path.dirname(path.resolve(src));
for (const f of fs.readdirSync(path.join(here, 'assets'))) if (f.endsWith('.png')) fs.copyFileSync(path.join(here, 'assets', f), path.join(dir, f));
const libs = fs.readFileSync(path.join(here, 'scenes.js'), 'utf8') + '\n' + fs.readFileSync(path.join(here, 'characters.js'), 'utf8');
let html = fs.readFileSync(src, 'utf8'); html = html.replace(/<head>/i, () => `<head><script>${libs}</script>`);
const tmp = path.join(dir, '.snap.html'); fs.writeFileSync(tmp, html);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } }); p.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 2 });
  await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400); await p.screenshot({ path: out }); await b.close(); fs.unlinkSync(tmp); console.log('OK', out) })();
