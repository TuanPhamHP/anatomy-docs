// The Memento figure: a mixing console with motorised faders beside a scene
// memory bank. The three faders are the pricing configuration's state (the
// originator). Pressing STORE seals the current fader positions into a cartridge
// that rises out of a numbered slot in the bank: the memento. The bank (the
// caretaker) only holds cartridges. It has no window into them and no fader of its
// own. Pressing RECALL with the selector on a slot presses that cartridge onto
// the reader, and the console drives its own faders back to the stored positions.
// Every number comes from model.mjs; the motion is one timeline (timeline.mjs).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { FIELDS, SAMPLE, STEPS, fee, groupVND, valueAt } from "./model.mjs";
import { REST, litAt, pose } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 400;
const AZIMUTH = 40;

const PLATE = { x: -114, y: -60, w: 200, d: 122, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// The console (originator): plinth, body, meter bridge at the back, armrest at the front.
const PLINTH = { x: -106, y: -52, w: 126, d: 104, r: 5 };
const CON = { x: -104, y: -50, w: 122, d: 100, r: 5 };
const TOP = 16;
const BRIDGE = { x: -102, y: -48, w: 118, d: 16, r: 2 };
const BRIDGE_TOP = 34;
const FACE_Y = BRIDGE.y + BRIDGE.d;
const ARM = { x: -102, y: 41, w: 118, d: 7, r: 3.5 };
const ARM_H = 3.5;

// Three channel strips, one per field. A fader's centre runs from Y_LOW (value at
// the bottom of its scale) to Y_HIGH (top of the scale), away from the operator.
const CH_X = [-88, -60, -32];
const Y_LOW = 29;
const Y_HIGH = -21;
const SLOT = { y0: -26, y1: 34 };
const CAP_H = 6.2;
const faderY = (p) => Y_LOW + (Y_HIGH - Y_LOW) * p;

// Master section: slot selector knob, warning lamp, STORE and RECALL.
const KNOB = [6, -14];
const LAMP = [-8, -14];
const STORE = [-6, 12];
const RECALL = [8, 12];
// The dial's four positions face the operator, in front of the knob, so none hides behind it.
const slotAngle = (s) => ((120 + 40 * s) * Math.PI) / 180;

// The memory bank (caretaker) with four numbered slots.
const BANK_PLINTH = { x: 28, y: -44, w: 46, d: 88, r: 4 };
const BANK = { x: 30, y: -42, w: 42, d: 84, r: 4 };
const B_TOP = 22;
const SLOT_Y = [-27, -9, 9, 27];
const RISE = 11;
const CART_H = 18;
const opening = (ys) => ({ x: 37, y: ys - 6, w: 24, d: 12, r: 1.2 });
const cartPlan = (ys) => ({ x: 38, y: ys - 5, w: 22, d: 10, r: 1.4 });

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners(BRIDGE, TOP, BRIDGE_TOP + 2),
    ...k.boxCorners(cartPlan(SLOT_Y[0]), B_TOP, B_TOP + RISE + 2),
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const slab = (plan, z0, z1, steps = 3, bevel = 0) => k.slabOf(plan, z0, z1 - z0, P, steps, bevel);
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
function screenHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return `M${[...lower.slice(0, -1), ...upper.slice(0, -1)].map((p) => p.map((v) => v.toFixed(2)).join(" ")).join("L")}Z`;
}
const circle = (cx, cy, r, z, n = 36) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI), z]);
const tz = (dz) => k.translateAlong(P, [0, 0, dz]);
const ty = (dy) => k.translateAlong(P, [0, dy, 0]);

const START = 1;
const at0 = pose(REST[START]);
const lit0 = litAt(REST[START]);
const faders0 = [at0.fader0, at0.fader1, at0.fader2];
const values0 = FIELDS.map((field, i) => valueAt(field, faders0[i]));
const config0 = { base: values0[0], perKm: values0[1], freeFrom: values0[2] };

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
  // Label plate in front of the memory bank.
  const label = { x: 36, y: 49, w: 34, d: 8, r: 1.4 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[41, 51.6, 20], [41, 53.6, 14], [41, 55.6, 17]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 4, 0.8]), at([label.x + label.w - 2.4, label.y + 4, 0.8])], { size: 0.4 }));
  return out.join("");
}

