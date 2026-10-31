// The Interpreter figure: a mechanical logic tree built in the shape of the rule
// hạng == "vàng" HOẶC (tổng_đơn >= 500000 VÀ khu_vực == "HN").
// Three sensor bars at the bottom are the comparison leaves: a bar slides so the
// customer's value sits under a roller (Var), and the bar's top carries the
// rule's constant as a tooth for == or a step for >= (Const). A true comparison
// lifts its rod. The VÀ gate is a spring-loaded table held down by two fingers,
// so it rises only when both rods rise; the HOẶC gate is a beam resting on two
// rods, so either one lifts it. The root rod turns a signal arm: raised means
// the customer gets the promotion. Every height comes from parts.mjs, and every
// value from model.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { CUSTOMERS, RULE, dots, evaluate, leafTruths } from "./model.mjs";
import { ARM_UNDER, FLAT, PIVOT, RAMP, RISE, ROLLER, STATIONS, angleFor, armExtent, armSvg, helixPaths, profileAt, riseAt, tOf } from "./parts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = { iso: k.iso, depthOf: k.depthOf, pathOf: k.pathOf };

const WIDTH = 600;
const HEIGHT = 470;
const START = 1;

const PLATE = { x: -110, y: -62, w: 212, d: 130, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// Sensor bars, their channels and the rods that ride them.
const BAR_Z = 2.5;
const BAR_TOP = 9;
const REST_C = BAR_TOP + ROLLER;
const ROD_R = 1.4;
const COLLAR_TOP = 16.5;
const CHANNEL_Y = [-52, 58];

// Frame: two posts, two guide rails and a top beam behind the tree.
const POSTS = [-99, 86];
const RAILS = [[30, 34], [62, 66], [92, 96]];
const RAIL_PLAN = { x: -93, y: -12, w: 179, d: 7, r: 0.8 };
const POST_TOP = 106;

// Gates.
const AND_X = 35;
const TABLE = { x: 17, y: -4, w: 36, d: 8, r: 1 };
const TABLE_Z = [45, 49];
const SEAT = { x: 19, y: -5, w: 32, d: 8.5, r: 1 };
const SEAT_TOP = 35;
const SPRINGS_X = [25, 45];
const FINGER_Z = [49, 51.5];
const YOKE = { x: -77, y: -3, w: 119, d: 6, r: 1 };
const YOKE_Z = [78, 82.5];
const ROOT_X = -17.5;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners({ x: -100, y: -15, w: 194, d: 12, r: 1 }, 0, POST_TOP + 2),
    ...armExtent(angleFor(RISE)).map(([x, y, z]) => [x, y, z + 2]),
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 60 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const X = [1, 0, 0];
const Y = [0, 1, 0];

// The pose of every moving part for one customer, from the bar positions alone.
export function poseOf(positions) {
  const rises = STATIONS.map((station, i) => riseAt(station, positions[i]));
  const and = Math.min(rises[1], rises[2]);
  const or = Math.max(rises[0], and);
  return { rises, and, or, theta: angleFor(or) };
}
const positionsOf = (customer) => STATIONS.map((station) => tOf(station, customer.ctx[station.key]));
const POSE = poseOf(positionsOf(CUSTOMERS[START]));

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of [...k.corners(PLATE, 22)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate, front left.
  const label = { x: -104, y: 30, w: 20, d: 26, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[36, 13], [40, 9], [44, 11], [48, 7]].map(([y, w]) => k.lineOnTop([-100, y], [-100 + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 2.6, 0.8]), at([label.x + label.w - 2.6, label.y + label.d - 2.6, 0.8])], { size: 0.4 }));
  return out.join("");
}

