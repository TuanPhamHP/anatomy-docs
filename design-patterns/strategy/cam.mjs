// The cams of the Strategy figure. Each cam is one pricing rule cut into a disc:
// its radius at an angle is the fee for the value its scale shows there. All
// cams share the same bore and keyway (the interface); only the profile changes.
// The build and the live page both draw cams with camSvg, so a cam the spindle
// turns is rebuilt from the same code that drew it at rest. Pass the kit as K.

export const CAM = {
  R0: 12, // radius at a fee of 0 ₫
  LIFT: 13, // extra radius at FEE_MAX
  THICK: 5,
  SPAN: (240 * Math.PI) / 180, // the arc that carries the input scale; the rest returns to the start
  STEPS: 240,
  BORE: 3,
  HUB: 6.4,
  KEY: Math.PI / 2, // keyway direction in the cam's own frame
  SHAFT: 2.6, // the keyed shaft every cam fits: spindle and rack pegs alike
  READ: -Math.PI / 2, // the follower reads along -y; a cam at rest has its zero there
};

const TAU = Math.PI * 2;
const ease = (t) => t * t * (3 - 2 * t);

// The cam's radius as a function of its own angle (0 at the start of the scale).
// Every step in the fee becomes a short ramp, so the follower's roller can climb it.
export function radiusOf(strategy, fee, feeMax) {
  const level = (f) => CAM.R0 + (f / feeMax) * CAM.LIFT;
  const steps = [];
  const N = 1200;
  let prev = fee(0);
  for (let i = 1; i <= N; i++) {
    const v = (i / N) * strategy.max;
    const f = fee(v);
    if (f === prev) continue;
    let lo = ((i - 1) / N) * strategy.max;
    let hi = v;
    for (let j = 0; j < 40; j++) {
      const mid = (lo + hi) / 2;
      if (fee(mid) === prev) lo = mid;
      else hi = mid;
    }
    steps.push({ t: lo, from: level(prev), to: level(f) });
    prev = f;
  }
  const ramp = strategy.max * 0.02;
  const first = level(fee(0));
  const last = level(fee(strategy.max));
  return (angle) => {
    const a = ((angle % TAU) + TAU) % TAU;
    if (a > CAM.SPAN) return last + (first - last) * ease((a - CAM.SPAN) / (TAU - CAM.SPAN));
    const v = (a / CAM.SPAN) * strategy.max;
    let r = first;
    for (const step of steps) {
      if (v >= step.t + ramp) r = step.to;
      else {
        if (v > step.t) r = step.from + (step.to - step.from) * ease((v - step.t) / ramp);
        break;
      }
    }
    return r;
  };
}

// The cam's angle on the spindle that brings `value` on its scale to the follower.
// At rest (on a peg, or before reading) a cam is turned by CAM.READ.
export const turnFor = (strategy, value) => CAM.READ - (value / strategy.max) * CAM.SPAN;

const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];

// The cam's body: like the kit's extrude, but a wall only counts as seen when it
// faces the viewer and sits on the near half of the disc. A notch on the far half
// is hidden behind the cam's top face, so its walls draw no edges over that face.
function camBody(K, P, ring, height) {
  const count = ring.length;
  const [vx, vy] = K.towardViewer(P);
  const { sinA, cosA } = K.cameraOf(P);
  const normals = ring.map(([ax, ay], i) => {
    const [bx, by] = ring[(i + 1) % count];
    const length = Math.hypot(bx - ax, by - ay) || 1;
    return [(by - ay) / length, -(bx - ax) / length];
  });
  const facing = normals.map(([nx, ny], i) => {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % count];
    return nx * vx + ny * vy > 1e-9 && (ax + bx) * vx + (ay + by) * vy > 0;
  });
  const top = ring.map(([x, y]) => K.iso([x, y, height], P));
  const bottom = ring.map(([x, y]) => K.iso([x, y, 0], P));
  const area = (points) => points.reduce((sum, [ax, ay], i) => { const [bx, by] = points[(i + 1) % points.length]; return sum + ax * by - bx * ay; }, 0);
  const oriented = (points) => (area(points) < 0 ? [...points].reverse() : points);
  // Runs of equal facing, starting where the facing changes.
  const start = Math.max(0, facing.findIndex((f, i) => f !== facing[(i + count - 1) % count]));
  const runs = [];
  let run = null;
  for (let step = 0; step < count; step++) {
    const i = (start + step) % count;
    if (!run || run.facing !== facing[i]) { run = { facing: facing[i], points: [i] }; runs.push(run); }
    run.points.push((i + 1) % count);
  }
  const outline = [];
  const crease = [];
  for (const { facing: seen, points } of runs) {
    if (seen) {
      crease.push(K.pathOf(points.map((i) => top[i])));
      outline.push(K.pathOf(points.map((i) => bottom[i])));
      outline.push(K.pathOf([top[points[0]], bottom[points[0]]]), K.pathOf([top[points[points.length - 1]], bottom[points[points.length - 1]]]));
    } else outline.push(K.pathOf(points.map((i) => top[i])));
  }
  const fill = [K.pathOf(oriented(top), true), K.pathOf(oriented(bottom), true)];
  const shades = Array.from({ length: 4 }, () => []);
  const [lx, ly] = [-sinA, cosA];
  for (let i = 0; i < count; i++) {
    if (!facing[i]) continue;
    const next = (i + 1) % count;
    const quad = K.pathOf(oriented([top[i], top[next], bottom[next], bottom[i]]), true);
    fill.push(quad);
    const [nx, ny] = normals[i];
    shades[Math.min(3, Math.max(0, Math.floor(((nx * lx + ny * ly + 1) / 2) * 4)))].push(quad);
  }
  return { fill: fill.join(""), outline: outline.join(""), crease: crease.join(""), top: K.pathOf(oriented(top), true), shades: shades.map((list) => list.join("")) };
}

