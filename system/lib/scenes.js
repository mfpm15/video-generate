// Generic scene renderer ("template look"): palette/fonts from film.json, scenes from lines.json -> timeline.json "scenes".
// Pure function of t. For a fully style-faithful film, copy this file into the film and author scenes by hand (see system/README.md).
// scene types: title{head,sub} statement{head,sub} number{value,label,prefix,suffix} list{head,items[]} quote{head,by}   (*word* = emphasised word)
// any title/statement/quote scene may add  visual:{kind,...}  (see illus.js: network globe cable packets bars line steps neural icons ring orbit timeline compare)
// ?thumb=1 renders a title thumbnail instead of the film frame.
import { drawCaption } from './captions.js';
import { drawVisual, labelsOf, visualEvents } from './illus.js';
import { makeThumb } from './thumb.js';
const F = await (await fetch('film.json')).json(), TL = await (await fetch('timeline.json')).json();
const Q = new URLSearchParams(location.search), THUMB = Q.get('thumb') === '1';
const W = innerWidth, H = innerHeight, U = Math.min(W, H), cv = document.getElementById('c'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
const P = { bg1: '#0A0B0F', bg2: '#181B26', fg: '#F2F4F8', dim: '#8A91A3', accent: '#B7F34A', family: 'Inter, sans-serif', head: 'InterTight, Inter, sans-serif', pattern: 'grid', ...(F.palette || {}) };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), eo = x => 1 - Math.pow(1 - x, 3), ss = x => x * x * (3 - 2 * x);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const rgba = (hex, a) => { const p = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };
const portrait = H > W, ZT = portrait ? .13 * H : .09 * H, ZB = portrait ? .64 * H : .60 * H, CX = W / 2;   // content zone (captions live below it)
window.DUR = TL.dur; let texts = [];
const txt = (id, text, x0, y0, x1, y1, pass = false) => texts.push(pass ? { id, text, x0, y0, x1, y1, pass: true } : { id, text, x0, y0, x1, y1 });
const txtC = (id, text, cx, y0, y1) => { const w = g.measureText(text).width / 2; txt(id, text, cx - w, y0, cx + w, y1); };   // centred, MEASURED with the current font
const strip = s => s.replace(/\*/g, '');
function wrap(str, px, wt, fam, maxW) {                 // rows of [{s, em, wd}] with measured widths
  g.font = `${wt} ${px}px ${fam}`; const sp = g.measureText(' ').width, ws = str.split(' ').map(w => { const em = /^\*.*\*[.,!?]*$/.test(w); const s = w.replace(/\*/g, ''); return { s, em, wd: g.measureText(s).width }; });
  const rows = [[]]; let rw = 0; ws.forEach(w => { if (rw + w.wd > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(w); rw += w.wd + sp; });
  return { rows, sp, rw: rows.map(r => r.reduce((s, w) => s + w.wd, 0) + sp * (r.length - 1)) };
}
// ───────────── background: gradient, drifting glow, grid, particles, vignette ─────────────
function bg(t) {
  const gr = g.createLinearGradient(0, 0, W * .6, H); gr.addColorStop(0, P.bg2); gr.addColorStop(1, P.bg1); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) { const a = t * .05 + i * 1.7, x = W * (.5 + .45 * Math.sin(a * 1.1 + i)), y = H * (.45 + .4 * Math.cos(a * .9 + i * 2)); const rg = g.createRadialGradient(x, y, 0, x, y, U * .5); rg.addColorStop(0, rgba(P.accent, .13)); rg.addColorStop(1, rgba(P.accent, 0)); g.fillStyle = rg; g.fillRect(x - U * .5, y - U * .5, U, U); }
  if (P.pattern === 'grid') { g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 1; const m = 48, o = (t * 6) % m; g.beginPath(); for (let x = -o; x < W; x += m) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = 0; y < H; y += m) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); }
  for (let i = 0; i < 46; i++) { const sp = .006 + hash(i + 9) * .014, x = ((hash(i) + t * sp * (i % 2 ? 1 : -1)) % 1 + 1) % 1 * W, y = ((hash(i + 50) - t * sp * .7) % 1 + 1) % 1 * H, r = 1 + hash(i + 80) * 2.6, tw = .25 + .35 * Math.sin(t * (.6 + hash(i + 20)) + i); g.fillStyle = rgba(P.accent, Math.max(0, tw) * .5); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
  const vg = g.createRadialGradient(W / 2, H / 2, U * .4, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
const EV = [];            // events for the mixer: built once from the same schedule that drives the picture
// area = {cx, maxW}; reveals word by word, emphasised words get a spark burst; returns bottom y
function drawHead(id, str, px, wt, y, tl, col = P.fg, fam = P.head, area = { cx: CX, maxW: W * (portrait ? .84 : .74) }) {
  const L = wrap(str, px, wt, fam, area.maxW), lh = px * 1.18; let n = 0; const tot = L.rows.reduce((a, r) => a + r.length, 0), cx = area.cx;
  const dur = Math.min(1.2, .12 * tot + .3); g.textBaseline = 'middle'; g.textAlign = 'center'; let x0 = 1e9, x1 = 0;
  L.rows.forEach((r, ri) => { let x = cx - L.rw[ri] / 2; r.forEach(w => { const k = n++, st = .1 + dur * k / tot, p = seg(tl, st, st + .28), e = eo(p), yy = y + ri * lh + lh / 2;
    g.save(); g.globalAlpha *= e; g.font = `${wt} ${px}px ${fam}`; g.fillStyle = w.em ? P.accent : col; if (w.em) { g.shadowColor = rgba(P.accent, .55); g.shadowBlur = 24; }
    g.translate(x + w.wd / 2, yy + (1 - e) * 22); const sc = w.em ? 1 + .06 * Math.sin(Math.PI * clamp(p)) : 1; g.scale(sc, sc); g.fillText(w.s, 0, 0); g.restore();
    if (w.em) { const b = seg(tl, st + .1, st + .9); if (b > 0 && b < 1) { g.save(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832 + hash(i + k) * .5, d = (30 + hash(i + 3) * 50) * eo(b); g.fillStyle = rgba(P.accent, (1 - b) * .9); g.beginPath(); g.arc(x + w.wd / 2 + Math.cos(a) * (w.wd * .35 + d), yy + Math.sin(a) * (px * .35 + d * .6), 3 * (1 - b) + .5, 0, 6.2832); g.fill(); } g.restore(); }
      const ub = eo(seg(tl, st + .15, st + .6)); g.fillStyle = rgba(P.accent, .8 * e); g.fillRect(x, yy + px * .52, w.wd * ub, Math.max(3, px * .045)); }
    x0 = Math.min(x0, x); x1 = Math.max(x1, x + w.wd); x += w.wd + L.sp; }); });
  txt(id, strip(str), x0, y, x1, y + L.rows.length * lh); return y + L.rows.length * lh;
}
function drawSub(id, str, cx, y, maxW, px, alpha) {      // sub line, wrapped to the text area, reported to readcheck with MEASURED bounds
  g.save(); g.globalAlpha *= alpha; g.font = `500 ${px}px ${P.family}`; g.fillStyle = P.dim; g.textAlign = 'center'; g.textBaseline = 'middle'; const L = wrap(str, px, 500, P.family, maxW), lh = px * 1.3; g.font = `500 ${px}px ${P.family}`;
  L.rows.forEach((r, i) => g.fillText(r.map(w => w.s).join(' '), cx, y + i * lh)); g.restore(); const wd = Math.max(...L.rw) / 2; txt(id, str, cx - wd, y - lh / 2, cx + wd, y + (L.rows.length - .5) * lh);
}
function drawVis(S, v, box, tl) {
  g.save(); drawVisual(g, v, box, tl, P); g.restore(); labelsOf(v).forEach((l, i) => txt(S.id + 'vl' + i, l, box.x, box.y, box.x + box.w, box.y + box.h, true));
}
function drawScene(S, t, idx) {
  const s = S.scene || { type: 'statement', head: S.text }, tl = t - S.t0, aIn = ss(seg(tl, 0, .35)), aOut = 1 - ss(seg(t, S.t1 - .2, S.t1)), a = aIn * (idx === TL.scenes.length - 1 ? 1 : aOut);
  g.save(); g.globalAlpha = a; const zoom = 1 + .02 * clamp(tl / 6); g.translate(CX, H / 2); g.scale(zoom, zoom); g.translate(-CX, -H / 2); const mid = (ZT + ZB) / 2, vis = s.visual && ['statement', 'title', 'quote'].includes(s.type || 'statement');
  // split layout: text left / visual right (16:9), text top / visual below (9:16)
  const area = vis ? (portrait ? { cx: CX, maxW: W * .84 } : { cx: W * .285, maxW: W * .42 }) : undefined, box = vis ? (portrait ? { x: W * .05, y: H * .35, w: W * .90, h: H * .35 } : { x: W * .50, y: H * .09, w: W * .46, h: H * .56 }) : null;
  const ty = vis ? (portrait ? ZT + U * .02 : mid - U * .095) : null;
  if (vis) drawVis(S, s.visual, box, tl);
  if (s.type === 'title') {
    const px = vis ? U * (portrait ? .085 : .075) : U * (portrait ? .11 : .10), y = drawHead(S.id + 'h', s.head, px, 800, vis ? ty : mid - U * .16, tl, P.fg, P.head, area), cx = area ? area.cx : CX; const bw = 160 * eo(seg(tl, .5, 1.1)); g.fillStyle = P.accent; g.fillRect(cx - bw / 2, y + 26, bw, 6);
    if (s.sub) drawSub(S.id + 's', s.sub, cx, y + 80, area ? area.maxW : W * .7, U * .036, a * ss(seg(tl, .9, 1.4)));
  } else if (s.type === 'number') {
    const v = s.value, k = eo(seg(tl, .2, 1.6)), cur = Math.round(v * k), str = (s.prefix || '') + cur.toLocaleString('id-ID') + (s.suffix || '');
    const full = (s.prefix || '') + v.toLocaleString('id-ID') + (s.suffix || ''); let npx = U * (portrait ? .2 : .22);
    g.font = `800 ${npx}px ${P.head}`; const fw = g.measureText(full).width, maxNW = W * .84; if (fw > maxNW) npx *= maxNW / fw;      // fit the widest value inside the frame
    g.font = `800 ${npx}px ${P.head}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = P.accent; g.shadowColor = rgba(P.accent, .4); g.shadowBlur = 50; g.fillText(str, CX, mid - U * .04); g.shadowColor = 'transparent';
    const bw2 = Math.min(g.measureText(full).width, maxNW) / 2; txt(S.id + 'n', full, CX - bw2, mid - U * .04 - npx * .5, CX + bw2, mid - U * .04 + npx * .5);
    if (s.label) { g.globalAlpha = a * ss(seg(tl, .6, 1.1)); g.font = `500 ${U * .04}px ${P.family}`; g.fillStyle = P.fg; g.fillText(s.label, CX, mid + U * .16); txtC(S.id + 'l', s.label, CX, mid + U * .12, mid + U * .2); }
  } else if (s.type === 'list') {
    const y = drawHead(S.id + 'h', s.head || '', U * .075, 800, ZT + U * .02, tl), items = s.items || [], gap = U * .105;
    items.forEach((it, i) => { const p = seg(tl, .9 + i * .55, 1.25 + i * .55), e = eo(p), yy = y + U * .06 + i * gap; g.save(); g.globalAlpha = a * e; g.translate((1 - e) * -40, 0);
      g.fillStyle = P.accent; g.beginPath(); g.arc(CX - U * .36, yy + U * .03, 9, 0, 6.2832); g.fill(); g.font = `600 ${U * .05}px ${P.family}`; g.fillStyle = P.fg; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(it, CX - U * .32, yy + U * .03); const iw = g.measureText(it).width; g.restore(); txt(S.id + 'i' + i, it, CX - U * .36, yy, CX - U * .32 + iw, yy + U * .07); });
  } else if (s.type === 'quote') {
    const cx = area ? area.cx : CX, qy = vis ? (portrait ? ZT + U * .12 : mid - U * .1) : mid - U * .11;
    g.font = `800 ${U * .13}px ${P.head}`; g.fillStyle = rgba(P.accent, .67); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('“', cx, qy); const y = drawHead(S.id + 'h', s.head, U * (vis ? .055 : portrait ? .06 : .062), 600, qy + U * .03, tl, P.fg, P.head, area);
    if (s.by) { g.globalAlpha = a * ss(seg(tl, 1, 1.5)); g.font = `500 ${U * .034}px ${P.family}`; g.fillStyle = P.dim; g.textAlign = 'center'; g.fillText('— ' + s.by, cx, y + 50); txtC(S.id + 'b', '— ' + s.by, cx, y + 25, y + 75); }
  } else {
    const px = vis ? U * (portrait ? .075 : .07) : U * (portrait ? .082 : .088), y = drawHead(S.id + 'h', s.head || S.text, px, 800, vis ? ty : mid - U * (portrait ? .2 : .17), tl, P.fg, P.head, area), cx = area ? area.cx : CX;
    if (s.sub) drawSub(S.id + 's', s.sub, cx, y + 54, area ? area.maxW : W * .7, U * .037, a * ss(seg(tl, 1, 1.5)));
  }
  g.restore();
  // entrance light sweep (a soft diagonal band, first 0.7 s of every scene after the first)
  if (idx > 0) { const q = seg(tl, 0, .7); if (q > 0 && q < 1) { g.save(); const x = -W * .3 + (W * 1.6) * eo(q), gr = g.createLinearGradient(x - W * .15, 0, x + W * .15, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, rgba(P.accent, .10 * (1 - q))); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); } }
}
TL.scenes.forEach((S, i) => {   // events: open/close frame the film; one 'scene' per scene; emph for *words*; item for list rows; count ticks for numbers; visuals add vis/pop/ping
  S.text = TL.voice[i].text; const s = S.scene || {}; EV.push({ t: +(i === 0 ? .15 : S.t0 + .05).toFixed(3), type: i === 0 ? 'open' : 'scene' });
  (s.head || '').split(' ').forEach((w, k) => { if (/^\*.*\*/.test(w)) EV.push({ t: +(S.t0 + .2 + .12 * k).toFixed(3), type: 'emph', i: k }); });
  (s.items || []).forEach((_, k) => EV.push({ t: +(S.t0 + .9 + k * .55).toFixed(3), type: 'item', i: k }));
  if (s.type === 'number') for (let k = 0; k < 14; k++) EV.push({ t: +(S.t0 + .2 + 1.4 * Math.pow(k / 14, .7)).toFixed(3), type: 'count' });
  if (s.visual) visualEvents(s.visual, S.t0).forEach(e => EV.push(e));
});
EV.push({ t: +(TL.dur - 1.6).toFixed(3), type: 'close' }); EV.sort((a, b) => a.t - b.t); window.EV = EV;
const drawThumb = makeThumb({ g, W, H, U, P, F, TL, portrait, CX, bg, drawHead, wrap, drawVisual, rgba });   // thumbnails live in thumb.js
// series badge "BAGIAN n/N" (top-left, below the platform UI) and, in the last seconds, "Berikutnya: Bagian n+1 - title"
function drawSeries(t) {
  const S = F.series, a = ss(seg(t, .2, .7)), kp = Math.round(U * .03), padx = kp * .9, h = kp * 1.9, x = W * .06, y = portrait ? H * .078 : H * .025;
  const endShow = S.next && t > TL.dur - 3.6 && t < TL.dur - 0.6, label = endShow ? `Berikutnya: Bagian ${S.n + 1}${S.next ? ' — ' + S.next : ''}` : `BAGIAN ${S.n}/${S.total}`;
  g.save(); g.globalAlpha = a; g.font = `800 ${kp}px ${P.family}`; let lab = label; const maxW = W * .88 - padx * 2; while (g.measureText(lab).width > maxW && lab.length > 8) lab = lab.slice(0, -2).trimEnd() + '…';
  const w = g.measureText(lab).width + padx * 2; g.fillStyle = endShow ? rgba('#000000', .55) : P.accent; g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fill();
  if (endShow) { g.strokeStyle = P.accent; g.lineWidth = 2; g.stroke(); }
  g.fillStyle = endShow ? P.fg : '#0A0B0F'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(lab, x + padx, y + h / 2 + 1); g.restore();
  txt('series' + (endShow ? 'n' : 'b'), lab, x, y, x + w, y + h, true);
}
function render(t) {
  texts = []; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.shadowColor = 'transparent';
  if (THUMB) { drawThumb(+(Q.get('v') || (F.thumb && F.thumb.variant) || 1)); window.__capBox = null; return; }
  bg(t);
  const i = TL.scenes.findIndex(s => t >= s.t0 && t < s.t1); if (i >= 0) drawScene(TL.scenes[i], t, i);
  g.fillStyle = rgba(P.accent, .9); g.fillRect(0, 0, W * clamp(t / TL.dur), 4);                       // thin progress bar along the top edge
  if (F.series) drawSeries(t);
  window.__capBox = drawCaption(g, t, { effect: F.caption || '01', W, H, timeline: TL, theme: { family: P.family, accent: P.accent, text: P.fg, dim: P.dim, rtl: F.rtl } });
}
window.render = render; window.TEXTS = t => { render(t); return texts; };
await Promise.all(['300 40px Inter', '400 40px Inter', '500 40px Inter', '600 40px Inter', '800 40px Inter', '900 40px Inter', '800 100px InterTight'].map(f => document.fonts.load(f))); await document.fonts.ready;
window.READY = true;