// An engraved plate between the first two channels: the rule's tree, root on top,
// the same shape the machine is built in.
function treePlate() {
  const plate = { x: -54, y: 26, w: 46, d: 30, r: 2 };
  const out = [S(k.slabOf(plate, 0, 1, P, 4, 0.4), { tone: "lo" })];
  out.push(L(k.planOutline(k.insetPlan(plate, 2), 1, P, 4), { tone: "faint" }));
  // Nodes along y (the plate's depth reads as the tree's height), branches as lines.
  const node = { root: [-34, 32], or: [-34, 32], left: [-46, 48], and: [-24, 40], a: [-30, 50], b: [-18, 50] };
  const seg = (p, q) => k.lineOnTop(p, q, 1, P);
  const top = ([x, y]) => [x, y - 1.2];
  out.push(L([seg(node.root, top(node.left)), seg(node.root, node.and), seg(node.and, top(node.a)), seg(node.and, top(node.b))].join(""), { tone: "lo" }));
  out.push(L([node.root, node.and].map(([x, y]) => k.ring(x, y, 1.6, 1, P, 16)).join(""), { tone: "mid" }));
  out.push(L([node.left, node.a, node.b].map(([x, y]) => k.planOutline({ x: x - 1.8, y: y - 1.2, w: 3.6, d: 2.4, r: 0.4 }, 1, P, 2)).join(""), { tone: "mid" }));
  out.push(D([node.root, node.and].map(([x, y]) => at([x, y, 1])), { size: 0.45, tone: "hi" }));
  out.push(D([[plate.x + 2.4, plate.y + 2.4], [plate.x + plate.w - 2.4, plate.y + 2.4], [plate.x + 2.4, plate.y + plate.d - 2.4], [plate.x + plate.w - 2.4, plate.y + plate.d - 2.4]].map(([x, y]) => at([x, y, 1])), { size: 0.4 }));
  return out.join("");
}

// The customer card in its tray, front right: the context the rule is run against.
function cardTray() {
  const tray = { x: 74, y: 16, w: 26, d: 36, r: 2 };
  const card = { x: 77, y: 19, w: 20, d: 30, r: 1 };
  const out = [];
  out.push(S(k.slabOf(tray, 0, 1.8, P, 4, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf(card, 1.8, 0.4, P, 3), { tone: "lo", crease: "none" }));
  // Name across the card, then three printed rows for its three values.
  out.push(`<text class="iso-face-text ip-card" data-part="card" data-tone="hi" transform="${k.topMatrix([79.5, 29], 2.2, P, "x")}" font-size="4.6">${CUSTOMERS[START].name.toUpperCase()}</text>`);
  out.push(L([34, 38.5, 43].map((y, i) => k.lineOnTop([79.5, y], [79.5 + [13, 10, 12][i], y], 2.2, P)).join(""), { tone: "lo", free: true }));
  out.push(S(k.slabOf({ x: 85, y: 49.4, w: 6, d: 2.4, r: 0.6 }, 1.8, 1.4, P, 2), { tone: "mid" }));
  out.push(D([at([tray.x + 1.6, tray.y + 1.6, 1.8]), at([tray.x + tray.w - 1.6, tray.y + 1.6, 1.8])], { size: 0.4 }));
  return out.join("");
}

// One sensor's channel and bar. The bar is drawn at position 0 (its t = 0 under
// the roller) and slid by the live code.
function channelBack(station) {
  const { x } = station;
  const out = [];
  out.push(S(k.slabOf({ x: x - 8, y: CHANNEL_Y[0], w: 16, d: CHANNEL_Y[1] - CHANNEL_Y[0], r: 1 }, 0, BAR_Z, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x - 8, y: CHANNEL_Y[0], w: 16, d: 3, r: 0.6 }, BAR_Z, 6.5, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x - 8, y: CHANNEL_Y[0] + 3, w: 3, d: CHANNEL_Y[1] - CHANNEL_Y[0] - 6, r: 0.6 }, BAR_Z, 4, P, 2), { tone: "mid" }));
  return out.join("");
}

