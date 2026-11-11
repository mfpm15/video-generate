// Default portrait UI clearance scales with the canvas. Per-film overrides are normalized rectangles.
export function safeArea(W, H, override) {
  const r = override || (H > W ? { x0: 60 / 1080, y0: 210 / 1920, x1: 930 / 1080, y1: .75 }
    : { x0: 110 / 1920, y0: 60 / 1080, x1: 1 - 110 / 1920, y1: 1 - 110 / 1080 });
  if (![r.x0, r.y0, r.x1, r.y1].every(Number.isFinite) || r.x0 < 0 || r.y0 < 0 || r.x1 > 1 || r.y1 > 1 || r.x0 >= r.x1 || r.y0 >= r.y1) {
    throw new Error('safe_zone must be a normalized {x0,y0,x1,y1} rectangle inside the frame');
  }
  return { x0: W * r.x0, y0: H * r.y0, x1: W * r.x1, y1: H * r.y1 };
}
