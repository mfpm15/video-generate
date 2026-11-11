import { safeArea } from './safeArea.js';
// Shared burned-in caption effects. Pure function of t. One effect per film (film.json "caption").
//   01 Karaoke Highlight   02 Word Pop   03 Kinetic Typography   04 Cinematic Fade & Slide   05 Impact   06 Elegant Minimal
// Animation is per WORD, never per letter (safe for Arabic joining). Set theme.rtl = true for right-to-left text.
// usage:  const box = drawCaption(g, t, { effect:'02', W, H, timeline: TL, theme });   // box = {x0,y0,x1,y1} or null
// Layout is derived from min(W,H) so the same code serves 1080x1920 and 1920x1080.
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => x * x * (3 - 2 * x);
const eo = x => 1 - Math.pow(1 - x, 3);
const backOut = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const mixHex = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const rgba = (hex, a) => { const p = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };

export const DEFAULT_THEME = { family: 'Inter, sans-serif', accent: '#B7F34A', text: '#F2F4F8', dim: '#7A8194', panel: 'rgba(12,14,19,0.82)', rtl: false };
export const EFFECTS = { '01': 'Karaoke Highlight', '02': 'Word Pop', '03': 'Kinetic Typography', '04': 'Cinematic Fade & Slide', '05': 'Impact Captions', '06': 'Elegant Minimal' };

// safe zones (px) the caption must stay inside; portrait leaves room for platform UI at the bottom
export function safeZone(W, H, override) { const r = safeArea(W, H, override); return { top: r.y0, bottom: H-r.y1, side: r.x0, right: W-r.x1 }; }

const PROFILE = {   // size (x unit), weight, max line width (fraction of W), uppercase, letter-spacing px
  '01': { k: 0.044, wt: 600, mw: 0.78, up: false, ls: 0 }, '02': { k: 0.058, wt: 800, mw: 0.82, up: false, ls: 0 },
  '03': { k: 0.064, wt: 800, mw: 0.84, up: false, ls: 0, gap: 0.12 }, '04': { k: 0.040, wt: 400, mw: 0.74, up: false, ls: 1.5 },
  '05': { k: 0.074, wt: 900, mw: 0.86, up: true, ls: 0 }, '06': { k: 0.034, wt: 300, mw: 0.66, up: false, ls: 2 },
};

