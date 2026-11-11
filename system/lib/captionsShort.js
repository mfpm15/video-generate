import { safeArea } from './safeArea.js';
// Short-form captions (9:16): CHUNKED (2-4 words at a time), big and heavy, with a stroke so they read on any background; the word being spoken is highlighted.
// Effects: pop (bouncy, accent word) | impact (UPPERCASE, highlighter box on the spoken word) | kinetic (words build up and slide in as spoken) | karaoke (dark pill, accent word)
// Placed inside the common safe area of Shorts / Reels / TikTok: left margin 60, right margin 150 (action buttons), caption centre ~63% of the height (above the bottom UI).
// drawShortCaption(g, t, { effect, W, H, timeline, theme }) -> {x0,y0,x1,y1} | null
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3), back = x => { const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const CAPTION_ALIASES = { '01': 'karaoke', '02': 'pop', '03': 'kinetic', '04': 'pop', '05': 'impact', '06': 'pop' };
export const SHORT_EFFECTS = ['pop', 'impact', 'kinetic', 'karaoke'];
// bottom = lowest y a caption may reach: TikTok's UI covers roughly the lowest 25 % (the strictest of the three platforms)
export function shortSafe(W, H, override) { const r = safeArea(W, H, override); return {left: r.x0, right: r.x1, top: r.y0, bottom: r.y1}; }

const cache = new WeakMap();
function chunksOf(TL) {                                    // 2-4 word chunks per spoken line, split after punctuation
  if (cache.has(TL)) return cache.get(TL); const out = [];
  [...(TL.voice || []), ...(TL.visual_words || [])].forEach(v => { let cur = []; const flush = () => { if (cur.length) { out.push({ id: v.id, words: cur, t0: cur[0].t0, t1: cur[cur.length - 1].t1 }); cur = []; } };
    v.words.forEach((w, i) => { cur.push(w); const punct = /[.,!?:;]$/.test(w.w), chars = cur.reduce((s, x) => s + x.w.length + 1, 0); if (chars >= 19 || cur.length >= 3 || (punct && cur.length >= 2) || (i + 1 < v.words.length && cur.length >= 3 && v.words[i + 1].w.length > 9)) flush(); }); flush(); });
  out.forEach((c, i) => { const nx = out[i + 1]; c.s = c.t0 - .05; c.e = nx && nx.id === c.id ? nx.t0 - .02 : c.t1 + .35; if (nx && nx.id !== c.id) c.e = Math.min(c.e, nx.t0 - .05); });
  cache.set(TL, out); return out;
}
export function drawShortCaption(g, t, o) {
  const { W, H, timeline: TL } = o, th = { accent: '#B7F34A', text: '#ffffff', family: 'Inter, sans-serif', ...(o.theme || {}) }, eff = SHORT_EFFECTS.includes(o.effect) ? o.effect : (CAPTION_ALIASES[o.effect] || 'pop');
  const ch = chunksOf(TL).find(c => t >= c.s && t < c.e); if (!ch) return null;
  const S = shortSafe(W, H, o.safeZone), maxW = S.right - S.left - (eff === 'karaoke' ? 100 : 40), cx = (S.left + S.right) / 2, up = eff === 'impact', px = Math.round(W * (up ? .088 : .082)), lh = px * 1.16;
  g.save(); g.textBaseline = 'middle'; g.textAlign = 'center'; g.lineJoin = 'round'; g.font = `900 ${px}px ${th.family}`;
  const words = ch.words.map(w => ({ ...w, s: up ? w.w.toUpperCase() : w.w })), sp = g.measureText(' ').width * 1.35; words.forEach(w => w.wd = g.measureText(w.s).width);
  const rows = [[]]; let rw = 0; words.forEach(w => { if (rw + w.wd > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(w); rw += w.wd + sp; });
  const rowW = rows.map(r => r.reduce((s, w) => s + w.wd, 0) + sp * (r.length - 1)), tot = rows.length * lh, bottomEdge = S.bottom - 24, cy = bottomEdge - tot / 2, top = cy - tot / 2;   // block bottom pinned just above the danger zone
  const age = t - ch.s, pop = back(clamp(age / .18)), fadeOut = clamp((ch.e - t) / .08), tilt = ((ch.t0 * 7) % 2 - 1) * .018;
  g.translate(cx, cy); g.rotate(tilt * (1 - eo(clamp(age / .2)))); g.scale(.82 + .18 * pop, .82 + .18 * pop); g.translate(-cx, -cy); g.globalAlpha = clamp(age / .06) * fadeOut;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const grow = (a, b, c, d) => { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d); };
  if (eff === 'karaoke') { const bw = Math.min(maxW + 90, Math.max(...rowW) + 90), bh = tot + 40, bx = cx - bw / 2, by = top - 20; g.fillStyle = 'rgba(10,12,18,.78)'; g.beginPath(); g.roundRect(bx, by, bw, bh, 36); g.fill(); grow(bx, by, bx + bw, by + bh); }
  rows.forEach((r, ri) => { let x = cx - rowW[ri] / 2; const y = top + ri * lh + lh / 2;
    r.forEach(w => { const act = t >= w.t0 - .03 && t < w.t1 + .05, past = t >= w.t1 + .05, wx = x + w.wd / 2; let dy = 0, sc = 1, a = 1;
      if (eff === 'kinetic') { const p = seg(t, w.t0 - .1, w.t0 + .12); a = eo(p); dy = (1 - eo(p)) * 38; sc = .7 + .3 * back(p); }
      if (act) sc *= eff === 'impact' ? 1.0 : 1.07;
      g.save(); g.globalAlpha *= a; g.translate(wx, y + dy); g.scale(sc, sc); g.font = `900 ${px}px ${th.family}`;
      if (eff === 'impact' && act) { g.fillStyle = th.accent; g.beginPath(); g.roundRect(-w.wd / 2 - 14, -px * .56, w.wd + 28, px * 1.12, 18); g.fill(); }
      if (!(eff === 'impact' && act) && eff !== 'karaoke') { g.lineWidth = px * .16; g.strokeStyle = 'rgba(0,0,0,.92)'; g.strokeText(w.s, 0, px * .04); }
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = eff === 'karaoke' ? 0 : 14; g.shadowOffsetY = 5;
      g.fillStyle = eff === 'impact' ? (act ? '#0A0B0F' : th.text) : (act ? th.accent : (eff === 'kinetic' && !past ? th.text : th.text)); g.fillText(w.s, 0, px * .04); g.restore();
      grow(x - 6, y - lh / 2, x + w.wd + 6, y + lh / 2); x += w.wd + sp; }); });
  g.restore(); return x0 > x1 ? null : { x0, y0, x1, y1 };
}
