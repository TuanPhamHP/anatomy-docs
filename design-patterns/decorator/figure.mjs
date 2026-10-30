// The Decorator figure: a bench press over a stack of screw-on rings. The base
// unit is the real rate source (it calls the API); every ring has the same
// thread below and above, so it screws onto the unit or onto another ring and
// offers the same thread again: the same interface in and out. Rings wait on a
// rack and are screwed on one at a time, each new ring wrapping everything under
// it. Pressing the button sends the ram down through the stack, ring by ring,
// to the unit and back: each ring does its one job on the way (count a log
// line, try again after a timeout, answer from memory) and shows it in its own
// window. Every move and every number comes from simulate() in model.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "/home/tuanpham/.claude/skills/anatomy/kit/tube.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { LAYERS, MAX_TRIES, PAIR, RATE, STEPS, groupVND, simulate, stackName } from "./model.mjs";
import { BOSS_H, GUIDE_BOTTOM, RACK_AT, RACK_TOP, REST, RING_H, UNIT_TOP, ramSvg, ringPose } from "./parts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 500;

const PLATE = { x: -64, y: -60, w: 134, d: 124, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// The base unit: the real source. Its top boss is the thread every ring shares.
const PLINTH = { x: -26, y: -26, w: 52, d: 52, r: 4 };
const UNIT = { x: -24, y: -24, w: 48, d: 48, r: 4 };
const UNIT_Z = 3;
const BOSS_R = 11;
const BORE_R = 4.2;

// Rings: same thread below (hidden) and above (the boss), a knurled band, and a
// pod on the front holding the ring's own window.
const RING_R = 15.5;
const POD = { x0: -13, x1: 13, y1: 20.5, z0: 0.6, z1: 8.4 };
const stackZ = (i) => UNIT_TOP + i * RING_H;

// Rack for the rings that are not in use: one stub per ring, cut with the same thread.
const RACK = { x: 34, y: -55, w: 30, d: 110, r: 3 };

// The press: column, head, ram guide and a short air cylinder.
const FLANGE = { x: -60, y: -15, w: 28, d: 30, r: 2 };
const COLUMN = { x: -56, y: -10, w: 18, d: 20, r: 2 };
const HEAD = { x: -58, y: -11, w: 72, d: 22, r: 3 };
const HEAD_Z = [76, 88];
const GUIDE = [GUIDE_BOTTOM, 76];
const BUTTON = [-47, 10, 46];

// The API the base unit calls: a small terminal at the back, cabled to the unit.
const API_BOX = { x: 2, y: -56, w: 26, d: 14, r: 2 };
const API_H = 9.5;
const CABLE = [[24.4, -17, 4.4], [28.5, -17, 4.4], [30, -19, 1.2], [30, -31, 1.2], [23, -35, 1.2], [22, -38, 2.6], [22, -41.6, 2.6]];
const CABLE_R = 1.1;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners({ x: -9, y: -9, w: 18, d: 18 }, 0, 101), ...k.boxCorners(HEAD, HEAD_Z[0], HEAD_Z[1])],
  WIDTH,
  HEIGHT,
  { pad: 20, azimuth: 40 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const Z = [0, 0, 1];
const Y = [0, 1, 0];
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
// A closed rounded rectangle in a face's own 2D coordinates.
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const face = (x, y, z) => k.sideMatrix([x, y], z, P, "left");

// The shared thread: a boss with two thread arcs and the bore in its top.
function boss(cx, cy, z, { bore = true } = {}) {
  const threads = [z + 1, z + 2].map((h) => k.sideArc(cx, cy, BOSS_R, h, P, 32)).join("");
  const out = [S(k.cylinder(cx, cy, BOSS_R, z, BOSS_H, P, 48, 0.4), { tone: "mid", inner: L(threads, { tone: "lo" }) })];
  out.push(L(k.ring(cx, cy, BOSS_R - 1.4, z + BOSS_H, P, 40), { tone: "faint" }));
  if (bore) {
    out.push(`<path class="dc-hole" d="${k.ring(cx, cy, BORE_R, z + BOSS_H, P, 32)}"/>`);
    out.push(L(k.ring(cx, cy, BORE_R, z + BOSS_H, P, 32), { tone: "lo" }));
  }
  return out.join("");
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
  // Label plate in the free front-left corner.
  const label = { x: -54, y: 38, w: 32, d: 14, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-48, 42.5, 20], [-48, 45.5, 13], [-48, 48.5, 17]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 7, 0.8]), at([label.x + label.w - 2.6, label.y + 7, 0.8])], { size: 0.4 }));
  out.push(spanner());
  return out.join("");
}

