// The Mediator figure: a small telephone exchange and the order departments'
// station sets in front of it. Through the exchange (OrderMediator) every
// station has one line, and the operator's panel decides who is called: the
// caller's drop flap falls, the keys of the called lines are thrown, a pulse
// runs out on those lines and their flags rise. Wired straight instead, the
// four stations need six point-to-point wires over their tops, and each one
// rings the others itself. The wire counter on the exchange's side counts the
// wires (model.mjs); the motion comes from motion.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { STATIONS, STEPS, story, vnd, wires } from "./model.mjs";
import { rest } from "./motion.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 420;
const AZIMUTH = 50;

const PLATE = { x: -118, y: -88, w: 238, d: 144, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// The exchange: a cabinet whose front (+y) carries the operator's panel.
const CAB = { x: -46, y: -80, w: 92, d: 28, r: 3 };
const CAB_Z = [3, 64];
const FRONT = CAB.y + CAB.d;
const SIDE = CAB.x + CAB.w;
const COLS = [-32, -16, 0, 16, 32];
const DROP = { w: 10, h: 8, z: 50 };
const JACK_Z = 40.5;
const SHELF = { x: -44, y: FRONT, w: 88, d: 13, r: 2 };
const SHELF_Z = [21, 24];
const KEY_Y = FRONT + 5;
const KEY_THROW = 4.5;
const GLAND_Z = 6;
const COMB_Y = -30;

// The station sets, one per department, in a row in front of the exchange.
const ST_X = [-88, -44, 0, 44, 88];
const ST = { y: 18, w: 28, d: 24 };
const TOP = 15;
const POST_Y = 21.5;
const POST_DX = [-7, 0, 7];
const POST_TOP = TOP + 4.4;
const FLAG = { x0: -11, x1: -3.5, y: 35, rise: 12, low: 3.5, high: 10 };
const BUTTON = { dx: 6.5, y: 31.5, dip: 1.6 };


// Mesh wires: which post on each station each pair uses, so the arches nest.
const ARCS = [
  { a: 0, b: 1, pa: 2, pb: 0, lift: 0 },
  { a: 1, b: 2, pa: 2, pb: 0, lift: 0 },
  { a: 2, b: 3, pa: 2, pb: 0, lift: 0 },
  { a: 0, b: 2, pa: 1, pb: 1, lift: 0 },
  { a: 1, b: 3, pa: 1, pb: 1, lift: 4 },
  { a: 0, b: 3, pa: 0, pb: 2, lift: 0 },
];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(CAB, 0, CAB_Z[1] + 12)],
  WIDTH,
  HEIGHT,
  { pad: 20, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const slab = (plan, z0, z1, steps = 3, bevel = 0) => k.slabOf(plan, z0, z1 - z0, P, steps, bevel);
const Y = [0, 1, 0];
const X = [1, 0, 0];
const Z = [0, 0, 1];
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const poly = (points) => k.pathOf(points.map(at), true);
const lengthOf = (points) => points.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0), 0);

// ---------------------------------------------------------------- base

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of [...k.corners(PLATE, 22)].sort((p, q) => k.depthOf([...p, 0], P) - k.depthOf([...q, 0], P))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate at the front left.
  const label = { x: -106, y: -74, w: 40, d: 12, r: 1.5 };
  out.push(S(slab(label, 0, 0.8, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-100, -70, 22], [-100, -67.5, 15], [-100, -65, 19]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 6, 0.8]), at([label.x + label.w - 2.6, label.y + 6, 0.8])], { size: 0.4 }));
  // The spare place for a fifth station: four corner marks on the plate.
  const [x0, x1, y0, y1] = [ST_X[4] - ST.w / 2 - 2, ST_X[4] + ST.w / 2 + 2, ST.y - 2, ST.y + ST.d + 2];
  const marks = [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]
    .map(([x, y, sx, sy]) => k.onTop([[x + sx * 5, y], [x, y], [x, y + sy * 5]], 0, P)).join("");
  out.push(L(marks, { tone: "lo", free: true }));
  return out.join("");
}

// ---------------------------------------------------------------- exchange

