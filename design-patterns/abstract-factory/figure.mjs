// The Abstract Factory figure: a kit dispenser. Three slides on top of the
// housing each carry two magazine tubes, one per provider: the gateway, refunds
// and webhook-verifier parts of family A in front, family B behind. A factory
// bar pinned across the three slides moves them together, so one choice selects
// a whole family. Each tube drops its bottom part, the parts come out of the
// mouth onto the bed, and a pusher closes them against the end stop. Parts of
// one family have the same joint (A round, B square) and close tight; a mixed
// set, made when the bar is lifted off and each slide is set on its own, cannot
// close and the reject flag rises. Numbers and joints come from model.mjs; the
// motion is one timeline (timeline.mjs).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { FAMILIES, JOINTS, PARTS, RUNS, gapBetween, matched } from "./model.mjs";
import { PUSH, REST, pose } from "./timeline.mjs";
import { BED_EDGE, BED_TOP, FLOOR, LANDING, LAND_Y, PART, STATION, TRAY_Y, partOffsets } from "./motion.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const START = 0;

const WIDTH = 600;
const HEIGHT = 440;
const AZIMUTH = 56;

const PLATE = { x: -102, y: -80, w: 174, d: 144, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Housing with the mouth in its front face; the three slides ride on its top.
const HOUSING = { x: -52, y: -72, w: 104, d: 80, r: 3 };
const HOUSING_TOP = 26;
const FRONT = HOUSING.y + HOUSING.d;
const MOUTH = { x0: -42, x1: 42, z0: 14, z1: 21 };
const COLS = LANDING;
const ROW = 22; // the B tube sits this far behind the A tube on each slide
const SLIDE = { half: 13, y0: -64, y1: -13, z0: HOUSING_TOP, z1: HOUSING_TOP + 3 };
const TUBE = { hx: 11.6, hy: 9.6, z0: SLIDE.z1, z1: 59 };
const STACK = 4; // parts in a full tube
const TILE = { hx: PART.half, hy: 8.5, h: PART.h };
// Factory bar pinned across the slides in front of the A tubes, on two carriages with columns.
const BAR_Y = -17;
const BAR = { x0: -49, x1: 49, hy: 2.6, z0: SLIDE.z1, z1: SLIDE.z1 + 4.4, lift: 10 };
const PIN_R = 1.4;
const CARRIAGE_X = [-48.5, 48.5];

// Bed where the parts close, the pneumatic pusher, the end stop and the reject flag.
const BED = { x: -74, y: FRONT, w: 130, d: 22, r: 2 };
const STOP_X = COLS[2] + TILE.hx;
const CYL = { x: -72, y: LAND_Y - 5, w: 18, d: 10, r: 2 };
const PUSHER = { w: 8, hy: 7, z1: BED_TOP + 8 };
const ROD = 22;
const FLAG = { x0: 46, x1: 51.5, y: LAND_Y - 3, z0: BED_TOP, z1: BED_TOP + 10, rise: 11 };

// Tray in front where finished kits land, one on top of the other.
const TRAY = { x: -32, y: FRONT + 23, w: 80, d: 27 };
const TRAY_WALL = 1.5;
const TRAY_H = 10;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners({ x: -42, y: -66, w: 84, d: 74 }, 0, TUBE.z1 + 2),
  ],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const X = [1, 0, 0];
