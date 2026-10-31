// The Iterator figure: a slide reader fed from a magazine. Each tray is one page
// of orders, each slide in it one order. The trays wait in the magazine on the
// left (the API); the reader pulls one out only when the tray in hand is used up.
// Every pull of the lever is one next() call: the sprocket turns a quarter and
// moves the tray on by one slot, so the next slide lies under the reading head
// and its order shows on the screen behind. A used-up tray slides off into the
// bin, and the counters on the right count pages fetched and orders read. The
// loop at the lever never sees trays, slots or cursors. The motion is one
// timeline (timeline.mjs); the numbers come from model.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { FIRST, LIMIT, ORDERS, PAGES, SIZE, STEPS, after, groupVND } from "./model.mjs";
import { BINX, BIN_Z, CH_Z, GX, MAGX, PITCH, REST, TRAY_T, pose } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 380;
const AZIMUTH = 56;

const PLATE = { x: -156, y: -54, w: 264, d: 82, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// The magazine (the API): trays stacked on a base block, pushed out at the bottom.
const MAG_BASE = { x: -132, y: -17, w: 64, d: 34, r: 2 };
const MAG_TOP = CH_Z + 3 * TRAY_T + 3;
const ACT = { x0: -151, x1: -135, z: CH_Z + 1.5, r: 3.2 };

// The channel the trays run on, the reading head over the gate, the sprocket and lever in front.
const RAIL = { x0: -73, x1: 34 };
// The sprocket sits under the tray's front strip, three pins round, one pin per slot.
const PINS = 3;
const SPROCKET = { y0: 5.4, y1: 7.4, r: (PINS * PITCH) / (2 * Math.PI), hub: 3.4 };
const SHAFT = [GX, CH_Z - SPROCKET.r - 0.3];
const STEP_DEG = 360 / PINS;
const LENS = { x: GX, y: -9.6, r: 2.2, z0: CH_Z + TRAY_T + 1.4, z1: 23 };
const POST = { x: GX - 4, y: 13, w: 12, d: 4, r: 1 };
const RATCHET = { y0: 18.6, y1: 20.6, r: 4.6, teeth: 9 };
const LEVER = { y0: 21.2, y1: 24.2, length: 14, rest: 80, sweep: -90 };

// Behind: the screen box (what the reader shows) and the counter box.
const SCREEN = { x: -52, y: -48, w: 46, d: 22, r: 3 };
const SCREEN_TOP = 46;
const COUNT = { x: 40, y: -48, w: 54, d: 22, r: 3 };
const COUNT_TOP = 30;

// The bin for used trays.
const BIN = { x0: 34, x1: 94, y0: -14, y1: 14, top: CH_Z - 0.6 };

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners(SCREEN, 0, SCREEN_TOP + 2),
    ...k.boxCorners({ x: 80, y: -40, w: 12, d: 6 }, 0, COUNT_TOP + 16),
    ...k.boxCorners({ x: -40, y: 20, w: 30, d: 10 }, 0, 24),
  ],
  WIDTH,
  HEIGHT,
  { pad: 16, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const X = [1, 0, 0];
const Y = [0, 1, 0];
const slab = (plan, z0, z1, steps = 3, bevel = 0) => k.slabOf(plan, z0, z1 - z0, P, steps, bevel);
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const poly = (points) => `M${points.map((p) => at(p).map((v) => v.toFixed(2)).join(" ")).join("L")}Z`;
function screenHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return `M${[...lower.slice(0, -1), ...upper.slice(0, -1)].map((p) => p.map((v) => v.toFixed(2)).join(" ")).join("L")}Z`;
}
const boxHull = (x0, x1, y0, y1, z0, z1) => screenHull([x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z) => at([x, y, z])))));
// A point in the x-z plane around the shaft, for a frame along y (whose u is -x and v is +z).
const uv = (wx, wz) => [-wx, wz];

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
  // Label plate at the front left, and a conduit from the lamp to the screen box.
  const label = { x: -132, y: 16, w: 40, d: 8, r: 1.4 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-127, 18.2, 22], [-127, 20, 15], [-127, 21.8, 19]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 4, 0.8]), at([label.x + label.w - 2.4, label.y + 4, 0.8])], { size: 0.4 }));
  const conduit = { x: GX + 5, y: -26, w: 3.4, d: 18.5, r: 0.8 };
  out.push(S(slab(conduit, 0, 1.8, 2, 0.3), { tone: "mid" }));
  out.push(D([at([GX + 6.7, -21, 1.8]), at([GX + 6.7, -12, 1.8])], { size: 0.35 }));
  return out.join("");
}

// ---- Back row: the screen box and the counter box ------------------------------------