function layout(g, v, P, th, W, H, maxW) {
  const unit = Math.min(W, H), px = Math.round(unit * P.k), lh = Math.round(px * 1.32);
  g.font = `${P.wt} ${px}px ${th.family}`; g.letterSpacing = P.ls + 'px'; g.direction = th.rtl ? 'rtl' : 'ltr';
  const sp = g.measureText(' ').width + P.ls + (P.gap || 0) * px;
  const ws = v.words.map(w => { const s = P.up ? w.w.toUpperCase() : w.w; return { ...w, s, wd: g.measureText(s).width }; });
  const rows = [[]]; let rw = 0;
  ws.forEach(w => { if (rw + w.wd > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(w); rw += w.wd + sp; });
  const rowW = rows.map(r => r.reduce((s, w) => s + w.wd, 0) + sp * (r.length - 1));
  return { px, lh, sp, rows, rowW, wd: Math.max(...rowW), ht: rows.length * lh };
}

export function drawCaption(g, t, o) {
  const { effect = '01', W, H, timeline: TL } = o, th = { ...DEFAULT_THEME, ...(o.theme || {}) };
  const cue = TL.cues.find(c => t >= c.t0 && t < c.t1); if (!cue) return null;
  const v = [...(TL.voice || []), ...(TL.visual_words || [])].find(x => x.id === cue.id); if (!v) return null;
  const P = PROFILE[effect] || PROFILE['01'], S = safeZone(W, H, o.safeZone), maxW = Math.min(W * P.mw, W - S.side - S.right - (effect === '01' ? 160 : 40));   // 01 adds 150 px of pill padding around the text
  const aIn = clamp((t - cue.t0) / 0.16), aOut = clamp((cue.t1 - t) / 0.18), a = aIn * aOut;
  g.save(); g.textBaseline = 'middle'; g.textAlign = 'center';
  const L = layout(g, v, P, th, W, H, maxW);
  const anchorY = H - S.bottom - 40;                         // bottom of the caption block
  const baseY = effect === '03' && H > W ? anchorY - 90 : anchorY;
  const top = baseY - L.ht, cx = (S.side + W - S.right) / 2;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const grow = (a0, b0, a1, b1) => { x0 = Math.min(x0, a0); y0 = Math.min(y0, b0); x1 = Math.max(x1, a1); y1 = Math.max(y1, b1); };
  const font = (wt = P.wt, px = L.px) => `${wt} ${px}px ${th.family}`;
  const place = (ri, k, r) => { const dir = th.rtl ? -1 : 1; let x = th.rtl ? cx + L.rowW[ri] / 2 : cx - L.rowW[ri] / 2; for (let j = 0; j < k; j++) x += dir * (r[j].wd + L.sp); return th.rtl ? x - r[k].wd / 2 : x + r[k].wd / 2; };
  const each = fn => L.rows.forEach((r, ri) => r.forEach((w, k) => fn(w, place(ri, k, r), top + ri * L.lh + L.lh / 2, ri)));
  g.letterSpacing = P.ls + 'px'; g.direction = th.rtl ? 'rtl' : 'ltr';

  if (effect === '01') {                                       // pill + karaoke: dim -> accent while spoken -> bright
    const bw = L.wd + 150, bh = L.ht + 56, bx = cx - bw / 2, by = baseY - bh + 28 + (1 - eo(a)) * 14, rad = Math.min(bh / 2, 58);
    g.globalAlpha = eo(a); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 40; g.shadowOffsetY = 10; g.fillStyle = th.panel;
    g.beginPath(); g.roundRect(bx, by, bw, bh, rad); g.fill(); g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 1; g.beginPath(); g.roundRect(bx + .5, by + .5, bw - 1, bh - 1, rad); g.stroke();
    const speaking = t >= v.t0 && t < v.t1 + 0.05; g.fillStyle = speaking ? th.accent : th.dim; g.shadowColor = speaking ? rgba(th.accent, .8) : 'transparent'; g.shadowBlur = 10;
    g.beginPath(); g.arc(th.rtl ? bx + bw - 44 : bx + 44, by + bh / 2, 8, 0, 6.2832); g.fill(); g.shadowColor = 'transparent';
    const shift = th.rtl ? -28 : 28, ty = by + 28 - top;
    each((w, x, y) => { const st = t < w.t0 ? 0 : t < w.t1 ? 1 : 2, k = ss(seg(t, w.t0 - .03, w.t0 + .07)), act = st === 1;
      g.fillStyle = st === 0 ? th.dim : st === 2 ? th.text : mixHex(th.dim, th.accent, k); if (act) { g.shadowColor = rgba(th.accent, .45); g.shadowBlur = 16; }
      const sc = act ? 1 + .05 * Math.sin(Math.PI * clamp((t - w.t0) / Math.max(.12, w.t1 - w.t0))) : 1;
      g.save(); g.translate(x + shift, y + ty); g.scale(sc, sc); g.font = font(); g.fillText(w.s, 0, 0); g.restore(); g.shadowColor = 'transparent'; });
    grow(bx, by, bx + bw, by + bh);
  } else if (effect === '02') {                                // each word pops in (back-ease) and stays until the cue ends
    g.globalAlpha = aOut; g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = 18; g.shadowOffsetY = 4; g.lineJoin = 'round';
    each((w, x, y) => { const p = seg(t, w.t0 - .02, w.t0 + .22); if (p <= 0) return; const sc = .55 + .45 * backOut(p), act = t >= w.t0 && t < w.t1;
      g.save(); g.translate(x, y - (1 - eo(p)) * 10); g.scale(sc, sc); g.globalAlpha = aOut * clamp(p * 3); g.font = font(); g.lineWidth = L.px * .16; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(w.s, 0, 0);
      g.fillStyle = act ? th.accent : th.text; g.fillText(w.s, 0, 0); g.restore(); grow(x - w.wd / 2, y - L.lh / 2, x + w.wd / 2, y + L.lh / 2); });
  } else if (effect === '03') {                                // big words slide in from alternating sides with a slight rotation; the spoken word grows
    g.globalAlpha = aOut; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 22; let n = 0;
    each((w, x, y) => { const i = n++, p = seg(t, w.t0 - .05, w.t0 + .28); if (p <= 0) return; const e = eo(p), dir = i % 2 ? 1 : -1, act = t >= w.t0 && t < w.t1;
      g.save(); g.translate(x, y + dir * (1 - e) * 46); g.rotate(dir * (1 - e) * .08); const sc = act ? 1.05 : 1; g.scale(sc, sc); g.globalAlpha = aOut * clamp(p * 2.5);
      g.font = font(); g.fillStyle = act ? th.accent : th.text; g.fillText(w.s, 0, 0); g.restore(); grow(x - w.wd / 2 - 8, y - L.lh / 2, x + w.wd / 2 + 8, y + L.lh / 2); });
  } else if (effect === '04') {                                // whole line fades and drifts up; soft scrim, wide tracking
    const sl = (1 - eo(aIn)) * 26 - (1 - aOut) * 18, gy0 = top - 160, gr = g.createLinearGradient(0, gy0, 0, H);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${0.55 * a})`); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, gy0, W, H - gy0);
    g.globalAlpha = a; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14;
    each((w, x, y) => { g.font = font(); g.fillStyle = th.text; g.fillText(w.s, x, y + sl); grow(x - w.wd / 2, y + sl - L.lh / 2, x + w.wd / 2, y + sl + L.lh / 2); });
  } else if (effect === '05') {                                // UPPERCASE slam: each word drops from large scale; shake decays; last word in accent
    g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 24; g.lineJoin = 'round'; const last = v.words.length - 1; let n = 0;
    each((w, x, y) => { const i = n++, p = seg(t, w.t0 - .02, w.t0 + .16); if (p <= 0) return; const sc = 1 + .55 * (1 - eo(p)), dk = Math.exp(-(t - w.t0) * 16), sh = t >= w.t0 ? Math.sin((t - w.t0) * 90) * 5 * dk : 0;
      g.save(); g.globalAlpha = aOut * clamp(p * 4); g.translate(x + sh, y + sh * .6); g.scale(sc, sc); g.font = font(); g.lineWidth = L.px * .14; g.strokeStyle = 'rgba(0,0,0,.9)'; g.strokeText(w.s, 0, 0);
      g.fillStyle = i === last ? th.accent : th.text; g.fillText(w.s, 0, 0); g.restore(); grow(x - w.wd / 2 - 6, y - L.lh / 2, x + w.wd / 2 + 6, y + L.lh / 2); });
  } else {                                                     // 06: small, light, quiet; one hairline above; fade only
    g.globalAlpha = a; g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 10; g.fillStyle = th.text;
    each((w, x, y) => { g.font = font(); g.fillText(w.s, x, y); grow(x - w.wd / 2, y - L.lh / 2, x + w.wd / 2, y + L.lh / 2); });
    g.shadowColor = 'transparent'; g.fillStyle = rgba(th.text, .5 * a); const lw = Math.min(L.wd * .25, 120); g.fillRect(cx - lw / 2, top - 20, lw, 1.5); grow(cx - lw / 2, top - 22, cx + lw / 2, top - 18);
  }
  g.restore();
  return x0 > x1 ? null : { x0, y0, x1, y1 };
}
