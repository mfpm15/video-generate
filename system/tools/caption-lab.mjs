import { safeZone } from '../lib/captions.js';
// usage: node system/tools/caption-lab.mjs   -> tests every effect x {portrait,landscape} x {short,long line}: inside safe zone, not clipped, box present.
// Also writes stills to system/lab/captions/out/ for a human to look at. Exit 1 if any check fails.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { pathToFileURL, fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..'), LAB = path.join(ROOT, 'system/lab/captions');
const LIB = process.env.LIB || path.join(process.env.HOME || process.env.USERPROFILE, 'lemo-opuscar');
execFileSync('sh', [path.join(HERE, 'sync-lib.sh'), LAB]);
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const SAFE = safeZone;
const fails = [], rows = [];
for (const [W, H] of [[1080, 1920], [1920, 1080]]) for (const line of ['short', 'long']) for (const eff of ['01', '02', '03', '04', '05', '06']) {
  const { browser, page } = await openDemo(LAB, { w: W, h: H, q: `effect=${eff}&line=${line}`, warnings: true, gl: false }); const S = SAFE(W, H);
  const cue = await page.evaluate(() => ({...window.LAB_CUE, voiceStart: window.LAB_VOICE_START})); let n = 0, bad = 0, maxW = 0;
  for (let t = Math.max(cue.t0 + .05, cue.voiceStart); t < cue.t1 - .05; t += 1 / 12) {
    const b = await page.evaluate(t => { window.render(t); return window.__capBox; }, t); n++;
    if (!b) { bad++; fails.push(`${eff} ${W}x${H} ${line} active caption missing at ${t.toFixed(2)}`); continue; }
    maxW = Math.max(maxW, b.x1 - b.x0);
    if (b.x0 < S.side || b.x1 > W - S.right || b.y0 < S.top || b.y1 > H - S.bottom + 4) { bad++; if (bad < 3) fails.push(`${eff} ${W}x${H} ${line} t=${t.toFixed(2)} box=${JSON.stringify(b)}`); }
  }
  rows.push(`effect ${eff} ${W}x${H} ${line}: samples ${n}, outside/none ${bad}, widest ${Math.round(maxW)}px`);
  if (line === 'long') { await page.evaluate(() => window.render(2.2)); fs.mkdirSync(path.join(LAB, 'out'), { recursive: true }); await page.screenshot({ path: path.join(LAB, 'out', `cap-${eff}-${W}x${H}.jpg`), type: 'jpeg', quality: 85 }); }
  await browser.close();
}
closeServer(); console.log(rows.join('\n')); if (fails.length) { console.log('FAIL\n' + fails.join('\n')); process.exit(1); } console.log('ALL OK (' + rows.length + ' combos)');
