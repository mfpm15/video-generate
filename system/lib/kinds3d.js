// 3D illustrations ("visual.kind"): each builds a Group centred on (0,0), about 8 wide x 6 tall (world units), and an update(tl) that is a pure function of
// scene-local time. Kinds: network globe cable packets bars line steps neural icons ring orbit timeline compare
// returns { group, update(tl), labels[], events(t0) }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => x * x * (3 - 2 * x), eo = x => 1 - Math.pow(1 - x, 3), back = x => { const c = 1.8; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function makeKinds(env) {
  const { THREE, props, type, mats, P } = env, TAU = Math.PI * 2, acc = mats.accent;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), PCOL = i => [acc, mats.alt, '#dfe6f5', mats.alt2][i % 4];
  const glowMat = (c, k = 1.8) => mats.glow(c, k);
  const labOn = (parent, str, x, y, z, o = {}) => { const m = type.label(str, { px: o.px || 58, maxW: o.maxW || 3, color: o.color || P.fg, wt: o.wt || 800, stroke: o.stroke }); m.position.set(x, y, z); m.material.opacity = 0; parent.add(m); return m; };
  const newCtx = () => { const group = new THREE.Group(), labels = [], ups = []; return { group, labels, ups, add: (o, f) => { group.add(o); if (f) ups.push(f); return o; },
    lab(str, x, y, o = {}) { const m = type.label(str, { px: o.px || 58, maxW: o.maxW || 3.0, color: o.color || P.fg, wt: o.wt || 700, stroke: o.stroke }); m.position.set(x, y, o.z || 0); m.material.opacity = 0; group.add(m); labels.push(m); const at = o.at ?? 0.6; ups.push(tl => { const a = ss(seg(tl, at, at + .4)); m.material.opacity = a; m.position.y = y - (1 - a) * .25; }); return m; } }; };
  const KH = { network: 4.4, globe: 5.2, cable: 5.0, packets: 4.6, bars: 5.6, line: 5.0, steps: 5, neural: 4.6, icons: 4.2, ring: 4.8, orbit: 5.2, timeline: 5.0, compare: 4.4 };
  const finish = (c, events, h) => ({ group: c.group, labels: c.labels, h: h || 5.6, update: tl => c.ups.forEach(f => f(tl)), events: events || (() => []) });
  const tube = (curve, r, mat, segs = 48) => { const g = new THREE.TubeGeometry(curve, segs, r, 8, false), m = new THREE.Mesh(g, mat); m.userData.idx = g.index.count; return m; };
  const draw = (m, p) => m.geometry.setDrawRange(0, Math.floor(m.userData.idx * clamp(p) / 3) * 3);
  const pulse = (r = .1, k = 2.4) => new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), glowMat('#ffffff', 1.2));

  const K = {
    network(s) {
      const c = newCtx(), nodes = s.nodes || [{ icon: 'laptop', label: 'Perangkat' }, { icon: 'router', label: 'Router' }, { icon: 'cloud', label: 'Jaringan' }, { icon: 'server', label: 'Server' }], n = nodes.length, pts = nodes.map((_, i) => V(n === 1 ? 0 : -(n <= 3 ? 2.2 : 2.45) + (n <= 3 ? 4.4 : 4.9) * i / (n - 1), (i % 2 ? .8 : -.8), 0)), ps = n <= 3 ? 1.0 : n === 4 ? .72 : .6;
      const links = []; for (let i = 0; i < n - 1; i++) { const m = tube(new THREE.LineCurve3(pts[i], pts[i + 1]), .05, glowMat(PCOL(i), 1.3), 4); c.group.add(m); links.push(m); }
      c.ups.push(tl => links.forEach((m, i) => draw(m, seg(tl, .5 + i * .35, 1 + i * .35))));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .2), packs = []; for (let k = 0; k < (s.packets || 5); k++) { const p = pulse(.12); c.group.add(p); packs.push(p); }
      c.ups.push(tl => packs.forEach((p, k) => { const u = ((((tl - 1.2) * .2 + k / packs.length) % 1) + 1) % 1; p.visible = tl > 1.2; p.position.copy(curve.getPoint(u)); }));
      nodes.forEach((nd, i) => { const pr = props.make(nd.icon, PCOL(i)); pr.scale.setScalar(ps); pr.position.copy(pts[i]); c.group.add(pr); c.ups.push(tl => { const p = back(seg(tl, .25 + i * .3, .8 + i * .3)); pr.scale.setScalar(ps * Math.max(.001, p)); pr.rotation.y = Math.sin(tl * .9 + i) * .35; pr.position.y = pts[i].y + Math.sin(tl * 1.4 + i) * .08; pr.userData.tick && pr.userData.tick(tl); }); if (nd.label) c.lab(nd.label, pts[i].x, pts[i].y - 1.45 * (n <= 3 ? 1 : .8), { px: 56, maxW: Math.min(2.6, 4.6 / Math.max(1, n - 1) * .95), at: .5 + i * .3 }); });
      return finish(c, t0 => nodes.map((_, i) => ({ t: t0 + .5 + i * .3, type: 'pop' })));
    },
    globe(s) {
      const c = newCtx(), R = 2.2, pts = s.points || [[-6, 106], [35, -97], [51, 0], [35, 139], [-33, 151]], g = new THREE.Group(); c.group.add(g);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), mats.make(acc))); g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.005, 24, 16), new THREE.MeshBasicMaterial({ color: mats.edge(acc), wireframe: true, transparent: true, opacity: .35, toneMapped: false })));
      const sp = (la, lo, r) => { const a = la * Math.PI / 180, b = lo * Math.PI / 180; return V(Math.cos(a) * Math.sin(b) * r, Math.sin(a) * r, Math.cos(a) * Math.cos(b) * r); };
      const arcs = [], dots = []; pts.forEach(([la, lo], i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), glowMat(PCOL(i), 2)); d.position.copy(sp(la, lo, R * 1.01)); g.add(d); dots.push(d); });
      for (let i = 0; i < pts.length - 1; i++) { const a = sp(pts[i][0], pts[i][1], R * 1.01), b = sp(pts[i + 1][0], pts[i + 1][1], R * 1.01), mid = a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(R * (1.35 + a.distanceTo(b) * .07)), cu = new THREE.QuadraticBezierCurve3(a, mid, b), m = tube(cu, .035, glowMat(acc, 1.6), 40); g.add(m); const p = pulse(.09); g.add(p); arcs.push({ cu, m, p, i }); }
      c.ups.push(tl => { g.rotation.y = tl * .35 - .6; g.rotation.x = .25; const e = ss(seg(tl, .1, .9)); g.scale.setScalar(.2 + .8 * e); arcs.forEach(a => { draw(a.m, seg(tl, .6 + a.i * .35, 1.3 + a.i * .35)); a.p.position.copy(a.cu.getPoint(((tl * .35 + a.i * .27) % 1))); }); dots.forEach((d, i) => d.scale.setScalar(1 + .5 * Math.sin(tl * 3 + i))); });
      return finish(c, t0 => [{ t: t0 + .8, type: 'pop' }, { t: t0 + 1.8, type: 'ping' }]);
    },
    cable(s) {
      const c = newCtx(), geo = new THREE.PlaneGeometry(8, 7, 48, 40), sea = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color(acc).lerp(new THREE.Color('#06101c'), .6), roughness: .35, metalness: .2, transparent: true, opacity: .9, flatShading: true })); sea.rotation.x = -1.1; sea.position.set(0, -.6, -.5); c.group.add(sea);
      const base = geo.attributes.position.array.slice(); const cab = new THREE.CatmullRomCurve3([V(-3.4, -.2, 1), V(-1.5, -1.3, 1.3), V(.3, -.1, 1.2), V(2, -1.2, 1.3), V(3.4, -.3, 1)]), cm = tube(cab, .09, glowMat(acc, 1.4), 60); c.group.add(cm); const ps = [0, 1, 2].map(() => { const p = pulse(.15); c.group.add(p); return p; });
      [-3.4, 3.4].forEach((x, i) => { const g = props.make('globe', acc); g.scale.setScalar(.7); g.position.set(x, 1.6, 1); c.group.add(g); c.ups.push(tl => { g.userData.tick(tl); g.scale.setScalar(.7 * Math.max(.001, back(seg(tl, .3 + i * .2, .8 + i * .2)))); }); });
      c.ups.push(tl => { const a = geo.attributes.position; for (let i = 0; i < a.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; a.array[i * 3 + 2] = Math.sin(x * 1.1 + tl * 1.2) * .22 + Math.cos(y * 1.3 + tl * .9) * .18; } a.needsUpdate = true; geo.computeVertexNormals(); draw(cm, seg(tl, .3, 1.3)); ps.forEach((p, k) => { p.position.copy(cab.getPoint(((tl * .22 + k / 3) % 1))); p.visible = tl > 1.2; }); });
      return finish(c, t0 => [{ t: t0 + .5, type: 'pop' }, { t: t0 + 1.6, type: 'ping' }]);
    },
    packets(s) {
      const c = newCtx(), N = 27, cubes = [], A = V(-2.4, 0, 0), B = V(2.4, 0, 0), cell = .62;
      for (let i = 0; i < N; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.52, .52, .52), i % 5 === 0 ? glowMat(acc, 1.5) : mats.make(i % 2 ? '#cfd6e6' : acc)); c.group.add(m); cubes.push(m); }
      const a = props.make('laptop', acc), b = props.make('server', acc); a.scale.setScalar(.6); b.scale.setScalar(.6); a.position.set(-2.4, 1.9, 0); b.position.set(2.4, 1.9, 0); c.group.add(a, b);
      c.ups.push(tl => { const cyc = 5.2, u = (tl % cyc) / cyc, sp = ss(seg(u, .12, .3)), mv = ss(seg(u, .3, .64)), as = ss(seg(u, .64, .86)); cubes.forEach((m, i) => { const x = i % 3 - 1, y = Math.floor(i / 3) % 3 - 1, z = Math.floor(i / 9) - 1, off = V(x, y, z).multiplyScalar(cell), sc = hash(i + 3);
        const start = A.clone().add(off.clone().multiplyScalar(1 + sp * 1.2)), end = B.clone().add(off.clone().multiplyScalar(1 + (1 - as) * 1.2)), k = ss(clamp(mv * 1.25 - sc * .25)), p = start.lerp(end, k); p.y += Math.sin(Math.PI * k) * (.5 + sc * .9) * (i % 2 ? -1 : 1); p.z += Math.sin(Math.PI * k) * 1.5 * (sc - .5); m.position.copy(p); m.rotation.set(k * 6 * sc, k * 5, 0); const e = back(seg(tl, .1 + i * .02, .5 + i * .02)); m.scale.setScalar(Math.max(.001, e)); }); });
      return finish(c, t0 => [{ t: t0 + 1.6, type: 'ping' }, { t: t0 + 3.1, type: 'ping' }]);
    },
    bars(s) {
      const c = newCtx(), vals = s.values || [30, 55, 80, 100], n = vals.length, mx = Math.max(...vals), w = Math.min(1.3, 6 / n * .7), bars = [];
      vals.forEach((v, i) => { const x = (i - (n - 1) / 2) * (6.6 / Math.max(1, n - 1 || 1)) * (n > 1 ? 1 : 0), last = i === n - 1, m = new THREE.Mesh(new RoundedBoxGeometryShim(THREE, w, 1, w), last ? glowMat(acc, 1.5) : mats.make(i % 2 ? mats.alt : '#cfd6e6')); m.position.x = x; c.group.add(m); bars.push(m);
        c.ups.push(tl => { const p = eo(seg(tl, .3 + i * .25, 1.1 + i * .25)), h = Math.max(.001, 3.2 * v / mx * p); m.scale.y = h; m.position.y = -2.0 + h / 2; }); c.lab(String(s.labels?.[i] ?? v), x, -2.45, { px: 40, maxW: w * 1.8, at: .5 + i * .25 }); });
      return finish(c, t0 => vals.map((_, i) => ({ t: t0 + .5 + i * .25, type: 'pop' })));
    },
    line(s) {
      const c = newCtx(), vals = s.values || [10, 18, 16, 30, 44, 70, 100], mx = Math.max(...vals), pts = vals.map((v, i) => V(-3.4 + 6.8 * i / (vals.length - 1), -2 + 4.4 * v / mx, 0)), cu = new THREE.CatmullRomCurve3(pts), m = tube(cu, .08, glowMat(acc, 1.6), 80), hd = pulse(.18); c.group.add(m, hd);
      for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(7.2, .012, .01), new THREE.MeshBasicMaterial({ color: P.fg, transparent: true, opacity: .15, toneMapped: false })); l.position.y = -2 + i * 1.1; c.group.add(l); }
      c.ups.push(tl => { const p = eo(seg(tl, .3, 2)); draw(m, p); hd.position.copy(cu.getPoint(p)); });
      return finish(c, t0 => [{ t: t0 + 1.2, type: 'ping' }]);
    },
    steps(s) {
      const c = newCtx(), it = s.items || ['Langkah 1', 'Langkah 2', 'Langkah 3'], n = it.length, gap = Math.min(1.2, 4.8 / n), slabs = [];
      it.forEach((tx, i) => { const y = (n - 1) / 2 * gap - i * gap, m = new THREE.Mesh(new RoundedBoxGeometryShim(THREE, 6.6, gap * .8, .5, .18), mats.make(P.light ? '#ffffff' : '#252c42')); m.position.set(0, y, 0); c.group.add(m); slabs.push(m);
        if (mats.outline) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), new THREE.LineBasicMaterial({ color: mats.edge(acc), toneMapped: false })));
        const num = labOn(m, String(i + 1), -2.5, 0, .3, { px: 90, wt: 900, color: '#' + acc.getHexString(), maxW: .9 }), lb = labOn(m, tx, .3, 0, .3, { px: 66, maxW: 4.6, color: P.light ? P.fg : '#ffffff' }); c.labels.push(lb); c.ups.push(tl => { const a = ss(seg(tl, .5 + i * .75, .9 + i * .75)); num.material.opacity = a; lb.material.opacity = a; });
        if (i < n - 1) { const ar = new THREE.Mesh(new THREE.ConeGeometry(.16, .3, 3), glowMat(acc, 1.6)); ar.rotation.z = Math.PI; ar.position.set(0, y - gap * .5, .1); c.group.add(ar); c.ups.push(tl => ar.visible = tl > .9 + i * .75); }
        c.ups.push(tl => { const p = back(seg(tl, .4 + i * .75, .95 + i * .75)), act = tl > .6 + i * .75; m.scale.setScalar(Math.max(.001, p)); m.position.z = act ? .25 : 0; m.material.emissive && m.material.emissive.copy(acc).multiplyScalar(act ? .25 : 0); m.rotation.x = (1 - p) * .8; }); });
      return finish(c, t0 => it.map((_, i) => ({ t: t0 + .7 + i * .75, type: 'pop' })));
    },
    neural(s) {
      const c = newCtx(), L = s.layers || [3, 5, 5, 2], pos = L.map((n, li) => Array.from({ length: n }, (_, i) => V(-3.2 + 6.4 * li / (L.length - 1), (i - (n - 1) / 2) * 1.0, (hash(li * 9 + i) - .5) * .8)));
      const lines = []; for (let li = 0; li < L.length - 1; li++) pos[li].forEach(a => pos[li + 1].forEach(b => { const g = new THREE.BufferGeometry().setFromPoints([a, b]); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: mats.edge(acc), transparent: true, opacity: .25, toneMapped: false })); c.group.add(l); lines.push(l); }));
      const nodes = []; pos.forEach((col, li) => col.forEach((p, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 16), li === L.length - 1 ? glowMat(acc, 1.6) : mats.make('#cfd6e6')); m.position.copy(p); c.group.add(m); nodes.push({ m, li }); }));
      const ps = Array.from({ length: 8 }, () => { const p = pulse(.1); c.group.add(p); return p; });
      c.ups.push(tl => { nodes.forEach(({ m, li }) => m.scale.setScalar(Math.max(.001, back(seg(tl, .2 + li * .15, .6 + li * .15))))); ps.forEach((p, k) => { const t0 = (tl * .8 + k * .41) % (L.length - 1), li = Math.floor(t0), u = t0 - li, a = pos[li][Math.floor(hash(k * 7 + Math.floor(tl * .8 / (L.length - 1) + k)) * L[li])], b = pos[li + 1][Math.floor(hash(k * 13 + li + Math.floor(tl)) * L[li + 1])]; p.position.lerpVectors(a, b, u); p.visible = tl > .8; }); });
      return finish(c, t0 => [{ t: t0 + 1.2, type: 'ping' }]);
    },
    icons(s) {
      const c = newCtx(), it = s.items || [{ icon: 'star', label: 'Satu' }, { icon: 'bolt', label: 'Dua' }, { icon: 'heart', label: 'Tiga' }], n = it.length, rows = n > 3 ? 2 : 1, cols = Math.ceil(n / rows), sx = Math.min(2.8, 7.4 / cols), sy = 3.2;
      it.forEach((q, i) => { const col = i % cols, row = Math.floor(i / cols), x = (col - (cols - 1) / 2) * sx, y = rows === 1 ? .3 : 1.6 - row * sy, pr = props.make(q.icon, i === n - 1 ? acc : PCOL(i + 1)); const sc = Math.min(1.5, sx * .5); pr.position.set(x, y, 0); c.group.add(pr);
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(sc * 1.1, sc * 1.25, .12, 40), mats.make('#cfd6e6')); pad.position.set(x, y - sc * 1.15, 0); c.group.add(pad); const rg = new THREE.Mesh(new THREE.TorusGeometry(sc * 1.18, .035, 8, 60), glowMat(acc, 1.6)); rg.rotation.x = Math.PI / 2; rg.position.set(x, y - sc * 1.1, 0); c.group.add(rg);
        c.ups.push(tl => { const p = back(seg(tl, .3 + i * .2, .85 + i * .2)); pr.scale.setScalar(Math.max(.001, p) * sc); pr.position.y = y + Math.sin(tl * 1.5 + i) * .12 + (1 - p) * 1.2; pr.rotation.y = Math.sin(tl * .8 + i) * .5; pr.userData.tick && pr.userData.tick(tl); pad.scale.setScalar(Math.max(.001, p)); rg.scale.setScalar(Math.max(.001, p)); rg.rotation.z = tl; });
        if (q.label) c.lab(q.label, x, y - sc * 1.9, { px: 58, maxW: sx * .95, at: .5 + i * .2 }); });
      return finish(c, t0 => it.map((_, i) => ({ t: t0 + .5 + i * .2, type: 'pop' })));
    },
    ring(s) {
      const c = newCtx(), v = s.value ?? 75, R = 2.2, bg = new THREE.Mesh(new THREE.TorusGeometry(R, .26, 16, 80), mats.make('#cfd6e6')); c.group.add(bg); let arc = new THREE.Mesh(new THREE.TorusGeometry(R, .3, 16, 80, .01), glowMat(acc, 1.5)); c.group.add(arc); const num = type.dyn({ px: 190, maxW: 3.4, color: '#' + acc.getHexString() }); c.group.add(num.group);
      c.ups.push(tl => { const p = eo(seg(tl, .3, 1.8)); c.group.remove(arc); arc.geometry.dispose(); arc = new THREE.Mesh(new THREE.TorusGeometry(R, .3, 16, 80, Math.max(.01, TAU * v / 100 * p)), glowMat(acc, 1.5)); arc.rotation.z = Math.PI / 2; arc.scale.x = -1; c.group.add(arc); num.set(Math.round(v * p) + (s.suffix ?? '%')); });
      return finish(c, t0 => [{ t: t0 + 1.2, type: 'ping' }]);
    },
    orbit(s) {
      const c = newCtx(), it = s.items || ['star', 'bolt', 'heart', 'chat', 'cloud'], ctr = props.make(s.center || 'globe', acc); ctr.scale.setScalar(1.4); c.group.add(ctr);
      [2.4, 1.5].forEach((r, i) => { const rg = new THREE.Mesh(new THREE.TorusGeometry(r, .02, 8, 90), glowMat(acc, 1.2)); rg.rotation.x = 1.25; rg.rotation.y = i * .3; c.group.add(rg); });
      const orb = it.map((nm, i) => { const pr = props.make(typeof nm === 'string' ? nm : nm.icon, PCOL(i)); pr.scale.setScalar(.7); c.group.add(pr); return pr; });
      c.ups.push(tl => { ctr.rotation.y = tl * .5; ctr.userData.tick && ctr.userData.tick(tl); ctr.scale.setScalar(1.4 * Math.max(.001, back(seg(tl, .1, .7)))); orb.forEach((pr, i) => { const a = tl * .5 + i * TAU / orb.length, p = back(seg(tl, .3 + i * .15, .8 + i * .15)); pr.position.set(Math.cos(a) * 2.4, Math.sin(a) * 2.4 * Math.sin(1.25) * .5, Math.sin(a) * 2.4 * Math.cos(1.25)); pr.scale.setScalar(.7 * Math.max(.001, p)); pr.rotation.y = tl; pr.userData.tick && pr.userData.tick(tl); }); });
      return finish(c, t0 => it.map((_, i) => ({ t: t0 + .5 + i * .15, type: 'pop' })));
    },
    timeline(s) {
      const c = newCtx(), it = s.items || ['Awal', 'Tengah', 'Akhir'], n = it.length, dy = Math.min(1.2, 3.6 / Math.max(1, n - 1)), y0 = (n - 1) / 2 * dy, line = new THREE.Mesh(new THREE.BoxGeometry(.06, (n - 1) * dy + .4, .06), glowMat('#ffffff', .6)); line.position.set(-2.2, 0, 0); c.group.add(line);
      const fill = new THREE.Mesh(new THREE.BoxGeometry(.1, 1, .1), glowMat(acc, 1.6)); c.group.add(fill); c.ups.push(tl => { const p = ss(seg(tl, .2, .9 + n * .35)), h = Math.max(.001, ((n - 1) * dy + .2) * p); fill.scale.y = h; fill.position.set(-2.2, y0 - h / 2, 0); });
      it.forEach((tx, i) => { const y = y0 - i * dy, d = new THREE.Mesh(new THREE.SphereGeometry(.28, 20, 16), glowMat(acc, 1.8)); d.position.set(-2.2, y, 0); c.group.add(d); c.ups.push(tl => d.scale.setScalar(Math.max(.001, back(seg(tl, .4 + i * .35, .9 + i * .35))))); c.lab(tx, .9, y, { px: 62, maxW: 5, at: .5 + i * .35 }); });
      return finish(c, t0 => it.map((_, i) => ({ t: t0 + .6 + i * .35, type: 'pop' })));
    },
    compare(s) {
      const c = newCtx(), cards = [s.left || { title: 'Sebelum', items: ['A'] }, s.right || { title: 'Sesudah', items: ['B'] }], w = 3.7, hh = 3.9;
      cards.forEach((cd, k) => { const x = k ? 2.15 : -2.15, acc2 = k === 1, m = new THREE.Mesh(new RoundedBoxGeometryShim(THREE, w, hh, .35, .2), mats.make(acc2 ? acc : (P.light ? '#ffffff' : '#252c42'))); m.position.set(x, 0, 0); c.group.add(m);
        c.ups.push(tl => { const p = back(seg(tl, .3 + k * .4, .9 + k * .4)); m.scale.setScalar(Math.max(.001, p)); m.rotation.y = (k ? -1 : 1) * (.28 * (1 - p) + .07 * Math.sin(tl * .8)); m.position.z = acc2 ? .3 : 0; });
        const tc = acc2 ? '#ffffff' : (P.light ? P.fg : '#ffffff'), tt = labOn(m, cd.title, 0, 1.6, .24, { px: 66, maxW: w * .85, color: tc }); c.labels.push(tt); c.ups.push(tl => tt.material.opacity = ss(seg(tl, .6 + k * .4, 1 + k * .4))); (cd.items || []).forEach((t, i) => { const li = labOn(m, t, 0, .4 - i * .95, .24, { px: 56, maxW: w * .85, color: tc }); c.labels.push(li); c.ups.push(tl => li.material.opacity = ss(seg(tl, .9 + k * .4 + i * .25, 1.3 + k * .4 + i * .25))); }); });
      return finish(c, t0 => [{ t: t0 + .6, type: 'pop' }, { t: t0 + 1.0, type: 'pop' }]);
    },
  };
  const evs = (spec, t0) => { const e = [], at = (t, ty) => e.push({ t: +(t0 + t).toFixed(3), type: ty }), n = (spec.items || spec.nodes || spec.values || []).length;
    switch (spec.kind) { case 'network': (spec.nodes || [1, 2, 3, 4]).forEach((_, i) => at(.5 + i * .3, 'pop')); break; case 'globe': at(.8, 'pop'); at(1.8, 'ping'); break; case 'cable': at(.5, 'pop'); at(1.6, 'ping'); break;
      case 'icons': for (let i = 0; i < (spec.items || [1, 2, 3]).length; i++) at(.5 + i * .2, 'pop'); break; case 'orbit': for (let i = 0; i < (spec.items || [1, 2, 3, 4, 5]).length; i++) at(.5 + i * .15, 'pop'); break;
      case 'bars': (spec.values || [1, 2, 3, 4]).forEach((_, i) => at(.5 + i * .25, 'pop')); break; case 'steps': (spec.items || [1, 2, 3]).forEach((_, i) => at(.7 + i * .75, 'pop')); break; case 'timeline': (spec.items || [1, 2, 3]).forEach((_, i) => at(.6 + i * .35, 'pop')); break;
      case 'compare': at(.6, 'pop'); at(1.0, 'pop'); break; case 'packets': at(1.6, 'ping'); at(3.1, 'ping'); break; default: if (n || spec.kind) at(1.2, 'ping'); } return e; };
  return { events: evs, build(spec) { const f = K[spec.kind], r = f ? f(spec) : K.icons({ items: [{ icon: 'star', label: '' }] }); r.h = spec.kind === 'icons' ? ((spec.items || []).length > 3 ? 7.2 : 4.2) : (spec.kind === 'steps' ? Math.min(1.2, 4.8 / (spec.items || [1, 2, 3]).length) * (spec.items || [1, 2, 3]).length + .3 : spec.kind === 'timeline' ? Math.min(1.2, 3.6 / Math.max(1, (spec.items || [1, 2, 3]).length - 1)) * ((spec.items || [1, 2, 3]).length - 1) + .9 : (KH[spec.kind] || 5.6)); return r; }, kinds: Object.keys(K) };
}
// RoundedBox without importing another module in this file: built from the geometry class the engine hands us
import { RoundedBoxGeometry as RBG } from 'three/addons/geometries/RoundedBoxGeometry.js';
function RoundedBoxGeometryShim(THREE, w, h, d, r = .1) { return new RBG(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)); }
