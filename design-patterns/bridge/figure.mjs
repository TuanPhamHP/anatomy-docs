// The Bridge figure: a selector bench with two independent carriages. The back
// carriage holds the three message heads (the abstraction: what the message
// says), the front carriage holds the channel units (the implementation: how
// it is sent). Each carriage slides on its own rails. Every head and every unit
// carries the same standard peg on top, and a link bar on the centre column
// drops onto the two pegs that meet in the middle: that bar is the bridge, so
// any head works with any unit. A new channel is one more unit slid onto the
// empty seat; a counter shows how many classes each design needs (model.mjs).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { CHANNELS, KINDS, STEPS, channelsAt, counts } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 390;

const PLATE = { x: -114, y: -66, w: 228, d: 132, r: 9 };
const PLATE_H = 12;
const FOOT_H = 5;

// Two rows of carriages along x, with the bridge column between them at (0, 0).
const ROW_K = -22;
const ROW_C = 22;
const KX = [-28, 0, 28];
const CX = [-39, -13, 13, 39];
const KIND_STOP = KX.map((x) => -x);
const CHAN_STOP = CX.map((x) => -x);
const CAR_Z = 3;
const CAR_TOP = 9;
const MOD = { w: 22, d: 20 };
const MOD_TOP = 33;
const PEG = { r: 1.6, collar: 2.7, in: 6.5 };
const PEG_Y = [ROW_K + PEG.in, ROW_C - PEG.in];

// The link bar on the column: lowered it rests on the two collars, raised it clears every head.
const BAR = { w: 6, half: 19.5, t: 3 };
const BAR_LOW = MOD_TOP + 0.6;
const LIFT = 12;
const BLOCK = { x: -4.6, y: -4.6, w: 9.2, d: 9.2, r: 1.2 };
const BLOCK_H = 9;
const COLUMN = { r: 3, top: 58 };

// The new channel waits on a pad in front of the rails and slides onto the empty seat.
const PAD = { x: 59, y: 40, w: 22, d: 22, r: 2 };
const PAD_X = PAD.x + PAD.w / 2;
const PAD_Y = PAD.y + PAD.d / 2;
const INSTALL = PAD_X - CX[3];

const COUNTER = { x: -108, y: 40, w: 38, d: 22, r: 3 };
const COUNTER_H = 27;
const RULER = { x: -62, y: 45, w: 112, d: 6, r: 1 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, COLUMN.top + 2], ...k.boxCorners({ x: -48, y: -36, w: 96, d: 72 }, 0, MOD_TOP + LIFT + BLOCK_H)],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 37 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const UP = [0, 0, 1];
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const two = (n) => String(n).padStart(2, "0");

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 20).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate on the back strip.
  const label = { x: -96, y: -60, w: 40, d: 13, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-90, -56, 22], [-90, -53.2, 15], [-90, -50.4, 19]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 6.5, 0.8]), at([label.x + label.w - 2.6, label.y + 6.5, 0.8])], { size: 0.4 }));
  // Front ruler for the channel carriage: a major tick at every seat's stop.
  out.push(S(k.slabOf(RULER, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const stops = [...CHAN_STOP, INSTALL];
  const minor = [];
  for (let x = RULER.x + 3.5; x <= RULER.x + RULER.w - 3.5 + 1e-9; x += 3.5) {
    if (!stops.some((s) => Math.abs(s - x) < 1.2)) minor.push(k.lineOnTop([x, RULER.y + 0.8], [x, RULER.y + 2.4], 0.6, P));
  }
  const major = stops.map((x) => k.lineOnTop([x, RULER.y + 0.8], [x, RULER.y + 4.2], 0.6, P));
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  out.push(D([at([RULER.x + 1.6, RULER.y + 3, 0.6]), at([RULER.x + RULER.w - 1.6, RULER.y + 3, 0.6])], { size: 0.4 }));
  return out.join("");
}

function rails(y0, y1) {
  const out = [];
  for (const y of [y0, y1]) {
    out.push(S(k.slabOf({ x: -102, y, w: 204, d: 4, r: 1 }, 0, CAR_Z, P, 3, 0.4), { tone: "mid" }));
    out.push(D([-96, -48, 0, 48, 96].map((x) => at([x, y + 2, CAR_Z])), { size: 0.38, tone: "lo" }));
  }
  return out.join("");
}

function endStop(x, y0) {
  const plan = { x, y: y0 - 2, w: 4, d: 22, r: 1.2 };
  return S(k.slabOf(plan, 0, 7, P, 3, 0.5), { tone: "mid" }) + D([y0 + 2, y0 + 16].map((y) => at([x + 2, y, 7])), { size: 0.42 });
}

function carriagePlate(plan, rows) {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 3), CAR_Z, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(plan, CAR_Z, CAR_TOP - CAR_Z, P, 5, 0.6), { tone: "mid" }));
  for (const x of [plan.x + 1, plan.x + plan.w - 8]) {
    for (const y of rows) {
      out.push(S(k.slabOf({ x, y: y - 4, w: 7, d: 8, r: 1.4 }, CAR_TOP, 2.4, P, 3, 0.4), { tone: "mid" }));
      out.push(D([at([x + 3.5, y, CAR_TOP + 2.4])], { size: 0.42 }));
    }
  }
  return out.join("");
}

