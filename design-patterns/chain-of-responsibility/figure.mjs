// The Chain of Responsibility figure: a token sorter. An expense request is a
// flat token whose diameter grows with its amount. It slides down a tilted
// chute that leans back against a guide wall, past three holes in the order of
// the chain; each hole is cut to one approver's limit. A token smaller than a
// hole drops through it into that approver's column and raises its flag; a
// bigger token slides over it to the next hole. A token too big for every hole
// slides off the end into the reject bin. Sizes and decisions come from
// model.mjs, the same data the Python and TypeScript examples run on.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { APPROVERS, REQUESTS, groupVND, holeRadius, route, tokenRadius } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 400;

// ---------------------------------------------------------------- vectors
const add = (p, q) => p.map((v, i) => v + q[i]);
const sub = (p, q) => p.map((v, i) => v - q[i]);
const mul = (p, s) => p.map((v) => v * s);
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const unit = (p) => mul(p, 1 / Math.hypot(...p));

// ---------------------------------------------------------------- the chute
// A runs down the chute, B across it toward the front, N out of its surface.
// The chute falls 10° along its length and 6° toward the back wall, so every
// token slides pressed against the wall and passes each hole on the same line.
const RAD = Math.PI / 180;
const ALPHA = 10 * RAD;
const BETA = 6 * RAD;
const A = [Math.cos(ALPHA), 0, -Math.sin(ALPHA)];
const B = [0, Math.cos(BETA), Math.sin(BETA)];
const N = cross(A, B);
const O = [0, -12, 62];
const C = (a, b, n = 0) => add(add(add(O, mul(A, a)), mul(B, b)), mul(N, n));

const LEN = 128; // chute length along A
const WIDE = 25; // running width across B
const THICK = 2.4; // chute plate
const WALL = 7; // guide wall height above the surface
const WALL_T = 2.4;
const LIP = 1.8;
const HOLE_A = [40, 70, 102];
const HOLE_R = APPROVERS.map(holeRadius);
// Holes are tangent to the guide wall, as the tokens are.
const HOLE_C = HOLE_A.map((a, i) => C(a, HOLE_R[i]));
const GATE_A = 26;
const GATE_T = 2.4;
const GATE_LIFT = 3.4;
const TOKEN_T = 1.6;

// ---------------------------------------------------------------- columns
const COL_WALL = 1.6;
const FLOOR_Z = 1.0; // inner floor of a column, above the base top
const COLS = HOLE_C.map((c, i) => {
  const s = 2 * HOLE_R[i] + 2 * COL_WALL;
  return { x: c[0] - s / 2, y: c[1] - s / 2, w: s, d: s, cx: c[0], cy: c[1] };
});
// z of the chute's underside above a floor point.
const UNDER_K = dot(N, O) - THICK;
const underZ = (x, y) => (UNDER_K - N[0] * x - N[1] * y) / N[2];

// ---------------------------------------------------------------- motion model
// Shared by the build (to place the reject bin where the token lands) and the
// page (inlined below). A token speeds up toward VMAX as it slides; once off a
// support it falls under GRAVITY.
const MOTION = { VMAX: 46, TAU: 0.6, GRAVITY: 420, ENTER: 0.35, OPEN: 0.35, SLIDE: 0.7, LAND: 0.14, FLAG: 0.35 };
const slid = (t) => (t <= 0 ? 0 : MOTION.VMAX * (t - MOTION.TAU * (1 - Math.exp(-t / MOTION.TAU))));
const speed = (t) => (t <= 0 ? 0 : MOTION.VMAX * (1 - Math.exp(-t / MOTION.TAU)));
const timeToSlide = (s) => {
  let lo = 0;
  let hi = 30;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (slid(mid) < s) lo = mid;
    else hi = mid;
  }
  return hi;
};
// Time to fall a height h with a starting downward speed v0.
const fallTime = (h, v0 = 0) => (-v0 + Math.sqrt(v0 * v0 + 2 * MOTION.GRAVITY * h)) / MOTION.GRAVITY;

// One run per request: where it starts, where it leaves the chute, where it rests.
const RUNS = REQUESTS.map((request) => {
  const R = tokenRadius(request);
  const { by } = route(request.amount);
  const start = R + 0.8;
  const run = { R, by, start };
  // Time the token's back edge clears the gate, so the gate can close behind it.
  run.pass = MOTION.SLIDE + timeToSlide(GATE_A + GATE_T + 1.2 + R - start);
  run.over = HOLE_A.map((a) => MOTION.SLIDE + timeToSlide(a - start));
  if (by >= 0) {
    // It drops when it lies wholly inside the hole: its front edge on the hole's front rim.
    run.leave = HOLE_A[by] - (HOLE_R[by] - R);
    run.tDrop = MOTION.SLIDE + timeToSlide(run.leave - start);
    const top = C(run.leave, R);
    run.from = top;
    run.rest = [top[0], top[1], FLOOR_Z];
    run.tLand = run.tDrop + fallTime(top[2] - FLOOR_Z);
  } else {
    // It tips over the end once its centre passes the last edge, then flies.
    run.leave = LEN;
    run.tDrop = MOTION.SLIDE + timeToSlide(LEN - start);
    const v = speed(run.tDrop - MOTION.SLIDE);
    run.from = C(LEN, R);
    run.v = [v * A[0], 0, v * A[2]];
  }
  return run;
});

