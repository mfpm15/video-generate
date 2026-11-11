// e3d: the 3D short-form engine (9:16). film.json: { world: neon|glass|clay|cosmos, palette, caption: pop|impact|kinetic|karaoke, series, thumb }, lines.json scenes as before.
// Everything is a pure function of t (window.render). three.js + the library's post stack (bloom; DOF/AO off for speed), 2D overlay only for captions / badge / progress.
// scene types: title statement number list quote  (+ visual:{kind,...}, see kinds3d.js).  ?thumb=1&v=1|2|3 renders the 3D thumbnail.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { makeWorld } from './worlds.js';
import { makeProps } from './props3d.js';
import { makeKinds } from './kinds3d.js';
import { makeType } from './type3d.js';
import { drawShortCaption } from './captionsShort.js';
import { loadBrand, drawBrand } from './brand.js';

const F = await (await fetch('film.json')).json(), TL = await (await fetch('timeline.json')).json(), Q = new URLSearchParams(location.search), THUMB = Q.get('thumb') === '1';
const W = innerWidth, H = innerHeight, PXU = H / 16, FOV = 30, Z0 = (H / PXU / 2) / Math.tan(FOV * Math.PI / 360);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), eo = x => 1 - Math.pow(1 - x, 3), ss = x => x * x * (3 - 2 * x);
const strHash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const kind = Q.get('world') || F.world || 'neon', LIGHT = kind === 'glass' || kind === 'clay', seed = strHash(F.slug || F.title || 'x');
const P = { accent: '#B7F34A', bg1: '#0A0B0F', bg2: '#181B26', ...(F.palette || {}) }; if (Q.get('accent')) P.accent = '#' + Q.get('accent'); P.light = LIGHT; P.fg = LIGHT ? '#14162B' : '#F4F6FB'; P.dim = LIGHT ? '#4B4F72' : '#B4BBD0'; P.extrude = LIGHT ? '#1a1d3a' : '#000000'; P.family = 'Inter, sans-serif';
const BR = await loadBrand();
await Promise.all(['400 40px Inter', '600 40px Inter', '700 40px Inter', '800 40px Inter', '900 40px Inter', '900 100px InterTight', '800 100px InterTight'].map(f => document.fonts.load(f))); await document.fonts.ready;

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NoToneMapping; renderer.domElement.style.cssText = 'position:absolute;left:0;top:0'; document.body.appendChild(renderer.domElement);
const ov = document.createElement('canvas'); ov.width = W; ov.height = H; ov.style.cssText = 'position:absolute;left:0;top:0'; document.body.appendChild(ov); const g2 = ov.getContext('2d');
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV, W / H, .1, 300); camera.position.set(0, 0, Z0);
const world = makeWorld({ THREE, scene, renderer, P, kind, seed }), props = makeProps({ THREE, mats: world.mats }), type = makeType({ THREE, P, PXU, fontFam: 'InterTight, Inter, sans-serif', camera, W, H }), kinds = makeKinds({ THREE, props, type, mats: world.mats, P });
const HQ = Q.get('hq') === '1';   // ambient occlusion + depth of field + grade (cost about +35 % render time and less stable on the Intel iGPU with 3 workers); opt-in with ?hq=1, off by default
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: HQ, aoAmt: .55, aoRadius: .5 }); post.dof.maxCoc = HQ ? 7 : 0; post.dof.focus = Z0; post.dof.aper = 3.2; post.vig.uniforms.contrast.value = HQ ? .12 : 0; post.vig.uniforms.sat.value = HQ ? 1.08 : 1; post.vig.uniforms.amt.value = LIGHT ? .18 : .45; Object.assign(post.bloom, { strength: world.bloom.strength, radius: world.bloom.radius, threshold: world.bloom.threshold });
const BASE_BLOOM = world.bloom.strength; window.DUR = TL.dur;
const strip = s => s.replace(/\*/g, ''), HC = LIGHT ? '#ffffff' : P.fg;