const WIN = { x: SCREEN.x + 5, z: 43, w: 36, h: 14 };
function screenBox() {
  const out = [];
  const seam = k.sideSeam(SCREEN, 6, P, 4);
  out.push(S(k.slabOf(SCREEN, 0, SCREEN_TOP, P, 4, 1.4), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: SCREEN.x + 8, y: SCREEN.y + 5 + i * 3.6, w: 28, d: 1.8, r: 0.9 }, SCREEN_TOP, P, 3), { tone: "lo" }));
  out.push(D(k.corners(SCREEN, 3.2).map(([x, y]) => at([x, y, SCREEN_TOP])), { size: 0.45 }));
  // The screen on the front face: the code of the order under the head, and its amount.
  const face = SCREEN.y + SCREEN.d;
  const M = k.sideMatrix([WIN.x, face], WIN.z, P, "left");
  out.push(`<g transform="${M}">
    <clipPath id="dp-screen"><path d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/>
    <g clip-path="url(#dp-screen)"><path class="dp-wall" d="M0 0H${WIN.w}V1.1H1.1V${WIN.h}H0Z"/>
    <text class="iso-face-text dp-readout-code" data-part="screen-code" data-tone="hi" x="${WIN.w / 2}" y="7.4" font-size="6" text-anchor="middle">DH-000</text>
    <text class="iso-face-text dp-amount" data-part="screen-amount" data-tone="mid" x="${WIN.w / 2}" y="11.8" font-size="3" text-anchor="middle"></text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/>
  </g>`);
  // Name plate under the screen, held by two screws.
  const N = k.sideMatrix([SCREEN.x + 5, face], 22, P, "left");
  const lines = [[2.6, 3, 13], [2.6, 5.2, 9], [2.6, 7.4, 11]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  out.push(`<g transform="${N}"><path class="dp-plate" d="${rrect(0, 0, 18, 10, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 18, 10, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`);
  out.push(D([at([SCREEN.x + 7, face, 17]), at([SCREEN.x + 21, face, 17])], { size: 0.4 }));
  // Focus knob on the right face.
  const F = G.frameAlong([SCREEN.x + SCREEN.w, -37, 20], X);
  out.push(S(G.solidOf([[0, 3.6], [1.0, 3.6], [1.4, 3.0]], F, P), { tone: "lo" }));
  out.push(S(G.solidOf([[1.4, 2.6], [5.0, 2.6], [5.6, 2.0]], F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 1.8, 4.8, 2.6, 18, P, { fade: [0.1, 0.5] }), { tone: "lo" }) }));
  return out.join("");
}

const DIGIT = { w: 8, h: 9 };
function wheel(id, x, digits, value) {
  const stack = digits.map((d, i) => `<text class="iso-face-text dp-digit" data-tone="hi" x="${DIGIT.w / 2}" y="${7 + i * DIGIT.h}" font-size="7" text-anchor="middle">${d}</text>`).join("");
  return `<clipPath id="dp-${id}"><path d="${rrect(x, 0, DIGIT.w, DIGIT.h, 1)}"/></clipPath>
    <path class="dp-screen" d="${rrect(x, 0, DIGIT.w, DIGIT.h, 1)}"/>
    <g clip-path="url(#dp-${id})"><path class="dp-wall" d="M${x} 0H${x + DIGIT.w}V0.9H${x + 0.9}V${DIGIT.h}H${x}Z"/><g transform="translate(${x} 0)"><g data-part="${id}" transform="translate(0 ${(-DIGIT.h * value).toFixed(2)})">${stack}</g></g></g>
    <path class="iso-line" data-tone="lo" d="${rrect(x, 0, DIGIT.w, DIGIT.h, 1)}"/>`;
}

function counterBox(state) {
  const out = [];
  out.push(S(k.slabOf(COUNT, 0, COUNT_TOP, P, 4, 1.4), { tone: "mid", inner: L(k.sideSeam(COUNT, 6, P, 4), { tone: "faint" }) }));
  out.push(D(k.corners(COUNT, 3.2).map(([x, y]) => at([x, y, COUNT_TOP])), { size: 0.45 }));
  const face = COUNT.y + COUNT.d;
  const M = k.sideMatrix([COUNT.x + 6, face], 25, P, "left");
  const ones = state.items < 10 ? state.items : state.items - 10;
  out.push(`<g transform="${M}">
    ${wheel("pages", 0, ["0", "1", "2", "3"], state.pages)}
    ${wheel("tens", 18, ["0", "1"], Math.max(0, Math.min(1, state.items - 9)))}
    ${wheel("ones", 26, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], ones)}
  </g>`);
  out.push(k.faceTextSvg(k.sideMatrix([COUNT.x + 6, face], 13.4, P, "left"), "TRANG", { size: 2.4, tone: "lo" }));
  out.push(k.faceTextSvg(k.sideMatrix([COUNT.x + 24, face], 13.4, P, "left"), "ĐƠN", { size: 2.4, tone: "lo" }));
  // A small rating plate on the right part of the face.
  const N = k.sideMatrix([COUNT.x + 40, face], 25, P, "left");
  out.push(`<g transform="${N}"><path class="dp-plate" d="${rrect(0, 0, 10, 8, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 10, 8, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="M2 3H8M2 5.2H6.4"/></g>`);
  out.push(D([at([COUNT.x + 6, face, 6]), at([COUNT.x + COUNT.w - 6, face, 6])], { size: 0.4 }));
  return out.join("");
}

// The "HẾT" flag (StopIteration) rising out of a housing on the counter box's lid.
const FLAG_HOUSING = { x: 78, y: -40, w: 14, d: 6, r: 1 };
const FLAG_TOP = COUNT_TOP + 4;
const FLAG = { x: 80, w: 10, h: 9, rise: 9 };
function flagHousing() {
  const out = [];
  out.push(S(slab(FLAG_HOUSING, COUNT_TOP, FLAG_TOP, 3, 0.4), { tone: "mid" }));
  out.push(L(k.planOutline({ x: FLAG.x - 0.6, y: -37.9, w: FLAG.w + 1.2, d: 1.8, r: 0.6 }, FLAG_TOP, P, 2), { tone: "lo" }));
  out.push(D([at([FLAG_HOUSING.x + 1.4, -37, FLAG_TOP]), at([FLAG_HOUSING.x + FLAG_HOUSING.w - 1.4, -37, FLAG_TOP])], { size: 0.4 }));
  return out.join("");
}
function flag(done) {
  const z0 = FLAG_TOP - FLAG.h - 0.6;
  const plan = { x: FLAG.x, y: -37.5, w: FLAG.w, d: 1, r: 0.3 };
  const M = k.sideMatrix([FLAG.x, -36.5], z0 + FLAG.h, P, "left");
  const text = `<g transform="${M}"><path class="iso-line" data-tone="lo" d="${rrect(0.9, 0.9, FLAG.w - 1.8, FLAG.h - 1.8, 0.5)}"/><text class="iso-face-text" data-tone="hi" x="${FLAG.w / 2}" y="6.1" font-size="3.6" text-anchor="middle">HẾT</text></g>`;
  const clip = poly([[-300, -36.5, FLAG_TOP], [300, -36.5, FLAG_TOP], [300, -36.5, 400], [-300, -36.5, 400]]);
  return `<clipPath id="dp-flag-clip"><path d="${clip}"/></clipPath><g clip-path="url(#dp-flag-clip)"><g data-part="flag" transform="${k.translateAlong(P, [0, 0, done * FLAG.rise])}"><g data-part="flag-plate">${S(slab(plan, z0, z0 + FLAG.h, 2), { tone: "hi", crease: "lo", lit: done > 0.5, inner: text })}</g></g></g>`;
}

