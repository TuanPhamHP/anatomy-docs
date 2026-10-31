// The Visitor figure: a row of line blocks standing behind a rail, one block per
// invoice line type, each with a socket of its own shape (square, round,
// triangle). A carrier runs on the rail holding a bit set, the visitor: four
// bits in channels on top of a slide, one per line type, plus an empty channel.
// At a block the set slides until the bit that fits that block's socket sits
// under the pusher, and the pusher drives just that bit in: the block's socket
// picks the method, the set picks what the method does (double dispatch). Each
// set keeps its own counter. At either end of the rail a rack holds the other
// set; swapping sets gives a new operation without touching any block. A fourth
// block, gift wrapping, has a cross socket that no set has a bit for.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { LINES, NET, NEW_LINE, RECORDS, VAT_TOTAL, vatPass, vnd } from "./model.mjs";
import { GIFT_FROM, PUSH, REST, STOP, pose } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 340;
const AZIMUTH = 58;

const PLATE = { x: -166, y: -94, w: 332, d: 152, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Rail: two guides along x in front of the line blocks.
const RAIL_Y = [18, 38];
const RAIL_X = [-86, 86];
const RAIL_H = 4;

// The bit sets: a slide with four channels on top; bits ride in the channels.
const SET = { x: -20, y: -4, w: 40, d: 12, r: 1.5 };
const SET_Z = [16, 30];
const BIT_Z = 32.6;
const BIT_R = 2.2;
const BIT_Y = [-6, 10];
const SLOTS = [0, 1, 2, 3].map((i) => (i - 1.5) * 10);
const HEAD = { x: 20, y: -4, w: 18, d: 12, r: 1.5 };
const HEAD_TOP = 35;

// The line blocks and their socket bosses.
const BODY = { w: 22, y: -52, d: 30 };
const BODY_Z = [2, 50];
const BOSS_FACE = -14;
const SHAPES = ["square", "round", "triangle"];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners({ x: -60, y: -90, w: 120, d: 76 }, 0, BODY_Z[1] + 2), ...k.boxCorners({ x: -156, y: -8, w: 312, d: 18 }, 0, 36)],
  WIDTH,
  HEIGHT,
  { pad: 16, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const slab = (plan, z0, z1, steps = 3, bevel = 0) => k.slabOf(plan, z0, z1 - z0, P, steps, bevel);
const shiftX = (plan, dx) => ({ ...plan, x: plan.x + dx });
const AY = [0, -1, 0];
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
const hullOf = (points) => screenHull(points.map(at));

// A shape mark in a face's own 2D coordinates, centred at (cx, cy), about `s` across.
function shapePath(shape, cx, cy, s) {
  const h = s / 2;
  if (shape === "square") return rrect(cx - h, cy - h, s, s, s * 0.12);
  if (shape === "round") return `M${cx - h} ${cy}A${h} ${h} 0 1 0 ${cx + h} ${cy}A${h} ${h} 0 1 0 ${cx - h} ${cy}Z`;
  if (shape === "triangle") {
    const r = s * 0.62;
    return `M${cx} ${cy - r}L${cx + r * 0.866} ${cy + r / 2}L${cx - r * 0.866} ${cy + r / 2}Z`;
  }
  const a = s * 0.2;
  return `M${cx - a} ${cy - h}H${cx + a}V${cy - a}H${cx + h}V${cy + a}H${cx + a}V${cy + h}H${cx - a}V${cy + a}H${cx - h}V${cy - a}H${cx - a}Z`;
}

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 24).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Travel scale along the front of the rail, a major tick under each line block.
  const ruler = { x: -86, y: 46, w: 172, d: 7, r: 1 };
  out.push(S(slab(ruler, 0, 0.6, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-81, 81, 3, 5, 46.8, 0.6, [2, 3.6], P, "x");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L([STOP.product, STOP.shipping, STOP.discount, STOP.gift].map((x) => k.lineOnTop([x, 46.8], [x, 52.4], 0.6, P)).join(""), { tone: "hi" }));
  out.push(D([at([-83.6, 49.5, 0.6]), at([83.6, 49.5, 0.6])], { size: 0.45 }));
  // Label plate at the front left.
  const label = { x: -150, y: 34, w: 40, d: 14, r: 1.5 };
  out.push(S(slab(label, 0, 0.8, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-144, 38.5, 22], [-144, 41.5, 15], [-144, 44.5, 19]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 7, 0.8]), at([label.x + label.w - 2.6, label.y + 7, 0.8])], { size: 0.4 }));
  return out.join("");
}