// The standard peg every head and every unit carries: a collar and a pin.
function peg(x, y) {
  return S(k.cylinder(x, y, PEG.collar, MOD_TOP, 0.6, P, 24), { tone: "mid" }) + S(k.cylinder(x, y, PEG.r, MOD_TOP + 0.6, 3.2, P, 20), { tone: "mid" });
}

function moduleBody(mx, my, extra = {}) {
  const plan = { x: mx - MOD.w / 2, y: my - MOD.d / 2, w: MOD.w, d: MOD.d, r: 2.4 };
  const seam = k.sideSeam(plan, CAR_TOP + 5, P, 3);
  return S(k.slabOf(plan, CAR_TOP, MOD_TOP - CAR_TOP, P, 3, 0.8), { tone: "hi", crease: "lo", inner: L(seam, { tone: "faint" }), ...extra })
    + L(k.planOutline(k.insetPlan(plan, 2.4), MOD_TOP, P, 3), { tone: "faint" });
}

// Message heads: the same body and peg, and a top fitting that says what kind of message it is.
function head(kind, mx) {
  const my = ROW_K;
  const out = [moduleBody(mx, my)];
  // A plain face plate on the front, held by two screws.
  const M = k.sideMatrix([mx - MOD.w / 2, my + MOD.d / 2], MOD_TOP - 4, P, "left");
  out.push(`<g transform="${M}"><path class="dp-face" d="${rrect(4, 2, 14, 10, 1.2)}"/><path class="iso-line" data-tone="lo" d="${rrect(4, 2, 14, 10, 1.2)}"/><path class="iso-line" data-tone="faint" data-free="" d="M7 5.4H15M7 7.6H12.6"/></g>`);
  out.push(D([at([mx - 5.4, my + MOD.d / 2, MOD_TOP - 13]), at([mx + 5.4, my + MOD.d / 2, MOD_TOP - 13])], { size: 0.38 }));
  const fy = my - 4.2;
  if (kind.id === "alert") {
    // A beacon dome on a short base.
    out.push(S(k.cylinder(mx, fy, 4.6, MOD_TOP, 1.8, P, 32), { tone: "mid" }));
    const F = G.frameAlong([mx, fy, MOD_TOP + 1.8], UP);
    out.push(S(G.solidOf([[0, 3.9], [1.4, 3.8], [2.6, 3.3], [3.6, 2.5], [4.3, 1.4], [4.6, 0.3]], F, P), { tone: "hi", crease: "lo" }));
  } else if (kind.id === "reminder") {
    // A clock dial with its two hands.
    out.push(S(k.cylinder(mx, fy, 5.2, MOD_TOP, 1.6, P, 36), { tone: "mid" }));
    const z = MOD_TOP + 1.6;
    const ticks = k.radialTicks(mx, fy, 4.4, 12, 3, z, [0.7, 1.3], P);
    out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    out.push(L(k.lineOnTop([mx, fy], [mx - 2.6, fy], z, P) + k.lineOnTop([mx, fy], [mx, fy + 3.2], z, P), { tone: "hi" }));
    out.push(D([at([mx, fy, z])], { size: 0.5, tone: "hi" }));
  } else {
    // A price tag lying on the lid, with its string hole.
    const tag = [[mx - 7.5, fy], [mx - 3.6, fy - 3.8], [mx + 6.2, fy - 3.8], [mx + 6.2, fy + 3.8], [mx - 3.6, fy + 3.8]];
    out.push(S(k.extrude(tag, MOD_TOP, 1.2, P, { bevel: 0.3 }), { tone: "mid" }));
    out.push(L(k.ring(mx - 3.4, fy, 1, MOD_TOP + 1.2, P, 16), { tone: "lo" }));
    out.push(L(k.lineOnTop([mx - 0.6, fy - 1.6], [mx + 4.4, fy - 1.6], MOD_TOP + 1.2, P) + k.lineOnTop([mx - 0.6, fy + 0.4], [mx + 3, fy + 0.4], MOD_TOP + 1.2, P), { tone: "faint", free: true }));
  }
  out.push(peg(mx, PEG_Y[0]));
  return `<g data-part="head" data-kind="${kind.id}">${out.join("")}</g>`;
}