// ---- The magazine (API) ----------------------------------------------------------------

function magazineBack() {
  const out = [];
  // The actuator that pushes the bottom tray out, on its bracket.
  out.push(S(slab({ x: ACT.x0 + 1, y: -4.5, w: ACT.x1 - ACT.x0 - 2, d: 9, r: 1 }, 0, ACT.z - ACT.r, 3, 0.4), { tone: "mid" }));
  const F = G.frameAlong([ACT.x0, 0, ACT.z], X);
  out.push(S(G.solidOf([[0, ACT.r - 0.6], [0.8, ACT.r], [ACT.x1 - ACT.x0 - 0.8, ACT.r], [ACT.x1 - ACT.x0, ACT.r - 0.8]], F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 2, 6, ACT.r, 14, P, { fade: [0.1, 0.5], seams: true }), { tone: "lo" }) }));
  out.push(D([at([ACT.x0 + 3, -4.5, ACT.z - ACT.r]), at([ACT.x1 - 3, -4.5, ACT.z - ACT.r])], { size: 0.4 }));
  // Base block the stack stands on, the back wall and the left wall with the pusher's slot.
  out.push(S(k.slabOf(MAG_BASE, 0, CH_Z, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(MAG_BASE, 4, P, 4), { tone: "faint" }) }));
  out.push(S(slab({ x: -130, y: -15, w: 60, d: 3, r: 0.8 }, CH_Z, MAG_TOP, 3), { tone: "mid" }));
  out.push(S(slab({ x: -130, y: -12, w: 3, d: 2.6, r: 0.4 }, CH_Z, MAG_TOP, 2), { tone: "mid" }));
  out.push(S(slab({ x: -130, y: 9.4, w: 3, d: 2.6, r: 0.4 }, CH_Z, MAG_TOP, 2), { tone: "mid" }));
  out.push(S(slab({ x: -130, y: -9.4, w: 3, d: 18.8, r: 0.4 }, CH_Z + 3.4, MAG_TOP, 2), { tone: "mid" }));
  // Rail stubs in the bottom slot, under the stack.
  for (const y of [-10.5, 8]) out.push(S(slab({ x: -127, y, w: 54, d: 2.5, r: 0.5 }, CH_Z - 0.6, CH_Z, 2), { tone: "lo", crease: "none" }));
  return out.join("");
}

// The pusher: a plate on a rod that slides out of the actuator. The rod is clipped to
// the space right of the actuator's end, so its retracted part stays inside.
function pusher(push) {
  const rod = S(G.solidOf([[0, 0.9], [ACT.x1 - ACT.x0 + 9, 0.9]], G.frameAlong([ACT.x0 + 1, 0, ACT.z], X), P), { tone: "mid" });
  const plate = S(slab({ x: -127.4, y: -8, w: 1.4, d: 16, r: 0.4 }, CH_Z + 0.4, CH_Z + 2.6, 2), { tone: "mid" });
  const clip = boxHull(ACT.x1, 0, -1.2, 1.2, ACT.z - 1.2, ACT.z + 1.2);
  return `<clipPath id="dp-rod"><path d="${clip}"/></clipPath><g data-part="pusher" transform="${k.translateAlong(P, [push, 0, 0])}"><g clip-path="url(#dp-rod)">${rod}</g>${plate}</g>`;
}