// A stand at the back holding the printed invoice that the row of blocks stands for.
function invoiceStand() {
  const out = [];
  const foot = { x: -150, y: -80, w: 32, d: 12, r: 1.5 };
  out.push(S(slab(foot, 0, 4, 3, 0.5), { tone: "mid" }));
  out.push(D([at([foot.x + 2.4, foot.y + 6, 4]), at([foot.x + foot.w - 2.4, foot.y + 6, 4])], { size: 0.4 }));
  const card = { x: -147, y: -74.5, w: 26, d: 1, r: 0.3 };
  out.push(S(slab(card, 4, 34, 2), { tone: "lo", crease: "none" }));
  const M = k.sideMatrix([card.x, card.y + card.d], 34, P, "left");
  const rows = [[3, 8.5, 14], [3, 12.5, 18], [3, 16.5, 11], [3, 20.5, 16]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  out.push(`<g transform="${M}"><text class="iso-face-text" data-tone="mid" x="3" y="5" font-size="2.6">HOÁ ĐƠN</text><path class="iso-line" data-tone="lo" data-free="" d="${rows}"/><path class="iso-line" data-tone="faint" d="M0 24.5H26"/><path class="iso-line" data-tone="lo" data-free="" d="M15 27.5H23"/></g>`);
  // The slot in the foot the card stands in.
  out.push(L(k.planOutline({ x: card.x - 0.6, y: card.y - 0.6, w: card.w + 1.2, d: card.d + 1.2, r: 0.4 }, 4, P, 2), { tone: "lo" }));
  return out.join("");
}

// The guide the gift block slides in on, from the back of the plate to its place in the row.
function giftGuides() {
  const out = [];
  for (const x of [STOP.gift - 9, STOP.gift + 6]) {
    out.push(S(slab({ x, y: BODY.y + GIFT_FROM - 3, w: 3, d: -GIFT_FROM + 33, r: 0.6 }, 0, 1.4, 2), { tone: "lo" }));
    out.push(D([BODY.y + GIFT_FROM, BODY.y + GIFT_FROM / 2, BODY.y + 2, -24].map((y) => at([x + 1.5, y, 1.4])), { size: 0.35 }));
  }
  out.push(S(slab({ x: STOP.gift - 11, y: BODY.y + GIFT_FROM - 6, w: 22, d: 3, r: 0.6 }, 0, 4, 2), { tone: "mid" }));
  return out.join("");
}

// A line block: plinth, body, the socket boss on its rail-facing side, the amount window and a side plate.
function lineBlock(line, fx, gift = false) {
  const out = [];
  const plan = { x: fx - BODY.w / 2, y: BODY.y, w: BODY.w, d: BODY.d, r: 2 };
  out.push(S(slab({ x: fx - 13, y: BODY.y - 2, w: 26, d: BODY.d + 4, r: 2 }, 0, BODY_Z[0], 3, 0.4), { tone: gift ? "mid" : "lo" }));
  out.push(D([[fx - 11.6, BODY.y - 0.6], [fx + 11.6, BODY.y - 0.6], [fx - 11.6, BODY.y + BODY.d + 0.6], [fx + 11.6, BODY.y + BODY.d + 0.6]].map(([x, y]) => at([x, y, BODY_Z[0]])), { size: 0.4 }));
  const seam = k.sideSeam(plan, 8, P, 4);
  out.push(S(slab(plan, BODY_Z[0], BODY_Z[1], 4, 1), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(plan, 3), BODY_Z[1], P, 3), { tone: "faint" }));
  out.push(D(k.corners(plan, 3.4).map(([x, y]) => at([x, y, BODY_Z[1]])), { size: 0.45 }));
  // The amount this line holds: the data a visitor reads.
  const front = plan.y + plan.d;
  const W = k.sideMatrix([fx - 9, front], 47.5, P, "left");
  out.push(`<g transform="${W}"><path class="dp-screen" d="${rrect(0, 0, 18, 7, 1)}"/><path class="dp-wall" d="M0 0H18V0.8H0.8V7H0Z"/>
    <text class="iso-face-text dp-amount" data-tone="hi" x="16.9" y="5.3" font-size="3.6" text-anchor="end">${vnd(line.amount)}</text>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, 18, 7, 1)}"/></g>`);
  // Socket boss with the hole whose shape says which kind of line this is.
  const boss = { x: fx - 4.5, y: front, w: 9, d: BOSS_FACE - front, r: 1 };
  out.push(S(slab(boss, BIT_Z - 6, BIT_Z + 6, 3, 0.4), { tone: "mid" }));
  const M = k.sideMatrix([fx - 4.5, BOSS_FACE], BIT_Z + 6, P, "left");
  out.push(`<g transform="${M}"><path class="dp-hole" d="${shapePath(line.shape, 4.5, 6, 5)}"/><path class="iso-line" data-tone="lo" d="${shapePath(line.shape, 4.5, 6, 5)}"/></g>`);
  out.push(D([at([fx - 3.2, BOSS_FACE, BIT_Z + 4.7]), at([fx + 3.2, BOSS_FACE, BIT_Z + 4.7]), at([fx - 3.2, BOSS_FACE, BIT_Z - 4.7]), at([fx + 3.2, BOSS_FACE, BIT_Z - 4.7])], { size: 0.32 }));
  // Name engraved low on the front, under the boss.
  out.push(k.faceTextSvg(k.sideMatrix([fx, front], 12, P, "left"), line.label.toUpperCase(), { size: 2.8, tone: "lo", anchor: "middle" }));
  out.push(D([at([fx - 8.6, front, 6]), at([fx + 8.6, front, 6])], { size: 0.38 }));
  return out.join("");
}

