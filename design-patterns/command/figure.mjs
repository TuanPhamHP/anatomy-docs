// The Command figure: a card-fed executor. Each stock adjustment is a punched
// card. Feed rollers draw the top card from the input hopper (the queue) onto
// the read bed, the read head drops onto it (the invoker runs execute()), the
// counter's number wheels roll to the new stock (the receiver), and the card
// goes on into the stacker (the history). Undo takes the top card off the
// stacker, back under the head, and the wheels roll back.
//
// Everything that moves is a pure function of one timeline value t: t = n is
// step n at rest, and t between n and n + 1 is the card of step n + 1 on its
// way. The page plays t toward the chosen step, forwards or backwards.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { COMMANDS, STEPS, STOCK, replay, say } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const { iso, depthOf, pathOf, solidSvg, lineSvg, cylinder } = k;

const WIDTH = 600;
const HEIGHT = 400;

const PLATE = { x: -126, y: -58, w: 176, d: 92, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// The machine: one frame carrying the hopper, the read bed and the stacker in a row along x.
const FRAME = { x: -120, y: -18, w: 164, d: 36, r: 3 };
const FRAME_Z = 4;

// Cards: 30 × 18, 1.4 thick, with the clipped corner of a punched card.
const LEN = 30;
const T = 1.4;
const CARD_RING = [[0, -9], [LEN, -9], [LEN, 9], [3, 9], [0, 6]];
// Punch positions under the read head: 3 columns × 4 rows, in card coordinates.
const COLS = [12, 15, 18];
const ROWS = [-5.4, -1.8, 1.8, 5.4];
const PUNCHES = [
  [[0, 0], [2, 1], [1, 2], [0, 3], [2, 3]],
  [[1, 0], [0, 1], [2, 2], [1, 3]],
  [[2, 0], [1, 1], [0, 2], [1, 2], [2, 3]],
];

// Input hopper (the queue): the first command lies on top.
const HOP = { x: -118, y: -15, w: 38, d: 30, r: 2 };
const Z_HOP = 8;
const HOP_X = -112;
// Read bed: the top card in the hopper is level with it.
const BED = { x: -80, y: -17, w: 80, d: 34, r: 1.5 };
const Z_BED = Z_HOP + 2 * T;
const READ_X = -50;
// Stacker (the history), its floor below the bed so a card drops in on top of the last.
const STK = { x: 0, y: -15, w: 40, d: 30, r: 2 };
const Z_STK = 6;
const STK_X = 4;
const WALL_TOP = 14;

// Feed rollers, one at each end of the bed.
const ROLL_X = [-73, -7];
const ROLL_R = 3;
const ROLL_Z = Z_BED + T + ROLL_R;
const ROLL_Y = 9.6;

// Read head on a beam that runs from the front post over the bed into the counter.
const POST_X = -41;
const POST_W = 12;
const BEAM_Z = 30;
const HEAD = { x: -40, y: -8, w: 10, d: 16, r: 1.5 };
const HEAD_Z = [17, 24];
const PIN = 2.4;
const STROKE = HEAD_Z[0] - PIN - (Z_BED + T);
const RODS = [-5, 5];
const ROD = { x: HEAD.x + HEAD.w / 2, beamTop: BEAM_Z + 4, top: BEAM_Z + 11, r: 0.7, coil: 1.6, turns: 4, stroke: HEAD_Z[0] - PIN - (Z_BED + T) };

// Counter (the receiver): number wheels behind a window on its front face.
const CNT = { x: -48, y: -52, w: 68, d: 25, r: 3 };
const CNT_Z = [2.5, 44];
const CNT_FACE = CNT.y + CNT.d;
const WIN = { x: -12, z: 37, w: 27, h: 11 };
const PITCH = WIN.h;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(CNT, 0, CNT_Z[1] + 5)],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 40 },
);

const at = (point) => iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const X = [1, 0, 0];
const Y = [0, 1, 0];
const byDepth = (points) => [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
// A closed rounded rectangle in a face's own 2D coordinates.
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

// A coil spring around a vertical axis, split into the half behind the rod and the half in front.
function zcoil(cx, cy, radius, z0, z1, turns, P, perTurn = 16) {
  const count = Math.max(1, Math.round(turns * perTurn));
  const back = [];
  const front = [];
  let run = [];
  let near = null;
  for (let index = 0; index <= count; index++) {
    const share = index / count;
    const angle = share * turns * Math.PI * 2;
    const flat = iso([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle), z0 + (z1 - z0) * share], P);
    const facing = depthOf([Math.cos(angle), Math.sin(angle), 0], P) > 0;
    if (near === null) near = facing;
    if (facing !== near) {
      run.push(flat);
      (near ? front : back).push(pathOf(run));
      run = [flat];
      near = facing;
      continue;
    }
    run.push(flat);
  }
  if (run.length > 1) (near ? front : back).push(pathOf(run));
  return { back: back.join(""), front: front.join("") };
}