function exchangeBody() {
  const out = [];
  out.push(S(slab(k.insetPlan(CAB, -1.5), 0, CAB_Z[0], 4, 0.5), { tone: "lo" }));
  const seam = k.sideSeam(CAB, 14, P, 6);
  out.push(S(slab(CAB, CAB_Z[0], CAB_Z[1], 6, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  // Lid: a cap with vents and a pair of night-bell gongs.
  out.push(S(slab(k.insetPlan(CAB, 1.5), CAB_Z[1], CAB_Z[1] + 2.4, 5, 0.6), { tone: "mid" }));
  const lid = CAB_Z[1] + 2.4;
  for (let i = 0; i < 5; i++) out.push(L(k.planOutline({ x: 8 + i * 6, y: -72, w: 2.4, d: 14, r: 1.2 }, lid, P, 3), { tone: "lo" }));
  out.push(D([[-40, -74], [40, -74], [-40, -58], [40, -58]].map(([x, y]) => at([x, y, lid])), { size: 0.45 }));
  out.push(S(slab({ x: -36, y: -69, w: 30, d: 6, r: 1.5 }, lid, lid + 1.6, 3), { tone: "mid" }));
  for (const gx of [-29, -13]) {
    const F = G.frameAlong([gx, -66, lid + 1.6], Z);
    out.push(S(G.solidOf([[0, 1.2], [1.4, 1.2]], F, P), { tone: "mid" }));
    out.push(S(G.solidOf([[1.4, 6], [2.2, 5.9], [4, 5], [5.4, 3.2], [6, 1.2]], F, P), { tone: "hi", crease: "lo" }));
    out.push(S(G.solidOf([[6, 1], [7, 1], [7.4, 0.5]], F, P), { tone: "mid" }));
  }
  // The striker between the gongs.
  out.push(S(k.cylinder(-21, -66, 0.8, lid + 1.6, 6, P, 12), { tone: "mid" }));
  out.push(S(k.cylinder(-21, -66, 1.6, lid + 7.6, 1.8, P, 16), { tone: "hi", crease: "lo" }));
  return out.join("");
}

// The operator's panel on the +y face: drop flaps, jacks and the tag strip.
function panel() {
  const out = [];
  const M = k.sideMatrix([CAB.x + 4, FRONT], CAB_Z[1] - 4, P, "left");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="faint" d="${rrect(0, 0, CAB.w - 8, CAB_Z[1] - CAB_Z[0] - 30, 2)}"/></g>`);
  COLS.forEach((cx, c) => {
    // Window behind each drop flap, with the line's tag: seen once the flap falls.
    const W = k.sideMatrix([cx - DROP.w / 2, FRONT], DROP.z + DROP.h, P, "left");
    out.push(`<g transform="${W}"><path class="dp-window" d="${rrect(0, 0, DROP.w, DROP.h, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, DROP.w, DROP.h, 1)}"/>
      <text class="iso-face-text dp-tag" data-tone="mid" x="${DROP.w / 2}" y="${DROP.h / 2 + 1.2}" font-size="3.2" text-anchor="middle">${c + 1}</text></g>`);
    // Hinge bar under the flap.
    out.push(S(slab({ x: cx - DROP.w / 2 - 0.5, y: FRONT, w: DROP.w + 1, d: 1.2, r: 0.4 }, DROP.z - 1.2, DROP.z, 2), { tone: "mid", crease: "none" }));
    // Jack with its bezel.
    const F = G.frameAlong([cx, FRONT, JACK_Z], Y);
    out.push(S(G.disc(0, 0.9, 2.8, F, P), { tone: "mid" }));
    out.push(`<path class="dp-hole" d="${G.circleOf(F, 0.9, 1.3, P, 24)}"/>`, L(G.circleOf(F, 0.9, 1.3, P, 24), { tone: "lo" }));
  });
  // The spare jack's cap, taken off when the fifth line is plugged in.
  const Fs = G.frameAlong([COLS[4], FRONT, JACK_Z], Y);
  out.push(`<g data-part="spare-cap">${S(G.disc(0.9, 2, 2.4, Fs, P), { tone: "hi", crease: "lo" })}</g>`);
  // Tag strip under the jacks, one tag per line.
  const T = k.sideMatrix([CAB.x + 6, FRONT], 35, P, "left");
  const tags = STATIONS.map((s, c) => `<text class="iso-face-text dp-tag" data-tone="mid" x="${COLS[c] - CAB.x - 6}" y="3.6" font-size="2.9" text-anchor="middle">${s.tag}</text>`).join("");
  out.push(`<g transform="${T}"><path class="dp-plate" d="${rrect(0, 0, CAB.w - 12, 5, 0.8)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, CAB.w - 12, 5, 0.8)}"/>${tags}</g>`);
  out.push(D([[CAB.x + 8, 32.5], [SIDE - 8, 32.5]].map(([x, z]) => at([x, FRONT, z])), { size: 0.4 }));
  return out.join("");
}

// A drop flap at angle `a` (0 shut against the panel, 1 fallen flat).
function flap(cx, a) {
  const th = (a * Math.PI) / 2;
  const [x0, x1] = [cx - DROP.w / 2 + 0.4, cx + DROP.w / 2 - 0.4];
  const z0 = DROP.z;
  const y1 = FRONT + 0.4 + DROP.h * Math.sin(th);
  const z1 = z0 + DROP.h * Math.cos(th);
  const quad = [[x0, FRONT + 0.4, z0], [x1, FRONT + 0.4, z0], [x1, y1, z1], [x0, y1, z1]];
  const d = poly(quad);
  const mid = at([(x0 + x1) / 2, FRONT + 0.4 + (DROP.h - 2) * Math.sin(th), z0 + (DROP.h - 2) * Math.cos(th)]);
  return `<path class="dp-flap" d="${d}"/><path class="iso-line" data-tone="hi" d="${d}"/>${D([mid], { size: 0.45 })}`;
}
const FLAP_FRAMES = 7;
function drops(start) {
  return COLS.map((cx, c) => {
    const frames = Array.from({ length: FLAP_FRAMES }, (_, f) => `<g${f === Math.round(start[c] * (FLAP_FRAMES - 1)) ? "" : ' display="none"'}>${flap(cx, f / (FLAP_FRAMES - 1))}</g>`).join("");
    return `<g data-part="drop" data-line="${c}">${frames}</g>`;
  }).join("");
}

function glands() {
  return COLS.map((cx) => {
    const F = G.frameAlong([cx, FRONT, GLAND_Z], Y);
    return S(G.solidOf([[0, 2.6], [1.2, 2.6], [1.2, 2], [3.2, 1.9]], F, P), { tone: "mid" });
  }).join("");
}

function shelf(start) {
  const out = [];
  for (const x of [-43, 41]) out.push(S(slab({ x, y: FRONT, w: 2, d: 9, r: 0.5 }, 12, SHELF_Z[0], 2), { tone: "mid" }));
  out.push(S(slab(SHELF, SHELF_Z[0], SHELF_Z[1], 4, 0.6), { tone: "mid" }));
  out.push(D([[-41, FRONT + 10.5], [41, FRONT + 10.5]].map(([x, y]) => at([x, y, SHELF_Z[1]])), { size: 0.4 }));
  for (const cx of COLS) out.push(L(k.planOutline({ x: cx - 1.4, y: KEY_Y - 1.6, w: 2.8, d: KEY_THROW + 3.2, r: 1.4 }, SHELF_Z[1], P, 4), { tone: "lo" }));
  COLS.forEach((cx, c) => {
    const key = S(k.cylinder(cx, KEY_Y, 0.9, SHELF_Z[1], 2.6, P, 12), { tone: "mid" })
      + `<g data-part="key-cap">${S(k.cylinder(cx, KEY_Y, 2.3, SHELF_Z[1] + 2.6, 2.2, P, 24, 0.4), { tone: "hi", crease: "lo" })}</g>`;
    out.push(`<g data-part="key" data-line="${c}" transform="${k.translateAlong(P, [0, start[c] * KEY_THROW, 0])}">${key}</g>`);
  });
  return out.join("");
}

// The +x face: the operator's magneto crank, the wire counter and a nameplate.
function sideFace(wireCount) {
  const out = [];
  const Fb = G.frameAlong([SIDE, -64, 48], X);
  out.push(S(G.solidOf([[0, 3.4], [1.2, 3.4], [1.2, 2.2], [3, 2.2]], Fb, P), { tone: "mid" }));
  out.push(S(k.slabOf({ x: SIDE + 3, y: -65.2, w: 1.6, d: 2.4, r: 0.6 }, 39, 9.4, P, 2), { tone: "mid" }));
  const Fh = G.frameAlong([SIDE + 4.6, -64, 40], X);
  out.push(S(G.solidOf([[0, 1.5], [5, 1.5], [5.6, 1]], Fh, P), { tone: "hi", crease: "lo" }));
  // Counter: "SỐ DÂY" and two number wheels behind a window.
  const C = k.sideMatrix([SIDE, -53], 31, P, "right");
  const pitch = 6.4;
  const wheel = Array.from({ length: 10 }, (_, n) => `<text class="iso-face-text dp-digit" data-tone="hi" x="12.3" y="${6.9 + n * pitch}" font-size="5.6" text-anchor="middle">${n}</text>`).join("");
  out.push(`<g transform="${C}">
    <text class="iso-face-text dp-tag" data-tone="mid" x="0.5" y="-1.6" font-size="2.6">SỐ DÂY</text>
    <clipPath id="dp-counter"><path d="${rrect(1, 0.6, 16, 8, 1)}"/></clipPath>
    <path class="dp-window" d="${rrect(1, 0.6, 16, 8, 1)}"/>
    <g clip-path="url(#dp-counter)"><text class="iso-face-text dp-digit" data-tone="hi" x="5.6" y="6.9" font-size="5.6" text-anchor="middle">0</text>
      <g data-part="units" transform="translate(0 ${(-wireCount * pitch).toFixed(2)})">${wheel}</g></g>
    <path class="iso-line" data-tone="lo" d="${rrect(1, 0.6, 16, 8, 1)}"/><path class="iso-line" data-tone="faint" d="M9 0.6V8.6"/>
  </g>`);
  out.push(`<g transform="${k.sideMatrix([SIDE, -54], 18, P, "right")}"><path class="dp-plate" d="${rrect(0, 0, 20, 8, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 20, 8, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="M3 2.6H15M3 4.4H12M3 6.2H16"/></g>`);
  out.push(D([at([SIDE, -55.5, 15]), at([SIDE, -72.5, 15])], { size: 0.4 }));
  return { svg: out.join(""), pitch };
}

// The exchange's battery at the back right: a box with two cells and a lead to the cabinet.
const BATT = { x: 66, y: -78, w: 40, d: 26, r: 2.5 };
function battery() {
  const out = [];
  out.push(S(slab(k.insetPlan(BATT, -1), 0, 1.6, 4), { tone: "lo" }));
  out.push(S(slab(BATT, 1.6, 14, 5, 0.6), { tone: "mid", inner: L(k.sideSeam(BATT, 11, P, 5), { tone: "faint" }) }));
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: BATT.x + 3, y: BATT.y + 4 + i * 4.6, w: 1.8, d: 2.6, r: 0.9 }, 14, P, 2), { tone: "lo" }));
  out.push(D([[BATT.x + 2.4, BATT.y + 2.4], [BATT.x + BATT.w - 2.4, BATT.y + 2.4], [BATT.x + BATT.w - 2.4, BATT.y + BATT.d - 2.4]].map(([x, y]) => at([x, y, 14])), { size: 0.4 }));
  // The lead's gland on the front, and the two cells' outer terminals wired down to it inside.
  const F = G.frameAlong([BATT_GLAND[0], BATT.y + BATT.d, BATT_GLAND[1]], Y);
  out.push(S(G.solidOf([[0, 2.4], [1, 2.4], [1, 1.8], [2.8, 1.7]], F, P), { tone: "mid" }));
  for (const [cx, cy] of [[78, -65], [94, -65]]) {
    out.push(S(k.cylinder(cx, cy, 6.4, 14, 1, P, 32), { tone: "lo" }));
    out.push(S(k.cylinder(cx, cy, 5.6, 15, 12, P, 32, 0.6), { tone: "mid" }));
    out.push(L(k.ring(cx, cy, 4, 27, P, 28), { tone: "faint" }));
    for (const [dx, dy] of [[-2.2, 0], [2.2, 0]]) {
      out.push(S(k.cylinder(cx + dx, cy + dy, 1.1, 27, 2.2, P, 12), { tone: "hi", crease: "lo" }));
    }
  }
  // Strap between the cells.
  out.push(S(slab({ x: 79.6, y: -66, w: 12.8, d: 2, r: 0.6 }, 28.6, 29.4, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}
// The battery lead: out of the battery's front gland, along the floor, into a gland on the cabinet's side.
const BATT_GLAND = [74, 6];
const LEAD = [[74, -49.2, 6], [74, -47.4, 3.2], [74, -45, 1.4], [70, -42, 1.4], [56, -48, 1.4], [SIDE + 6.4, -60, 1.4], [SIDE + 4, -60, 3], [SIDE + 3, -60, 6]].map(at);
function leadGland() {
  const F = G.frameAlong([SIDE, -60, 6], X);
  return S(G.solidOf([[0, 2.4], [1, 2.4], [1, 1.8], [3, 1.7]], F, P), { tone: "mid" });
}

// ---------------------------------------------------------------- lines

// A line from the exchange's gland to station `i`, along the floor through the comb.
function trunkPoints(i) {
  const cx = COLS[i];
  const pts = [[cx, FRONT + 3.2, GLAND_Z], [cx, FRONT + 5.4, 3], [cx, FRONT + 8, 1.4], [cx, COMB_Y + 6, 1.4]];
  const corner = [ST_X[i], ST.y - 9, 1.4];
  const steps = 16;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    pts.push([cx + (corner[0] - cx) * t, COMB_Y + 6 + (corner[1] - COMB_Y - 6) * t, 1.4]);
  }
  // Straight on to the station, then up its back face, out of sight.
  pts.push([ST_X[i], ST.y - 3.4, 1.4], [ST_X[i], ST.y - 1.4, 3], [ST_X[i], ST.y - 1, TOP - 0.6]);
  return pts;
}
// The visible end of the line: over the station's back edge to its middle post,
// the terminal the line is screwed to. Drawn with the station, after its body.
function riserPoints(i) {
  const x = ST_X[i] + POST_DX[1];
  return [[x, ST.y - 1, TOP - 0.6], [x, ST.y - 0.6, TOP + 0.9], [x, ST.y + 0.6, TOP + 2], [x, POST_Y - 2.2, POST_TOP - 1.4], [x, POST_Y - 0.9, POST_TOP - 1]];
}
const TRUNKS = COLS.map((_, i) => trunkPoints(i).map(at));
const TRUNK_LEN = TRUNKS.map(lengthOf);
const RISERS = COLS.map((_, i) => riserPoints(i).map(at));
const RISER_LEN = RISERS.map(lengthOf);
// How much of line i is laid (0..1), and the two parts' dash offsets: floor first, then the riser.
const laid = (i, p) => (i < 4 ? 1 - p.mesh : (1 - p.mesh) * Math.max(0, Math.min(1, (p.fifth - 0.6) / 0.4)));
function dashes(i, drawn) {
  const total = TRUNK_LEN[i] + RISER_LEN[i];
  const along = drawn * total;
  const floor = Math.min(1, along / TRUNK_LEN[i]);
  const riser = Math.max(0, Math.min(1, (along - TRUNK_LEN[i]) / RISER_LEN[i]));
  return [floor, riser];
}
// A cable laid from the exchange end: one dash as long as the laid share, then a gap longer than the cable.
const dashStyle = (len, share) => (share <= 0.002 ? "display:none" : share >= 0.998 ? "" : `stroke-dasharray:${(len * share).toFixed(1)} ${(len * 3).toFixed(1)}`);

// A mesh wire between two stations' posts: an arch in the posts' plane.
function arcPoints({ a, b, pa, pb, lift }) {
  const xa = ST_X[a] + POST_DX[pa];
  const xb = ST_X[b] + POST_DX[pb];
  const rise = 8 + 0.17 * Math.abs(xb - xa) + lift;
  return Array.from({ length: 41 }, (_, s) => {
    const t = s / 40;
    return [xa + (xb - xa) * t, POST_Y, POST_TOP + rise * Math.sin(Math.PI * t) ** 0.7];
  });
}
const ARC_PATHS = ARCS.map((arc) => arcPoints(arc).map(at));

const cable = (points, attrs = "") => {
  const d = k.pathOf(points);
  return `<g class="dp-cable"${attrs}><path class="dp-cable-o" d="${d}"/><path class="dp-cable-i" d="${d}"/></g>`;
};

const isLit = (p, i) => p.litIn[i] > 0.5 || p.litOut[i] > 0.5;
function trunks(start) {
  return TRUNKS.map((points, i) => {
    const [floor] = dashes(i, laid(i, start));
    return cable(points, ` data-part="trunk" data-line="${i}"${isLit(start, i) ? " data-lit" : ""} style="${dashStyle(TRUNK_LEN[i], floor)}"`);
  }).join("");
}
function riser(i, start) {
  const [, up] = dashes(i, laid(i, start));
  return cable(RISERS[i], ` data-part="riser" data-line="${i}"${isLit(start, i) ? " data-lit" : ""} style="${dashStyle(RISER_LEN[i], up)}"`);
}

function comb() {
  const plan = { x: -42, y: COMB_Y, w: 84, d: 4, r: 1 };
  return S(slab(plan, 0, 3.2, 3, 0.4), { tone: "mid" }) + D([at([-38, COMB_Y + 2, 3.2]), at([38, COMB_Y + 2, 3.2])], { size: 0.45 });
}

function meshWires(start) {
  return ARCS.map((arc, n) => {
    const key = `${arc.a}-${arc.b}`;
    return cable(ARC_PATHS[n], ` data-part="arc" data-pair="${key}"${(start.arcs[key] ?? 0) > 0.5 ? " data-lit" : ""} opacity="${start.mesh.toFixed(2)}"`);
  }).join("");
}

// ---------------------------------------------------------------- stations

function station(i, start) {
  const cx = ST_X[i];
  const s = STATIONS[i];
  const out = [];
  const body = { x: cx - ST.w / 2, y: ST.y, w: ST.w, d: ST.d, r: 3 };
  out.push(S(slab(k.insetPlan(body, -1), 0, 2, 4, 0.4), { tone: "lo" }));
  out.push(S(slab(body, 2, TOP, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(body, 11, P, 5), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(body, 2.4), TOP, P, 4), { tone: "faint" }));
  out.push(D([[cx - 12, ST.y + 3], [cx + 12, ST.y + 3], [cx + 12, ST.y + ST.d - 3]].map(([x, y]) => at([x, y, TOP])), { size: 0.4 }));
  // Name plate on the front.
  const M = k.sideMatrix([cx - 11, ST.y + ST.d], 11.6, P, "left");
  out.push(`<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 22, 6.4, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 22, 6.4, 1)}"/><text class="iso-face-text dp-name" data-tone="hi" x="11" y="4.6" font-size="3.8" text-anchor="middle">${s.tag}</text></g>`);
  // The flag's slot.
  const slot = { x: cx + FLAG.x0 - 0.6, y: FLAG.y - 0.5, w: FLAG.x1 - FLAG.x0 + 1.2, d: 1.9, r: 0.8 };
  out.push(`<path class="dp-hole" d="${k.planOutline(slot, TOP, P, 3)}"/>`, L(k.planOutline(slot, TOP, P, 3), { tone: "lo" }));
  // The end of this station's exchange line, then the terminal posts at the back.
  out.push(riser(i, start));
  for (const dx of POST_DX) {
    out.push(S(k.cylinder(cx + dx, POST_Y, 2, TOP, 1, P, 16), { tone: "mid" }));
    out.push(S(k.cylinder(cx + dx, POST_Y, 1.1, TOP + 1, POST_TOP - TOP - 1, P, 12), { tone: "hi", crease: "lo" }));
  }
  // The call key: a bezel and a cap that dips when the station reports something.
  out.push(S(k.cylinder(cx + BUTTON.dx, BUTTON.y, 3.6, TOP, 0.8, P, 28), { tone: "mid" }));
  out.push(`<g data-part="button" data-line="${i}" transform="${k.translateAlong(P, [0, 0, -start.press[i] * BUTTON.dip])}">${S(k.cylinder(cx + BUTTON.dx, BUTTON.y, 2.7, TOP + 0.8, 2.4, P, 28, 0.4), { tone: "hi", crease: "lo" })}</g>`);
  return { body: out.join(""), flag: flag(i, start) };
}

// The flag: a stem and a plate that rise out of the slot when the station is called.
function flag(i, start) {
  const cx = ST_X[i];
  const slot = { x: cx + FLAG.x0 - 0.6, y: FLAG.y - 0.5, w: FLAG.x1 - FLAG.x0 + 1.2, d: 1.9, r: 0.8 };
  const clip = slab(slot, TOP, TOP + 40, 3).fill;
  const up = start.flag[i] > 0.5;
  const plate = S(slab({ x: cx + FLAG.x0, y: FLAG.y, w: FLAG.x1 - FLAG.x0, d: 0.9, r: 0.2 }, TOP + FLAG.low, TOP + FLAG.high, 2), { tone: up ? "lit" : "hi", crease: "lo", lit: up });
  const stem = S(slab({ x: cx + FLAG.x0, y: FLAG.y, w: 1.2, d: 0.9, r: 0.2 }, TOP - 4, TOP + FLAG.low, 2), { tone: "mid" });
  const lift = (start.flag[i] - 1) * FLAG.rise;
  return `<clipPath id="dp-flag-${i}"><path d="${clip}"/></clipPath><g clip-path="url(#dp-flag-${i})"><g data-part="flag" data-line="${i}" transform="${k.translateAlong(P, [0, 0, lift])}">${stem}<g data-part="flag-plate">${plate}</g></g></g>`;
}

// ---------------------------------------------------------------- the whole drawing

const START = 1;
const plans = STEPS.map((step) => {
  const { sender, reactions } = story(step);
  return { sender, targets: reactions.map((r) => r.at), mesh: step.mesh, fifth: step.stations === 5, wires: wires(step), count: STATIONS.length };
});
const start = rest(plans[START]);
const side = sideFace(start.wires);

const stations = [0, 1, 2, 3].map((i) => station(i, start));
const fifth = station(4, start);
const pulses = `<g data-part="pulses">${Array.from({ length: 4 }, () => `<circle class="dp-pulse" r="1.9" cx="0" cy="0" opacity="0"/>`).join("")}</g>`;

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một tổng đài điện thoại nhỏ đặt phía sau, mặt trước có hàng cờ báo gọi, hàng lỗ cắm và bàn phím của người trực. Phía trước là các máy trạm của từng bộ phận, mỗi máy có một nút gọi, một lá cờ bật lên khi được gọi và ba cọc nối dây ở phía sau. Khi các bộ phận nối thẳng với nhau, sáu sợi dây vắt qua đầu bốn máy trạm. Khi đi qua tổng đài, mỗi máy chỉ có một dây về tổng đài, và tổng đài quyết định gọi những máy nào.",
  body: [
    base(),
    exchangeBody(),
    panel(),
    `<g data-part="drops">${drops(start.drop)}</g>`,
    side.svg,
    leadGland(),
    battery(),
    cable(LEAD),
    glands(),
    shelf(start.key),
    `<g data-part="trunks">${trunks(start)}</g>`,
    comb(),
    `<g data-part="trunk-pulses">${pulses}</g>`,
    ...stations.map((s) => s.body),
    `<g data-part="arcs">${meshWires(start)}</g>`,
    `<g data-part="arc-pulses">${pulses}</g>`,
    ...stations.map((s) => s.flag),
    `<g data-part="fifth" transform="${k.translateAlong(P, [0, 0, (1 - start.fifth) * 36])}" opacity="${start.fifth.toFixed(2)}">${fifth.body}${fifth.flag}</g>`,
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const MOTION = readFileSync(join(HERE, "motion.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
${MOTION}
const P = ${JSON.stringify(P)};
const START = ${START}, N = STEPS.length, FLAPS = ${FLAP_FRAMES}, KEY_THROW = ${KEY_THROW}, DIP = ${BUTTON.dip}, RISE = ${FLAG.rise}, PITCH = ${side.pitch};
const TRUNK_LEN = ${JSON.stringify(TRUNK_LEN.map((v) => +v.toFixed(1)))}, RISER_LEN = ${JSON.stringify(RISER_LEN.map((v) => +v.toFixed(1)))};
const laid = ${laid.toString()};
${dashes.toString()}
const dashStyle = ${dashStyle.toString()};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const all = (sel) => [...svg.querySelectorAll(sel)];
const byLine = (name) => all('[data-part="' + name + '"]').sort((a, b) => a.dataset.line - b.dataset.line);
const parts = {
  drops: byLine("drop").map((g) => [...g.children]), keys: byLine("key"), buttons: byLine("button"), flags: byLine("flag"),
  plates: all('[data-part="flag-plate"]'), trunks: byLine("trunk"), risers: byLine("riser"), arcs: all('[data-part="arc"]'),
  fifth: svg.querySelector('[data-part="fifth"]'), units: svg.querySelector('[data-part="units"]'), cap: svg.querySelector('[data-part="spare-cap"]'),
  trunkPulses: [...svg.querySelector('[data-part="trunk-pulses"]').querySelectorAll("circle")],
  arcPulses: [...svg.querySelector('[data-part="arc-pulses"]').querySelectorAll("circle")],
};
// The flag plates follow the flags' line order (station 4's lives in the fifth group).
parts.plates.sort((a, b) => a.closest('[data-part="flag"]').dataset.line - b.closest('[data-part="flag"]').dataset.line);
const trunkPaths = parts.trunks.map((g) => g.querySelector("path"));
const riserPaths = parts.risers.map((g) => g.querySelector("path"));
const arcPaths = Object.fromEntries(parts.arcs.map((g) => [g.dataset.pair, g.querySelector("path")]));
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const plans = STEPS.map((step) => {
  const { sender, reactions } = story(step);
  return { sender, targets: reactions.map((r) => r.at), mesh: step.mesh, fifth: step.stations === 5, wires: wires(step), count: STATIONS.length };
});
const stories = STEPS.map(story);
const tags = (list) => list.map((r) => STATIONS[r.at].tag).join(" · ");
const restText = STEPS.map((step, i) => {
  const st = stories[i];
  return (step.mesh ? STATIONS[st.sender].tag + " gọi thẳng " : STATIONS[st.sender].tag + " báo " + st.says + " → ") + tags(st.reactions) + " · " + st.wires + " dây";
});
const spoken = STEPS.map((step, i) => {
  const st = stories[i];
  const who = st.reactions.map((r) => STATIONS[r.at].name).join(", ");
  return step.mesh
    ? "Nối thẳng: " + STATIONS[st.sender].name + " tự gọi " + who + " qua " + st.wires + " sợi dây"
    : STATIONS[st.sender].name + " báo " + st.says + ", tổng đài gọi " + who + ". Tổng cộng " + st.wires + " dây.";
});
let sel = START, u = END, from = rest(plans[START]), current = from;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0, dwell = 0;
const DWELL = 3.2;
const shown = {};
const lit = (el, on) => {
  if (shown.lit?.get(el) === on) return;
  (shown.lit ??= new Map()).set(el, on);
  el.toggleAttribute("data-lit", on);
  el.querySelector(".iso-edge")?.setAttribute("data-tone", on ? "lit" : "hi");
};
const set = (el, attr, value) => { const key = attr + "|"; if (el[key] !== value) { el[key] = value; el.setAttribute(attr, value); } };
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", spoken[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function place(circle, path, s, alpha) {
  if (alpha <= 0.01 || !path) { set(circle, "opacity", "0"); return; }
  const p = path.getPointAtLength(s * path.getTotalLength());
  set(circle, "cx", p.x.toFixed(1));
  set(circle, "cy", p.y.toFixed(1));
  set(circle, "opacity", alpha.toFixed(2));
}
function draw() {
  const p = current = pose(plans[sel], u, from);
  parts.drops.forEach((frames, c) => {
    const f = Math.round(p.drop[c] * (FLAPS - 1));
    if (shown["drop" + c] !== f) { shown["drop" + c] = f; frames.forEach((g, i) => g.setAttribute("display", i === f ? "inline" : "none")); }
  });
  parts.keys.forEach((g, c) => set(g, "transform", translateAlong(P, [0, p.key[c] * KEY_THROW, 0])));
  parts.buttons.forEach((g, c) => set(g, "transform", translateAlong(P, [0, 0, -p.press[c] * DIP])));
  parts.flags.forEach((g, c) => set(g, "transform", translateAlong(P, [0, 0, (p.flag[c] - 1) * RISE])));
  parts.plates.forEach((g, c) => lit(g.querySelector(".iso-solid"), p.flag[c] > 0.5));
  parts.trunks.forEach((g, i) => {
    const [floor, up] = dashes(i, laid(i, p));
    set(g, "style", dashStyle(TRUNK_LEN[i], floor));
    set(parts.risers[i], "style", dashStyle(RISER_LEN[i], up));
    const on = p.litIn[i] > 0.5 || p.litOut[i] > 0.5;
    if (shown["t" + i] !== on) { shown["t" + i] = on; g.toggleAttribute("data-lit", on); parts.risers[i].toggleAttribute("data-lit", on); }
  });
  parts.arcs.forEach((g) => {
    set(g, "opacity", p.mesh.toFixed(2));
    const on = (p.arcs[g.dataset.pair] ?? 0) > 0.5;
    if (shown["a" + g.dataset.pair] !== on) { shown["a" + g.dataset.pair] = on; g.toggleAttribute("data-lit", on); }
  });
  set(parts.fifth, "transform", translateAlong(P, [0, 0, (1 - p.fifth) * 36]));
  set(parts.fifth, "opacity", Math.min(1, p.fifth * 1.6).toFixed(2));
  set(parts.cap, "opacity", (1 - Math.min(1, p.fifth * 1.6)).toFixed(2));
  set(parts.units, "transform", "translate(0 " + (-p.wires * PITCH).toFixed(2) + ")");
  const trunkPulses = p.pulses.filter((q) => q.kind !== "arc");
  const arcPulses = p.pulses.filter((q) => q.kind === "arc");
  parts.trunkPulses.forEach((circle, n) => {
    const q = trunkPulses[n];
    if (!q) return set(circle, "opacity", "0");
    const total = TRUNK_LEN[q.line] + RISER_LEN[q.line];
    const along = (q.kind === "in" ? 1 - q.s : q.s) * total;
    if (along <= TRUNK_LEN[q.line]) place(circle, trunkPaths[q.line], along / TRUNK_LEN[q.line], q.alpha);
    else place(circle, riserPaths[q.line], (along - TRUNK_LEN[q.line]) / RISER_LEN[q.line], q.alpha);
  });
  parts.arcPulses.forEach((circle, n) => {
    const q = arcPulses[n];
    if (!q) return set(circle, "opacity", "0");
    const key = [q.from, q.to].sort().join("-");
    place(circle, arcPaths[key], q.from < q.to ? q.s : 1 - q.s, q.alpha);
  });
  const st = stories[sel];
  const plan = plans[sel];
  const t = u - EVENT;
  let text = restText[sel];
  if (u < END - 0.05) {
    if (t < 0) text = "đang nối lại dây";
    else if (plan.mesh) text = STATIONS[st.sender].tag + " gọi thẳng " + tags(st.reactions);
    else if (t < HUB.drop[1]) text = STATIONS[st.sender].tag + " báo tổng đài: " + st.says;
    else if (t < HUB.out[0]) text = "tổng đài xét quy tắc";
    else text = "tổng đài gọi " + tags(st.reactions);
  }
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  u = still.matches ? END : Math.min(END, u + dt);
  if (touring && u >= END) {
    dwell += dt;
    if (dwell > DWELL) { dwell = 0; go((sel + 1) % N); }
  }
  draw();
  const settled = !touring && u >= END;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// Start a step from whatever the parts are doing now.
function go(index) {
  from = { ...current, pulses: [] };
  sel = index;
  u = still.matches ? END : 0;
  describe();
}
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  dwell = 0;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; dwell = 0; emit(); run(); }, 3600);
  if (index !== sel) go(index); else emit();
  run();
};
const pick = (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
  return Math.floor(share * N);
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = true; dwell = 0; emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để chọn bước";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse") choose(pick(event), false); });
stage.addEventListener("pointerdown", (event) => choose(pick(event), event.pointerType !== "mouse"));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = Math.min(N - 1, sel + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = Math.max(0, sel - 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = N - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

const steps = STEPS.map((step) => {
  const st = story(step);
  const who = st.reactions.map((r) => STATIONS[r.at].name);
  const list = who.length > 1 ? `${who.slice(0, -1).join(", ")} và ${who[who.length - 1]}` : who[0];
  const sender = STATIONS[st.sender].name;
  let caption;
  if (step.mesh) {
    caption = `Khi chưa có tổng đài, bốn bộ phận nối thẳng với nhau bằng <strong>${st.wires} dây</strong>. Kho báo hết hàng thì tự gọi ${list}, nên lớp Kho phải biết cả ba bộ phận ấy.`;
  } else if (step.event === "out_of_stock") {
    caption = `Mỗi bộ phận giờ chỉ có một dây về tổng đài, tổng cộng <strong>${st.wires} dây</strong>. Kho chỉ báo hết hàng cho đơn ${st.order.id}, còn tổng đài quyết định gọi Thanh toán hoàn ${vnd(st.order.amount)}, gọi Giao hàng huỷ chuyến và gọi CSKH báo khách.`;
  } else if (step.event === "payment_failed") {
    caption = `Thanh toán báo thẻ của đơn ${st.order.id} bị từ chối. Tổng đài gọi Kho nhả ${st.order.items === 1 ? "một" : st.order.items} sản phẩm đang giữ và gọi CSKH báo khách, còn Giao hàng không bị gọi vì đơn chưa có chuyến nào.`;
  } else {
    caption = `Thêm bộ phận Hoá đơn chỉ cần cắm một dây vào tổng đài, nên số dây lên <strong>${st.wires}</strong> và không lớp cũ nào phải sửa. Khi Thanh toán báo đã thu ${vnd(st.order.amount)}, tổng đài gọi Giao hàng đặt chuyến và Hoá đơn xuất ${st.order.invoice}.`;
  }
  return { label: step.label, short: step.short, caption };
});

export const plate = withSteps(k.plateHtml({
  fig: "Fig 20",
  title: "Mediator",
  hint: "Rê chuột để chọn bước",
  readout: `KHO báo ${story(STEPS[START]).says} → TT · GH · CSKH · ${wires(STEPS[START])} dây`,
  keys: [
    { mark: "lit", label: "Đường dây đang có tín hiệu và lá cờ của bộ phận được gọi" },
    { mark: "raised", label: "Tổng đài là nơi duy nhất biết ai phải làm gì khi một bộ phận báo tin" },
  ],
  caption:
    "Mỗi máy trạm chỉ có một dây về tổng đài, và khi có chuyện, nó chỉ việc bấm nút báo. Người trực tổng đài thấy cờ báo gọi rơi xuống, gạt phím của những đường cần gọi, và cờ của đúng những bộ phận ấy bật lên. Khi các bộ phận nối thẳng với nhau thì cứ thêm một máy là thêm một chùm dây, còn với tổng đài, thêm một máy chỉ là thêm một dây.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Mediator, dùng phím mũi tên để chọn bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Bốn tình huống của luồng đơn hàng", steps, start: START }));

export const FIGURE_CSS = `
.dp-window{fill:var(--anatomy-shade-1)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-flap{fill:var(--anatomy-top)}
.dp-tag{letter-spacing:.04em}
.dp-name{letter-spacing:.06em;font-weight:500}
.dp-digit{letter-spacing:0}
.dp-cable{fill:none;stroke-linecap:round;stroke-linejoin:round}
.dp-cable path{fill:none}
.dp-cable-o{stroke:var(--anatomy-mid);stroke-width:2.6}
.dp-cable-i{stroke:var(--anatomy-top);stroke-width:1.3}
.dp-cable[data-lit] .dp-cable-o{stroke:var(--anatomy-lit)}
.dp-cable[data-lit] .dp-cable-i{stroke:var(--anatomy-shade-1)}
.dp-pulse{fill:var(--anatomy-lit);stroke:var(--anatomy-top);stroke-width:.8}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:112%;margin:-4% -6% -3%}}
`;

export { kitScript };
