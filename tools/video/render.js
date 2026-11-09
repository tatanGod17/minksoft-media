// Uso: node render.js <carpeta_video> [--frames t1,t2,...]  (con --frames solo saca PNG de prueba)
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const dir = path.resolve(process.argv[2]);
const here = __dirname;
const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
for (const f of fs.readdirSync(path.join(here, 'assets'))) fs.copyFileSync(path.join(here, 'assets', f), path.join(dir, f));
tl.meta._cities = JSON.parse(fs.readFileSync(path.join(here, 'assets', 'worldmap_cities.json'), 'utf8'));
// íconos 3D de Microsoft Fluent Emoji (licencia MIT): nombres en snake_case, p. ej. "floppy_disk"
const names = new Set([...(tl.meta.floats || [])]);
for (const sc of tl.scenes) { if (sc.hero) names.add(sc.hero); for (const n of (sc.floats || [])) names.add(n); }
const cache = path.join(require('os').homedir(), '.cache', 'fluent'); fs.mkdirSync(cache, { recursive: true });
const { execFileSync } = require('child_process');
for (const n of names) {
  const f = path.join(cache, n + '.png');
  if (!fs.existsSync(f)) {
    const folder = (n.charAt(0).toUpperCase() + n.slice(1)).replace(/_/g, ' ');
    const url = `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURIComponent(folder)}/3D/${n}_3d.png`;
    try { execFileSync('curl', ['-sfL', '-m', '60', '-o', f, url]); }
    catch (e) { console.error(`ÍCONO NO ENCONTRADO: "${n}" (${url}). Revisa el nombre en github.com/microsoft/fluentui-emoji/tree/main/assets`); process.exit(3); }
  }
  fs.copyFileSync(f, path.join(dir, 'fl_' + n + '.png'));
}
let html = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
const extraCss = tl.meta.css ? `<style>${tl.meta.css}</style>` : '';
html = html.replace('<script>', `${extraCss}<script>window.VIDEO=${JSON.stringify(tl)};</script>\n<script>`);
fs.writeFileSync(path.join(dir, 'page.html'), html);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 2; });
  await p.goto('file://' + path.join(dir, 'page.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const fi = process.argv.indexOf('--frames');
  if (fi > 0) {
    for (const t of process.argv[fi + 1].split(',').map(Number)) {
      await p.evaluate(t => seek(t), t);
      await p.screenshot({ path: path.join(dir, `frame_${t}.png`) });
    }
    await b.close(); return;
  }
  const fps = tl.fps || 30, n = Math.ceil(tl.total * fps);
  const tmp = path.join(dir, 'video_noaudio.tmp.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => seek(t), i / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  fs.renameSync(tmp, path.join(dir, 'video_noaudio.mp4'));
  await b.close();
  console.log('OK video sin audio');
})();