// The reject bin sits where the biggest token lands.
const BIN_FLOOR = 1.6;
const reject = RUNS.find((run) => run.by < 0);
reject.tFly = fallTime(reject.from[2] - BIN_FLOOR, -reject.v[2]);
reject.rest = [reject.from[0] + reject.v[0] * reject.tFly, reject.from[1], BIN_FLOOR];
reject.tLand = reject.tDrop + reject.tFly;
const BIN = (() => {
  const x = reject.from[0] + 1.6;
  const far = reject.rest[0] + reject.R + 3.6;
  return { x, y: reject.rest[1] - reject.R - 4.4, w: far - x, d: 2 * reject.R + 8.8, r: 1.6, h: 10 };
})();
RUNS.forEach((run) => { run.end = run.tLand + MOTION.LAND + MOTION.FLAG; run.dwell = run.end + 2.2; });

// ---------------------------------------------------------------- camera
const PLATE = { x: -18, y: -30, w: BIN.x + BIN.w + 10 + 18, d: 66, r: 8 };
const PLATE_H = 9;
const FOOT_H = 4;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), C(-WALL_T, -WALL_T, WALL + 6), C(LEN, WIDE, 0), C(GATE_A, -WALL_T, 14), C(GATE_A, WIDE, 14)],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 58 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const Z = [0, 0, 1];
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
// A closed rounded rectangle in a face's own 2D coordinates.
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

// A convex solid from its vertices and faces, shaded like the kit's prisms.
const V = G.viewOf(P);
const LIGHT = G.lightOf(P);
function hullOf(points) {
  const pts = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
function polySolid(verts, faces) {
  const centre = mul(verts.reduce(add), 1 / verts.length);
  const flat = verts.map(at);
  const buckets = [[], [], [], [], []];
  const visible = faces.map((face) => {
    const [p0, p1, p2] = face.map((j) => verts[j]);
    let normal = unit(cross(sub(p1, p0), sub(p2, p0)));
    const mid = mul(face.map((j) => verts[j]).reduce(add), 1 / face.length);
    if (dot(normal, sub(mid, centre)) < 0) normal = mul(normal, -1);
    const seen = dot(normal, V) > 1e-6;
    if (seen) buckets[G.bandOf(dot(normal, LIGHT))].push(k.pathOf(face.map((j) => flat[j]), true));
    return seen;
  });
  const creases = [];
  const edges = new Map();
  faces.forEach((face, f) => face.forEach((j, i) => {
    const key = [j, face[(i + 1) % face.length]].sort((p, q) => p - q).join(",");
    edges.set(key, [...(edges.get(key) ?? []), f]);
  }));
  for (const [key, list] of edges) {
    if (list.length === 2 && visible[list[0]] && visible[list[1]]) {
      const [i, j] = key.split(",").map(Number);
      creases.push(k.pathOf([flat[i], flat[j]]));
    }
  }
  const hull = k.pathOf(hullOf(flat), true);
  return { fill: hull, outline: hull, crease: creases.join(""), top: buckets[4].join(""), shades: buckets.slice(0, 4).map((list) => list.join("")) };
}
// A box from a floor plan up to a top given per corner.
function columnOf({ x, y, w, d }, z0, topAt) {
  const plan = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];
  const verts = [...plan.map(([px, py]) => [px, py, z0]), ...plan.map(([px, py]) => [px, py, topAt(px, py)])];
  return polySolid(verts, [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]);
}

// Frames for prisms in the chute's own axes (u × v = a in each).
const along = (o) => G.frameOf(o, A, B, N); // extrude down the chute, profile in (b, n)
const across = (o) => G.frameOf(o, B, N, A); // extrude across the chute, profile in (n, a)
const box3 = (a0, a1, b0, b1, n0, n1) => G.prismOf(along(O), [[b0, n0], [b1, n0], [b1, n1], [b0, n1]], a0, a1, P);