// One cam centred on the origin, bottom face at z = 0, turned by theta.
export function camSvg(K, P, strategy, radius, theta, { lit = false } = {}) {
  const ring = Array.from({ length: CAM.STEPS }, (_, i) => {
    const a = (i / CAM.STEPS) * TAU;
    return polar(radius(a), a + theta);
  });
  const top = CAM.THICK;
  const at = (r, a) => polar(r, a + theta);
  const lines = [];
  // Input scale just inside the base circle: one tick per unit step, the zero mark longest.
  const count = Math.round(strategy.max / strategy.tick);
  const minor = [];
  const major = [];
  for (let i = 0; i <= count * 2; i++) {
    const a = (i / (count * 2)) * CAM.SPAN;
    const whole = i % 2 === 0;
    const inner = i === 0 ? CAM.HUB : whole ? 8.6 : 9.6;
    (whole ? major : minor).push(K.onTop([at(inner, a), at(10.6, a)], top, P));
  }
  // The engraved arc the ticks stand on, from the zero mark to the end of the scale.
  const arc = Array.from({ length: 61 }, (_, i) => at(10.6, (i / 60) * CAM.SPAN));
  lines.push(K.lineSvg(K.onTop(arc, top, P), { tone: "lo" }));
  lines.push(K.lineSvg(minor.join(""), { tone: "lo" }), K.lineSvg(major.slice(1).join(""), { tone: "mid" }), K.lineSvg(major[0], { tone: "hi" }));
  // Hub boss outline, bore and keyway.
  const circle = (r, n = 40) => Array.from({ length: n }, (_, i) => at(r, (i / n) * TAU));
  lines.push(K.lineSvg(K.onTop(circle(CAM.HUB), top, P, true), { tone: "faint" }));
  const kw = 0.7;
  const bore = [];
  const n = 36;
  for (let i = 0; i <= n; i++) {
    const a = CAM.KEY + Math.asin(kw / CAM.BORE) + (i / n) * (TAU - 2 * Math.asin(kw / CAM.BORE));
    bore.push(at(CAM.BORE, a));
  }
  const kx = (r, side) => {
    const [cx, cy] = polar(r, CAM.KEY + theta);
    const [nx, ny] = polar(kw * side, CAM.KEY + theta + Math.PI / 2);
    return [cx + nx, cy + ny];
  };
  bore.push(kx(CAM.BORE + 1.1, -1), kx(CAM.BORE + 1.1, 1));
  const borePath = K.onTop(bore, top, P, true);
  lines.push(`<path class="dp-hole" d="${borePath}"/>`, K.lineSvg(borePath, { tone: "lo" }));
  // Two set screws on the hub and a lightening hole opposite the scale.
  const screws = [CAM.KEY + Math.PI * 0.75, CAM.KEY - Math.PI * 0.75].map((a) => {
    const [x, y] = at(4.9, a);
    return K.iso([x, y, top], P);
  });
  lines.push(K.dotsSvg(screws, { size: 0.42 }));
  // The unit engraved on the return arc, where the scale has no ticks.
  const mid = CAM.SPAN + (TAU - CAM.SPAN) / 2;
  const deg = ((mid + theta) * 180) / Math.PI;
  lines.push(`<text class="iso-face-text dp-unit" data-tone="mid" transform="${K.topMatrix([0, 0], top, P)} rotate(${deg.toFixed(2)}) translate(9 0) rotate(90)" font-size="3.1" text-anchor="middle" dy="1.1">${strategy.unit.toUpperCase()}</text>`);
  const body = camBody(K, P, ring, CAM.THICK);
  return K.solidSvg(body, { tone: lit ? "lit" : "hi", crease: "lo", lit, inner: lines.join("") });
}

// A keyed shaft from `bottom` up to `top`, with a turned-down end. The key turns
// with the shaft; it is drawn behind the shaft when it faces away from the viewer.
export function shaftSvg(K, P, x, y, bottom, top, turn = CAM.READ) {
  if (bottom >= top - 0.05) return "";
  const n = 24;
  const ringAt = (r) => Array.from({ length: n }, (_, i) => [x + r * Math.cos((i / n) * TAU), y + r * Math.sin((i / n) * TAU)]);
  const c = Math.cos(CAM.KEY + turn);
  const s = Math.sin(CAM.KEY + turn);
  const key = [[-0.7, CAM.SHAFT - 0.4], [0.7, CAM.SHAFT - 0.4], [0.7, CAM.SHAFT + 0.9], [-0.7, CAM.SHAFT + 0.9]].map(([u, v]) => [x + v * c - u * s, y + v * s + u * c]);
  const keySvg = K.solidSvg(K.extrude(key, bottom, Math.max(0.1, top - 1 - bottom), P), { tone: "mid", crease: "none" });
  const az = (P.azimuth * Math.PI) / 180;
  const behind = c * Math.cos(az) + s * Math.sin(az) < 0;
  const shaft = K.solidSvg(K.extrude(ringAt(CAM.SHAFT), bottom, top - 0.6 - bottom, P), { tone: "mid" }) + K.solidSvg(K.extrude(ringAt(CAM.SHAFT - 0.5), top - 0.6, 0.6, P), { tone: "mid", crease: "none" });
  return behind ? keySvg + shaft : shaft + keySvg;
}