function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
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

// The counter: case, lid details, the flange the beam bolts to, and the number wheels.
function counter() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CNT, 0, 2, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(k.insetPlan(CNT, -2), 0, CNT_Z[0], P, 6, 0.5), { tone: "mid" }));
  const seam = k.sideSeam(CNT, CNT_Z[1] - 1.8, P, 6);
  out.push(S(k.slabOf(CNT, CNT_Z[0], CNT_Z[1] - CNT_Z[0], P, 6, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  const top = CNT_Z[1];
  for (let i = 0; i < 5; i++) out.push(L(k.planOutline({ x: -40 + i * 6, y: -47, w: 2.4, d: 15, r: 1.2 }, top, P, 3), { tone: "lo" }));
  out.push(D([[-44, -48], [16, -48], [-44, -31], [16, -31]].map(([x, y]) => at([x, y, top])), { size: 0.45 }));
  // Reset knob on the lid.
  const [kx, ky] = [6, -40];
  out.push(S(k.cylinder(kx, ky, 6, top, 1.2, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(kx, ky, 4.6, top + 1.2, 4, P, 36), { tone: "mid" }));
  out.push(L(k.knurl(kx, ky, 4.6, top + 1.2, top + 5.2, 32, P), { tone: "lo" }));
  out.push(L(k.ring(kx, ky, 1.1, top + 5.2, P, 16), { tone: "mid" }));
  out.push(L(k.lineOnTop([kx + 1.1, ky], [kx + 4.6, ky], top + 5.2, P), { tone: "hi" }));
  out.push(flange(), wheels(), sideCrank(), louvers(), ratingPlate());
  // Engraved label above the window.
  out.push(k.faceTextSvg(k.sideMatrix([WIN.x + 0.4, CNT_FACE], WIN.z + 2.6, P, "left"), "TỒN KHO", { size: 2.6, tone: "lo" }));
  out.push(D([[CNT.x + 3, CNT_Z[0] + 3], [CNT.x + CNT.w - 3, CNT_Z[0] + 3], [CNT.x + 3, CNT_Z[1] - 7], [CNT.x + CNT.w - 3, CNT_Z[1] - 7]].map(([x, z]) => at([x, CNT_FACE, z])), { size: 0.45 }));
  return out.join("");
}

// The plate on the counter's face that the beam is bolted to.
const FLANGE = { x: POST_X - 2, y: CNT_FACE, w: POST_W + 4, d: 1.2, r: 0.6 };
const FLANGE_Z = [BEAM_Z - 2.5, BEAM_Z + 6.5];
function flange() {
  const out = [S(k.slabOf(FLANGE, FLANGE_Z[0], FLANGE_Z[1] - FLANGE_Z[0], P, 2, 0.3), { tone: "mid" })];
  const y = FLANGE.y + FLANGE.d;
  out.push(D([[FLANGE.x + 1.6, FLANGE_Z[0] + 1.3], [FLANGE.x + FLANGE.w - 1.6, FLANGE_Z[0] + 1.3], [FLANGE.x + 1.6, FLANGE_Z[1] - 1.3], [FLANGE.x + FLANGE.w - 1.6, FLANGE_Z[1] - 1.3]].map(([x, z]) => at([x, y, z])), { size: 0.45 }));
  return out.join("");
}

// Three number wheels seen through a recessed window, drawn in the face's own plane.
function wheels() {
  const M = k.sideMatrix([WIN.x, CNT_FACE], WIN.z, P, "left");
  const cell = WIN.w / 3;
  const columns = [0, 1, 2].map((i) => {
    const digits = Array.from({ length: 10 }, (_, d) => `<text class="iso-face-text dp-digit" data-tone="hi" x="${(cell * (i + 0.5)).toFixed(2)}" y="${(8.5 + d * PITCH).toFixed(2)}" font-size="8.2" text-anchor="middle">${d}</text>`).join("");
    return `<g data-wheel="${i}">${digits}</g>`;
  }).join("");
  const dividers = [1, 2].map((i) => `M${(cell * i).toFixed(2)} 0V${WIN.h}`).join("");
  return `<g transform="${M}">
    <clipPath id="dp-win"><path d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/>
    <g clip-path="url(#dp-win)">${columns}
      <path class="dp-curve" d="M0 0H${WIN.w}V2.2H0Z"/><path class="dp-curve" d="M0 ${WIN.h - 2.2}H${WIN.w}V${WIN.h}H0Z"/>
      <path class="dp-wall" d="M0 0H${WIN.w}V1H1V${WIN.h}H0Z"/></g>
    <path class="iso-line" data-tone="faint" d="${dividers}"/>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/>
  </g>`;
}

// Cooling louvers low on the counter's front face, in the face's own plane.
function louvers() {
  const M = k.sideMatrix([CNT.x + CNT.w - 22, CNT_FACE], 16, P, "left");
  const slots = [0, 1, 2, 3, 4].map((i) => rrect(i * 3.6, 0, 1.8, 9, 0.9)).join("");
  return `<g transform="${M}"><path class="dp-wall" d="${slots}"/><path class="iso-line" data-tone="lo" d="${slots}"/></g>`;
}

// The rating plate on the counter's side, above the reset crank.
function ratingPlate() {
  const face = CNT.x + CNT.w;
  const front = CNT.y + CNT.d - 4;
  const M = k.sideMatrix([face, front], 38, P, "right");
  const lines = [[2.4, 3.2, 10], [2.4, 5.4, 7], [2.4, 7.6, 12]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  return `<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 17, 10, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 17, 10, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`
    + D([at([face, front - 1.4, 38 - 9]), at([face, front - 15.6, 38 - 9])], { size: 0.4 });
}

// A knurled reset crank on the counter's side.
function sideCrank() {
  const F = G.frameAlong([CNT.x + CNT.w, CNT.y + 12, 22], X);
  const ribs = G.ribsOf(F, 1.4, 5.2, 3, 26, P, { fade: [0.1, 0.55], seams: true });
  return S(G.disc(0, 1.4, 4.2, F, P), { tone: "lo" }) + S(G.solidOf([[1.4, 3], [5.2, 3], [5.2, 1.4], [6.4, 1.4]], F, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) });
}

// The card punch behind the hopper: the client, where a command is made before it is queued.
const PUNCH = { x: -110, y: -53, w: 33, d: 22, r: 2.5 };
const PUNCH_Z = 6;
function punch() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PUNCH, 0, 2, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(PUNCH, 0, PUNCH_Z, P, 4, 0.6), { tone: "mid" }));
  out.push(D([[PUNCH.x + 3, PUNCH.y + 3], [PUNCH.x + 3, PUNCH.y + PUNCH.d - 3]].map(([x, y]) => at([x, y, PUNCH_Z])), { size: 0.45 }));
  // The die straddles the card: back cheek, the card, front cheek, then the bridge over both.
  const die = { x: PUNCH.x + 3, w: 8 };
  const cheek = (y) => S(k.slabOf({ x: die.x, y, w: die.w, d: 2.4, r: 0.6 }, PUNCH_Z, 8, P, 2, 0.4), { tone: "mid" });
  out.push(cheek(PUNCH.y + 0.4));
  const cy = PUNCH.y + PUNCH.d / 2;
  const cx = PUNCH.x + 1.5;
  const ring = CARD_RING.map(([x, y]) => [x + cx, y + cy]);
  const blank = k.extrude(ring, PUNCH_Z, T, P);
  const holes = [[0, 1], [1, 3]].map(([c, r]) => k.planOutline({ x: cx + COLS[c] - 0.6, y: cy + ROWS[r] - 1.1, w: 1.2, d: 2.2, r: 0.3 }, PUNCH_Z + T, P, 2)).join("");
  out.push(S(blank, { tone: "hi", crease: "lo" }), `<path class="dp-hole" d="${holes}"/>`, L(holes, { tone: "lo" }));
  out.push(cheek(PUNCH.y + PUNCH.d - 2.8));
  const bridge = { x: die.x, y: PUNCH.y + 0.4, w: die.w, d: PUNCH.d - 0.8, r: 0.8 };
  out.push(S(k.slabOf(bridge, PUNCH_Z + 8, 3, P, 3, 0.5), { tone: "mid" }));
  out.push(D([[bridge.x + 2, bridge.y + 2], [bridge.x + 2, bridge.y + bridge.d - 2]].map(([x, y]) => at([x, y, PUNCH_Z + 11])), { size: 0.4 }));
  // The hand lever on its hinge, angled up over the card, with a ball grip.
  const pivot = [die.x + die.w / 2, cy, PUNCH_Z + 12.6];
  out.push(S(k.slabOf({ x: pivot[0] - 2.4, y: cy - 3.5, w: 4.8, d: 7, r: 0.8 }, PUNCH_Z + 11, 3.2, P, 2, 0.3), { tone: "mid" }));
  out.push(S(G.disc(-3.6, 3.6, 1.1, G.frameAlong(pivot, Y), P), { tone: "mid" }));
  const arm = [-0.93, 0, 0.37];
  out.push(S(G.solidOf([[0, 0.95], [11, 0.95]], G.frameAlong(pivot, arm), P), { tone: "mid" }));
  out.push(S(G.sphereOf([pivot[0] + 12.6 * arm[0], cy, pivot[2] + 12.6 * arm[2]], 2.2, P), { tone: "mid" }));
  return out.join("");
}