// ---------------------------------------------------------------- base
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 20).sort((p, q) => k.depthOf([...p, 0], P) - k.depthOf([...q, 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.4, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -PLATE_H / 2, P, 8), { tone: "faint" }) }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Ruler under the columns.
  const ruler = { x: 30, y: 26, w: 96, d: 5, r: 1 };
  out.push(S(k.slabOf(ruler, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(ruler.x + 2, ruler.x + ruler.w - 2, 2, 5, ruler.y + 0.8, 0.6, [1.6, 3], P, "x");
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  out.push(D([at([ruler.x + 1, ruler.y + 2.5, 0.6]), at([ruler.x + ruler.w - 1, ruler.y + 2.5, 0.6])], { size: 0.4 }));
  out.push(gauge(), label());
  return out.join("");
}

// A calibration plate with the three holes engraved at true size.
function gauge() {
  const plan = { x: -12, y: 11, w: 53, d: 23, r: 1.6 };
  const out = [S(k.slabOf(plan, 0, 0.8, P, 4, 0.3), { tone: "lo", crease: "none" })];
  out.push(Ln(k.planOutline(k.insetPlan(plan, 1.4), 0.8, P, 4), { tone: "faint" }));
  let x = plan.x + 3.2;
  const rings = [];
  const marks = [];
  HOLE_R.forEach((r) => {
    const cx = x + r;
    const cy = plan.y + plan.d - 3 - r;
    rings.push(k.ring(cx, cy, r, 0.8, P, 40));
    marks.push(at([cx, cy, 0.8]));
    x += 2 * r + 1.6;
  });
  out.push(Ln(rings.join(""), { tone: "mid" }));
  out.push(D(marks, { size: 0.35, tone: "lo" }));
  out.push(D([at([plan.x + 2, plan.y + 2, 0.8]), at([plan.x + plan.w - 2, plan.y + 2, 0.8])], { size: 0.4 }));
  return out.join("");
}

function label() {
  const plan = { x: 130, y: 22, w: 30, d: 9, r: 1.2 };
  const out = [S(k.slabOf(plan, 0, 0.8, P, 4), { tone: "lo", crease: "none" })];
  out.push(Ln(k.planOutline(k.insetPlan(plan, 1.2), 0.8, P, 4), { tone: "faint" }));
  out.push(Ln([[134, 24.6, 16], [134, 26.6, 21], [134, 28.6, 12]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([plan.x + 2, plan.y + 4.5, 0.8]), at([plan.x + plan.w - 2, plan.y + 4.5, 0.8])], { size: 0.4 }));
  return out.join("");
}

// ---------------------------------------------------------------- supports
const POST = { x: 4, y: -7, w: 8, d: 14 };
function post() {
  const out = [];
  const flange = { x: POST.x - 2.4, y: POST.y - 2.4, w: POST.w + 4.8, d: POST.d + 4.8, r: 1.2 };
  out.push(S(k.slabOf(flange, 0, 1.4, P, 3, 0.3), { tone: "mid" }));
  out.push(D([[flange.x + 1.3, flange.y + flange.d - 1.3], [flange.x + flange.w - 1.3, flange.y + flange.d - 1.3], [flange.x + flange.w - 1.3, flange.y + 1.3]].map(([x, y]) => at([x, y, 1.4])), { size: 0.45 }));
  const tall = underZ(POST.x, POST.y + POST.d) - 1.4;
  const seam = [0.3, 0.62].map((f) => path3([[POST.x, POST.y + POST.d, 1.4 + f * tall], [POST.x + POST.w, POST.y + POST.d, 1.4 + f * tall]])).join("");
  out.push(S(columnOf(POST, 1.4, (x, y) => underZ(x, y)), { tone: "mid", inner: Ln(seam, { tone: "faint" }) }));
  // Access panel on the front face, held by four screws.
  const panel = { z: 1.4 + 0.55 * tall, w: POST.w - 3, h: 0.2 * tall };
  const PM = k.sideMatrix([POST.x + 1.5, POST.y + POST.d], panel.z, P, "left");
  out.push(`<g transform="${PM}"><path class="dp-plate" d="${rrect(0, 0, panel.w, panel.h, 0.8)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, panel.w, panel.h, 0.8)}"/></g>`);
  out.push(D([[0.9, 0.9], [panel.w - 0.9, 0.9], [0.9, panel.h - 0.9], [panel.w - 0.9, panel.h - 0.9]].map(([fx, fz]) => at([POST.x + 1.5 + fx, POST.y + POST.d, panel.z - fz])), { size: 0.4 }));
  return out.join("");
}

// ---------------------------------------------------------------- columns and flags
// Each column: a square tube from the base up to the chute's underside, a sight
// window on its front, a printed plate and the approver's flag beside it.
const WIN_BOTTOM = 2.4;
function windowOf(col) {
  const top = Math.min(underZ(col.x, col.y + col.d), underZ(col.x + col.w, col.y + col.d)) - 11;
  const w = col.w - 5;
  return { x: col.cx - w / 2, y: col.y + col.d, z: top, w, h: top - WIN_BOTTOM };
}
const WINS = COLS.map(windowOf);
const winMatrix = (win) => k.sideMatrix([win.x, win.y], win.z, P, "left");

function column(i) {
  const col = COLS[i];
  const win = WINS[i];
  const out = [];
  const flange = { x: col.x - 1.8, y: col.y - 1.8, w: col.w + 3.6, d: col.d + 3.6, r: 1 };
  out.push(S(k.slabOf(flange, 0, 1.2, P, 3, 0.3), { tone: "mid" }));
  out.push(D([[flange.x + 1, flange.y + flange.d - 1], [flange.x + flange.w - 1, flange.y + flange.d - 1], [flange.x + flange.w - 1, flange.y + 1]].map(([x, y]) => at([x, y, 1.2])), { size: 0.45 }));
  // Seam where the tube's two halves are folded and spot-welded.
  const seamZ = 1.2 + (win.z - 1.2) * 0.42;
  const seam = path3([[col.x + col.w, col.y, seamZ], [col.x + col.w, col.y + col.d, seamZ]]);
  out.push(S(columnOf(col, 1.2, (x, y) => underZ(x, y)), { tone: "mid", inner: Ln(seam, { tone: "faint" }) }));
  out.push(D([col.y + 1.6, col.y + col.d - 1.6].map((y) => at([col.x + col.w, y, seamZ + 1.2])), { size: 0.4 }));
  const M = winMatrix(win);
  const frame = rrect(-1.4, -1.4, win.w + 2.8, win.h + 2.8, 1.8);
  out.push(`<g transform="${M}"><path class="dp-bezel" d="${frame}"/><path class="iso-line" data-tone="lo" d="${frame}"/><path class="dp-inside" d="${rrect(0, 0, win.w, win.h, 1)}"/><path class="dp-back" d="M${win.w * 0.62} 0V${win.h}"/></g>`);
  out.push(`<g clip-path="url(#dp-win-${i})" data-slot="window-${i}"></g>`);
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="mid" d="${rrect(0, 0, win.w, win.h, 1)}"/></g>`);
  out.push(D([[-0.7, -0.7], [win.w + 0.7, -0.7], [-0.7, win.h + 0.7], [win.w + 0.7, win.h + 0.7]].map(([fx, fz]) => at([win.x + fx, win.y, win.z - fz])), { size: 0.4 }));
  // Printed plate above the window: the approver's title, drawn as rule lines.
  const plateZ = win.z + 6.6;
  const PM = k.sideMatrix([win.x, win.y], plateZ, P, "left");
  const pw = Math.min(win.w + 2, 13);
  out.push(`<g transform="${PM}"><path class="dp-plate" d="${rrect(0, 0, pw, 4.4, 0.6)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, pw, 4.4, 0.6)}"/><path class="iso-line" data-tone="lo" data-free="" d="M1.4 1.6H${pw - 3}M1.4 3H${pw * 0.55}"/></g>`);
  out.push(flag(col.x + col.w + 3, col.y + col.d - 3, i));
  return out.join("");
}

// A signal flag on a short post: the arm swings up in the post's front plane
// when the approver takes the request.
const FLAG_POST = { w: 3, d: 3, h: 11 };
function flag(x, y, index, tall = FLAG_POST.h) {
  const out = [];
  const plan = { x, y, w: FLAG_POST.w, d: FLAG_POST.d, r: 0.6 };
  const foot = { x: x - 0.7, y: y - 0.7, w: plan.w + 1.4, d: plan.d + 1.4, r: 0.8 };
  out.push(S(k.slabOf(foot, 0, 0.8, P, 3, 0.2), { tone: "mid" }));
  out.push(D([at([foot.x + foot.w - 0.6, foot.y + foot.d - 0.6, 0.8])], { size: 0.35 }));
  out.push(S(k.slabOf(plan, 0.8, tall - 0.8, P, 3, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(x + plan.w / 2, y + plan.d / 2, 0.9, tall, 0.8, P, 16), { tone: "mid" }));
  const hinge = [x + plan.w / 2, y + plan.d + 0.25, tall - 1.4];
  const M = k.sideMatrix([hinge[0], hinge[1]], hinge[2], P, "left");
  // A rod with a flag plate, drawn pointing along +x in the post's front plane.
  // At rest it hangs down (rotate 90); raised it points up (rotate 270), with the
  // plate flying to the right. It swings through the left, clear of the next column.
  const arm = "M-0.9 -0.7H6.6V4.3H2.8V0.7H-0.9A0.7 0.7 0 0 1 -0.9 -0.7Z";
  const stripe = "M3.6 1.5H5.8V3.5H3.6Z";
  out.push(`<g transform="${M}"><g data-part="arm" data-flag="${index}" transform="rotate(90)">${S({ fill: arm, outline: arm, crease: "", top: "", shades: ["", "", "", ""] }, { tone: "hi", flat: true, inner: `<path class="iso-line" data-tone="lo" d="${stripe}"/>` })}</g></g>`);
  out.push(D([at(hinge)], { size: 0.55, tone: "hi" }));
  return out.join("");
}

// ---------------------------------------------------------------- reject bin
function binBack() {
  const out = [];
  const outer = BIN;
  out.push(S(k.slabOf({ ...outer, x: outer.x - 1.2, y: outer.y - 1.2, w: outer.w + 2.4, d: outer.d + 2.4 }, 0, 0.8, P, 4, 0.3), { tone: "mid" }));
  // Floor, back wall and the near-end wall: drawn before the token falls in.
  out.push(S(k.slabOf({ x: outer.x, y: outer.y, w: outer.w, d: outer.d, r: outer.r }, 0.8, BIN_FLOOR - 0.8, P, 4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: outer.x, y: outer.y, w: outer.w, d: 1.6, r: 0.6 }, BIN_FLOOR, BIN.h - BIN_FLOOR, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: outer.x, y: outer.y, w: 1.6, d: outer.d, r: 0.6 }, BIN_FLOOR, BIN.h - BIN_FLOOR, P, 3), { tone: "mid" }));
  return out.join("");
}

function binFront() {
  const out = [];
  const outer = BIN;
  out.push(S(k.slabOf({ x: outer.x + outer.w - 1.6, y: outer.y, w: 1.6, d: outer.d, r: 0.6 }, BIN_FLOOR, BIN.h - BIN_FLOOR, P, 3), { tone: "mid" }));
  const front = { x: outer.x, y: outer.y + outer.d - 1.6, w: outer.w, d: 1.6, r: 0.6 };
  // Engraved cross on the front wall: the bin's one mark.
  const fx = outer.x + outer.w / 2;
  const fy = front.y + front.d;
  const cross = path3([[fx - 2.6, fy, 7.6], [fx + 2.6, fy, 3.4]]) + path3([[fx - 2.6, fy, 3.4], [fx + 2.6, fy, 7.6]]);
  const ring = k.sideMatrix([fx - 4.2, fy], 9.7, P, "left");
  out.push(S(k.slabOf(front, BIN_FLOOR, BIN.h - BIN_FLOOR, P, 3), { tone: "mid", inner: `${Ln(cross, { tone: "mid", free: true })}<g transform="${ring}"><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 8.4, 8.4, 1.2)}"/></g>` }));
  out.push(D([[outer.x + 1.6, fy, BIN.h - 1], [outer.x + outer.w - 1.6, fy, BIN.h - 1]].map(at), { size: 0.4 }));
  out.push(flag(outer.x + outer.w + 1.6, outer.y + outer.d + 2.2, 3));
  return out.join("");
}