function magazineFront() {
  const out = [];
  out.push(S(slab({ x: -130, y: 12, w: 4, d: 3, r: 0.6 }, CH_Z, MAG_TOP, 2), { tone: "mid" }));
  out.push(S(slab({ x: -74, y: 12, w: 4, d: 3, r: 0.6 }, CH_Z + 3.6, MAG_TOP, 2), { tone: "mid" }));
  out.push(S(slab({ x: -74, y: -12, w: 3, d: 24, r: 0.6 }, CH_Z + 3.6, CH_Z + 6, 2), { tone: "mid" }));
  out.push(D([at([-128, 13.5, CH_Z + 6]), at([-128, 13.5, MAG_TOP - 3]), at([-72, 13.5, CH_Z + 8]), at([-72, 13.5, MAG_TOP - 3])], { size: 0.35 }));
  // The lid is a frame, so the stack shows from above: back bar with the API plate, front bar, two ends.
  const bars = [{ x: -132, y: -17, w: 64, d: 9 }, { x: -132, y: 12, w: 64, d: 5 }, { x: -132, y: -8, w: 5, d: 20 }, { x: -73, y: -8, w: 5, d: 20 }];
  for (const bar of bars) out.push(S(k.slabOf({ ...bar, r: 1 }, MAG_TOP, 1.6, P, 3, 0.4), { tone: "mid" }));
  out.push(D([[-129.5, -14.5], [-70.5, -14.5], [-129.5, 14.5], [-70.5, 14.5]].map(([x, y]) => at([x, y, MAG_TOP + 1.6])), { size: 0.45 }));
  out.push(k.faceTextSvg(k.topMatrix([-122, -10.6], MAG_TOP + 1.6, P), "API", { size: 4.4, tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([-106, -10.6], MAG_TOP + 1.6, P), "3 TRANG · 10 ĐƠN", { size: 2, tone: "lo" }));
  return out.join("");
}

// ---- The channel, lamp, bin ------------------------------------------------------------

function channel() {
  const out = [];
  for (const x of [-60, -4, 24]) {
    out.push(S(slab({ x: x - 2, y: -11, w: 4, d: 22, r: 0.8 }, 0, CH_Z - 2.5, 3, 0.3), { tone: "mid" }));
  }
  for (const y of [-10.5, 8]) {
    out.push(S(slab({ x: RAIL.x0, y, w: RAIL.x1 - RAIL.x0, d: 2.5, r: 0.6 }, CH_Z - 2.5, CH_Z, 3, 0.3), { tone: "mid" }));
  }
  out.push(D([-60, -4, 24].flatMap((x) => [at([x, -9.25, CH_Z]), at([x, 9.25, CH_Z])]), { size: 0.4 }));
  // The lamp under the gate, its glass window and the gate mark on the front rail.
  out.push(S(slab({ x: GX - 8, y: -7.6, w: 16, d: 12, r: 1.2 }, 0, CH_Z - 3, 3, 0.5), { tone: "mid" }));
  out.push(`<path class="dp-glow" data-part="glow" data-on="" d="${poly([[GX - 5.6, -6, CH_Z - 3], [GX + 5.6, -6, CH_Z - 3], [GX + 5.6, 2.8, CH_Z - 3], [GX - 5.6, 2.8, CH_Z - 3]])}"/>`);
  out.push(L(k.planOutline({ x: GX - 5.6, y: -6, w: 11.2, d: 8.8, r: 0.6 }, CH_Z - 3, P, 2), { tone: "lo" }));
  out.push(D([at([GX - 6.8, -6.6, CH_Z - 3]), at([GX + 6.8, 3.4, CH_Z - 3])], { size: 0.35 }));
  out.push(L(k.lineOnTop([GX, 8.2], [GX, 10.3], CH_Z, P), { tone: "hi" }));
  return out.join("");
}

function binBack() {
  const out = [];
  out.push(S(slab({ x: BIN.x0 + 2, y: BIN.y0 + 2, w: BIN.x1 - BIN.x0 - 4, d: BIN.y1 - BIN.y0 - 4, r: 0.6 }, 0, BIN_Z, 2), { tone: "lo", crease: "none" }));
  out.push(S(slab({ x: BIN.x0, y: BIN.y0, w: BIN.x1 - BIN.x0, d: 2, r: 0.6 }, 0, BIN.top, 3), { tone: "mid" }));
  out.push(S(slab({ x: BIN.x0, y: BIN.y0 + 2, w: 2, d: BIN.y1 - BIN.y0 - 4, r: 0.6 }, 0, BIN.top, 2), { tone: "mid" }));
  return out.join("");
}

function binFront() {
  const out = [];
  out.push(S(slab({ x: BIN.x1 - 2, y: BIN.y0 + 2, w: 2, d: BIN.y1 - BIN.y0 - 4, r: 0.6 }, 0, BIN.top, 2), { tone: "mid" }));
  out.push(S(slab({ x: BIN.x0, y: BIN.y1 - 2, w: BIN.x1 - BIN.x0, d: 2, r: 0.6 }, 0, BIN.top, 3), { tone: "mid" }));
  out.push(D([at([BIN.x0 + 4, BIN.y1, 3]), at([BIN.x1 - 4, BIN.y1, 3]), at([BIN.x0 + 4, BIN.y1, BIN.top - 3]), at([BIN.x1 - 4, BIN.y1, BIN.top - 3])], { size: 0.4 }));
  out.push(k.faceTextSvg(k.sideMatrix([BIN.x0 + 20, BIN.y1], 7.6, P, "left"), "ĐÃ ĐỌC", { size: 3, tone: "lo" }));
  return out.join("");
}

// ---- A tray: one page, its slides are its orders -----------------------------------------
// Built with its first slot at x = 0 and its underside at z = 0, then moved by the page.

const TRAY = { x: -3 * PITCH - 8, y: -11, w: 3 * PITCH + 16, d: 22, r: 1.6 };
function tray(i, litSlot) {
  const out = [];
  const holes = Array.from({ length: 4 }, (_, j) => `<path class="dp-hole" d="${poly([[-j * PITCH - 1.1, 6, TRAY_T], [-j * PITCH + 1.1, 6, TRAY_T], [-j * PITCH + 1.1, 8.2, TRAY_T], [-j * PITCH - 1.1, 8.2, TRAY_T]])}"/>`).join("");
  const grip = k.lineOnTop([TRAY.x + 2.4, -6], [TRAY.x + 2.4, 6], TRAY_T, P) + k.lineOnTop([TRAY.x + 4.2, -6], [TRAY.x + 4.2, 6], TRAY_T, P);
  out.push(S(slab(TRAY, 0, TRAY_T, 3, 0.4), { tone: "mid", inner: holes + L(grip, { tone: "lo" }) }));
  // Page number engraved on the leading end face.
  const end = k.sideMatrix([TRAY.x + TRAY.w, 4], TRAY_T, P, "right");
  out.push(`<g transform="${end}"><path class="iso-line" data-tone="lo" d="${rrect(0.6, 0.5, 11, 2, 0.5)}"/><text class="iso-face-text" data-tone="hi" x="6.1" y="2.15" font-size="2" text-anchor="middle">TRANG ${i + 1}</text></g>`);
  PAGES[i].orders.forEach(([code], j) => {
    const plan = { x: -j * PITCH - 4.6, y: -8.4, w: 9.2, d: 12, r: 0.8 };
    const film = L(k.planOutline(k.insetPlan(plan, 1.6), TRAY_T + 0.7, P, 2), { tone: "faint" });
    out.push(`<g data-slide="${j}">${S(slab(plan, TRAY_T, TRAY_T + 0.7, 2), { tone: j === litSlot ? "hi" : "mid", crease: "lo", lit: j === litSlot, inner: film })}</g>`);
    out.push(k.faceTextSvg(k.topMatrix([-j * PITCH, -2.2], TRAY_T + 0.7, P), code, { size: 1.9, tone: "mid", anchor: "middle" }));
  });
  return out.join("");
}

// ---- Reading head, sprocket, ratchet, lever ---------------------------------------------

// The reading lens: a slim tube on an arm from the screen box, over the back edge of the
// slide at the gate, so the slide itself stays in view.
function head() {
  const out = [];
  out.push(S(slab({ x: GX - 3, y: SCREEN.y + SCREEN.d, w: 6, d: LENS.y - SCREEN.y - SCREEN.d + 2.6, r: 0.8 }, LENS.z1 - 3, LENS.z1, 3, 0.3), { tone: "mid" }));
  out.push(D([at([GX, SCREEN.y + SCREEN.d + 2, LENS.z1]), at([GX, LENS.y - 1.2, LENS.z1])], { size: 0.4 }));
  const F = G.frameAlong([LENS.x, LENS.y, LENS.z0], [0, 0, 1]);
  const rings = G.ribsOf(F, 2.2, 4.6, LENS.r + 0.5, 20, P, { fade: [0.1, 0.5] });
  out.push(S(G.solidOf([[0, LENS.r - 0.5], [0.5, LENS.r], [2, LENS.r], [2.2, LENS.r + 0.5], [4.8, LENS.r + 0.5], [5, LENS.r], [LENS.z1 - 3 - LENS.z0, LENS.r]], F, P), { tone: "mid", inner: k.fadedSvg(rings, { tone: "lo" }) }));
  out.push(L(G.circleOf(F, 0, LENS.r - 0.5, P, 20), { tone: "lo" }));
  return out.join("");
}

// The sprocket under the tray's front strip: a hub and three pins, pre-drawn at 6 angles
// over one pin's turn (the pattern repeats every 120°). Each call turns it one pin on.
const SPROCKET_FRAMES = 6;
function sprocket(turn) {
  const out = [];
  const F = G.frameAlong([SHAFT[0], SPROCKET.y0, SHAFT[1]], Y);
  const frames = [];
  for (let f = 0; f < SPROCKET_FRAMES; f++) {
    const base = -(f / SPROCKET_FRAMES) * STEP_DEG;
    const pins = Array.from({ length: PINS }, (_, n) => {
      const a = ((90 + base + n * STEP_DEG) * Math.PI) / 180;
      const dir = [Math.cos(a), 0, Math.sin(a)];
      const root = [SHAFT[0] + dir[0] * SPROCKET.hub, (SPROCKET.y0 + SPROCKET.y1) / 2, SHAFT[1] + dir[2] * SPROCKET.hub];
      return { depth: k.depthOf(root, P), svg: S(G.solidOf([[0, 0.9], [SPROCKET.r - SPROCKET.hub - 0.5, 0.9], [SPROCKET.r - SPROCKET.hub, 0.5]], G.frameAlong(root, dir), P), { tone: "mid" }) };
    }).sort((a, b) => a.depth - b.depth);
    const show = f === Math.round((turn % 1) * SPROCKET_FRAMES) % SPROCKET_FRAMES;
    frames.push(`<g data-frame="${f}"${show ? "" : ' display="none"'}>${pins.map((p) => p.svg).join("")}</g>`);
  }
  out.push(S(G.solidOf([[-1.2, 1.1], [SPROCKET.y1 - SPROCKET.y0 + 1.2, 1.1]], F, P), { tone: "mid" }));
  out.push(S(G.disc(0, SPROCKET.y1 - SPROCKET.y0, SPROCKET.hub, F, P), { tone: "mid", inner: L(G.circleOf(F, SPROCKET.y1 - SPROCKET.y0, 1.4, P, 18), { tone: "lo" }) }));
  out.push(`<g data-part="pins">${frames.join("")}</g>`);
  return out.join("");
}

// The shaft runs forward under the front rail to a bearing post, then the ratchet and the lever.
function shaftAndPost() {
  const out = [];
  const F = G.frameAlong([SHAFT[0], SPROCKET.y1, SHAFT[1]], Y);
  out.push(S(G.solidOf([[0, 1.1], [POST.y - SPROCKET.y1, 1.1]], F, P), { tone: "mid" }));
  out.push(S(slab(POST, 0, SHAFT[1] + 3.4, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(POST, 2.4, P, 3), { tone: "faint" }) }));
  out.push(D([at([POST.x + 1.6, POST.y + POST.d, 1.4]), at([POST.x + POST.w - 1.6, POST.y + POST.d, 1.4])], { size: 0.4 }));
  const B = G.frameAlong([SHAFT[0], POST.y - 0.6, SHAFT[1]], Y);
  out.push(S(G.solidOf([[0, 2.8], [POST.d + 1.2, 2.8]], B, P), { tone: "mid", inner: L(G.circleOf(B, POST.d + 1.2, 1.1, P, 16), { tone: "lo" }) }));
  out.push(k.faceTextSvg(k.sideMatrix([POST.x + POST.w - 5.6, POST.y + POST.d], 6.6, P, "left"), "next()", { size: 1.5, tone: "lo" }));
  const S2 = G.frameAlong([SHAFT[0], POST.y + POST.d + 0.6, SHAFT[1]], Y);
  out.push(S(G.solidOf([[0, 1.1], [LEVER.y0 - POST.y - POST.d - 0.6, 1.1]], S2, P), { tone: "mid" }));
  return out.join("");
}