// A pin spanner lying on the plate: its two pins fit the two holes in every ring's top.
const PIN_SPAN = 2 * (RING_R - 2.2);
function spanner() {
  const bar = { x: -16, y: 48, w: 34, d: 4.4, r: 2.2 };
  const mid = bar.x + bar.w / 2;
  const out = [S(k.slabOf(bar, 0, 1.4, P, 6, 0.4), { tone: "mid" })];
  out.push(L(k.planOutline({ x: mid - 5, y: bar.y + 1.4, w: 10, d: 1.6, r: 0.8 }, 1.4, P, 3), { tone: "lo" }));
  for (const x of [mid - PIN_SPAN / 2, mid + PIN_SPAN / 2]) out.push(S(k.cylinder(x, bar.y + bar.d / 2, 0.8, 1.4, 1.8, P, 12), { tone: "mid", crease: "none" }));
  return out.join("");
}

function rack() {
  const out = [S(k.slabOf(RACK, 0, RACK_TOP, P, 4, 0.6), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(RACK, 2.4), RACK_TOP, P, 4), { tone: "faint" }));
  out.push(D([[RACK.x + 15, RACK.y + 4], [RACK.x + 15, RACK.y + RACK.d - 4]].map(([x, y]) => at([x, y, RACK_TOP])), { size: 0.45 }));
  for (const [x, y] of byDepth(RACK_AT)) out.push(boss(x, y, RACK_TOP, { bore: false }));
  return out.join("");
}

function column() {
  const out = [S(k.slabOf(FLANGE, 0, 3, P, 4, 0.5), { tone: "mid" })];
  out.push(D(k.corners(FLANGE, 3).map(([x, y]) => at([x, y, 3])), { size: 0.5 }));
  const seam = k.sideSeam(COLUMN, 26, P, 4);
  out.push(S(k.slabOf(COLUMN, 3, HEAD_Z[0] - 3, P, 4, 0.8), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  // The client's button on the column's front: a guard ring around a mushroom cap.
  const [bx, by, bz] = BUTTON;
  out.push(S(k.slabOf({ x: bx - 6, y: by, w: 12, d: 2.4, r: 1 }, bz - 6, 12, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([bx - 4.4, by + 2.4, bz + 4.4]), at([bx + 4.4, by + 2.4, bz - 4.4])], { size: 0.4 }));
  const F = G.frameAlong([bx, by + 2.4, bz], Y);
  out.push(S(G.solidOf([[0, 4.4], [1.6, 4.4], [1.6, 3.6]], F, P), { tone: "mid" }));
  out.push(`<g data-part="button">${S(G.solidOf([[0, 2.4], [2.2, 2.4], [2.6, 3.2], [3.6, 3.2], [4, 2.6]], F, P), { tone: "hi", crease: "lo" })}</g>`);
  return out.join("");
}

function unit() {
  const out = [S(k.slabOf(PLINTH, 0, UNIT_Z, P, 4, 0.5), { tone: "mid" })];
  const seam = k.sideSeam(UNIT, 9, P, 6);
  out.push(S(k.slabOf(UNIT, UNIT_Z, UNIT_TOP - UNIT_Z, P, 6, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(UNIT, 3.5), UNIT_TOP, P, 4), { tone: "faint" }));
  out.push(D(k.corners(UNIT, 6.5).map(([x, y]) => at([x, y, UNIT_TOP])), { size: 0.45 }));
  out.push(boss(0, 0, UNIT_TOP));
  // Front (+y): the result display above, the API call counter and a vent below.
  const fy = UNIT.y + UNIT.d;
  out.push(`<g data-part="bezel">${S(k.slabOf({ x: -21, y: fy, w: 31, d: 0.8, r: 0.4 }, 12.5, 12, P, 2), { tone: "hi", crease: "none" })}</g>`);
  out.push(`<g transform="${face(-19.5, fy + 0.8, 23)}">
    <path class="dc-screen" d="${rrect(0, 0, 28, 9, 1.2)}"/>
    <text class="iso-face-text dc-digits" data-part="display" data-tone="hi" x="26" y="6.9" font-size="6.4" text-anchor="end">------</text>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, 28, 9, 1.2)}"/>
  </g>`);
  out.push(`<g transform="${face(-19.5, fy, 10.5)}">
    <path class="dc-screen" d="${rrect(0, 0, 11, 6, 1)}"/>
    <text class="iso-face-text dc-digits" data-part="api-count" data-tone="hi" x="9.6" y="4.7" font-size="4.4" text-anchor="end">00</text>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, 11, 6, 1)}"/>
    <text class="iso-face-text" data-tone="lo" x="13" y="4.6" font-size="3">API</text>
    ${[0, 1, 2, 3].map((i) => `<path class="iso-line" data-tone="lo" d="${rrect(25 + i * 3.6, 0.4, 1.6, 5.2, 0.8)}"/>`).join("")}
  </g>`);
  out.push(D([at([-22, fy, 5]), at([22, fy, 5]), at([22, fy, 25]), at([-22, fy, 25])], { size: 0.45 }));
  // Right side (+x): nameplate.
  const M = k.sideMatrix([UNIT.x + UNIT.w, 12], 22, P, "right");
  const lines = [[3, 3.4, 15], [3, 5.8, 10], [3, 8.2, 13]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  out.push(`<g transform="${M}"><path class="dc-plate" d="${rrect(0, 0, 24, 11, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 24, 11, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`);
  out.push(D([at([UNIT.x + UNIT.w, 12 - 21.6, 22 - 5.5]), at([UNIT.x + UNIT.w, 12 - 2.4, 22 - 5.5])], { size: 0.4 }));
  return out.join("");
}

// The API terminal at the back: a low box with vents, status lights and a cable gland.
function apiBox() {
  const out = [S(k.slabOf(API_BOX, 0, API_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(API_BOX, 3, P, 4), { tone: "faint" }) })];
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: API_BOX.x + 4 + i * 3.4, y: API_BOX.y + 3, w: 1.6, d: 8, r: 0.8 }, API_H, P, 3), { tone: "lo" }));
  out.push(D(k.corners(API_BOX, 2.2).map(([x, y]) => at([x, y, API_H])), { size: 0.4 }));
  const fy = API_BOX.y + API_BOX.d;
  out.push(`<g transform="${face(API_BOX.x + 3, fy, 7.4)}"><text class="iso-face-text" data-tone="lo" x="0" y="3" font-size="3">API</text></g>`);
  out.push(D([12, 14.6, 17.2].map((x) => at([API_BOX.x + x, fy, 5.6])), { size: 0.75, tone: "hi" }));
  out.push(S(G.solidOf([[0, 2.1], [1.4, 2.1], [1.8, 1.6]], G.frameAlong([22, fy, 2.6], Y), P), { tone: "mid" }));
  return out.join("");
}

