// The Factory Method figure: a three-lane production cell under one gantry.
// Every lane has the same frame, shuttle and rails; only the make station at
// the back differs (a sheet magazine and envelope die, a paper roll and slip
// cutter, a pellet hopper and capsule mould). That station is each subclass's
// create_sender(). The gantry is the base class's notify(): it always runs the
// same routine, picking whatever the lane made by the standard suction pad
// every product carries (the Sender interface) and setting it in the outgoing
// tray. The console reads the result of send() from the model (model.mjs).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { CHANNELS, notify } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 420;

const PLATE = { x: -100, y: -80, w: 152, d: 158, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Lanes, one per concrete creator: Email nearest the viewer, Push farthest.
const LANE_Y = [36, 0, -36];
const PRESS_X = -62; // ram and die centre: where a product is made
const PICK_X = -34; // shuttle stop where the gantry picks it up
const DROP_X = 20; // its place in the outgoing tray
const SH_Z = 2.5;
const SH_TOP = 5;
const ARM_Z = [36, 42];
const SLEEVE_Z = [26, 36];
const ZD_UP = 23; // die bottom when the ram is up
const DIE_H = 3;
const RAM_L = 15.7;
// Top of the suction pad of each product as made (on the shuttle).
const PAD_TOP = [7.6, 8.2, 13.2];

// Gantry: rails along x, a bridge along y, a head on the bridge, a Z slide with a suction cup.
const RAIL_Y = [-64, 64];
const RAIL_X = [-60, 14];
const BEAM_Z = [46, 53];
const CUP_DX = 14; // cup centre in front of the bridge axis
const CUP_H = 6;
const BX_PARK = 4;
const HY_PARK = 56; // head waits at the near end of the beam, out of the way
const ZB_UP = 30; // Z slide bottom when raised
const TRAY = { x: 6, y: -50, w: 28, d: 100, r: 1.5 };
const TRAY_H = 5;
const TRAY_FLOOR = 2;
const CONSOLE = { x: 22, y: -76, w: 24, d: 18, r: 2 };
const CONSOLE_H = 26;

const START = 1;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners({ x: -94, y: -42, w: 1, d: 84, r: 0 }, 0, 54),
    ...k.boxCorners({ x: -52, y: -68, w: 64, d: 136, r: 0 }, 0, 60),
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 40 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const X = [1, 0, 0];
const Y = [0, 1, 0];
const Z = [0, 0, 1];
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const screws = (plan, inset, z, size = 0.45) => D(k.corners(plan, inset).map(([x, y]) => at([x, y, z])), { size });

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 22)].sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const corners = k.corners(PLATE, 10);
  out.push(L(corners.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(corners.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Travel scale along the near rail; the bridge's pointer reads it.
  const ruler = { x: -60, y: 69.5, w: 74, d: 4.5, r: 0.8 };
  out.push(S(k.slabOf(ruler, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-56, 12, 4, 5, ruler.y + 0.4, 0.6, [1.5, 2.8], P, "x");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([ruler.x + 1.8, ruler.y + 2.2, 0.6]), at([ruler.x + ruler.w - 1.8, ruler.y + 2.2, 0.6])], { size: 0.4 }));
  // Label plate in the front-left corner.
  const label = { x: -94, y: 56, w: 26, d: 14, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-89, 60, 14], [-89, 63, 9], [-89, 66, 12]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 7, 0.8]), at([label.x + label.w - 2.4, label.y + 7, 0.8])], { size: 0.4 }));
  return out.join("");
}

function rail(ry) {
  const plan = { x: RAIL_X[0], y: ry - 2.5, w: RAIL_X[1] - RAIL_X[0], d: 5, r: 1 };
  const out = [S(k.slabOf(plan, 0, 3, P, 3, 0.4), { tone: "mid" })];
  out.push(D([-54, -36, -18, 0].map((x) => at([x, ry, 3])), { size: 0.4, tone: "lo" }));
  for (const x of [RAIL_X[0] - 3, RAIL_X[1]]) {
    const stop = { x, y: ry - 4, w: 3, d: 8, r: 0.8 };
    out.push(S(k.slabOf(stop, 0, 7, P, 3, 0.4), { tone: "mid" }), D([at([x + 1.5, ry, 7])], { size: 0.45 }));
  }
  return out.join("");
}