// ---------------------------------------------------------------- the chute
function ellipse(a, b, r, n, steps = 64) {
  return path3(Array.from({ length: steps }, (_, j) => C(a + r * Math.cos((j / steps) * 2 * Math.PI), b + r * Math.sin((j / steps) * 2 * Math.PI), n)), true);
}

function chuteBody() {
  const out = [];
  // The plate and its back flange.
  const lineAt = (a0, a1, b, n) => path3([C(a0, b, n), C(a1, b, n)]);
  out.push(S(box3(-WALL_T, LEN, -WALL_T, WIDE, -THICK, 0), { tone: "mid", inner: Ln(lineAt(-WALL_T, LEN, WIDE, -THICK / 2), { tone: "faint" }) }));
  // Holes: the bore's far wall, the opening through it, and a chamfer ring.
  HOLE_A.forEach((a, i) => {
    const r = HOLE_R[i];
    out.push(`<clipPath id="dp-bore-${i}"><path d="${ellipse(a, r, r, 0)}"/></clipPath>`);
    out.push(`<path class="dp-bore" d="${ellipse(a, r, r, 0)}"/>`);
    out.push(`<path class="dp-hole" clip-path="url(#dp-bore-${i})" d="${ellipse(a, r, r, -THICK)}"/>`);
    out.push(Ln(ellipse(a, r, r, 0), { tone: "mid" }));
    out.push(Ln(ellipse(a, r, r + 1.1, 0), { tone: "faint" }));
  });
  // Guide wall with a scale along its top and rivets along its face.
  const ticks = [];
  const major = [];
  for (let a = 2, i = 0; a <= LEN - 2; a += 4, i++) (i % 5 === 0 ? major : ticks).push(path3([C(a, 0, WALL), C(a, i % 5 === 0 ? -1.6 : -0.9, WALL)]));
  const rivets = [6, 34, 64, 94, 122].map((a) => at(C(a, 0, WALL / 2)));
  out.push(S(box3(-WALL_T, LEN, -WALL_T, 0, 0, WALL), { tone: "mid", inner: Ln(ticks.join(""), { tone: "lo" }) + Ln(major.join(""), { tone: "mid" }) }));
  out.push(D(rivets, { size: 0.45 }));
  // Head wall closing the top end.
  out.push(S(G.prismOf(across(O), [[0, -WALL_T], [WALL, -WALL_T], [WALL, 0], [0, 0]], 0, WIDE, P), { tone: "mid" }));
  out.push(D([at(C(0, 6, WALL / 2)), at(C(0, WIDE - 4, WALL / 2))], { size: 0.45 }));
  // Back post of the gate's bridge, on the wall top.
  out.push(S(box3(GATE_A - 1.4, GATE_A + GATE_T + 1.4, -WALL_T, 0, WALL, 13), { tone: "mid" }));
  // Guide groove in the wall face that the gate bar's end rides in.
  out.push(Ln(path3([C(GATE_A + GATE_T / 2, 0, 0), C(GATE_A + GATE_T / 2, 0, WALL)]), { tone: "lo" }));
  return out.join("");
}