// The cable from the base unit's side to the API terminal, lying on the plate.
function cable() {
  const pieces = tubePieces(G.fillet(CABLE, 2.4, 8), CABLE_R, P, { spacing: 1.2 });
  const out = [S(G.solidOf([[0, 2.1], [1.4, 2.1], [1.8, 1.6]], G.frameAlong([UNIT.x + UNIT.w, -17, 4.4], [1, 0, 0]), P), { tone: "mid" })];
  out.push(...pieces.sort((a, b) => k.depthOf(a.mid, P) - k.depthOf(b.mid, P)).map((piece) => tubeSvg(piece, { tone: "mid" })));
  return out.join("");
}

// The pod's plan: a block whose back is cut to the ring's curve, so it grows out of the band.
function podPlan() {
  const { x0, x1, y1 } = POD;
  const r = 1.2;
  const arc = [];
  for (let i = 0; i <= 16; i++) {
    const x = x1 - ((x1 - x0) * i) / 16;
    arc.push([x, Math.sqrt(RING_R * RING_R - x * x) - 0.4]);
  }
  return [[x1, y1 - r], ...arc, [x0, y1 - r], [x0 + r * 0.3, y1 - r * 0.3], [x0 + r, y1], [x1 - r, y1], [x1 - r * 0.3, y1 - r * 0.3]];
}

// What each ring shows in its pod window, from a model snapshot.
const RING_TEXT = {
  log: (s) => String(s.log).padStart(2, "0"),
  retry: (s) => `${s.tries}/${MAX_TRIES}`,
  cache: (s) => (s.stored === null ? "------" : groupVND(s.stored)),
};