function consoleBody() {
  const out = [];
  out.push(S(slab(PLINTH, 0, 3, 5, 0.5), { tone: "lo" }));
  out.push(S(slab(CON, 3, TOP, 6, 1.2), { tone: "mid", inner: L(k.sideSeam(CON, 6, P, 6), { tone: "faint" }) }));
  // Front face: a name strip and a row of vents.
  const F = k.sideMatrix([-96, CON.y + CON.d], 14, P, "left");
  const lines = [[3, 2.6, 18], [3, 4.6, 12]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  const vents = Array.from({ length: 8 }, (_, i) => rrect(78 + i * 3.6, 2, 1.6, 6, 0.8)).join("");
  out.push(`<g transform="${F}"><path class="dp-plate" d="${rrect(0, 0, 30, 7, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 30, 7, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/><path class="iso-line" data-tone="lo" d="${vents}"/></g>`);
  out.push(D([at([-94, CON.y + CON.d, 10.5]), at([-68, CON.y + CON.d, 10.5])], { size: 0.4 }));
  // Right face: the connector panel the bus to the memory bank plugs into.
  const R = k.sideMatrix([CON.x + CON.w, 16], 13.5, P, "right");
  out.push(`<g transform="${R}"><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 32, 9, 1.2)}"/></g>`);
  out.push(D([[15, 12], [-15, 12], [15, 6], [-15, 6]].map(([y, z]) => at([CON.x + CON.w, y, z])), { size: 0.4 }));
  return out.join("");
}

// Everything flat on the console's top: the fader slots and their scales, the
// strip dividers, the selector's dial marks and the master label plate.
function flatTop() {
  const out = [];
  out.push(L(k.planOutline(k.insetPlan(CON, 2.6), TOP, P, 6), { tone: "faint" }));
  CH_X.forEach((cx) => {
    const slot = { x: cx - 1.4, y: SLOT.y0, w: 2.8, d: SLOT.y1 - SLOT.y0, r: 1.4 };
    out.push(`<path class="dp-slot" d="${k.planOutline(slot, TOP, P, 3)}"/>`);
    out.push(L(k.planOutline(slot, TOP, P, 3), { tone: "lo" }));
    // Log scale: a spine with ticks every 2.5, a long one every 10, end dots.
    const edge = cx + 6;
    out.push(L(k.lineOnTop([edge, Y_HIGH], [edge, Y_LOW], TOP, P), { tone: "lo" }));
    const ticks = k.topTicks(Y_HIGH, Y_LOW, 2.5, 4, edge, TOP, [1.4, 2.8], P, "y");
    out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    out.push(D([at([edge, Y_HIGH, TOP]), at([edge, Y_LOW, TOP])], { size: 0.4 }));
  });
  // Strip dividers from the bridge to the armrest.
  for (const x of [CH_X[0] + 14, CH_X[1] + 14, CH_X[2] + 14]) out.push(L(k.lineOnTop([x, FACE_Y], [x, ARM.y + 1], TOP, P), { tone: "faint" }));
  // The selector's dial: four marks, one per memory slot, numbered.
  const [kx, ky] = KNOB;
  const marks = [0, 1, 2, 3].map((s) => {
    const a = slotAngle(s);
    return k.lineOnTop([kx + Math.sin(a) * 7, ky - Math.cos(a) * 7], [kx + Math.sin(a) * 8.8, ky - Math.cos(a) * 8.8], TOP, P);
  }).join("");
  out.push(L(marks, { tone: "mid" }));
  [0, 1, 2, 3].forEach((s) => {
    const a = slotAngle(s);
    out.push(k.faceTextSvg(k.topMatrix([kx + Math.sin(a) * 10.6 - 0.8, ky - Math.cos(a) * 10.6 + 1], TOP, P, "x"), String(s + 1), { size: 2.6, tone: "lo" }));
  });
  // Master label plate.
  const plate = { x: -16, y: 23, w: 30, d: 12, r: 1.2 };
  out.push(S(slab(plate, TOP, TOP + 0.6, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.4), TOP + 0.6, P, 4), { tone: "faint" }));
  out.push(L([[-12, 27, 18], [-12, 29.5, 12], [-12, 32, 15]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], TOP + 0.6, P)).join(""), { tone: "lo", free: true }));
  return out.join("");
}

