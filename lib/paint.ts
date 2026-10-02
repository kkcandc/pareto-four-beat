export type Point = { x: number; y: number };

export type Anchor = {
  cx: number;
  cy: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type Curve = { from: Point; c1: Point; c2: Point; to: Point };

export function curveBetween(a: Anchor, b: Anchor): Curve | null {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  if (Math.hypot(dx, dy) < 8) return null;

  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const from = horizontal
    ? { x: dx >= 0 ? a.right : a.left, y: a.cy }
    : { x: a.cx, y: dy >= 0 ? a.bottom : a.top };
  const to = horizontal
    ? { x: dx >= 0 ? b.left : b.right, y: b.cy }
    : { x: b.cx, y: dy >= 0 ? b.top : b.bottom };

  if (horizontal) {
    const mx = (from.x + to.x) / 2;
    return {
      from,
      to,
      c1: { x: mx, y: from.y },
      c2: { x: mx, y: to.y },
    };
  }

  const my = (from.y + to.y) / 2;
  return {
    from,
    to,
    c1: { x: from.x, y: my },
    c2: { x: to.x, y: my },
  };
}

export function cubicPoint(curve: Curve, amount: number): Point {
  const u = 1 - amount;
  const tt = amount * amount;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * amount;
  return {
    x:
      uuu * curve.from.x +
      3 * uu * amount * curve.c1.x +
      3 * u * tt * curve.c2.x +
      ttt * curve.to.x,
    y:
      uuu * curve.from.y +
      3 * uu * amount * curve.c1.y +
      3 * u * tt * curve.c2.y +
      ttt * curve.to.y,
  };
}

export type Beam = {
  curve: Curve;
  color: string;
  strength: number;
  width: number;
};

function trace(ctx: CanvasRenderingContext2D, curve: Curve) {
  ctx.beginPath();
  ctx.moveTo(curve.from.x, curve.from.y);
  ctx.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.to.x, curve.to.y);
}

export function paintBeams(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  beams: Beam[],
  time: number,
) {
  ctx.clearRect(0, 0, width, height);
  for (const beam of beams) {
    if (beam.strength <= 0.01) continue;
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = beam.color;
    ctx.globalAlpha = 0.16 * beam.strength;
    ctx.lineWidth = beam.width + 7;
    trace(ctx, beam.curve);
    ctx.stroke();
    ctx.globalAlpha = 0.85 * beam.strength;
    ctx.lineWidth = beam.width;
    trace(ctx, beam.curve);
    ctx.stroke();
    ctx.restore();

    if (beam.strength < 0.45) continue;
    ctx.save();
    ctx.fillStyle = beam.color;
    for (let comet = 0; comet < 3; comet += 1) {
      const head = (time * 0.42 + comet / 3) % 1;
      for (let step = 0; step < 7; step += 1) {
        const amount = head - step * 0.028;
        if (amount <= 0 || amount >= 1) continue;
        const point = cubicPoint(beam.curve, amount);
        ctx.globalAlpha = (1 - step / 7) * beam.strength;
        ctx.beginPath();
        ctx.arc(point.x, point.y, step === 0 ? 3.1 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