// One ring, drawn at its place in the stack.
function ringSvg(layer, i, snap) {
  const z0 = stackZ(i);
  const F = G.frameAlong([0, 0, z0], Z);
  const out = [];
  const grooves = [z0 + 2, z0 + 7].map((h) => k.sideArc(0, 0, RING_R, h, P, 48)).join("");
  const knurl = k.knurl(0, 0, RING_R, z0 + 2, z0 + 7, 72, P, 0);
  const body = G.solidOf([[0, RING_R - 1.1], [0.9, RING_R], [RING_H - 0.9, RING_R], [RING_H, RING_R - 1.1]], F, P);
  out.push(`<g data-part="band">${S(body, { tone: "hi", crease: "lo", inner: L(grooves, { tone: "lo" }) + L(knurl, { tone: "faint" }) })}</g>`);
  out.push(L(k.ring(0, 0, BOSS_R + 1, z0 + RING_H, P, 48), { tone: "faint" }));
  // Spanner holes, PIN_SPAN apart across the top.
  for (const a of [-0.5, Math.PI - 0.5]) {
    const [hx, hy] = [Math.cos(a) * PIN_SPAN / 2, Math.sin(a) * PIN_SPAN / 2];
    out.push(`<path class="dc-hole" d="${k.ring(hx, hy, 0.9, z0 + RING_H, P, 14)}"/>`, L(k.ring(hx, hy, 0.9, z0 + RING_H, P, 14), { tone: "lo" }));
  }
  out.push(boss(0, 0, z0 + RING_H));
  // The pod and its window.
  const pod = k.extrude(podPlan(), z0 + POD.z0, POD.z1 - POD.z0, P, { convex: false, bevel: 0.4 });
  out.push(S(pod, { tone: "mid" }));
  const w = POD.x1 - POD.x0;
  const label = `<text class="iso-face-text" data-tone="lo" x="1.8" y="5" font-size="2.6">${layer.label}</text>`;
  const win = `<path class="dc-screen" d="${rrect(12.4, 1.3, w - 13.8, 5.2, 0.9)}"/>
    <text class="iso-face-text dc-digits" data-part="value" data-tone="hi" x="${w - 2.2}" y="5.1" font-size="${layer.id === "cache" ? 3 : 3.8}" text-anchor="end">${RING_TEXT[layer.id](snap)}</text>
    <path class="iso-line" data-tone="lo" d="${rrect(12.4, 1.3, w - 13.8, 5.2, 0.9)}"/>`;
  out.push(`<g transform="${face(POD.x0, POD.y1, z0 + POD.z1)}">${label}${win}</g>`);
  out.push(D([at([POD.x0 + 1.2, POD.y1, z0 + POD.z1 - 1.2]), at([POD.x1 - 1.2, POD.y1, z0 + POD.z0 + 1.2])], { size: 0.35 }));
  if (layer.id === "cache") out.push(flag(z0, snap.hits > 0));
  return out.join("");
}

// The cache ring's hit flag: a pin and a vane that rise out of the pod top when
// the ring answers a call by itself. Clipped to the pod top, so it sinks in.
const FLAG = { x0: 4.6, x1: 11.2, y: 17.2, h: 7, rise: 7.2, vane: 4.4 };
function flag(z0, up) {
  const top = z0 + POD.z1;
  const { x0, x1, y, h, rise, vane: vh } = FLAG;
  const clip = [[x0 - 2, y, top], [x1 + 1, y, top], [x1 + 1, y, top + 30], [x0 - 2, y, top + 30]].map(at);
  const slot = k.planOutline({ x: x0 - 0.8, y: y - 0.7, w: x1 - x0 + 1.6, d: 1.4, r: 0.6 }, top, P, 3);
  const vane = S(k.slabOf({ x: x0, y: y - 0.4, w: x1 - x0, d: 0.8, r: 0.3 }, top - rise + h - vh, vh, P, 2), { tone: "hi", crease: "lo" });
  const pin = S(k.cylinder(x0 + 0.5, y, 0.5, top - rise, h, P, 12), { tone: "mid", crease: "none" });
  return `<path class="dc-hole" d="${slot}"/>${L(slot, { tone: "lo" })}<clipPath id="dc-flag"><path d="${k.pathOf(clip, true)}"/></clipPath><g clip-path="url(#dc-flag)"><g data-part="flag" transform="${up ? k.translateAlong(P, [0, 0, rise]) : ""}">${pin}${vane}</g></g>`;
}

