// usage: node system/tools/qa-captions.mjs <film-dir>   -> out/qa-captions.json
// Samples the burned-in caption box every 1/12 s while a cue is active: inside safe zones? overlapping other on-screen texts? present?
// Pages must set window.__capBox (the template and captions.js do).
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const D = path.resolve(process.argv[2]); const F = JSON.parse(fs.readFileSync(path.join(D, 'film.json'), 'utf8'));
const LIB = process.env.LIB || path.join(process.env.HOME || process.env.USERPROFILE, 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const TL = JSON.parse(fs.readFileSync(path.join(D, 'timeline.json'), 'utf8')); const [W, H] = (F.size || '1920x1080').split('x').map(Number);
const SHORT = F.engine === '3d' || F.engine === 'short';   // 3D short-form engine: left 60, right margin 150 (action buttons), caption must end above 78% of the height
const SAFE = SHORT ? { top: 210, bottom: Math.round(H * .25), side: 60, right: 150 } : (H > W ? { top: 210, bottom: 270, side: 60 } : { top: 60, bottom: 110, side: 110 });
const { browser, page } = await openDemo(D, { w: W, h: H, q: '', warnings: true });
const res = { samples: 0, outsideSafe: [], overlaps: [], noBox: 0, perCue: [] };
for (const c of TL.cues) {
  let n = 0, mx = 0;
  for (let t = c.t0 + 0.3; t < c.t1 - 0.3; t += 1 / 12) {
    const r = await page.evaluate(t => { const tx = window.TEXTS(t); return { cap: window.__capBox, tx }; }, t);
    if (!r.cap) { res.noBox++; continue; } res.samples++; n++; const b = r.cap; mx = Math.max(mx, b.x1 - b.x0);
    if (b.x0 < SAFE.side - 4 || b.x1 > W - (SAFE.right || SAFE.side) + 4 || b.y1 > H - SAFE.bottom + 30 || b.y0 < SAFE.top) res.outsideSafe.push({ t: +t.toFixed(2), box: b });
    for (const x of r.tx) if (!x.pass && !String(x.id).startsWith('d') && x.x0 < b.x1 && x.x1 > b.x0 && x.y0 < b.y1 && x.y1 > b.y0) res.overlaps.push({ t: +t.toFixed(2), id: x.id, text: x.text });
  }
  res.perCue.push({ id: c.id, samples: n, widestPx: Math.round(mx) });
}
await browser.close(); closeServer();
fs.mkdirSync(path.join(D, 'out'), { recursive: true }); fs.writeFileSync(path.join(D, 'out/qa-captions.json'), JSON.stringify(res, null, 1));
console.log(JSON.stringify({ samples: res.samples, outsideSafe: res.outsideSafe.length, overlapsWithOtherText: res.overlaps.length, noBoxWhileCueActive: res.noBox, firstProblems: [...res.outsideSafe, ...res.overlaps].slice(0, 3) }));
