// The Composite figure: a checkweigher on a reversible roller conveyor. Three
// parcels ride the rollers: a single vase (a leaf), a cardboard box holding a
// thermos and a tea tin, and a slatted crate holding a box like that one, a book
// and a vase. Selecting a parcel runs the conveyor until it sits on the weighing
// section, which rests on a load cell over the cabinet. The dial on the cabinet
// reads the load on that section, whatever the parcel is: it never asks whether
// it holds an item or a box of boxes (model.mjs gives every weight).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { PARCELS, kg } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 340;

const PLATE = { x: -130, y: -27, w: 244, d: 62, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// Conveyor: three sections of rollers between side rails. The middle one is the
// weighing section; it rests on the load cell, not on legs.
const IN = [-122, -29];
const BED = [-26, 26];
const OUT = [29, 106];
const RAIL_Y = 16;
const RAIL_T = 2;
const RAIL_Z = [18, 24];
const ROLL_Z = 23;
const ROLL_R = 2;
const TOP = ROLL_Z + ROLL_R; // parcels stand here
const PITCH = 7.5;
const STANDS = [-112, -52, 52, 96];

// Cabinet under the weighing section, with the dial and display on its front.
const CAB = { x: -23, y: -14, w: 46, d: 38, r: 2 };
const CAB_Z = [1.2, 15];
const FRONT = CAB.y + CAB.d;
const DIAL = { x: -10, z: 8.2, r: 5.6 };
const SCALE_MAX = 6; // kg across the dial's 300 degrees
const DEG_PER_KG = 300 / SCALE_MAX;
const WIN = { x: 1, z: 12.6, w: 18, h: 6 };

// Parcels: row positions (x of each centre when the conveyor offset is 0), and
// the half-length each one presses on the rollers with.
const ROW = [0, -40, -92];
const STOPS = ROW.map((x) => -x);
const FOOTPRINT = [3.4, 11, 23];
const START = 2;

const P = k.fitProjection(
  // The highest point anywhere in the tour: the thermos in the crate at the far end of the in-feed.
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [IN[0], 0, 34], [OUT[1], 0, 34], [-108, -2, TOP + 20]],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 60, elevation: 34 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const UP = [0, 0, 1];
const ALONG_Y = [0, 1, 0];
const ALONG_X = [1, 0, 0];
const slab = (x, y, w, d, z, h, r = 0.6, bevel = 0.3) => k.slabOf({ x, y, w, d, r }, z, h, P, 3, bevel);
// A closed rounded rectangle in a face's own 2D coordinates.
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const rollers = (from, to) => {
  const count = Math.floor((to - from) / PITCH);
  const first = from + (to - from - (count - 1) * PITCH) / 2;
  return Array.from({ length: count }, (_, i) => first + i * PITCH);
};
const ROLLERS = [...rollers(...IN), ...rollers(...BED), ...rollers(...OUT)];

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [[PLATE.x + 14, PLATE.y + 12], [PLATE.x + PLATE.w - 14, PLATE.y + 12], [PLATE.x + 14, PLATE.y + PLATE.d - 12], [PLATE.x + PLATE.w - 14, PLATE.y + PLATE.d - 12], [-8, PLATE.y + PLATE.d - 12], [-8, PLATE.y + 12]];
  for (const [x, y] of feet.sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate at the front right.
  const label = { x: 60, y: 22, w: 34, d: 8, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.2), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[66, 24.6, 20], [66, 26.3, 14], [66, 28, 17]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 4, 0.8]), at([label.x + label.w - 2.4, label.y + 4, 0.8])], { size: 0.4 }));
  return out.join("");
}

// One stand under a section: two legs under the rails and a brace between them.
function stand(x) {
  const out = [];
  const leg = (y) => {
    const parts = [S(slab(x - 3, y - 3, 6, 6, 0, 1.2, 1, 0.3), { tone: "lo" })];
    parts.push(D([at([x - 1.8, y + 1.8, 1.2]), at([x + 1.8, y + 1.8, 1.2])], { size: 0.4 }));
    parts.push(S(slab(x - 1.6, y - 1.6, 3.2, 3.2, 1.2, RAIL_Z[0] - 1.2, 0.5, 0.3), { tone: "mid" }));
    return parts.join("");
  };
  out.push(leg(-RAIL_Y - RAIL_T / 2));
  out.push(S(slab(x - 1, -RAIL_Y + 0.6, 2, RAIL_Y * 2 - 1.2, 6, 2.4, 0.4, 0.2), { tone: "mid" }));
  out.push(leg(RAIL_Y + RAIL_T / 2));
  return out.join("");
}