// The gate bar that holds a new token at the top, and its plunger.
function gate() {
  const out = [];
  out.push(S(box3(GATE_A, GATE_A + GATE_T, 0.3, WIDE - LIP - 0.2, 0.3, 3.4), { tone: "hi", crease: "lo" }));
  const F = G.frameAlong(C(GATE_A + GATE_T / 2, WIDE / 2, 3.4), N);
  out.push(S(G.solidOf([[0, 0.8], [11.6, 0.8]], F, P), { tone: "mid" }));
  return out.join("");
}

function chuteFront() {
  const out = [];
  out.push(S(box3(0, LEN, WIDE - LIP, WIDE, 0, LIP), { tone: "mid" }));
  out.push(D([12, 46, 82, 116].map((a) => at(C(a, WIDE, LIP / 2))), { size: 0.4 }));
  // Front post and the bridge beam with the release knob.
  out.push(S(box3(GATE_A - 1.4, GATE_A + GATE_T + 1.4, WIDE - LIP, WIDE, LIP, 13), { tone: "mid" }));
  out.push(S(box3(GATE_A - 1.6, GATE_A + GATE_T + 1.6, -WALL_T, WIDE, 13, 15.4), { tone: "mid" }));
  out.push(D([at(C(GATE_A + GATE_T / 2, -WALL_T + 1.2, 15.4)), at(C(GATE_A + GATE_T / 2, WIDE - 1.2, 15.4))], { size: 0.45 }));
  return out.join("");
}

// The release knob on the plunger: pulled up, it lifts the gate bar.
function knob() {
  const F = G.frameAlong(C(GATE_A + GATE_T / 2, WIDE / 2, 15.4), N);
  return S(G.solidOf([[0, 3.4], [0.8, 3.4], [0.8, 2.6], [3.6, 2.6]], F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 0.9, 3.5, 2.6, 22, P, { fade: [0.1, 0.5] }), { tone: "lo" }) })
    + Ln(G.circleOf(F, 3.6, 0.8, P), { tone: "mid" });
}

// ---------------------------------------------------------------- tokens
// A token is built once at a reference point (the centre of its bottom face)
// and moved with translateAlong; `axis` is N on the chute and Z once it lies flat.
function token(R, ref, axis, attrs) {
  const F = G.frameAlong(ref, axis);
  const body = S(G.disc(0, TOKEN_T, R, F, P), { tone: "hi", crease: "lo" });
  const marks = Ln(G.circleOf(F, TOKEN_T, R - Math.min(1.1, R * 0.18), P), { tone: "lo" });
  return `<g ${attrs} display="none">${body}${marks}${D([at(add(ref, mul(F.a, TOKEN_T)))], { size: 0.45, tone: "lo" })}</g>`;
}
const chuteRef = (i) => C(RUNS[i].start, RUNS[i].R);
const TILT = unit(N);
const FLATTEN = [0, 1 / 3, 2 / 3, 1].map((f) => unit(add(mul(TILT, 1 - f), mul(Z, f))));