function bar(station, index) {
  const { x, span } = station;
  const out = [];
  const plan = { x: x - 4, y: span[0], w: 8, d: span[1] - span[0], r: 1 };
  out.push(S(k.slabOf(plan, BAR_Z, BAR_TOP - BAR_Z, P, 3, 0.5), { tone: "hi", crease: "lo" }));
  const F = G.frameAlong([x - 4, 0, 0], X);
  const top = BAR_TOP + RISE;
  const tooth = station.kind === "eq"
    ? [[station.at - FLAT - RAMP, BAR_TOP], [station.at - FLAT, top], [station.at + FLAT, top], [station.at + FLAT + RAMP, BAR_TOP]]
    : [[station.at - RAMP, BAR_TOP], [station.at, top], [span[1] - 0.6, top], [span[1] - 0.6, BAR_TOP]];
  out.push(S(G.prismOf(F, tooth, 0, 8, P), { tone: "hi", crease: "lo" }));
  // Value marks across the top near the front edge: the customer's value is read where a mark meets the pointer.
  const marks = station.kind === "eq"
    ? station.marks.map(([, t]) => [t, t === station.at])
    : Array.from({ length: 12 }, (_, i) => [i * 4, i % 5 === 0]);
  const tick = ([t, major]) => k.segment([x + (major ? 0.6 : 1.8), t, BAR_TOP + profileAt(station, t)], [x + 3.4, t, BAR_TOP + profileAt(station, t)], P);
  out.push(L(marks.filter(([, major]) => !major).map(tick).join(""), { tone: "lo" }));
  out.push(L(marks.filter(([, major]) => major).map(tick).join(""), { tone: "mid" }));
  // Pull knob on the front end.
  const knob = G.frameAlong([x, span[1], (BAR_Z + BAR_TOP) / 2], Y);
  out.push(S(G.solidOf([[0, 1.3], [1.8, 1.3], [2.3, 2.5], [5, 2.5], [5.6, 1.9]], knob, P), { tone: "mid" }));
  out.push(k.fadedSvg(G.ribsOf(knob, 2.5, 5, 2.5, 18, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }));
  return `<g data-bar="${index}">${out.join("")}</g>`;
}

function channelFront(station) {
  const { x } = station;
  const out = [];
  out.push(S(k.slabOf({ x: x + 5, y: CHANNEL_Y[0] + 3, w: 3, d: CHANNEL_Y[1] - CHANNEL_Y[0] - 6, r: 0.6 }, BAR_Z, 4, P, 2), { tone: "mid" }));
  // Pointer on the lip, level with the roller: the value under it is the one being read.
  out.push(L(k.lineOnTop([x + 5.3, 0], [x + 7.7, 0], BAR_Z + 4, P), { tone: "hi" }));
  out.push(D([at([x + 6.5, 0, BAR_Z + 4])], { size: 0.45, tone: "hi" }));
  out.push(D([-40, 40].map((y) => at([x + 6.5, y, BAR_Z + 4])), { size: 0.4 }));
  const stop = { x: x - 8, y: CHANNEL_Y[1] - 3, w: 16, d: 3, r: 0.6 };
  out.push(S(k.slabOf(stop, BAR_Z, 6.5, P, 2), { tone: "mid" }));
  const name = { "hạng": "HẠNG", "tổng_đơn": "TỔNG ĐƠN", "khu_vực": "KHU VỰC" }[station.key];
  out.push(`<text class="iso-face-text" data-tone="lo" transform="${k.sideMatrix([x, CHANNEL_Y[1]], BAR_Z + 2.1, P, "left")}" font-size="2.5" text-anchor="middle">${name}</text>`);
  return out.join("");
}

function frameBack() {
  const out = [];
  const [x0] = POSTS;
  out.push(S(k.slabOf({ x: x0 - 3, y: -17, w: 12, d: 16, r: 1 }, 0, 2, P, 3, 0.4), { tone: "mid" }));
  out.push(D([[x0 - 1, -15], [x0 + 7, -3]].map(([x, y]) => at([x, y, 2])), { size: 0.4 }));
  out.push(S(k.slabOf({ x: x0, y: -14, w: 6, d: 10, r: 1 }, 2, POST_TOP - 2, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x0 - 1, y: -15, w: 8, d: 12, r: 1.2 }, POST_TOP, 2, P, 3, 0.4), { tone: "mid" }));
  for (const [z0, z1] of RAILS) {
    out.push(S(k.slabOf(RAIL_PLAN, z0, z1 - z0, P, 3, 0.4), { tone: "mid" }));
    out.push(D([RAIL_PLAN.x + 3, RAIL_PLAN.x + RAIL_PLAN.w - 3].map((x) => at([x, RAIL_PLAN.y + RAIL_PLAN.d, (z0 + z1) / 2])), { size: 0.45 }));
  }
  return out.join("");
}