function rails() {
  const out = [];
  for (const y of RAIL_Y) {
    out.push(S(slab({ x: RAIL_X[0], y: y - 2.5, w: RAIL_X[1] - RAIL_X[0], d: 5, r: 0.8 }, 0, RAIL_H, 3, 0.4), { tone: "mid" }));
    out.push(D([-112, -76, -40, -4, 32, 68, 104].map((x) => at([x, y, RAIL_H])), { size: 0.38 }));
  }
  // End stops with rubber pads facing the carrier.
  for (const side of [-1, 1]) {
    const x = side < 0 ? RAIL_X[0] - 5 : RAIL_X[1] + 1;
    out.push(S(slab({ x, y: 12, w: 4, d: 32, r: 1 }, 0, 10, 3, 0.4), { tone: "mid" }));
    out.push(D([at([x + 2, 16, 10]), at([x + 2, 40, 10])], { size: 0.42 }));
    for (const y of RAIL_Y) {
      const F = G.frameAlong([side < 0 ? RAIL_X[0] - 1 : RAIL_X[1] + 1, y, 7], [-side, 0, 0]);
      out.push(S(G.solidOf([[0, 1.8], [0.8, 1.8], [1.1, 1.3]], F, P), { tone: "lo" }));
    }
  }
  return out.join("");
}

// A rack at one end of the rail: a pedestal carrying the same guide as the carrier.
function rack(side) {
  const out = [];
  const ped = { x: side > 0 ? 94 : -152, y: -8, w: 58, d: 18, r: 2 };
  out.push(S(slab(ped, 0, 14, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(ped, 3, P, 3), { tone: "faint" }) }));
  const guide = { x: side > 0 ? 92 : -152, y: -2, w: 60, d: 8, r: 1 };
  out.push(S(slab(guide, 14, 16, 2, 0.3), { tone: "mid" }));
  out.push(D([0.15, 0.5, 0.85].map((u) => at([guide.x + guide.w * u, 2, 16])), { size: 0.38 }));
  // Name plate on the front of the pedestal.
  const M = k.sideMatrix([ped.x + 16, 10], 11, P, "left");
  const lines = [[2.4, 2.8, 13], [2.4, 5, 9]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  out.push(`<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 24, 7.5, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 24, 7.5, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`);
  out.push(D([at([ped.x + 4, 10, 7]), at([ped.x + ped.w - 4, 10, 7])], { size: 0.4 }));
  return out.join("");
}
// The rack's end stop, at the outer end of its guide.
function rackStop(side) {
  const x = side > 0 ? 152 : -156;
  return S(slab({ x, y: -4, w: 4, d: 12, r: 0.8 }, 0, 30, 2, 0.4), { tone: "mid" }) + D([at([x + 2, 2, 30])], { size: 0.42 });
}

