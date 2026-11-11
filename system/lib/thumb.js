// Thumbnails: three layouts, chosen per film in film.json  "thumb": { text, kicker, variant, upper, visual }
//   1 hero     big hook text + a large illustration            (default)
//   2 keyword  ONE giant word + a faint full-frame illustration
//   3 numeral  a giant number (or "?") behind the hook text + icon cluster
// Rules baked in: <= 5 words of text, one focal point, heavy weight with shadow (legible at 200 px wide), the key word in the accent colour,
// text kept inside the platform-UI safe area (portrait: roughly 10%..72% of the height), optional series badge "BAGIAN 3/14" top-left.
// makeThumb(env) returns draw(variant). env supplies the scene helpers so there is one palette/one font stack.
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); };

export function makeThumb(env) {
  const { g, W, H, U, P, F, TL, portrait, CX, bg, drawHead, wrap, drawVisual, rgba } = env;
  const vignette = () => { const vg = g.createRadialGradient(W / 2, H / 2, U * .35, W / 2, H / 2, Math.max(W, H) * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); };
  const shadowed = f => { g.save(); g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 36; g.shadowOffsetY = 8; f(); g.restore(); };
  return function draw(variant = 1) {
    const TH = F.thumb || {}, sc = TL.scenes.find(s => s.scene && s.scene.visual), tl = 3.4;
    const v = TH.visual || (sc ? sc.scene.visual : { kind: 'orbit', center: 'bolt', items: ['star', 'heart', 'chat', 'cloud', 'globe'] });
    let raw = (TH.text || F.title).trim(); if (TH.upper) raw = raw.toUpperCase();
    if (!/\*/.test(raw)) { const w = raw.split(' '), tail = (raw.match(/[?!.]+$/) || [''])[0]; w[w.length - 1] = '*' + w[w.length - 1].replace(/[?!.]+$/, '') + '*' + tail; raw = w.join(' '); }
    const ems = raw.split(' ').filter(w => /^\*.*\*/.test(w)).map(w => w.replace(/[*?!.,]/g, '')), kw = (ems[ems.length - 1] || raw.split(' ').pop()).replace(/[*?!.]/g, '');
    bg(5);
    const fx = portrait ? W * .5 : W * .74, fy = portrait ? H * .58 : H * .5, sp = g.createRadialGradient(fx, fy, 0, fx, fy, U * .95);           // spotlight behind the focal point
    sp.addColorStop(0, rgba(P.accent, .30)); sp.addColorStop(1, rgba(P.accent, 0)); g.fillStyle = sp; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .05; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(W * .15, 0); g.lineTo(W * .30, 0); g.lineTo(W * .05, H); g.lineTo(-W * .10, H); g.closePath(); g.fill(); g.restore();   // light streak
    g.shadowColor = 'transparent';
    const boxV = portrait ? { x: W * .03, y: H * .40, w: W * .94, h: H * .36 } : { x: W * .50, y: H * .06, w: W * .47, h: H * .88 };
    if (variant === 1) {
      drawVisual(g, v, boxV, tl, P);
      const area = portrait ? { cx: CX, maxW: W * .90 } : { cx: W * .26, maxW: W * .46 }, px = U * (portrait ? .135 : .13), L = wrap(raw, px, 900, P.head, area.maxW), hh = L.rows.length * px * 1.18;
      const badgeBottom = TH.kicker ? (portrait ? H * .065 : H * .07) + U * .036 * 1.9 + U * .035 : 0, y0 = Math.max(badgeBottom, portrait ? H * .14 : H * .5 - hh / 2 - U * .02);
      shadowed(() => { const y = drawHead('thumb', raw, px, 900, y0, 4, P.fg, P.head, area); g.fillStyle = P.accent; g.fillRect(area.cx - 90, y + 24, 180, 10); });
    } else if (variant === 2) {
      g.save(); g.globalAlpha = .20; drawVisual(g, v, portrait ? { x: -W * .05, y: H * .30, w: W * 1.1, h: H * .5 } : { x: W * .38, y: -H * .02, w: W * .66, h: H * 1.04 }, tl, P); g.restore();
      const K = kw.toUpperCase(), maxW = W * (portrait ? .92 : .64); let kp = U * (portrait ? .30 : .36); g.font = `900 ${kp}px ${P.head}`; const k0 = g.measureText(K).width; if (k0 > maxW) kp *= maxW / k0;
      const rest = raw.replace(/\*/g, '').split(' ').filter(w => w.replace(/[?!.,]/g, '').toUpperCase() !== K).join(' '), cx = portrait ? CX : W * .36, ky = portrait ? H * .45 : H * .54;
      shadowed(() => {
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${kp}px ${P.head}`; g.fillStyle = P.accent; g.shadowColor = rgba(P.accent, .6); g.shadowBlur = 60; g.fillText(K, cx, ky);
        g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 30;
        if (rest) { const rp = U * .075, L = wrap(rest, rp, 800, P.head, maxW), lh = rp * 1.2; g.font = `800 ${rp}px ${P.head}`; g.fillStyle = P.fg; L.rows.forEach((r, i) => g.fillText(r.map(w => w.s).join(' '), cx, ky - kp * .62 - (L.rows.length - i) * lh + lh * .2)); }
        g.fillStyle = P.fg; g.fillRect(cx - 110, ky + kp * .58, 220, 10);
      });
    } else {
      const num = (raw.match(/\d[\d.,]*/) || [null])[0], G = num || '?'; let gp = U * (portrait ? .95 : 1.0); g.font = `900 ${gp}px ${P.head}`; const gw = g.measureText(G).width; if (gw > W * .95) gp *= W * .95 / gw;
      g.save(); g.globalAlpha = .26; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${gp}px ${P.head}`; g.fillStyle = P.accent; g.shadowColor = rgba(P.accent, .5); g.shadowBlur = 80; g.fillText(G, portrait ? CX : W * .70, portrait ? H * .42 : H * .52); g.restore();
      const area = portrait ? { cx: CX, maxW: W * .90 } : { cx: W * .30, maxW: W * .52 }, px = U * (portrait ? .13 : .135), L = wrap(raw, px, 900, P.head, area.maxW), hh = L.rows.length * px * 1.18, y0 = portrait ? H * .30 : H * .5 - hh / 2;
      shadowed(() => { const y = drawHead('thumb', raw, px, 900, y0, 4, P.fg, P.head, area); g.fillStyle = P.accent; g.fillRect(area.cx - 90, y + 24, 180, 10); });
      const ic = (v.items || []).slice(0, 3).map(i => typeof i === 'string' ? i : i.icon).filter(Boolean), s = U * .06;
      ic.forEach((nm, i) => { const x = portrait ? W * (.28 + .22 * i) : W * (.62 + .1 * i), y = portrait ? H * .76 : H * .80; drawVisual(g, { kind: 'icons', items: [{ icon: nm }] }, { x: x - s * 2, y: y - s * 2, w: s * 4, h: s * 4 }, 3, P); });
    }
    if (TH.kicker) {                                                                                                       // series badge
      const kp = U * .036, padx = kp * .9; g.font = `800 ${kp}px ${P.family}`; const w = g.measureText(TH.kicker).width + padx * 2, h = kp * 1.9, x = W * .06, y = portrait ? H * .065 : H * .07;
      g.fillStyle = P.accent; rr(g, x, y, w, h, h / 2); g.fill(); g.fillStyle = '#0A0B0F'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(TH.kicker, x + padx, y + h / 2 + 1);
    }
    vignette();
  };
}