const START = 1;

const clips = [
  ...COLS.map((_, i) => `<clipPath id="dp-win-${i}"><path transform="${winMatrix(WINS[i])}" d="${rrect(0, 0, WINS[i].w, WINS[i].h, 1)}"/></clipPath>`),
  ...HOLE_A.map((a, i) => `<clipPath id="dp-open-${i}"><path d="${ellipse(a, HOLE_R[i], HOLE_R[i], -THICK)}"/></clipPath>`),
  // Sinking through the plate: the plate in front of the hole hides the token's
  // near side; everything beyond the hole's widest screen line stays visible.
  ...HOLE_A.map((a, i) => {
    const r = HOLE_R[i];
    const rim = Array.from({ length: 96 }, (_, j) => at(C(a + r * Math.cos((j / 96) * 2 * Math.PI), r + r * Math.sin((j / 96) * 2 * Math.PI))));
    const left = rim.reduce((p, q) => (q[0] < p[0] ? q : p));
    const right = rim.reduce((p, q) => (q[0] > p[0] ? q : p));
    const band = k.pathOf([left, right, [right[0], right[1] - 60], [left[0], left[1] - 60]], true);
    return `<clipPath id="dp-sink-${i}"><path d="${ellipse(a, r, r, 0)}"/><path d="${band}"/></clipPath>`;
  }),
].join("");

const tokensOnChute = RUNS.map((run, i) => token(run.R, chuteRef(i), N, `data-tok="${i}" data-inst="chute"`)).join("");
// Inside the plate a falling token shows through the hole's top opening; once
// below the plate, only where that opening and the bottom one overlap.
const tokensInHoles = RUNS.map((run, i) =>
  run.by < 0 ? "" : `<g clip-path="url(#dp-sink-${run.by})">${token(run.R, chuteRef(i), N, `data-tok="${i}" data-inst="bore"`)}</g><g clip-path="url(#dp-bore-${run.by})"><g clip-path="url(#dp-open-${run.by})">${token(run.R, chuteRef(i), N, `data-tok="${i}" data-inst="hole"`)}</g></g>`,
).join("");
const tokenInWindow = (h) => RUNS.map((run, i) => (run.by === h ? token(run.R, run.rest, Z, `data-tok="${i}" data-inst="window"`) : "")).join("");
const tokensInBin = FLATTEN.map((axis, f) => token(reject.R, reject.rest, axis, `data-tok="${RUNS.indexOf(reject)}" data-inst="bin" data-tilt="${f}"`)).join("");

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một máy phân loại đồng xu trên bàn đế. Máng nghiêng có ba lỗ tròn to dần, mỗi lỗ là hạn mức của một người duyệt, lần lượt là trưởng nhóm, trưởng phòng và giám đốc. Đồng xu là đề nghị chi, càng nhiều tiền thì càng to. Đồng xu trượt xuống, rơi vào lỗ đầu tiên đủ rộng, đi xuống cột của người duyệt đó và làm cờ của cột bật lên. Đồng xu to hơn mọi lỗ thì trượt khỏi cuối máng và rơi vào thùng từ chối.",
  body: [
    `<defs>${clips}</defs>`,
    base(),
    post(),
    ...COLS.map((_, i) => column(i).replace(`<g clip-path="url(#dp-win-${i})" data-slot="window-${i}"></g>`, `<g clip-path="url(#dp-win-${i})">${tokenInWindow(i)}</g>`)),
    binBack(),
    chuteBody(),
    `<g data-slot="before-gate">${tokensOnChute}</g>`,
    `<g data-part="gate">${gate()}</g>`,
    `<g data-slot="after-gate"></g>`,
    tokensInHoles,
    chuteFront(),
    `<g data-part="gate">${knob()}</g>`,
    tokensInBin,
    binFront(),
  ],
});

// ---------------------------------------------------------------- live
const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const f3 = (p) => p.map((v) => +v.toFixed(3));
const RUN_DATA = RUNS.map((run, i) => ({
  R: +run.R.toFixed(3), by: run.by, start: run.start, leave: +run.leave.toFixed(3), pass: +run.pass.toFixed(3), over: run.over.map((t) => +t.toFixed(3)),
  tDrop: +run.tDrop.toFixed(3), tLand: +run.tLand.toFixed(3), end: +run.end.toFixed(3), dwell: +run.dwell.toFixed(3),
  from: f3(run.from), rest: f3(run.rest), v: run.v ? f3(run.v) : null, ref: f3(chuteRef(i)),
}));

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const A = ${JSON.stringify(f3(A))}, B = ${JSON.stringify(f3(B))}, N = ${JSON.stringify(f3(N))}, O = ${JSON.stringify(O)};
const M = ${JSON.stringify(MOTION)};
const RUNS = ${JSON.stringify(RUN_DATA)};
const HOLE_A = ${JSON.stringify(HOLE_A)}, THICK = ${THICK}, GATE_A = ${GATE_A}, GATE_T = ${GATE_T}, GATE_LIFT = ${GATE_LIFT}, TOKEN_T = ${TOKEN_T};
const C = (a, b, n) => [O[0] + a * A[0] + b * B[0] + n * N[0], O[1] + a * A[1] + b * B[1] + n * N[1], O[2] + a * A[2] + b * B[2] + n * N[2]];
const slid = (t) => (t <= 0 ? 0 : M.VMAX * (t - M.TAU * (1 - Math.exp(-t / M.TAU))));
const ease = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const slotA = svg.querySelector('[data-slot="before-gate"]');
const slotB = svg.querySelector('[data-slot="after-gate"]');
const gateEls = svg.querySelectorAll('[data-part="gate"]');
const arms = [...svg.querySelectorAll('[data-part="arm"]')];
const inst = RUNS.map((_, i) => ({
  chute: svg.querySelector('[data-tok="' + i + '"][data-inst="chute"]'),
  hole: svg.querySelector('[data-tok="' + i + '"][data-inst="hole"]'),
  bore: svg.querySelector('[data-tok="' + i + '"][data-inst="bore"]'),
  window: svg.querySelector('[data-tok="' + i + '"][data-inst="window"]'),
  bin: [...svg.querySelectorAll('[data-tok="' + i + '"][data-inst="bin"]')],
}));
const all = inst.flatMap((set) => [set.chute, set.bore, set.hole, set.window, ...set.bin].filter(Boolean));
const FLAG_OF = (run) => (run.by < 0 ? 3 : run.by);