// The machine frame and the bodies of the hopper, bed and stacker.
function frame() {
  const out = [`<path class="iso-halo" d="${k.haloOf(FRAME, 0, 2, P)}" style="filter:blur(3px)"/>`];
  const seam = k.sideSeam(FRAME, FRAME_Z - 1.4, P, 4);
  out.push(S(k.slabOf(FRAME, 0, FRAME_Z, P, 4, 0.6), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(D([-116, -84, -46, -12, 22, 40].map((x) => at([x, FRAME.y + FRAME.d - 1.6, FRAME_Z])), { size: 0.4 }));
  return out.join("");
}

function hopperBack() {
  const out = [S(k.slabOf(HOP, FRAME_Z, Z_HOP - FRAME_Z, P, 3, 0.5), { tone: "mid" })];
  out.push(S(k.slabOf({ x: HOP.x + 1, y: -14, w: 3.4, d: 28, r: 0.8 }, Z_HOP, WALL_TOP - Z_HOP, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: HOP.x + 1, y: -14, w: 34, d: 3, r: 0.8 }, Z_HOP, WALL_TOP - Z_HOP, P, 3, 0.4), { tone: "mid" }));
  out.push(D([[HOP.x + 2.7, -8], [HOP.x + 2.7, 8]].map(([x, y]) => at([x, y, WALL_TOP])), { size: 0.4 }));
  return out.join("");
}

// The front guide of the hopper, in two pieces with a thumb notch that shows the stack.
function hopperFront() {
  const out = [];
  for (const [x, w] of [[HOP.x + 1, 13], [HOP.x + 24, 11]]) {
    out.push(S(k.slabOf({ x, y: 11, w, d: 3, r: 0.8 }, Z_HOP, WALL_TOP - Z_HOP, P, 3, 0.4), { tone: "mid" }));
    out.push(D([at([x + w / 2, 12.5, WALL_TOP])], { size: 0.4 }));
  }
  return out.join("");
}

function bed() {
  const out = [S(k.slabOf(BED, FRAME_Z, Z_BED - FRAME_Z, P, 3, 0.6), { tone: "mid" })];
  // Index marks along the bed's front face: the read station is the long one.
  const ticks = k.sideTicks(BED.x + 4, BED.x + BED.w - 4, 3, 5, BED.y + BED.d, Z_BED, [1.4, 2.6], P, "x");
  const station = k.segment([READ_X + LEN / 2, BED.y + BED.d, Z_BED], [READ_X + LEN / 2, BED.y + BED.d, FRAME_Z], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }), L(station, { tone: "hi" }));
  out.push(S(k.slabOf({ x: BED.x, y: -12, w: BED.w, d: 2, r: 0.5 }, Z_BED, T, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

function bedFront() {
  return S(k.slabOf({ x: BED.x, y: 10, w: BED.w, d: 2, r: 0.5 }, Z_BED, T, P, 2), { tone: "mid", crease: "none" });
}

// A bearing block for a roller axle, with the axle end showing on its outer face.
function block(x, y) {
  const plan = { x: x - 3, y, w: 6, d: 4, r: 0.8 };
  const out = [S(k.slabOf(plan, Z_BED, ROLL_Z + 3.4 - Z_BED, P, 3, 0.4), { tone: "mid" })];
  out.push(D([at([x, y + 2, ROLL_Z + 3.4])], { size: 0.4 }));
  if (y > 0) out.push(L(G.circleOf(G.frameAlong([x, y + 4, ROLL_Z], Y), 0, 1.1, P, 24), { tone: "lo" }), D([at([x, y + 4, ROLL_Z])], { size: 0.45 }));
  return out.join("");
}

// A rubber feed roller across the card path, its axle running into both blocks.
function roller(x) {
  const out = [];
  const F = G.frameAlong([x, -13, ROLL_Z], Y);
  out.push(S(G.disc(0, 26, 1.1, F, P), { tone: "mid" }));
  const R = G.frameAlong([x, -ROLL_Y, ROLL_Z], Y);
  const ribs = G.ribsOf(R, 0.8, 2 * ROLL_Y - 0.8, ROLL_R, 30, P, { fade: [0.1, 0.55], seams: true });
  out.push(S(G.solidOf([[0, ROLL_R - 0.6], [0.8, ROLL_R], [2 * ROLL_Y - 0.8, ROLL_R], [2 * ROLL_Y, ROLL_R - 0.6]], R, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) }));
  return out.join("");
}

function stackerBack() {
  const out = [S(k.slabOf(STK, FRAME_Z, Z_STK - FRAME_Z, P, 3, 0.5), { tone: "mid" })];
  out.push(S(k.slabOf({ x: STK.x, y: -15, w: STK.w, d: 3, r: 0.8 }, Z_STK, WALL_TOP - Z_STK, P, 3, 0.4), { tone: "mid" }));
  out.push(D([STK.x + 6, STK.x + STK.w - 6].map((x) => at([x, -13.5, WALL_TOP])), { size: 0.4 }));
  return out.join("");
}

function stackerFront() {
  const out = [];
  // End wall the cards stop against, then the two front pieces with a thumb notch between them.
  const end = { x: STK.x + STK.w - 3, y: -12, w: 3, d: 24, r: 0.6 };
  out.push(S(k.slabOf(end, Z_STK, WALL_TOP - Z_STK, P, 2, 0.4), { tone: "mid" }));
  for (const [x, w] of [[STK.x, 13], [STK.x + 25, 15]]) {
    out.push(S(k.slabOf({ x, y: 12, w, d: 3, r: 0.8 }, Z_STK, WALL_TOP - Z_STK, P, 3, 0.4), { tone: "mid" }));
    out.push(D([at([x + w / 2, 13.5, WALL_TOP])], { size: 0.4 }));
  }
  return out.join("");
}

// One card at the origin: x 0..30, y −9..9, z 0..1.4. The live code moves it.
function card(command, index) {
  const out = [];
  const solid = k.extrude(CARD_RING, 0, T, P);
  out.push(S(solid, { tone: "hi", crease: "lo" }));
  const holes = PUNCHES[index].map(([c, r]) => k.planOutline({ x: COLS[c] - 0.6, y: ROWS[r] - 1.1, w: 1.2, d: 2.2, r: 0.3 }, T, P, 2)).join("");
  out.push(`<path class="dp-hole" d="${holes}"/>`, L(holes, { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([2.6, 3.4], T, P, "x"), command.code, { size: 5.4, tone: "hi" }));
  out.push(L([[22, -5.4, 6], [22, -2.6, 4.4], [22, 0.2, 5.2]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], T, P)).join(""), { tone: "lo", free: true }));
  return `<g data-card="${index}">${out.join("")}</g>`;
}

// The read head with its pins, and the guide rods it slides on.
function head() {
  const out = [];
  const pins = [];
  for (const x of COLS) for (const y of ROWS) pins.push([READ_X + x, y]);
  for (const [x, y] of byDepth(pins)) out.push(S(G.solidOf([[0, 0.3], [0.5, 0.55], [PIN, 0.55]], G.frameAlong([x, y, HEAD_Z[0] - PIN], [0, 0, 1]), P), { tone: "mid" }));
  const seam = k.sideSeam(HEAD, HEAD_Z[0] + 2.2, P, 3);
  out.push(S(k.slabOf(HEAD, HEAD_Z[0], HEAD_Z[1] - HEAD_Z[0], P, 3, 0.6), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(D([[HEAD.x + 2, HEAD.y + 2], [HEAD.x + HEAD.w - 2, HEAD.y + HEAD.d - 2], [HEAD.x + 2, HEAD.y + HEAD.d - 2], [HEAD.x + HEAD.w - 2, HEAD.y + 2]].map(([x, y]) => at([x, y, HEAD_Z[1]])), { size: 0.4 }));
  return out.join("");
}

// The guide rods below the beam: fixed to the head, they rise into the beam.
function rod(y) {
  const x = HEAD.x + HEAD.w / 2;
  return `<g data-part="head">${S(k.cylinder(x, y, ROD.r, HEAD_Z[1], BEAM_Z + 2 - HEAD_Z[1], P, 16), { tone: "mid" })}</g>`;
}

// Above the beam each rod carries a collar, and a return spring sits between the
// collar and the beam. Pressing the head pulls the collar down onto the spring.
// The page rebuilds this markup every frame from the same function.
function rodTop(y, press, R) {
  const top = R.top - press * R.stroke;
  const c = zcoil(R.x, y, R.coil, R.beamTop, top - 1.2, R.turns, P);
  return lineSvg(c.back, { tone: "lo" })
    + solidSvg(cylinder(R.x, y, R.r, R.beamTop, top - 1.2 - R.beamTop, P, 16), { tone: "mid" })
    + lineSvg(c.front, { tone: "mid" })
    + solidSvg(cylinder(R.x, y, 2, top - 1.2, 1.2, P, 24, 0.3), { tone: "mid" });
}

function postAt(y) {
  const plan = { x: POST_X, y, w: POST_W, d: 4, r: 1 };
  return S(k.slabOf(plan, Z_BED, BEAM_Z - Z_BED, P, 3, 0.5), { tone: "mid" });
}

// The beam: bolted to the counter's flange, resting on the back post, reaching out over the bed.
const BEAM_END = 11;
function beam() {
  const plan = { x: POST_X, y: CNT_FACE + FLANGE.d, w: POST_W, d: BEAM_END - CNT_FACE - FLANGE.d, r: 1.2 };
  const out = [S(k.slabOf(plan, BEAM_Z, 4, P, 3, 0.6), { tone: "mid" })];
  out.push(D([[-37, -15], [-33, -15], [-37, -21], [-33, -21]].map(([x, y]) => at([x, y, BEAM_Z + 4])), { size: 0.45 }));
  out.push(L(RODS.map((y) => k.ring(ROD.x, y, ROD.coil, ROD.beamTop, P, 24)).join(""), { tone: "lo" }));
  return out.join("");
}

// The control panel in front: Run and Undo buttons.
const PANEL = { x: -58, y: 21, w: 46, d: 10, r: 2 };
const BUTTONS = [-46, -28];
function panel() {
  const out = [S(k.slabOf(PANEL, 0, 3.4, P, 4, 0.6), { tone: "mid" })];
  out.push(D([[PANEL.x + 3, PANEL.y + 5], [PANEL.x + PANEL.w - 3, PANEL.y + 5]].map(([x, y]) => at([x, y, 3.4])), { size: 0.45 }));
  BUTTONS.forEach((x, i) => {
    const y = PANEL.y + 5;
    out.push(S(k.cylinder(x, y, 4.4, 3.4, 0.8, P, 32), { tone: "lo" }));
    const cap = S(k.cylinder(x, y, 3.3, 4.2, 2, P, 32, 0.4), { tone: "mid" });
    // Run points down the line, toward the stacker; Undo points back.
    const glyph = i === 0
      ? k.onTop([[x - 1.2, y - 1.5], [x + 1.6, y], [x - 1.2, y + 1.5]], 6.2, P, true)
      : k.onTop([[x - 2, y], [x - 0.5, y - 1.5], [x - 0.5, y - 0.5], [x + 1.8, y - 0.5], [x + 1.8, y + 0.5], [x - 0.5, y + 0.5], [x - 0.5, y + 1.5]], 6.2, P, true);
    out.push(`<g data-button="${i}">${cap}${L(glyph, { tone: "lo" })}</g>`);
  });
  return out.join("");
}

function labelPlate() {
  const label = { x: -112, y: 21, w: 38, d: 10, r: 1.5 };
  const out = [S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-106, 24.5, 22], [-106, 27, 15], [-106, 29.5, 19]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 5, 0.8]), at([label.x + label.w - 2.6, label.y + 5, 0.8])], { size: 0.4 }));
  return out.join("");
}