// The ratchet wheel, pre-drawn at 8 angles over one tooth (40°).
const RATCHET_FRAMES = 8;
function ratchet(turn) {
  const F = G.frameAlong([SHAFT[0], RATCHET.y0, SHAFT[1]], Y);
  const pitch = 360 / RATCHET.teeth;
  const frames = [];
  for (let f = 0; f < RATCHET_FRAMES; f++) {
    const base = -(f / RATCHET_FRAMES) * pitch;
    const outline = [];
    for (let t = 0; t < RATCHET.teeth; t++) {
      const a0 = ((base + t * pitch) * Math.PI) / 180;
      const a1 = ((base + t * pitch + pitch * 0.85) * Math.PI) / 180;
      outline.push(uv(Math.cos(a0) * RATCHET.r, Math.sin(a0) * RATCHET.r));
      for (let s = 0; s <= 4; s++) {
        const a = a0 + ((a1 - a0) * s) / 4;
        const r = RATCHET.r - (1.2 * s) / 4;
        outline.push(uv(Math.cos(a) * r, Math.sin(a) * r));
      }
    }
    const show = f === Math.round((((turn * STEP_DEG) % pitch) / pitch) * RATCHET_FRAMES) % RATCHET_FRAMES;
    frames.push(`<g data-frame="${f}"${show ? "" : ' display="none"'}>${S(G.prismOf(F, outline, 0, RATCHET.y1 - RATCHET.y0, P), { tone: "mid" })}</g>`);
  }
  return `<g data-part="ratchet">${frames.join("")}</g>${L(G.circleOf(F, RATCHET.y1 - RATCHET.y0, 1.6, P, 18), { tone: "lo" })}${pawl()}`;
}