// Where token i is t seconds into its run.
function pose(i, t) {
  const run = RUNS[i];
  if (t < M.SLIDE) {
    const drop = t < M.ENTER ? 5 * (1 - ease(t / M.ENTER)) : 0;
    return { stage: "enter", p: C(run.start, run.R, drop), a: run.start, fade: ease(t / M.ENTER) };
  }
  if (t < run.tDrop) {
    const a = run.start + slid(t - M.SLIDE);
    return { stage: "slide", p: C(a, run.R, 0), a };
  }
  if (run.by >= 0) {
    const fall = t - run.tDrop;
    const z = Math.max(run.rest[2], run.from[2] - 0.5 * M.GRAVITY * fall * fall);
    return { stage: t < run.tLand ? "drop" : "rest", p: [run.from[0], run.from[1], z], a: run.leave, depth: run.from[2] - z };
  }
  const fly = Math.min(t, run.tLand) - run.tDrop;
  const p = [run.from[0] + run.v[0] * fly, run.from[1], Math.max(run.rest[2], run.from[2] + run.v[2] * fly - 0.5 * M.GRAVITY * fly * fly)];
  return { stage: t < run.tLand ? "fly" : "rest", p, a: run.leave, settle: ease((t - run.tLand) / M.LAND) };
}

function place(el, p, ref, opacity) {
  if (!el) return;
  el.setAttribute("display", "inline");
  el.setAttribute("transform", translateAlong(P, [p[0] - ref[0], p[1] - ref[1], p[2] - ref[2]]));
  if (opacity < 1) el.setAttribute("opacity", opacity.toFixed(3)); else el.removeAttribute("opacity");
}

function show(i, q, opacity) {
  const run = RUNS[i];
  const set = inst[i];
  if (q.stage === "enter" || q.stage === "slide") {
    place(set.chute, q.p, run.ref, opacity * (q.fade ?? 1));
    const slot = q.a - run.R > GATE_A + GATE_T + 0.6 ? slotB : slotA;
    if (set.chute.parentNode !== slot) slot.appendChild(set.chute);
  }
  if (run.by >= 0) {
    if (q.stage === "drop") place(q.depth < THICK + TOKEN_T ? set.bore : set.hole, q.p, run.ref, opacity);
    if (q.stage === "drop" || q.stage === "rest") place(set.window, q.p, run.rest, opacity);
  } else if (q.stage === "fly" || q.stage === "rest") {
    const f = q.stage === "fly" ? 0 : Math.min(3, Math.round(q.settle * 3));
    place(set.bin[f], q.p, run.rest, opacity);
  }
}

const TEXT = (i, t) => {
  const run = RUNS[i];
  const request = REQUESTS[i];
  const money = groupVND(request.amount) + " ₫";
  if (t >= run.tDrop) return money + " → " + (run.by < 0 ? "bị từ chối" : APPROVERS[run.by].role + " duyệt");
  const passed = run.over.filter((over, h) => h !== run.by && t >= over).length;
  return passed ? money + " · qua " + APPROVERS[passed - 1].role : request.id + " · " + money;
};