// The pose of every moving part at timeline value t (0 = queued … 4 = undone).
// Shared with the page: the live code inlines this function's source.
function poseAt(t, M) {
  const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const lerp = (a, b, u) => a + (b - a) * u;
  const n = M.cards;
  const hop = (i) => M.zHop + (n - 1 - i) * M.T;
  const stk = (i) => M.zStk + i * M.T;
  const cards = [];
  let press = 0;
  const buttons = [0, 0];
  for (let i = 0; i < n; i++) {
    let x = M.hopX, z = hop(i);
    if (t > i) {
      if (t >= i + 1) { x = M.stkX; z = stk(i); }
      else {
        const u = t - i;
        if (u < 0.36) { const s = smooth(0, 0.36, u); x = lerp(M.hopX, M.readX, s); z = lerp(hop(i), M.zBed, smooth(0, 0.35, s)); }
        else if (u < 0.62) { x = M.readX; z = M.zBed; }
        else { const s = smooth(0.62, 1, u); x = lerp(M.readX, M.stkX, s); z = lerp(M.zBed, stk(i), smooth(0.8, 1, s)); }
      }
    }
    if (i === n - 1 && t > n) {
      const u = Math.min(1, t - n);
      const s = smooth(0, 0.45, u);
      x = lerp(M.stkX, M.readX, s);
      z = lerp(stk(i), M.zBed, smooth(0, 0.2, s));
    }
    cards.push([x, z]);
  }
  const seg = Math.min(Math.floor(t), n);
  const u = t - seg;
  if (seg < n) {
    press = smooth(0.38, 0.45, u) * (1 - smooth(0.53, 0.6, u));
    buttons[0] = smooth(0, 0.04, u) * (1 - smooth(0.08, 0.14, u));
  } else if (t > n) {
    press = smooth(0.5, 0.57, u) * (1 - smooth(0.7, 0.78, u));
    buttons[1] = smooth(0, 0.04, u) * (1 - smooth(0.08, 0.14, u));
  }
  // The wheels roll while the head is down.
  const from = M.stock[seg], to = M.stock[Math.min(seg + 1, M.stock.length - 1)];
  const roll = seg < n ? smooth(0.42, 0.56, u) : smooth(0.56, 0.72, u);
  const digits = [100, 10, 1].map((place) => lerp(Math.floor(from / place) % 10, Math.floor(to / place) % 10, roll));
  return { cards, press, buttons, digits };
}