// The pawl: a short arm on a pin from the post, its tip resting on the ratchet's teeth,
// so the lever can swing back without turning the sprocket.
const PAWL_PIN = [POST.x + POST.w - 2.2, SHAFT[1] + 1.6];
function pawl() {
  const tipAngle = (32 * Math.PI) / 180;
  const tip = [SHAFT[0] + Math.cos(tipAngle) * (RATCHET.r - 0.3), SHAFT[1] + Math.sin(tipAngle) * (RATCHET.r - 0.3)];
  const along = [tip[0] - PAWL_PIN[0], tip[1] - PAWL_PIN[1]];
  const len = Math.hypot(along[0], along[1]);
  const n = [(-along[1] / len) * 0.8, (along[0] / len) * 0.8];
  const F = G.frameAlong([0, RATCHET.y0 + 0.2, 0], Y);
  const bar = [[PAWL_PIN[0] + n[0], PAWL_PIN[1] + n[1]], [tip[0] + n[0] * 0.4, tip[1] + n[1] * 0.4], [tip[0], tip[1]], [PAWL_PIN[0] - n[0], PAWL_PIN[1] - n[1]]].map(([x, z]) => uv(x, z));
  const pin = G.frameAlong([PAWL_PIN[0], POST.y + POST.d, PAWL_PIN[1]], Y);
  return S(G.solidOf([[0, 0.8], [RATCHET.y1 - POST.y - POST.d + 0.4, 0.8]], pin, P), { tone: "mid" })
    + S(G.prismOf(F, bar, 0, RATCHET.y1 - RATCHET.y0 - 0.4, P), { tone: "mid" })
    + D([at([PAWL_PIN[0], RATCHET.y1 - 0.2, PAWL_PIN[1]])], { size: 0.45 });
}

// The lever, pre-drawn at 11 angles over its stroke, then the hub it turns on. At rest it
// stands nearly upright; a pull swings it down to the right, which turns the shaft one pin.
const LEVER_FRAMES = 11;
function lever(down) {
  const frames = [];
  const hub = [SHAFT[0], LEVER.y0, SHAFT[1]];
  for (let f = 0; f < LEVER_FRAMES; f++) {
    const a = ((LEVER.rest + (LEVER.sweep * f) / (LEVER_FRAMES - 1)) * Math.PI) / 180;
    const dir = [Math.cos(a), 0, Math.sin(a)];
    const mid = (LEVER.y0 + LEVER.y1) / 2;
    const arm = S(G.solidOf([[2.8, 1.2], [LEVER.length, 1.2]], G.frameAlong([hub[0], mid, hub[2]], dir), P), { tone: "mid" });
    const tip = [hub[0] + dir[0] * LEVER.length, LEVER.y0, hub[2] + dir[2] * LEVER.length];
    const grip = S(G.solidOf([[0, 1.5], [0.9, 2.0], [5.6, 2.0], [6.3, 1.6]], G.frameAlong(tip, Y), P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(G.frameAlong(tip, Y), 1.3, 5.2, 2.0, 10, P, { fade: [0.1, 0.5] }), { tone: "lo" }) });
    const show = f === Math.round(down * (LEVER_FRAMES - 1));
    frames.push(`<g data-frame="${f}"${show ? "" : ' display="none"'}>${arm}${grip}</g>`);
  }
  const F = G.frameAlong(hub, Y);
  const boss = S(G.solidOf([[0, 3.2], [LEVER.y1 - LEVER.y0 - 0.6, 3.2], [LEVER.y1 - LEVER.y0, 2.6]], F, P), { tone: "mid", inner: L(G.circleOf(F, LEVER.y1 - LEVER.y0, 1.1, P, 16), { tone: "lo" }) });
  return `<g data-part="lever">${frames.join("")}</g>${boss}`;
}