// ───────────── scene building ─────────────
function setAlpha(S, a) { S.mats.forEach(m => { if (m.userData.b === undefined) m.userData.b = m.opacity; m.opacity = m.userData.b * a; }); }
function collectMats(group) { const set = new Set(); group.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.transparent = true; set.add(m); }); }); return [...set]; }
function placeVisual(v, yTop) { const bottom = -1.7, avail = yTop - bottom, s2 = clamp(avail / v.h, .5, 1.0); v.group.scale.setScalar(s2); v.group.position.set(0, yTop - v.h * s2 / 2, 0); return s2; }
function buildScene(S, i) {
  const sc = S.scene || { type: 'statement', head: TL.voice[S.line ?? i].text }, type_ = sc.type || 'statement', group = new THREE.Group(), blocks = [], texts = [], ups = []; group.visible = false; scene.add(group);
  const add = (b, id, delay = 0) => { group.add(b.group); blocks.push({ b, delay }); texts.push({ id, text: b.text, obj: b.group, pass: false }); return b; };
  const hasVis = !!sc.visual && ['title', 'statement', 'quote'].includes(type_);
  const mkHead = (str, px0, y) => { let b = type.words(str, { px: px0, maxW: 6.6, y, extrude: 6, id: S.id + 'h', color: HC }); if (b.height / (px0 * 1.12 / PXU) > 2.1 && px0 > 90) b = type.words(str, { px: Math.round(px0 * .82), maxW: 6.6, y, extrude: 6, id: S.id + 'h', color: HC }); return b; };
  let yTop = 5.3;
  if (type_ === 'number') {
    const full = (sc.prefix || '') + sc.value.toLocaleString('id-ID') + (sc.suffix || ''), num = type.dyn({ px: 300, maxW: 7.6, color: P.accent, extrude: 8 }); num.group.position.set(0, 3.5, 0); group.add(num.group); num.set(full);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, .03, 8, 120), world.mats.glow(P.accent, 1.5)); ring.position.set(0, 3.5, -1); group.add(ring); const ring2 = ring.clone(); ring2.scale.setScalar(1.12); group.add(ring2);
    ups.push(tl => { const k = eo(seg(tl, .2, 1.6)), cur = Math.round(sc.value * k); num.set((sc.prefix || '') + cur.toLocaleString('id-ID') + (sc.suffix || '')); const p = ss(seg(tl, .05, .5)); num.group.scale.setScalar(.3 + .7 * p + .04 * Math.sin(tl * 2)); num.group.rotation.y = Math.sin(tl * .7) * .12; ring.rotation.set(1.2, 0, tl * .4); ring2.rotation.set(1.2, .4, -tl * .3); });
    texts.push({ id: S.id + 'n', text: full, obj: num.group, pass: false, fixed: true });
    if (sc.label) { const lb = type.words(sc.label, { px: 56, wt: 700, color: P.fg, maxW: 7.0, y: 1.3, extrude: 0, id: S.id + 'l', stagger: .06 }); group.add(lb.group); blocks.push({ b: lb, delay: .7 }); texts.push({ id: S.id + 'l', text: lb.text, obj: lb.group, pass: false }); }
  } else if (type_ === 'quote') {
    const q = type.words('“', { px: 330, y: 5.2, color: P.accent, accent: P.accent, maxW: 3, extrude: 8, id: S.id + 'q' }); group.add(q.group); blocks.push({ b: q, delay: 0 });
    const h = type.words(sc.head, { px: 96, maxW: 7.5, y: 3.7, extrude: 5, id: S.id + 'h', color: HC }); add(h, S.id + 'h', .25); let yy = 3.7 - h.height - .2;
    if (sc.by) { const by = type.words('— ' + sc.by, { px: 52, wt: 600, color: P.dim, maxW: 7, y: yy, extrude: 0, id: S.id + 'b' }); add(by, S.id + 'b', 1.0); }
    if (hasVis) { const v = kinds.build(sc.visual); placeVisual(v, yy - .1); group.add(v.group); ups.push(tl => v.update(tl)); texts.push(...v.labels.map((m, k) => ({ id: S.id + 'vl' + k, text: m.userData.text, obj: m, pass: true }))); S.vis = v; }
  } else {
    const px = type_ === 'title' ? 108 : 96, h = mkHead(sc.head || TL.voice[S.line ?? i].text, px, yTop); add(h, S.id + 'h', 0); let yy = yTop - h.height - .2;
    if (sc.sub) { const sb = type.words(sc.sub, { px: 44, wt: 600, color: P.dim, maxW: 7.0, y: yy, extrude: 0, id: S.id + 's', stagger: .05 }); add(sb, S.id + 's', .9); yy -= sb.height + .2; }
    if (type_ === 'list') {
      const items = sc.items || [], gap = Math.min(1.3, (yy - .5 - (-1.3)) / Math.max(1, items.length - 1));
      items.forEach((it, k) => { const y = yy - .5 - k * gap, m = new THREE.Mesh(new RoundedBoxGeometryLocal(7.2, gap * .78, .45, .2), world.mats.make(LIGHT ? '#ffffff' : '#252c42')); m.position.set(0, y, 0); group.add(m); const dot = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 12), world.mats.glow(P.accent, 1.8)); dot.position.set(-3.2, y, .3); group.add(dot);
        const lb = type.label(it, { px: 60, maxW: 6, color: LIGHT ? P.fg : '#ffffff', wt: 800 }); lb.position.set(.35, y, .3); group.add(lb); texts.push({ id: S.id + 'i' + k, text: it, obj: lb, pass: false });
        ups.push(tl => { const p = ss(seg(tl, .9 + k * .55, 1.4 + k * .55)), b = p > 0 ? 1 : 0; m.visible = dot.visible = lb.visible = b > 0; const e = 1 - p; m.position.set(e * -4, y, e * -1); m.rotation.y = e * .6; dot.position.x = -3.2 + e * -4; lb.position.x = .35 + e * -4; lb.material.opacity = (lb.material.userData.b ??= 1) * p; }); });
    }
    if (hasVis) { const v = kinds.build(sc.visual); placeVisual(v, yy - .05); group.add(v.group); ups.push(tl => v.update(tl)); texts.push(...v.labels.map((m, k) => ({ id: S.id + 'vl' + k, text: m.userData.text, obj: m, pass: true }))); S.vis = v; }
  }
  S.group = group; S.blocks = blocks; S.texts = texts; S.ups = ups; S.mats = collectMats(group); S.cam = ['push', 'orbit', 'crane', 'pan', 'drift'][(i + (seed % 5)) % 5]; return S;
}
import { RoundedBoxGeometry as RBGeo } from 'three/addons/geometries/RoundedBoxGeometry.js';
function RoundedBoxGeometryLocal(w, h, d, r) { return new RBGeo(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)); }

