// The Facade figure: an order console. Outside there is one cabinet with one
// big button, the facade's only method. Pressing it lets the cabinet draw a
// program bar in through its port; five lugs on the bar, set one after the
// other, lift the followers of five subsystem modules in a fixed order (stock,
// payment, shipping, invoice, notification). Each module's flag rises and its
// window shows what its call returned (model.mjs). Every module keeps its own
// service knob: the subsystems stay usable on their own.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { BAR, barBodySvg } from "./bar.mjs";
import { ORDER, PROGRAM, STEP_STROKE, SUBSYSTEMS, TOTAL, groupVND, lift, lugStart } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 380;

const BASE = { x: -166, y: -52, w: 294, d: 82, r: 8 };
const BASE_H = 12;
const FOOT_H = 5;

// The facade cabinet, with the port the program bar runs through on its +x face.
const HOUSE = { x: -154, y: -44, w: BAR.face + 154, d: 62, r: 4 };
const HOUSE_Z = [2, 52];
const BUTTON = [-134, -10];
const CAP_Z = [56, 60.4];
const PRESS = 2.2;

// Subsystem modules stand behind the bar, one over each follower station.
const STATIONS = PROGRAM.stations;
const MOD_Z = [2, 40];
const FACE_Y = -12;
const FLAG_Y = -26;
const RISE = PROGRAM.rise;
const FLAG_GAIN = 2; // a 1:2 lever inside each module lifts the flag twice as far as the follower
const GUIDES = [-50, 12, 70];
const POINTER_X = -60;
// The follower: its arm sits ARM_Z above the floor at rest, its block rides the slot in the module face.
const ARM_Z = BAR.z1 + 10;
const BLOCK_Z = [ARM_Z - 3, ARM_Z + 5];