// ---- Assembly ---------------------------------------------------------------------------

const START = 1;
const at0 = pose(REST[START]);
const trayMove = (t) => k.translateAlong(P, [t.x, 0, t.z]);
const trayOrder = (trays) => trays.map((t, i) => ({ i, d: k.depthOf([t.x - 18, 0, t.z + 1.5], P) })).sort((a, b) => a.d - b.d).map((e) => e.i);
const traysSvg = trayOrder(at0.trays).map((i) => `<g data-tray="${i}" transform="${trayMove(at0.trays[i])}">${tray(i, at0.lit && at0.lit.tray === i ? at0.lit.slot : -1)}</g>`).join("");

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một máy đọc phim đặt trên tấm đế dài. Bên trái là hộp API chứa ba khay xếp chồng, mỗi khay là một trang đơn hàng và mỗi tấm phim trong khay là một đơn. Ở giữa là đường ray chạy qua đầu đọc, phía trước có cần gạt nối với bánh răng. Mỗi lần kéo cần, khay tiến một ô và đơn kế tiếp hiện lên màn hình phía sau. Khay nào đọc hết thì trượt xuống thùng bên phải, lúc đó hộp API mới đẩy khay sau ra. Hộp đếm bên phải ghi số trang đã tải và số đơn đã đọc.",
  body: [
    base(),
    magazineBack(),
    screenBox(),
    counterBox(at0),
    flagHousing(),
    flag(at0.done),
    channel(),
    sprocket(at0.turn),
    binBack(),
    pusher(at0.push),
    `<g data-part="trays">${traysSvg}</g>`,
    head(),
    shaftAndPost(),
    ratchet(at0.turn),
    lever(at0.lever),
    magazineFront(),
    binFront(),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const TIMELINE = readFileSync(join(HERE, "timeline.mjs"), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");

const WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười", "mười một"];
const ordinal = (n) => (n === 1 ? "đầu tiên" : n === 4 ? "thứ tư" : "thứ " + WORDS[n]);
const restText = STEPS.map((step) => {
  const s = after(step.calls);
  if (s.done) return `next() → StopIteration · ${s.pages} trang · ${s.given} đơn`;
  if (step.run === 1) return `break ở ${s.current.code} · ${s.pages} trang · ${s.given} đơn`;
  return `next() → ${s.current.code} · ${s.pages} trang · ${s.given} đơn`;
});
const spoken = STEPS.map((step) => {
  const s = after(step.calls);
  if (s.done) return `Lần gọi next() thứ ${WORDS[step.calls]} không còn đơn nào, vòng lặp dừng sau ${WORDS[s.given]} đơn và ${WORDS[s.pages]} trang`;
  if (step.run === 1) return `Vòng lặp thứ hai dừng ở ${s.current.code}, mới tải ${WORDS[s.pages]} trang`;
  return `next() trả về ${s.current.code}, đã tải ${WORDS[s.pages]} trang`;
});

export const live = `
${MODEL}
${TIMELINE}
const P = ${JSON.stringify(P)};
const START = ${START}, N = REST.length, FLAG_RISE = ${FLAG.rise}, DIGIT_H = ${DIGIT.h};
const SPROCKETS = ${SPROCKET_FRAMES}, RATCHETS = ${RATCHET_FRAMES}, LEVERS = ${LEVER_FRAMES}, STEP_DEG = ${STEP_DEG}, TOOTH = ${360 / RATCHET.teeth};
const REST_TEXT = ${JSON.stringify(restText)};
const SPOKEN = ${JSON.stringify(spoken)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector('[data-part="' + name + '"]');
const parts = { trays: q("trays"), pusher: q("pusher"), flag: q("flag"), pages: q("pages"), tens: q("tens"), ones: q("ones"), code: q("screen-code"), amount: q("screen-amount"), glow: q("glow") };
const trayEls = [...parts.trays.children].sort((a, b) => a.dataset.tray - b.dataset.tray);
const slides = trayEls.map((el) => [...el.querySelectorAll("[data-slide] > .iso-solid")]);
const pinFrames = [...q("pins").children];
const ratchetFrames = [...q("ratchet").children];
const leverFrames = [...q("lever").children];
const flagPlate = svg.querySelector('[data-part="flag-plate"] > .iso-solid');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let sel = START, t = REST[START], aim = sel, speed = 1, dwell = 0;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0;
const DWELL = 3.4;
const shown = {};
const set = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.setAttribute("transform", value); } };
const show = (list, index, key) => {
  if (shown[key] === index) return;
  shown[key] = index;
  list.forEach((el, i) => el.setAttribute("display", i === index ? "inline" : "none"));
};
const lit = (el, on, off = "hi") => {
  el.toggleAttribute("data-lit", on);
  el.querySelector(".iso-edge")?.setAttribute("data-tone", on ? "lit" : off);
};
const digits = (el, key, value) => set(el, key, "translate(0 " + (-DIGIT_H * value).toFixed(2) + ")");
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", SPOKEN[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function draw() {
  const p = pose(t);
  p.trays.forEach((tray, i) => {
    set(trayEls[i], "tray" + i, translateAlong(P, [tray.x, 0, tray.z]));
    const o = tray.opacity.toFixed(2);
    if (shown["op" + i] !== o) { shown["op" + i] = o; trayEls[i].style.opacity = o === "1.00" ? "" : o; }
  });
  // Paint the trays far to near, so a stack and a tray passing each other overlap right.
  const order = p.trays.map((tray, i) => ({ i, d: depthOf([tray.x - 18, 0, tray.z + 1.5], P) })).sort((a, b) => a.d - b.d).map((e) => e.i).join("");
  if (shown.order !== order) { shown.order = order; for (const i of order) parts.trays.appendChild(trayEls[+i]); }
  const litKey = p.lit ? p.lit.tray + "/" + p.lit.slot : "";
  if (shown.lit !== litKey) {
    shown.lit = litKey;
    slides.forEach((list, i) => list.forEach((el, j) => lit(el, !!p.lit && p.lit.tray === i && p.lit.slot === j, "mid")));
  }
  set(parts.pusher, "push", translateAlong(P, [p.push, 0, 0]));
  set(parts.flag, "flag", translateAlong(P, [0, 0, p.done * FLAG_RISE]));
  const done = p.done > 0.5;
  // The lamp stays on while the loop runs and goes out once the data is used up.
  if (shown.done !== done) { shown.done = done; lit(flagPlate, done); parts.glow.toggleAttribute("data-on", !done); }
  digits(parts.pages, "pg", p.pages);
  digits(parts.tens, "tn", Math.max(0, Math.min(1, p.items - 9)));
  digits(parts.ones, "on", p.items < 10 ? p.items : p.items - 10);
  show(pinFrames, Math.round((p.turn % 1) * SPROCKETS) % SPROCKETS, "pin");
  show(ratchetFrames, Math.round((((p.turn * STEP_DEG) % TOOTH) / TOOTH) * RATCHETS) % RATCHETS, "rat");
  show(leverFrames, Math.round(p.lever * (LEVERS - 1)), "lev");
  // The screen shows the order under the head; dashes while nothing is there, HẾT at the end.
  const given = Math.round(p.items);
  const order0 = p.lit ? ORDERS[FIRST[p.lit.tray] + p.lit.slot] : null;
  const code = order0 ? order0.code : p.done > 0.5 ? "HẾT" : "------";
  const amount = order0 ? groupVND(order0.total) + " ₫" : "";
  if (shown.code !== code) { shown.code = code; parts.code.textContent = code; parts.code.setAttribute("data-tone", order0 || p.done > 0.5 ? "hi" : "lo"); }
  if (shown.amount !== amount) { shown.amount = amount; parts.amount.textContent = amount; }
  const resting = REST.findIndex((r) => Math.abs(r - t) < 0.001);
  const text = resting >= 0 ? REST_TEXT[resting] : t > REST[aim] ? "đang tua lại" : phase(t);
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const target = REST[sel];
  if (sel !== aim) {
    aim = sel;
    // One next() call a second going forward, faster when skipping a step, and a quick rewind.
    speed = target < t ? 4 : target > REST[Math.min(N - 1, REST.findIndex((r) => r > t + 0.001))] ? 2.4 : 1;
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

const steps = STEPS.map((step) => {
  const s = after(step.calls);
  const order = s.current;
  let caption;
  if (step.run === 1) {
    caption = `Một vòng lặp khác tìm đơn đầu tiên trên ${groupVND(LIMIT)} ₫. Nó gặp ${order.code} trị giá ${groupVND(order.total)} ₫ ở đơn ${ordinal(s.given)} rồi <code>break</code>, nên trang ${WORDS[PAGES.length]} không bao giờ được tải và chỉ có <strong>${s.pages} trang</strong>.`;
  } else if (s.done) {
    caption = `Sau ${ORDERS[ORDERS.length - 1].code}, trang cuối không còn cursor nào, nên lần gọi kế tiếp không tải thêm gì mà báo StopIteration để vòng <code>for</code> tự dừng. Cả ${WORDS[s.given]} đơn đi qua <strong>${s.pages} trang</strong>.`;
  } else if (s.given === 1) {
    caption = `Vòng lặp gọi <code>next()</code> lần đầu. Iterator chưa cầm trang nào nên gọi API lấy trang 1, rồi trả về ${order.code} trị giá ${groupVND(order.total)} ₫. Lúc này mới có <strong>${s.pages} trang</strong> được tải.`;
  } else {
    caption = `${WORDS[SIZE[0]][0].toUpperCase() + WORDS[SIZE[0]].slice(1)} đơn của trang 1 đã dùng hết, nên tới lần gọi ${ordinal(s.given)} iterator mới lấy trang 2 bằng cursor ${PAGES[1].cursor} và trả về ${order.code}. Trang 3 vẫn nằm trong hộp API, nên mới có <strong>${s.pages} trang</strong> được tải.`;
  }
  return { label: step.label, short: step.short, caption };
});

export const plate = withSteps(k.plateHtml({
  fig: "Fig 19",
  title: "Iterator",
  hint: "Rê chuột để chọn bước",
  readout: restText[START],
  keys: [
    { mark: "lit", label: "Tấm phim đang nằm dưới đầu đọc, tức đơn hàng mà next() vừa trả về" },
    { mark: "raised", label: "Các khay trong hộp API là những trang chưa tải, chỉ được đẩy ra khi khay trước đã dùng hết" },
  ],
  caption:
    "Mỗi lần kéo cần là một lần gọi next(). Bánh răng đẩy khay tiến một ô, tấm phim kế tiếp nằm dưới đầu đọc và đơn hàng của nó hiện lên màn hình. Khi khay đang đọc đã hết phim, nó trượt xuống thùng bên phải và lúc đó hộp API mới đẩy khay sau ra, nên người kéo cần không bao giờ phải biết có bao nhiêu khay hay khay nào đang ở đâu.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Iterator, dùng phím mũi tên để chọn bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Hai vòng lặp qua cùng một API", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-glow{fill:var(--anatomy-shade-1);transition:fill .3s ease}
.dp-glow[data-on]{fill:#fffbe6}
.dp-digit,.dp-readout-code{letter-spacing:.02em}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:110%;margin:-4% -5% -2%}}
`;

export { kitScript };