// Channel units: the same body and peg, and a face on the front that says how it sends.
function unit(channel, mx) {
  const my = ROW_C;
  const out = [moduleBody(mx, my)];
  const M = k.sideMatrix([mx - MOD.w / 2, my + MOD.d / 2], MOD_TOP - 2, P, "left");
  let icon = "";
  if (channel.id === "email") icon = `<path class="dp-face" d="${rrect(5, 5, 12, 8.5, 1)}"/><path class="iso-line" data-tone="mid" d="${rrect(5, 5, 12, 8.5, 1)}M5.4 5.6L11 10L16.6 5.6"/>`;
  else if (channel.id === "sms") icon = `<path class="dp-face" d="${rrect(6, 4, 10, 10, 1.2)}"/><path class="iso-line" data-tone="mid" d="${rrect(6, 4, 10, 10, 1.2)}"/><path class="iso-line" data-tone="lo" data-free="" d="M8 7.4H14M8 9.6H12.6M8 11.8H13.4"/>`;
  else if (channel.id === "push") icon = `<path class="dp-face" d="${circle(11, 9, 4.8)}"/><path class="iso-line" data-tone="mid" d="${circle(11, 9, 4.8)}${circle(11, 9, 2.2)}"/>`;
  else icon = `<path class="dp-face" d="${rrect(5, 4.4, 12, 8.4, 3)}"/><path class="iso-line" data-tone="mid" d="M8 4.4H14Q17 4.4 17 7.4V9.8Q17 12.8 14 12.8H10L7.6 15.2L8 12.8Q5 12.8 5 9.8V7.4Q5 4.4 8 4.4Z"/>`;
  out.push(`<g transform="${M}">${icon}<path class="dp-lamp" data-part="lamp" d="${circle(18.6, 18.6, 1.2)}"/><path class="iso-line" data-tone="lo" d="${circle(18.6, 18.6, 1.2)}"/></g>`);
  out.push(D([at([mx - MOD.w / 2 + 2, my + MOD.d / 2, MOD_TOP - 21.5]), at([mx + MOD.w / 2 - 2, my + MOD.d / 2, MOD_TOP - 21.5])], { size: 0.38 }));
  if (channel.id === "sms") {
    // Antenna on the outer corner, clear of the link bar.
    out.push(S(k.cylinder(mx + 7, my + 6, 1.4, MOD_TOP, 1, P, 16), { tone: "mid" }));
    out.push(S(k.cylinder(mx + 7, my + 6, 0.6, MOD_TOP + 1, 7, P, 12), { tone: "mid" }));
    out.push(S(G.sphereOf([mx + 7, my + 6, MOD_TOP + 8.4], 1, P), { tone: "mid" }));
  }
  out.push(peg(mx, PEG_Y[1]));
  return `<g data-part="unit" data-channel="${channel.id}">${out.join("")}</g>`;
}

