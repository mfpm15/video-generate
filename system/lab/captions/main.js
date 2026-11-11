// Caption lab: ?effect=01..06&line=short|long. Draws a busy backdrop + the caption; exposes __capBox for the safe-zone test.
import { drawCaption } from './_lib/captions.js';
const q = new URLSearchParams(location.search), effect = q.get('effect') || '01', which = q.get('line') || 'short';
const W = innerWidth, H = innerHeight, cv = document.getElementById('c'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
const T = { short: 'Dia belajar dari data besar', long: 'Ulangi miliaran kali, dan tebakannya makin tepat sampai angkanya hampir nol dan jawabannya selalu benar' };
const text = T[which], ws = text.split(' '), t0 = 0.5, per = 0.28;
const words = ws.map((w, i) => ({ w, t0: t0 + i * per, t1: t0 + (i + 1) * per }));
const end = t0 + ws.length * per;
const TL = { dur: end + 1.5, voice: [{ id: 'v1', t0, t1: end, words }], cues: [{ id: 'v1', t0: t0 - .1, t1: end + .9, text }] };
window.DUR = TL.dur;
window.render = t => { g.setTransform(1, 0, 0, 1, 0, 0); const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#26304a'); gr.addColorStop(1, '#e8d9b0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.25)'; g.fillRect((i * 97) % W, (i * 211) % H, 160, 90); }
  window.__capBox = drawCaption(g, t, { effect, W, H, timeline: TL, theme: { family: 'Inter, sans-serif' } }); };
window.TEXTS = () => [];
await Promise.all(['300 40px Inter', '400 40px Inter', '600 40px Inter', '800 40px Inter', '900 40px Inter'].map(f => document.fonts.load(f))); await document.fonts.ready;
window.READY = true;