const MOTION = { cards: COMMANDS.length, T, zHop: Z_HOP, zBed: Z_BED, zStk: Z_STK, hopX: HOP_X, readX: READ_X, stkX: STK_X, stock: STOCK };

const START = 2;
const startPose = poseAt(START, MOTION);
const cardsSvg = COMMANDS.map((command, i) => {
  const [x, z] = startPose.cards[i];
  return card(command, i).replace(`<g data-card="${i}">`, `<g data-card="${i}" transform="${k.translateAlong(P, [x, 0, z])}">`);
});
// At rest the stacker holds the cards in order, the newest on top.
const cardOrder = [0, 1, 2].sort((a, b) => startPose.cards[a][1] - startPose.cards[b][1]);

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Hình vẽ một máy đọc phiếu đục lỗ. Bên trái là khay nạp chứa các phiếu lệnh đang chờ. Ở giữa là bàn đọc, phía trên có đầu đọc treo trên một dầm nối với bộ đếm tồn kho ba bánh số. Bên phải là khay lịch sử, còn phía sau là bàn đục phiếu, nơi lập phiếu mới. Mỗi lần chạy, máy kéo phiếu trên cùng của khay nạp vào dưới đầu đọc, đầu đọc hạ xuống, bánh số quay tới tồn kho mới rồi phiếu rơi sang khay lịch sử. Khi hoàn tác, máy rút phiếu trên cùng của khay lịch sử về đầu đọc và bánh số quay ngược lại.",
  body: [
    base(),
    punch(),
    counter(),
    frame(),
    hopperBack(),
    bed(),
    block(ROLL_X[0], -17),
    block(ROLL_X[1], -17),
    postAt(-17),
    stackerBack(),
    `<g data-part="cards">${cardOrder.map((i) => cardsSvg[i]).join("")}</g>`,
    stackerFront(),
    roller(ROLL_X[0]),
    roller(ROLL_X[1]),
    bedFront(),
    block(ROLL_X[0], 13),
    block(ROLL_X[1], 13),
    `<g data-part="head">${head()}</g>`,
    RODS.map((y) => rod(y)).join(""),
    beam(),
    RODS.map((y, i) => `<g data-rodtop="${i}">${rodTop(y, startPose.press, ROD)}</g>`).join(""),
    hopperFront(),
    labelPlate(),
    panel(),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const M = ${JSON.stringify(MOTION)};
const LEN = ${LEN}, STROKE = ${STROKE}, PITCH = ${PITCH};
const ROD = ${JSON.stringify(ROD)}, RODS = ${JSON.stringify(RODS)};
${zcoil.toString()}
${rodTop.toString()}
${poseAt.toString()}
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const deck = svg.querySelector('[data-part="cards"]');
const cards = [...svg.querySelectorAll("[data-card]")].sort((a, b) => a.dataset.card - b.dataset.card);
const bodies = cards.map((el) => el.querySelector(".iso-solid"));
const heads = svg.querySelectorAll('[data-part="head"]');
const rodTops = RODS.map((_, i) => svg.querySelector('[data-rodtop="' + i + '"]'));
const wheels = [...svg.querySelectorAll("[data-wheel]")];
const buttons = [...svg.querySelectorAll("[data-button]")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const N = STEPS.length;
const SEG = 2.6, TOUR = 4.4;
let sel = ${START}, t = sel, frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0, order = "", pressed = -1, aim = sel, speed = 1 / SEG;
const cmd = (i) => COMMANDS[i].name;
function settledText(n) {
  const s = STEPS[n];
  if (s.action === "queue") return COMMANDS.length + " phiếu chờ · tồn kho " + STOCK[0];
  const arrow = STOCK[n - 1] + " → " + STOCK[n];
  return (s.action === "undo" ? "hoàn tác " : "") + cmd(s.card) + " · " + arrow;
}
function stepText(n) {
  const s = STEPS[n];
  if (s.action === "queue") { const count = say(COMMANDS.length); return "Bước " + (n + 1) + ". " + count[0].toUpperCase() + count.slice(1) + " phiếu lệnh đang chờ, tồn kho " + STOCK[0] + "."; }
  const way = STOCK[n] > STOCK[n - 1] ? " lên " : " xuống ";
  return "Bước " + (n + 1) + ". " + (s.action === "undo" ? "Hoàn tác lệnh " : "Chạy lệnh ") + cmd(s.card) + ", tồn kho từ " + STOCK[n - 1] + way + STOCK[n] + ".";
}
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", stepText(sel));
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
const tourFrom = (index) => ((index - ${START} + N) % N) * TOUR;
function draw() {
  const pose = poseAt(t, M);
  pose.cards.forEach(([x, z], i) => cards[i].setAttribute("transform", translateAlong(P, [x, 0, z])));
  // Cards whose footprints overlap stack by height; otherwise the nearer one (larger x) is drawn later.
  const ranked = [0, 1, 2].sort((a, b) => {
    const [xa, za] = pose.cards[a], [xb, zb] = pose.cards[b];
    return Math.abs(xa - xb) < LEN ? za - zb : xa - xb;
  });
  const key = ranked.join("");
  if (key !== order) { order = key; ranked.forEach((i) => deck.appendChild(cards[i])); }
  const dz = translateAlong(P, [0, 0, -pose.press * STROKE]);
  heads.forEach((el) => el.setAttribute("transform", dz));
  if (pose.press !== pressed) {
    pressed = pose.press;
    RODS.forEach((y, i) => { rodTops[i].innerHTML = rodTop(y, pressed, ROD); });
  }
  pose.digits.forEach((d, i) => wheels[i].setAttribute("transform", "translate(0 " + (-d * PITCH).toFixed(3) + ")"));
  pose.buttons.forEach((b, i) => buttons[i].setAttribute("transform", translateAlong(P, [0, 0, -1.2 * b])));
  // The lit card is the one the machine is running or ran last.
  const lit = t <= 0 ? -1 : t > COMMANDS.length ? COMMANDS.length - 1 : Math.ceil(t) - 1;
  bodies.forEach((body, i) => {
    body.toggleAttribute("data-lit", i === lit);
    body.querySelector(".iso-edge").setAttribute("data-tone", i === lit ? "lit" : "hi");
  });
  let text;
  if (t === sel) text = settledText(sel);
  else if (sel < t) text = "đang tua lại";
  else {
    const s = STEPS[Math.floor(t) + 1];
    text = (s.action === "undo" ? "đang hoàn tác " : "đang chạy ") + cmd(s.card);
  }
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    const next = (Math.floor(clock / TOUR) + ${START}) % N;
    if (next !== sel) { sel = next; describe(); }
  }
  // Play the timeline toward the chosen step at the speed set when it was chosen.
  if (sel !== aim) { aim = sel; const gap = Math.abs(sel - t); speed = (1 + 1.2 * Math.max(0, gap - 1)) * (sel < t ? 1.8 : 1) / SEG; }
  const gap = sel - t;
  t = calm || Math.abs(gap) <= speed * dt ? sel : t + Math.sign(gap) * speed * dt;
  draw();
  const settled = !touring && t === sel;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; clock = tourFrom(sel); emit(); run(); }, 3600);
  if (index !== sel) { sel = index; describe(); } else emit();
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
const vnd = (n) => `<strong>${n}</strong>`;
const code = (text) => `<code>${text}</code>`;
const cap = (text) => text[0].toUpperCase() + text.slice(1);
const steps = STEPS.map((step, n) => {
  if (step.action === "queue") {
    return {
      label: "Xếp hàng",
      short: "Chờ",
      caption: `${cap(say(COMMANDS.length))} phiếu lệnh đang nằm chờ trong khay nạp, phiếu trên cùng sẽ chạy trước. Chưa phiếu nào chạy nên tồn kho vẫn là ${vnd(STOCK[0])}.`,
    };
  }
  const c = COMMANDS[step.card];
  const before = replay(n - 1);
  const after = replay(n);
  if (step.action === "undo") {
    const back = c.kind === "ship" ? `trả lại ${c.qty} sản phẩm vào kho` : `lấy bớt ${c.qty} sản phẩm ra`;
    return {
      label: "Hoàn tác",
      short: "Undo",
      caption: `Bạn bấm Hoàn tác, máy rút phiếu “${c.name}” trên cùng khay lịch sử về đầu đọc và gọi ${code("undo()")} để ${back}. Tồn kho quay về ${vnd(after.stock)}.`,
    };
  }
  const left = after.queue.length;
  const change = after.stock > before.stock ? `tăng từ ${before.stock} lên` : `giảm từ ${before.stock} xuống`;
  return {
    label: c.name,
    short: c.code,
    caption: `Máy kéo phiếu “${c.name}” vào dưới đầu đọc và gọi ${code("execute()")}, tồn kho ${change} ${vnd(after.stock)}. Phiếu được cất lên đầu khay lịch sử, ${left === 0 ? "khay nạp giờ đã trống" : `khay nạp còn ${say(left)} phiếu`}.`,
  };
});

export const plate = withSteps(k.plateHtml({
  fig: "Fig 5",
  title: "Command",
  hint: "Rê chuột để chọn bước",
  readout: `${COMMANDS[STEPS[START].card].name} · ${STOCK[START - 1]} → ${STOCK[START]}`,
  keys: [
    { mark: "lit", label: "Phiếu lệnh máy đang chạy hoặc vừa chạy xong" },
    { mark: "raised", label: "Khay nạp bên trái là hàng đợi, khay bên phải là lịch sử để hoàn tác" },
  ],
  caption:
    "Mỗi thao tác kho là một tấm phiếu ghi sẵn việc cần làm và cách đảo ngược nó. Cỗ máy không biết gì về kho, nó chỉ kéo phiếu từ khay nạp, cho đầu đọc chạy rồi xếp phiếu sang khay lịch sử. Vì lệnh đã thành một vật cầm được, nên xếp hàng, ghi lại, chạy lại hay hoàn tác đều chỉ là chuyện di chuyển tấm phiếu.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Hình Command, dùng phím mũi tên để đi qua từng bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước chạy và hoàn tác lệnh", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-curve{fill:var(--anatomy-shade-1);opacity:.7}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-digit{letter-spacing:0}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