function head() {
  const out = [];
  // Ram guide under the head, with a collar.
  out.push(S(k.cylinder(0, 0, 6.5, GUIDE[0] + 1.2, GUIDE[1] - GUIDE[0] - 1.2, P, 32), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 7.4, GUIDE[0], 1.2, P, 36, 0.3), { tone: "mid" }));
  const seam = k.sideSeam(HEAD, HEAD_Z[0] + 6, P, 4);
  out.push(S(k.slabOf(HEAD, HEAD_Z[0], HEAD_Z[1] - HEAD_Z[0], P, 4, 1), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan({ x: -54, y: -8, w: 44, d: 16, r: 2 }, 0), HEAD_Z[1], P, 4), { tone: "faint" }));
  out.push(D([[-51, -5], [-51, 5], [-13, -5], [-13, 5]].map(([x, y]) => at([x, y, HEAD_Z[1]])), { size: 0.45 }));
  // Pressure gauge on the front (+y) face of the head.
  const gx = -36;
  const F = G.frameAlong([gx, HEAD.y + HEAD.d, 82], Y);
  out.push(S(G.solidOf([[0, 4.6], [1.4, 4.6], [1.8, 4]], F, P), { tone: "mid" }));
  const ticks = [-2.2, -1.4, -0.6, 0.2, 1, 1.8].map((a) => {
    const s = 1.8;
    const p0 = G.pointOf(F, s, 2.8, a), p1 = G.pointOf(F, s, 3.5, a);
    return k.pathOf([at(p0), at(p1)]);
  }).join("");
  out.push(L(ticks, { tone: "lo", free: true }));
  out.push(L(k.pathOf([at(G.pointOf(F, 1.8, 0, 0)), at(G.pointOf(F, 1.8, 3, -0.7))]), { tone: "hi", free: true }));
  out.push(D([at(G.pointOf(F, 1.8, 0, 0))], { size: 0.5, tone: "hi" }));
  // Vents on the front face, right of the gauge.
  const M = face(-26, HEAD.y + HEAD.d, 85);
  out.push(`<g transform="${M}">${[0, 1, 2, 3, 4].map((i) => `<path class="iso-line" data-tone="lo" d="${rrect(i * 3.4, 0, 1.6, 6, 0.8)}"/>`).join("")}</g>`);
  // Air cylinder above the ram: square caps, round barrel, four tie rods.
  const cap = { x: -9, y: -9, w: 18, d: 18, r: 1.6 };
  out.push(S(k.slabOf(cap, HEAD_Z[1], 2.6, P, 3, 0.5), { tone: "mid" }));
  // Tie rods: the two behind the barrel first, the two in front after it, all under the top cap.
  const rods = byDepth(k.corners(cap, 2.2));
  const rod = ([x, y]) => S(k.cylinder(x, y, 0.7, HEAD_Z[1] + 2.6, 8.4, P, 10), { tone: "mid", crease: "none" });
  out.push(...rods.slice(0, 2).map(rod));
  out.push(S(k.cylinder(0, 0, 7, HEAD_Z[1] + 2.6, 8.4, P, 40), { tone: "mid" }));
  out.push(...rods.slice(2).map(rod));
  out.push(S(k.slabOf(cap, HEAD_Z[1] + 11, 2.6, P, 3, 0.5), { tone: "mid" }));
  out.push(D(rods.map(([x, y]) => at([x, y, HEAD_Z[1] + 13.6])), { size: 0.5 }));
  // Air fitting on the top cap.
  out.push(S(k.cylinder(0, 0, 2.2, HEAD_Z[1] + 13.6, 1.8, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 1.4, HEAD_Z[1] + 15.4, 1.6, P, 12), { tone: "mid" }));
  return out.join("");
}

const START = 3;
const startRun = simulate(START);
const startSnap = startRun.totals;
const placedAt = (index) => LAYERS.map((_, i) => (i < STEPS[index].rings ? 1 : 0));
const startPlaced = placedAt(START);

function rings() {
  const groups = LAYERS.map((layer, i) => {
    const [dx, dy, dz] = ringPose(i, startPlaced[i]);
    const move = startPlaced[i] === 1 ? "" : k.translateAlong(P, [dx, dy, dz]);
    return { i, html: `<g data-part="ring" data-ring="${layer.id}" transform="${move}">${ringSvg(layer, i, startSnap)}</g>` };
  });
  const stacked = groups.filter((g) => startPlaced[g.i] === 1).map((g) => g.html).join("");
  const parked = groups.filter((g) => startPlaced[g.i] === 0).sort((a, b) => k.depthOf([...RACK_AT[a.i], 0], P) - k.depthOf([...RACK_AT[b.i], 0], P)).map((g) => g.html).join("");
  return `<g data-slot="stack">${stacked}</g><g data-slot="rack">${parked}</g><g data-slot="moving"></g>`;
}

const topOf = (n) => stackZ(n) + BOSS_H;

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một máy ép để bàn đứng trên khối nguồn tỷ giá. Trên đỉnh khối nguồn có một đầu ren, và các vòng LOG, RETRY, CACHE đều có đúng kiểu ren ấy ở cả mặt dưới lẫn mặt trên, nên vòng nào cũng vặn được lên khối nguồn hoặc lên một vòng khác. Các vòng chưa dùng nằm trên giá bên cạnh. Mỗi vòng có một ô số riêng cho số dòng log, số lần thử hoặc giá trị đã nhớ. Khi bấm nút, trục ép đi xuống qua từng vòng tới khối nguồn rồi quay lên.",
  body: [
    base(),
    apiBox(),
    column(),
    unit(),
    cable(),
    rack(),
    rings(),
    `<g data-part="ram">${ramSvg(k, P, REST, topOf(STEPS[START].rings))}</g>`,
    head(),
  ],
});

const inline = (file) => readFileSync(join(HERE, file), "utf8").replace(/^export /gm, "");