const P = k.fitProjection(
  [
    ...k.boxCorners(BASE, -BASE_H - FOOT_H, 0),
    ...k.boxCorners(HOUSE, 0, CAP_Z[1]),
    ...k.boxCorners({ x: STATIONS[0] - 15, y: -40, w: STATIONS[4] - STATIONS[0] + 30, d: 28 }, 0, MOD_Z[1] + 4 + RISE * FLAG_GAIN),
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 60 },
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
// Closed slots on a face, in that face's coordinates.
const slots = (list) => list.map(([x, y, w, h]) => rrect(x, y, w, h, Math.min(w, h) / 2)).join("");

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 24))) {
    out.push(S(k.cylinder(x, y, 7, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Stroke scale under the bar's pointer: a major tick where each call has run.
  const ruler = { x: POINTER_X - 36, y: 12.5, w: 40, d: 6, r: 1 };
  out.push(S(k.slabOf(ruler, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const minor = [];
  const major = [];
  for (let s = 0; s <= PROGRAM.stroke; s += 2) {
    const x = POINTER_X - s;
    const big = STEP_STROKE.includes(s);
    (big ? major : minor).push(k.lineOnTop([x, ruler.y], [x, ruler.y + (big ? 3.6 : 2)], 0.6, P));
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  out.push(D([at([ruler.x + 1.6, ruler.y + 4.6, 0.6]), at([ruler.x + ruler.w - 1.6, ruler.y + 4.6, 0.6])], { size: 0.45 }));
  // A small index plate in front of each station but the first (the scale is there).
  for (const x of STATIONS.slice(1)) {
    const tag = { x: x - 4, y: 13, w: 8, d: 5, r: 1 };
    out.push(S(k.slabOf(tag, 0, 0.5, P, 3), { tone: "lo", crease: "none" }));
    out.push(L(k.lineOnTop([x, tag.y], [x, tag.y + 2.6], 0.5, P), { tone: "mid" }));
    out.push(D([at([x - 2.6, tag.y + 3.4, 0.5]), at([x + 2.6, tag.y + 3.4, 0.5])], { size: 0.35 }));
  }
  // The client's order slip in a tray in front of the cabinet.
  const tray = { x: -150, y: 20.5, w: 30, d: 7.5, r: 1.2 };
  out.push(S(k.slabOf(tray, 0, 1.6, P, 3, 0.3), { tone: "mid" }));
  const slip = { x: -147, y: 21.5, w: 22, d: 5.5, r: 0.4 };
  out.push(S(k.slabOf(slip, 1.6, 0.3, P, 2), { tone: "hi", crease: "none", inner: L([22.8, 24.6].map((y) => k.lineOnTop([-145, y], [y === 22.8 ? -133 : -137, y], 1.9, P)).join(""), { tone: "lo", free: true }) }));
  // Label plate.
  const label = { x: 76, y: 13, w: 40, d: 12, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[82, 16.4, 20], [82, 19, 14], [82, 21.6, 18]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 6, 0.8]), at([label.x + label.w - 2.6, label.y + 6, 0.8])], { size: 0.4 }));
  return out.join("");
}

// The bar runs in three open guides: sole and back cheek behind it, front cheek in front.
function guideBack(x) {
  return S(k.slabOf({ x: x - 4, y: -2.6, w: 8, d: 13.2, r: 1 }, 0, BAR.z0, P, 3, 0.4), { tone: "mid" })
    + S(k.slabOf({ x: x - 4, y: -2.6, w: 8, d: 2.3, r: 0.6 }, BAR.z0, BAR.z1 + 0.4 - BAR.z0, P, 3, 0.3), { tone: "mid" })
    + D([at([x - 2.4, -1.45, BAR.z1 + 0.4]), at([x + 2.4, -1.45, BAR.z1 + 0.4])], { size: 0.4 });
}

function guideFront(x) {
  return S(k.slabOf({ x: x - 4, y: BAR.d + 0.3, w: 8, d: 2.3, r: 0.6 }, BAR.z0, BAR.z1 + 0.4 - BAR.z0, P, 3, 0.3), { tone: "mid" })
    + D([at([x - 2.4, BAR.d + 1.45, BAR.z1 + 0.4]), at([x + 2.4, BAR.d + 1.45, BAR.z1 + 0.4])], { size: 0.4 });
}

function housing() {
  const out = [];
  const top = HOUSE_Z[1];
  out.push(S(k.slabOf(k.insetPlan(HOUSE, -2), 0, HOUSE_Z[0], P, 4, 0.5), { tone: "mid" }));
  const seam = k.sideSeam(HOUSE, top - 6, P, 6);
  out.push(S(k.slabOf(HOUSE, HOUSE_Z[0], top - HOUSE_Z[0], P, 6, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(D(k.corners(HOUSE, 3.2).map(([x, y]) => at([x, y, top])), { size: 0.45 }));
  // Lid: a service key on the left, a lamp on the right, the button's bezel in the middle.
  const [kx, ky] = [-146, -36];
  out.push(S(k.cylinder(kx, ky, 3.4, top, 0.8, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(kx, ky, 2.6, top + 0.8, 1.6, P, 28), { tone: "mid", inner: L(k.lineOnTop([kx - 1.6, ky], [kx + 1.6, ky], top + 2.4, P), { tone: "lo" }) }));
  const [lx, ly] = [-122, -36];
  out.push(S(k.cylinder(lx, ly, 3, top, 1, P, 28), { tone: "lo" }));
  out.push(S(G.solidOf([[0, 2.2], [1.2, 2.2], [2.2, 1.6], [2.8, 0.6]], G.frameAlong([lx, ly, top + 1], [0, 0, 1]), P), { tone: "mid" }));
  const [bx, by] = BUTTON;
  out.push(S(k.cylinder(bx, by, 11, top, 1.4, P, 48, 0.4), { tone: "lo" }));
  out.push(L(k.ring(bx, by, 9.4, top + 1.4, P, 48), { tone: "faint" }));
  out.push(S(k.cylinder(bx, by, 3, top + 1.4, CAP_Z[0] - top - 1.4, P, 24), { tone: "mid" }));
  out.push(order(), port());
  return out.join("");
}

// The order window and nameplate on the cabinet's +y face, in that face's own coordinates.
const WIN = { x: -150, z: 47, w: 32, h: 11 };
function order() {
  const face = HOUSE.y + HOUSE.d;
  const M = k.sideMatrix([WIN.x, face], WIN.z, P, "left");
  const boxes = SUBSYSTEMS.map((_, i) => `<path class="fc-box" data-part="progress" d="${rrect(1.8 + i * 4.6, 7, 3.4, 2.4, 0.5)}"/>`).join("");
  const win = `<g transform="${M}">
    <clipPath id="fc-win"><path d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/></clipPath>
    <path class="fc-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/>
    <g clip-path="url(#fc-win)"><path class="fc-wall" d="M0 0H${WIN.w}V1.1H1.1V${WIN.h}H0Z"/>
    <text class="iso-face-text fc-digits" data-part="order" data-tone="hi" x="1.8" y="5.4" font-size="4.4">${ORDER.id}</text>${boxes}</g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/>
  </g>`;
  const N = k.sideMatrix([WIN.x + 2, face], 33, P, "left");
  const lines = [[3, 3.2, 17], [3, 5.4, 12], [3, 7.6, 15]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  const plate = `<g transform="${N}"><path class="fc-plate" d="${rrect(0, 0, 24, 11, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 24, 11, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`;
  const V = k.sideMatrix([WIN.x, face], 16, P, "left");
  const vents = `<g transform="${V}"><path class="iso-line" data-tone="lo" d="${slots([0, 2.4, 4.8].map((y) => [2, y, 26, 1.2]))}"/></g>`;
  const screws = D([[HOUSE.x + 3, 6], [HOUSE.x + HOUSE.w - 3, 6], [HOUSE.x + 3, 42], [HOUSE.x + HOUSE.w - 3, 42]].map(([x, z]) => at([x, face, z])), { size: 0.45 });
  return win + plate + vents + screws;
}

// The port on the +x face where the program bar enters the cabinet.
function port() {
  const face = BAR.face;
  const [y1, z1] = [BAR.y + BAR.d + 1.4, BAR.z1 + 1.2];
  const M = k.sideMatrix([face, y1], z1, P, "right");
  const w = BAR.d + 2.8;
  const h = BAR.z1 - BAR.z0 + 2.2;
  const out = [`<g transform="${M}"><path class="fc-hole" d="${rrect(0, 0, w, h, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(-1.6, -1.6, w + 3.2, h + 3.2, 1.8)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, w, h, 1)}"/></g>`];
  // A service door below the vents, and vents and screws on the same face.
  const Dr = k.sideMatrix([face, -8], 32, P, "right");
  out.push(`<g transform="${Dr}"><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 28, 18, 1.6)}"/><path class="iso-line" data-tone="lo" d="${slots([[11, 7.4, 6, 3.2]])}"/></g>`);
  out.push(D([[-10, 30], [-34, 30], [-10, 16], [-34, 16]].map(([y, z]) => at([face, y, z])), { size: 0.4 }));
  const V = k.sideMatrix([face, -6], 44, P, "right");
  out.push(`<g transform="${V}"><path class="iso-line" data-tone="lo" d="${slots([0, 3, 6].map((y) => [3, y, 26, 1.4]))}"/></g>`);
  out.push(D([[-41, 6], [15, 6], [-41, 44], [15, 44]].map(([y, z]) => at([face, y, z])), { size: 0.45 }));
  out.push(D([[y1 + 0.8, z1 + 0.8], [y1 - w - 0.8, z1 + 0.8]].map(([y, z]) => at([face, y, z])), { size: 0.4 }));
  return out.join("");
}

function buttonCap() {
  const [bx, by] = BUTTON;
  const cap = S(k.cylinder(bx, by, 8, CAP_Z[0], CAP_Z[1] - CAP_Z[0], P, 48, 0.9), { tone: "hi", crease: "lo" });
  return `<g data-part="cap"><g data-part="cap-body">${cap}</g>${L(k.ring(bx, by, 5.2, CAP_Z[1], P, 40), { tone: "faint" })}</g>`;
}

const plan = (x) => ({ x: x - 15, y: -40, w: 30, d: 28, r: 2.5 });

function moduleBody(i) {
  const x = STATIONS[i];
  const body = plan(x);
  const top = MOD_Z[1];
  const out = [];
  out.push(S(k.slabOf(k.insetPlan(body, -1.5), 0, MOD_Z[0], P, 4, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf(body, MOD_Z[0], top - MOD_Z[0], P, 4, 0.9), { tone: "mid" }));
  // Lid: screws, two vents, the flag's slot and the service knob.
  out.push(D(k.corners(body, 2.6).map(([px, py]) => at([px, py, top])), { size: 0.42 }));
  out.push(L([-19, -16].map((y) => k.planOutline({ x: x - 12, y: y - 0.7, w: 14, d: 1.4, r: 0.7 }, top, P, 3)).join(""), { tone: "lo" }));
  out.push(`<path class="fc-hole" d="${k.planOutline({ x: x - 4.4, y: FLAG_Y - 1.3, w: 13.2, d: 2.6, r: 1 }, top, P, 3)}"/>`);
  out.push(L(k.planOutline({ x: x - 4.4, y: FLAG_Y - 1.3, w: 13.2, d: 2.6, r: 1 }, top, P, 3), { tone: "lo" }));
  const [nx, ny] = [x + 9.5, -35];
  out.push(S(k.cylinder(nx, ny, 3.2, top, 0.7, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(nx, ny, 2.5, top + 0.7, 3, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(nx, ny, 2.5, top + 0.7, top + 3.7, 22, P), { tone: "lo" }));
  out.push(L(k.ring(nx, ny, 0.9, top + 3.7, P, 14), { tone: "mid" }));
  out.push(moduleFace(i), servicePort(i));
  return out.join("");
}

// The +y face: the result window, the follower's slot, louvers and screws.
function moduleFace(i) {
  const x = STATIONS[i];
  const sub = SUBSYSTEMS[i];
  const M = k.sideMatrix([x - 12, FACE_Y], 38, P, "left");
  const win = `<g transform="${M}">
    <clipPath id="fc-mw-${i}"><path d="${rrect(0, 0, 24, 6, 1)}"/></clipPath>
    <path class="fc-screen" d="${rrect(0, 0, 24, 6, 1)}"/>
    <g clip-path="url(#fc-mw-${i})"><path class="fc-wall" d="M0 0H24V0.9H0.9V6H0Z"/>
    <text class="iso-face-text fc-digits" data-part="mod-display" data-tone="lo" x="12" y="4.5" font-size="4" text-anchor="middle">${sub.idle}</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, 24, 6, 1)}"/>
  </g>`;
  // The slot spans the follower block's travel; louvers to its right.
  const slotTop = BLOCK_Z[1] + RISE + 1;
  const slotH = slotTop - BLOCK_Z[0] + 1.5;
  const F = k.sideMatrix([x - 1.4, FACE_Y], slotTop, P, "left");
  const slot = `<g transform="${F}"><path class="fc-hole" d="${rrect(0, 0, 2.8, slotH, 1.4)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 2.8, slotH, 1.4)}"/></g>`;
  const R = k.sideMatrix([x + 5, FACE_Y], 28, P, "left");
  const louvers = `<g transform="${R}"><path class="iso-line" data-tone="lo" d="${slots([0, 3, 6, 9].map((y) => [0, y, 7.5, 1.1]))}"/></g>`;
  const Lf = k.sideMatrix([x + 4.6, FACE_Y], 14, P, "left");
  const plate = `<g transform="${Lf}"><path class="fc-plate" d="${rrect(0, 0, 8.4, 7, 0.8)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 8.4, 7, 0.8)}"/><path class="iso-line" data-tone="lo" data-free="" d="M1.6 2.4H6.6M1.6 4.6H5.2"/></g>`;
  const screws = D([[x - 12.4, 5], [x + 12.4, 5]].map(([px, z]) => at([px, FACE_Y, z])), { size: 0.42 });
  return win + slot + louvers + plate + screws;
}

// A capped service port on the +x face: the subsystem can still be reached directly.
function servicePort(i) {
  const fx = STATIONS[i] + 15;
  const F = G.frameAlong([fx, -26, 20], X);
  return S(G.disc(0, 0.8, 3.4, F, P), { tone: "lo" })
    + S(G.disc(0.8, 1.8, 2.4, F, P), { tone: "mid" })
    + L(G.circleOf(F, 1.8, 1, P, 16), { tone: "lo" })
    + D([at([fx, -26 + 5.2, 20 + 5.2]), at([fx, -26 - 5.2, 20 - 5.2])], { size: 0.4 });
}

// The flag rises out of the lid's slot; the clip hides whatever is still inside.
function flag(i) {
  const x = STATIONS[i];
  const top = MOD_Z[1];
  const clip = [[x - 24, top], [x + 24, top], [x + 24, top + 60], [x - 24, top + 60]].map(([px, z]) => at([px, FLAG_Y + 0.5, z]));
  // At rest the whole flag sits below the lid; raised, its post shows above the slot.
  const rest = top - 3;
  const post = S(k.slabOf({ x: x - 3.4, y: FLAG_Y - 0.4, w: 1.2, d: 0.8, r: 0.2 }, rest - 16, 16, P, 2), { tone: "mid" });
  const plate = S(k.slabOf({ x: x - 2.2, y: FLAG_Y - 0.5, w: 10, d: 1, r: 0.3 }, rest - 6, 6, P, 2), { tone: "hi", crease: "lo" });
  const mark = L(k.sideRing([x + 2.8, FLAG_Y + 0.5, rest - 3], 1.1, "y", P, 16), { tone: "lo" });
  return `<clipPath id="fc-flag-${i}"><path d="${k.pathOf(clip, true)}"/></clipPath>
    <g clip-path="url(#fc-flag-${i})"><g data-part="flag">${post}<g data-part="flag-plate">${plate}</g>${mark}</g></g>`;
}

// The follower: block in the module's slot, arm, rod, fork and roller.
function follower(i) {
  const x = STATIONS[i];
  const rz = BAR.z1 + PROGRAM.roller;
  const out = [];
  out.push(S(k.slabOf({ x: x - 3.2, y: FACE_Y, w: 6.4, d: 4, r: 0.8 }, BLOCK_Z[0], BLOCK_Z[1] - BLOCK_Z[0], P, 3, 0.4), { tone: "hi", crease: "lo" }));
  out.push(D([at([x - 2, FACE_Y + 4, BLOCK_Z[1] - 1.6]), at([x + 2, FACE_Y + 4, BLOCK_Z[0] + 1.6])], { size: 0.4 }));
  out.push(S(k.slabOf({ x: x - 2, y: 1.6, w: 4, d: 1, r: 0.3 }, rz, 3.2, P, 2), { tone: "hi", crease: "lo" }));
  out.push(S(G.disc(0, 2.4, PROGRAM.roller, G.frameAlong([x, 2.8, rz], Y), P), { tone: "hi", crease: "lo" }));
  out.push(L(G.circleOf(G.frameAlong([x, 2.8, rz], Y), 2.4, 1.2, P, 16), { tone: "lo" }));
  out.push(S(k.slabOf({ x: x - 2, y: 5.4, w: 4, d: 1, r: 0.3 }, rz, 3.2, P, 2), { tone: "hi", crease: "lo" }));
  out.push(D([at([x, 6.4, rz])], { size: 0.5 }));
  out.push(S(k.slabOf({ x: x - 2, y: 1.6, w: 4, d: 4.8, r: 0.4 }, rz + 3.2, 1.2, P, 2), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(x, 4, 1.1, rz + 4.4, ARM_Z - rz - 4.4, P, 16), { tone: "hi", crease: "lo" }));
  out.push(S(k.slabOf({ x: x - 1.6, y: FACE_Y + 4, w: 3.2, d: 9.6 + 4, r: 0.6 }, ARM_Z, 2.6, P, 3, 0.3), { tone: "hi", crease: "lo" }));
  return `<g data-part="follower">${out.join("")}</g>`;
}

// The bar's rest stop: a block with a rubber pad that the bar's end comes back against.
function endStop() {
  const x = BAR.end + 1.6;
  const out = [];
  out.push(S(k.slabOf({ x, y: BAR.y - 2, w: 6, d: BAR.d + 4, r: 1 }, 0, BAR.z1 + 2, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([x + 3, BAR.y - 0.2, BAR.z1 + 2]), at([x + 3, BAR.y + BAR.d + 0.2, BAR.z1 + 2])], { size: 0.42 }));
  return out.join("");
}

function endPad() {
  const x = BAR.end + 1.6;
  return S(k.slabOf({ x: x - 1.6, y: BAR.y + 1.2, w: 1.6, d: BAR.d - 2.4, r: 0.5 }, BAR.z0 + 0.6, BAR.z1 - BAR.z0 - 1.2, P, 2), { tone: "lo" });
}

// The lugs ride on the bar; each is a ramp and a long flat, set one station later than the last.
function lugs() {
  const F = G.frameAlong([0, BAR.y + 0.8, 0], Y);
  const { ramp, end, chamfer, rise } = PROGRAM;
  const z = BAR.z1;
  const out = [];
  STATIONS.forEach((x, i) => {
    const a = x + lugStart(i);
    const polygon = [[a, z], [a + ramp, z + rise], [x + end, z + rise], [x + end + chamfer, z]].map(([px, pz]) => [-px, pz]);
    out.push(S(G.prismOf(F, polygon, 0, BAR.d - 1.6, P), { tone: "hi", crease: "lo" }));
    out.push(D([at([x + end - 2.4, BAR.y + 2.6, z + rise]), at([x + end - 2.4, BAR.y + BAR.d - 2.6, z + rise])], { size: 0.4 }));
  });
  // The pointer that reads the stroke scale.
  out.push(S(k.slabOf({ x: POINTER_X - 1, y: BAR.d, w: 2, d: 6.6, r: 0.4 }, BAR.z0, 0.8, P, 2), { tone: "mid" }));
  out.push(L(k.lineOnTop([POINTER_X, BAR.d], [POINTER_X, BAR.d + 6.6], BAR.z0 + 0.8, P), { tone: "hi" }));
  return out.join("");
}

const START = 3;
const s0 = STEP_STROKE[START];
const lift0 = STATIONS.map((_, i) => lift(i, s0));

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một bàn máy đặt hàng. Bên trái là tủ facade với đúng một nút bấm lớn và cửa sổ hiện mã đơn. Một thanh chương trình chạy ra từ cổng của tủ, dưới năm khối hệ con xếp hàng: kho, thanh toán, vận chuyển, hoá đơn, thông báo. Khi nhấn nút, tủ kéo thanh vào; năm vấu trên thanh lần lượt nâng cần của từng khối, cờ của khối bật lên và cửa sổ của nó hiện kết quả. Mỗi khối vẫn có núm và cổng bảo trì riêng.",
  body: [
    base(),
    ...GUIDES.map(guideBack),
    housing(),
    `<g data-part="cap-move" transform="${k.translateAlong(P, [0, 0, -PRESS])}">${buttonCap()}</g>`,
    ...STATIONS.map((_, i) => `<g data-part="module">${moduleBody(i)}${flag(i).replace('<g data-part="flag">', `<g data-part="flag" transform="${k.translateAlong(P, [0, 0, lift0[i] * FLAG_GAIN])}">`)}</g>`),
    `<g data-part="bar-body">${barBodySvg(k, P, s0)}</g>`,
    `<g data-part="bar" transform="${k.translateAlong(P, [-s0, 0, 0])}">${lugs()}</g>`,
    ...STATIONS.map((_, i) => follower(i).replace('<g data-part="follower">', `<g data-part="follower" transform="${k.translateAlong(P, [0, 0, lift0[i]])}">`)),
    ...GUIDES.map(guideFront),
    endPad(),
    endStop(),
  ],
});

// Screen x of each step's place, for picking a step by pointer: the cabinet, then the modules.
const PICK = [k.iso([-134, -13, 30], P)[0], ...STATIONS.map((x) => k.iso([x, -20, 24], P)[0])];

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const BAR_SRC = readFileSync(join(HERE, "bar.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
${BAR_SRC}
const KIT = { segment, slabOf, solidSvg, lineSvg };
const P = ${JSON.stringify(P)};
const WIDTH = ${WIDTH}, START = ${START}, PRESS = ${PRESS}, GAIN = ${FLAG_GAIN}, PICK = ${JSON.stringify(PICK)};
const STEPS = STEP_STROKE.length;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const barBody = svg.querySelector('[data-part="bar-body"]');
const bar = svg.querySelector('[data-part="bar"]');
const cap = svg.querySelector('[data-part="cap-move"]');
const capBody = svg.querySelector('[data-part="cap-body"] > .iso-solid');
const followers = [...svg.querySelectorAll('[data-part="follower"]')];
const flags = [...svg.querySelectorAll('[data-part="flag"]')];
const plates = flags.map((el) => el.querySelector('[data-part="flag-plate"] > .iso-solid'));
const displays = [...svg.querySelectorAll('[data-part="mod-display"]')];
const boxes = [...svg.querySelectorAll('[data-part="progress"]')];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let step = START, s = STEP_STROKE[START], press = 1;
let frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0, drawn = "";
const TOUR = 3.8;
const follow = (value, target, dt, tau, cap, calm) => {
  if (calm) return target;
  let next = value + (target - value) * (1 - Math.exp(-dt / tau));
  if (cap) next = value + Math.max(-cap * dt, Math.min(cap * dt, next - value));
  return Math.abs(target - next) < 0.02 ? target : next;
};
const light = (solid, on) => {
  solid.toggleAttribute("data-lit", on);
  solid.querySelector(".iso-edge").setAttribute("data-tone", on ? "lit" : "hi");
};
function describe() {
  stage.setAttribute("aria-valuenow", String(step + 1));
  stage.setAttribute("aria-valuetext", step === 0
    ? "Gọi place_order cho đơn " + ORDER.id
    : SUBSYSTEMS[step - 1].name + ": " + SUBSYSTEMS[step - 1].readout);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: step, touring } }));
const tourFrom = (index) => ((index - START + STEPS) % STEPS) * TOUR;
function draw() {
  const target = STEP_STROKE[step];
  const key = s.toFixed(2);
  if (key !== drawn) {
    drawn = key;
    barBody.innerHTML = barBodySvg(KIT, P, s);
    bar.setAttribute("transform", translateAlong(P, [-s, 0, 0]));
  }
  const lifts = PROGRAM.stations.map((_, i) => lift(i, s));
  followers.forEach((el, i) => el.setAttribute("transform", translateAlong(P, [0, 0, lifts[i]])));
  flags.forEach((el, i) => el.setAttribute("transform", translateAlong(P, [0, 0, lifts[i] * GAIN])));
  cap.setAttribute("transform", translateAlong(P, [0, 0, -PRESS * press]));
  const ran = PROGRAM.stations.map((_, i) => done(i, s));
  displays.forEach((el, i) => {
    const text = ran[i] ? SUBSYSTEMS[i].shown : SUBSYSTEMS[i].idle;
    if (el.textContent !== text) el.textContent = text;
    el.setAttribute("data-tone", ran[i] ? "hi" : "lo");
  });
  boxes.forEach((el, i) => el.toggleAttribute("data-on", ran[i]));
  const settled = s === target && press === 1;
  light(capBody, settled && step === 0);
  plates.forEach((solid, i) => light(solid, settled && step === i + 1));
  // While the bar runs forward, name the call whose follower is climbing, else the next one due.
  const climbing = lifts.findIndex((h) => h > 0.05 && h < PROGRAM.rise - 0.05);
  const due = climbing >= 0 ? climbing : Math.min(ran.filter(Boolean).length, Math.max(0, step - 1));
  const text = settled
    ? step === 0 ? "place_order(" + ORDER.id + ") · " + groupVND(TOTAL) + " ₫" : SUBSYSTEMS[step - 1].name + " · " + SUBSYSTEMS[step - 1].readout
    : s > target ? "thanh đang lùi về" : "đang gọi " + SUBSYSTEMS[due].name.toLowerCase();
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    const next = (Math.floor(clock / TOUR) + START) % STEPS;
    if (next !== step) { step = next; describe(); }
  }
  const target = STEP_STROKE[step];
  // The button stays down while the program runs; it springs up while the bar goes back.
  press = follow(press, s > target + 0.3 ? 0 : 1, dt, 0.06, 0, calm);
  if (press > 0.98 || s > target) s = follow(s, target, dt, 0.22, 18, calm);
  draw();
  const settled = !touring && s === target && press === 1;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; clock = tourFrom(step); emit(); run(); }, 3600);
  if (index !== step) { step = index; describe(); } else emit();
  run();
};
const pick = (event) => {
  const box = svg.getBoundingClientRect();
  const x = ((event.clientX - box.left) / box.width) * WIDTH;
  let best = 0;
  PICK.forEach((px, i) => { if (Math.abs(px - x) < Math.abs(PICK[best] - x)) best = i; });
  return best;
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = true; clock = tourFrom(step); emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để chọn bước";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse") choose(pick(event), false); });
stage.addEventListener("pointerdown", (event) => choose(pick(event), event.pointerType !== "mouse"));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = Math.min(STEPS - 1, step + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = Math.max(0, step - 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = STEPS - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

const steps = [
  {
    label: "Đặt hàng",
    short: "1",
    caption: `Client chỉ gọi một hàm: <code>checkout.place_order(cart)</code> cho đơn ${ORDER.id}, ${ORDER.qty} × ${ORDER.item}, tổng <strong>${groupVND(TOTAL)} ₫</strong>. Nút được nhấn; phần còn lại nằm trong facade.`,
  },
  ...SUBSYSTEMS.map((sub, i) => ({
    label: sub.name,
    short: String(i + 2),
    caption: `Facade gọi <code>${sub.call}</code>: ${sub.result}.${i === SUBSYSTEMS.length - 1 ? ` Xong năm việc, facade trả kết quả cho client trong cùng một lần gọi.` : ""}`,
  })),
];

const first = SUBSYSTEMS[START - 1];
export const plate = withSteps(k.plateHtml({
  fig: "Fig 9",
  title: "Facade",
  hint: "Rê chuột lên từng khối",
  readout: `${first.name} · ${first.readout}`,
  keys: [
    { mark: "lit", label: "Nút của facade, rồi cờ của hệ con vừa được gọi" },
    { mark: "raised", label: "Thanh chương trình và cần: thứ tự gọi nằm trong facade" },
  ],
  caption:
    "Bên ngoài chỉ có một nút: client gọi place_order và không biết gì thêm. Bên trong, tủ facade kéo thanh chương trình vào; năm vấu trên thanh, mỗi vấu lệch một nhịp, lần lượt nâng cần của kho, thanh toán, vận chuyển, hoá đơn và thông báo, nên thứ tự gọi luôn đúng cho mọi client. Mỗi khối vẫn có núm và cổng bảo trì riêng: cần thì vẫn gọi thẳng được hệ con.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Facade: phím mũi tên để đi qua từng bước của lệnh đặt hàng" aria-valuemin="1" aria-valuemax="${STEP_STROKE.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước: một lệnh đặt hàng đi qua facade", steps, start: START }));

export const FIGURE_CSS = `
.fc-screen{fill:var(--anatomy-shade-1)}
.fc-wall{fill:var(--anatomy-shade-0)}
.fc-plate{fill:var(--anatomy-top)}
.fc-hole{fill:var(--anatomy-shade-0)}
.fc-digits{letter-spacing:.04em}
.fc-box{fill:none;stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight)}
.fc-box[data-on]{fill:var(--anatomy-hi);stroke:var(--anatomy-hi)}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
