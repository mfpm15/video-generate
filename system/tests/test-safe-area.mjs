import assert from 'node:assert/strict';
import { safeArea } from '../lib/safeArea.js';
import { drawBrand } from '../lib/brand.js';
import { safeZone } from '../lib/captions.js';
import { shortSafe } from '../lib/captionsShort.js';

// A tiny canvas metrics adapter exercises real brand/series layout at different output sizes.
function context() {
  return new Proxy({ font: '40px sans-serif', measureText(s) {
    const px = +(this.font.match(/([\d.]+)px/)?.[1] || 40);
    return { width: s.length * px * .5 };
  } }, { get(target, key) { return key in target ? target[key] : () => {}; } });
}
for (const [W, H] of [[1080, 1920], [1920, 1080], [540, 960]]) {
  const F = { series: { name: 'A long educational series', short: 'A long educational series', n: 1, total: 14 } };
  const area = safeArea(W, H);
  const boxes = drawBrand(context(), { W, H, t: 1, TL: { dur: 20 }, F, P: { family: 'Inter', accent: '#ffffff' },
    BR: { enabled: true, fontPx: 40, y: 160, x: 60, opacity: .92, parts: ['ngeteh', 'nology'], name: 'ngetehnology', chipRight: 60 } });
  assert.equal(boxes.length, 2);
  for (const b of boxes) {
    assert.ok(b.x0 >= area.x0 && b.y0 >= area.y0 && b.x1 <= area.x1 && b.y1 <= area.y1,
      `Brand/series escapes the ${W}x${H} safe area: ${JSON.stringify(b)}`);
  }
  const legacy = safeZone(W, H), short = shortSafe(W, H);
  assert.equal(legacy.side, short.left);
  assert.equal(W - legacy.right, short.right);
  assert.equal(H - legacy.bottom, short.bottom);
}
const override = { x0: .1, y0: .2, x1: .8, y1: .7 };
assert.deepEqual(safeArea(1080, 1920, override), { x0: 108, y0: 384, x1: 864, y1: 1344 });
assert.throws(() => safeArea(1080, 1920, { x0: .8, y0: 0, x1: .2, y1: 1 }), /normalized/);
console.log('PASS: shared caption bounds, brand/series layout at 3 sizes, dynamic override and invalid-area rejection');