const slab = (plan, z0, z1, steps = 3, bevel = 0) => k.slabOf(plan, z0, z1 - z0, P, steps, bevel);
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const hull = (points) => {
  const pts = points.map(at);
  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of sorted) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (const p of [...sorted].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  const ring = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  return `M${ring.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;
};
const box = (x0, x1, y0, y1, z0, z1) => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [[x, y, z0], [x, y, z1]]));

// ---------- the parts ----------

const arc = (cx, cy, r, a0, a1, step = 15) => {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
};

// A part in plan, centred on (0, 0), with its family's knob on the right end if `knob`.
function partRing(knob) {
  const { hx: H, hy: Dy } = TILE;
  const ring = [[-H, -Dy], [H, -Dy]];
  if (knob === "A") {
    const { neck: n, head: r } = JOINTS.A;
    ring.push([H, -n], ...arc(H + 3.5, 0, r, 210, 510), [H, n]);
  } else if (knob === "B") {
    const { half, reach } = JOINTS.B;
    ring.push([H, -half], [H + reach, -half], [H + reach, half], [H, half]);
  }
  ring.push([H, Dy], [-H, Dy]);
  return ring;
}
// The knob alone, from 1 inside the right end, and the notch cut into the left end.
function knobRing(family) {
  const H = TILE.hx;
  if (family === "A") {
    const { neck: n, head: r } = JOINTS.A;
    return [[H - 1, -n], [H, -n], ...arc(H + 3.5, 0, r, 210, 510), [H, n], [H - 1, n]];
  }
  const { half, reach } = JOINTS.B;
  return [[H - 1, -half], [H + reach, -half], [H + reach, half], [H - 1, half]];
}
function notchRing(family) {
  const H = TILE.hx;
  if (family === "A") {
    const { neck: n, head: r } = JOINTS.A;
    return [[-H, n], ...arc(-H + 3.5, 0, r, 150, -150), [-H, -n]];
  }
  const { half, reach } = JOINTS.B;
  return [[-H, half], [-H + reach, half], [-H + reach, -half], [-H, -half]];
}
const shiftRing = (ring, dx, dy) => ring.map(([x, y]) => [x + dx, y + dy]);
const knobOf = (family, index) => (index < 2 ? family : null);

// One part: the block, its family's knob on the right end (a neck and a round
// head for A, a flat tenon for B), the notch as a recess in its top, and one to
// three dots for gateway, refunds, verifier.
function partSolid(family, index, cx, cy, z) {
  const { hx: H, hy: Dy, h } = TILE;
  const top = z + h;
  const solids = [S(slab({ x: cx - H, y: cy - Dy, w: H * 2, d: Dy * 2, r: 0.5 }, z, top, 2, 0.3), { tone: "hi", crease: "lo" })];
  const knob = knobOf(family, index);
  if (knob === "A") {
    const { neck: n, head: r } = JOINTS.A;
    solids.push(S(slab({ x: cx + H - 0.3, y: cy - n, w: 1.6, d: n * 2, r: 0 }, z, top, 1), { tone: "hi", crease: "lo" }));
    solids.push(S(k.cylinder(cx + H + 3.5, cy, r, z, h, P, 28), { tone: "hi", crease: "lo" }));
  } else if (knob === "B") {
    const { half, reach } = JOINTS.B;
    solids.push(S(slab({ x: cx + H - 0.3, y: cy - half, w: reach + 0.3, d: half * 2, r: 0.3 }, z, top, 2), { tone: "hi", crease: "lo" }));
  }
  const out = [`<g data-part="tile-body">${solids.join("")}</g>`];
  if (index > 0) {
    // The recess is open on the part's left end: no line across its mouth, and
    // the fill reaches past the end to cover the block's top edge there.
    const ring = notchRing(family);
    const fill = [[ring[0][0] - 0.4, ring[0][1]], ...ring, [ring[ring.length - 1][0] - 0.4, ring[ring.length - 1][1]]];
    out.push(`<path class="dp-hole" d="${k.onTop(shiftRing(fill, cx, cy), top, P, true)}"/>`, L(k.onTop(shiftRing(ring, cx, cy), top, P, false), { tone: "lo" }));
  }
  out.push(D(Array.from({ length: index + 1 }, (_, i) => at([cx - 4 + i * 4, cy + 3.5, top])), { size: 0.55, tone: "mid" }));
  return out.join("");
}

// The left neighbour's knob seen inside this part's notch: clipped to the notch,
// and moved by the live code with the gap between the two parts.
let knobClips = 0;
function knobInNotch(leftFamily, family, cx, cy, z, shift) {
  const id = `dp-n${knobClips++}`;
  const top = z + TILE.h;
  const notch = k.onTop(shiftRing(notchRing(family), cx, cy), top, P, true);
  const knob = k.onTop(shiftRing(knobRing(leftFamily), cx - TILE.hx * 2, cy), top, P, true);
  return `<clipPath id="${id}"><path d="${notch}"/></clipPath><g clip-path="url(#${id})"><g data-part="knob-move" transform="${shift}"><path class="dp-knob-top" d="${knob}"/>${L(knob, { tone: "mid" })}</g></g>`;
}

// ---------- base ----------

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 22).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate at the front left and a short ruler along the bed's front.
  const label = { x: -96, y: 44, w: 44, d: 13, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-90, 48, 24], [-90, 50.5, 16], [-90, 53, 20]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 6.5, 0.8]), at([label.x + label.w - 2.6, label.y + 6.5, 0.8])], { size: 0.4 }));
  const ruler = { x: 50, y: 50, w: 18, d: 6, r: 1 };
  out.push(S(k.slabOf(ruler, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(52, 66, 2, 5, ruler.y + 0.6, 0.6, [1.6, 3], P, "x");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

// The air regulator that feeds the pusher's cylinder: a block, a dial and an adjusting knob.
function regulator() {
  const block = { x: 56, y: -64, w: 12, d: 14, r: 1.6 };
  const out = [S(slab(block, 0, 14, 3, 0.6), { tone: "mid" })];
  out.push(D([at([block.x + 2, block.y + 2, 14]), at([block.x + 10, block.y + 12, 14])], { size: 0.4 }));
  const [kx, ky] = [62, -57];
  out.push(S(k.cylinder(kx, ky, 3.6, 14, 1, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(kx, ky, 2.8, 15, 4, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(kx, ky, 2.8, 15, 19, 24, P), { tone: "lo" }));
  // The dial on the front face: a ring, five ticks rooted on it, a needle from the hub.
  const M = k.sideMatrix([block.x + 1.5, block.y + block.d], 12, P, "left");
  const c = [4.5, 4.6];
  const ticks = [200, 245, 290, 335, 20].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `M${(c[0] + 3.6 * Math.cos(a)).toFixed(2)} ${(c[1] + 3.6 * Math.sin(a)).toFixed(2)}L${(c[0] + 2.7 * Math.cos(a)).toFixed(2)} ${(c[1] + 2.7 * Math.sin(a)).toFixed(2)}`;
  }).join("");
  out.push(`<g transform="${M}"><circle class="dp-plate" cx="${c[0]}" cy="${c[1]}" r="3.6"/><circle class="iso-line" data-tone="mid" cx="${c[0]}" cy="${c[1]}" r="3.6"/><path class="iso-line" data-tone="lo" d="${ticks}"/><path class="iso-line" data-tone="hi" d="M${c[0]} ${c[1]}L${(c[0] + 3.1 * Math.cos(-0.9)).toFixed(2)} ${(c[1] + 3.1 * Math.sin(-0.9)).toFixed(2)}"/><circle class="dp-hub" cx="${c[0]}" cy="${c[1]}" r="0.5"/></g>`);
  return out.join("");
}

// The operator's console at the back left: a start and a stop button and a run lamp.
function console() {
  const box = { x: -94, y: -58, w: 26, d: 18, r: 2 };
  const out = [S(slab(box, 0, 9, 3, 0.6), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(box, 1.8), 9, P, 3), { tone: "faint" }));
  for (const [x, r, tone] of [[-87, 2.6, "mid"], [-79, 2.6, "lo"]]) {
    out.push(S(k.cylinder(x, -49, r + 0.8, 9, 0.8, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, -49, r, 9.8, 1.8, P, 24), { tone }));
  }
  out.push(S(k.cylinder(-72.5, -49, 1.6, 9, 2.2, P, 20), { tone: "mid" }));
  out.push(D([at([box.x + 2.4, box.y + 2.4, 9]), at([box.x + box.w - 2.4, box.y + box.d - 2.4, 9])], { size: 0.4 }));
  return out.join("");
}

// ---------- housing ----------

function housing() {
  const out = [];
  out.push(S(slab({ x: HOUSING.x - 2, y: HOUSING.y - 2, w: HOUSING.w + 4, d: HOUSING.d + 4, r: 4 }, 0, 3, 4, 0.5), { tone: "mid" }));
  const seam = k.sideSeam(HOUSING, 11, P, 4);
  out.push(S(slab(HOUSING, 3, HOUSING_TOP, 4, 1), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  // Rails the carriages ride on, along both top edges.
  for (const x of CARRIAGE_X) out.push(S(slab({ x: x - 3, y: HOUSING.y + 2, w: 6, d: HOUSING.d - 4, r: 1 }, HOUSING_TOP, HOUSING_TOP + 1.2, 3), { tone: "lo", crease: "none" }));
  out.push(D(CARRIAGE_X.flatMap((x) => [at([x, HOUSING.y + 4, HOUSING_TOP + 1.2]), at([x, FRONT - 4, HOUSING_TOP + 1.2])]), { size: 0.4 }));
  // Guides under the slides: one strip down the middle of each.
  for (const c of COLS) out.push(S(slab({ x: c - 2, y: HOUSING.y + 3, w: 4, d: HOUSING.d - 6, r: 0.8 }, HOUSING_TOP, HOUSING_TOP + 0.6, 2), { tone: "lo", crease: "none" }));
  out.push(mouth(), vents(), housingPlate());
  return out.join("");
}

// The long mouth in the front face, where parts come out at bed level.
function mouth() {
  const M = k.sideMatrix([MOUTH.x0, FRONT], MOUTH.z1, P, "left");
  const w = MOUTH.x1 - MOUTH.x0;
  const h = MOUTH.z1 - MOUTH.z0;
  return `<g transform="${M}"><path class="dp-hole" d="${rrect(0, 0, w, h, 1.2)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, w, h, 1.2)}"/></g>`
    + D([at([MOUTH.x0 - 3, FRONT, MOUTH.z1 - 1]), at([MOUTH.x1 + 3, FRONT, MOUTH.z1 - 1])], { size: 0.4 });
}

// Vents on the right face.
function vents() {
  const M = k.sideMatrix([HOUSING.x + HOUSING.w, FRONT - 10], 20, P, "right");
  const slots = [0, 4, 8, 12, 16].map((y) => rrect(y, 0, 2.2, 12, 1.1)).join("");
  return `<g transform="${M}"><path class="iso-line" data-tone="lo" d="${slots}"/></g>`;
}

function housingPlate() {
  const M = k.sideMatrix([HOUSING.x + 6, FRONT], 10, P, "left");
  const lines = [[2.6, 2.8, 12], [2.6, 5, 8]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  return `<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 18, 7.6, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 18, 7.6, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`;
}

// ---------- slides, tubes, factory bar ----------

function slidePlate(c) {
  const plan = { x: c - SLIDE.half, y: SLIDE.y0, w: SLIDE.half * 2, d: SLIDE.y1 - SLIDE.y0, r: 1.6 };
  const out = [S(slab(plan, SLIDE.z0, SLIDE.z1, 3, 0.4), { tone: "mid" })];
  out.push(D([at([c - 9, SLIDE.y1 - 2.5, SLIDE.z1]), at([c + 9, SLIDE.y1 - 2.5, SLIDE.z1]), at([c - 9, SLIDE.y0 + 2.5, SLIDE.z1]), at([c + 9, SLIDE.y0 + 2.5, SLIDE.z1])], { size: 0.4 }));
  return out.join("");
}

// A knurled finger knob on the front of each slide: each slide can be set on its own.
function grip(c) {
  const F = G.frameAlong([c, SLIDE.y1, SLIDE.z0 + 1.6], [0, 1, 0]);
  const ribs = G.ribsOf(F, 0.6, 3.6, 2.4, 16, P, { fade: [0.1, 0.5], seams: true });
  return S(G.solidOf([[0, 1.6], [0.6, 2.4], [3.6, 2.4], [4.2, 1.8]], F, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) });
}

// The pins: the shaft is drawn under the bar, the head above it.
function pinShaft(c) {
  return S(k.cylinder(c, BAR_Y, PIN_R, SLIDE.z1, BAR.z1 + 2 - SLIDE.z1, P, 18), { tone: "mid" });
}
function pinHead(c) {
  return S(k.cylinder(c, BAR_Y, PIN_R, BAR.z1, 2, P, 18), { tone: "mid" }) + L(k.ring(c, BAR_Y, PIN_R * 0.5, BAR.z1 + 2, P, 12), { tone: "lo" });
}

let clipCount = 0;
// A magazine tube at (c, y) holding a stack of one family's parts for column `index`.
function tube(family, index, c, y) {
  const id = `dp-t${clipCount++}`;
  const plan = { x: c - TUBE.hx, y: y - TUBE.hy, w: TUBE.hx * 2, d: TUBE.hy * 2, r: 1.6 };
  const out = [];
  out.push(S(slab(plan, TUBE.z0, TUBE.z1, 3, 0.6), { tone: "mid" }));
  // The cap, engraved with the shape of the family's part: round knob for A, square for B.
  const cap = k.insetPlan(plan, 1.6);
  out.push(L(k.planOutline(cap, TUBE.z1, P, 3), { tone: "lo" }));
  const emblem = partRing(family).map(([px, py]) => [c - 1.6 + px * 0.62, y + py * 0.62]);
  out.push(L(k.onTop(emblem, TUBE.z1, P, true), { tone: "mid" }));
  // The window down the front, showing the seams between stacked parts.
  const win = { x: c - 3, w: 6, z0: TUBE.z0 + 3, z1: TUBE.z1 - 5 };
  const M = k.sideMatrix([win.x, y + TUBE.hy], win.z1, P, "left");
  const h = win.z1 - win.z0;
  const seams = Array.from({ length: STACK + 2 }, (_, i) => TUBE.z0 + i * TILE.h)
    .map((z) => `M0 ${(win.z1 - z).toFixed(2)}H${win.w}`).join("");
  out.push(`<g transform="${M}"><clipPath id="${id}w"><path d="${rrect(0, 0, win.w, h, 1)}"/></clipPath><path class="dp-screen" d="${rrect(0, 0, win.w, h, 1)}"/><g clip-path="url(#${id}w)"><path class="dp-stack" data-part="stack-lines" d="${seams}"/></g><path class="iso-line" data-tone="lo" d="${rrect(0, 0, win.w, h, 1)}"/></g>`);
  // The family's letter at the top of the right face.
  const R = k.sideMatrix([c + TUBE.hx, y + TUBE.hy - 2], TUBE.z1 - 3, P, "right");
  out.push(`<g transform="${R}"><text class="iso-face-text" data-tone="hi" x="2.4" y="6" font-size="6.4">${family}</text></g>`);
  return `<g data-part="tube" data-col="${index}" data-family="${family}">${out.join("")}</g>`;
}

function carriage(x) {
  const out = [];
  out.push(S(slab({ x: x - 3.4, y: BAR_Y - 9, w: 6.8, d: 13, r: 1.2 }, HOUSING_TOP + 1.2, HOUSING_TOP + 4.2, 3, 0.3), { tone: "mid" }));
  out.push(S(slab({ x: x - 1.8, y: BAR_Y - BAR.hy - 3.4, w: 3.6, d: 3, r: 0.8 }, HOUSING_TOP + 4.2, BAR.z1 + BAR.lift + 3, 3), { tone: "mid" }));
  out.push(D([at([x, BAR_Y - BAR.hy - 1.9, BAR.z1 + BAR.lift + 3]), at([x, BAR_Y + 2.4, HOUSING_TOP + 4.2]), at([x, BAR_Y - 7, HOUSING_TOP + 4.2])], { size: 0.4 }));
  return out.join("");
}

function bar() {
  const out = [];
  const plan = { x: BAR.x0, y: BAR_Y - BAR.hy, w: BAR.x1 - BAR.x0, d: BAR.hy * 2, r: 1.2 };
  out.push(`<g data-part="bar-body">${S(slab(plan, BAR.z0, BAR.z1, 3, 0.5), { tone: "hi", crease: "lo" })}</g>`);
  // Pin holes over each slide.
  out.push(L(COLS.map((c) => k.ring(c, BAR_Y, PIN_R + 0.4, BAR.z1, P, 16)).join(""), { tone: "lo" }));
  // The window on its top showing which family the bar selects.
  const M = k.topMatrix([6, BAR_Y - 2.1], BAR.z1, P, "x");
  out.push(`<g transform="${M}"><path class="dp-screen" d="${rrect(0, 0, 20, 4.2, 0.6)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 20, 4.2, 0.6)}"/><text class="iso-face-text dp-bar-text" data-part="bar-text" data-tone="hi" x="10" y="3.3" font-size="3.2" text-anchor="middle">BỘ A</text></g>`);
  // Knurled grip on the right end.
  const F = G.frameAlong([BAR.x1, BAR_Y, (BAR.z0 + BAR.z1) / 2], X);
  const ribs = G.ribsOf(F, 1.4, 6.4, 2.8, 20, P, { fade: [0.1, 0.5], seams: true });
  out.push(S(G.solidOf([[0, 1.4], [1.4, 2.8], [6.4, 2.8], [7.2, 2]], F, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) }));
  return out.join("");
}

// ---------- bed, pusher, end stop, flag ----------

function bed() {
  const out = [];
  out.push(S(slab(BED, 0, BED_TOP, 3, 0.8), { tone: "mid" }));
  // The channel the parts close in, and a centre line along it.
  out.push(L(k.planOutline({ x: -46, y: LAND_Y - TILE.hy - 0.6, w: 86, d: TILE.hy * 2 + 1.2, r: 0.8 }, BED_TOP, P, 3), { tone: "faint" }));
  out.push(D([[-66, FRONT + 3], [46, FRONT + 3], [-66, FRONT + 19], [46, FRONT + 19]].map(([x, y]) => at([x, y, BED_TOP])), { size: 0.45 }));
  return out.join("");
}

// The pneumatic cylinder that drives the pusher, with its two end caps.
function cylinder() {
  const out = [];
  out.push(S(slab({ x: CYL.x - 1, y: CYL.y - 1, w: 3, d: CYL.d + 2, r: 0.8 }, BED_TOP, BED_TOP + 11, 2), { tone: "mid" }));
  out.push(S(slab(CYL, BED_TOP + 0.5, BED_TOP + 10, 3, 0.6), { tone: "mid" }));
  out.push(S(slab({ x: CYL.x + CYL.w - 2, y: CYL.y - 1, w: 3, d: CYL.d + 2, r: 0.8 }, BED_TOP, BED_TOP + 11, 2), { tone: "mid" }));
  out.push(D([at([CYL.x + 0.5, CYL.y + 1, BED_TOP + 11]), at([CYL.x + CYL.w - 0.5, CYL.y + CYL.d - 1, BED_TOP + 11])], { size: 0.4 }));
  // Air fitting on the cylinder's top.
  out.push(S(k.cylinder(CYL.x + 7, LAND_Y, 1.6, BED_TOP + 10, 2.4, P, 16), { tone: "mid" }));
  return out.join("");
}

function pusher() {
  const p = PUSH.rest;
  const out = [];
  out.push(S(slab({ x: p - PUSHER.w - ROD, y: LAND_Y - 1.5, w: ROD, d: 3, r: 1.4 }, BED_TOP + 3.5, BED_TOP + 6.5, 4), { tone: "mid" }));
  return out.join("");
}

function pusherHead() {
  const p = PUSH.rest;
  const plan = { x: p - PUSHER.w, y: LAND_Y - PUSHER.hy, w: PUSHER.w, d: PUSHER.hy * 2, r: 1 };
  return S(slab(plan, BED_TOP + 0.4, PUSHER.z1, 3, 0.4), { tone: "mid" })
    + D([at([p - 4, LAND_Y - 4, PUSHER.z1]), at([p - 4, LAND_Y + 4, PUSHER.z1])], { size: 0.4 });
}

function endStop() {
  const plan = { x: STOP_X, y: LAND_Y - 8.5, w: 6, d: 17, r: 1 };
  return S(slab(plan, BED_TOP, BED_TOP + 10, 3, 0.5), { tone: "mid" })
    + D([at([STOP_X + 3, LAND_Y - 5.5, BED_TOP + 10]), at([STOP_X + 3, LAND_Y + 5.5, BED_TOP + 10])], { size: 0.45 });
}

function flagHousing() {
  const plan = { x: FLAG.x0 - 1, y: FLAG.y - 3, w: FLAG.x1 - FLAG.x0 + 2, d: 6, r: 1 };
  return S(slab(plan, BED_TOP, FLAG.z1, 3, 0.4), { tone: "mid" })
    + L(k.planOutline({ x: FLAG.x0 - 0.3, y: FLAG.y - 0.7, w: FLAG.x1 - FLAG.x0 + 0.6, d: 1.4, r: 0.4 }, FLAG.z1, P, 2), { tone: "lo" });
}

// The reject flag, a thin plate with a cross on its front, raised through its housing's slot.
function flagPlate() {
  const plan = { x: FLAG.x0, y: FLAG.y - 0.5, w: FLAG.x1 - FLAG.x0, d: 1, r: 0.2 };
  const M = k.sideMatrix([FLAG.x0, FLAG.y + 0.5], FLAG.z1 - 0.8, P, "left");
  const w = FLAG.x1 - FLAG.x0;
  const h = FLAG.z1 - FLAG.z0 - 1.6;
  return `<g data-part="flag-plate">${S(slab(plan, FLAG.z0, FLAG.z1, 2), { tone: "hi", crease: "lo" })}</g><g transform="${M}"><path class="iso-line" data-tone="mid" d="M0.8 0.8H${w - 0.8}V${h * 0.5}H0.8ZM0.8 0.8L${w - 0.8} ${h * 0.5}M${w - 0.8} 0.8L0.8 ${h * 0.5}"/></g>`;
}

// ---------- tray ----------

function trayBack() {
  const { x, y, w, d } = TRAY;
  return [
    S(slab({ x, y, w, d, r: 1.6 }, 0, FLOOR, 3), { tone: "lo" }),
    S(slab({ x, y, w, d: TRAY_WALL, r: 0.4 }, FLOOR, TRAY_H, 2), { tone: "mid" }),
    S(slab({ x, y: y + TRAY_WALL, w: TRAY_WALL, d: d - 2 * TRAY_WALL, r: 0.4 }, FLOOR, TRAY_H, 2), { tone: "mid" }),
  ].join("");
}

function trayFront() {
  const { x, y, w, d } = TRAY;
  return [
    S(slab({ x: x + w - TRAY_WALL, y: y + TRAY_WALL, w: TRAY_WALL, d: d - 2 * TRAY_WALL, r: 0.4 }, FLOOR, TRAY_H, 2), { tone: "mid" }),
    S(slab({ x, y: y + d - TRAY_WALL, w, d: TRAY_WALL, r: 0.4 }, FLOOR, TRAY_H, 2), { tone: "mid" }),
    D([at([x + 3, y + d - 0.75, TRAY_H]), at([x + w - 3, y + d - 0.75, TRAY_H])], { size: 0.4 }),
  ].join("");
}

// ---------- the moving parts' layer ----------

// Nine parts: three per run, drawn at their landing places on the bed and moved from there.
function parts() {
  const offsets = partOffsets(pose(REST[START]));
  return RUNS.map((run, kit) => run.parts.map((family, index) => {
    const [dx] = offsets[kit][index];
    const knob = index > 0
      ? knobInNotch(run.parts[index - 1], family, LANDING[index], LAND_Y, BED_TOP, k.translateAlong(P, [offsets[kit][index - 1][0] - dx + LANDING[index - 1] - LANDING[index] + TILE.hx * 2, 0, 0]))
      : "";
    return `<g data-part="tile" data-kit="${kit}" data-col="${index}" transform="${k.translateAlong(P, offsets[kit][index])}">${partSolid(family, index, LANDING[index], LAND_Y, BED_TOP)}${knob}</g>`;
  }).join("")).join("");
}

function sweeper() {
  return `<g data-part="sweeper">${S(slab({ x: -40, y: FRONT - 36, w: 80, d: 30, r: 0.6 }, MOUTH.z0 + 1.2, MOUTH.z0 + 4.6, 2), { tone: "mid" })}</g>`;
}

// What shows outside the housing: in front of its front face, up to the top of the mouth.
const OUTSIDE = hull(box(-80, 80, FRONT, 90, -2, MOUTH.z1));
const ROD_CLIP = hull(box(CYL.x + CYL.w + 1, 60, LAND_Y - 3, LAND_Y + 3, BED_TOP + 2, BED_TOP + 8));
const FLAG_CLIP = hull(box(FLAG.x0 - 2, FLAG.x1 + 2, FLAG.y - 1, FLAG.y + 1, FLAG.z1, FLAG.z1 + 30));

const tubes = COLS.flatMap((c, index) => [
  { family: "B", index, c, y: STATION - ROW },
  { family: "A", index, c, y: STATION },
]);

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một máy phát bộ chi tiết. Trên nóc máy có ba giá trượt, mỗi giá mang hai ống chứa chi tiết, ống của nhà cung cấp A ở trước, của B ở sau. Một thanh chọn bộ cắm chốt qua cả ba giá nên kéo một lần là cả ba cùng đổi. Mỗi ống thả một chi tiết ra khay ép phía trước, rồi pit-tông ép ba chi tiết vào nhau. Chi tiết cùng họ có khớp giống nhau nên đóng khít, còn một bộ lẫn họ thì không đóng được và cờ từ chối bật lên.",
  body: [
    base(),
    console(),
    housing(),
    regulator(),
    `<g data-part="carriage">${carriage(CARRIAGE_X[0])}</g>`,
    `<g data-part="slides">${COLS.map((c, i) => `<g data-part="slide" data-col="${i}">${slidePlate(c)}</g>`).join("")}</g>`,
    `<g data-part="tubes">${tubes.map((t) => tube(t.family, t.index, t.c, t.y)).join("")}</g>`,
    `<g data-part="carriage">${carriage(CARRIAGE_X[1])}</g>`,
    `<g data-part="pins">${COLS.map((c, i) => `<g data-part="pin" data-col="${i}">${pinShaft(c)}</g>`).join("")}</g>`,
    `<g data-part="bar">${bar()}</g>`,
    `<g data-part="pin-heads">${COLS.map((c, i) => `<g data-part="pin" data-col="${i}">${pinHead(c)}</g>`).join("")}</g>`,
    `<g data-part="grips">${COLS.map((c, i) => `<g data-part="grip" data-col="${i}">${grip(c)}</g>`).join("")}</g>`,
    bed(),
    cylinder(),
    `<clipPath id="dp-rod"><path d="${ROD_CLIP}"/></clipPath><g clip-path="url(#dp-rod)"><g data-part="rod">${pusher()}</g></g>`,
    `<g data-part="pusher">${pusherHead()}</g>`,
    trayBack(),
    `<clipPath id="dp-out"><path d="${OUTSIDE}"/></clipPath><g clip-path="url(#dp-out)">${sweeper()}${parts()}</g>`,
    endStop(),
    flagHousing(),
    `<clipPath id="dp-flag"><path d="${FLAG_CLIP}"/></clipPath><g clip-path="url(#dp-flag)"><g data-part="flag">${flagPlate()}</g></g>`,
    trayFront(),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const TIMELINE = readFileSync(join(HERE, "timeline.mjs"), "utf8").replace(/^export /gm, "");
const MOTION = readFileSync(join(HERE, "motion.mjs"), "utf8").replace(/^import .*\n/gm, "").replace(/^export /gm, "");
const [VX, VY] = k.towardViewer(P);

export const live = `
${MODEL}
${TIMELINE}
${MOTION}
const P = ${JSON.stringify(P)};
const START = ${START}, N = RUNS.length, ROW = ${ROW}, LIFT = ${BAR.lift}, RISE = ${FLAG.rise}, TILE_H = PART.h, COLS = ${JSON.stringify(COLS)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (sel) => svg.querySelector(sel);
const qa = (sel) => [...svg.querySelectorAll(sel)];
const slides = qa('[data-part="slide"]');
const grips = qa('[data-part="grip"]');
const carriages = qa('[data-part="carriage"]');
const pinEls = qa('[data-part="pin"]');
const tubeEls = qa('[data-part="tube"]');
const tiles = qa('[data-part="tile"]').map((el) => ({ el, kit: +el.dataset.kit, col: +el.dataset.col, bodies: [...el.querySelectorAll('[data-part="tile-body"] > .iso-solid')], knob: el.querySelector('[data-part="knob-move"]') }));
const parts = {
  bar: q('[data-part="bar"]'), barText: q('[data-part="bar-text"]'),
  rod: q('[data-part="rod"]'), pusher: q('[data-part="pusher"]'), sweeper: q('[data-part="sweeper"]'), flag: q('[data-part="flag"]'),
};
const flagPlate = q('[data-part="flag-plate"] > .iso-solid');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const restText = RUNS.map((run) => matched(run) ? run.label + " · khớp " + FAMILIES[run.factory].joint + " · đóng khít" : run.label + " · " + run.parts.join(", ") + " · không khớp");
const spoken = RUNS.map((run) => matched(run)
  ? run.label + ": ba chi tiết cùng họ " + run.factory + " đóng khít vào nhau"
  : "Bộ lẫn: hai chi tiết của A và một của B, khớp không vừa nên bộ bị từ chối");
let sel = START, t = REST[START], aim = sel, speed = 1, dwell = 0;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0;
const DWELL = 3.4;
const shown = {};
const set = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.setAttribute("transform", value); } };
const lit = (el, on) => {
  el.toggleAttribute("data-lit", on);
  el.querySelector(".iso-edge")?.setAttribute("data-tone", on ? "lit" : "hi");
};
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", spoken[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function draw() {
  const p = pose(t);
  const slide = [p.slide01, p.slide01, p.slide2];
  slides.forEach((el, i) => set(el, "s" + i, translateAlong(P, [0, slide[i] * ROW, 0])));
  pinEls.forEach((el, i) => set(el, "p" + i, translateAlong(P, [0, slide[+el.dataset.col] * ROW, 0])));
  grips.forEach((el, i) => set(el, "g" + i, translateAlong(P, [0, slide[i] * ROW, 0])));
  carriages.forEach((el, i) => set(el, "c" + i, translateAlong(P, [0, p.bar * ROW, 0])));
  set(parts.bar, "bar", translateAlong(P, [0, p.bar * ROW, p.lift * LIFT]));
  const barText = p.lift > 0.5 ? "TỰ CHỌN" : p.bar > 0.5 ? "BỘ B" : "BỘ A";
  if (shown.bt !== barText) { shown.bt = barText; parts.barText.textContent = barText; }
  // Tubes ride their slides, and each stack sinks by one part per drop.
  const drops = { A: [p.dropA01, p.dropA01, p.dropA2], B: [p.dropB01, p.dropB01, p.dropB2] };
  const order = tubeEls.map((el) => {
    const col = +el.dataset.col, fam = el.dataset.family;
    const y = slide[col] * ROW;
    set(el, "t" + col + fam, translateAlong(P, [0, y, 0]));
    const d = drops[fam][col];
    // The window's seams live in the face's own plane, where down is +y.
    set(el.querySelector('[data-part="stack-lines"]'), "w" + col + fam, "translate(0 " + (d * TILE_H).toFixed(2) + ")");
    return { el, depth: COLS[col] * ${VX.toFixed(4)} + (STATION - (fam === "B" ? ROW : 0) + y) * ${VY.toFixed(4)} };
  });
  const sorted = order.sort((a, b) => a.depth - b.depth).map((o) => o.el);
  const key = sorted.map((el) => el.dataset.col + el.dataset.family).join("");
  if (shown.order !== key) { shown.order = key; sorted.forEach((el) => el.parentNode.appendChild(el)); }
  // The pusher and its rod, the sweeper and the flag.
  set(parts.pusher, "ph", translateAlong(P, [p.pusher - ${PUSH.rest}, 0, 0]));
  set(parts.rod, "rd", translateAlong(P, [p.pusher - ${PUSH.rest}, 0, 0]));
  set(parts.sweeper, "sw", translateAlong(P, [0, p.sweeper * (BED_EDGE - ${FRONT - 6}), 0]));
  set(parts.flag, "fl", translateAlong(P, [0, 0, p.flag * RISE]));
  // The nine parts, and the kit that just closed tight is the lit part.
  const offsets = partOffsets(p);
  tiles.forEach((tile) => {
    const o = offsets[tile.kit];
    set(tile.el, "tl" + tile.kit + tile.col, translateAlong(P, o[tile.col]));
    if (tile.knob) set(tile.knob, "kn" + tile.kit + tile.col, translateAlong(P, [o[tile.col - 1][0] - o[tile.col][0] + LANDING[tile.col - 1] - LANDING[tile.col] + PART.len, 0, 0]));
  });
  const litKit = closedKit(p);
  tiles.forEach((tile) => {
    const on = tile.kit === litKit;
    if (shown["lit" + tile.kit + tile.col] !== on) { shown["lit" + tile.kit + tile.col] = on; tile.bodies.forEach((b) => lit(b, on)); }
  });
  const refused = p.flag > 0.5;
  if (shown.refused !== refused) { shown.refused = refused; lit(flagPlate, refused); }
  const resting = REST.findIndex((r) => Math.abs(r - t) < 0.001);
  const text = resting >= 0 ? restText[resting] : t > REST[aim] ? "đang tua lại" : phase(t);
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const target = REST[sel];
  if (sel !== aim) {
    aim = sel;
    // Play forward in real time, faster when skipping a run, and rewind quickly.
    speed = target < t ? 3.5 : target > REST[Math.min(N - 1, REST.findIndex((r) => r > t + 0.001))] ? 2.2 : 1;
  }
  if (calm || Math.abs(target - t) <= speed * dt) t = target;
  else t += Math.sign(target - t) * speed * dt;
  if (touring && t === target) {
    dwell += dt;
    if (dwell > DWELL) { dwell = 0; sel = (sel + 1) % N; describe(); }
  }
  draw();
  const settled = !touring && t === target;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  dwell = 0;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; dwell = 0; emit(); run(); }, 3600);
  if (index !== sel) { sel = index; describe(); } else emit();
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
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để chọn bộ";
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