function frameFront() {
  const x0 = POSTS[1];
  const out = [];
  out.push(S(k.slabOf({ x: x0 - 3, y: -17, w: 12, d: 16, r: 1 }, 0, 2, P, 3, 0.4), { tone: "mid" }));
  out.push(D([[x0 - 1, -15], [x0 + 7, -3]].map(([x, y]) => at([x, y, 2])), { size: 0.4 }));
  out.push(S(k.slabOf({ x: x0, y: -14, w: 6, d: 10, r: 1 }, 2, POST_TOP - 2, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x0 - 1, y: -15, w: 8, d: 12, r: 1.2 }, POST_TOP, 2, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}

// A guide block on a rail with a hole the rod runs through.
function guide(x, [z0, z1], { w = 10 } = {}) {
  const plan = { x: x - w / 2, y: -5, w, d: 9.5, r: 1 };
  const out = [];
  out.push(S(k.slabOf(plan, z0 - 1, z1 - z0 + 3, P, 3, 0.4), { tone: "mid" }));
  out.push(`<path class="ip-hole" d="${k.ring(x, 0, ROD_R + 0.8, z1 + 2, P, 24)}"/>`);
  out.push(L(k.ring(x, 0, ROD_R + 0.8, z1 + 2, P, 24), { tone: "lo" }));
  out.push(D([at([plan.x + 1.8, 3, z1 + 2]), at([plan.x + w - 1.8, 3, z1 + 2])], { size: 0.4 }));
  return out.join("");
}

// The part of a rod above a guide's top face, clipped there so the rod comes out of its hole.
let clips = 0;
function above(x, ztop, inner) {
  const id = `ip-clip-${clips++}`;
  const c = at([x, 0, ztop]);
  const rect = `M${(c[0] - 9).toFixed(1)} ${(c[1] - 400).toFixed(1)}H${(c[0] + 9).toFixed(1)}V${c[1].toFixed(1)}H${(c[0] - 9).toFixed(1)}Z`;
  return `<clipPath id="${id}"><path d="${rect}"/><path d="${k.ring(x, 0, ROD_R, ztop, P, 24)}Z"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
}

const rod = (x, z0, z1) => S(k.cylinder(x, 0, ROD_R, z0, z1 - z0, P, 20), { tone: "hi", crease: "lo" });
const lift = (h) => k.translateAlong(P, [0, 0, h]);

// The roller fork, collar and rod of one sensor, from the roller up to `top`.
function sensorRod(station, top) {
  const { x } = station;
  const out = [];
  out.push(S(k.slabOf({ x: x - 2.7, y: -2.3, w: 0.9, d: 4.6, r: 0.3 }, REST_C - 1, 4.4, P, 2), { tone: "mid" }));
  out.push(S(G.disc(-1.6, 1.6, ROLLER, G.frameAlong([x, 0, REST_C], X), P), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x + 1.8, y: -2.3, w: 0.9, d: 4.6, r: 0.3 }, REST_C - 1, 4.4, P, 2), { tone: "mid" }));
  out.push(D([at([x + 2.7, 0, REST_C])], { size: 0.5 }));
  out.push(S(k.slabOf({ x: x - 3.2, y: -3, w: 6.4, d: 6, r: 1 }, REST_C + 3.3, COLLAR_TOP - REST_C - 3.3, P, 3, 0.4), { tone: "mid" }));
  out.push(rod(x, COLLAR_TOP, top));
  return out.join("");
}

function spring(id, x, z0, z1, turns) {
  const { back, front } = helixPaths(KIT, P, x, 0, 2.7, z0, z1, turns);
  return { back: `<path class="iso-line" data-tone="mid" data-spring-back="${id}" d="${back}"/>`, front: `<path class="iso-line" data-tone="mid" data-spring-front="${id}" d="${front}"/>` };
}

const RAIL1_TOP = RAILS[0][1] + 2;
const RAIL2_TOP = RAILS[1][1] + 2;
const BEAM_TOP = RAILS[2][1] + 2;
const RAIL1_FOOT = RAILS[0][0] - 1;
const SENSOR_TOP = [YOKE_Z[0], FINGER_Z[1], FINGER_Z[1]];

// Everything of one sensor below the gates: spring, rod, its guide on the first rail.
function sensorLower(station, i) {
  const r = POSE.rises[i];
  const coil = spring(`leaf-${i}`, station.x, COLLAR_TOP + r, RAIL1_FOOT, 5);
  return [
    coil.back,
    `<g data-rod="${i}" transform="${lift(r)}">${sensorRod(station, SENSOR_TOP[i])}</g>`,
    coil.front,
    guide(station.x, RAILS[0]),
    above(station.x, RAIL1_TOP, `<g data-rod="${i}" transform="${lift(r)}">${rod(station.x, COLLAR_TOP, SENSOR_TOP[i])}</g>`),
  ].join("");
}

function andSeat() {
  const out = [];
  out.push(S(k.slabOf(SEAT, RAILS[0][0], SEAT_TOP - RAILS[0][0], P, 3, 0.5), { tone: "mid" }));
  out.push(D([[SEAT.x + 2, 2.4], [SEAT.x + SEAT.w - 2, 2.4]].map(([x, y]) => at([x, y, SEAT_TOP])), { size: 0.4 }));
  for (const x of SPRINGS_X) out.push(L(k.ring(x, 0, 3.2, SEAT_TOP, P, 24), { tone: "lo" }));
  for (const [j, x] of SPRINGS_X.entries()) {
    const coil = spring(`and-${j}`, x, SEAT_TOP, TABLE_Z[0] + POSE.and, 4);
    out.push(coil.back, S(k.cylinder(x, 0, 0.9, SEAT_TOP, 6, P, 16), { tone: "mid" }), coil.front);
  }
  return out.join("");
}

function andTable() {
  const out = [];
  out.push(S(k.slabOf(TABLE, TABLE_Z[0], TABLE_Z[1] - TABLE_Z[0], P, 3, 0.6), { tone: "hi", crease: "lo" }));
  out.push(`<text class="iso-face-text" data-tone="mid" transform="${k.sideMatrix([AND_X, TABLE.y + TABLE.d], TABLE_Z[0] + 0.8, P, "left")}" font-size="3.2" text-anchor="middle">VÀ</text>`);
  out.push(D([TABLE.x + 2.2, TABLE.x + TABLE.w - 2.2].map((x) => at([x, 0, TABLE_Z[1]])), { size: 0.4 }));
  out.push(S(k.cylinder(AND_X, 0, 2.4, TABLE_Z[1], 1.4, P, 24), { tone: "mid" }));
  out.push(rod(AND_X, TABLE_Z[1] + 1.4, YOKE_Z[0]));
  return out.join("");
}

function finger(i, x0) {
  const plan = { x: x0, y: -2, w: 14.4, d: 4, r: 0.8 };
  const rodX = STATIONS[i].x;
  return `<g data-rod="${i}" transform="${lift(POSE.rises[i])}">${S(k.slabOf(plan, FINGER_Z[0], FINGER_Z[1] - FINGER_Z[0], P, 3, 0.4), { tone: "hi", crease: "lo" })}${D([at([rodX, 0, FINGER_Z[1]])], { size: 0.45 })}</g>`;
}

function orYoke() {
  const out = [];
  out.push(S(k.slabOf(YOKE, YOKE_Z[0], YOKE_Z[1] - YOKE_Z[0], P, 3, 0.6), { tone: "hi", crease: "lo" }));
  out.push(`<text class="iso-face-text" data-tone="mid" transform="${k.sideMatrix([-45, YOKE.y + YOKE.d], YOKE_Z[0] + 1.1, P, "left")}" font-size="3.2" text-anchor="middle">HOẶC</text>`);
  out.push(D([YOKE.x + 2.4, YOKE.x + YOKE.w - 2.4].map((x) => at([x, 0, YOKE_Z[1]])), { size: 0.4 }));
  out.push(S(k.cylinder(ROOT_X, 0, 2.4, YOKE_Z[1], 1.4, P, 24), { tone: "mid" }));
  out.push(rod(ROOT_X, YOKE_Z[1] + 1.4, ARM_UNDER));
  return out.join("");
}

// The arm's bracket on the top beam, and the cap on its pivot pin.
function bracket() {
  return S(k.slabOf({ x: PIVOT[0] - 3, y: -5, w: 6, d: 4, r: 0.8 }, RAILS[2][1], PIVOT[1] + 3 - RAILS[2][1], P, 3, 0.4), { tone: "mid" })
    + S(G.disc(-1.2, -0.8, 2.6, G.frameAlong([PIVOT[0], 0, PIVOT[1]], Y), P), { tone: "mid" });
}
const pivotCap = () => S(G.disc(0.8, 2, 1.7, G.frameAlong([PIVOT[0], 0, PIVOT[1]], Y), P), { tone: "mid" }) + D([at([PIVOT[0], 2, PIVOT[1]])], { size: 0.45 });

const lit0 = POSE.or > RISE - 0.3;
export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một cỗ máy logic dựng theo đúng hình cây của quy tắc ưu đãi. Dưới cùng là ba thanh trượt mang hạng, tổng đơn và khu vực của khách, trên mỗi thanh có một con lăn với cần đứng. Cần của tổng đơn và khu vực đi lên cổng VÀ, một bàn có lò xo bị hai ngón đè xuống. Cần của hạng và trục ra của cổng VÀ cùng đỡ thanh ngang của cổng HOẶC, và trục trên cùng nâng một cánh tay tín hiệu khi quy tắc đúng.",
  body: [
    base(),
    treePlate(),
    cardTray(),
    ...STATIONS.map((station, i) => channelBack(station) + bar(station, i).replace('<g data-bar', `<g transform="${k.translateAlong(P, [0, -positionsOf(CUSTOMERS[START])[i], 0])}" data-bar`) + channelFront(station)),
    frameBack(),
    sensorLower(STATIONS[0], 0),
    sensorLower(STATIONS[1], 1),
    andSeat(),
    sensorLower(STATIONS[2], 2),
    `<g data-and="" transform="${lift(POSE.and)}">${andTable()}</g>`,
    guide(STATIONS[0].x, RAILS[1]),
    above(STATIONS[0].x, RAIL2_TOP, `<g data-rod="0" transform="${lift(POSE.rises[0])}">${rod(STATIONS[0].x, COLLAR_TOP, SENSOR_TOP[0])}</g>`),
    guide(AND_X, RAILS[1]),
    above(AND_X, RAIL2_TOP, `<g data-and="" transform="${lift(POSE.and)}">${rod(AND_X, TABLE_Z[1] + 1.4, YOKE_Z[0])}</g>`),
    finger(1, STATIONS[1].x - 1.4),
    finger(2, STATIONS[2].x + 1.4 - 14.4),
    `<g data-or="" transform="${lift(POSE.or)}">${orYoke()}</g>`,
    guide(ROOT_X, RAILS[2], { w: 9 }),
    above(ROOT_X, BEAM_TOP, `<g data-or="" transform="${lift(POSE.or)}">${rod(ROOT_X, YOKE_Z[1] + 1.4, ARM_UNDER)}</g>`),
    bracket(),
    `<g data-part="arm">${armSvg(KIT, P, POSE.theta, lit0)}</g>`,
    pivotCap(),
    frameFront(),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const PARTS = readFileSync(join(HERE, "parts.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
${PARTS}
const P = ${JSON.stringify(P)};
const K = { iso, depthOf, pathOf };
const START = ${START}, REST_C = ${REST_C}, COLLAR_TOP = ${COLLAR_TOP}, RAIL1_FOOT = ${RAIL1_FOOT}, SEAT_TOP = ${SEAT_TOP}, TABLE_BOTTOM = ${TABLE_Z[0]}, SPRINGS_X = ${JSON.stringify(SPRINGS_X)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const bars = STATIONS.map((_, i) => svg.querySelectorAll('[data-bar="' + i + '"]'));
const rods = STATIONS.map((_, i) => svg.querySelectorAll('[data-rod="' + i + '"]'));
const andParts = svg.querySelectorAll("[data-and]");
const orParts = svg.querySelectorAll("[data-or]");
const arm = svg.querySelector('[data-part="arm"]');
const card = svg.querySelector('[data-part="card"]');
const springsOf = (id) => [svg.querySelector('[data-spring-back="' + id + '"]'), svg.querySelector('[data-spring-front="' + id + '"]')];
const leafSprings = STATIONS.map((station, i) => springsOf("leaf-" + i));
const andSprings = SPRINGS_X.map((_, j) => springsOf("and-" + j));
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const targetsOf = (index) => STATIONS.map((station) => tOf(station, CUSTOMERS[index].ctx[station.key]));
let sel = START, pos = targetsOf(START), frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0, hovering = false, drawnArm = "";
const TOUR = 5.6;
const follow = (value, target, dt, tau, calm) => {
  if (calm) return target;
  const next = value + (target - value) * (1 - Math.exp(-dt / tau));
  return Math.abs(target - next) < 0.01 ? target : next;
};
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function describe() {
  const c = CUSTOMERS[sel];
  card.textContent = c.name.toUpperCase();
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", "Khách " + c.name + ", hạng " + c.ctx["hạng"] + ", tổng đơn " + dots(c.ctx["tổng_đơn"]) + " đồng, khu vực " + c.ctx["khu_vực"] + ". " + (evaluate(RULE, c.ctx) ? "Được ưu đãi." : "Không được ưu đãi."));
  emit();
}
function draw() {
  const rises = STATIONS.map((station, i) => riseAt(station, pos[i]));
  const and = Math.min(rises[1], rises[2]);
  const or = Math.max(rises[0], and);
  STATIONS.forEach((_, i) => {
    const slide = translateAlong(P, [0, -pos[i], 0]);
    bars[i].forEach((el) => el.setAttribute("transform", slide));
    const up = translateAlong(P, [0, 0, rises[i]]);
    rods[i].forEach((el) => el.setAttribute("transform", up));
    const coil = helixPaths(K, P, STATIONS[i].x, 0, 2.7, COLLAR_TOP + rises[i], RAIL1_FOOT, 5);
    leafSprings[i][0].setAttribute("d", coil.back);
    leafSprings[i][1].setAttribute("d", coil.front);
  });
  const andUp = translateAlong(P, [0, 0, and]);
  andParts.forEach((el) => el.setAttribute("transform", andUp));
  SPRINGS_X.forEach((x, j) => {
    const coil = helixPaths(K, P, x, 0, 2.7, SEAT_TOP, TABLE_BOTTOM + and, 4);
    andSprings[j][0].setAttribute("d", coil.back);
    andSprings[j][1].setAttribute("d", coil.front);
  });
  const orUp = translateAlong(P, [0, 0, or]);
  orParts.forEach((el) => el.setAttribute("transform", orUp));
  const lit = or > RISE - 0.3;
  const key = or.toFixed(3) + lit;
  if (key !== drawnArm) { drawnArm = key; arm.innerHTML = armSvg(K, P, angleFor(or), lit); }
  const targets = targetsOf(sel);
  const settled = pos.every((p, i) => Math.abs(p - targets[i]) < 0.02);
  const c = CUSTOMERS[sel];
  const text = settled ? c.name + " → " + (evaluate(RULE, c.ctx) ? "được ưu đãi" : "không") : "đang nạp khách " + c.name;
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring && !hovering) {
    clock += dt;
    const next = (Math.floor(clock / TOUR) + START) % CUSTOMERS.length;
    if (next !== sel) { sel = next; describe(); }
  }
  const targets = targetsOf(sel);
  pos = pos.map((p, i) => follow(p, targets[i], dt, 0.38, calm));
  draw();
  const settled = !touring && pos.every((p, i) => p === targets[i]);
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const tourFrom = (index) => ((index - START + CUSTOMERS.length) % CUSTOMERS.length) * TOUR;
// A tap, a key or a step button holds the chosen customer until play is pressed.
const choose = (index) => {
  touring = false;
  clearTimeout(idleTimer);
  if (index !== sel) { sel = index; describe(); } else emit();
  run();
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = true; clock = tourFrom(sel); emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
// A mouse resting on the figure only pauses the tour for a moment.
stage.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse" && touring) hovering = true; });
stage.addEventListener("pointerleave", (event) => {
  if (event.pointerType !== "mouse" || !hovering) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { hovering = false; clock = tourFrom(sel); run(); }, 3600);
});
stage.addEventListener("click", () => choose((sel + 1) % CUSTOMERS.length));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = (sel + 1) % CUSTOMERS.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = (sel - 1 + CUSTOMERS.length) % CUSTOMERS.length;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = CUSTOMERS.length - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to);
});
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để đổi khách";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
describe();
draw();
`;

// Step captions, written from what the tree does with each customer.
function caption({ name, ctx }) {
  const [gold, big, hn] = leafTruths(ctx);
  const ok = evaluate(RULE, ctx);
  const money = `${dots(ctx["tổng_đơn"])} ₫`;
  if (gold) return `${name} có hạng ${ctx["hạng"]} nên cần bên trái nhô lên và đẩy thanh HOẶC lên theo. Đơn chỉ ${money} ở ${ctx["khu_vực"]} cũng không sao, vì HOẶC chỉ cần một nhánh đúng: <strong>được ưu đãi</strong>.`;
  if (ok) return `${name} chỉ hạng ${ctx["hạng"]}, nhưng đơn ${money} và ở ${ctx["khu_vực"]} nên cả hai ngón của cổng VÀ cùng nhấc. Lò xo đẩy bàn VÀ lên, bàn đẩy thanh HOẶC, và cánh tay tín hiệu dựng lên: <strong>được ưu đãi</strong>.`;
  const one = big ? `Đơn của ${name} đạt ${money} nên một ngón của cổng VÀ đã nhấc, nhưng ${name} ở ${ctx["khu_vực"]} nên ngón còn lại vẫn đè bàn xuống` : `Đơn của ${name} chỉ ${money} nên cổng VÀ nằm yên`;
  return `${one}. Hạng ${ctx["hạng"]} cũng không nâng được nhánh trái, nên cánh tay nằm ngang: <strong>không được ưu đãi</strong>.`;
}

const steps = CUSTOMERS.map((customer) => ({ label: `Khách ${customer.name}`, short: customer.name, caption: caption(customer) }));
const first = CUSTOMERS[START];
export const plate = withSteps(k.plateHtml({
  fig: "Fig 22",
  title: "Interpreter",
  hint: "Bấm vào hình để đổi khách",
  readout: `${first.name} → ${evaluate(RULE, first.ctx) ? "được ưu đãi" : "không"}`,
  keys: [
    { mark: "lit", label: "Đĩa tín hiệu, dựng lên khi quy tắc đúng với khách đang xét" },
    { mark: "raised", label: "Răng trên thanh trượt, tức hằng số viết trong quy tắc" },
  ],
  caption:
    "Cỗ máy được lắp đúng theo hình cái cây của quy tắc. Mỗi thanh trượt ở dưới mang một giá trị của khách, và cần cảm biến chỉ nhô lên khi con lăn gặp răng, tức khi phép so sánh đúng. Cổng VÀ chỉ nhấc khi cả hai ngón cùng lên, cổng HOẶC nhấc khi một trong hai cần đẩy lên, nên cánh tay trên cùng cho biết khách có được ưu đãi hay không.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Interpreter, dùng phím mũi tên để đổi khách hàng" aria-valuemin="1" aria-valuemax="${CUSTOMERS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Chọn khách hàng", steps, start: START }));

export const FIGURE_CSS = `
.ip-hole{fill:var(--anatomy-shade-0)}
.ip-card{letter-spacing:.06em}
.iso-stage{touch-action:pan-y;cursor:pointer}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