// The empty seat waiting for a new channel: its recess and two locating pins.
function emptySeat(mx) {
  const plan = { x: mx - MOD.w / 2 + 1, y: ROW_C - MOD.d / 2 + 1, w: MOD.w - 2, d: MOD.d - 2, r: 2 };
  return L(k.planOutline(plan, CAR_TOP, P, 3), { tone: "lo" })
    + S(k.cylinder(mx - 6, ROW_C, 1, CAR_TOP, 1.4, P, 14), { tone: "mid" }) + S(k.cylinder(mx + 6, ROW_C, 1, CAR_TOP, 1.4, P, 14), { tone: "mid" });
}

function kindsCarriage() {
  const plan = { x: -48, y: ROW_K - 12, w: 96, d: 24, r: 3 };
  const out = [carriagePlate(plan, [ROW_K - 7, ROW_K + 7])];
  KINDS.forEach((kind, i) => out.push(head(kind, KX[i])));
  // A knurled handle on the right end.
  const hx = plan.x + plan.w;
  out.push(S(k.slabOf({ x: hx, y: ROW_K - 1.4, w: 3.4, d: 2.8, r: 0.8 }, CAR_Z + 1, 2.6, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(hx + 6, ROW_K, 3, CAR_Z + 0.4, 5.4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(hx + 6, ROW_K, 3, CAR_Z + 0.4, CAR_Z + 5.8, 18, P), { tone: "lo" }));
  return out.join("");
}

function channelCarriage() {
  const plan = { x: -59, y: ROW_C - 12, w: 118, d: 24, r: 3 };
  const out = [carriagePlate(plan, [ROW_C - 7, ROW_C + 7])];
  out.push(emptySeat(CX[3]));
  CHANNELS.forEach((channel, i) => { if (!channel.added) out.push(unit(channel, CX[i])); });
  // Pointer over the front ruler.
  out.push(S(k.slabOf({ x: -1.6, y: plan.y + plan.d, w: 3.2, d: 9.5, r: 0.8 }, CAR_Z, 1.2, P, 3), { tone: "mid" }));
  out.push(L(k.lineOnTop([0, plan.y + plan.d], [0, plan.y + plan.d + 9.5], CAR_Z + 1.2, P), { tone: "hi" }));
  return out.join("");
}

function column() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 7, 0, 1.6, P, 36), { tone: "lo" }));
  out.push(D([[5.2, 0], [-5.2, 0], [0, 5.2], [0, -5.2]].map(([x, y]) => at([x, y, 1.6])), { size: 0.4 }));
  out.push(S(k.cylinder(0, 0, COLUMN.r, 1.6, COLUMN.top - 1.6, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, COLUMN.r + 0.8, COLUMN.top, 1.6, P, 28, 0.3), { tone: "mid" }));
  return out.join("");
}

