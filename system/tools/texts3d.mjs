// usage: node system/tools/texts3d.mjs <film-dir> t1 t2 ...   prints the projected screen box of every text at those times (debug for readcheck / safe zones)
import path from 'path'; import fs from 'fs'; import { pathToFileURL } from 'url';
const D = path.resolve(process.argv[2]), ts = process.argv.slice(3).map(Number); const F = JSON.parse(fs.readFileSync(path.join(D, 'film.json'), 'utf8')); const [W, H] = F.size.split('x').map(Number);
const LIB = process.env.LIB || path.join(process.env.USERPROFILE || process.env.HOME, 'lemo-opuscar'); const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const { browser, page } = await openDemo(D, { w: W, h: H, q: '', warnings: true });
for (const t of ts) { const r = await page.evaluate(t => window.TEXTS(t), t); console.log('t=' + t); r.forEach(x => console.log('  ', String(x.id).padEnd(8), x.pass ? 'pass' : '    ', [x.x0, x.y0, x.x1, x.y1].map(v => Math.round(v)).join(','), (x.x0 < 0 || x.x1 > W || x.y0 < 0 || x.y1 > H) ? 'OUT-OF-FRAME' : '', JSON.stringify(x.text).slice(0, 40))); }
await browser.close(); closeServer();