function cabinet() {
  const out = [];
  out.push(S(k.slabOf({ x: CAB.x - 1, y: CAB.y - 1, w: CAB.w + 2, d: CAB.d + 2, r: 2.4 }, 0, CAB_Z[0], P, 4, 0.4), { tone: "lo" }));
  const seam = k.sideSeam(CAB, 3.4, P, 4);
  out.push(S(k.slabOf(CAB, CAB_Z[0], CAB_Z[1] - CAB_Z[0], P, 4, 0.8), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  // Screws on the lid strip in front of the conveyor.
  out.push(D([[-20.5, 21.5], [20.5, 21.5]].map(([x, y]) => at([x, y, CAB_Z[1]])), { size: 0.45 }));
  // Vents on the right side, in that face's own plane.
  const R = k.sideMatrix([CAB.x + CAB.w, FRONT - 6], CAB_Z[1] - 4.2, P, "right");
  const vents = Array.from({ length: 6 }, (_, i) => rrect(i * 4, 0, 2, 6.4, 1)).join("");
  out.push(`<g transform="${R}"><path class="iso-line" data-tone="lo" d="${vents}"/></g>`);
  out.push(dial(), display(), buttons(), nameplate());
  return out.join("");
}

// The dial: a bezel standing proud of the front, a face with a tick every 0.2 kg
// and a needle that reads the load on the weighing section.
function dial() {
  const out = [];
  const F = G.frameAlong([DIAL.x, FRONT, DIAL.z], ALONG_Y);
  out.push(S(G.disc(0, 1.1, DIAL.r + 1, F, P), { tone: "mid" }));
  const M = k.sideMatrix([DIAL.x, FRONT + 1.1], DIAL.z, P, "left");
  const ray = (kgs, r) => {
    const a = ((-150 + kgs * DEG_PER_KG) * Math.PI) / 180;
    return [r * Math.sin(a), -r * Math.cos(a)];
  };
  const tick = (kgs, inner) => {
    const [x0, y0] = ray(kgs, inner);
    const [x1, y1] = ray(kgs, DIAL.r);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const minor = [];
  const major = [];
  for (let i = 0; i <= SCALE_MAX * 5; i++) (i % 5 ? minor : major).push(tick(i / 5, i % 5 ? DIAL.r - 0.8 : DIAL.r - 1.6));
  out.push(`<g transform="${M}">
    <circle class="dp-dial" r="${DIAL.r}"/>
    <path class="iso-line" data-tone="lo" d="${minor.join("")}"/>
    <path class="iso-line" data-tone="mid" d="${major.join("")}"/>
    <circle class="iso-line" data-tone="lo" r="${DIAL.r}" fill="none"/>
    <g data-part="needle" transform="rotate(${-150})"><path class="iso-line dp-needle" data-tone="lit" data-free="" d="M0 1.7V${-(DIAL.r - 0.7)}"/></g>
  </g>`);
  out.push(D([at([DIAL.x, FRONT + 1.1, DIAL.z])], { size: 0.8, tone: "hi" }));
  return out.join("");
}

function display() {
  const M = k.sideMatrix([WIN.x, FRONT], WIN.z, P, "left");
  return `<g transform="${M}">
    <clipPath id="dp-win"><path d="${rrect(0, 0, WIN.w, WIN.h, 1)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1)}"/>
    <g clip-path="url(#dp-win)"><path class="dp-wall" d="M0 0H${WIN.w}V0.9H0.9V${WIN.h}H0Z"/>
    <text class="iso-face-text dp-digits" data-part="display" data-tone="hi" x="${WIN.w - 1.6}" y="4.6" font-size="4.2" text-anchor="end">${kg(PARCELS[START].tree.weight(), 2)}</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1)}"/>
  </g>`;
}

// Zero and tare buttons under the display, and a stable lamp beside them.
function buttons() {
  const out = [];
  for (const x of [4.5, 10]) {
    const F = G.frameAlong([x, FRONT, 4.4], ALONG_Y);
    out.push(S(G.disc(0, 0.5, 2.1, F, P), { tone: "lo" }));
    out.push(S(G.disc(0.5, 1.3, 1.6, F, P), { tone: "mid" }));
  }
  const F = G.frameAlong([16.4, FRONT, 4.4], ALONG_Y);
  out.push(S(G.disc(0, 0.6, 1.2, F, P), { tone: "mid" }));
  return out.join("");
}

// Rating plate on the right side, behind the vents.
function nameplate() {
  const M = k.sideMatrix([CAB.x + CAB.w, FRONT - 6], CAB_Z[1] - 3.4, P, "right");
  return `<g transform="${M}"><path class="dp-plate" d="${rrect(26, 0, 9, 4.6, 0.6)}"/><path class="iso-line" data-tone="lo" d="${rrect(26, 0, 9, 4.6, 0.6)}"/><path class="iso-line" data-tone="lo" data-free="" d="M27.4 1.6H33.6M27.4 3H32"/></g>`;
}

// The load cell between the cabinet lid and the plate under the weighing rollers.
function loadCell() {
  const out = [];
  out.push(S(slab(-9, -5, 18, 10, CAB_Z[1], 0.8, 0.6, 0.2), { tone: "lo" }));
  out.push(S(slab(-7, -3, 14, 6, CAB_Z[1] + 0.8, 1.2, 0.5, 0.2), { tone: "mid" }));
  out.push(S(slab(-BED[1], -RAIL_Y - RAIL_T, BED[1] * 2, (RAIL_Y + RAIL_T) * 2, 17, 1, 0.8, 0.3), { tone: "mid" }));
  out.push(D([[-23.5, RAIL_Y + 1], [23.5, RAIL_Y + 1]].map(([x, y]) => at([x, y, 18])), { size: 0.4 }));
  return out.join("");
}

// A side rail of one section; the near one carries the axle nuts on its face.
function rail(from, to, near) {
  const y = near ? RAIL_Y : -RAIL_Y - RAIL_T;
  const plan = { x: from, y, w: to - from, d: RAIL_T, r: 0.4 };
  const out = [];
  const lip = k.lineOnTop([from, y + RAIL_T / 2], [to, y + RAIL_T / 2], RAIL_Z[1], P);
  out.push(S(k.slabOf(plan, RAIL_Z[0], RAIL_Z[1] - RAIL_Z[0], P, 3, 0.3), { tone: "mid", inner: L(lip, { tone: "faint" }) }));
  if (near) {
    const nuts = ROLLERS.filter((x) => x > from && x < to);
    out.push(D(nuts.map((x) => at([x, RAIL_Y + RAIL_T, ROLL_Z])), { size: 0.55 }));
    out.push(D([at([from + 1.4, RAIL_Y + RAIL_T, 19.4]), at([to - 1.4, RAIL_Y + RAIL_T, 19.4])], { size: 0.4 }));
  }
  return out.join("");
}

// Ruler along the near rail of the weighing section: the length a parcel must fit in.
function bedRuler() {
  const ticks = k.topTicks(BED[0] + 1, BED[1] - 1, 2, 5, RAIL_Y + 0.2, RAIL_Z[1], [0.7, 1.4], P, "x");
  return L(ticks.minor, { tone: "lo" }) + L(ticks.major, { tone: "mid" });
}

function roller(x) {
  const F = G.frameAlong([x, -RAIL_Y, ROLL_Z], ALONG_Y);
  const len = RAIL_Y * 2;
  return S(G.solidOf([[0, ROLL_R - 0.5], [0.4, ROLL_R], [len - 0.4, ROLL_R], [len, ROLL_R - 0.5]], F, P), { tone: "mid" });
}

function bumper(x, side) {
  const plan = { x: side < 0 ? x : x - 2, y: -RAIL_Y - RAIL_T, w: 2, d: (RAIL_Y + RAIL_T) * 2, r: 0.6 };
  return S(k.slabOf(plan, RAIL_Z[1], 7, P, 3, 0.3), { tone: "mid" }) + D([-10, 10].map((y) => at([plan.x + 1, y, RAIL_Z[1] + 7])), { size: 0.4 });
}

// The photo-eye at the entry of the weighing section: sensor behind, reflector in front.
const EYE_X = -27.5;
function eyePost(near) {
  const y = near ? RAIL_Y + RAIL_T : -RAIL_Y - RAIL_T - 2.4;
  const out = [];
  out.push(S(slab(EYE_X - 1.6, y, 3.2, 2.4, RAIL_Z[0], 2.2, 0.4, 0.2), { tone: "mid" }));
  out.push(S(slab(EYE_X - 1, y + 0.2, 2, 2, RAIL_Z[0] + 2.2, 13, 0.4, 0.2), { tone: "mid" }));
  const head = near ? { y: y - 0.4, d: 2.8 } : { y: y - 0.2, d: 3.2 };
  out.push(S(slab(EYE_X - 2, head.y, 4, head.d, 29.4, 4.4, 0.6, 0.3), { tone: near ? "mid" : "hi" }));
  out.push(D([at([EYE_X, y + 1.2, RAIL_Z[0] + 1.1])], { size: 0.4 }));
  return out.join("");
}

// Gear motor hung on the near rail of the in-feed, driving its rollers.
function motor() {
  const out = [];
  out.push(S(slab(-108, RAIL_Y + RAIL_T, 9, 6, 12, 10, 1, 0.5), { tone: "mid" }));
  out.push(D([[-106.6, 13.2], [-100.4, 13.2], [-106.6, 20.8], [-100.4, 20.8]].map(([x, z]) => at([x, RAIL_Y + RAIL_T + 6, z])), { size: 0.4 }));
  const F = G.frameAlong([-99, RAIL_Y + RAIL_T + 3, 16.4], ALONG_X);
  const fins = G.ribsOf(F, 2.2, 11.6, 3.8, 18, P, { fade: [0.12, 0.5], seams: true });
  out.push(S(G.solidOf([[0, 3.2], [1.2, 3.2], [1.2, 3.8], [12.4, 3.8], [13, 3.4], [15, 3.4], [15.4, 2.8]], F, P), { tone: "mid", inner: k.fadedSvg(fins, { tone: "lo" }) }));
  return out.join("");
}

// The operator's jog box at the front left: reverse, forward and stop.
function console_() {
  const out = [];
  const box = { x: -100, y: 23, w: 22, d: 8, r: 1.4 };
  out.push(S(k.slabOf(box, 0, 7, P, 4, 0.6), { tone: "mid" }));
  for (const [x, r, h, tone] of [[-95, 1.6, 1, "lo"], [-89.5, 1.6, 1, "lo"]]) {
    out.push(S(k.cylinder(x, 27, r + 0.5, 7, 0.4, P, 20), { tone: "lo" }));
    out.push(S(k.cylinder(x, 27, r, 7.4, h, P, 20), { tone }));
  }
  out.push(S(k.cylinder(-83, 27, 2.2, 7, 0.8, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(-83, 27, 1.4, 7.8, 1.2, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(-83, 27, 2.8, 9, 1.4, P, 28, 0.4), { tone: "mid" }));
  out.push(D([[-98.6, 24.4], [-79.4, 24.4], [-98.6, 29.6], [-79.4, 29.6]].map(([x, y]) => at([x, y, 7])), { size: 0.4 }));
  const M = k.sideMatrix([box.x + 3, box.y + box.d], 5, P, "left");
  out.push(`<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 10, 3, 0.5)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 10, 3, 0.5)}"/><path class="iso-line" data-tone="lo" data-free="" d="M1.6 1.5H8.4"/></g>`);
  return out.join("");
}

// ---- Parcels (drawn at conveyor offset 0; the whole row moves together) ----

// The vase body is one analytic curve, so its shading has no steps: a straight
// taper from foot to neck plus a sine bulge whose top flattens into the neck.
const VASE = { s0: 1, s1: 14.6 };
const vaseShare = (s) => (s - VASE.s0) / (VASE.s1 - VASE.s0);
const vaseBulge = (t) => 1 - (1 - t) ** 1.6;
const vaseR = (s) => { const t = vaseShare(s); return 3.2 - t + 2.1 * Math.sin(Math.PI * vaseBulge(t)); };
const vaseSlope = (s) => { const t = Math.min(1, Math.max(0, vaseShare(s))); return (-1 + 2.1 * Math.PI * Math.cos(Math.PI * vaseBulge(t)) * 1.6 * (1 - t) ** 0.6) / (VASE.s1 - VASE.s0); };
const VASE_BODY = Array.from({ length: 25 }, (_, i) => { const s = VASE.s0 + ((VASE.s1 - VASE.s0) * i) / 24; return [s, vaseR(s), i > 0 && i < 24 ? 1 : 0]; });
function vase(x, y, z) {
  const F = G.frameAlong([x, y, z], UP);
  const out = [S(G.disc(0, VASE.s0, 3.4, F, P, { bevel: 0.3 }), { tone: "hi" })];
  const band = G.arcOf(F, 6, vaseR(6), P, { slope: vaseSlope(6) });
  out.push(S(G.solidOf(VASE_BODY, F, P, { smooth: { slope: vaseSlope, rows: 4 } }), { tone: "hi", inner: L(band, { tone: "faint" }) }));
  out.push(S(G.solidOf([[VASE.s1, 2.2], [15.3, 2.9], [16, 2.9]], F, P), { tone: "hi" }));
  const lip = G.circleOf(F, 16, 2.1, P);
  out.push(`<path class="dp-hole" d="${lip}"/>`, L(lip, { tone: "lo" }));
  return out.join("");
}

function thermos(x, y, z) {
  const F = G.frameAlong([x, y, z], UP);
  const out = [S(G.solidOf([[0, 2.6], [0.5, 2.8], [12.6, 2.8], [13, 2.6]], F, P), { tone: "hi", inner: L(G.arcOf(F, 3.2, 2.8, P) + G.arcOf(F, 9.4, 2.8, P), { tone: "faint" }) })];
  const grip = G.ribsOf(F, 14.6, 16.6, 2.7, 22, P, { fade: [0.1, 0.5], seams: true });
  out.push(S(G.solidOf([[13, 2.9], [14.2, 2.9], [14.4, 2.7], [17, 2.7], [17.4, 2.4]], F, P), { tone: "hi", inner: k.fadedSvg(grip, { tone: "lo" }) }));
  return out.join("");
}

function tin(x, y, z) {
  const F = G.frameAlong([x, y, z], UP);
  const out = [S(G.solidOf([[0, 3.4], [5.4, 3.4]], F, P), { tone: "hi", inner: L(G.arcOf(F, 1.4, 3.4, P), { tone: "faint" }) })];
  out.push(S(G.solidOf([[5, 3.6], [6.4, 3.6], [6.7, 3.3]], F, P), { tone: "hi" }));
  out.push(L(G.circleOf(F, 6.7, 2.2, P), { tone: "faint" }));
  return out.join("");
}

// A book standing on its tail, spine up: two boards and the page block between.
function book(x, y, z) {
  const out = [];
  out.push(S(slab(x, y, 0.5, 11, z, 14, 0.2, 0.1), { tone: "hi" }));
  out.push(S(slab(x + 0.5, y + 0.4, 2.4, 10.4, z, 13.4, 0.1, 0), { tone: "hi", crease: "none" }));
  const M = k.sideMatrix([x + 0.5, y + 10.8], z + 13.4, P, "left");
  const pages = [0.5, 1, 1.5, 1.9].map((u) => `M${u} 0V13.4`).join("");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="faint" d="${pages}"/></g>`);
  out.push(S(slab(x + 2.9, y, 0.5, 11, z, 14, 0.2, 0.1), { tone: "hi" }));
  out.push(S(slab(x, y, 3.4, 11, z + 14, 0.5, 0.3, 0.1), { tone: "hi" }));
  return out.join("");
}

// The cardboard box: open on top, walls 0.7 thick, a thermos and a tea tin inside.
const BOX = { w: 22, d: 16, h: 8.5, t: 0.7 };
function smallBox(cx, cy, z) {
  const x0 = cx - BOX.w / 2;
  const y0 = cy - BOX.d / 2;
  const { w, d, h, t } = BOX;
  const out = [];
  out.push(S(slab(x0, y0, w, d, z, t, 0.3, 0), { tone: "hi", crease: "none" }));
  out.push(S(slab(x0, y0, w, t, z, h, 0.2, 0), { tone: "hi" }));
  out.push(S(slab(x0, y0 + t, t, d - 2 * t, z, h, 0.1, 0), { tone: "hi" }));
  out.push(thermos(cx - 4.5, cy - 2, z + t));
  out.push(tin(cx + 4.6, cy + 2.4, z + t));
  out.push(S(slab(x0 + w - t, y0 + t, t, d - 2 * t, z, h, 0.1, 0), { tone: "hi" }));
  // Packing tape down the near wall, and the shipping label beside it.
  const front = slab(x0, y0 + d - t, w, t, z, h, 0.2, 0);
  const M = k.sideMatrix([x0, y0 + d], z + h, P, "left");
  const face = `<g transform="${M}"><path class="iso-line" data-tone="faint" d="M${w / 2 - 1.2} 0V${h}M${w / 2 + 1.2} 0V${h}"/>
    <path class="dp-plate" d="${rrect(w / 2 + 3.2, 2, 6.4, 4.2, 0.4)}"/><path class="iso-line" data-tone="lo" d="${rrect(w / 2 + 3.2, 2, 6.4, 4.2, 0.4)}"/>
    <path class="iso-line" data-tone="lo" data-free="" d="M${w / 2 + 4.2} 3.4H${w / 2 + 8.6}M${w / 2 + 4.2} 4.8H${w / 2 + 7.4}"/></g>`;
  out.push(S(front, { tone: "hi", inner: face }));
  return out.join("");
}

// The slatted crate: three slats a side on corner posts, nails where they cross.
const CRATE = { w: 46, d: 26, t: 1, post: 2.2 };
const SLATS = [[0, 3.2], [4.6, 7.8], [9.2, 12.4]];
function crate(cx, cy, z) {
  const { w, d, t, post } = CRATE;
  const x0 = cx - w / 2;
  const y0 = cy - d / 2;
  const out = [];
  const wallY = (y) => SLATS.map(([a, b]) => S(slab(x0, y, w, t, z + a, b - a, 0.2, 0.15), { tone: "hi" })).join("");
  const wallX = (x) => SLATS.map(([a, b]) => S(slab(x, y0 + t, t, d - 2 * t, z + a, b - a, 0.2, 0.15), { tone: "hi" })).join("");
  const postAt = (x, y) => S(slab(x, y, post, post, z, SLATS[2][1] - 0.4, 0.2, 0.15), { tone: "hi" });
  // Floor boards.
  const floor = { x: x0 + t, y: y0 + t, w: w - 2 * t, d: d - 2 * t };
  const seams = [floor.y + floor.d / 3, floor.y + (2 * floor.d) / 3].map((y) => k.lineOnTop([floor.x, y], [floor.x + floor.w, y], z + 1.2, P)).join("");
  out.push(S(slab(floor.x, floor.y, floor.w, floor.d, z, 1.2, 0.2, 0), { tone: "hi", inner: L(seams, { tone: "faint" }) }));
  out.push(wallY(y0));
  out.push(wallX(x0));
  out.push(postAt(x0 + t, y0 + t), postAt(x0 + w - t - post, y0 + t));
  // Contents: a box like step 2's, a vase like step 1's and a book.
  out.push(smallBox(cx - 10.6, cy - 0.6, z + 1.2));
  out.push(book(cx + 13.4, cy - 11.2, z + 1.2));
  out.push(vase(cx + 9.6, cy + 5.2, z + 1.2));
  out.push(postAt(x0 + t, y0 + d - t - post), postAt(x0 + w - t - post, y0 + d - t - post));
  out.push(wallX(x0 + w - t));
  out.push(wallY(y0 + d - t));
  // A shipping card tacked to the near middle slat.
  const M = k.sideMatrix([x0 + 14, y0 + d], z + SLATS[1][1] - 0.4, P, "left");
  out.push(`<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 9, 2.4, 0.3)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 9, 2.4, 0.3)}"/><path class="iso-line" data-tone="lo" data-free="" d="M1.2 1.2H7.2"/></g>`);
  // Nails through the near slats into the posts.
  const nails = [];
  for (const [a, b] of SLATS) {
    for (const x of [x0 + t + post / 2, x0 + w - t - post / 2]) nails.push([x, y0 + d, z + a + 1.1], [x, y0 + d, z + b - 1.1]);
    for (const y of [y0 + t + post / 2, y0 + d - t - post / 2]) nails.push([x0 + w, y, z + (a + b) / 2]);
  }
  out.push(D(nails.map(at), { size: 0.4, tone: "lo" }));
  return out.join("");
}

function parcels() {
  return [
    `<g data-part="parcel" data-id="crate">${crate(ROW[2], 0, TOP)}</g>`,
    `<g data-part="parcel" data-id="small">${smallBox(ROW[1], 0, TOP)}</g>`,
    `<g data-part="parcel" data-id="vase">${vase(ROW[0], 0, TOP)}</g>`,
  ].join("");
}

const rollersSorted = [...ROLLERS].sort((a, b) => a - b);

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một cân băng tải: ba đoạn băng con lăn, đoạn giữa là bàn cân đặt trên cảm biến lực, bên dưới là tủ cân có mặt đồng hồ kim và màn hình số. Trên băng có ba kiện hàng: một bình gốm, một hộp các-tông đựng bình giữ nhiệt và hộp trà, và một thùng gỗ đựng một hộp như thế, một cuốn sách và một bình gốm. Khi chọn một kiện, băng chạy đưa kiện đó lên bàn cân và kim chỉ khối lượng của nó, dù đó là một món hàng hay một thùng chứa hộp.",
  body: [
    base(),
    stand(STANDS[0]),
    stand(STANDS[1]),
    console_(),
    cabinet(),
    stand(STANDS[2]),
    stand(STANDS[3]),
    loadCell(),
    rail(...IN, false),
    rail(...BED, false),
    rail(...OUT, false),
    eyePost(false),
    bumper(IN[0], -1),
    rollersSorted.map(roller).join(""),
    `<g data-part="row" transform="${k.translateAlong(P, [STOPS[START], 0, 0])}">${parcels()}</g>`,
    rail(...IN, true),
    rail(...BED, true),
    bedRuler(),
    rail(...OUT, true),
    eyePost(true),
    bumper(OUT[1], 1),
    motor(),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const STOPS = ${JSON.stringify(STOPS)}, ROW = ${JSON.stringify(ROW)}, FOOTPRINT = ${JSON.stringify(FOOTPRINT)}, BED = ${JSON.stringify(BED)};
const DEG_PER_KG = ${DEG_PER_KG}, VMAX = 40, ACC = 60, DWELL = 2.8;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const row = svg.querySelector('[data-part="row"]');
const needle = svg.querySelector('[data-part="needle"]');
const digits = svg.querySelector('[data-part="display"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const grams = PARCELS.map((parcel) => parcel.tree.weight());
// The load on the weighing section: each parcel presses on it with the share of
// its footprint that lies over the section.
const load = (u) => PARCELS.reduce((sum, _, i) => {
  const a = ROW[i] + u - FOOTPRINT[i], b = ROW[i] + u + FOOTPRINT[i];
  const over = Math.max(0, Math.min(b, BED[1]) - Math.max(a, BED[0]));
  return sum + grams[i] * over / (b - a);
}, 0) / 1000;
let sel = ${START}, u = STOPS[sel], v = 0, reading = load(u), swing = 0;
let frame = 0, last = 0, dwell = 0, touring = !still.matches, visible = false, idleTimer = 0, shown = "", settled = true;
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function describe() {
  const tree = PARCELS[sel].tree;
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", tree.name + ": " + kg(tree.weight()) + " ki-lô-gam");
  emit();
}
function draw() {
  row.setAttribute("transform", translateAlong(P, [u, 0, 0]));
  needle.setAttribute("transform", "rotate(" + (-150 + reading * DEG_PER_KG).toFixed(2) + ")");
  const tree = PARCELS[sel].tree;
  const text = settled ? tree.name + " · " + kg(tree.weight()) + " kg" : u !== STOPS[sel] ? "băng chạy · " + tree.name : "đang cân · " + tree.name;
  if (readout.textContent !== text) readout.textContent = text;
  const screen = settled ? kg(tree.weight(), 2) : "--,--";
  if (screen !== shown) {
    shown = screen;
    digits.textContent = screen;
    digits.setAttribute("data-tone", settled ? "hi" : "lo");
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const target = STOPS[sel];
  if (calm) { u = target; v = 0; }
  else {
    // The motor ramps up to speed and brakes so the parcel stops centred on the section.
    const gap = target - u;
    const want = Math.sign(gap) * Math.min(VMAX, Math.sqrt(2 * ACC * Math.abs(gap)));
    v += Math.max(-ACC * dt, Math.min(ACC * dt, want - v));
    u += v * dt;
    if (Math.abs(target - u) < 0.05 && Math.abs(v) < 2) { u = target; v = 0; }
  }
  // The needle is a damped spring: it swings past the reading and comes back.
  const goal = load(u);
  if (calm) { reading = goal; swing = 0; }
  else {
    swing += (64 * (goal - reading) - 8.8 * swing) * dt;
    reading += swing * dt;
  }
  const still_ = u === target && Math.abs(goal - reading) < 0.002 && Math.abs(swing) < 0.01;
  if (still_) { reading = goal; swing = 0; }
  settled = still_;
  if (touring && settled) {
    dwell += dt;
    if (dwell > DWELL) { dwell = 0; sel = (sel + 1) % PARCELS.length; settled = false; describe(); }
  }
  draw();
  frame = visible && (touring || !settled) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen parcel on the scale until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  dwell = 0;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; dwell = 0; emit(); run(); }, 3600);
  if (index !== sel) { sel = index; settled = false; describe(); } else emit();
  run();
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = !still.matches; dwell = 0; emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để cân kiện tiếp";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse" && touring) choose(sel, false); });
stage.addEventListener("pointerdown", () => choose((sel + 1) % PARCELS.length, true));
stage.addEventListener("keydown", (event) => {
  let to = null;
  const n = PARCELS.length;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = (sel + 1) % n;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = (sel - 1 + n) % n;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = n - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

// Captions come from the same tree the page weighs.
// How a caption counts a child: "một cuốn sách", "một hộp nhỏ".
const COUNTED = { "Sách": "một cuốn sách" };
const counted = (child) => COUNTED[child.name] ?? `một ${child.name.toLowerCase()}`;
const names = (box) => box.children.map((child) => child.name.toLowerCase());
const listed = (box) => { const all = box.children.map(counted); return `${all.slice(0, -1).join(", ")} và ${all.at(-1)}`; };
const [one, small, big] = PARCELS.map((parcel) => parcel.tree);
const steps = [
  { label: PARCELS[0].label, short: PARCELS[0].short, caption: `<code>Item("${one.name}")</code> là một món hàng, lá của cây. <code>weight()</code> trả về khối lượng của chính nó: <strong>${kg(one.weight())} kg</strong>.` },
  { label: PARCELS[1].label, short: PARCELS[1].short, caption: `<code>Box("${small.name}")</code> chứa ${names(small).join(" và ")}. <code>weight()</code> cộng vỏ hộp với từng thứ bên trong: ${small.sum()} = <strong>${kg(small.weight())} kg</strong>.` },
  { label: PARCELS[2].label, short: PARCELS[2].short, caption: `<code>Box("${big.name}")</code> chứa ${listed(big)}. Hộp con tự cộng phần của nó: ${big.sum()} = <strong>${kg(big.weight())} kg</strong>. Cân vẫn chỉ gọi <code>weight()</code>.` },
];

export const plate = withSteps(k.plateHtml({
  fig: "Fig 11",
  title: "Composite",
  hint: "Bấm để cân kiện tiếp",
  readout: `${big.name} · ${kg(big.weight())} kg`,
  keys: [
    { mark: "lit", label: "Kim cân: đọc weight() của thứ đang nằm trên bàn cân" },
    { mark: "raised", label: "Kiện hàng: một món (Item) hoặc một hộp chứa món và hộp khác (Box)" },
  ],
  caption:
    "Bàn cân không phân biệt thứ đặt lên nó: một bình gốm, một hộp hai món hay một thùng chứa cả hộp lẫn món hàng đều chỉ là một kiện có khối lượng. Thùng tự cộng vỏ của nó với từng thứ bên trong, và hộp bên trong cũng làm y như vậy, nên lồng thêm bao nhiêu tầng thì cân vẫn đọc đúng.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Composite: phím mũi tên để chọn kiện hàng" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước: chọn kiện hàng", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-dial{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-1)}
.dp-digits{letter-spacing:.04em}
.iso-stage{touch-action:pan-y;cursor:pointer}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