const steps = RUNS.map((run) => ({
  label: run.label,
  short: run.short,
  caption: run.factory === "A"
    ? `Thanh chọn bộ đang ở A, nên cả ba giá cùng đưa ống của nhà cung cấp A vào chỗ. Ba chi tiết A có chung khớp ${FAMILIES.A.joint}, ép vào là <strong>đóng khít</strong>, giống như webhook do A ký được chính bộ kiểm của A chấp nhận.`
    : run.factory === "B"
      ? `Kéo thanh sang B là cả ba ống đổi cùng một lúc, không thể sót chiếc nào. Bộ B dùng khớp ${FAMILIES.B.joint} và cũng <strong>đóng khít</strong>, vì factory của B chỉ tạo ra chi tiết của B.`
      : `Khi nhấc thanh ra, mỗi giá tự chọn theo cấu hình riêng như bản code cũ. Hai giá về A nhưng giá kiểm chữ ký vẫn để ở B, nên khớp ${FAMILIES.A.joint} không vào được rãnh ${FAMILIES.B.joint} và bộ <strong>bị từ chối</strong>.`,
}));

export const plate = withSteps(k.plateHtml({
  fig: "Fig 15",
  title: "Abstract Factory",
  hint: "Rê chuột để chọn bộ",
  readout: `${RUNS[START].label} · khớp ${FAMILIES[RUNS[START].factory].joint} · đóng khít`,
  keys: [
    { mark: "lit", label: "Bộ chi tiết vừa ép xong, hoặc cờ từ chối khi bộ không đóng được" },
    { mark: "raised", label: "Thanh chọn bộ nối ba giá ống, như một factory tạo cả họ chi tiết" },
  ],
  caption:
    "Mỗi nhà cung cấp cần đủ ba chi tiết đi cùng nhau, và chi tiết của cùng một họ có chung kiểu khớp. Thanh chọn bộ nối cả ba giá ống lại, nên chọn A hay B là chọn trọn một họ trong một lần. Khi bỏ thanh đi và để từng giá tự chọn, chỉ cần một giá lệch là ba chi tiết không còn ăn khớp với nhau.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Abstract Factory, dùng phím mũi tên để chọn bộ" aria-valuemin="1" aria-valuemax="${RUNS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Ba lần phát bộ chi tiết", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-part-top{fill:var(--anatomy-top)}
.dp-knob-top{fill:var(--anatomy-top)}
.dp-stack{fill:none;stroke:var(--anatomy-lo);stroke-width:.5}
.dp-bar-text{letter-spacing:.06em}
.dp-hub{fill:var(--anatomy-hi)}
.iso-stage{touch-action:pan-y;overflow:hidden}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:106%;margin:-3% -3% -5%}}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript, PARTS };
