// The parts of the Interpreter figure that change shape as it moves, shared by
// the build (the static pose) and the page (every frame): the three sensor bars
// and the height a roller rides at over each one, the coil springs, and the
// signal arm that turns on its pivot. Functions that draw take the kit as `K`
// ({ iso, depthOf, pathOf }), so the same code runs in Node and in the page.

// How far a sensor rod rises when its comparison is true, and its roller's radius.
export const RISE = 7;
export const ROLLER = 2.2;

// One sensor per comparison leaf of the rule, left to right. A bar slides along y
// so the customer's value sits under the roller (bar position t, in world units).
// Its top carries the rule's constant: a tooth for ==, a step for >=.
export const STATIONS = [
  { key: "hạng", x: -70, kind: "eq", at: 24, span: [-10, 48], marks: [["thường", 0], ["bạc", 12], ["vàng", 24], ["kim cương", 36]] },
  { key: "tổng_đơn", x: 10, kind: "ge", at: 20, span: [-10, 50], per: 25000 },
  { key: "khu_vực", x: 60, kind: "eq", at: 0, span: [-12, 40], marks: [["HN", 0], ["HCM", 14], ["ĐN", 28]] },
];

// A tooth is flat for FLAT on each side of its centre, then ramps down over RAMP.
export const FLAT = 2.5;
export const RAMP = 6;

// Where a value sits along its bar.
export function tOf(station, value) {
  if (station.kind === "ge") return value / station.per;
  return station.marks.find(([name]) => name === value)[1];
}

// Height of the bar's top above its flat at position t: 0 on the flat, RISE on a tooth or a step.
export function profileAt(station, t) {
  if (station.kind === "ge") {
    if (t >= station.at) return RISE;
    return t <= station.at - RAMP ? 0 : (RISE * (t - (station.at - RAMP))) / RAMP;
  }
  const d = Math.abs(t - station.at);
  if (d <= FLAT) return RISE;
  return d >= FLAT + RAMP ? 0 : (RISE * (FLAT + RAMP - d)) / RAMP;
}

// How high the roller's centre sits above where it sits on the flat: the lowest
// circle of radius ROLLER centred over t that stays on or above the profile.
export function riseAt(station, t) {
  let most = 0;
  for (let i = -20; i <= 20; i++) {
    const dx = (ROLLER * i) / 20;
    most = Math.max(most, profileAt(station, t + dx) + Math.sqrt(ROLLER * ROLLER - dx * dx) - ROLLER);
  }
  return most;
}

// A vertical coil spring around (cx, cy) from z0 to z1, split into the half
// behind its rod and the half in front, as the kit's own coil() does for x and y.
export function helixPaths(K, P, cx, cy, r, z0, z1, turns) {
  const count = Math.round(turns * 18);
  const back = [];
  const front = [];
  let run = [];
  let near = null;
  for (let i = 0; i <= count; i++) {
    const a = (i / count) * turns * Math.PI * 2;
    const facing = K.depthOf([Math.cos(a), Math.sin(a), 0], P) > 0;
    const point = K.iso([cx + r * Math.cos(a), cy + r * Math.sin(a), z0 + ((z1 - z0) * i) / count], P);
    if (near !== null && facing !== near) {
      run.push(point);
      (near ? front : back).push(K.pathOf(run));
      run = [];
    }
    run.push(point);
    near = facing;
  }
  if (run.length > 1) (near ? front : back).push(K.pathOf(run));
  return { back: back.join(""), front: front.join("") };
}

