// The Builder figure: a composing bench. The form bed has five type rows: the
// first holds the fixed SELECT line, and each builder call lifts one cast line
// (a slug) out of the galley at the front and drops it into its own row. Nothing
// is printed while the form is being composed. build() pushes the lock bar
// against the lines: a feeler on the bar checks the last row, and if it is empty
// a flag pops up and nothing is printed. With every required row filled the bar
// locks, the proof roller runs across the form and the printed sheet (the Query)
// feeds up out of the delivery housing at the back. Every line on the sheet and
// every number in the readout comes from model.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { BASE, CALLS, STEPS, replay, showParams } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 450;

const PLATE = { x: -112, y: -96, w: 204, d: 214, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Imposing stone and the form on it: five rows, one groove each.
const STONE = { x: -64, y: -50, w: 140, d: 100, r: 3 };
const BED = 12;
const ROWS = [-32, -16, 0, 16, 32];
const GROOVE = { x0: -57, x1: 48.6, half: 5.5, floor: 9.5 };
const SLUG = { x: -54, w: 100, half: 4.6, h: 6.5 };
const SLUG_TOP = GROOVE.floor + SLUG.h;
const HEAD = { x: -59.5, y: -44, w: 5.5, d: 88, r: 1 };
const BAR = { x: 50, y: -40, w: 3, d: 80, r: 0.8 };
const BAR_TOP = BED + 3.2;
const LOCK = 4;
const FINGER = 6;
const FINGER_Y = ROWS[4];
const BRACKET = { x: 62, y: -6, w: 5, d: 12, r: 1 };
const ROD = { half: 1.2, z0: BED + 0.6, z1: BED + 3 };
const KNOB_X = 76;

// Rails and the proof roller's carriage.
const RAIL_X = [-100, 56];
const RAIL_Y = [-61, 57];
const RAIL_H = 4;
const CHEEK_Y = [-62, 56];
const CHEEK = { half: 9, d: 6, top: 34 };
const ROLL = { r: 8, z: SLUG_TOP + 8, y0: -56, y1: 56 };
const PARK = -82;
const END = 38;

// Delivery housing at the back, and the printed sheet.
const HOUSE = { x: -68, y: -92, w: 142, d: 22, r: 2 };
const HOUSE_H = 20;
const SLOT_Y = -81;
const SHEET = { x: -60, w: 126, h: 62 };

// The galley: slugs wait here before their calls.
const GALLEY = { x: -60, y: 66, w: 112, d: 48, r: 1.5 };
const TRAY_FLOOR = 2;
const TRAY_TOP = 8.5;
const GALLEY_Y = CALLS.map((_, c) => 73 + c * 10.6);
const LIFT = 26;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [SHEET.x, SLOT_Y, HOUSE_H + SHEET.h + 1],
    [SHEET.x + SHEET.w, SLOT_Y, HOUSE_H + SHEET.h + 1],
    [PARK - CHEEK.half, -62, CHEEK.top + 12],
    [KNOB_X + 8, 0, BED],
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 56 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const Y = [0, 1, 0];
const X = [1, 0, 0];
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
// A closed rounded rectangle in a face's own 2D coordinates.
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
// The part of the screen above a polyline of 3D points: what the edges along it
// (a lip, a slot, a housing top) do not hide.
function above(id, points) {
  const flat = points.map(at);
  const up = [...flat].reverse().map(([x, y]) => [x, y - 2000]);
  return `<clipPath id="${id}"><path d="${k.pathOf([...flat, ...up], true)}"/></clipPath>`;
}

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

// Front-right corner of the plate: the maker's plate and a planer block, the
// wooden block a compositor taps over a form to level the type.
function frontRight() {
  const out = [];
  const label = { x: 60, y: 92, w: 24, d: 14, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[64, 96, 14], [64, 99, 10], [64, 102, 13]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 7, 0.8]), at([label.x + label.w - 2.4, label.y + 7, 0.8])], { size: 0.4 }));
  const block = { x: 60, y: 70, w: 22, d: 13, r: 1.2 };
  const grain = [3.2, 6.4, 9.6].map((dy) => k.lineOnTop([block.x + 0.4, block.y + dy], [block.x + block.w - 0.4, block.y + dy], 6, P)).join("");
  out.push(S(k.slabOf(block, 0, 6, P, 3, 0.8), { tone: "mid", inner: L(grain, { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: block.x + 6, y: block.y + 4.5, w: 10, d: 4, r: 1.6 }, 6, 2.4, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}

// The delivery housing: paper inside, a long slot on top where the printed sheet comes out.
function housing() {
  const out = [];
  const seam = k.sideSeam(HOUSE, 15, P, 6);
  out.push(S(k.slabOf(HOUSE, 0, HOUSE_H, P, 6, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  const slot = { x: SHEET.x - 3, y: SLOT_Y - 1.1, w: SHEET.w + 6, d: 2.2, r: 1.1 };
  out.push(`<path class="dp-hole" d="${k.planOutline(slot, HOUSE_H, P, 4)}"/>`);
  out.push(L(k.planOutline(slot, HOUSE_H, P, 4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan({ ...slot, y: slot.y - 2.4, d: slot.d + 4.8, r: 2 }, -1.2), HOUSE_H, P, 4), { tone: "faint" }));
  out.push(D([[-62, -88], [68, -88], [-62, -74], [68, -74]].map(([x, y]) => at([x, y, HOUSE_H])), { size: 0.45 }));
  // Louvres on the front face.
  const M = k.sideMatrix([HOUSE.x + 10, HOUSE.y + HOUSE.d], 11, P, "left");
  const vents = Array.from({ length: 9 }, (_, i) => rrect(i * 5, 0, 2.2, 6, 1.1)).join("");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="lo" d="${vents}"/></g>`);
  const N = k.sideMatrix([HOUSE.x + 98, HOUSE.y + HOUSE.d], 13.5, P, "left");
  out.push(`<g transform="${N}"><path class="dp-plate" d="${rrect(0, 0, 30, 9, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 30, 9, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="M3 3.2H19M3 5.8H14"/></g>`);
  out.push(D([at([HOUSE.x + 125.6, HOUSE.y + HOUSE.d, 11.5]), at([HOUSE.x + 125.6, HOUSE.y + HOUSE.d, 7])], { size: 0.4 }));
  // Paper feed knob on the right end.
  const F = G.frameAlong([HOUSE.x + HOUSE.w, SLOT_Y, 10], X);
  out.push(S(G.disc(0, 1.2, 5.4, F, P), { tone: "mid" }));
  const ribs = G.ribsOf(F, 1.5, 5.4, 4.2, 24, P, { fade: [0.1, 0.5] });
  out.push(S(G.solidOf([[1.2, 4.2], [5.4, 4.2], [5.4, 2.2], [6.4, 1.6]], F, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) }));
  return out.join("");
}

// The printed sheet, built fully risen; the live code lowers it into the slot.
const query = replay(STEPS.length - 1).result.query;
const PRINT = [...query.sql.split("\n"), showParams(query.params)];
function sheet() {
  const z0 = HOUSE_H + 0.5;
  const plan = { x: SHEET.x, y: SLOT_Y - 0.3, w: SHEET.w, d: 0.6, r: 0.2 };
  const out = [S(k.slabOf(plan, z0, SHEET.h, P, 2), { tone: "hi", crease: "none" })];
  const M = k.sideMatrix([SHEET.x, SLOT_Y + 0.3], z0 + SHEET.h, P, "left");
  const lines = PRINT.map((text, i) => {
    const y = i < PRINT.length - 1 ? 9.5 + i * 6.3 : 9.5 + i * 6.3 + 4;
    return `<text class="iso-face-text dp-print" data-tone="hi" x="6" y="${y}" font-size="4.4" xml:space="preserve">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>`;
  }).join("");
  const rule = 9.5 + (PRINT.length - 2) * 6.3 + 4;
  out.push(`<g transform="${M}">${lines}<path class="iso-line" data-tone="faint" data-free="" d="M6 ${rule}H${SHEET.w - 6}"/></g>`);
  return `${above("dp-slot", [[-400, SLOT_Y + 0.3, HOUSE_H], [400, SLOT_Y + 0.3, HOUSE_H]])}<g clip-path="url(#dp-slot)"><g data-part="sheet" transform="${k.translateAlong(P, [0, 0, 0])}">${out.join("")}</g></g>`;
}

// The ink table where the roller parks: the roller takes up ink here before a pass.
const INK = { x: -98, y: -47, w: 30, d: 94, r: 2 };
function inkTable() {
  const out = [];
  const seam = k.sideSeam(INK, 4, P, 4);
  out.push(S(k.slabOf(INK, 0, SLUG_TOP, P, 4, 0.8), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  const film = { x: INK.x + 3, y: INK.y + 4, w: INK.w - 6, d: INK.d - 8, r: 1.2 };
  out.push(`<path class="dp-ink" d="${k.planOutline(film, SLUG_TOP, P, 4)}"/>`);
  out.push(L(k.planOutline(film, SLUG_TOP, P, 4), { tone: "lo" }));
  const streaks = [-30, -12, 6, 24].map((y) => k.lineOnTop([film.x + 4, y], [film.x + film.w - 4, y + 3], SLUG_TOP, P));
  out.push(L(streaks.join(""), { tone: "faint", free: true }));
  out.push(D([[INK.x + 1.6, INK.y + 2], [INK.x + INK.w - 1.6, INK.y + 2], [INK.x + 1.6, INK.y + INK.d - 2], [INK.x + INK.w - 1.6, INK.y + INK.d - 2]].map(([x, y]) => at([x, y, SLUG_TOP])), { size: 0.4 }));
  return out.join("");
}

function rail(y) {
  const out = [];
  out.push(S(k.slabOf({ x: RAIL_X[0], y, w: RAIL_X[1] - RAIL_X[0], d: 4, r: 1 }, 0, RAIL_H, P, 3, 0.4), { tone: "mid" }));
  out.push(L(k.lineOnTop([RAIL_X[0], y + 2], [RAIL_X[1], y + 2], RAIL_H, P), { tone: "faint" }));
  out.push(D([-92, -60, -28, 4, 36].map((x) => at([x, y + 2, RAIL_H])), { size: 0.4 }));
  for (const x of [RAIL_X[0] - 4, RAIL_X[1]]) {
    out.push(S(k.slabOf({ x, y: y - 1, w: 4, d: 6, r: 1 }, 0, 9, P, 3, 0.4), { tone: "mid" }));
    out.push(D([at([x + 2, y + 2, 9])], { size: 0.45 }));
  }
  return out.join("");
}

// One cheek of the carriage, with its shoe over the rail; built at x = 0.
function cheek(y0) {
  const out = [];
  out.push(S(k.slabOf({ x: -11, y: y0 - 0.5, w: 22, d: CHEEK.d + 1, r: 1.2 }, RAIL_H, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -CHEEK.half, y: y0, w: CHEEK.half * 2, d: CHEEK.d, r: 1.6 }, RAIL_H + 3, CHEEK.top - RAIL_H - 3, P, 4, 0.6), { tone: "mid" }));
  out.push(D([-7.5, 7.5].map((x) => at([x, y0 + CHEEK.d / 2, RAIL_H + 3])), { size: 0.4 }));
  return out.join("");
}

function carriageBack() {
  return cheek(CHEEK_Y[0]);
}

function carriageFront() {
  const out = [];
  const F = G.frameAlong([0, ROLL.y0, ROLL.z], Y);
  const len = ROLL.y1 - ROLL.y0;
  out.push(S(G.solidOf([[0, 3], [2, 3], [2, ROLL.r - 0.7], [2.7, ROLL.r], [len - 2.7, ROLL.r], [len - 2, ROLL.r - 0.7], [len - 2, 3], [len, 3]], F, P), { tone: "mid", crease: "lo" }));
  out.push(cheek(CHEEK_Y[1]));
  // Bearing cap on the front cheek.
  const B = G.frameAlong([0, CHEEK_Y[1] + CHEEK.d, ROLL.z], Y);
  out.push(S(G.disc(0, 1.2, 4.6, B, P), { tone: "mid" }));
  out.push(D([0, 1, 2, 3].map((i) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    return at([3.2 * Math.cos(a), CHEEK_Y[1] + CHEEK.d + 1.2, ROLL.z + 3.2 * Math.sin(a)]);
  }), { size: 0.4 }));
  // Bridge between the cheeks and its handle.
  const bridge = { x: -6, y: CHEEK_Y[0], w: 12, d: CHEEK_Y[1] + CHEEK.d - CHEEK_Y[0], r: 1.6 };
  out.push(S(k.slabOf(bridge, CHEEK.top, 5, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(bridge, CHEEK.top + 2.5, P, 4), { tone: "faint" }) }));
  out.push(D([CHEEK_Y[0] + 3, -30, 30, CHEEK_Y[1] + 3].map((y) => at([3, y, CHEEK.top + 5])), { size: 0.4 }));
  for (const y of [-24, 24]) out.push(S(k.cylinder(0, y, 1.6, CHEEK.top + 5, 6, P, 20), { tone: "mid" }));
  const H = G.frameAlong([0, -28, CHEEK.top + 12], Y);
  const grip = G.ribsOf(H, 4, 52, 2.4, 18, P, { fade: [0.1, 0.5] });
  out.push(S(G.solidOf([[0, 1.8], [4, 2.4], [52, 2.4], [56, 1.8]], H, P), { tone: "mid", inner: k.fadedSvg(grip, { tone: "lo" }) }));
  return out.join("");
}

// One groove in the bed: floor, the inner walls the viewer can see, the lip.
function groove(row, r) {
  const out = [];
  const plan = { x: GROOVE.x0, y: row - GROOVE.half, w: GROOVE.x1 - GROOVE.x0, d: GROOVE.half * 2, r: 0.4 };
  const opening = k.planOutline(plan, BED, P, 2);
  out.push(`<clipPath id="dp-groove-${r}"><path d="${opening}"/></clipPath>`);
  out.push(`<path class="dp-hole" d="${opening}"/><g clip-path="url(#dp-groove-${r})">`);
  const wall = [[GROOVE.x0, row - GROOVE.half, BED], [GROOVE.x1, row - GROOVE.half, BED], [GROOVE.x1, row - GROOVE.half, GROOVE.floor], [GROOVE.x0, row - GROOVE.half, GROOVE.floor]];
  out.push(`<path class="dp-wall" d="${k.pathOf(wall.map(at), true)}"/>`);
  out.push(L(k.pathOf(wall.map(at), true), { tone: "faint" }));
  const end = [[GROOVE.x0, row - GROOVE.half, BED], [GROOVE.x0, row + GROOVE.half, BED], [GROOVE.x0, row + GROOVE.half, GROOVE.floor], [GROOVE.x0, row - GROOVE.half, GROOVE.floor]];
  out.push(`<path class="dp-wall" d="${k.pathOf(end.map(at), true)}"/></g>`);
  out.push(L(opening, { tone: "lo" }));
  return out.join("");
}

function stone() {
  const out = [];
  const seam = k.sideSeam(STONE, 6, P, 4);
  out.push(S(k.slabOf(STONE, 0, BED, P, 4, 1), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(D([-50, -20, 10, 40, 66].map((x) => at([x, STONE.y + STONE.d, 9])), { size: 0.45 }));
  ROWS.forEach((row, r) => out.push(groove(row, r)));
  // Line-measure scale along the front of the bed.
  const scale = { x: -54, y: 41.5, w: 98, d: 5, r: 0.6 };
  out.push(S(k.slabOf(scale, BED, 0.4, P, 2), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-52, 44, 2, 5, scale.y + 0.6, BED + 0.4, [1.4, 2.8], P, "x");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // Head stop at the left: every line butts against it.
  out.push(S(k.slabOf(HEAD, BED, 3.5, P, 3, 0.5), { tone: "mid" }));
  out.push(D([-40, -8, 24, 40].map((y) => at([HEAD.x + 2.75, y, BED + 3.5])), { size: 0.45 }));
  out.push(S(k.slabOf({ x: 47, y: -47, w: 10, d: 6, r: 1 }, BED, 5, P, 3, 0.5), { tone: "mid" }));
  out.push(D([at([54.5, -44, BED + 5])], { size: 0.45 }));
  return out.join("");
}

// One cast line: the slug, with its type on top. Type on a form reads mirrored,
// so its words run from the right end to the left. Built seated in its row.
function slug(row, text, { lit = false } = {}) {
  const out = [];
  const plan = { x: SLUG.x, y: row - SLUG.half, w: SLUG.w, d: SLUG.half * 2, r: 0.5 };
  const nick = k.segment([SLUG.x + 2, row + SLUG.half, GROOVE.floor + 2], [SLUG.x + SLUG.w - 2, row + SLUG.half, GROOVE.floor + 2], P);
  out.push(S(k.slabOf(plan, GROOVE.floor, SLUG.h, P, 2, 0.3), { tone: "hi", crease: "lo", lit, inner: L(nick, { tone: "faint" }) }));
  const pitch = 2.5;
  let x = SLUG.x + SLUG.w - 6;
  const words = [];
  const marks = [];
  for (const word of text.split(" ")) {
    const w = word.length * pitch;
    words.push(k.planOutline({ x: x - w, y: row - 1.9, w, d: 3.8, r: 0.5 }, SLUG_TOP, P, 2));
    for (let i = 0; i < word.length; i++) {
      const cx = x - (i + 0.5) * pitch;
      if (/[.,()?]/.test(word[i])) marks.push([cx, row + 1]);
      else words.push(k.lineOnTop([cx, row - 1.1], [cx, row + 1.1], SLUG_TOP, P));
    }
    x -= w + pitch;
  }
  out.push(L(words.join(""), { tone: "lo", free: true }));
  if (marks.length) out.push(D(marks.map(([mx, my]) => at([mx, my, SLUG_TOP])), { size: 0.35, tone: "lo" }));
  return `<g data-part="slug">${out.join("")}</g>`;
}

// The lock bar and what rides on it: the feeler housing and flag. Built at rest.
function lockBar() {
  const out = [];
  out.push(S(k.slabOf(BAR, BED, BAR_TOP - BED, P, 3, 0.4), { tone: "mid" }));
  out.push(D([-34, -10, 10, 22].map((y) => at([BAR.x + 1.5, y, BAR_TOP])), { size: 0.4 }));
  const box = { x: BAR.x - 0.4, y: FINGER_Y - 5, w: BAR.w + 0.8, d: 10, r: 1 };
  const top = BAR_TOP + 6.4;
  const slot = { x: BAR.x + 0.7, y: FINGER_Y - 4.2, w: 1.6, d: 8.4, r: 0.5 };
  out.push(`<g data-part="finger"></g>`);
  out.push(S(k.slabOf(box, BAR_TOP, top - BAR_TOP, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(box, BAR_TOP + 2, P, 3), { tone: "faint" }) }));
  out.push(`<path class="dp-hole" d="${k.planOutline(slot, top, P, 2)}"/>`);
  out.push(L(k.planOutline(slot, top, P, 2), { tone: "lo" }));
  out.push(D([at([box.x + box.w - 0.9, box.y + 1.4, top]), at([box.x + box.w - 0.9, box.y + box.d - 1.4, top])], { size: 0.35 }));
  // The flag lives inside the housing and rises out of its slot; only what is above the top shows.
  const flag = [];
  flag.push(S(k.slabOf({ x: BAR.x + 1, y: FINGER_Y - 4, w: 1, d: 1, r: 0.3 }, BED + 1, top - BED - 1.2, P, 2), { tone: "mid", crease: "none" }));
  flag.push(`<g data-part="flag-plate">${S(k.slabOf({ x: BAR.x + 1.2, y: FINGER_Y - 3, w: 0.6, d: 7, r: 0.4 }, top - 6.6, 6.2, P, 2), { tone: "hi", crease: "none" })}</g>`);
  out.push(above("dp-flag", [[BAR.x + 2, -400, top], [BAR.x + 2, 400, top]]));
  out.push(`<g clip-path="url(#dp-flag)"><g data-part="flag">${flag.join("")}</g></g>`);
  out.push(`<g data-part="rod-in"></g>`);
  return out.join("");
}

function frontGuide() {
  return S(k.slabOf({ x: 47, y: 41, w: 10, d: 6, r: 1 }, BED, 5, P, 3, 0.5), { tone: "mid" }) + D([at([54.5, 44, BED + 5])], { size: 0.45 });
}

function bracket() {
  const out = [S(k.slabOf(BRACKET, BED, 9, P, 3, 0.6), { tone: "mid" })];
  out.push(D([at([BRACKET.x + 2.5, BRACKET.y + 2.2, BED + 9]), at([BRACKET.x + 2.5, BRACKET.y + BRACKET.d - 2.2, BED + 9])], { size: 0.45 }));
  return out.join("");
}

// The push handle on the end of the rod: a square boss and a crossbar. Built at rest.
function handle() {
  const out = [];
  out.push(S(k.slabOf({ x: KNOB_X, y: -2.4, w: 4, d: 4.8, r: 0.8 }, BED - 0.6, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: KNOB_X + 4, y: -10, w: 3, d: 20, r: 1.4 }, BED - 0.4, 4.6, P, 4, 0.5), { tone: "mid", inner: L(k.lineOnTop([KNOB_X + 5.5, -10], [KNOB_X + 5.5, 10], BED + 4.2, P), { tone: "faint" }) }));
  return out.join("");
}

function galleyBack() {
  const out = [];
  out.push(S(k.slabOf(GALLEY, 0, TRAY_FLOOR, P, 4, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: GALLEY.x, y: GALLEY.y, w: GALLEY.w, d: 2, r: 0.6 }, TRAY_FLOOR, 6, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: GALLEY.x, y: GALLEY.y, w: 2, d: GALLEY.d, r: 0.6 }, TRAY_FLOOR, 6, P, 2), { tone: "mid" }));
  return out.join("");
}

function galleyFront() {
  const out = [];
  const wall = { x: GALLEY.x, y: GALLEY.y + GALLEY.d - 2, w: GALLEY.w, d: 2, r: 0.6 };
  out.push(S(k.slabOf(wall, TRAY_FLOOR, 6, P, 2), { tone: "mid" }));
  out.push(D([-50, 0, 44].map((x) => at([x, wall.y + 1, TRAY_FLOOR + 6])), { size: 0.4 }));
  // Pull grip on the front of the tray.
  const grip = { x: -14, y: wall.y + 2, w: 24, d: 2.2, r: 1 };
  out.push(S(k.slabOf(grip, TRAY_FLOOR + 1.6, 2.6, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}

// Engraved marks on the galley floor at each waiting slug's place, from the left wall.
function galleyMarks() {
  const x = GALLEY.x + 2;
  const marks = GALLEY_Y.map((y) => k.planOutline({ x: x + 1, y: y - 0.8, w: 5, d: 1.6, r: 0.8 }, TRAY_FLOOR, P, 3)).join("");
  return L(marks, { tone: "lo" });
}

// Motion, shared by the build (the starting pose) and the page.
const MOTION = {
  steps: STEPS.map((step, i) => ({
    add: step.kind === "add",
    call: step.call ?? -1,
    ok: step.kind === "build" && Boolean(replay(i).result.query),
    reset: i > 0 && STEPS[i - 1].kind === "build" && !replay(i - 1).result.query,
  })),
  rows: CALLS.map((call) => ROWS[call.row]),
  galley: GALLEY_Y,
  floor: GROOVE.floor,
  tray: TRAY_FLOOR,
  lift: LIFT,
  lock: LOCK,
  park: PARK,
  end: END,
};

// Where everything is at timeline position T: step i plays while T goes from i to i + 1.
function poseAt(T, M) {
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => { const c = clamp01(v); return c * c * (3 - 2 * c); };
  const pose = { slugs: M.galley.map((y) => [y, M.tray]), lock: 0, flag: 0, car: M.park, sheet: 0 };
  M.steps.forEach((step, i) => {
    const u = clamp01(T - i);
    if (u <= 0) return;
    if (step.add) {
      let v = u;
      if (step.reset) {
        const r = ease(u / 0.2);
        pose.lock *= 1 - r;
        pose.flag *= 1 - r;
        v = clamp01((u - 0.2) / 0.8);
      }
      const from = M.galley[step.call], to = M.rows[step.call];
      const up = ease(v / 0.25), across = ease((v - 0.25) / 0.45), down = ease((v - 0.7) / 0.3);
      const z = v < 0.7 ? M.tray + (M.lift - M.tray) * up : M.lift + (M.floor - M.lift) * down;
      pose.slugs[step.call] = [from + (to - from) * across, z];
    } else if (!step.ok) {
      pose.lock = M.lock * ease(u / 0.35);
      pose.flag = ease((u - 0.42) / 0.25);
    } else {
      pose.lock = M.lock * ease(u / 0.15);
      pose.car = M.park + (M.end - M.park) * ease((u - 0.2) / 0.55);
      pose.sheet = ease((u - 0.3) / 0.6);
    }
  });
  return pose;
}

const START = STEPS.length - 1;
const POSE = poseAt(START + 1, MOTION);
const move = (by) => k.translateAlong(P, by);
const slugMove = (c, pose) => move([0, pose.slugs[c][0] - MOTION.rows[c], pose.slugs[c][1] - GROOVE.floor]);

// Square bar from x0 to x1 along x: the push rod, rebuilt as the bar moves.
const rodPiece = (x0, x1) => S(k.slabOf({ x: x0, y: -ROD.half, w: x1 - x0, d: ROD.half * 2, r: 0.3 }, ROD.z0, ROD.z1 - ROD.z0, P, 2), { tone: "mid", crease: "none" });
const fingerPiece = (face, out) => (out > 0.05 ? S(k.slabOf({ x: face - out, y: FINGER_Y - 1, w: out + 0.2, d: 2, r: 0.4 }, BED + 0.4, 2.2, P, 2), { tone: "hi", crease: "none" }) : "");

const rowsSvg = ROWS.map((row, r) => {
  const c = CALLS.findIndex((call) => call.row === r);
  const fixed = r === 0 ? slug(row, BASE) : "";
  const held = c >= 0 && POSE.slugs[c][1] < BED + 0.5 && POSE.slugs[c][0] < 52
    ? `<g data-slug="${c}" transform="${slugMove(c, POSE)}">${slug(ROWS[CALLS[c].row], CALLS[c].type)}</g>`
    : "";
  return `${above(`dp-row-${r}`, [[-400, row + GROOVE.half, BED], [GROOVE.x1, row + GROOVE.half, BED], [GROOVE.x1, -400, BED]])}<g data-row="${r}" clip-path="url(#dp-row-${r})">${fixed}${held}</g>`;
}).join("");

const galleySvg = CALLS.map((call, c) => {
  const inTray = POSE.slugs[c][1] < TRAY_TOP && POSE.slugs[c][0] > 62;
  return `<g data-galley="${c}">${inTray ? `<g data-slug="${c}" transform="${slugMove(c, POSE)}">${slug(ROWS[call.row], call.type)}</g>` : ""}</g>`;
}).join("");

const lockMove = move([-POSE.lock, 0, 0]);
export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một bàn sắp chữ. Trên bệ đá có khuôn năm hàng: hàng đầu là dòng SELECT cố định, bốn hàng sau trống. Phía trước là khay chứa bốn thanh chữ đúc sẵn, mỗi thanh cho một lời gọi builder. Mỗi lời gọi nhấc một thanh lên và đặt vào đúng hàng của nó. Bên phải là thanh khoá có ngón dò và lá cờ; phía sau là hộp ra giấy. Khi gọi build(), thanh khoá ép vào các hàng: nếu hàng cuối còn trống thì cờ bật lên và không in gì; nếu đủ, trục in lăn qua khuôn và tờ in câu SQL cùng danh sách tham số trồi lên khỏi hộp.",
  body: [
    base(),
    housing(),
    sheet(),
    rail(RAIL_Y[0]),
    `<g data-part="car" transform="${move([POSE.car, 0, 0])}">${carriageBack()}</g>`,
    inkTable(),
    stone(),
    rowsSvg,
    `<g data-part="lock" transform="${lockMove}">${lockBar()}</g>`,
    frontGuide(),
    bracket(),
    `<g data-part="rod-out"></g><g data-part="handle" transform="${lockMove}">${handle()}</g>`,
    rail(RAIL_Y[1]),
    `<g data-part="car" transform="${move([POSE.car, 0, 0])}">${carriageFront()}</g>`,
    galleyBack(),
    galleyMarks(),
    galleySvg,
    galleyFront(),
    frontRight(),
    `<g data-part="air"></g>`,
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const M = ${JSON.stringify(MOTION)};
const ROWS = ${JSON.stringify(ROWS)}, FLOOR = ${GROOVE.floor}, BED = ${BED}, TRAY_TOP = ${TRAY_TOP}, LOCK = ${LOCK}, FINGER = ${FINGER};
const BAR_X = ${BAR.x}, BAR_W = ${BAR.w}, BRACKET = ${JSON.stringify(BRACKET)}, KNOB_X = ${KNOB_X}, FINGER_Y = ${FINGER_Y};
const ROD = ${JSON.stringify(ROD)}, SHEET_H = ${SHEET.h}, SLUG_END = ${SLUG.x + SLUG.w};
${poseAt.toString()}
const rodPiece = ${rodPiece.toString().replace(/\bk\./g, "")};
const fingerPiece = ${fingerPiece.toString().replace(/\bk\./g, "")};
const S = (paths, style) => solidSvg(paths, style);
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const cars = svg.querySelectorAll('[data-part="car"]');
const lockEls = svg.querySelectorAll('[data-part="lock"], [data-part="handle"]');
const flag = svg.querySelector('[data-part="flag"]');
const flagPlate = svg.querySelector('[data-part="flag-plate"] > .iso-solid');
const finger = svg.querySelector('[data-part="finger"]');
const rodIn = svg.querySelector('[data-part="rod-in"]');
const rodOut = svg.querySelector('[data-part="rod-out"]');
const sheet = svg.querySelector('[data-part="sheet"]');
const sheetBody = sheet.querySelector(".iso-solid");
const rowsEl = ROWS.map((_, r) => svg.querySelector('[data-row="' + r + '"]'));
const galleyEl = M.galley.map((_, c) => svg.querySelector('[data-galley="' + c + '"]'));
const air = svg.querySelector('[data-part="air"]');
const slugs = M.galley.map((_, c) => svg.querySelector('[data-slug="' + c + '"]'));
const slugBodies = slugs.map((el) => el.querySelector(".iso-solid"));
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const N = STEPS.length;
const SEG = 2.8, TOUR = 5.4;
const START = ${START};
let sel = START, t = START + 1, way = null, back = 1, frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0;
let drawnLock = -1, drawnFinger = -1;
const results = STEPS.map((_, i) => replay(i).result);
function settledText(n) {
  const step = STEPS[n];
  if (step.kind === "add") return "." + (CALLS[step.call].short || CALLS[step.call].py) + " · khuôn " + replay(n).rows.length + " hàng";
  const r = results[n];
  return r.query ? "build() → Query · " + r.query.params.length + " tham số" : "build() từ chối: thiếu page()";
}
function stepText(n) {
  const step = STEPS[n];
  if (step.kind === "add") return "Bước " + (n + 1) + ": gọi ." + CALLS[step.call].py + ", khuôn có " + replay(n).rows.length + " hàng";
  const r = results[n];
  return "Bước " + (n + 1) + ": gọi .build(), " + (r.query ? "in ra Query với " + r.query.params.length + " tham số" : "bị từ chối vì " + r.error);
}
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", stepText(sel));
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
const tourFrom = (index) => ((index - START + N) % N) * TOUR;
const lit = (el, on) => { el.toggleAttribute("data-lit", on); el.querySelector(".iso-edge").setAttribute("data-tone", on ? "lit" : "hi"); };
function place(c, y, z) {
  const parent = z < TRAY_TOP && y > 62 ? galleyEl[c] : z < BED + 0.5 && y < 52 ? rowsEl[CALLS[c].row] : air;
  if (slugs[c].parentNode !== parent) parent.appendChild(slugs[c]);
  slugs[c].setAttribute("transform", translateAlong(P, [0, y - M.rows[c], z - FLOOR]));
}
function draw() {
  const pose = poseAt(t, M);
  pose.slugs.forEach(([y, z], c) => place(c, y, z));
  cars.forEach((el) => el.setAttribute("transform", translateAlong(P, [pose.car, 0, 0])));
  const shift = translateAlong(P, [-pose.lock, 0, 0]);
  lockEls.forEach((el) => el.setAttribute("transform", shift));
  if (Math.abs(pose.lock - drawnLock) > 0.001) {
    drawnLock = pose.lock;
    rodIn.innerHTML = rodPiece(BAR_X + BAR_W, BRACKET.x + pose.lock);
    rodOut.innerHTML = rodPiece(BRACKET.x + BRACKET.w, KNOB_X - pose.lock + 0.2);
  }
  // The feeler springs out of the bar as it closes; a line in the last row stops it short.
  const [ly, lz] = pose.slugs[pose.slugs.length - 1];
  const seated = lz < FLOOR + 0.5 && Math.abs(ly - M.rows[M.rows.length - 1]) < 0.5;
  const reach = (FINGER * pose.lock) / LOCK;
  const out = seated ? Math.max(0, Math.min(reach, BAR_X - pose.lock - SLUG_END)) : reach;
  if (Math.abs(out - drawnFinger) > 0.001) { drawnFinger = out; finger.innerHTML = fingerPiece(BAR_X, out); }
  flag.setAttribute("transform", translateAlong(P, [0, 0, 9 * pose.flag]));
  sheet.setAttribute("transform", translateAlong(P, [0, 0, -(SHEET_H + 1) * (1 - pose.sheet)]));
  // The lit part is what the current step works on.
  const n = Math.ceil(t - 1e-6) - 1;
  const step = n >= 0 ? STEPS[n] : null;
  slugBodies.forEach((el, c) => lit(el, Boolean(step && step.kind === "add" && step.call === c)));
  lit(flagPlate, Boolean(step && step.kind === "build" && !results[n].query && pose.flag > 0.5));
  lit(sheetBody, Boolean(step && step.kind === "build" && results[n].query && pose.sheet > 0.5));
  let text;
  if (t === sel + 1) text = settledText(sel);
  else if (way !== null || t > sel + 1) text = "đang tua lại";
  else if (step && step.kind === "add") text = "đang gọi ." + (CALLS[step.call].short || CALLS[step.call].py);
  else text = step && results[n].query ? "build(): khoá khuôn và in" : "build(): đang kiểm tra khuôn";
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    const next = (Math.floor(clock / TOUR) + START) % N;
    if (next !== sel) { sel = next; aim(); describe(); }
  }
  if (calm) { t = sel + 1; way = null; }
  else if (way !== null) {
    // Rewind fast to the start of the chosen step, then play it.
    t = Math.max(way, t - back * dt);
    if (t === way) way = null;
  } else {
    const gap = sel + 1 - t;
    const speed = (1 + 1.4 * Math.max(0, gap - 1)) / SEG;
    t = Math.abs(gap) <= speed * dt ? sel + 1 : t + Math.sign(gap) * speed * dt;
  }
  draw();
  const settled = !touring && t === sel + 1 && way === null;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
// Going back means rewinding to the start of that step, so its own motion still plays.
const aim = () => { way = t > sel ? sel : null; if (way !== null) back = Math.max(1.6, (t - way) / 1.1); };
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; clock = tourFrom(sel); emit(); run(); }, 3600);
  if (index !== sel) { sel = index; aim(); describe(); } else emit();
  run();
};
const pick = (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
  return Math.floor(share * N);
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = true; clock = tourFrom(sel); emit(); run(); });
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

// Step captions, built from the model.
const code = (text) => `<code>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</code>`;
const LABELS = ["status()", "between()", "order_by()", "build() ✗", "page()", "build() ✓"];
const steps = STEPS.map((step, n) => {
  const label = LABELS[n];
  const short = String(n + 1);
  const state = replay(n);
  if (step.kind === "build") {
    const r = state.result;
    if (r.error) {
      return { label, short, caption: `${code(".build()")} kiểm tra cả khuôn trước khi in: hàng cuối còn trống, ngón dò lọt vào chỗ trống và cờ bật lên. Builder <strong>từ chối: thiếu page()</strong>, không có Query nào được tạo.` };
    }
    return { label, short, caption: `${code(".build()")} khoá khuôn, trục in lăn qua và tờ in trồi lên: một <strong>Query</strong> gồm ${r.query.sql.split("\n").length} dòng SQL và ${r.query.params.length} tham số riêng. Query không sửa được nữa.` };
  }
  const call = CALLS[step.call];
  const added = (() => {
    const b = state.builder;
    if (call.row === 1) return `hàng ${code("status = ?")}, giá trị ${code('"paid"')} đi vào danh sách tham số chứ không dán vào câu`;
    if (call.row === 2) return `hàng khoảng ngày từ 2026-10-01 đến trước 2026-11-01: hai điều kiện, hai tham số. Builder chỉ gom, chưa ghép câu`;
    if (call.row === 3) return `hàng ${code(b.order)}; tên cột phải nằm trong danh sách được phép`;
    return `hàng cuối ${code("LIMIT ? OFFSET ?")} với ${b.paging[0]} và ${b.paging[1]}; ngón dò giờ chạm vào hàng này`;
  })();
  return { label, short, caption: `${code("." + (call.short || call.py))} thêm ${added}. Khuôn có ${state.rows.length} hàng.` };
});

const first = STEPS[START];
export const plate = withSteps(k.plateHtml({
  fig: "Fig 13",
  title: "Builder",
  hint: "Rê chuột để chọn bước",
  readout: first.kind === "build" ? `build() → Query · ${query.params.length} tham số` : "",
  keys: [
    { mark: "lit", label: "Phần bước đang làm: hàng chữ vừa đặt, cờ báo thiếu, hoặc tờ in Query" },
    { mark: "raised", label: "Thanh chữ: mỗi lời gọi builder đặt một thanh vào đúng hàng của nó trong khuôn" },
  ],
  caption:
    "Builder giống một khuôn sắp chữ. Mỗi lời gọi đặt một thanh chữ vào đúng hàng của nó, và trong lúc sắp thì chưa có gì được in. Chỉ khi build() thì khuôn mới được kiểm tra rồi khoá lại. Thiếu hàng bắt buộc thì cờ bật lên và máy không in. Khuôn đủ thì trục in lăn qua và cho ra một tờ in: câu SQL kèm danh sách tham số riêng, và tờ in đó không sửa được nữa.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Builder: phím mũi tên để đi qua từng bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước: dựng câu truy vấn", steps, start: START }));

export const FIGURE_CSS = `
.dp-hole{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-ink{fill:var(--anatomy-shade-1)}
.dp-print{letter-spacing:0;font-variant-ligatures:none;font-feature-settings:"liga" 0,"calt" 0}
.iso-stage{touch-action:pan-y;overflow:hidden}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:108%;margin:-3% -4% -2%}}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
