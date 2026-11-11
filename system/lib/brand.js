// Brand overlay for every video: wordmark top-left, series chip top-right (series only), "Berikutnya" end card (series only).
// Config: system/brand.json (copied to _lib/brand.json at build): name, parts[2] (white + accent), x, y, fontPx (at 1080 wide), opacity.
// Positions are inside the top band below the platform status bar; verify on a real phone (see system/tools/safezone-preview.mjs).
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), ss = x => x * x * (3 - 2 * x);
export async function loadBrand() {
  const def = { enabled: true, name: 'ngetehnology', parts: ['ngeteh', 'nology'], x: 60, y: 168, fontPx: 36, opacity: .92, chipRight: 60 };
  try { return { ...def, ...(await (await fetch('_lib/brand.json')).json()) }; } catch { return def; }
}
function cup(g, x, y, s, col) {                       // tiny tea cup with steam, drawn in code
  g.save(); g.translate(x, y); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(2, s * .1); g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-s * .5, -s * .05); g.lineTo(-s * .42, s * .38); g.quadraticCurveTo(-s * .38, s * .52, -s * .2, s * .52); g.lineTo(s * .2, s * .52); g.quadraticCurveTo(s * .38, s * .52, s * .42, s * .38); g.lineTo(s * .5, -s * .05); g.closePath(); g.stroke();
  g.beginPath(); g.arc(s * .52, s * .2, s * .2, -Math.PI / 2, Math.PI / 2); g.stroke();
  [-.15, .12].forEach((dx, i) => { g.beginPath(); g.moveTo(s * dx, -s * .22); g.quadraticCurveTo(s * (dx + .12), -s * .4, s * dx, -s * .56); g.stroke(); }); g.restore();
}
// returns [{id,text,x0,y0,x1,y1}] of what was drawn (reported to readcheck/QA as decorative)
export function drawBrand(g, o) {
  const { W, H, t, TL, F, P, BR, thumb } = o; if (BR.enabled === false || F.brand === false) return [];
  const k = W / 1080, px = Math.round(BR.fontPx * k), out = [], a = thumb ? 1 : ss(seg(t, 0, .25)) * BR.opacity, y = Math.round(BR.y * H / 1920), x = Math.round(BR.x * k);
  g.save(); g.globalAlpha = a; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 10; g.shadowOffsetY = 2; g.font = `800 ${px}px ${P.family}`;
  const w1 = g.measureText(BR.parts[0]).width, w2 = g.measureText(BR.parts[1]).width, cs = px * 1.05, gap = px * .3, total = cs + gap + w1 + w2;
  const bx = thumb ? W - Math.round(BR.chipRight * k) - total : x;                      // thumbnails: right-aligned (the left corner holds the kicker pill)
  cup(g, bx + cs / 2, y, cs * .8, P.accent); g.fillStyle = '#ffffff'; g.fillText(BR.parts[0], bx + cs + gap, y + 1); g.fillStyle = P.accent; g.fillText(BR.parts[1], bx + cs + gap + w1, y + 1);
  out.push({ id: 'brand', text: BR.name, x0: bx, y0: y - px * .75, x1: bx + total, y1: y + px * .75 });
  if (F.series && !thumb) {                                                                // series chip, right-aligned
    const S = F.series, sp = Math.round(px * .78), padx = sp * .8, h = sp * 1.9, endShow = !!S.next && t > TL.dur - 3.6 && t < TL.dur - .6, right = W - Math.round(BR.chipRight * k), maxW = right - (x + total + 30 * k) - padx * 2;
    g.font = `700 ${sp}px ${P.family}`; g.shadowBlur = 0; const sepW = g.measureText(' · ').width; let a1 = endShow ? 'Berikutnya' : (S.short || S.name || ''), a2 = endShow ? `EP ${S.n + 1} · ${S.next}` : `EP ${S.n}/${S.total}`;
    while (g.measureText(a1).width + sepW + g.measureText(a2).width > maxW && (a2.length > 6 || a1.length > 6)) { if (endShow) a2 = a2.slice(0, -2).trimEnd() + '…'; else a1 = a1.slice(0, -2).trimEnd() + '…'; }
    const wd = g.measureText(a1).width + sepW + g.measureText(a2).width + padx * 2, cx0 = right - wd, cy = y - h / 2;
    g.globalAlpha = a; g.fillStyle = 'rgba(8,10,16,.62)'; g.beginPath(); g.roundRect(cx0, cy, wd, h, h / 2); g.fill(); g.strokeStyle = P.accent; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.fillText(a1, cx0 + padx, y + 1); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(' · ', cx0 + padx + g.measureText(a1).width, y + 1); g.fillStyle = P.accent; g.fillText(a2, cx0 + padx + g.measureText(a1).width + sepW, y + 1);
    out.push({ id: endShow ? 'seriesnext' : 'series', text: a1 + ' · ' + a2, x0: cx0, y0: cy, x1: cx0 + wd, y1: cy + h });
  }
  g.restore(); return out;
}
