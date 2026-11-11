// Procedural illustrations for the template look. Every drawing is a pure function of local time `tl` (seconds since the scene started).
//   drawVisual(g, v, box, tl, P)  v = {kind, ...params}   box = {x,y,w,h}   P = palette {accent, fg, dim, family}
//   visualEvents(v, t0) -> [{t, type}]  sound events (vis / pop / ping) for the mixer, same schedule as the picture
//   labelsOf(v) -> strings drawn inside the illustration (reported to readcheck as decorative)
// kinds: network globe cable packets bars line steps neural icons ring orbit timeline compare
// icon names: phone laptop router server cloud globe lock check magnifier book chat bolt gear clock star heart mail camera chart user doc shield cart bulb play wifi
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => x * x * (3 - 2 * x), eo = x => 1 - Math.pow(1 - x, 3), back = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const hash = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const rgba = (hex, a) => { const p = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };
const TAU = Math.PI * 2;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); };

// ───────────── icons (line art, rounded, one stroke weight) ─────────────
export function icon(g, name, cx, cy, s, col, o = {}) {
  g.save(); g.translate(cx, cy); g.strokeStyle = col; g.fillStyle = rgba(col.startsWith('#') ? col : '#ffffff', .14); g.lineWidth = Math.max(2, s * .12); g.lineCap = 'round'; g.lineJoin = 'round';
  const L = (...p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const C = (x, y, r, fill) => { g.beginPath(); g.arc(x, y, r, 0, TAU); if (fill) g.fill(); g.stroke(); };
  switch (name) {
    case 'phone': rr(g, -.45 * s, -.85 * s, .9 * s, 1.7 * s, .16 * s); g.fill(); g.stroke(); L(-.12 * s, .62 * s, .12 * s, .62 * s); break;
    case 'laptop': rr(g, -.8 * s, -.6 * s, 1.6 * s, 1.05 * s, .08 * s); g.fill(); g.stroke(); L(-1 * s, .68 * s, 1 * s, .68 * s); break;
    case 'router': rr(g, -.95 * s, .0, 1.9 * s, .6 * s, .12 * s); g.fill(); g.stroke(); L(-.55 * s, 0, -.8 * s, -.7 * s); L(.55 * s, 0, .8 * s, -.7 * s); C(-.55 * s, .3 * s, .06 * s, 1); C(-.3 * s, .3 * s, .06 * s, 1); L(.2 * s, .3 * s, .7 * s, .3 * s); break;
    case 'server': for (let i = 0; i < 3; i++) { rr(g, -.8 * s, (-.85 + i * .62) * s, 1.6 * s, .5 * s, .1 * s); g.fill(); g.stroke(); C(-.5 * s, (-.6 + i * .62) * s, .06 * s, 1); L(.1 * s, (-.6 + i * .62) * s, .55 * s, (-.6 + i * .62) * s); } break;
    case 'cloud': g.beginPath(); g.moveTo(-.7 * s, .45 * s); g.arc(-.6 * s, .1 * s, .35 * s, Math.PI * .5, Math.PI * 1.5); g.arc(-.1 * s, -.25 * s, .5 * s, Math.PI * 1.1, Math.PI * 1.95); g.arc(.5 * s, .1 * s, .38 * s, Math.PI * 1.5, Math.PI * .5); g.closePath(); g.fill(); g.stroke(); break;
    case 'globe': C(0, 0, .85 * s); g.beginPath(); g.ellipse(0, 0, .38 * s, .85 * s, 0, 0, TAU); g.stroke(); L(-.85 * s, 0, .85 * s, 0); L(-.7 * s, -.42 * s, .7 * s, -.42 * s); L(-.7 * s, .42 * s, .7 * s, .42 * s); break;
    case 'lock': rr(g, -.6 * s, -.1 * s, 1.2 * s, .95 * s, .14 * s); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -.1 * s, .38 * s, Math.PI, 0); g.stroke(); C(0, .35 * s, .09 * s, 1); break;
    case 'check': C(0, 0, .85 * s); L(-.38 * s, .02 * s, -.08 * s, .32 * s, .42 * s, -.28 * s); break;
    case 'magnifier': C(-.15 * s, -.15 * s, .55 * s); L(.25 * s, .25 * s, .8 * s, .8 * s); break;
    case 'book': g.beginPath(); g.moveTo(0, -.55 * s); g.quadraticCurveTo(-.45 * s, -.8 * s, -.9 * s, -.55 * s); g.lineTo(-.9 * s, .6 * s); g.quadraticCurveTo(-.45 * s, .35 * s, 0, .6 * s); g.quadraticCurveTo(.45 * s, .35 * s, .9 * s, .6 * s); g.lineTo(.9 * s, -.55 * s); g.quadraticCurveTo(.45 * s, -.8 * s, 0, -.55 * s); g.fill(); g.stroke(); L(0, -.55 * s, 0, .6 * s); break;
    case 'chat': rr(g, -.85 * s, -.65 * s, 1.7 * s, 1.15 * s, .22 * s); g.fill(); g.stroke(); L(-.35 * s, .5 * s, -.55 * s, .85 * s, -.05 * s, .5 * s); C(-.4 * s, -.08 * s, .05 * s, 1); C(0, -.08 * s, .05 * s, 1); C(.4 * s, -.08 * s, .05 * s, 1); break;
    case 'bolt': g.beginPath(); g.moveTo(.15 * s, -.9 * s); g.lineTo(-.55 * s, .15 * s); g.lineTo(-.05 * s, .15 * s); g.lineTo(-.2 * s, .9 * s); g.lineTo(.55 * s, -.2 * s); g.lineTo(.05 * s, -.2 * s); g.closePath(); g.fill(); g.stroke(); break;
    case 'gear': { const rot = (o.t || 0) * .6; g.rotate(rot); for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * TAU / 8); rr(g, -.12 * s, -.95 * s, .24 * s, .32 * s, .05 * s); g.fill(); g.stroke(); g.restore(); } C(0, 0, .65 * s); C(0, 0, .25 * s); break; }
    case 'clock': C(0, 0, .85 * s); { const t = o.t || 0; L(0, 0, Math.sin(t * .8) * .5 * s, -Math.cos(t * .8) * .5 * s); L(0, 0, Math.sin(t * 9.6) * .7 * s, -Math.cos(t * 9.6) * .7 * s); } break;
    case 'star': g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .4 * s : .9 * s, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); break;
    case 'heart': g.beginPath(); g.moveTo(0, .75 * s); g.bezierCurveTo(-1.1 * s, .05 * s, -.7 * s, -.85 * s, 0, -.35 * s); g.bezierCurveTo(.7 * s, -.85 * s, 1.1 * s, .05 * s, 0, .75 * s); g.fill(); g.stroke(); break;
    case 'mail': rr(g, -.9 * s, -.6 * s, 1.8 * s, 1.2 * s, .12 * s); g.fill(); g.stroke(); L(-.9 * s, -.5 * s, 0, .1 * s, .9 * s, -.5 * s); break;
    case 'camera': rr(g, -.9 * s, -.5 * s, 1.8 * s, 1.1 * s, .14 * s); g.fill(); g.stroke(); C(0, .05 * s, .38 * s); L(-.35 * s, -.5 * s, -.2 * s, -.75 * s, .2 * s, -.75 * s, .35 * s, -.5 * s); break;
    case 'chart': L(-.85 * s, .8 * s, .85 * s, .8 * s); for (let i = 0; i < 4; i++) { rr(g, (-.75 + i * .42) * s, (.7 - (.3 + i * .22)) * s, .26 * s, (.3 + i * .22) * s, .04 * s); g.fill(); g.stroke(); } break;
    case 'user': C(0, -.35 * s, .38 * s); g.beginPath(); g.arc(0, .85 * s, .75 * s, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); break;
    case 'doc': g.beginPath(); g.moveTo(-.6 * s, -.9 * s); g.lineTo(.2 * s, -.9 * s); g.lineTo(.6 * s, -.5 * s); g.lineTo(.6 * s, .9 * s); g.lineTo(-.6 * s, .9 * s); g.closePath(); g.fill(); g.stroke(); L(-.3 * s, -.1 * s, .3 * s, -.1 * s); L(-.3 * s, .2 * s, .3 * s, .2 * s); L(-.3 * s, .5 * s, .1 * s, .5 * s); break;
    case 'shield': g.beginPath(); g.moveTo(0, -.9 * s); g.lineTo(.75 * s, -.6 * s); g.quadraticCurveTo(.75 * s, .5 * s, 0, .95 * s); g.quadraticCurveTo(-.75 * s, .5 * s, -.75 * s, -.6 * s); g.closePath(); g.fill(); g.stroke(); L(-.3 * s, .02 * s, -.05 * s, .3 * s, .35 * s, -.25 * s); break;
    case 'cart': L(-.9 * s, -.7 * s, -.55 * s, -.7 * s, -.2 * s, .35 * s, .65 * s, .35 * s, .85 * s, -.4 * s, -.45 * s, -.4 * s); C(-.1 * s, .72 * s, .12 * s, 1); C(.55 * s, .72 * s, .12 * s, 1); break;
    case 'bulb': g.beginPath(); g.arc(0, -.2 * s, .6 * s, Math.PI * .8, Math.PI * .2, false); g.lineTo(.3 * s, .55 * s); g.lineTo(-.3 * s, .55 * s); g.closePath(); g.fill(); g.stroke(); L(-.25 * s, .75 * s, .25 * s, .75 * s); break;
    case 'play': C(0, 0, .85 * s); g.beginPath(); g.moveTo(-.25 * s, -.38 * s); g.lineTo(.42 * s, 0); g.lineTo(-.25 * s, .38 * s); g.closePath(); g.fill(); g.stroke(); break;
    case 'wifi': for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(0, .55 * s, i * .32 * s, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); } C(0, .55 * s, .07 * s, 1); break;
    default: C(0, 0, .8 * s);
  }
  g.restore();
}
const label = (g, str, x, y, px, col, P, a = 1, maxW = 0) => {   // maxW: wrap to two lines at the nearest space, then shrink until it fits
  g.save(); g.globalAlpha *= a; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${px}px ${P.family}`; let lines = [str];
  if (maxW && g.measureText(str).width > maxW) { const w = str.split(' '); if (w.length > 1) { let best = 1, bd = 1e9; for (let i = 1; i < w.length; i++) { const d = Math.abs(g.measureText(w.slice(0, i).join(' ')).width - g.measureText(w.slice(i).join(' ')).width); if (d < bd) { bd = d; best = i; } } lines = [w.slice(0, best).join(' '), w.slice(best).join(' ')]; } }
  if (maxW) { const wd = Math.max(...lines.map(l => g.measureText(l).width)); if (wd > maxW) { px *= maxW / wd; g.font = `600 ${px}px ${P.family}`; } }
  lines.forEach((l, i) => g.fillText(l, x, y + (i - (lines.length - 1) / 2) * px * 1.15)); g.restore(); };
const glow = (g, x, y, r, col, a) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(col, a)); rg.addColorStop(1, rgba(col, 0)); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
const ptOn = (pts, u) => { const n = pts.length - 1, f = clamp(u) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; };

// ───────────── the illustrations ─────────────
const D = {
  network(g, v, b, tl, P) {                                   // devices linked by lines; packets travel along them
    const nodes = v.nodes || [{ icon: 'laptop', label: 'Perangkat' }, { icon: 'router', label: 'Router' }, { icon: 'cloud', label: 'Jaringan' }, { icon: 'server', label: 'Server' }];
    const n = nodes.length, s = Math.min(b.h * .17, b.w / (n * 2.6)), pts = nodes.map((_, i) => [b.x + b.w * (.15 + .70 * i / (n - 1)), b.y + b.h * (.5 + (i % 2 ? -.16 : .16) * (n > 2 ? 1 : 0))]);
    g.lineWidth = 3; for (let i = 0; i < n - 1; i++) { const p = ss(seg(tl, .5 + i * .35, 1 + i * .35)); g.strokeStyle = rgba(P.accent, .35); g.setLineDash([10, 10]); g.lineDashOffset = -tl * 30; g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); const e = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * p, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * p]; g.lineTo(e[0], e[1]); g.stroke(); g.setLineDash([]); }
    const np = v.packets || 5; for (let k = 0; k < np; k++) { const u = ((tl - 1.2) * .22 + k / np) % 1; if (tl < 1.2) continue; const [x, y] = ptOn(pts, u); glow(g, x, y, s * .6, P.accent, .5); g.fillStyle = P.accent; rr(g, x - 7, y - 7, 14, 14, 3); g.fill(); }
    nodes.forEach((nd, i) => { const p = back(seg(tl, .25 + i * .3, .75 + i * .3)), [x, y] = pts[i]; g.save(); g.globalAlpha *= clamp(p * 2); g.translate(x, y); g.scale(.4 + .6 * p, .4 + .6 * p); g.translate(-x, -y); glow(g, x, y, s * 1.8, P.accent, .12); icon(g, nd.icon, x, y, s, P.fg, { t: tl }); g.restore(); if (nd.label) label(g, nd.label, x, y + s * 1.55, Math.max(18, s * .42), P.dim, P, clamp(p * 2), b.w * .70 / Math.max(1, n - 1) * 1.15); });
  },
  globe(g, v, b, tl, P) {                                      // rotating wireframe globe with glowing arcs
    const R = Math.min(b.w, b.h) * .46, cx = b.x + b.w / 2, cy = b.y + b.h / 2, rot = tl * .35 + (v.rot || 0), p = ss(seg(tl, .1, .8)), pts = v.points || [[-6, 106], [35, -97], [51, 0], [35, 139], [-33, 151]];
    glow(g, cx, cy, R * 1.7, P.accent, .16 * p); g.lineWidth = 2; g.strokeStyle = rgba(P.accent, .9 * p); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R * p, 0, TAU); g.stroke(); if (p < .2) return;
    const proj = (lat, lon, k = 1) => { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180 + rot, x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo); return [cx + x * R * k, cy - y * R * k, z]; };
    g.lineWidth = 1.2; for (let lat = -60; lat <= 60; lat += 30) { g.beginPath(); let st = false; for (let lon = -180; lon <= 180; lon += 6) { const [x, y, z] = proj(lat, lon); if (z > 0) { st ? g.lineTo(x, y) : g.moveTo(x, y); st = true; } else st = false; } g.strokeStyle = rgba(P.fg, .30); g.stroke(); }
    for (let lon = -180; lon < 180; lon += 30) { g.beginPath(); let st = false; for (let lat = -90; lat <= 90; lat += 6) { const [x, y, z] = proj(lat, lon); if (z > 0) { st ? g.lineTo(x, y) : g.moveTo(x, y); st = true; } else st = false; } g.strokeStyle = rgba(P.fg, .30); g.stroke(); }
    for (let i = 0; i < pts.length - 1; i++) { const A = pts[i], B = pts[i + 1], steps = 40; g.beginPath(); let st = false, last = null; for (let k = 0; k <= steps; k++) { const u = k / steps, lat = A[0] + (B[0] - A[0]) * u, lon = A[1] + (B[1] - A[1]) * u, [x, y, z] = proj(lat, lon, 1 + .28 * Math.sin(Math.PI * u)); if (z > -.05) { st ? g.lineTo(x, y) : g.moveTo(x, y); st = true; last = [x, y]; } else st = false; } g.strokeStyle = rgba(P.accent, .8); g.lineWidth = 2.5; g.stroke();
      const u = ((tl * .35 + i * .27) % 1), [x, y, z] = proj(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, 1 + .28 * Math.sin(Math.PI * u)); if (z > 0) { glow(g, x, y, 22, P.accent, .8); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); } }
    pts.forEach(([la, lo], i) => { const [x, y, z] = proj(la, lo); if (z > 0) { const pu = .5 + .5 * Math.sin(tl * 3 + i); glow(g, x, y, 26 + 8 * pu, P.accent, .5); g.fillStyle = P.accent; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); } });
  },
  cable(g, v, b, tl, P) {                                      // seabed cable with light pulses under layered waves
    const p = ss(seg(tl, .1, .7)); g.save(); rr(g, b.x, b.y + b.h * .12, b.w, b.h * .8, 28); g.clip();
    const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, rgba(P.accent, .02)); gr.addColorStop(1, rgba(P.accent, .16)); g.fillStyle = gr; g.fillRect(b.x, b.y, b.w, b.h);
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(b.x, b.y + b.h); for (let x = 0; x <= b.w; x += 8) g.lineTo(b.x + x, b.y + b.h * (.22 + k * .07) + Math.sin(x * .012 + tl * (.8 + k * .3) + k) * (b.h * .025)); g.lineTo(b.x + b.w, b.y + b.h); g.closePath(); g.fillStyle = rgba(P.fg, .05 + k * .02); g.fill(); g.strokeStyle = rgba(P.fg, .12 + k * .05); g.lineWidth = 2; g.stroke(); }
    const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([b.x + b.w * (.06 + .88 * u), b.y + b.h * (.62 + .2 * Math.sin(u * Math.PI * 2.2 + .6) * (.5 + .5 * Math.sin(u * 3)) + .12 * Math.sin(u * Math.PI))]); }
    g.lineWidth = 7; g.lineCap = 'round'; g.strokeStyle = rgba(P.fg, .22 * p); g.beginPath(); pts.slice(0, 1 + Math.round(40 * p)).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
    for (let k = 0; k < 4; k++) { const u = ((tl * .25 + k / 4) % 1); if (u > p) continue; const [x, y] = ptOn(pts, u); glow(g, x, y, 60, P.accent, .55); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
    g.restore(); rr(g, b.x, b.y + b.h * .12, b.w, b.h * .8, 28); g.strokeStyle = rgba(P.fg, .18); g.lineWidth = 2; g.stroke(); icon(g, 'globe', b.x + b.w * .07, b.y + b.h * .05, b.h * .09, P.fg); icon(g, 'globe', b.x + b.w * .93, b.y + b.h * .05, b.h * .09, P.fg);
  },
  packets(g, v, b, tl, P) {                                    // one block splits into packets, travels, reassembles
    const N = 16, cols = 4, bs = Math.min(b.h, b.w) * .36, A = [b.x + b.w * .18, b.y + b.h * .5], B = [b.x + b.w * .82, b.y + b.h * .5], cyc = 5, u = (tl % cyc) / cyc, sp = ss(seg(u, .12, .3)), mv = ss(seg(u, .3, .62)), as = ss(seg(u, .62, .84));
    const draw = (cx, cy, a) => { g.fillStyle = rgba(P.fg, .06 * a); rr(g, cx - bs / 2, cy - bs / 2, bs, bs, 14); g.fill(); g.strokeStyle = rgba(P.fg, .4 * a); g.lineWidth = 3; g.stroke(); };
    if (u < .12 || u > .84) { const cx = u > .84 ? B[0] : A[0], cy = B[1], a = u > .84 ? 1 : clamp(tl / .6); g.save(); g.globalAlpha *= (u > .84 ? 1 - ss(seg(u, .9, 1)) : 1) * a; draw(cx, cy, 1); icon(g, 'doc', cx, cy, bs * .25, P.accent); g.restore(); }
    else for (let i = 0; i < N; i++) { const r = Math.floor(i / cols), c = i % cols, cell = bs / cols, ox = (c - 1.5) * cell, oy = (r - 1.5) * cell, sc = hash(i + 3), lift = Math.sin(Math.PI * mv) * (40 + sc * 90) * (i % 2 ? -1 : 1);
      const sx = A[0] + ox * (1 + sp * .9), sy = A[1] + oy * (1 + sp * .9), ex = B[0] + ox * (1 + (1 - as) * .9), ey = B[1] + oy * (1 + (1 - as) * .9), m = ss(clamp((mv * 1.2) - sc * .2)), x = sx + (ex - sx) * m, y = sy + (ey - sy) * m + lift; const gx = b.x + 0; g.fillStyle = i % 5 === 0 ? P.accent : rgba(P.fg, .85); g.shadowColor = rgba(P.accent, .5); g.shadowBlur = mv > 0 && mv < 1 ? 14 : 0; rr(g, x - cell * .38, y - cell * .38, cell * .76, cell * .76, 6); g.fill(); g.shadowBlur = 0; }
    icon(g, 'laptop', A[0], b.y + b.h * .1, b.h * .09, P.dim); icon(g, 'server', B[0], b.y + b.h * .1, b.h * .09, P.dim);
  },
  bars(g, v, b, tl, P) {
    const vals = v.values || [30, 55, 80, 100], labs = v.labels || [], n = vals.length, mx = Math.max(...vals), bw = b.w / (n * 1.6), base = b.y + b.h * .86;
    g.strokeStyle = rgba(P.fg, .2); g.lineWidth = 2; g.beginPath(); g.moveTo(b.x, base); g.lineTo(b.x + b.w, base); g.stroke();
    vals.forEach((val, i) => { const p = eo(seg(tl, .3 + i * .25, 1.1 + i * .25)), h = (b.h * .7) * val / mx * p, x = b.x + b.w * (.1 + .8 * i / Math.max(1, n - 1)) - bw / 2, last = i === n - 1; const gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, last ? P.accent : rgba(P.fg, .85)); gr.addColorStop(1, last ? rgba(P.accent, .35) : rgba(P.fg, .25)); g.fillStyle = gr; rr(g, x, base - h, bw, h, 10); g.fill(); if (last) glow(g, x + bw / 2, base - h, bw * 1.4, P.accent, .35 * p);
      label(g, (v.fmt ? v.fmt.replace('%v', Math.round(val * p)) : Math.round(val * p)) + '', x + bw / 2, base - h - 22, Math.max(18, bw * .3), last ? P.accent : P.fg, P, p); if (labs[i]) label(g, labs[i], x + bw / 2, base + 26, Math.max(16, bw * .26), P.dim, P, p); });
  },
  line(g, v, b, tl, P) {
    const vals = v.values || [10, 18, 16, 30, 44, 70, 100], n = vals.length, mx = Math.max(...vals), p = eo(seg(tl, .3, 2)), pts = vals.map((val, i) => [b.x + b.w * (.05 + .9 * i / (n - 1)), b.y + b.h * (.88 - .74 * val / mx)]);
    g.strokeStyle = rgba(P.fg, .12); g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(b.x, b.y + b.h * (.14 + i * .185)); g.lineTo(b.x + b.w, b.y + b.h * (.14 + i * .185)); g.stroke(); }
    const m = Math.max(1, Math.round((n - 1) * p * 100) / 100), pp = []; for (let i = 0; i <= 60; i++) { const [x, y] = ptOn(pts, i / 60 * p); pp.push([x, y]); }
    g.beginPath(); pp.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.lineTo(pp[pp.length - 1][0], b.y + b.h * .88); g.lineTo(pp[0][0], b.y + b.h * .88); g.closePath(); const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, rgba(P.accent, .35)); gr.addColorStop(1, rgba(P.accent, 0)); g.fillStyle = gr; g.fill();
    g.beginPath(); pp.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.strokeStyle = P.accent; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke(); const h = pp[pp.length - 1]; glow(g, h[0], h[1], 50, P.accent, .6); g.fillStyle = '#fff'; g.beginPath(); g.arc(h[0], h[1], 7, 0, TAU); g.fill();
  },
  steps(g, v, b, tl, P) {
    const it = v.items || ['Langkah 1', 'Langkah 2', 'Langkah 3'], n = it.length, vertical = b.h > b.w * 1.1, gap = (vertical ? b.h : b.w) / n, bw = vertical ? b.w * .86 : gap * .8, bh = vertical ? gap * .62 : b.h * .5;
    it.forEach((txt, i) => { const act = tl > .6 + i * .75, p = back(seg(tl, .4 + i * .75, .9 + i * .75)), cx = vertical ? b.x + b.w / 2 : b.x + gap * (i + .5), cy = vertical ? b.y + gap * (i + .5) : b.y + b.h * .5;
      if (i < n - 1) { const q = ss(seg(tl, .8 + i * .75, 1.2 + i * .75)); g.strokeStyle = rgba(P.accent, .8); g.lineWidth = 4; g.lineCap = 'round'; const a = vertical ? [cx, cy + bh / 2 + 6] : [cx + bw / 2 + 6, cy], z = vertical ? [cx, cy + gap - bh / 2 - 6] : [cx + gap - bw / 2 - 6, cy]; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[0] + (z[0] - a[0]) * q, a[1] + (z[1] - a[1]) * q); g.stroke(); }
      g.save(); g.translate(cx, cy); g.scale(.6 + .4 * p, .6 + .4 * p); g.globalAlpha *= clamp(p * 2); if (act) glow(g, 0, 0, bw * .8, P.accent, .14); g.fillStyle = rgba(P.fg, act ? .09 : .04); rr(g, -bw / 2, -bh / 2, bw, bh, 18); g.fill(); g.strokeStyle = act ? P.accent : rgba(P.fg, .25); g.lineWidth = 3; g.stroke();
      g.restore(); label(g, txt, cx, cy, Math.max(18, Math.min(bh * .3, bw * .17)), act ? P.fg : P.dim, P, clamp(p * 2), bw * .86); });
  },
  neural(g, v, b, tl, P) {
    const L = v.layers || [3, 5, 5, 2], pos = L.map((n, li) => Array.from({ length: n }, (_, i) => [b.x + b.w * (.1 + .8 * li / (L.length - 1)), b.y + b.h * (.5 + (i - (n - 1) / 2) * (.8 / Math.max(L.length ? Math.max(...L) : 4, 4)))])), p = ss(seg(tl, .1, .8));
    g.lineWidth = 1.4; for (let li = 0; li < L.length - 1; li++) pos[li].forEach((a, i) => pos[li + 1].forEach((c, j) => { g.strokeStyle = rgba(P.fg, .13 * p); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke(); }));
    for (let k = 0; k < 7; k++) { const t0 = (tl * .7 + k * .37) % (L.length - 1), li = Math.floor(t0), u = t0 - li, i = Math.floor(hash(k * 7 + Math.floor(tl * .7 / (L.length - 1) + k)) * L[li]), j = Math.floor(hash(k * 13 + li + Math.floor(tl)) * L[li + 1]), a = pos[li][i], c = pos[li + 1][j]; if (tl < .8) continue; const x = a[0] + (c[0] - a[0]) * u, y = a[1] + (c[1] - a[1]) * u; glow(g, x, y, 30, P.accent, .7); g.fillStyle = P.accent; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
    pos.forEach((col, li) => col.forEach((q, i) => { const pp = back(seg(tl, .2 + li * .15, .6 + li * .15)); g.save(); g.translate(q[0], q[1]); g.scale(pp, pp); g.fillStyle = '#0d0f14'; g.strokeStyle = li === L.length - 1 ? P.accent : rgba(P.fg, .8); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, b.h * .035, 0, TAU); g.fill(); g.stroke(); g.restore(); }));
  },
  icons(g, v, b, tl, P) {
    const it = v.items || [{ icon: 'star', label: 'Satu' }, { icon: 'bolt', label: 'Dua' }, { icon: 'heart', label: 'Tiga' }], n = it.length, cols = n <= 3 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols), cw = b.w / cols, ch = b.h / rows, s = Math.min(cw, ch) * .3;
    it.forEach((q, i) => { const c = i % cols, r = Math.floor(i / cols), p = back(seg(tl, .3 + i * .2, .8 + i * .2)), x = b.x + cw * (c + .5), y = b.y + ch * (r + .5) + Math.sin(tl * 1.4 + i) * 6; g.save(); g.globalAlpha *= clamp(p * 2); g.translate(x, y); g.scale(p, p); g.translate(-x, -y); glow(g, x, y, s * 2.2, P.accent, .14); g.fillStyle = rgba(P.fg, .05); rr(g, x - s * 1.5, y - s * 1.5, s * 3, s * 3, s * .6); g.fill(); g.strokeStyle = rgba(P.fg, .15); g.lineWidth = 2; g.stroke(); icon(g, q.icon, x, y, s, i === n - 1 ? P.accent : P.fg, { t: tl }); g.restore(); if (q.label) label(g, q.label, x, y + s * 2.1, Math.max(18, s * .5), P.dim, P, clamp(p * 2), cw * .92); });
  },
  ring(g, v, b, tl, P) {
    const val = v.value ?? 75, R = Math.min(b.w, b.h) * .36, cx = b.x + b.w / 2, cy = b.y + b.h / 2, p = eo(seg(tl, .3, 1.8));
    g.lineWidth = R * .22; g.lineCap = 'round'; g.strokeStyle = rgba(P.fg, .1); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke(); glow(g, cx, cy, R * 1.5, P.accent, .12);
    g.strokeStyle = P.accent; g.shadowColor = rgba(P.accent, .7); g.shadowBlur = 24; g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * val / 100 * p); g.stroke(); g.shadowBlur = 0;
    g.font = `800 ${R * .6}px ${P.family}`; g.fillStyle = P.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(Math.round(val * p) + (v.suffix ?? '%'), cx, cy);
  },
  orbit(g, v, b, tl, P) {
    const it = v.items || ['star', 'bolt', 'heart', 'chat', 'cloud'], cx = b.x + b.w / 2, cy = b.y + b.h / 2, Rx = b.w * .38, Ry = b.h * .36, s = Math.min(b.w, b.h) * .08, p = ss(seg(tl, .1, .7));
    g.strokeStyle = rgba(P.fg, .12 * p); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, Rx, Ry, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(cx, cy, Rx * .62, Ry * .62, 0, 0, TAU); g.stroke();
    glow(g, cx, cy, s * 4, P.accent, .3 * p); icon(g, v.center || 'globe', cx, cy, s * 1.5 * p, P.accent, { t: tl });
    it.forEach((nm, i) => { const a = tl * .5 + i * TAU / it.length, x = cx + Math.cos(a) * Rx, y = cy + Math.sin(a) * Ry, pp = back(seg(tl, .3 + i * .15, .8 + i * .15)); g.save(); g.globalAlpha *= clamp(pp * 2); g.fillStyle = '#0d0f14'; g.strokeStyle = rgba(P.fg, .35); g.lineWidth = 2; g.beginPath(); g.arc(x, y, s * 1.2 * pp, 0, TAU); g.fill(); g.stroke(); icon(g, nm, x, y, s * .72 * pp, P.fg); g.restore(); });
  },
  timeline(g, v, b, tl, P) {
    const it = v.items || ['Awal', 'Tengah', 'Akhir'], n = it.length, y = b.y + b.h * .5, p = ss(seg(tl, .2, 1.2 + n * .2));
    g.strokeStyle = rgba(P.fg, .2); g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(b.x + b.w * .10, y); g.lineTo(b.x + b.w * .90, y); g.stroke(); g.strokeStyle = P.accent; g.beginPath(); g.moveTo(b.x + b.w * .10, y); g.lineTo(b.x + b.w * (.10 + .80 * p), y); g.stroke();
    it.forEach((txt, i) => { const x = b.x + b.w * (.16 + .68 * i / (n - 1)), pp = back(seg(tl, .4 + i * .35, .9 + i * .35)), up = i % 2 === 0; g.save(); g.globalAlpha *= clamp(pp * 2); glow(g, x, y, 40, P.accent, .4); g.fillStyle = P.accent; g.beginPath(); g.arc(x, y, 12 * pp, 0, TAU); g.fill(); g.strokeStyle = rgba(P.fg, .3); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + (up ? -16 : 16)); g.lineTo(x, y + (up ? -b.h * .16 : b.h * .16)); g.stroke(); g.restore(); label(g, txt, x, y + (up ? -b.h * .22 : b.h * .22), Math.max(18, b.h * .08), P.fg, P, clamp(pp * 2), b.w * .68 / Math.max(1, n - 1) * 1.5); });
  },
  compare(g, v, b, tl, P) {
    const cards = [v.left || { title: 'Sebelum', items: ['A', 'B'] }, v.right || { title: 'Sesudah', items: ['C', 'D'] }], w = b.w * .46, ch = Math.min(b.h, b.h * (.45 + .14 * Math.max(...cards.map(c => (c.items || []).length)))), by = b.y + (b.h - ch) / 2;
    cards.forEach((c, k) => { const p = back(seg(tl, .3 + k * .4, .9 + k * .4)), x = b.x + (k ? b.w - w : 0), acc = k === 1; g.save(); g.globalAlpha *= clamp(p * 2); g.translate(x + w / 2, by + ch / 2); g.scale(.85 + .15 * p, .85 + .15 * p); g.translate(-(x + w / 2), -(by + ch / 2)); if (acc) glow(g, x + w / 2, by + ch / 2, w * .8, P.accent, .14); g.fillStyle = rgba(P.fg, .05); rr(g, x, by, w, ch, 24); g.fill(); g.strokeStyle = acc ? P.accent : rgba(P.fg, .2); g.lineWidth = 3; g.stroke(); g.restore();
      label(g, c.title, x + w / 2, by + ch * .22, Math.max(20, b.h * .09), acc ? P.accent : P.fg, P, clamp(p * 2), w * .86); (c.items || []).forEach((t, i) => label(g, t, x + w / 2, by + ch * (.5 + i * .22), Math.max(17, b.h * .075), acc ? P.fg : P.dim, P, clamp(seg(tl, .7 + k * .4 + i * .25, 1 + k * .4 + i * .25)), w * .86)); });
  },
};
export const KINDS = Object.keys(D);
export function drawVisual(g, v, box, tl, P) {
  const f = D[v.kind]; if (!f) return; g.save(); const p = ss(seg(tl, 0, .5)); g.globalAlpha *= p; g.translate(0, (1 - p) * 24); f(g, v, box, tl, P); g.restore();
}
export function labelsOf(v) {
  const o = []; const add = x => x && o.push(String(x));
  (v.nodes || []).forEach(n => add(n.label)); (v.items || []).forEach(n => add(typeof n === 'string' ? (D[v.kind] && ['orbit'].includes(v.kind) ? null : n) : n.label)); (v.labels || []).forEach(add);
  [v.left, v.right].forEach(c => c && (add(c.title), (c.items || []).forEach(add))); return o;
}
export function visualEvents(v, t0) {                              // sound events: only 'pop'/'ping' on the beats the picture shows (the scene entry already has its own 'scene' sound: no second sound there)
  const e = [], at = (t, type) => e.push({ t: +(t0 + t).toFixed(3), type });
  const n = (v.items || v.nodes || v.values || []).length;
  switch (v.kind) {
    case 'network': (v.nodes || [1, 2, 3, 4]).forEach((_, i) => at(.5 + i * .3, 'pop')); break;
    case 'icons': case 'orbit': for (let i = 0; i < (v.items || [1, 2, 3, 4, 5]).length; i++) at(.5 + i * (v.kind === 'icons' ? .2 : .15), 'pop'); break;
    case 'bars': (v.values || [1, 2, 3, 4]).forEach((_, i) => at(.5 + i * .25, 'pop')); break;
    case 'steps': (v.items || [1, 2, 3]).forEach((_, i) => at(.7 + i * .75, 'pop')); break;
    case 'timeline': (v.items || [1, 2, 3]).forEach((_, i) => at(.6 + i * .35, 'pop')); break;
    case 'compare': at(.5, 'pop'); at(.9, 'pop'); break;
    case 'packets': at(1.6, 'ping'); at(3.1, 'ping'); break;
    case 'neural': case 'line': case 'ring': at(1.2, 'ping'); break;
  }
  return e;
}