let sel = ${START}, runT = 0, old = null, touring = !still.matches, visible = false, frame = 0, last = 0, idleTimer = 0;
function describe() {
  const request = REQUESTS[sel];
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", "Đề nghị " + request.id + ", " + groupVND(request.amount) + " đồng, " + decisionOf(request));
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function startRun(index) {
  old = runT > 0 && !still.matches ? { index: sel, t: 0, from: runT } : null;
  const changed = index !== sel;
  sel = index;
  runT = still.matches ? RUNS[sel].end : 0;
  if (changed) describe(); else emit();
}

function draw() {
  for (const el of all) el.setAttribute("display", "none");
  const q = pose(sel, runT);
  show(sel, q, 1);
  // The previous token fades where it came to rest; its flag drops.
  // A resting token only uses its column or bin copy, so it can fade while the
  // same token enters again at the top.
  let fading = null;
  if (old) {
    const fade = 1 - ease(old.t / 0.4);
    const oq = pose(old.index, old.from);
    if (old.index !== sel || oq.stage === "rest") show(old.index, oq, fade);
    fading = { flag: FLAG_OF(RUNS[old.index]), raise: fade * ease((old.from - RUNS[old.index].tLand - M.LAND) / M.FLAG) };
  }
  const run = RUNS[sel];
  // Gate: lifts once the token has landed at the top, drops once it has passed.
  const lift = ease((runT - M.ENTER) / M.OPEN) - ease((runT - run.pass) / 0.3);
  const up = translateAlong(P, [N[0] * lift * GATE_LIFT, N[1] * lift * GATE_LIFT, N[2] * lift * GATE_LIFT]);
  gateEls.forEach((el) => el.setAttribute("transform", up));
  const raise = ease((runT - run.tLand - M.LAND) / M.FLAG);
  arms.forEach((arm, h) => {
    let r = h === FLAG_OF(run) ? raise : 0;
    if (fading && fading.flag === h) r = Math.max(r, fading.raise);
    arm.setAttribute("transform", "rotate(" + (90 + 180 * r).toFixed(2) + ")");
    const on = h === FLAG_OF(run) && raise > 0.5;
    const solid = arm.querySelector(".iso-solid");
    solid.toggleAttribute("data-lit", on);
    solid.querySelector(".iso-edge").setAttribute("data-tone", on ? "lit" : "hi");
  });
  const text = TEXT(sel, runT);
  if (readout.textContent !== text) readout.textContent = text;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (still.matches) runT = RUNS[sel].end;
  else runT += dt;
  if (old) { old.t += dt; if (old.t >= 0.4) old = null; }
  if (touring && runT >= RUNS[sel].dwell) startRun((sel + 1) % RUNS.length);
  draw();
  const settled = !touring && !old && runT >= RUNS[sel].end;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again. Choosing a step runs it again.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; emit(); run(); }, 3600);
  if (hold || index !== sel) startRun(index); else emit();
  run();
};
const pick = (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
  return Math.floor(share * RUNS.length);
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = !still.matches; if (runT >= RUNS[sel].dwell) startRun((sel + 1) % RUNS.length); emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để chọn đề nghị";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse") choose(pick(event), false); });
stage.addEventListener("pointerdown", (event) => choose(pick(event), event.pointerType !== "mouse"));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = Math.min(RUNS.length - 1, sel + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = Math.max(0, sel - 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = RUNS.length - 1;
  if (event.key === "Enter" || event.key === " ") to = sel;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
if (still.matches) runT = RUNS[sel].end;
describe();
draw();
`;

// ---------------------------------------------------------------- card
const steps = REQUESTS.map((request) => {
  const { by, passed } = route(request.amount);
  const money = `${groupVND(request.amount)} ₫`;
  // Job titles read in lower case inside a sentence: "vượt hạn mức của trưởng nhóm".
  const role = (h) => APPROVERS[h].role.toLowerCase();
  const names = passed.map(role);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} và ${names[names.length - 1]}` : names[0];
  const asked = `Đề nghị ${request.id} xin ${money} để ${request.purpose}`;
  let caption;
  if (by === 0) caption = `${asked}, nằm trong hạn mức của ${role(0)}. Đồng xu lọt ngay lỗ đầu tiên, nên <strong>${role(0)} duyệt</strong> và chuỗi dừng ở đó.`;
  else if (by > 0) caption = `${asked}, vượt hạn mức của ${list} nên trượt qua ${["", "lỗ đầu", "hai lỗ đầu"][passed.length]}. Tới lỗ thứ ${["", "hai", "ba"][by]} thì đồng xu lọt xuống, nên <strong>${role(by)} duyệt</strong>.`;
  else caption = `${asked}, vượt cả ba hạn mức nên không lỗ nào giữ được. Đồng xu trượt khỏi cuối máng và rơi vào thùng, tức là đề nghị <strong>bị từ chối</strong>.`;
  // Keep each amount and its "₫" on one line in the caption.
  return { label: money, short: `${request.amount / 1e6}tr`, caption: caption.replaceAll(" ₫", "\u00a0₫") };
});

const first = REQUESTS[START];
export const plate = withSteps(k.plateHtml({
  fig: "Fig 4",
  title: "Chain of Responsibility",
  hint: "Rê chuột để chọn đề nghị",
  readout: `${groupVND(first.amount)} ₫ → ${APPROVERS[route(first.amount).by].role} duyệt`,
  keys: [
    { mark: "lit", label: "Cờ bật lên ở người duyệt vừa nhận đề nghị" },
    { mark: "raised", label: "Đồng xu là đề nghị chi, càng nhiều tiền càng to, còn mỗi lỗ tròn là hạn mức của một người duyệt" },
  ],
  caption:
    "Ba lỗ trên máng xếp đúng thứ tự của chuỗi duyệt, lỗ sau to hơn lỗ trước, và đồng xu chỉ được thả vào ở đầu máng, giống như client chỉ gọi người duyệt đầu tiên. Tới mỗi lỗ, đồng xu hoặc lọt xuống để người đó duyệt và chuỗi dừng lại, hoặc to hơn lỗ nên trượt sang lỗ kế tiếp. Không lỗ nào giữ được thì nó rơi khỏi cuối máng và đề nghị bị từ chối, còn muốn thêm một cấp duyệt thì chỉ cần khoan thêm một lỗ.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Máy phân loại đồng xu, dùng phím mũi tên để chọn một trong bốn đề nghị chi" aria-valuemin="1" aria-valuemax="${REQUESTS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Chọn đề nghị chi", steps, start: START }));

export const FIGURE_CSS = `
.dp-bore{fill:var(--anatomy-shade-1)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-inside{fill:var(--anatomy-shade-0)}
.dp-back{fill:none;stroke:var(--anatomy-shade-1);stroke-width:.6px;vector-effect:non-scaling-stroke}
.dp-bezel{fill:var(--anatomy-shade-2)}
.dp-plate{fill:var(--anatomy-top)}
.iso-stage{touch-action:pan-y}
.dp-short{white-space:nowrap}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