// The slide on the column and the link bar it carries. Drawn after the front
// carriage: the bar rests on top of both rows.
function barHalf(y0, y1, hole) {
  const plan = { x: -BAR.w / 2, y: y0, w: BAR.w, d: y1 - y0, r: 1.6 };
  const z = BAR_LOW;
  const solid = S(k.slabOf(plan, z, BAR.t, P, 3, 0.5), { tone: "hi", crease: "lo" });
  const F = G.frameAlong([0, hole, z + BAR.t], UP);
  // The hole, and the peg's end that shows in it once the bar has dropped onto the peg.
  return `<g data-part="bar-solid">${solid}</g><path class="dp-hole" d="${G.circleOf(F, 0, PEG.r + 0.3, P, 24)}"/>`
    + `<path class="dp-pegend" data-part="pegend" d="${G.circleOf(F, 0.2, PEG.r, P, 24)}"/>`
    + L(G.circleOf(F, 0, PEG.r + 0.3, P, 24), { tone: "lo" });
}

function bridge() {
  const out = [];
  out.push(barHalf(-BAR.half, BLOCK.y, PEG_Y[0]));
  out.push(S(k.slabOf(BLOCK, BAR_LOW - 1, BLOCK_H, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.ring(0, 0, COLUMN.r + 0.2, BAR_LOW - 1 + BLOCK_H, P, 20), { tone: "lo" }));
  // Thumb screw that clamps the slide to the column.
  out.push(S(G.solidOf([[0, 1.1], [1.6, 1.1], [1.6, 2.1], [3.6, 2.1]], G.frameAlong([BLOCK.x + BLOCK.w, 0, BAR_LOW + 4.4], [1, 0, 0]), P), { tone: "mid" }));
  out.push(D([at([BLOCK.x + BLOCK.w, -2.8, BAR_LOW + 6.2]), at([BLOCK.x + BLOCK.w, 2.8, BAR_LOW + 6.2])], { size: 0.38 }));
  out.push(barHalf(BLOCK.y + BLOCK.d, BAR.half, PEG_Y[1]));
  return out.join("");
}

function pad() {
  const out = [S(k.slabOf(PAD, 0, CAR_TOP, P, 3, 0.5), { tone: "mid" })];
  for (const x of [PAD.x, PAD.x + PAD.w - 1.4]) out.push(S(k.slabOf({ x, y: PAD.y + 1, w: 1.4, d: PAD.d - 2, r: 0.5 }, CAR_TOP, 1.6, P, 2), { tone: "mid" }));
  out.push(D([at([PAD.x + 4, PAD.y + PAD.d - 2.4, CAR_TOP]), at([PAD.x + PAD.w - 4, PAD.y + PAD.d - 2.4, CAR_TOP])], { size: 0.4 }));
  return out.join("");
}

// The class counter: one window per design, side by side on the front face.
function counter(start) {
  const out = [S(k.slabOf(COUNTER, 0, COUNTER_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(COUNTER, 6, P, 4), { tone: "faint" }) })];
  for (let i = 0; i < 3; i++) out.push(L(k.planOutline({ x: COUNTER.x + 6, y: COUNTER.y + 5 + i * 4.4, w: 18, d: 2, r: 1 }, COUNTER_H, P, 3), { tone: "lo" }));
  out.push(D([[COUNTER.x + 3, COUNTER.y + 3], [COUNTER.x + COUNTER.w - 3, COUNTER.y + 3], [COUNTER.x + 3, COUNTER.y + COUNTER.d - 3], [COUNTER.x + COUNTER.w - 3, COUNTER.y + COUNTER.d - 3]].map(([x, y]) => at([x, y, COUNTER_H])), { size: 0.42 }));
  out.push(D([[COUNTER.y + 4, 8], [COUNTER.y + COUNTER.d - 4, 8], [COUNTER.y + 4, COUNTER_H - 5], [COUNTER.y + COUNTER.d - 4, COUNTER_H - 5]].map(([y, z]) => at([COUNTER.x + COUNTER.w, y, z])), { size: 0.4 }));
  out.push(S(k.cylinder(COUNTER.x + 31, COUNTER.y + 8, 2.6, COUNTER_H, 2.2, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(COUNTER.x + 31, COUNTER.y + 8, 2.6, COUNTER_H, COUNTER_H + 2.2, 16, P), { tone: "lo" }));
  const M = k.sideMatrix([COUNTER.x, COUNTER.y + COUNTER.d], COUNTER_H - 3, P, "left");
  const n = counts(channelsAt(start));
  const windows = [
    { x: 3, label: "KẾ THỪA", value: two(n.inheritance), part: "count-inheritance" },
    { x: 20, label: "BRIDGE", value: two(n.bridge), part: "count-bridge" },
  ];
  out.push(`<g transform="${M}">${windows.map((w) => `
    <text class="iso-face-text dp-label" data-tone="lo" x="${w.x + 7.5}" y="3.4" font-size="2.6" text-anchor="middle">${w.label}</text>
    <path class="dp-screen" d="${rrect(w.x, 5, 15, 9, 1.2)}"/>
    <text class="iso-face-text dp-digits" data-part="${w.part}" data-tone="hi" x="${w.x + 7.5}" y="11.9" font-size="7" text-anchor="middle">${w.value}</text>
    <path class="iso-line" data-tone="lo" d="${rrect(w.x, 5, 15, 9, 1.2)}"/>`).join("")}
  </g>`);
  return out.join("");
}

const START = 1;
const start = STEPS[START];
const kindAt = (s) => KIND_STOP[STEPS[s].kind];
const chanAt = (s) => CHAN_STOP[STEPS[s].channel];
const seatedAt = (s) => (CHANNELS[STEPS[s].channel].added ? 1 : 0);
const chatX = (cx, seat) => (seat >= 1 ? cx + CX[3] : PAD_X);
// The Chat unit is drawn on its seat row at x = 0 and moved: off the row to the pad when not seated.
const chatDy = (seat) => (PAD_Y - ROW_C) * (1 - seat);
const CHAT = CHANNELS.findIndex((c) => c.added);

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một bàn chọn có hai bàn trượt chạy độc lập trên hai cặp ray. Bàn phía sau mang ba đầu tin là Cảnh báo, Nhắc lịch và Khuyến mãi, bàn phía trước mang các khối kênh Email, SMS và Push, còn một chỗ trống. Đầu tin nào và khối kênh nào cũng có cùng một chốt chuẩn trên nắp. Ở giữa có một cột đứng, thanh nối trên cột hạ xuống ghép đúng hai chốt đang gặp nhau, nên đầu tin nào cũng đi được với kênh nào. Khối Chat mới đợi trên bệ bên phải, và bộ đếm phía trước so số lớp của hai cách thiết kế.",
  body: [
    base(),
    rails(ROW_K - 9, ROW_K + 5),
    endStop(-108, ROW_K - 11),
    `<g data-part="kinds" transform="${k.translateAlong(P, [kindAt(START), 0, 0])}">${kindsCarriage()}</g>`,
    endStop(104, ROW_K - 11),
    column(),
    rails(ROW_C - 9, ROW_C + 5),
    endStop(-108, ROW_C - 11),
    `<g data-part="channels" transform="${k.translateAlong(P, [chanAt(START), 0, 0])}">${channelCarriage()}</g>`,
    pad(),
    `<g data-part="chat" transform="${k.translateAlong(P, [chatX(chanAt(START), seatedAt(START)), chatDy(seatedAt(START)), 0])}">${unit(CHANNELS[CHAT], 0)}</g>`,
    `<g data-part="bridge">${bridge()}</g>`,
    endStop(104, ROW_C - 11),
    counter(START),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const KIND_STOP = ${JSON.stringify(KIND_STOP)}, CHAN_STOP = ${JSON.stringify(CHAN_STOP)}, INSTALL = ${INSTALL}, CHAT_SEAT = ${CX[3]};
const PAD_X = ${PAD_X}, PAD_Y = ${PAD_Y}, ROW_C = ${ROW_C}, LIFT = ${LIFT}, START = ${START}, N = STEPS.length, CHAT = ${CHAT};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector('[data-part="' + name + '"]');
const parts = { kinds: q("kinds"), channels: q("channels"), chat: q("chat"), bridge: q("bridge"), inh: q("count-inheritance"), br: q("count-bridge") };
const bars = [...svg.querySelectorAll('[data-part="bar-solid"] > .iso-solid')];
const pegEnds = [...svg.querySelectorAll('[data-part="pegend"]')];
const lamps = {};
svg.querySelectorAll('[data-part="unit"]').forEach((el) => { lamps[el.dataset.channel] = el.querySelector('[data-part="lamp"]'); });
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const two = (n) => String(n).padStart(2, "0");
const want = (s) => ({ kx: KIND_STOP[STEPS[s].kind], cx: CHAN_STOP[STEPS[s].channel], seat: CHANNELS[STEPS[s].channel].added ? 1 : 0 });
let sel = START, kx = want(START).kx, cx = want(START).cx, seat = want(START).seat, lift = 0;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0, dwell = 0;
const DWELL = 3.2;
const shown = {};
const set = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.setAttribute("transform", value); } };
const follow = (value, target, dt, tau, calm, snap = 0.02) => {
  if (calm) return target;
  const next = value + (target - value) * (1 - Math.exp(-dt / tau));
  return Math.abs(target - next) < snap ? target : next;
};
const spoken = STEPS.map((step) => KINDS[step.kind].name + " gửi qua " + CHANNELS[step.channel].name + ", cần " + counts(channelsAt(STEPS.indexOf(step))).bridge + " lớp");
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", spoken[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
let phase = "";
function draw() {
  set(parts.kinds, "k", translateAlong(P, [kx, 0, 0]));
  set(parts.channels, "c", translateAlong(P, [cx, 0, 0]));
  set(parts.chat, "chat", translateAlong(P, [seat >= 1 ? cx + CHAT_SEAT : PAD_X, (PAD_Y - ROW_C) * (1 - seat), 0]));
  set(parts.bridge, "b", translateAlong(P, [0, 0, lift * LIFT]));
  const goal = want(sel);
  const engaged = lift === 0 && kx === goal.kx && cx === goal.cx && seat === goal.seat;
  if (shown.engaged !== engaged) {
    shown.engaged = engaged;
    bars.forEach((el) => { el.toggleAttribute("data-lit", engaged); el.querySelector(".iso-edge")?.setAttribute("data-tone", engaged ? "lit" : "hi"); });
    pegEnds.forEach((el) => el.setAttribute("display", engaged ? "inline" : "none"));
  }
  const channel = CHANNELS[STEPS[sel].channel];
  const lampOn = engaged ? channel.id : "";
  if (shown.lamp !== lampOn) {
    shown.lamp = lampOn;
    for (const id in lamps) lamps[id].toggleAttribute("data-on", id === lampOn);
  }
  const n = counts(seat >= 1 ? CHANNELS.length : CHANNELS.length - 1);
  if (shown.n !== n.bridge) { shown.n = n.bridge; parts.inh.textContent = two(n.inheritance); parts.br.textContent = two(n.bridge); }
  const kind = KINDS[STEPS[sel].kind];
  const text = engaged ? kind.name + " qua " + channel.name + " · " + n.bridge + " lớp" : phase;
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const goal = want(sel);
  if (calm) { kx = goal.kx; cx = goal.cx; seat = goal.seat; lift = 0; }
  // The bar lifts before anything slides, both carriages move on their own rails,
  // a new unit slides on or off its seat only in front of the pad, and the bar
  // drops back once every part has reached the chosen step.
  const placed = kx === goal.kx && cx === goal.cx && seat === goal.seat;
  lift = follow(lift, placed ? 0 : 1, dt, 0.16, calm, 0.01);
  const raised = lift > 0.97;
  if (raised) {
    kx = follow(kx, goal.kx, dt, 0.3, calm, 0.05);
    const swap = seat !== goal.seat;
    cx = follow(cx, swap ? INSTALL : goal.cx, dt, 0.3, calm, 0.05);
    if (swap && cx === INSTALL) seat = follow(seat, goal.seat, dt, 0.28, calm, 0.004);
  }
  phase = !placed && !raised ? "đang nhấc thanh nối"
    : seat !== goal.seat ? (goal.seat ? "đang lắp khối Chat" : "đang tháo khối Chat")
    : !placed ? "đang chọn " + KINDS[STEPS[sel].kind].name + ", " + CHANNELS[STEPS[sel].channel].name
    : "đang hạ thanh nối";
  if (touring && placed && lift === 0) {
    dwell += dt;
    if (dwell > DWELL) { dwell = 0; sel = (sel + 1) % N; describe(); }
  }
  draw();
  const settled = !touring && placed && lift === 0;
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

const WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười", "mười một", "mười hai"];
const steps = STEPS.map((step, i) => {
  const kind = KINDS[step.kind];
  const channel = CHANNELS[step.channel];
  const n = counts(channelsAt(i));
  let caption;
  if (i === 0) caption = `Đầu ${kind.name} gặp khối ${channel.name} ở giữa, và thanh nối hạ xuống ghép hai chốt lại. Đầu tin lo nội dung, khối kênh lo cách gửi, nên khách nhận một email có tiêu đề “${kind.title}”.`;
  else if (channel.added) caption = `Thêm kênh ${channel.name} chỉ là trượt thêm một khối vào chỗ trống, ba đầu tin giữ nguyên. Số lớp lên <strong>${n.bridge}</strong>, trong khi viết mỗi tổ hợp một lớp sẽ phải lên ${n.inheritance}.`;
  else if (i === 1) caption = `Cả hai bàn trượt cùng đổi để đầu ${kind.name} gặp khối ${channel.name}. Thanh nối vẫn là thanh cũ, nên cặp mới này chạy được mà không cần viết thêm lớp nào.`;
  else caption = `Đầu ${kind.name} gặp khối ${channel.name}. Ba loại tin với ba kênh chỉ cần <strong>${n.bridge} lớp</strong>, còn nếu viết mỗi tổ hợp một lớp thì phải có tới ${WORDS[n.inheritance]} lớp.`;
  return { label: step.label, short: step.short, caption };
});

const first = STEPS[START];
export const plate = withSteps(k.plateHtml({
  fig: "Fig 17",
  title: "Bridge",
  hint: "Rê chuột để chọn bước",
  readout: `${KINDS[first.kind].name} qua ${CHANNELS[first.channel].name} · ${counts(channelsAt(START)).bridge} lớp`,
  keys: [
    { mark: "lit", label: "Thanh nối đang ghép một đầu tin với một khối kênh, chính là cây cầu giữa hai phía" },
    { mark: "raised", label: "Đầu tin ở phía sau và khối kênh ở phía trước, mỗi phía chạy trên ray riêng" },
  ],
  caption:
    "Bàn phía sau chọn loại tin, bàn phía trước chọn kênh gửi, và hai bàn trượt độc lập với nhau. Chúng chỉ gặp nhau qua một thanh nối chuẩn, nên bất kỳ đầu tin nào cũng ghép được với bất kỳ khối kênh nào. Muốn có kênh mới, ta chỉ trượt thêm một khối vào chỗ trống, không phải làm lại đầu tin nào.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Bridge, dùng phím mũi tên để chọn bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Ghép loại tin với kênh gửi", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-face{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-pegend{fill:var(--anatomy-top);stroke:var(--anatomy-lo);stroke-width:.4}
.dp-lamp{fill:var(--anatomy-shade-1)}
.dp-lamp[data-on]{fill:var(--anatomy-lit)}
.dp-digits{letter-spacing:.04em}
.dp-label{letter-spacing:.08em}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:114%;margin:-6% -7% -4%}}
`;

export { kitScript };