// The signal arm: a bar on a pivot with a round paddle at its far end, lying in
// the plane y = 0. The root rod pushes its underside REACH to the left of the
// pivot, so a rise of h turns it until its underside rests on the rod tip (angleFor).
export const PIVOT = [-9, 104];
export const REACH = 8.5;
const HALF = 1.2;
const DEPTH = [-0.8, 0.8];
const ARM = [[-38, -HALF], [3, -HALF], [3.8, 0], [3, HALF], [-38, HALF]];
const PADDLE = Array.from({ length: 16 }, (_, i) => [-36 + 6.2 * Math.cos((i * Math.PI) / 8), 6.2 * Math.sin((i * Math.PI) / 8)]);
// The angle at which the arm's underside rests exactly on the rod tip raised by h:
// REACH·tan(θ) − HALF/cos(θ) + HALF = h, solved by bisection.
export function angleFor(h) {
  let lo = 0;
  let hi = 1.2;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (REACH * Math.tan(mid) - HALF / Math.cos(mid) + HALF < h) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export const ARM_UNDER = PIVOT[1] - HALF;

function hullOf(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// One flat convex plate turned by theta about the pivot, drawn as a kit solid:
// paper fill, the visible thin edges shaded by facing, the front face, the outline.
function plateSvg(K, P, polygon, theta, { tone = "hi", lit = false } = {}) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const turned = polygon.map(([dx, dz]) => [PIVOT[0] + dx * c + dz * s, PIVOT[1] - dx * s + dz * c]);
  const front = turned.map(([x, z]) => K.iso([x, DEPTH[1], z], P));
  const back = turned.map(([x, z]) => K.iso([x, DEPTH[0], z], P));
  const n = turned.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += turned[i][0] * turned[(i + 1) % n][1] - turned[(i + 1) % n][0] * turned[i][1];
  const parts = [`<path class="iso-fill" d="${K.pathOf(hullOf([...front, ...back]), true)}"/>`];
  const edges = [];
  for (let i = 0; i < n; i++) {
    const [ax, az] = turned[i];
    const [bx, bz] = turned[(i + 1) % n];
    const len = Math.hypot(bx - ax, bz - az) || 1;
    const normal = area > 0 ? [(bz - az) / len, 0, -(bx - ax) / len] : [-(bz - az) / len, 0, (bx - ax) / len];
    if (K.depthOf(normal, P) <= 1e-9) continue;
    const quad = K.pathOf([front[i], front[(i + 1) % n], back[(i + 1) % n], back[i]], true);
    edges.push(normal[2] > 0.35 ? `<path class="iso-top" d="${quad}"/>` : `<path class="iso-shade" data-shade="${normal[0] > 0 ? 0 : 2}" d="${quad}"/>`);
  }
  parts.push(...edges);
  parts.push(`<path class="iso-shade" data-shade="3" d="${K.pathOf(front, true)}"/>`);
  parts.push(`<path class="iso-line iso-crease" data-tone="faint" d="${K.pathOf(front, true)}"/>`);
  parts.push(`<path class="iso-line iso-edge" data-tone="${lit ? "lit" : tone}" d="${K.pathOf(hullOf([...front, ...back]), true)}"/>`);
  return `<g class="iso-solid"${lit ? ' data-lit=""' : ""}>${parts.join("")}</g>`;
}

export function armSvg(K, P, theta, lit) {
  // A rib along the arm's front face, from under the paddle to under the pivot cap, and the rivet that holds the paddle.
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const at = (dx, dz) => K.iso([PIVOT[0] + dx * c + dz * s, DEPTH[1], PIVOT[1] - dx * s + dz * c], P);
  const rib = `<path class="iso-line" data-tone="faint" d="${K.pathOf([at(-29.6, 0), at(-1, 0)])}"/>`;
  const rivet = at(-36, 0);
  return plateSvg(K, P, ARM, theta, { tone: "hi" }) + rib + plateSvg(K, P, PADDLE, theta, { tone: "hi", lit })
    + `<path class="iso-line" data-tone="${lit ? "lit" : "lo"}" d="${K.pathOf(Array.from({ length: 25 }, (_, i) => at(-36 + 3.6 * Math.cos((i * Math.PI) / 12), 3.6 * Math.sin((i * Math.PI) / 12))), true)}"/>`
    + `<g class="iso-dots" data-tone="${lit ? "lit" : "mid"}"><circle cx="${rivet[0].toFixed(1)}" cy="${rivet[1].toFixed(1)}" r="0.55"/></g>`;
}

// The arm's farthest reach when fully raised, for fitting the camera.
export function armExtent(theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return PADDLE.map(([dx, dz]) => [PIVOT[0] + dx * c + dz * s, 0, PIVOT[1] - dx * s + dz * c]);
}