// The carrier, built at x = 0: bearing blocks, plate, the bracket and guide the set slides on.
function carrierBase() {
  const out = [];
  for (const y of RAIL_Y) for (const x of [-16, 6]) {
    out.push(S(slab({ x, y: y - 4, w: 10, d: 8, r: 1 }, RAIL_H, 8, 3, 0.4), { tone: "mid" }));
  }
  const plate = { x: -18, y: 12, w: 36, d: 32, r: 2 };
  out.push(S(slab(plate, 8, 12, 4, 0.6), { tone: "mid" }));
  out.push(D(k.corners(plate, 3).map(([x, y]) => at([x, y, 12])), { size: 0.45 }));
  out.push(S(slab({ x: -10, y: 0, w: 20, d: 12, r: 1 }, 8, 14, 3, 0.4), { tone: "mid" }));
  out.push(S(slab({ x: -26, y: -2, w: 52, d: 8, r: 1 }, 14, 16, 2, 0.3), { tone: "mid" }));
  out.push(D([-22, 22].map((x) => at([x, 2, 16])), { size: 0.38 }));
  // Pointer reading the travel scale.
  out.push(S(slab({ x: -1.2, y: 44, w: 2.4, d: 5, r: 0.6 }, 8, 9.2, 2), { tone: "mid" }));
  out.push(L(k.lineOnTop([0, 44], [0, 49], 9.2, P), { tone: "hi", free: "end" }));
  return out.join("");
}