// ───────────── camera rig ─────────────
const TARGET = new THREE.Vector3(0, 0, 0);   // y = 0 so that world y maps to screen px = 960 - 120 * y (layout numbers assume this)
function rig(S, tl, t) {
  const e = eo(clamp(tl / .35)), punch = (1 - e) * 2.4, sh = Math.sin(t * 9.1) * .012 + Math.sin(t * 5.3) * .01; let x = 0, y = 0, z = Z0;
  switch (S.cam) {
    case 'push': z = Z0 + 2.2 - clamp(tl / 6) * 3.4; x = Math.sin(tl * .4) * .2; break;
    case 'orbit': { const a = Math.sin(tl * .45 + 1) * .09; x = Math.sin(a) * Z0; z = Math.cos(a) * Z0 - .6; y = .3; break; }
    case 'crane': y = -1.3 + clamp(tl / 5) * 2.4; z = Z0 - 1.2; break;
    case 'pan': x = -.3 + clamp(tl / 5) * .6; z = Z0 - .8; break;
    default: z = Z0 - 3.4 + clamp(tl / 6) * 3.4; x = Math.cos(tl * .35) * .3; y = .2;
  }
  camera.position.set(x + sh, y + sh * .8, z - punch); camera.lookAt(TARGET.x + x * .25, TARGET.y + y * .2, 0); camera.rotation.z += Math.sin(tl * .5) * .012;
}