export const live = `
${inline("model.mjs")}
${inline("parts.mjs")}
const P = ${JSON.stringify(P)};
const FLAG_RISE = ${FLAG.rise}, BUTTON_DIP = 1.4, START = ${START};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const slots = { stack: svg.querySelector('[data-slot="stack"]'), rack: svg.querySelector('[data-slot="rack"]'), moving: svg.querySelector('[data-slot="moving"]') };
const ringEls = LAYERS.map((layer) => {
  const el = svg.querySelector('[data-ring="' + layer.id + '"]');
  return { el, band: el.querySelector('[data-part="band"] > .iso-solid'), value: el.querySelector('[data-part="value"]'), flag: el.querySelector('[data-part="flag"]') };
});
const bezel = svg.querySelector('[data-part="bezel"] > .iso-solid');
const ramEl = svg.querySelector('[data-part="ram"]');
const buttonEl = svg.querySelector('[data-part="button"]');
const display = svg.querySelector('[data-part="display"]');
const apiCount = svg.querySelector('[data-part="api-count"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const RING_TEXT = {
  log: (s) => String(s.log).padStart(2, "0"),
  retry: (s) => s.tries + "/" + MAX_TRIES,
  cache: (s) => (s.stored === null ? "------" : groupVND(s.stored)),
};
const ZERO = { at: "client", what: "idle", api: 0, log: 0, tries: 0, hits: 0, stored: null, screen: null };
const levelOf = (where) => where === "client" ? REST : where === "api" ? UNIT_TOP - 1.5 : UNIT_TOP + LAYERS.findIndex((l) => l.id === where) * RING_H + RING_H / 2;
const runs = STEPS.map((_, i) => simulate(i));

let sel = START, placed = LAYERS.map((_, i) => (i < STEPS[START].rings ? 1 : 0)), ram = REST, button = 0;
let snap = runs[START].totals, mark = { at: "client", what: "done" }, moving = -1;
let plan = [], seg = 0, segT = 0, done = true, now = 0, doneAt = 0;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0, drawn = "", shown = {};

const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function describe() {
  const step = STEPS[sel], t = runs[sel].totals;
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", "Bước " + (sel + 1) + ", " + stackName(step.rings) + ", " + step.calls + " lần gọi, API bị gọi " + t.api + " lần");
  emit();
}

// A plan is a list of timed segments, built from the current pose: bring the
// ram home, reset the counters, unscrew or screw on rings (top ring first when
// removing), then replay the step's calls exactly as simulate() traced them.
function buildPlan(index) {
  const out = [];
  let r = ram;
  const p = placed.slice();
  const ramTo = (to, after, dwell) => {
    const from = r;
    out.push({ dur: Math.max(0.28, Math.abs(to - from) / 34), run: (u) => { ram = from + (to - from) * ease(u); if (u === 1 && after) after(); } });
    if (dwell) out.push({ dur: dwell, run: () => {} });
    r = to;
  };
  if (Math.abs(r - REST) > 0.01) ramTo(REST, () => { mark = { at: "client", what: "home" }; });
  out.push({ dur: 0, run: () => { snap = ZERO; mark = { at: "client", what: "idle" }; moving = -1; } });
  const want = STEPS[index].rings;
  const move = (i, to) => {
    const from = p[i];
    out.push({ dur: 1.7 * Math.abs(to - from), run: (u) => { placed[i] = from + (to - from) * u; moving = i; } });
    out.push({ dur: 0.25, run: () => {} });
    p[i] = to;
  };
  for (let i = LAYERS.length - 1; i >= want; i--) if (p[i] > 0) move(i, 0);
  for (let i = 0; i < want; i++) if (p[i] < 1) move(i, 1);
  const DWELL = { call: 0, in: 0.12, again: 0.45, miss: 0.2, store: 0.3, hit: 0.7, ok: 0.18, error: 0.5, done: 0.5 };
  for (const m of runs[index].marks) {
    if (m.at === "client" && m.what === "call") {
      out.push({ dur: 0.45, run: (u) => { button = u < 1 ? Math.sin(Math.PI * u) : 0; mark = m; moving = -1; } });
      continue;
    }
    ramTo(levelOf(m.at), () => { snap = m; mark = m; }, DWELL[m.what] ?? 0.15);
  }
  return out;
}

function start(index) {
  plan = buildPlan(index);
  seg = 0; segT = 0; done = false;
  if (still.matches) advance(Infinity);
}

function advance(dt) {
  while (seg < plan.length) {
    const s = plan[seg];
    if (segT + dt < s.dur) { segT += dt; s.run(segT / s.dur); return; }
    dt -= s.dur - segT;
    s.run(1);
    seg += 1;
    segT = 0;
  }
  if (!done) { done = true; doneAt = now; }
}

const stacked = () => placed.filter((p) => p === 1).length;
function outermost() {
  for (let i = LAYERS.length - 1; i >= 0; i--) if (placed[i] === 1) return LAYERS[i].id;
  return "api";
}
function sayMark() {
  const m = mark, label = (id) => LAYERS.find((l) => l.id === id).label;
  if (m.at === "api") return m.what === "ok" ? "API trả " + groupVND(RATE) : "API lỗi: " + TIMEOUT;
  if (m.at === "log") return m.what === "in" ? "qua LOG, đi xuống" : "LOG ghi dòng " + m.log;
  if (m.at === "retry") return m.what === "in" ? "qua RETRY, lần 1" : m.what === "again" ? "RETRY thử lại, lần " + m.tries : "RETRY trả kết quả";
  if (m.at === "cache") return m.what === "miss" ? "CACHE chưa có, đi tiếp" : m.what === "store" ? "CACHE nhớ " + groupVND(m.stored) : "CACHE trả luôn " + groupVND(m.stored);
  if (m.what === "call") return "bấm nút: get_rate(" + PAIR + ")";
  return "nhận " + groupVND(RATE) + " ₫";
}
function say() {
  if (done) {
    const step = STEPS[sel], t = runs[sel].totals;
    return step.calls + " lần gọi → API " + t.api + " lần";
  }
  if (moving >= 0) return (STEPS[sel].rings > moving ? "vặn vòng " : "tháo vòng ") + LAYERS[moving].label;
  if (mark.what === "idle" || mark.what === "home") return "chuẩn bị";
  return sayMark();
}

function draw() {
  const top = UNIT_TOP + BOSS_H + stacked() * RING_H;
  const key = [ram, button, ...placed].map((v) => v.toFixed(3)).join();
  if (key !== drawn) {
    drawn = key;
    ramEl.innerHTML = ramSvg({ cylinder, solidSvg }, P, ram, top);
    buttonEl.setAttribute("transform", translateAlong(P, [0, -BUTTON_DIP * button, 0]));
    ringEls.forEach((r, i) => {
      const slot = placed[i] === 1 ? slots.stack : placed[i] === 0 ? slots.rack : slots.moving;
      if (r.el.parentNode !== slot) {
        // Keep the stack bottom to top and the rack back to front.
        const order = slot === slots.rack ? (a, b) => depthOf([...RACK_AT[a], 0], P) - depthOf([...RACK_AT[b], 0], P) : (a, b) => a - b;
        const after = [...slot.children].find((child) => order(LAYERS.findIndex((l) => l.id === child.dataset.ring), i) > 0);
        slot.insertBefore(r.el, after || null);
      }
      const [dx, dy, dz] = ringPose(i, placed[i]);
      r.el.setAttribute("transform", placed[i] === 1 ? "" : translateAlong(P, [dx, dy, dz]));
    });
  }
  // The lit part follows the call: the ring the ram is in, or at rest the outermost wrapper.
  const resting = Math.abs(ram - REST) < 0.5;
  const lit = resting ? outermost() : mark.at === "client" ? outermost() : mark.at;
  ringEls.forEach((r, i) => {
    const on = lit === LAYERS[i].id && placed[i] === 1;
    if (r.band.hasAttribute("data-lit") !== on) {
      r.band.toggleAttribute("data-lit", on);
      r.band.querySelector(".iso-edge").setAttribute("data-tone", on ? "lit" : "hi");
    }
  });
  const apiLit = lit === "api";
  if (bezel.hasAttribute("data-lit") !== apiLit) {
    bezel.toggleAttribute("data-lit", apiLit);
    bezel.querySelector(".iso-edge").setAttribute("data-tone", apiLit ? "lit" : "hi");
  }
  const texts = {
    display: snap.screen === null ? "------" : typeof snap.screen === "number" ? groupVND(snap.screen) : snap.screen,
    api: String(snap.api).padStart(2, "0"),
    log: RING_TEXT.log(snap), retry: RING_TEXT.retry(snap), cache: RING_TEXT.cache(snap),
    flag: snap.hits > 0 ? 1 : 0,
    readout: say(),
  };
  if (texts.display !== shown.display) { display.textContent = texts.display; display.setAttribute("data-tone", snap.screen === null ? "lo" : "hi"); }
  if (texts.api !== shown.api) apiCount.textContent = texts.api;
  LAYERS.forEach((layer, i) => { if (texts[layer.id] !== shown[layer.id]) ringEls[i].value.textContent = texts[layer.id]; });
  if (texts.flag !== shown.flag) ringEls[2].flag.setAttribute("transform", texts.flag ? translateAlong(P, [0, 0, FLAG_RISE]) : "");
  if (texts.readout !== shown.readout) readout.textContent = texts.readout;
  shown = texts;
}

const HOLD = 2.6;
function tick(stamp) {
  const dt = last ? Math.min((stamp - last) / 1000, 1 / 30) : 1 / 60;
  last = stamp;
  now += dt;
  if (still.matches) { if (!done) advance(Infinity); }
  else advance(dt);
  if (touring && done && now - doneAt > HOLD) { sel = (sel + 1) % STEPS.length; describe(); start(sel); }
  draw();
  const settled = done && !touring;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again. Choosing the step that is
// already showing runs it once more.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; doneAt = now; emit(); run(); }, 3600);
  if (index !== sel) { sel = index; describe(); start(sel); }
  else { if (hold) start(sel); emit(); }
  run();
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = !still.matches; doneAt = now; emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để sang bước sau";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse" && touring) choose(sel, false); });
stage.addEventListener("pointerdown", () => choose((sel + 1) % STEPS.length, true));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = (sel + 1) % STEPS.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = (sel - 1 + STEPS.length) % STEPS.length;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = STEPS.length - 1;
  if (event.key === "Enter" || event.key === " ") to = sel;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

// Step labels and captions, built from the model.
const steps = STEPS.map((step, index) => {
  const run = simulate(index);
  const t = run.totals;
  const rate = `<strong>${groupVND(RATE)} ₫</strong>`;
  const n = (count) => ["không", "một", "hai", "ba", "bốn", "năm"][count] ?? String(count);
  const captions = [
    `Lúc đầu chỉ có <code>HttpRateSource</code>, nên lời gọi đi thẳng xuống khối nguồn và API trả về ${rate}. API bị gọi đúng ${n(t.api)} lần.`,
    `Ta vặn thêm vòng LOG. Vòng này vẫn có đúng phương thức <code>get_rate()</code>, nên lời gọi đi qua LOG xuống API rồi quay lên. LOG ghi được ${n(t.log)} dòng, còn API vẫn chỉ bị gọi ${n(t.api)} lần.`,
    `Ta vặn thêm vòng RETRY. Lần đầu API lỗi, RETRY cho lời gọi chạy lại và lần này thành công, nên có ${n(t.tries)} lần thử, LOG ghi ${n(t.log)} dòng và API bị gọi ${n(t.api)} lần.`,
    `Vòng CACHE nằm trên cùng. Lần gọi đầu đi hết xuống API, lần thứ hai CACHE trả luôn ${rate} và cờ bật lên, nên ${n(step.calls)} lần gọi mà API chỉ bị gọi ${n(t.api)} lần.`,
  ];
  return {
    label: index === 0 ? "API trần" : `Thêm ${LAYERS[step.rings - 1].label}`,
    short: index === 0 ? "Lõi" : LAYERS[step.rings - 1].label[0] + LAYERS[step.rings - 1].label.slice(1).toLowerCase(),
    caption: captions[index],
  };
});

export const plate = withSteps(k.plateHtml({
  fig: "Fig 8",
  title: "Decorator",
  hint: "Bấm vào hình để sang bước sau",
  readout: `${STEPS[START].calls} lần gọi → API ${startSnap.api} lần`,
  keys: [
    { mark: "lit", label: "Vòng đang giữ lời gọi. Lúc nghỉ, đó là vòng ngoài cùng, tức thứ mà client đang cầm" },
    { mark: "raised", label: "Ba vòng LOG, RETRY và CACHE xếp từ dưới lên, hai mặt vòng nào cũng cùng một kiểu ren" },
  ],
  caption:
    "Khối nguồn gọi API thật và không bao giờ bị sửa. Vòng nào cũng có ren dưới khớp với ren trên của khối nguồn, phía trên lại có đúng kiểu ren đó, nên bạn vặn chúng chồng lên nhau theo thứ tự nào cũng được. Trục ép tượng trưng cho một lời gọi. Nó đi xuống qua từng vòng, mỗi vòng làm thêm đúng một việc rồi cho đi tiếp, hoặc tự trả lời luôn.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Decorator, dùng phím mũi tên để chuyển bước, Enter để chạy lại" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Bọc thêm từng lớp", steps, start: START }));

export const FIGURE_CSS = `
.dc-screen{fill:var(--anatomy-shade-1)}
.dc-plate{fill:var(--anatomy-top)}
.dc-hole{fill:var(--anatomy-shade-0)}
.dc-digits{letter-spacing:.05em}
.iso-stage{touch-action:pan-y;cursor:pointer;overflow:hidden}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:114%;margin:-2% -7% 0}}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
