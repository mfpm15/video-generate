// 3D typography: words and labels are canvas textures on planes (so we keep real fonts), stacked into thin extrusion layers for depth,
// animated per word in 3D (fly in with rotation, overshoot, idle float). Units: 1 world unit = PXU screen pixels at z = 0.
// makeType(env) -> { words(str, o), label(str, o), dyn(o), boxOf(block) }
//   words: block {group, words[], update(tl, t0), height, texts}   o: {px, wt, fam, maxW, cx, y, color, accent, align, stagger, extrude}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3), back = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

export function makeType(env) {
  const { THREE, P, PXU, fontFam, camera, W, H } = env;
  const TS = 1.5;                                                   // texture supersampling
  const cv = document.createElement('canvas'), cx = cv.getContext('2d');
  function tex(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t; }
  function measure(str, px, wt, fam) { cx.font = `${wt} ${px * TS}px ${fam}`; return cx.measureText(str).width / TS; }
  function draw(str, px, wt, fam, color, o = {}) {                  // returns {tex, w, h} in px (1x)
    const w = Math.ceil(measure(str, px, wt, fam) + px * .5), h = Math.ceil(px * 1.5), c = document.createElement('canvas'); c.width = w * TS; c.height = h * TS; const g = c.getContext('2d');
    g.font = `${wt} ${px * TS}px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = px * TS * .35; }
    if (o.stroke) { g.lineWidth = px * TS * .12; g.strokeStyle = o.stroke; g.strokeText(str, w * TS / 2, h * TS / 2 + px * TS * .04); }
    g.fillStyle = color; g.fillText(str, w * TS / 2, h * TS / 2 + px * TS * .04); return { tex: tex(c), w, h };
  }
  const basic = (map, o = {}) => new THREE.MeshBasicMaterial({ map, fog: false, transparent: true, depthWrite: false, toneMapped: false, color: o.color || 0xffffff, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: 1 });

  // one word = front plane + dark extrusion layers (+ glow plane when emphasised)
  function word(str, px, wt, fam, color, accentCol, isEm, extrude) {
    const g = new THREE.Group(), ww = px / PXU, f = draw(str, px, wt, fam, isEm ? accentCol : color), mats = [];
    const geo = new THREE.PlaneGeometry(f.w / PXU, f.h / PXU), N = extrude || 0;
    if (N) { const b = draw(str, px, wt, fam, P.extrude || '#000000'); for (let k = N; k >= 1; k--) { const m = basic(b.tex, { color: new THREE.Color(P.extrude || '#000000').lerp(new THREE.Color(isEm ? accentCol : '#222233'), .25) }); m.opacity = .85; const p = new THREE.Mesh(geo, m); p.position.set(.012 * k, -.012 * k, -.02 * k); g.add(p); mats.push(m); } }
    const fm = basic(f.tex, { color: isEm ? new THREE.Color(accentCol).multiplyScalar(1.35) : new THREE.Color(.72, .72, .72) }); const front = new THREE.Mesh(geo, fm); g.add(front); mats.push(fm);
    if (isEm) { const gl = draw(str, px, wt, fam, accentCol, { glow: accentCol }), gm = basic(gl.tex, { add: true, color: new THREE.Color(accentCol).multiplyScalar(1.2) }); gm.opacity = .45; const gp = new THREE.Mesh(new THREE.PlaneGeometry(f.w / PXU * 1.06, f.h / PXU * 1.06), gm); gp.position.z = -.01; g.add(gp); mats.push(gm); }
    return { group: g, w: f.w / PXU, h: f.h / PXU, mats, front, em: isEm };
  }
  function layout(str, px, wt, fam, maxW) {                          // rows of {s, em} wrapped to maxW (world units)
    const raw = str.split(' ').map(w => { const em = /^\*.*\*[.,!?]*$/.test(w); return { s: w.replace(/\*/g, ''), em }; }), sp = measure(' ', px, wt, fam) / PXU, rows = [[]]; let rw = 0;
    raw.forEach(w => { w.wd = measure(w.s, px, wt, fam) / PXU; if (rw + w.wd > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(w); rw += w.wd + sp; });
    return { rows, sp };
  }
  // block of animated words, centred on (cx, y) (y = centre of the first row), rows go downward
  function words(str, o) {
    const px = o.px, wt = o.wt || 900, fam = o.fam || fontFam, maxW = o.maxW || 8, color = o.color || P.fg, accentCol = o.accent || P.accent, ex = o.extrude ?? 5;
    const L = layout(str, px, wt, fam, maxW), lh = px * 1.12 / PXU, g = new THREE.Group(), list = []; let n = 0;
    L.rows.forEach((r, ri) => {
      const tw = r.reduce((s, w) => s + w.wd, 0) + L.sp * (r.length - 1); let x = (o.cx || 0) - tw / 2 + (o.align === 'left' ? tw / 2 : 0);
      r.forEach(w => { const wd = word(w.s, px, wt, fam, color, accentCol, w.em, ex); wd.group.position.set(x + w.wd / 2, (o.y || 0) - ri * lh, 0); wd.bx = x + w.wd / 2; wd.by = (o.y || 0) - ri * lh; wd.k = n++; wd.wdt = w.wd; g.add(wd.group); list.push(wd); x += w.wd + L.sp; });
    });
    const st = o.stagger ?? .11, id = o.id || 'w', text = str.replace(/\*/g, '');
    return { group: g, list, height: L.rows.length * lh, text, id, update(tl, delay = 0) {
      list.forEach(wd => { const k = wd.k, p = seg(tl, delay + k * st, delay + k * st + .5), e = back(p), s = .25 + .75 * e, dir = k % 2 ? 1 : -1, fl = Math.sin(tl * 1.3 + k * .8) * .035 * clamp(p * 3);
        wd.group.position.set(wd.bx, wd.by + fl - (1 - eo(p)) * .8, (1 - e) * 5); wd.group.rotation.set((1 - e) * -.9, dir * (1 - e) * .55, dir * (1 - e) * .12); wd.group.scale.setScalar(s);
        const a = clamp(p * 2.2); wd.mats.forEach(m => m.opacity = (m.userData.base ??= m.opacity) * a); wd.group.visible = p > 0; });
    } };
  }
  // small label (single line, shrinks to fit maxW), static
  function label(str, o) {
    const px = o.px || 40, wt = o.wt || 700, fam = o.fam || fontFam; let p2 = px; const wmax = (o.maxW || 4) * PXU; const w0 = measure(str, px, wt, fam); if (w0 > wmax) p2 = px * wmax / w0;
    const f = draw(str, p2, wt, fam, o.color || P.fg, { stroke: o.stroke }), m = basic(f.tex, { color: new THREE.Color(1, 1, 1) }), mesh = new THREE.Mesh(new THREE.PlaneGeometry(f.w / PXU, f.h / PXU), m);
    mesh.userData = { mat: m, text: str, w: f.w / PXU, h: f.h / PXU }; return mesh;
  }
  // dynamic text: two persistent canvases/textures re-drawn when the string changes (no new GPU textures per frame)
  function dyn(o) {
    const px = o.px, wt = o.wt || 900, fam = o.fam || fontFam, color = o.color || P.accent, N = o.extrude ?? 6, g = new THREE.Group(), wpx = Math.ceil((o.maxW || 8) * PXU), hpx = Math.ceil(px * 1.5);
    const mk = () => { const c = document.createElement('canvas'); c.width = wpx * TS; c.height = hpx * TS; const t = tex(c); return { c, t, g: c.getContext('2d') }; }, F = mk(), B = mk(), geo = new THREE.PlaneGeometry(wpx / PXU, hpx / PXU), mats = []; let last = null;
    for (let k = N; k >= 1; k--) { const m = basic(B.t, { color: new THREE.Color('#000').lerp(new THREE.Color(color), .2) }); m.opacity = .85; const pl = new THREE.Mesh(geo, m); pl.position.set(.014 * k, -.014 * k, -.025 * k); g.add(pl); mats.push(m); }
    const fm = basic(F.t, { color: new THREE.Color(color).multiplyScalar(1.35) }); g.add(new THREE.Mesh(geo, fm)); mats.push(fm);
    const paint = (X, str, col, glow) => { X.g.clearRect(0, 0, X.c.width, X.c.height); let p2 = px; X.g.font = `${wt} ${p2 * TS}px ${fam}`; const w0 = X.g.measureText(str).width / TS; if (w0 > wpx * .96) p2 = px * wpx * .96 / w0; X.g.font = `${wt} ${p2 * TS}px ${fam}`; X.g.textAlign = 'center'; X.g.textBaseline = 'middle';
      if (glow) { X.g.shadowColor = glow; X.g.shadowBlur = p2 * TS * .35; } X.g.fillStyle = col; X.g.fillText(str, X.c.width / 2, X.c.height / 2 + p2 * TS * .04); X.t.needsUpdate = true; };
    const set = str => { if (str === last) return; last = str; paint(F, str, color, color); paint(B, str, '#000000', null); F.g.font = `${wt} ${px * TS}px ${fam}`; const tw = Math.min(F.g.measureText(str).width / TS, wpx * .96) / PXU + .2; g.children.forEach(m => m.userData.boxW = tw); };
    return { group: g, set, get mats() { return mats; } };
  }
  // projected screen box (px) of a mesh/group's front planes
  const v = new THREE.Vector3();
  function boxOf(obj) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; obj.updateWorldMatrix(true, true);
    obj.traverse(m => { if (!m.isMesh || !m.geometry.parameters || m.geometry.parameters.width == null) return; const w = (m.userData.boxW ?? m.geometry.parameters.width) / 2, h = m.geometry.parameters.height / 2;
      [[-w, -h], [w, -h], [w, h], [-w, h]].forEach(([a, b]) => { v.set(a, b, 0).applyMatrix4(m.matrixWorld).project(camera); const X = (v.x + 1) / 2 * W, Y = (1 - v.y) / 2 * H; x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }); });
    return { x0, y0, x1, y1 };
  }
  return { words, label, dyn, boxOf, measure };
}