// ───────────── events for the mixer ─────────────
const EV = []; const scenes = TL.scenes;       // scene objects are built lazily (build on demand, dispose when left): keeps GPU memory small
const built = new Set();
function disposeScene(S) { S.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => { m.map && m.map.dispose(); m.dispose(); }); }); scene.remove(S.group); S.group = null; S.blocks = S.ups = S.texts = S.mats = S.vis = null; }
function ensure(i, keep) { if (!built.has(i)) { buildScene(scenes[i], i); built.add(i); } for (const j of [...built]) if (!keep.includes(j)) { disposeScene(scenes[j]); built.delete(j); } }
scenes.forEach((S, i) => { const sc = S.scene || {}; EV.push({ t: +(i === 0 ? .15 : S.t0 + .04).toFixed(3), type: i === 0 ? 'open' : 'scene' });
  (sc.head || '').split(' ').forEach((w, k) => { if (/^\*.*\*/.test(w)) EV.push({ t: +(S.t0 + .15 + .11 * k + .25).toFixed(3), type: 'emph', i: k }); });
  (sc.items || []).forEach((_, k) => EV.push({ t: +(S.t0 + .9 + k * .55).toFixed(3), type: 'item', i: k }));
  if (sc.type === 'number') { EV.push({ t: +(S.t0 + .02).toFixed(3), type: 'riser' }); for (let k = 0; k < 14; k++) EV.push({ t: +(S.t0 + .2 + 1.4 * Math.pow(k / 14, .7)).toFixed(3), type: 'count' }); EV.push({ t: +(S.t0 + 1.65).toFixed(3), type: 'impact' }); }
  if (sc.visual && ['title', 'statement', 'quote'].includes(sc.type || 'statement')) kinds.events(sc.visual, S.t0).forEach(e => EV.push(e)); });
EV.push({ t: +(TL.dur - 1.6).toFixed(3), type: 'close' }); EV.sort((a, b) => a.t - b.t); window.EV = EV;

// ───────────── overlay: series badge, progress, captions ─────────────
const rgba = (hex, a) => { const p = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };
function drawOverlay(t) {
  g2.clearRect(0, 0, W, H); g2.fillStyle = rgba(P.accent, .95); g2.fillRect(0, 0, W * clamp(t / TL.dur), 5);
  badges = drawBrand(g2, { W, H, t, TL, F, P, BR });
  window.__capBox = drawShortCaption(g2, t, { effect: F.caption || 'pop', W, H, timeline: TL, theme: { accent: P.accent, text: '#ffffff', family: P.family } });
}
let badges = [], lastTexts = [];

// ───────────── frame ─────────────
function render(t) {
  if (THUMB) return renderThumb();
  const fi = TL.scenes.findIndex(s => t >= s.t0 && t < s.t1), i = fi >= 0 ? fi : (t < 0 ? 0 : scenes.length - 1), S = scenes[i], tl = t - S.t0 + (i === 0 ? .55 : 0), trans0 = i > 0 ? 1 - clamp(tl / .32) : 0; const keep = trans0 > 0 ? [i, i - 1] : [i]; keep.forEach(j => ensure(j, keep)); const prev = i > 0 && trans0 > 0 ? scenes[i - 1] : null, trans = prev ? trans0 : 0;
  built.forEach(j => scenes[j].group.visible = false); S.group.visible = true; const enter = ss(clamp(tl / .3)); setAlpha(S, enter); S.group.scale.setScalar(.86 + .14 * eo(clamp(tl / .4))); S.group.position.z = (1 - eo(clamp(tl / .4))) * -3;
  S.blocks.forEach(({ b, delay }) => b.update(tl, delay)); S.ups.forEach(f => f(tl));
  if (prev && trans > 0) { prev.group.visible = true; setAlpha(prev, 1 - ss(1 - trans)); prev.group.scale.setScalar(1 + .25 * (1 - trans)); prev.group.position.z = (1 - trans) * 8; prev.blocks.forEach(({ b, delay }) => b.update(9, delay)); prev.ups.forEach(f => f(prev.t1 - prev.t0)); }
  rig(S, tl, t); world.update(t); post.bloom.strength = BASE_BLOOM + (i > 0 ? .9 * Math.exp(-tl / .14) : 0);
  post.composer.render(); drawOverlay(t);
  lastTexts = [];
  S.texts.forEach(x => { const b = type.boxOf(x.obj); lastTexts.push(x.pass ? { id: x.id, text: x.text, ...b, pass: true } : { id: x.id, text: x.text, ...b }); }); badges.forEach(b => lastTexts.push({ ...b, pass: true }));
}
window.render = render; window.TEXTS = t => { render(t); return lastTexts; };