// One end of the bridge: the carriage on its rail and the upright.
function bridgeEnd(ry, near) {
  const bx = BX_PARK;
  const out = [];
  const car = { x: bx - 7, y: ry - 5, w: 14, d: 10, r: 1.5 };
  out.push(S(k.slabOf(car, 3, 5, P, 3, 0.5), { tone: "mid" }));
  out.push(screws(car, 2, 8, 0.4));
  if (near) {
    // Pointer over the travel scale.
    const tab = { x: bx - 1, y: ry + 5, w: 2, d: 5.6, r: 0.5 };
    out.push(S(k.slabOf(tab, 3.6, 0.8, P, 2), { tone: "mid", crease: "none" }));
    out.push(L(k.lineOnTop([bx, ry + 5], [bx, ry + 10.6], 4.4, P), { tone: "hi", free: "end" }));
  }
  const up = { x: bx - 4, y: ry - 3, w: 8, d: 6, r: 1 };
  out.push(S(k.slabOf(up, 8, BEAM_Z[0] - 8, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(up, 26, P, 3), { tone: "faint" }) }));
  if (near) {
    // Drive motor on the outside of the near upright.
    const F = G.frameAlong([bx, ry + 3, 16], Y);
    out.push(S(G.disc(0, 1, 4.6, F, P), { tone: "mid" }));
    out.push(S(G.disc(1, 7.5, 4, F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 1.6, 6.9, 4, 22, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
    out.push(L(G.circleOf(F, 7.5, 1.4, P, 24), { tone: "lo" }));
  }
  return out.join("");
}

function beam() {
  const bx = BX_PARK;
  const plan = { x: bx - 4, y: -69, w: 8, d: 138, r: 1.2 };
  const out = [S(k.slabOf(plan, BEAM_Z[0], BEAM_Z[1] - BEAM_Z[0], P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(plan, 49.5, P, 3), { tone: "faint" }) })];
  out.push(D([-64, -40, -16, 16, 40, 64].map((y) => at([bx, y, BEAM_Z[1]])), { size: 0.4, tone: "lo" }));
  // Linear guide on the beam top that the head rides.
  const guide = { x: bx - 1.5, y: -60, w: 3, d: 120, r: 0.6 };
  out.push(S(k.slabOf(guide, BEAM_Z[1], 1, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

// The head on the beam's front face, at y = 0 (moved in y at run time).
function head() {
  const bx = BX_PARK;
  const out = [];
  const block = { x: bx + 4, y: -7, w: 7, d: 14, r: 1.2 };
  out.push(S(k.slabOf(block, 40, 16, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(block, 48, P, 3), { tone: "faint" }) }));
  out.push(D([[bx + 11, -5, 53], [bx + 11, 5, 53], [bx + 11, -5, 43], [bx + 11, 5, 43]].map(at), { size: 0.4 }));
  // Z motor on top of the head.
  const motor = { x: bx + 4.5, y: -4.5, w: 6, d: 9, r: 1 };
  out.push(S(k.slabOf(motor, 56, 4.4, P, 3, 0.4), { tone: "mid" }));
  out.push(L([-2.5, 0, 2.5].map((y) => k.lineOnTop([bx + 5.8, y], [bx + 9.2, y], 60.4, P)).join(""), { tone: "lo" }));
  // Z guide rail on the head's face.
  const rail = { x: bx + 11, y: -2, w: 1.5, d: 4, r: 0.4 };
  out.push(S(k.slabOf(rail, 30, 26, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

// The Z slide and the suction cup, built raised.
function zslide() {
  const bx = BX_PARK;
  const out = [];
  const plate = { x: bx + 12.5, y: -4, w: 3, d: 8, r: 0.8 };
  out.push(S(k.slabOf(plate, ZB_UP, 28, P, 3, 0.4), { tone: "mid" }));
  out.push(D([[bx + 15.5, -2.4, ZB_UP + 25], [bx + 15.5, 2.4, ZB_UP + 25], [bx + 15.5, -2.4, ZB_UP + 3], [bx + 15.5, 2.4, ZB_UP + 3]].map(at), { size: 0.38 }));
  const cx = bx + CUP_DX;
  const z = ZB_UP;
  // Stem, bellows and lip.
  out.push(S(k.cylinder(cx, 0, 1.2, z - 2.4, 2.4, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(cx, 0, 2.5, z - 5.2, 2.8, P, 24), { tone: "mid", inner: L(k.sideArc(cx, 0, 2.5, z - 4.3, P) + k.sideArc(cx, 0, 2.5, z - 3.3, P), { tone: "lo" }) }));
  out.push(S(k.cylinder(cx, 0, 3.1, z - CUP_H, 0.8, P, 28), { tone: "mid" }));
  return out.join("");
}

// One lane's make station: frame, ram, die and the stock its subclass uses.
function press(index) {
  const ly = LANE_Y[index];
  const out = [];
  const foot = { x: -97, y: ly - 8, w: 12, d: 16, r: 1.2 };
  out.push(S(k.slabOf(foot, 0, 1.4, P, 3), { tone: "lo" }), screws(foot, 2, 1.4, 0.4));
  const column = { x: -94, y: ly - 6, w: 7, d: 12, r: 1 };
  out.push(S(k.slabOf(column, 1.4, ARM_Z[0] - 1.4, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(column, 14, P, 3), { tone: "faint" }) }));
  // Access panel on the column's near face.
  const M = k.sideMatrix([column.x + 1.4, column.y + column.d], 31, P, "left");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 4.2, 13, 0.6)}"/></g>`);
  out.push(D([[column.x + 2.1, 30.2], [column.x + 4.9, 30.2], [column.x + 2.1, 18.8], [column.x + 4.9, 18.8]].map(([x, z]) => at([x, column.y + column.d, z])), { size: 0.35 }));
  return out.join("");
}

// The arm, sleeve and stock: drawn after the ram so the arm hides its top.
function pressTop(index) {
  const ly = LANE_Y[index];
  const out = [];
  out.push(S(k.cylinder(PRESS_X, ly, 3, SLEEVE_Z[0], SLEEVE_Z[1] - SLEEVE_Z[0], P, 24), { tone: "mid", inner: L(k.sideArc(PRESS_X, ly, 3, SLEEVE_Z[0] + 2, P), { tone: "faint" }) }));
  const arm = { x: -94, y: ly - 6, w: 38, d: 12, r: 1 };
  out.push(S(k.slabOf(arm, ARM_Z[0], ARM_Z[1] - ARM_Z[0], P, 3, 0.6), { tone: "mid" }));
  out.push(D([[-60, ly - 3.5], [-60, ly + 3.5], [-90, ly - 3.5], [-90, ly + 3.5]].map(([x, y]) => at([x, y, ARM_Z[1]])), { size: 0.4 }));
  // Engraved channel name on the arm's near face.
  const M = k.sideMatrix([-87, ly + 6], ARM_Z[1], P, "left");
  out.push(`<g transform="${M}"><text class="iso-face-text" data-tone="mid" x="0" y="4.3" font-size="3.4">${CHANNELS[index].code}</text></g>`);
  out.push(stock(index, ly));
  return out.join("");
}

function stock(index, ly) {
  const out = [];
  const z = ARM_Z[1];
  if (index === 0) {
    // Sheet magazine: a tray with corner posts and a stack of blanks.
    const tray = { x: -91, y: ly - 7.5, w: 16, d: 15, r: 1 };
    out.push(S(k.slabOf(tray, z, 1, P, 3), { tone: "mid" }));
    for (let i = 0; i < 4; i++) {
      const sheet = { x: -89.6 + i * 0.35, y: ly - 6.4, w: 13, d: 12.8, r: 0.4 };
      out.push(S(k.slabOf(sheet, z + 1 + i * 0.7, 0.7, P, 2), { tone: "mid", crease: "none" }));
    }
    for (const y of [ly - 6.8, ly + 6.8]) out.push(S(k.cylinder(-90.3, y, 0.7, z + 1, 5, P, 12), { tone: "mid" }));
  } else if (index === 1) {
    // Paper roll on two brackets, its tape running flat along the arm toward the ram.
    out.push(S(k.slabOf({ x: -84, y: ly - 3.3, w: 17, d: 6.6, r: 0.3 }, z, 0.3, P, 2), { tone: "mid", crease: "none", flat: true }));
    out.push(L(k.lineOnTop([-82, ly - 3.3], [-82, ly + 3.3], z + 0.3, P), { tone: "faint" }));
    const bracket = (y) => S(k.slabOf({ x: -88, y, w: 7, d: 1.2, r: 0.3 }, z, 7.2, P, 2), { tone: "mid" });
    out.push(bracket(ly - 7.4));
    const F = G.frameAlong([-84.5, ly - 6.2, z + 5.4], Y);
    out.push(S(G.solidOf([[0, 4.6], [12.4, 4.6]], F, P), { tone: "mid" }));
    out.push(L(G.circleOf(F, 12.4, 1.6, P, 24), { tone: "lo" }), L(G.circleOf(F, 12.4, 3.4, P, 32), { tone: "faint" }));
    out.push(bracket(ly + 6.2));
    out.push(D([at([-84.5, ly + 7.4, z + 5.4])], { size: 0.55 }));
  } else {
    // Pellet hopper: a cone on a neck, open at the top.
    const F = G.frameAlong([-84, ly, z], Z);
    out.push(S(G.solidOf([[0, 2.4], [3, 2.4], [3, 2.8], [9.6, 6.2], [10.4, 6.2]], F, P), { tone: "mid" }));
    out.push(`<path class="fm-hole" d="${G.circleOf(F, 10.4, 5.4, P, 40)}"/>`);
    out.push(L(G.circleOf(F, 10.4, 5.4, P, 40), { tone: "lo" }));
    out.push(D([[-85.5, ly - 1.5], [-82.6, ly + 1.2], [-84.2, ly + 2.4], [-83, ly - 2.2], [-85.6, ly + 1.4]].map(([x, y]) => at([x, y, z + 10.4])), { size: 0.7, tone: "lo" }));
  }
  return out.join("");
}

// The ram and the die this lane's subclass fitted, built with the ram up.
function ram(index) {
  const ly = LANE_Y[index];
  const zd = ZD_UP;
  const out = [];
  out.push(S(k.cylinder(PRESS_X, ly, 1.6, zd + DIE_H, RAM_L, P, 16), { tone: "mid" }));
  if (index === 0) {
    const die = { x: PRESS_X - 10, y: ly - 7.5, w: 20, d: 15, r: 1 };
    out.push(S(k.slabOf(die, zd, DIE_H, P, 3, 0.5), { tone: "mid" }));
    out.push(L(k.onTop([[die.x + 1.6, ly - 6], [PRESS_X - 2.3, ly - 1]], zd + DIE_H, P) + k.onTop([[die.x + 1.6, ly + 6], [PRESS_X - 2.3, ly + 1]], zd + DIE_H, P), { tone: "faint", free: "start" }));
  } else if (index === 1) {
    const die = { x: PRESS_X - 7, y: ly - 5, w: 14, d: 10, r: 0.8 };
    out.push(S(k.slabOf(die, zd, DIE_H, P, 3, 0.5), { tone: "mid" }));
    // The cutter blade on its front edge reaches below the die.
    out.push(S(k.slabOf({ x: PRESS_X + 7, y: ly - 5, w: 0.9, d: 10, r: 0.2 }, zd - 1.2, DIE_H + 1.2, P, 2), { tone: "mid" }));
  } else {
    out.push(S(k.cylinder(PRESS_X, ly, 6, zd, DIE_H, P, 40, 0.5), { tone: "mid", inner: L(k.sideArc(PRESS_X, ly, 6, zd + 1, P, 40), { tone: "faint" }) }));
    out.push(L(k.ring(PRESS_X, ly, 4.2, zd + DIE_H, P, 32), { tone: "faint" }));
  }
  out.push(S(k.cylinder(PRESS_X, ly, 2.4, zd + DIE_H, 1, P, 20), { tone: "mid" }));
  return out.join("");
}

function laneBase(index) {
  const ly = LANE_Y[index];
  const out = [];
  for (const y of [ly - 8, ly + 8]) {
    out.push(S(k.slabOf({ x: -84, y: y - 1.5, w: 62, d: 3, r: 0.6 }, 0, SH_Z, P, 2, 0.3), { tone: "mid" }));
    out.push(D([-80, -26].map((x) => at([x, y, SH_Z])), { size: 0.35, tone: "lo" }));
  }
  return out.join("");
}

function endStop(index) {
  const ly = LANE_Y[index];
  const plan = { x: -22, y: ly - 11, w: 3, d: 22, r: 0.8 };
  return S(k.slabOf(plan, 0, 6.5, P, 3, 0.4), { tone: "mid" }) + D([at([-20.5, ly - 7, 6.5]), at([-20.5, ly + 7, 6.5])], { size: 0.4 });
}

// The shuttle, built under the press.
function shuttle(index) {
  const ly = LANE_Y[index];
  const plan = { x: PRESS_X - 11, y: ly - 12, w: 22, d: 24, r: 1.5 };
  const out = [S(k.slabOf(plan, SH_Z, SH_TOP - SH_Z, P, 3, 0.5), { tone: "mid" })];
  out.push(screws(plan, 2.4, SH_TOP, 0.4));
  out.push(L(k.planOutline(k.insetPlan(plan, 4), SH_TOP, P, 3), { tone: "faint" }));
  return out.join("");
}

// Every product carries the same suction pad on top: the Sender interface.
function pad(x, y, z) {
  return S(k.cylinder(x, y, 2.6, z, 0.8, P, 24), { tone: "hi", crease: "lo" }) + L(k.ring(x, y, 1.4, z + 0.8, P, 20), { tone: "lo" }) + D([at([x, y, z + 0.8])], { size: 0.4 });
}

// The product each lane makes, built on the shuttle under the press.
function product(index) {
  const ly = LANE_Y[index];
  const x = PRESS_X;
  const out = [];
  if (index === 0) {
    // Envelope: flap creases and an address block, the stamp in one corner.
    const body = { x: x - 10, y: ly - 7, w: 20, d: 14, r: 0.6 };
    const top = SH_TOP + 1.8;
    const flap = k.onTop([[body.x, ly - 7], [x - 2.4, ly - 1.2]], top, P) + k.onTop([[body.x, ly + 7], [x - 2.4, ly + 1.2]], top, P);
    out.push(`<g data-part="body">${S(k.slabOf(body, SH_TOP, 1.8, P, 2, 0.3), { tone: "hi", crease: "lo", inner: L(flap, { tone: "faint" }) })}</g>`);
    out.push(L(k.planOutline({ x: x + 5, y: ly - 5.6, w: 3.4, d: 3.4, r: 0.3 }, top, P, 2), { tone: "lo" }));
    out.push(L([[x + 2, ly + 1.4, 5.6], [x + 2, ly + 3.4, 4.2]].map(([x0, y, w]) => k.lineOnTop([x0, y], [x0 + w, y], top, P)).join(""), { tone: "faint", free: true }));
    out.push(pad(x, ly, top));
  } else if (index === 1) {
    // Message slip: perforated tear line near the cut end.
    const body = { x: x - 7, y: ly - 4.5, w: 14, d: 9, r: 0.5 };
    const top = SH_TOP + 2.4;
    out.push(`<g data-part="body">${S(k.slabOf(body, SH_TOP, 2.4, P, 2, 0.3), { tone: "hi", crease: "lo" })}</g>`);
    out.push(D([-3.2, -1.6, 0, 1.6, 3.2].map((dy) => at([x + 4.6, ly + dy, top])), { size: 0.35, tone: "lo" }));
    out.push(L([[x - 5.6, ly - 2.2, 2.4], [x - 5.6, ly + 2.2, 1.6]].map(([x0, y, w]) => k.lineOnTop([x0, y], [x0 + w, y], top, P)).join(""), { tone: "faint", free: true }));
    out.push(pad(x, ly, top));
  } else {
    // Push capsule: a two-tone pill lying along x, with a boss for the pad.
    const r = 3.2;
    const axis = G.frameAlong([x, ly, SH_TOP + r], X);
    const cap = (sign) => Array.from({ length: 7 }, (_, i) => {
      const t = (i / 6) * (Math.PI / 2);
      return [sign * (4.8 + r * Math.cos(t)), r * Math.sin(t), 1];
    });
    const profile = [...cap(-1), [-4.8, r, 1], [4.8, r, 1], ...cap(1).reverse()].sort((a, b) => a[0] - b[0]);
    profile[0] = [profile[0][0], 0];
    profile[profile.length - 1] = [profile[profile.length - 1][0], 0];
    out.push(`<g data-part="body">${S(G.solidOf(profile, axis, P), { tone: "hi", crease: "lo", inner: L(G.arcOf(axis, 0, r, P), { tone: "lo" }) })}</g>`);
    out.push(S(k.cylinder(x, ly, 1.8, SH_TOP + 2 * r - 0.4, 1.6, P, 18), { tone: "hi", crease: "lo" }));
    out.push(pad(x, ly, SH_TOP + 2 * r + 1.2));
  }
  return out.join("");
}

// The outgoing tray: the rim and the inside are drawn first, the near walls
// again after the products so they hide the bottom of whatever sits inside.
const OPENING = { x: TRAY.x + 2.5, y: TRAY.y + 2.5, w: TRAY.w - 5, d: TRAY.d - 5, r: 0.8 };
function trayBack() {
  const out = [S(k.slabOf(TRAY, 0, TRAY_H, P, 3, 0.5), { tone: "mid" })];
  const hole = k.planOutline(OPENING, TRAY_H, P, 3);
  out.push(`<clipPath id="fm-tray"><path d="${hole}"/></clipPath><path class="fm-wall" d="${hole}"/>`);
  out.push(`<g clip-path="url(#fm-tray)"><path class="fm-floor" d="${k.planOutline(OPENING, TRAY_FLOOR, P, 3)}"/>`);
  out.push(L(k.planOutline(OPENING, TRAY_FLOOR, P, 3), { tone: "lo" }));
  // A seat outline at each lane's drop point.
  out.push(L(LANE_Y.map((ly) => k.planOutline({ x: DROP_X - 11, y: ly - 8.5, w: 22, d: 17, r: 1 }, TRAY_FLOOR, P, 3)).join(""), { tone: "faint" }));
  out.push(`</g>`, L(hole, { tone: "lo" }));
  out.push(D([[TRAY.x + 1.2, TRAY.y + 1.2], [TRAY.x + 1.2, TRAY.y + TRAY.d - 1.2]].map(([x, y]) => at([x, y, TRAY_H])), { size: 0.4 }));
  return out.join("");
}

function trayFront() {
  const side = { x: TRAY.x, y: TRAY.y + TRAY.d - 2.5, w: TRAY.w, d: 2.5, r: 0.6 };
  const front = { x: TRAY.x + TRAY.w - 2.5, y: TRAY.y, w: 2.5, d: TRAY.d, r: 0.6 };
  return S(k.slabOf(side, 0, TRAY_H, P, 2), { tone: "mid", crease: "none" }) + S(k.slabOf(front, 0, TRAY_H, P, 2), { tone: "mid", crease: "none" })
    + D([[TRAY.x + TRAY.w - 1.2, TRAY.y + 1.2], [TRAY.x + TRAY.w - 1.2, TRAY.y + TRAY.d - 1.2]].map(([x, y]) => at([x, y, TRAY_H])), { size: 0.4 });
}

// The console that reads what send() did, on its +y face.
const WIN = { x: CONSOLE.x + 2.5, z: 23.5, w: 19, h: 11.5 };
function consoleBox() {
  const out = [];
  const foot = k.insetPlan(CONSOLE, -1.5);
  out.push(S(k.slabOf(foot, 0, 1.4, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf(CONSOLE, 1.4, CONSOLE_H - 1.4, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(CONSOLE, 8, P, 4), { tone: "faint" }) }));
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: CONSOLE.x + 4 + i * 4, y: CONSOLE.y + 3, w: 1.8, d: 9, r: 0.9 }, CONSOLE_H, P, 3), { tone: "lo" }));
  out.push(S(k.cylinder(CONSOLE.x + 20, CONSOLE.y + 13.5, 1.6, CONSOLE_H, 1.2, P, 16), { tone: "mid" }));
  out.push(D([[CONSOLE.x + 2, CONSOLE.y + 2], [CONSOLE.x + CONSOLE.w - 2, CONSOLE.y + 2], [CONSOLE.x + 2, CONSOLE.y + CONSOLE.d - 2]].map(([x, y]) => at([x, y, CONSOLE_H])), { size: 0.45 }));
  const face = CONSOLE.y + CONSOLE.d;
  const M = k.sideMatrix([WIN.x, face], WIN.z, P, "left");
  out.push(`<g transform="${M}">
    <clipPath id="fm-win"><path d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/></clipPath>
    <path class="fm-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/>
    <g clip-path="url(#fm-win)"><path class="fm-wall" d="M0 0H${WIN.w}V1H1V${WIN.h}H0Z"/>
    <text class="iso-face-text fm-digits" data-part="code" data-tone="hi" x="${WIN.w / 2}" y="6.1" font-size="5" text-anchor="middle">${CHANNELS[START].code}</text>
    <text class="iso-face-text fm-digits" data-part="cost" data-tone="mid" x="${WIN.w / 2}" y="10" font-size="3.2" text-anchor="middle">${notify(CHANNELS[START]).cost} đ</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/>
  </g>`);
  const N = k.sideMatrix([WIN.x, face], 9.5, P, "left");
  out.push(`<g transform="${N}"><path class="fm-plate" d="${rrect(0, 0, 13, 6, 0.8)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 13, 6, 0.8)}"/><path class="iso-line" data-tone="lo" data-free="" d="M2.2 2.2H10M2.2 4H7.6"/></g>`);
  out.push(D([at([WIN.x + 15.5, face, 7]), at([WIN.x + 17.5, face, 7])], { size: 0.5 }));
  return out.join("");
}


// Operator box beside the tray: a mushroom stop button and a start button.
function operatorBox() {
  const box = { x: 37, y: 26, w: 11, d: 18, r: 1.5 };
  const out = [S(k.slabOf(box, 0, 7, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(box, 2.4, P, 3), { tone: "faint" }) })];
  out.push(screws(box, 1.6, 7, 0.4));
  out.push(S(k.cylinder(42.5, 31, 2.6, 7, 0.8, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(42.5, 31, 1.4, 7.8, 1.6, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(42.5, 31, 3, 9.4, 1.6, P, 28, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(42.5, 39, 1.6, 7, 1, P, 18), { tone: "mid" }));
  out.push(L(k.ring(42.5, 39, 0.8, 8, P, 12), { tone: "lo" }));
  return out.join("");
}

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một dây chuyền ba làn nằm dưới một cổng trục. Ba làn có khung, xe con và ray giống hệt nhau, chỉ có trạm tạo phía sau là khác. Làn Email gấp phong bì từ chồng giấy, làn SMS cắt phiếu từ cuộn giấy, còn làn Push đúc viên nang từ phễu. Lần nào cổng trục cũng chạy cùng một quy trình: gọi trạm tạo, gắp sản phẩm bằng đĩa hút chuẩn mà sản phẩm nào cũng có, rồi đặt vào khay gửi đi. Màn hình bên cạnh hiện kết quả gửi.",
  body: [
    base(),
    rail(RAIL_Y[0]),
    `<g data-part="bridge">${bridgeEnd(RAIL_Y[0], false)}</g>`,
    consoleBox(),
    ...[2, 1, 0].map((i) => `<g data-lane="${i}">
      ${press(i)}${laneBase(i)}
      <g data-part="shuttle">${shuttle(i)}</g>
      <g data-part="slot"><g data-product="${i}" opacity="${i === START ? 1 : 0}">${product(i)}</g></g>
      <g data-part="ram">${ram(i)}</g>
      ${pressTop(i)}${endStop(i)}
    </g>`),
    trayBack(),
    `<g data-part="carry"></g>`,
    rail(RAIL_Y[1]),
    `<g data-part="bridge">${bridgeEnd(RAIL_Y[1], true)}</g>`,
    `<g data-part="bridge">${beam()}</g>`,
    `<g data-part="head" transform="${k.translateAlong(P, [0, HY_PARK, 0])}">${head()}</g>`,
    `<g data-part="zslide" transform="${k.translateAlong(P, [0, HY_PARK, 0])}">${zslide()}</g>`,
    trayFront(),
    operatorBox(),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const LANE_Y = ${JSON.stringify(LANE_Y)}, PAD_TOP = ${JSON.stringify(PAD_TOP)};
const PRESS_X = ${PRESS_X}, PICK_X = ${PICK_X}, DROP_X = ${DROP_X}, CUP_DX = ${CUP_DX}, CUP_H = ${CUP_H};
const BX_PARK = ${BX_PARK}, HY_PARK = ${HY_PARK}, ZB_UP = ${ZB_UP}, ZD_UP = ${ZD_UP}, SHIFT = ${SH_TOP - TRAY_FLOOR};
const START = ${START};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const bridge = svg.querySelectorAll('[data-part="bridge"]');
const headEl = svg.querySelector('[data-part="head"]');
const zslide = svg.querySelector('[data-part="zslide"]');
const carry = svg.querySelector('[data-part="carry"]');
const lanes = LANE_Y.map((_, i) => {
  const el = svg.querySelector('[data-lane="' + i + '"]');
  const product = el.querySelector('[data-product]');
  return {
    shuttle: el.querySelector('[data-part="shuttle"]'),
    slot: el.querySelector('[data-part="slot"]'),
    ram: el.querySelector('[data-part="ram"]'),
    product,
    body: product.querySelector('[data-part="body"] > .iso-solid'),
  };
});
const codeText = svg.querySelector('[data-part="code"]');
const costText = svg.querySelector('[data-part="cost"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const results = CHANNELS.map((channel) => notify(channel));

// One cycle of notify(), in seconds.
const T = { go: [0, 1], fade: [0, 0.6], down: [0.3, 0.8], show: [0.8, 1], up: [1.05, 1.5], out: [1.5, 2.2], pick: [2.2, 2.6], grip: 2.75, lift: [2.75, 3.15], back: [3.15, 3.8], carry: [3.15, 4.25], drop: [4.25, 4.65], release: 4.7, rise: [4.75, 5.15], park: [5.15, 6] };
const END = 6, TOUR = 8.6;
const clamp = (v) => Math.min(1, Math.max(0, v));
const ease = ([a, b], u) => { const s = clamp((u - a) / (b - a)); return s * s * (3 - 2 * s); };
const mix = (a, b, s) => a + (b - a) * s;

let sel = START, cur = START, prev = -1, pending = -1, u = END;
let frame = 0, last = 0, clock = TOUR - 3, touring = !still.matches, visible = false, idleTimer = 0, shown = "";

function pose() {
  const ly = LANE_Y[cur];
  const pickBx = PICK_X - CUP_DX, dropBx = DROP_X - CUP_DX;
  let bx = mix(BX_PARK, pickBx, ease(T.go, u));
  bx = mix(bx, dropBx, ease(T.carry, u));
  bx = mix(bx, BX_PARK, ease(T.park, u));
  let hy = mix(HY_PARK, ly, ease(T.go, u));
  hy = mix(hy, HY_PARK, ease(T.park, u));
  const grab = PAD_TOP[cur] + CUP_H;
  let zb = mix(ZB_UP, grab, ease(T.pick, u));
  zb = mix(zb, ZB_UP, ease(T.lift, u));
  zb = mix(zb, grab - SHIFT, ease(T.drop, u));
  zb = mix(zb, ZB_UP, ease(T.rise, u));
  let zd = mix(ZD_UP, PAD_TOP[cur], ease(T.down, u));
  zd = mix(zd, ZD_UP, ease(T.up, u));
  let sx = mix(PRESS_X, PICK_X, ease(T.out, u));
  sx = mix(sx, PRESS_X, ease(T.back, u));
  return { bx, hy, zb, zd, sx };
}

function place(lane, parent) { if (lane.product.parentNode !== parent) parent.appendChild(lane.product); }

function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  const r = results[sel];
  stage.setAttribute("aria-valuetext", r.creator + " tạo " + r.product + ", phí " + r.cost + " đồng");
  emit();
}
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
const tourFrom = (index) => ((index - START + CHANNELS.length) % CHANNELS.length) * TOUR;

function draw() {
  const p = pose();
  const move = translateAlong(P, [p.bx - BX_PARK, 0, 0]);
  bridge.forEach((el) => el.setAttribute("transform", move));
  headEl.setAttribute("transform", translateAlong(P, [p.bx - BX_PARK, p.hy, 0]));
  zslide.setAttribute("transform", translateAlong(P, [p.bx - BX_PARK, p.hy, p.zb - ZB_UP]));
  lanes.forEach((lane, i) => {
    const mine = i === cur;
    lane.shuttle.setAttribute("transform", translateAlong(P, [mine ? p.sx - PRESS_X : 0, 0, 0]));
    lane.ram.setAttribute("transform", translateAlong(P, [0, 0, mine ? p.zd - ZD_UP : 0]));
    let opacity = 0, offset = [0, 0, 0], parent = lane.slot;
    if (mine) {
      opacity = clamp((u - T.show[0]) / (T.show[1] - T.show[0]));
      if (u < T.grip) offset = [p.sx - PRESS_X, 0, 0];
      else if (u < T.release) { parent = carry; offset = [p.bx + CUP_DX - PRESS_X, p.hy - LANE_Y[i], p.zb - CUP_H - PAD_TOP[i]]; }
      else { parent = carry; offset = [DROP_X - PRESS_X, 0, -SHIFT]; }
    } else if (i === prev) {
      opacity = 1 - ease(T.fade, u);
      parent = carry;
      offset = [DROP_X - PRESS_X, 0, -SHIFT];
    }
    place(lane, parent);
    lane.product.setAttribute("opacity", opacity.toFixed(3));
    lane.product.setAttribute("transform", translateAlong(P, offset));
    lane.body.toggleAttribute("data-lit", mine);
    lane.body.querySelector(".iso-edge").setAttribute("data-tone", mine ? "lit" : "hi");
  });
  const c = CHANNELS[cur], r = results[cur];
  const done = u >= T.release;
  let text;
  if (pending >= 0) text = "đang chuyển sang " + CHANNELS[pending].label;
  else if (u < T.out[0]) text = c.creator + ".create_sender()";
  else if (!done) text = "notify() gắp " + c.product + ", gọi send()";
  else text = c.creator + " → " + c.product + (r.note ? " · " + r.note : "") + " · " + r.cost + " ₫";
  if (readout.textContent !== text) readout.textContent = text;
  const screen = done ? c.code + "|" + r.cost + " đ" : "- - -|";
  if (screen !== shown) {
    shown = screen;
    const [top, bottom] = screen.split("|");
    codeText.textContent = top;
    costText.textContent = bottom;
    codeText.setAttribute("data-tone", done ? "hi" : "lo");
  }
}

function begin(index) {
  prev = cur;
  cur = index;
  pending = -1;
  u = still.matches ? END : 0;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    clock += dt;
    const next = (Math.floor(clock / TOUR) + START) % CHANNELS.length;
    if (next !== sel) request(next);
  }
  // A new choice in the middle of a cycle finishes the cycle quickly first.
  if (u < END) u = Math.min(END, u + dt * (pending >= 0 ? 3.5 : 1));
  if (u >= END && pending >= 0) begin(pending);
  draw();
  const settled = !touring && u >= END && pending < 0;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };

function request(index) {
  if (index === sel) return;
  sel = index;
  if (still.matches) begin(index);
  else if (u >= END && pending < 0) begin(index);
  else pending = index === cur ? -1 : index;
  describe();
}

// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen channel until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; clock = tourFrom(sel); emit(); run(); }, 3600);
  if (index !== sel) request(index); else emit();
  run();
};
const pick = (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
  return Math.floor(share * CHANNELS.length);
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = true; clock = tourFrom(sel); emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để chọn kênh";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse") choose(pick(event), false); });
stage.addEventListener("pointerdown", (event) => choose(pick(event), event.pointerType !== "mouse"));
stage.addEventListener("keydown", (event) => {
  let to = null;
  // Email is the left lane on screen and Push the right one.
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = Math.min(CHANNELS.length - 1, sel + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = Math.max(0, sel - 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = CHANNELS.length - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

const first = notify(CHANNELS[START]);
// Small counts read as words in the captions: "một tin".
const WORDS = ["không", "một", "hai", "ba", "bốn", "năm"];
// What the made product does once the gantry has picked it, in the reader's words.
const DOES = {
  email: (r) => `phong bì tự gửi nội dung tới ${r.to}`,
  sms: (r) => `phiếu tự bỏ dấu cho vừa ${WORDS[parseInt(r.note, 10)] ?? r.note} tin rồi gửi tới ${r.to}`,
  push: () => `viên này tự rút gọn nội dung cho vừa màn hình khoá rồi gửi đi`,
};
const steps = CHANNELS.map((channel) => {
  const r = notify(channel);
  return {
    label: `Kênh ${channel.label}`,
    short: channel.label,
    caption: `<code>${channel.creator}</code> tạo ra ${channel.made}. Cổng trục gắp nó như mọi lần, còn ${DOES[channel.id](r)} với phí <strong>${r.cost} ₫</strong>.`,
  };
});

export const plate = withSteps(k.plateHtml({
  fig: "Fig 12",
  title: "Factory Method",
  hint: "Rê chuột để chọn kênh",
  readout: `${first.creator} → ${first.product}${first.note ? ` · ${first.note}` : ""} · ${first.cost} ₫`,
  keys: [
    { mark: "lit", label: "Sản phẩm vừa được tạo, tức Sender của kênh đang chọn" },
    { mark: "raised", label: "Trạm tạo phía sau mỗi làn, ứng với create_sender() của từng lớp con" },
    { mark: "flat", label: "Đĩa hút giống nhau trên mọi sản phẩm, ứng với interface Sender" },
  ],
  caption:
    "Ba làn có khung, ray và xe con giống hệt nhau, chỉ có trạm tạo phía sau là khác, và đó chính là phần create_sender() mà mỗi lớp con tự viết. Cổng trục đóng vai notify() của lớp cha. Lần nào nó cũng gọi trạm tạo, gắp sản phẩm bằng đĩa hút chuẩn rồi đặt vào khay gửi đi, mà không cần biết mình vừa gắp thứ gì.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Factory Method, dùng phím mũi tên để chọn kênh Email, SMS hoặc Push" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Chọn kênh gửi thông báo", steps, start: START }));

export const FIGURE_CSS = `
.fm-screen{fill:var(--anatomy-shade-1)}
.fm-wall{fill:var(--anatomy-shade-0)}
.fm-floor{fill:var(--anatomy-shade-1)}
.fm-plate{fill:var(--anatomy-top)}
.fm-hole{fill:var(--anatomy-shade-0)}
.fm-digits{letter-spacing:.06em}
.iso-stage{touch-action:pan-y;cursor:pointer;overflow:hidden}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:112%;margin:-3% -6% -2%}}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