// A display window on the bridge's front face, in that face's own coordinates.
function windowOn(x0, w, part, text) {
  const M = k.sideMatrix([x0, FACE_Y], 31, P, "left");
  return `<g transform="${M}">
    <clipPath id="dp-win-${part}"><path d="${rrect(0, 0, w, 7, 1.2)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, w, 7, 1.2)}"/>
    <g clip-path="url(#dp-win-${part})"><path class="dp-wall" d="M0 0H${w}V0.9H0.9V7H0Z"/>
    <text class="iso-face-text dp-digits" data-part="${part}" data-tone="hi" x="${w - 1.6}" y="5.5" font-size="${part === "quote" ? 4.6 : 4.2}" text-anchor="end">${text}</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, w, 7, 1.2)}"/>
  </g>`;
}

function bridge() {
  const out = [];
  out.push(S(slab(BRIDGE, TOP, BRIDGE_TOP, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(BRIDGE, BRIDGE_TOP - 3, P, 4), { tone: "faint" }) }));
  // Vents and screws on the bridge's top.
  for (let i = 0; i < 10; i++) out.push(L(k.planOutline({ x: -96 + i * 10.6, y: -45, w: 7, d: 2.2, r: 1.1 }, BRIDGE_TOP, P, 3), { tone: "lo" }));
  out.push(D([[-99, -39], [13, -39], [-99, -45], [13, -45]].map(([x, y]) => at([x, y, BRIDGE_TOP])), { size: 0.45 }));
  // One window per fader with its engraved name, and the sample-order window.
  CH_X.forEach((cx, i) => {
    out.push(windowOn(cx - 12, 26, `ch-${i}`, groupVND(values0[i])));
    out.push(k.faceTextSvg(k.sideMatrix([cx - 12, FACE_Y], 21.4, P, "left"), FIELDS[i].label, { size: 2.2, tone: "lo" }));
  });
  out.push(windowOn(-14, 28, "quote", groupVND(fee(config0))));
  out.push(k.faceTextSvg(k.sideMatrix([-14, FACE_Y], 21.4, P, "left"), "ĐƠN MẪU", { size: 2.2, tone: "lo" }));
  out.push(D([[-101, 19.4], [15, 19.4], [-101, 32], [15, 32]].map(([x, z]) => at([x, FACE_Y, z])), { size: 0.4 }));
  return out.join("");
}

// A fader cap, built at its start position and moved along y by the page.
function cap(i) {
  const cx = CH_X[i];
  const yc = faderY(faders0[i]);
  const plan = { x: cx - 5, y: yc - 4, w: 10, d: 8, r: 1.2 };
  const z1 = TOP + CAP_H;
  const grip = [yc - 2, yc + 2].map((y) => k.lineOnTop([cx - 5, y], [cx + 5, y], z1, P)).join("");
  const body = S(slab(plan, TOP, z1, 3, 0.5), { tone: "hi", crease: "lo", inner: "" });
  return `<g data-part="cap">${body}${L(grip, { tone: "faint" })}${L(k.lineOnTop([cx - 5, yc], [cx + 5, yc], z1, P), { tone: "hi" })}</g>`;
}