// ───────────── thumbnail ─────────────
let thumbBuilt = false, thumbGroup = null;
function renderThumb() {
  const TH = F.thumb || {}, v = +(Q.get('v') || TH.variant || 1); if (!thumbBuilt) { thumbBuilt = true; thumbGroup = new THREE.Group(); scene.add(thumbGroup); buildThumb(TH, v); }
  camera.position.set(1.1, .4, Z0 - 1); camera.lookAt(0, 1.0, 0); camera.rotation.z = -.02; world.update(3.4); thumbBlocks.forEach(b => b.update(5, 0)); thumbUps.forEach(f => f(3.4)); post.bloom.strength = BASE_BLOOM * 1.25; post.composer.render();
  g2.clearRect(0, 0, W, H); if (TH.kicker) { const kp = Math.round(W * .036), padx = kp * .9, h = kp * 1.9, x = 60, y = Math.round(H * .075); g2.font = `800 ${kp}px ${P.family}`; const w = g2.measureText(TH.kicker).width + padx * 2; g2.fillStyle = P.accent; g2.beginPath(); g2.roundRect(x, y, w, h, h / 2); g2.fill(); g2.fillStyle = '#0A0B0F'; g2.textAlign = 'left'; g2.textBaseline = 'middle'; g2.fillText(TH.kicker, x + padx, y + h / 2 + 1); }
  badges = drawBrand(g2, { W, H, t: 3, TL, F, P, BR, thumb: true });
  window.__capBox = null;
}
let thumbBlocks = [], thumbUps = [];
function buildThumb(TH, v) {
  let raw = (TH.text || F.title.split(' ').slice(0, 5).join(' ')).trim(); if (TH.upper) raw = raw.toUpperCase(); if (!/\*/.test(raw)) { const w = raw.split(' '), tail = (raw.match(/[?!.]+$/) || [''])[0]; w[w.length - 1] = '*' + w[w.length - 1].replace(/[?!.]+$/, '') + '*' + tail; raw = w.join(' '); }
  const sc = TL.scenes.find(s => s.scene && s.scene.visual), vis = TH.visual || (sc ? sc.scene.visual : { kind: 'orbit', center: 'bolt', items: ['star', 'heart', 'chat', 'cloud', 'globe'] });
  const ems = raw.split(' ').filter(w => /^\*.*\*/.test(w)).map(w => w.replace(/[*?!.,]/g, '')), kw = (ems[ems.length - 1] || raw.split(' ').pop()).toUpperCase();
  const hero = kinds.build(vis); thumbUps.push(tl => hero.update(tl));
  const fit = (str, px, wt, maxW) => { const w = type.measure(str, px, wt, 'InterTight, Inter, sans-serif') / PXU; return w > maxW ? Math.floor(px * maxW / w) : px; };
  if (v === 1) { const h = type.words(raw, { px: 150, maxW: 7.0, y: 5.0, extrude: 10, stagger: 0 }); thumbGroup.add(h.group); thumbBlocks.push(h); hero.group.scale.setScalar(1.15); hero.group.position.set(0, -1.7, 0); thumbGroup.add(hero.group); }
  else if (v === 2) { hero.group.scale.setScalar(1.35); hero.group.position.set(0, -2.0, -1); thumbGroup.add(hero.group);
    const kpx = fit(kw, 520, 900, 7.4), kbl = type.words('*' + kw + '*', { px: kpx, maxW: 7.6, y: 1.4, extrude: 16, stagger: 0 }); thumbGroup.add(kbl.group); thumbBlocks.push(kbl);
    const rest = raw.replace(/\*/g, '').split(' ').filter(w => w.replace(/[?!.,]/g, '').toUpperCase() !== kw).join(' '); if (rest) { const rb = type.words(rest, { px: 120, maxW: 6.8, y: 4.9, extrude: 8, stagger: 0 }); thumbGroup.add(rb.group); thumbBlocks.push(rb); } }
  else { const num = (raw.match(/\d[\d.,]*/) || [null])[0], isQ = /\?\s*$/.test(raw), glyph = num || (isQ ? '?' : null);
    if (glyph) { const gl = type.words(glyph, { px: fit(glyph, 700, 900, 7.6), maxW: 8, y: 1.8, color: P.accent, accent: P.accent, extrude: 20, stagger: 0 }); gl.group.position.z = -2; thumbGroup.add(gl.group); thumbBlocks.push(gl); }
    const h = type.words(raw, { px: 140, maxW: 7.0, y: 5.1, extrude: 10, stagger: 0 }); thumbGroup.add(h.group); thumbBlocks.push(h); hero.group.scale.setScalar(1.0); hero.group.position.set(0, -2.0, 0); thumbGroup.add(hero.group); }
}
window.TEXTS = window.TEXTS; window.READY = true;
