// Worlds: four genuinely different 3D sets (lighting, materials, background motion), each tinted by the film's palette and varied by a per-film seed.
//   neon    dark cyber: receding neon grid floor, light pillars, wire floaters, rising sparks
//   glass   bright soft studio: gradient dome, bokeh, floating glossy slabs, clear-coat materials
//   clay    playful matte pastel: bobbing clay blobs, confetti, soft ground
//   cosmos  cinematic dark: light shafts, giant slow rings, dust in depth
// makeWorld(env) -> { mats, update(t), bloom:{strength,radius,threshold}, light }
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const WORLD_NAMES = ['neon', 'glass', 'clay', 'cosmos'];
const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

export function makeWorld(env) {
  const { THREE, scene, renderer, P, kind, seed } = env, R = rng(seed || 1), acc = new THREE.Color(P.accent), hsl = {}; acc.getHSL(hsl);
  const hueShift0 = d => new THREE.Color().setHSL((hsl.h + d + 1) % 1, Math.min(1, hsl.s * .9 + .1), .55);
  const hueShift = d => (d === .5 && P.alt) ? new THREE.Color(P.alt) : (d === .12 && P.alt2) ? new THREE.Color(P.alt2) : hueShift0(d);   // the Art Director's palette wins when present
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const root = new THREE.Group(); scene.add(root); const upd = [];
  const light = (c, i, x, y, z) => { const l = new THREE.DirectionalLight(c, i); l.position.set(x, y, z); scene.add(l); return l; };
  const radial = (stops, size = 128) => { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const points = (n, spread, size, col, op = 1) => { const g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = (R() - .5) * spread[0]; a[i * 3 + 1] = (R() - .5) * spread[1]; a[i * 3 + 2] = -R() * spread[2]; } g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    const m = new THREE.PointsMaterial({ color: col, size, map: radial([[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']], 32), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false }); const p = new THREE.Points(g, m); return { p, a, n }; };
  let mats, bloom, lightMode = false;

  if (kind === 'neon') {
    scene.background = new THREE.Color(P.bg1); scene.fog = new THREE.Fog(P.bg1, 28, 80); bloom = { strength: .6, radius: .5, threshold: .62 };
    scene.add(new THREE.AmbientLight(0x8899ff, .35)); light(0xffffff, 1.6, 4, 8, 10); light(acc.clone(), 1.4, -6, 2, -4);
    const grid = new THREE.GridHelper(120, 120, acc, acc.clone().multiplyScalar(.45)); grid.position.y = -9.5; grid.material.transparent = true; grid.material.opacity = .55; grid.material.toneMapped = false; root.add(grid); upd.push(t => { grid.position.z = (t * (3 + R() * 0)) % 1; });
    const ceil = grid.clone(); ceil.position.y = 14; root.add(ceil);
    const beams = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.07, 40, .07), new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? hueShift(.5) : acc, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false })); m.position.set((R() - .5) * 26, 0, -8 - R() * 30); root.add(m); beams.push(m); }
    upd.push(t => beams.forEach((b, i) => { b.material.opacity = .15 + .35 * (.5 + .5 * Math.sin(t * 1.4 + i * 1.7)); }));
    const fl = []; for (let i = 0; i < 12; i++) { const g = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1), new THREE.TorusGeometry(1, .25, 6, 12)][i % 3], m = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: i % 3 ? acc : hueShift(.5), transparent: true, opacity: .8, toneMapped: false })); m.position.set((R() - .5) * 20, (R() - .5) * 22, -9 - R() * 16); m.scale.setScalar(.7 + R() * 1.6); root.add(m); fl.push(m); }
    upd.push(t => fl.forEach((m, i) => { m.rotation.set(t * .3 + i, t * .22 + i * 2, 0); m.position.y += Math.sin(t + i) * .002; }));
    const sp = points(260, [26, 40, 30], .22, acc.clone().multiplyScalar(1.4), .9); root.add(sp.p); upd.push(t => sp.p.position.y = (t * 1.2) % 40 - 20 + 0 * 1);
    mats = { kind, outline: true, make: c => new THREE.MeshStandardMaterial({ color: new THREE.Color('#2a3350').lerp(new THREE.Color(c), .3), metalness: .7, roughness: .3, emissive: new THREE.Color(c).multiplyScalar(.28), envMapIntensity: 1.4 }), edge: c => new THREE.Color(c).multiplyScalar(1.7) };
  }
  if (kind === 'glass') {
    lightMode = true; const top = new THREE.Color().setHSL(hsl.h, .5, .74), bot = new THREE.Color().setHSL((hsl.h + .07) % 1, .62, .52); const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#' + top.getHexString()); gr.addColorStop(1, '#' + bot.getHexString()); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const bt = new THREE.CanvasTexture(c); bt.colorSpace = THREE.SRGBColorSpace; scene.background = bt; bloom = { strength: .28, radius: .9, threshold: .85 };
    scene.add(new THREE.AmbientLight(0xffffff, .45)); light(0xffffff, 1.5, 3, 9, 8); light(0xbfd4ff, .6, -8, 3, 4);
    const bk = []; for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,255,255,.7)'], [.7, 'rgba(255,255,255,.25)'], [1, 'rgba(255,255,255,0)']]), color: i % 3 ? 0xffffff : hueShift(.08), transparent: true, opacity: .18 + R() * .25, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set((R() - .5) * 18, (R() - .5) * 28, -6 - R() * 14); s.scale.setScalar(1.5 + R() * 4.5); s.userData = { x: s.position.x, y: s.position.y, p: R() * 6 }; root.add(s); bk.push(s); }
    upd.push(t => bk.forEach(s => { s.position.y = s.userData.y + Math.sin(t * .35 + s.userData.p) * 1.1; s.position.x = s.userData.x + Math.cos(t * .27 + s.userData.p) * .7; }));
    const slabs = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(2 + R() * 2, 2 + R() * 3, .35), new THREE.MeshPhysicalMaterial({ color: i % 2 ? 0xffffff : hueShift(.05), roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, transparent: true, opacity: .55, envMapIntensity: 1.6 })); m.position.set((R() - .5) * 14, (R() - .5) * 22, -8 - R() * 8); root.add(m); slabs.push(m); }
    upd.push(t => slabs.forEach((m, i) => { m.rotation.set(t * .12 + i, t * .17 + i * 1.3, t * .08); m.position.y += Math.sin(t * .6 + i) * .003; }));
    mats = { kind, outline: false, make: c => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c).lerp(new THREE.Color(0xffffff), .25), roughness: .14, metalness: .05, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.5 }), edge: c => new THREE.Color(c) };
  }
  if (kind === 'clay') {
    lightMode = true; scene.background = new THREE.Color().setHSL(hsl.h, .55, .72); scene.fog = new THREE.Fog('#' + new THREE.Color().setHSL(hsl.h, .55, .72).getHexString(), 30, 70); bloom = { strength: .12, radius: .9, threshold: .9 };
    scene.add(new THREE.AmbientLight(0xfff2e6, .55)); light(0xffffff, 1.5, 5, 10, 9); light(0xffd9c2, .5, -6, 2, 5);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hsl.h, .5, .62), roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -9.5; root.add(floor);
    const bl = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL((hsl.h + R() * .35) % 1, .6, .66), roughness: .9 })); m.position.set((R() - .5) * 18, (R() - .5) * 24, -7 - R() * 12); m.scale.setScalar(.8 + R() * 2.2); m.userData = { y: m.position.y, p: R() * 6, s: m.scale.x }; root.add(m); bl.push(m); }
    upd.push(t => bl.forEach((m, i) => { m.position.y = m.userData.y + Math.sin(t * .7 + m.userData.p) * .8; const q = 1 + .06 * Math.sin(t * 1.6 + i); m.scale.set(m.userData.s * q, m.userData.s / q, m.userData.s * q); }));
    const cf = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.18, .32, .03), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL((hsl.h + R()) % 1, .75, .6), roughness: .7 })); m.position.set((R() - .5) * 16, R() * 24 - 12, -2 - R() * 10); m.userData = { y: m.position.y, v: .4 + R() * .8, p: R() * 6 }; root.add(m); cf.push(m); }
    upd.push(t => cf.forEach((m, i) => { m.position.y = 12 - (((12 - m.userData.y) + t * m.userData.v) % 24); m.rotation.set(t * 1.5 + i, t + i, t * .8); }));
    mats = { kind, outline: false, make: c => new THREE.MeshStandardMaterial({ color: new THREE.Color(c).lerp(new THREE.Color(0xffffff), .12), roughness: .82, metalness: 0, envMapIntensity: .5 }), edge: c => new THREE.Color(c) };
  }
  if (kind === 'cosmos') {
    scene.background = new THREE.Color(P.bg1); scene.fog = new THREE.FogExp2(P.bg1, .018); bloom = { strength: .5, radius: .6, threshold: .7 };
    scene.add(new THREE.AmbientLight(0x6677aa, .35)); light(0xffffff, 1.5, 5, 6, 8); light(acc.clone(), 1.6, -7, 3, -3);
    const shafts = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.2, 4 + R() * 3, 46, 24, 1, true), new THREE.MeshBasicMaterial({ color: acc, transparent: true, opacity: .035, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.position.set((R() - .5) * 18, 12, -10 - R() * 10); m.rotation.z = (R() - .5) * .7; root.add(m); shafts.push(m); }
    upd.push(t => shafts.forEach((m, i) => { m.rotation.z += Math.sin(t * .3 + i) * .0007; m.material.opacity = .02 + .035 * (.5 + .5 * Math.sin(t * .8 + i * 2)); }));
    const rings = []; for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(7 + i * 4, .025, 8, 120), new THREE.MeshBasicMaterial({ color: acc, transparent: true, opacity: .22, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set((R() - .5) * 6, (R() - .5) * 10, -16 - i * 3); m.rotation.set(1.1 + i * .3, 0, i); root.add(m); rings.push(m); }
    upd.push(t => rings.forEach((m, i) => { m.rotation.z = t * (.12 + i * .05) * (i % 2 ? -1 : 1); }));
    const dust = points(380, [30, 36, 40], .14, 0xffffff, .55); root.add(dust.p); upd.push(t => { dust.p.position.y = (t * .35) % 6; dust.p.position.x = Math.sin(t * .2) * .8; });
    mats = { kind, outline: true, make: c => new THREE.MeshStandardMaterial({ color: new THREE.Color('#3a4052').lerp(new THREE.Color(c), .45), metalness: .75, roughness: .32, emissive: new THREE.Color(c).multiplyScalar(.22), envMapIntensity: 1.6 }), edge: c => new THREE.Color(c).multiplyScalar(1.2) };
  }
  mats.accent = acc; mats.alt = hueShift(.5); mats.alt2 = hueShift(.12); mats.light = lightMode;
  mats.glow = (c, k = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false, fog: false });
  return { mats, bloom, light: lightMode, update: t => upd.forEach(f => f(t)) };
}