function knob() {
  const [kx, ky] = KNOB;
  const out = [];
  out.push(S(k.cylinder(kx, ky, 7, TOP, 0.8, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(kx, ky, 5, TOP + 0.8, 5.6, P, 36), { tone: "mid" }));
  out.push(L(k.knurl(kx, ky, 5, TOP + 0.8, TOP + 6.4, 32, P), { tone: "lo" }));
  out.push(L(k.ring(kx, ky, 1.2, TOP + 6.4, P, 16), { tone: "mid" }));
  out.push(`<path class="iso-line" data-tone="hi" data-part="pointer" d="${pointer(at0.knob)}"/>`);
  return out.join("");
}
const pointer = (s) => {
  const a = slotAngle(s);
  const [kx, ky] = KNOB;
  return k.lineOnTop([kx + Math.sin(a) * 1.2, ky - Math.cos(a) * 1.2], [kx + Math.sin(a) * 5, ky - Math.cos(a) * 5], TOP + 6.4, P);
};

function lamp() {
  const [x, y] = LAMP;
  return S(k.cylinder(x, y, 3, TOP, 1, P, 28), { tone: "lo" })
    + `<g data-part="warn">${S(k.cylinder(x, y, 2.1, TOP + 1, 2.4, P, 24, 0.3), { tone: "mid", crease: "lo", lit: lit0 === "warn" })}</g>`;
}

// A push button: a bezel and a cap that dips into it. The clip keeps only what is
// above the bezel's top, so the dipped cap disappears into it.
function button(name, [x, y], symbol) {
  const z0 = TOP + 1;
  const clip = screenHull([...circle(x, y, 4.05, z0), ...circle(x, y, 4.05, z0 + 12)].map(at));
  const capSvg = S(k.cylinder(x, y, 4, z0 - 2, 5.4, P, 32, 0.4), { tone: "mid" }) + symbol(x, y, z0 + 3.4);
  return S(k.cylinder(x, y, 5.2, TOP, 1, P, 36), { tone: "lo" })
    + `<clipPath id="dp-${name}-clip"><path d="${clip}"/></clipPath><g clip-path="url(#dp-${name}-clip)"><g data-part="${name}">${capSvg}</g></g>`;
}
const recordMark = (x, y, z) => L(k.ring(x, y, 1.9, z, P, 24), { tone: "mid" }) + D([at([x, y, z])], { size: 0.7 });
const backMark = (x, y, z) => L(k.onTop([[x + 1.4, y - 1.6], [x + 1.4, y + 1.6], [x - 1.6, y]], z, P, true), { tone: "mid" });

function armrest() {
  const out = [S(slab(ARM, TOP, TOP + ARM_H, 6, 1.2), { tone: "mid" })];
  out.push(L(k.lineOnTop([ARM.x + 4, ARM.y + ARM.d / 2], [ARM.x + ARM.w - 4, ARM.y + ARM.d / 2], TOP + ARM_H, P), { tone: "faint" }));
  out.push(D([at([ARM.x + 4, ARM.y + ARM.d / 2, TOP + ARM_H]), at([ARM.x + ARM.w - 4, ARM.y + ARM.d / 2, TOP + ARM_H])], { size: 0.45 }));
  return out.join("");
}

// The bus from the console to the memory bank: the only way into the cartridges.
function bus() {
  const plan = { x: CON.x + CON.w, y: -8, w: BANK.x - CON.x - CON.w, d: 16, r: 1 };
  const ribs = [-4, 0, 4].map((y) => k.lineOnTop([plan.x, y], [plan.x + plan.w, y], 11, P)).join("");
  return S(slab(plan, 5, 11, 3, 0.3), { tone: "mid", inner: L(ribs, { tone: "faint" }) })
    + D([at([plan.x + 2, -6, 11]), at([plan.x + 2, 6, 11]), at([plan.x + plan.w - 2, -6, 11]), at([plan.x + plan.w - 2, 6, 11])], { size: 0.4 });
}

function bank() {
  const out = [];
  out.push(S(slab(BANK_PLINTH, 0, 2, 5, 0.4), { tone: "lo" }));
  out.push(S(slab(BANK, 2, B_TOP, 5, 1), { tone: "mid", inner: L(k.sideSeam(BANK, 6, P, 5), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BANK, 2.6), B_TOP, P, 5), { tone: "faint" }));
  out.push(D(k.corners(BANK, 4.6).map(([x, y]) => at([x, y, B_TOP])), { size: 0.45 }));
  SLOT_Y.forEach((ys, i) => {
    const open = opening(ys);
    out.push(`<path class="dp-dark" d="${k.planOutline(open, B_TOP, P, 3)}"/>`);
    // The two far walls of the slot, seen through its mouth, give it depth.
    const x0 = open.x, x1 = open.x + open.w, y0 = open.y, y1 = open.y + open.d, deep = B_TOP - 7;
    const walls = [
      [[x0, y0, B_TOP], [x1, y0, B_TOP], [x1, y0, deep], [x0, y0, deep]],
      [[x0, y0, B_TOP], [x0, y1, B_TOP], [x0, y1, deep], [x0, y0, deep]],
    ].map((quad) => `M${quad.map((pt) => at(pt).map((v) => v.toFixed(2)).join(" ")).join("L")}Z`).join("");
    out.push(`<clipPath id="dp-mouth-${i}"><path d="${k.planOutline(open, B_TOP, P, 3)}"/></clipPath><path class="dp-inner" clip-path="url(#dp-mouth-${i})" d="${walls}"/>`);
    out.push(L(k.planOutline(open, B_TOP, P, 3), { tone: "lo" }));
    out.push(k.faceTextSvg(k.topMatrix([31, ys + 5.8], B_TOP, P, "x"), String(i + 1), { size: 3, tone: "mid" }));
    out.push(L(k.ring(66, ys, 1.8, B_TOP, P, 18), { tone: "lo" }));
    const on = i === 0 ? at0.card0 > 0.5 : i === 1 ? at0.card1 > 0.5 : false;
    out.push(`<path class="dp-led" data-part="led-${i}"${on ? " data-on" : ""} d="${k.ring(66, ys, 1.1, B_TOP, P, 14)}"/>`);
  });
  // Front face vents and the right face's name plate.
  const F = k.sideMatrix([BANK.x + 6, BANK.y + BANK.d], 15, P, "left");
  out.push(`<g transform="${F}"><path class="iso-line" data-tone="lo" d="${Array.from({ length: 6 }, (_, i) => rrect(i * 5, 0, 2, 8, 1)).join("")}"/></g>`);
  const R = k.sideMatrix([BANK.x + BANK.w, 30], 16, P, "right");
  const lines = [[3, 2.6, 22], [3, 4.8, 15], [3, 7, 19]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  out.push(`<g transform="${R}"><path class="dp-plate" d="${rrect(0, 0, 34, 10, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 34, 10, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`);
  out.push(D([at([BANK.x + BANK.w, 28, 11]), at([BANK.x + BANK.w, -2, 11])], { size: 0.4 }));
  return out.join("");
}

// A sealed cartridge: a version tag on its face and a seal on its top, nothing
// else. Built standing at full height and moved down into its slot by the page.
function cartridge(i, version) {
  const ys = SLOT_Y[i];
  const plan = cartPlan(ys);
  const z1 = B_TOP + RISE;
  const open = opening(ys);
  const clip = screenHull([...k.corners(open), ...k.corners(open)].map(([x, y], j) => at([x, y, j < 4 ? B_TOP : B_TOP + 40])));
  const rise = i === 0 ? at0.card0 : at0.card1;
  const read = i === 0 ? at0.read0 : at0.read1;
  const offset = -(1 - rise) * (RISE + 1) - read * 1.5;
  const lit = lit0 === `card${i}`;
  const face = k.faceTextSvg(k.sideMatrix([plan.x + 3, plan.y + plan.d], z1 - 4.4, P, "left"), version, { size: 4.6, tone: "mid" });
  const seal = L(k.ring(plan.x + 15.5, ys, 2.4, z1, P, 24), { tone: "lo" }) + D([at([plan.x + 15.5, ys, z1])], { size: 0.8 });
  const groove = L(k.lineOnTop([plan.x, ys + 2.6], [plan.x + 9, ys + 2.6], z1, P) + k.lineOnTop([plan.x + 9, ys + 2.6], [plan.x + 9, plan.y + plan.d], z1, P), { tone: "faint" });
  return `<clipPath id="dp-open-${i}"><path d="${clip}"/></clipPath><g clip-path="url(#dp-open-${i})"><g data-part="card-${i}" transform="${tz(offset)}"${rise < 0.02 ? ' display="none"' : ""}>${S(slab(plan, z1 - CART_H, z1, 3, 0.5), { tone: "mid", crease: "lo", lit })}${face}${seal}${groove}</g></g>`;
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một bàn điều khiển có ba cần gạt chạy bằng motor, mỗi cần ứng với một trường của cấu hình phí giao hàng, và một ngăn nhớ có bốn ô đánh số đặt bên phải. Khi bấm nút lưu, một hộp niêm phong ghi phiên bản nhô lên trong ô được chọn. Ngăn nhớ chỉ giữ hộp chứ không đọc được bên trong. Khi bấm nút khôi phục, bàn điều khiển đọc hộp được chọn và tự kéo các cần gạt về đúng vị trí đã lưu.",
  body: [
    base(),
    consoleBody(),
    flatTop(),
    bridge(),
    ...[0, 1, 2].map((i) => `<g data-part="fader">${cap(i)}</g>`),
    ...[["lamp", LAMP, lamp], ["knob", KNOB, knob], ["store", STORE], ["recall", RECALL]]
      .sort((a, b) => k.depthOf([a[1][0], a[1][1], TOP], P) - k.depthOf([b[1][0], b[1][1], TOP], P))
      .map(([name, , draw]) => (draw ? draw() : button(name, name === "store" ? STORE : RECALL, name === "store" ? recordMark : backMark))),
    armrest(),
    bus(),
    bank(),
    cartridge(0, "v1"),
    cartridge(1, "v2"),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const TIMELINE = readFileSync(join(HERE, "timeline.mjs"), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");

const rest = STEPS.map((step) => {
  const amount = groupVND(fee(step.config)) + " ₫";
  if (step.action === "save") return `${step.version} lưu ở ô ${step.slot + 1} · đơn mẫu ${amount}`;
  if (step.action === "bulk") return `chưa lưu · đơn mẫu ${amount}`;
  return `khôi phục ${step.version} · đơn mẫu ${amount}`;
});
const spoken = STEPS.map((step) => {
  const amount = groupVND(fee(step.config)) + " đồng";
  if (step.action === "save") return `Lưu ${step.version} vào ô ${step.slot + 1}, đơn mẫu tính ra ${amount}`;
  if (step.action === "bulk") return `Sửa hàng loạt nhân mọi trường lên 10 lần, đơn mẫu tốn ${amount}`;
  return `Khôi phục ${step.version} từ ô ${step.slot + 1}, đơn mẫu trở lại ${amount}`;
});

export const live = `
${MODEL}
${TIMELINE}
const P = ${JSON.stringify(P)};
const START = ${START}, N = STEPS.length, Y_LOW = ${Y_LOW}, Y_HIGH = ${Y_HIGH}, RISE = ${RISE};
const KNOB = ${JSON.stringify(KNOB)}, KNOB_TOP = ${TOP + 6.4};
const REST_TEXT = ${JSON.stringify(rest)};
const SPOKEN = ${JSON.stringify(spoken)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector('[data-part="' + name + '"]');
const caps = [...svg.querySelectorAll('[data-part="cap"]')];
const capY0 = ${JSON.stringify(faders0.map(faderY))};
const channels = [0, 1, 2].map((i) => q("ch-" + i));
const parts = { quote: q("quote"), pointer: q("pointer"), store: q("store"), recall: q("recall"), cards: [q("card-0"), q("card-1")], leds: [q("led-0"), q("led-1")] };
const solids = { warn: q("warn").querySelector(".iso-solid"), card0: q("card-0").querySelector(".iso-solid"), card1: q("card-1").querySelector(".iso-solid") };
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let sel = START, t = REST[START], aim = sel, speed = 1, dwell = 0;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0;
const DWELL = 3.4;
const shown = {};
const put = (el, attr, key, value) => { if (shown[key] !== value) { shown[key] = value; el.setAttribute(attr, value); } };
const text = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.textContent = value; } };
const lit = (el, on) => {
  el.toggleAttribute("data-lit", on);
  el.querySelector(".iso-edge")?.setAttribute("data-tone", on ? "lit" : "mid");
};
const slotAngle = (s) => ((120 + 40 * s) * Math.PI) / 180;
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", SPOKEN[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function draw() {
  const p = pose(t);
  const faders = [p.fader0, p.fader1, p.fader2];
  const values = FIELDS.map((field, i) => valueAt(field, faders[i]));
  caps.forEach((el, i) => put(el, "transform", "cap" + i, translateAlong(P, [0, Y_LOW + (Y_HIGH - Y_LOW) * faders[i] - capY0[i], 0])));
  channels.forEach((el, i) => text(el, "ch" + i, groupVND(values[i])));
  text(parts.quote, "quote", groupVND(fee({ base: values[0], perKm: values[1], freeFrom: values[2] })));
  const a = slotAngle(p.knob);
  put(parts.pointer, "d", "ptr", lineOnTop([KNOB[0] + Math.sin(a) * 1.2, KNOB[1] - Math.cos(a) * 1.2], [KNOB[0] + Math.sin(a) * 5, KNOB[1] - Math.cos(a) * 5], KNOB_TOP, P));
  put(parts.store, "transform", "st", translateAlong(P, [0, 0, -1.6 * p.store]));
  put(parts.recall, "transform", "rc", translateAlong(P, [0, 0, -1.6 * p.recall]));
  [p.card0, p.card1].forEach((rise, i) => {
    const read = i === 0 ? p.read0 : p.read1;
    put(parts.cards[i], "transform", "cd" + i, translateAlong(P, [0, 0, -(1 - rise) * (RISE + 1) - read * 1.5]));
    // An empty slot shows nothing: the cartridge only exists once it starts to rise.
    put(parts.cards[i], "display", "cv" + i, rise < 0.02 ? "none" : "inline");
    const on = rise > 0.5;
    if (shown["led" + i] !== on) { shown["led" + i] = on; parts.leds[i].toggleAttribute("data-on", on); }
  });
  const now = litAt(t);
  if (shown.lit !== now) {
    shown.lit = now;
    for (const name in solids) lit(solids[name], name === now);
  }
  const resting = REST.findIndex((r) => Math.abs(r - t) < 0.001);
  const label = resting >= 0 ? REST_TEXT[resting] : t > REST[aim] ? "đang tua lại" : phase(t);
  if (readout.textContent !== label) readout.textContent = label;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const target = REST[sel];
  if (sel !== aim) {
    aim = sel;
    // Play forward in real time, faster when skipping a step, and rewind quickly.
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

const money = (n) => `${groupVND(n)} ₫`;
const [s1, s2, s3, s4, s5] = STEPS;
const steps = [
  { label: s1.label, short: s1.short, caption: `Admin đặt phí gốc ${money(s1.config.base)}, ${money(s1.config.perKm)} mỗi km và miễn phí cho đơn từ ${money(s1.config.freeFrom)}, rồi bấm Lưu. Lệnh <code>save()</code> niêm phong bản chụp v1 vào ô 1, và đơn mẫu tính ra <strong>${money(fee(s1.config))}</strong>.` },
  { label: s2.label, short: s2.short, caption: `Admin nâng phí gốc lên ${money(s2.config.base)}, hạ phí mỗi km còn ${money(s2.config.perKm)}, đẩy ngưỡng miễn phí lên ${money(s2.config.freeFrom)} rồi lưu thành v2 ở ô 2. Đơn mẫu giờ tốn <strong>${money(fee(s2.config))}</strong>.` },
  { label: s3.label, short: s3.short, caption: `Một lệnh sửa hàng loạt định tăng giá 10% nhưng lại nhân mọi trường lên 10 lần. Ba cần gạt vọt lên, đèn cảnh báo sáng, và đơn mẫu bỗng tốn <strong>${money(fee(s3.config))}</strong>.` },
  { label: s4.label, short: s4.short, caption: `Admin chọn ô 2 rồi bấm Khôi phục. Chỉ bàn điều khiển mới mở được bản chụp v2 qua <code>restore()</code>, nên các cần gạt tự trượt về chỗ cũ và đơn mẫu trở lại <strong>${money(fee(s4.config))}</strong>.` },
  { label: s5.label, short: s5.short, caption: `History vẫn giữ nguyên bản v1, nên admin có thể quay xa hơn nữa. Các cần gạt trượt về cấu hình đầu tiên và đơn mẫu lại là <strong>${money(fee(s5.config))}</strong>.` },
];

export const plate = withSteps(k.plateHtml({
  fig: "Fig 21",
  title: "Memento",
  hint: "Rê chuột để chọn bước",
  readout: rest[START],
  keys: [
    { mark: "lit", label: "Hộp nhớ vừa được ghi hoặc đang được đọc lại, hay đèn cảnh báo khi cấu hình bị sửa sai" },
    { mark: "raised", label: "Mỗi hộp niêm phong là một bản chụp, còn ngăn nhớ chỉ giữ hộp mà không đọc được bên trong" },
  ],
  caption:
    "Ba cần gạt có motor là trạng thái của cấu hình phí giao hàng, và chỉ bàn điều khiển biết cách ghi chúng vào hộp nhớ hay đọc chúng ra. Mỗi lần bấm Lưu, một hộp niêm phong mới nhô lên ở ngăn nhớ bên phải, nơi giữ các hộp mà không mở được hộp nào. Khi bấm Khôi phục, bàn điều khiển đọc hộp được chọn và tự kéo các cần gạt về đúng vị trí cũ.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Memento, dùng phím mũi tên để chọn bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Lưu, sửa sai và khôi phục cấu hình", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-slot{fill:#8c8c90;fill-opacity:.55}
.dp-dark{fill:#bdbdba}
.dp-inner{fill:#d8d8d5}
.dp-led{fill:var(--anatomy-card);stroke:none}
.dp-led[data-on]{fill:var(--anatomy-strong)}
.dp-digits{letter-spacing:.03em}
.iso-stage{touch-action:pan-y;overflow:hidden}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:118%;margin:-4% -9% -2%}}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript, SAMPLE };