// The pusher, the flag that rises when no bit fits, and the hand knob, drawn after the sets.
function carrierTop() {
  const out = [];
  // The rod first: its back end sits inside the cylinder painted over it.
  const rod = G.frameAlong([0, 31, BIT_Z], AY);
  out.push(`<g data-part="rod">${S(G.solidOf([[0, 1.3], [18.8, 1.3], [18.8, 1.9], [20.8, 1.9]], rod, P), { tone: "hi", crease: "lo" })}</g>`);
  out.push(S(slab({ x: -5, y: 18, w: 10, d: 15, r: 1 }, 12, BIT_Z - 4.6, 3, 0.4), { tone: "mid" }));
  out.push(D([at([-3.4, 19.6, 12]), at([3.4, 19.6, 12])], { size: 0.38 }));
  const F = G.frameAlong([0, 34, BIT_Z], AY);
  out.push(S(G.solidOf([[0, 3.8], [0.8, 4.6], [15.4, 4.6], [16.2, 3.8], [16.2, 2.4], [17.6, 2.2]], F, P), { tone: "mid" }));
  // Two air ports on the cylinder.
  for (const s of [3, 13]) {
    const port = G.frameAlong(G.pointOf(F, s, 4.6, Math.PI / 2), [0, 0, 1]);
    out.push(S(G.solidOf([[0, 1.1], [1.6, 1.1], [1.6, 0.7], [2.4, 0.7]], port, P), { tone: "mid" }));
  }
  // Flag housing on the plate, beside the cylinder.
  out.push(S(slab(FLAG_BOX, 12, FLAG_TOP, 3, 0.4), { tone: "mid" }));
  out.push(L(k.planOutline({ x: FLAG.x - 0.5, y: FLAG.y - 0.4, w: FLAG.w + 1, d: 1.8, r: 0.5 }, FLAG_TOP, P, 2), { tone: "lo" }));
  out.push(D([at([FLAG_BOX.x + 1.5, FLAG_BOX.y + 1.5, FLAG_TOP]), at([FLAG_BOX.x + FLAG_BOX.w - 1.5, FLAG_BOX.y + FLAG_BOX.d - 1.5, FLAG_TOP])], { size: 0.38 }));
  out.push(flag());
  // Hand knob on the front edge of the plate, clear of the rail's end stops.
  const knob = G.frameAlong([10, 44, 10], [0, 1, 0]);
  out.push(S(G.solidOf([[0, 1.2], [2.4, 1.2], [2.4, 3], [7, 3], [7.6, 2.4]], knob, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(knob, 2.8, 6.8, 3, 18, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
  return out.join("");
}

const FLAG_BOX = { x: -17, y: 30, w: 9, d: 7, r: 1 };
const FLAG_TOP = 20;
const FLAG = { x: -16, y: 33, w: 7, h: 9, rise: 9 };
function flag() {
  const z0 = FLAG_TOP - FLAG.h - 0.4;
  const plan = { x: FLAG.x, y: FLAG.y, w: FLAG.w, d: 1, r: 0.3 };
  const M = k.sideMatrix([FLAG.x, FLAG.y + 1], z0 + FLAG.h, P, "left");
  const mark = `<g transform="${M}"><path class="iso-line" data-tone="hi" d="M${FLAG.w / 2} 1.6V5.6"/><path class="iso-line" data-tone="hi" d="M${FLAG.w / 2 - 0.5} 7.2H${FLAG.w / 2 + 0.5}"/></g>`;
  const clip = poly([[-200, FLAG.y + 1, FLAG_TOP], [200, FLAG.y + 1, FLAG_TOP], [200, FLAG.y + 1, 400], [-200, FLAG.y + 1, 400]]);
  return `<clipPath id="dp-flag-clip"><path d="${clip}"/></clipPath><g clip-path="url(#dp-flag-clip)"><g data-part="flag" transform="${k.translateAlong(P, [0, 0, at0.flag * FLAG.rise])}"><g data-part="flag-plate">${S(slab(plan, z0, z0 + FLAG.h, 2), { tone: "hi", crease: "lo", lit: at0.flag > 0.5, inner: mark })}</g></g></g>`;
}

// One bit, built in channel i of a set at x = 0, pointing at the line blocks (-y).
function bit(i) {
  const x = SLOTS[i];
  const F = G.frameAlong([x, BIT_Y[1], BIT_Z], AY);
  const length = BIT_Y[1] - BIT_Y[0];
  const shape = SHAPES[i];
  if (shape === "square") {
    const bar = { x: x - BIT_R, y: BIT_Y[0] + 0.8, w: 2 * BIT_R, d: length - 0.8, r: 0.4 };
    // The chamfered tip sits behind the bar, so it is painted first.
    return S(slab({ x: x - BIT_R + 0.5, y: BIT_Y[0], w: 2 * BIT_R - 1, d: 0.8, r: 0.3 }, BIT_Z - BIT_R + 0.5, BIT_Z + BIT_R - 0.5, 2), { tone: "hi", crease: "lo" }) + S(slab(bar, BIT_Z - BIT_R, BIT_Z + BIT_R, 2, 0.3), { tone: "hi", crease: "lo" });
  }
  if (shape === "round") return S(G.solidOf([[0, BIT_R], [length - 0.9, BIT_R], [length, BIT_R - 0.8]], F, P), { tone: "hi", crease: "lo" });
  const r = BIT_R * 1.25;
  const tri = [[0, r], [r * 0.866, -r / 2], [-r * 0.866, -r / 2]].map(([u, v]) => [u, v - 0.3]);
  return S(G.prismOf(F, tri, 0, length, P), { tone: "hi", crease: "lo" });
}

// The clip for bit i: its own cross-section swept from the socket face toward the viewer,
// so a bit pushed into a boss disappears into the hole.
function bitClip(id, i) {
  const x = SLOTS[i];
  const pts = [];
  for (const y of [BOSS_FACE, 40]) for (const dx of [-3.2, 3.2]) for (const z of [BIT_Z - 3.2, BIT_Z + 3.2]) pts.push([x + dx, y, z]);
  return `<clipPath id="${id}"><path d="${hullOf(pts)}"/></clipPath>`;
}

// A bit set, built at x = 0: the slide, its channels, its bits, the counter window and the shape marks.
function bitSet(name, bitsInSet) {
  const out = [];
  const seam = k.sideSeam(SET, SET_Z[0] + 3, P, 3);
  out.push(`<g data-part="set-body">${S(slab(SET, SET_Z[0], SET_Z[1], 3, 0.8), { tone: "hi", crease: "lo", inner: L(seam, { tone: "faint" }) })}</g>`);
  out.push(D([at([SET.x + 2.2, 2, SET_Z[1]]), at([SET.x + SET.w - 2.2, 2, SET_Z[1]])], { size: 0.42 }));
  // Channels: two low walls per position.
  for (const x of SLOTS) {
    for (const dx of [-BIT_R - 1.2, BIT_R + 0.2]) {
      out.push(S(slab({ x: x + dx, y: SET.y, w: 1, d: SET.d, r: 0.3 }, SET_Z[1], BIT_Z, 2), { tone: "mid" }));
    }
  }
  // The empty fourth channel: a slot with no bit, for a line type no visitor knows yet.
  out.push(`<g data-part="empty-slot">${L(k.planOutline({ x: SLOTS[3] - 1.4, y: SET.y + 1.2, w: 2.8, d: SET.d - 2.4, r: 1.2 }, SET_Z[1], P, 2), { tone: "lo" })}</g>`);
  // Bits, each clipped at the socket face.
  bitsInSet.forEach((i) => {
    const id = `dp-${name}-bit-${i}`;
    out.push(`${bitClip(id, i)}<g clip-path="url(#${id})"><g data-part="bit" data-slot="${i}">${bit(i)}</g></g>`);
  });
  // Front face: a mark under each channel, the shape of the socket its bit fits.
  const M = k.sideMatrix([SET.x, SET.y + SET.d], SET_Z[1] - 2, P, "left");
  const marks = [0, 1, 2, 3].map((i) => `<path class="iso-line" data-tone="${i < 3 ? "mid" : "faint"}" d="${shapePath(i < 3 ? SHAPES[i] : "cross", 20 + SLOTS[i], 3, 3)}"/>`).join("");
  out.push(`<g transform="${M}">${marks}</g>`);
  out.push(D([at([SET.x + 3, SET.y + SET.d, SET_Z[0] + 3]), at([SET.x + SET.w - 3, SET.y + SET.d, SET_Z[0] + 3])], { size: 0.38 }));
  // The head at the right end: the set's name and its counter, the visitor's own result.
  out.push(S(slab(HEAD, SET_Z[0], HEAD_TOP, 3, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(HEAD, 2.4), HEAD_TOP, P, 3), { tone: "faint" }));
  const H = k.sideMatrix([HEAD.x + 2, HEAD.y + HEAD.d], HEAD_TOP - 1.6, P, "left");
  out.push(`<g transform="${H}">
    <text class="iso-face-text" data-tone="mid" x="0.4" y="3.2" font-size="3">${name === "vat" ? "VAT" : "JSON"}</text>
    <path class="dp-screen" d="${rrect(0, 4.4, 14, 7, 1)}"/><path class="dp-wall" d="M0 4.4H14V5.2H0.8V11.4H0Z"/>
    <text class="iso-face-text dp-count" data-part="count" data-tone="hi" x="13.2" y="9.6" font-size="3.5" text-anchor="end">${countText(name, at0)}</text>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 4.4, 14, 7, 1)}"/></g>`);
  out.push(D([at([HEAD.x + HEAD.w - 2.4, HEAD.y + HEAD.d, HEAD_TOP - 2.4]), at([HEAD.x + HEAD.w - 2.4, HEAD.y + HEAD.d, SET_Z[0] + 2.4])], { size: 0.36 }));
  return out.join("");
}

const VAT_RUN = vatPass();
// What a set's counter shows in pose p.
function countText(name, p) {
  if (name === "vat") return p.vat < 0 ? "0" : vnd(VAT_RUN[p.vat].total);
  return p.records + " dòng";
}

const START = 3;
const at0 = pose(REST[START]);
const tx = (dx) => k.translateAlong(P, [dx, 0, 0]);
const ty = (dy) => k.translateAlong(P, [0, dy, 0]);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một hàng khối đứng sau đường ray, mỗi khối là một loại dòng hoá đơn với lỗ cắm hình riêng: vuông cho sản phẩm, tròn cho giao hàng, tam giác cho giảm giá. Một xe trượt chở bộ bit chạy dọc ray. Tới khối nào, bộ bit trượt cho bit vừa với lỗ cắm của khối ấy nằm dưới cần đẩy, rồi cần đẩy đưa đúng bit đó vào. Ở hai đầu ray là giá để bộ bit VAT và bộ bit JSON, còn phía sau là khối gói quà có lỗ chữ thập mà chưa bộ bit nào có.",
  body: [
    base(),
    invoiceStand(),
    giftGuides(),
    rack(-1),
    rackStop(-1),
    rack(1),
    lineBlock(LINES[0], STOP.product),
    lineBlock(LINES[1], STOP.shipping),
    lineBlock(LINES[2], STOP.discount),
    `<g data-part="gift" transform="${ty(at0.giftY)}">${lineBlock(NEW_LINE, STOP.gift, true)}</g>`,
    rails(),
    `<g data-part="carrier-base" transform="${tx(at0.carX)}">${carrierBase()}</g>`,
    `<g data-part="set" data-set="vat" transform="${tx(at0.vatX)}">${bitSet("vat", [0, 1, 2])}</g>`,
    `<g data-part="set" data-set="export" transform="${tx(at0.exportX)}">${bitSet("export", [0, 1, 2])}</g>`,
    `<g data-part="carrier-top" transform="${tx(at0.carX)}">${carrierTop()}</g>`,
    rackStop(1),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const TIMELINE = readFileSync(join(HERE, "timeline.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
${TIMELINE}
const P = ${JSON.stringify(P)};
const START = ${START}, N = REST.length, FLAG_RISE = ${FLAG.rise};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (sel) => svg.querySelector(sel);
const parts = {
  base: q('[data-part="carrier-base"]'), top: q('[data-part="carrier-top"]'), gift: q('[data-part="gift"]'),
  flag: q('[data-part="flag"]'), rod: q('[data-part="rod"]'),
  sets: { vat: q('[data-set="vat"]'), export: q('[data-set="export"]') },
};
const bits = { vat: [...parts.sets.vat.querySelectorAll('[data-part="bit"]')], export: [...parts.sets.export.querySelectorAll('[data-part="bit"]')] };
const counts = { vat: parts.sets.vat.querySelector('[data-part="count"]'), export: parts.sets.export.querySelector('[data-part="count"]') };
const flagPlate = q('[data-part="flag-plate"] > .iso-solid');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const RUN = vatPass();
const restText = [
  ...RUN.map((r) => "VAT · " + r.line.label + " · " + (r.vat < 0 ? "−" + vnd(-r.vat) : "+" + vnd(r.vat)) + " ₫"),
  "JSON · " + RECORDS.length + " dòng · " + vnd(NET) + " ₫",
  "Gói quà · chưa có bit",
];
const spoken = [
  ...RUN.map((r) => "Bộ VAT cắm bit vào dòng " + r.line.label.toLowerCase() + ", tổng VAT " + vnd(r.total) + " đồng"),
  "Bộ JSON đi qua ba dòng và xuất " + RECORDS.length + " dòng",
  "Dòng gói quà có lỗ chữ thập nhưng chưa bộ bit nào có bit chữ thập",
];
let sel = START, t = REST[START], aim = sel, speed = 1, dwell = 0;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0;
const DWELL = 3.4;
const shown = {};
const set = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.setAttribute("transform", value); } };
const text = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.textContent = value; } };
const lit = (el, on) => {
  el.toggleAttribute("data-lit", on);
  el.querySelector(".iso-edge")?.setAttribute("data-tone", on ? "lit" : "hi");
};
const countOf = (name, p) => name === "vat" ? (p.vat < 0 ? "0" : vnd(RUN[p.vat].total)) : p.records + " dòng";
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", spoken[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function draw() {
  const p = pose(t);
  const car = translateAlong(P, [p.carX, 0, 0]);
  set(parts.base, "base", car);
  set(parts.top, "top", car);
  set(parts.sets.vat, "vat", translateAlong(P, [p.vatX, 0, 0]));
  set(parts.sets.export, "exp", translateAlong(P, [p.exportX, 0, 0]));
  set(parts.rod, "rod", translateAlong(P, [0, -p.ext, 0]));
  set(parts.gift, "gift", translateAlong(P, [0, p.giftY, 0]));
  set(parts.flag, "flag", translateAlong(P, [0, 0, p.flag * FLAG_RISE]));
  // Only the set riding the carrier has a bit under the pusher.
  for (const name of ["vat", "export"]) {
    const riding = name === "vat" ? p.vatOn > 0.5 : p.exportOn > 0.5;
    bits[name].forEach((el, i) => {
      const push = riding ? p.bits[i] : 0;
      set(el, name + i, translateAlong(P, [0, -push, 0]));
      const on = push > ${PUSH - 0.5};
      if (shown[name + "lit" + i] !== on) { shown[name + "lit" + i] = on; el.querySelectorAll(".iso-solid").forEach((solid) => lit(solid, on)); }
    });
    text(counts[name], "count-" + name, countOf(name, p));
  }
  const refused = p.flag > 0.5;
  if (shown.refused !== refused) { shown.refused = refused; lit(flagPlate, refused); }
  const resting = REST.findIndex((r) => Math.abs(r - t) < 0.001);
  const words = resting >= 0 ? restText[resting] : t > REST[aim] ? "đang tua lại" : phase(t);
  if (readout.textContent !== words) readout.textContent = words;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const target = REST[sel];
  if (sel !== aim) {
    aim = sel;
    // Play forward in real time, faster when skipping a step; rewind in at most about two and a half seconds.
    const next = REST.find((r) => r > t + 0.001);
    speed = target < t ? Math.max(3.5, (t - target) / 2.5) : next !== undefined && target > next ? 2.2 : 1;
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

const steps = [
  {
    label: "Sản phẩm",
    short: "SP",
    caption: `Xe dừng trước dòng sản phẩm. Lỗ cắm vuông của dòng này chọn đúng bit vuông, tức phương thức <code>visit_product</code> của bộ VAT, nên bộ đếm cộng 10% của ${vnd(LINES[0].amount)} ₫ và lên <strong>${vnd(VAT_RUN[0].total)} ₫</strong>.`,
  },
  {
    label: "Giao hàng",
    short: "Giao",
    caption: `Sang dòng giao hàng, lỗ cắm tròn chọn bit tròn. Phí giao hàng ${vnd(LINES[1].amount)} ₫ chịu thuế ${LINES[1].rate}%, nên bộ đếm cộng thêm ${vnd(VAT_RUN[1].vat)} ₫ và lên <strong>${vnd(VAT_RUN[1].total)} ₫</strong>.`,
  },
  {
    label: "Giảm giá",
    short: "Giảm",
    caption: `Dòng giảm giá có lỗ tam giác. Khoản giảm ${vnd(-LINES[2].amount)} ₫ hạ giá tính thuế của hàng, nên thuế bớt ${vnd(-VAT_RUN[2].vat)} ₫ và tổng VAT còn <strong>${vnd(VAT_TOTAL)} ₫</strong>.`,
  },
  {
    label: "Xuất JSON",
    short: "Xuất",
    caption: `Muốn có thêm thao tác xuất dữ liệu, ta không sửa dòng nào mà chỉ đổi cả bộ bit. Bộ JSON đi qua đúng ba lỗ cắm ấy và ghi ra <strong>${RECORDS.length} dòng</strong> cho kế toán, còn bộ VAT nằm trên giá vẫn giữ con số của nó.`,
  },
  {
    label: "Dòng mới",
    short: "Mới",
    caption: `Thêm một loại dòng thì ngược lại. Dòng gói quà có lỗ chữ thập nhưng chưa bộ bit nào có bit chữ thập, nên <strong>mọi visitor</strong> đều phải viết thêm một phương thức cho nó.`,
  },
];

export const plate = withSteps(k.plateHtml({
  fig: "Fig 23",
  title: "Visitor",
  hint: "Rê chuột để chọn bước",
  readout: `JSON · ${RECORDS.length} dòng · ${vnd(NET)} ₫`,
  keys: [
    { mark: "lit", label: "Bit đang cắm vào lỗ, hoặc cờ báo không có bit nào vừa" },
    { mark: "raised", label: "Mỗi khối dòng hoá đơn có lỗ cắm hình riêng, và hình lỗ quyết định bit nào được dùng" },
  ],
  caption:
    "Các khối đứng sau đường ray là các dòng hoá đơn, mỗi khối có một lỗ cắm hình riêng. Xe trượt chở một bộ bit, tức một visitor, chạy qua từng khối, và chính hình lỗ cắm chọn bit nào được đẩy vào. Muốn có thao tác mới, ta chỉ thay cả bộ bit ở giá cuối ray, còn các khối dòng vẫn giữ nguyên.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Visitor, dùng phím mũi tên để chọn bước" aria-valuemin="1" aria-valuemax="${REST.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Hai lượt đi qua hoá đơn", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-amount,.dp-count{letter-spacing:.02em}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
@media (max-width:520px){.iso-stage{overflow:hidden}.iso-stage svg{transform:scale(1.12);transform-origin:50% 52%}}
`;

export { kitScript };
