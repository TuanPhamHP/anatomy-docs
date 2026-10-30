// The Template Method figure: a rotary dial machine. A turntable indexes a tray
// of order rows through four stations bolted to the base in a fixed order:
// feed (read the orders), filter (lift out the cancelled ones), format, and
// write. Three stations are the same for every report; only the format station
// takes a die from the rack, one die per subclass (CSV, JSON Lines, fixed-width),
// and a die's end cartridges add the header and footer strips that format's hooks
// write. The parts that move are drawn from parts.mjs; the numbers come from model.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { exportReport, FORMATS, groupVND, ORDERS } from "./model.mjs";
import * as M from "./parts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 400;
const PLATE = { x: -96, y: -96, w: 192, d: 192, r: 10 };
const PLATE_H = 12;
const FOOT_H = 5;
const GEAR_R = 50;
const GEAR_Z = [10, 18];
const PINION = { x: -39.6, y: -39.6, r: 6, z: [10, 17.4], teeth: 12 };
const MOTOR = { x: -48.8, y: -48.8, r: 7 };
const ARM_Z = [46, 52];
const RACK_Y = [86, 72.5, 59]; // rack slot of each die, CSV on the left as seen
const RACK_X = -34;
const RACK_TOP = 13;
const HOLDER = [0, M.RN];
const PLUNGER_AT = 315;
const START = 0;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, M.RN, 68], [-88, -6, 56], [6, -88, 56], [88, 6, 56], [-6, 88, 56]],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 65, elevation: 34 },
);

const RAD = Math.PI / 180;
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const polar = (r, deg) => [r * Math.cos(deg * RAD), r * Math.sin(deg * RAD)];
// Station-local (r out from the axis, t along the table's turn) to world, for stations on the axes.
const local = (theta, r, t) => {
  const c = Math.round(Math.cos(theta * RAD));
  const s = Math.round(Math.sin(theta * RAD));
  return [r * c - t * s, r * s + t * c];
};
const planAt = (theta, r0, r1, t0, t1, rad = 1) => {
  const [ax, ay] = local(theta, r0, t0);
  const [bx, by] = local(theta, r1, t1);
  return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(ax - bx), d: Math.abs(ay - by), r: rad };
};
const centre = (plan) => [plan.x + plan.w / 2, plan.y + plan.d / 2];
const byDepth = (items) => [...items].sort((a, b) => k.depthOf([...a.at, 0], P) - k.depthOf([...b.at, 0], P));
const outward = (theta) => local(theta, 1, 0);
// A closed rounded rectangle in a face's own 2D coordinates.
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const screws = (plan, z, inset = 3) => D(k.corners(plan, inset).map(([x, y]) => at([x, y, z])), { size: 0.45 });

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20).map((p) => ({ at: p }))).map((p) => p.at)) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6.2, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const corner = k.corners(PLATE, 10);
  out.push(L(corner.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(corner.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Angle scale on the base in the open front quarter, between two engraved arcs.
  const arc = (r) => k.onTop(Array.from({ length: 26 }, (_, i) => polar(r, 20 + i * 2)), 0, P);
  let minor = "";
  let major = "";
  for (let a = 20; a <= 70; a += 5) {
    const line = k.lineOnTop(polar(57, a), polar(a % 45 === 0 ? 63.5 : 60.5, a), 0, P);
    if (a % 45 === 0) major += line;
    else minor += line;
  }
  out.push(L(arc(57) + arc(60.5), { tone: "lo" }), L(minor, { tone: "lo" }), L(major + k.lineOnTop(polar(60.5, 45), polar(63.5, 45), 0, P), { tone: "hi" }));
  return out.join("");
}

// The operator's console in the front corner: start and stop buttons, a pilot
// lamp, the mushroom emergency stop, and the label plate on its sloped face.
function console_() {
  const box = { x: 54, y: 52, w: 30, d: 24, r: 2.5 };
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(box, 2), 0, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(box, 0, 3, P, 4, 0.5), { tone: "lo" }));
  const body = k.insetPlan(box, 1.6);
  out.push(S(k.slabOf(body, 3, 9, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(body, 6, P, 4), { tone: "faint" }) }));
  const panel = k.insetPlan(body, 2.2);
  out.push(L(k.planOutline(panel, 12, P, 3), { tone: "lo" }));
  out.push(D(k.corners(panel, 1.6).map(([x, y]) => at([x, y, 12])), { size: 0.4 }));
  // Label plate on the +y face.
  const face = body.y + body.d;
  const Mx = k.sideMatrix([body.x + 3, face], 10.4, P, "left");
  const rules = [[1.6, 1.9, 12], [1.6, 3.6, 8], [1.6, 5.3, 10]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  out.push(`<g transform="${Mx}"><path class="tm-plate" d="${rrect(0, 0, 17, 7, 0.8)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 17, 7, 0.8)}"/><path class="iso-line" data-tone="lo" data-free="" d="${rules}"/></g>`);
  // Buttons, far to near.
  const parts = [
    { at: [61, 60], svg: () => S(k.cylinder(61, 60, 2.6, 12, 0.8, P, 24), { tone: "lo" }) + S(k.cylinder(61, 60, 2, 12.8, 1.4, P, 24, 0.3), { tone: "mid" }) },
    { at: [61, 68], svg: () => S(k.cylinder(61, 68, 2.6, 12, 0.8, P, 24), { tone: "lo" }) + S(k.cylinder(61, 68, 2, 12.8, 0.9, P, 24, 0.3), { tone: "mid" }) },
    { at: [69, 57.5], svg: () => S(k.cylinder(69, 57.5, 1.7, 12, 1.6, P, 20), { tone: "lo" }) + L(k.ring(69, 57.5, 0.8, 13.6, P, 12), { tone: "mid" }) },
    { at: [74.5, 66], svg: () => S(k.cylinder(74.5, 66, 3.4, 12, 1, P, 28), { tone: "lo" }) + S(k.cylinder(74.5, 66, 1.6, 13, 1.8, P, 16), { tone: "mid" }) + S(k.cylinder(74.5, 66, 4.6, 14.8, 2.2, P, 36, 0.6), { tone: "mid", inner: L(k.sideArc(74.5, 66, 4.6, 15.9, P), { tone: "faint" }) }) },
  ];
  for (const part of byDepth(parts)) out.push(part.svg());
  return out.join("");
}

// Small fittings on the pedestals: the press's air valve, and the feed's junction box.
function valve() {
  const block = { x: 4, y: 61, w: 10, d: 9, r: 1 };
  const out = [S(k.slabOf(block, 8, 5, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(block, 10.5, P, 3), { tone: "faint" }) })];
  out.push(S(k.cylinder(11.2, 65.5, 2.2, 13, 4.2, P, 20, 0.4), { tone: "mid" }), L(k.ring(11.2, 65.5, 0.9, 17.2, P, 12), { tone: "lo" }));
  out.push(S(k.cylinder(6.4, 65.5, 1.1, 13, 1.8, P, 14), { tone: "lo" }));
  out.push(D([at([5, 62.2, 13]), at([5, 68.8, 13])], { size: 0.38 }));
  return out.join("");
}
function junction() {
  const box = { x: 3, y: -74, w: 11, d: 9, r: 1 };
  return S(k.slabOf(box, 8, 6, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(box, 12.6, P, 3), { tone: "faint" }) }) + screws(box, 14, 1.4);
}

// The bearing housing under the table and its bolted flange.
function housing() {
  const out = [S(k.cylinder(0, 0, 46, 0, 1.6, P, 64, 0.5), { tone: "lo" })];
  out.push(D(Array.from({ length: 16 }, (_, i) => polar(44, i * 22.5)).map(([x, y]) => at([x, y, 1.6])), { size: 0.4, tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 42, 1.6, GEAR_Z[0] - 1.6, P, 64), { tone: "mid" }));
  return out.join("");
}

function pedestal(theta) {
  const plan = planAt(theta, 58, 90, -16, 16, 3);
  return S(k.slabOf(plan, 0, 8, P, 4, 0.8), { tone: "mid" }) + L(k.corners(plan, 3.5).map(([x, y]) => k.ring(x, y, 1.5, 8, P, 12)).join(""), { tone: "lo" }) + screws(plan, 8, 3.5);
}

function column(theta) {
  const flange = planAt(theta, 77, 90, -8, 8, 1.5);
  const post = planAt(theta, 80, 88, -5, 5, 1.2);
  return S(k.slabOf(flange, 8, 1.6, P, 3, 0.4), { tone: "mid" }) + screws(flange, 9.6, 1.8)
    + S(k.slabOf(post, 9.6, ARM_Z[0] - 9.6, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(post, 20, P, 3), { tone: "faint" }) });
}

function arm(theta) {
  const plan = planAt(theta, 24, 88, -6, 6, 2);
  const out = [S(k.slabOf(plan, ARM_Z[0], ARM_Z[1] - ARM_Z[0], P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(plan, ARM_Z[0] + 2, P, 4), { tone: "faint" }) })];
  out.push(D([[84, -3.4], [84, 3.4], [27.5, -3.4], [27.5, 3.4]].map(([r, t]) => at([...local(theta, r, t), ARM_Z[1]])), { size: 0.42 }));
  return out.join("");
}

// The rodless actuator along a picker arm's top, and its slider (which moves).
function actuator(theta) {
  const body = planAt(theta, 31, 82, -3, 3, 1.2);
  const z = ARM_Z[1];
  const out = [];
  const caps = [planAt(theta, 27.5, 31, -4, 4, 1), planAt(theta, 82, 85.5, -4, 4, 1)];
  const sorted = [{ plan: caps[0] }, { plan: body, body: true }, { plan: caps[1] }].map((p) => ({ ...p, at: centre(p.plan) }));
  for (const part of byDepth(sorted)) {
    if (part.body) out.push(S(k.slabOf(body, z, 3, P, 3, 0.4), { tone: "mid" }), L(k.lineOnTop(local(theta, 31, 0), local(theta, 82, 0), z + 3, P), { tone: "lo" }));
    else out.push(S(k.slabOf(part.plan, z, 4, P, 3, 0.4), { tone: "lo" }), D([at([...centre(part.plan), z + 4])], { size: 0.45 }));
  }
  return out.join("");
}
function slider(theta) {
  const plan = planAt(theta, M.RN - 4, M.RN + 4, -4.2, 4.2, 1);
  return S(k.slabOf(plan, ARM_Z[1] + 3, 2, P, 3, 0.4), { tone: "mid" }) + D([at([...local(theta, M.RN - 2.2, 0), ARM_Z[1] + 5]), at([...local(theta, M.RN + 2.2, 0), ARM_Z[1] + 5])], { size: 0.38 });
}

// A picker under its arm: carriage and guide bushing (move out), rod and head (move out and down).
function carriage(theta) {
  const plan = planAt(theta, M.RN - 6, M.RN + 6, -6, 6, 1.2);
  const [bx, by] = local(theta, M.RN, 0);
  return S(k.cylinder(bx, by, 3.2, 39.4, 2.6, P, 24), { tone: "mid" }) + S(k.slabOf(plan, 42, 4, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(plan, 44, P, 3), { tone: "faint" }) });
}
function head(theta) {
  const hz = M.HEAD_UP;
  const [bx, by] = local(theta, M.RN, 0);
  const out = [];
  const cups = M.SLOTS.map(([t0, t1]) => ({ at: local(theta, M.RN, (t0 + t1) / 2) }));
  for (const cup of byDepth(cups)) out.push(S(k.cylinder(cup.at[0], cup.at[1], 0.85, hz, 1.4, P, 12), { tone: "mid", crease: "none" }));
  const plate = planAt(theta, M.RN - 6, M.RN + 6, -14, 14, 1);
  out.push(S(k.slabOf(plate, hz + 1.4, 2.6, P, 3, 0.5), { tone: "mid" }));
  out.push(screws(plate, hz + 4, 1.6));
  out.push(S(k.cylinder(bx, by, 1.5, hz + 4, 9.6, P, 16), { tone: "hi", crease: "lo" }));
  return out.join("");
}

// A bin on a picker station's pedestal, open at the top; bars dropped into it vanish below the rim.
const BIN_Z = [8, 20];
function bin(theta) {
  const plan = planAt(theta, 61, 75, -16, 16, 1.5);
  const hole = k.insetPlan(plan, 1.6);
  return S(k.slabOf(plan, BIN_Z[0], BIN_Z[1] - BIN_Z[0], P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(plan, 11, P, 3), { tone: "faint" }) })
    + `<path class="tm-hole" d="${k.planOutline(hole, BIN_Z[1], P, 3)}"/>` + L(k.planOutline(hole, BIN_Z[1], P, 3), { tone: "lo" });
}
function binClip(theta, id) {
  const hole = k.insetPlan(planAt(theta, 61, 75, -16, 16, 1.5), 1.6);
  const points = [...k.boxCorners(hole, BIN_Z[1], BIN_Z[1] + 60)].map(at);
  return `<clipPath id="${id}"><path d="${hullPath(points)}"/></clipPath>`;
}
function hullPath(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => list.reduce((h, p) => { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); return h; }, []);
  const hull = [...half(sorted).slice(0, -1), ...half([...sorted].reverse()).slice(0, -1)];
  return k.pathOf(hull, true);
}

// The feed hopper over the nest at the feed station: six chutes, one per row slot.
function hopper() {
  const theta = M.STATION.feed;
  const body = planAt(theta, 26, 40, -15, 15, 1.5);
  const gate = planAt(theta, 25, 41, -16, 16, 1);
  const neck = planAt(theta, 30, 36, -4, 4, 1);
  const out = [];
  out.push(S(k.slabOf(gate, 33.6, 1.4, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.slabOf(body, 35, 9, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(body, 2), 44, P, 3), { tone: "faint" }));
  out.push(S(k.slabOf(neck, 44, ARM_Z[0] - 44, P, 3), { tone: "mid" }));
  // Window on the face toward the table, showing the six chutes.
  const face = body.y + body.d;
  const Mx = k.sideMatrix([body.x + 4, face], 42.4, P, "left");
  const slots = M.SLOTS.slice(1, 7).map(([t0, t1]) => { const x = local(theta, 0, (t0 + t1) / 2)[0] - body.x - 4; return `M${x} 0V6`; }).join("");
  out.push(`<g transform="${Mx}"><path class="tm-screen" d="${rrect(0, 0, body.w - 8, 6, 1)}"/><path class="iso-line" data-tone="lo" d="${slots}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, body.w - 8, 6, 1)}"/></g>`);
  out.push(D([[body.x + 2, face, 42.4], [body.x + body.w - 2, face, 42.4], [body.x + 2, face, 36.6], [body.x + body.w - 2, face, 36.6]].map(at), { size: 0.4 }));
  return out.join("");
}

// The die rack beside the format station: a pocket for each die.
function rack() {
  const plan = { x: -50, y: 50, w: 31, d: 45, r: 2 };
  const out = [S(k.slabOf(plan, 0, RACK_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(plan, 4, P, 4), { tone: "faint" }) })];
  for (const y of RACK_Y) {
    const pocket = { x: RACK_X - 13.6, y: y - 5.5, w: 27.2, d: 11, r: 0.8 };
    out.push(`<path class="tm-hole" d="${k.planOutline(pocket, RACK_TOP, P, 3)}"/>`, L(k.planOutline(pocket, RACK_TOP, P, 3), { tone: "lo" }));
  }
  out.push(screws(plan, RACK_TOP, 2.6));
  return out.join("");
}

// One die, built in its rack pocket. World x = RACK_X - τ, y = slot y + ρ, like the tray at the format station.
function die(index) {
  const format = FORMATS[index];
  const y = RACK_Y[index];
  const z = RACK_TOP;
  const atDie = (rho, tau) => [RACK_X - tau, y + rho];
  const bodyPlan = { x: RACK_X - 10.3, y: y - 6, w: 20.6, d: 12, r: 1 };
  const parts = [{ at: centre(bodyPlan), svg: `<g data-part="die-body">${S(k.slabOf(bodyPlan, z, 5, P, 3, 0.6), { tone: "mid" })}</g>` }];
  const strips = [];
  for (const [slot, has, tau] of [[0, format.header, [-13.2, -10.6]], [7, format.footer, [10.6, 13.2]]]) {
    if (!has) continue;
    const lip = { x: RACK_X - tau[1], y: y - 6, w: tau[1] - tau[0], d: 12, r: 0.6 };
    parts.push({ at: centre(lip), svg: `<g data-part="die-body">${S(k.slabOf(lip, z, 8, P, 2, 0.4), { tone: "mid" })}</g>` + D([at([...centre(lip), z + 8])], { size: 0.4 }) });
    const [s0, s1] = M.SLOTS[slot];
    const strip = { x: RACK_X - s1, y: y - M.BAR_RHO, w: s1 - s0, d: M.BAR_RHO * 2, r: 0.4 };
    strips.push(`<g data-part="strip">${S(k.slabOf(strip, z, M.BAR_H, P, 2), { tone: "hi", crease: "lo" })}</g>`);
  }
  // The die face's pattern, engraved on its top: one mark per row slot.
  let marks = "";
  let dots = [];
  for (let slot = 1; slot <= 6; slot++) {
    const [t0, t1] = M.SLOTS[slot];
    const tm = (t0 + t1) / 2;
    const seg = (a, b) => k.lineOnTop(atDie(a, tm), atDie(b, tm), z + 5, P);
    if (index === 0) { marks += seg(-4.2, -0.9) + seg(0.9, 4.2); dots.push(at([...atDie(0, tm), z + 5])); }
    else if (index === 1) marks += k.lineOnTop(atDie(-4.4, t0 + 0.55), atDie(-4.4, t1 - 0.55), z + 5, P) + seg(-3.4, 3.4) + k.lineOnTop(atDie(4.4, t0 + 0.55), atDie(4.4, t1 - 0.55), z + 5, P);
    else marks += [[-4.3, -2.6], [-2.1, -0.4], [0.1, 1.8], [2.3, 4.0]].map(([a, b]) => seg(a, b)).join("");
  }
  const sorted = byDepth(parts).map((p) => p.svg);
  return `<g data-part="die" data-die="${index}">${strips.join("")}${sorted.join("")}${L(marks, { tone: "mid", free: true })}${dots.length ? D(dots, { size: 0.4, tone: "mid" }) : ""}</g>`;
}

// The press at the format station: ram rod and die holder (move), guide bushing, cylinder on the arm.
function ram() {
  const [hx, hy] = HOLDER;
  const holder = planAt(M.STATION.format, M.RN - 5, M.RN + 5, -10.3, 10.3, 1);
  return S(k.slabOf(holder, M.DIE_UP + 5, 3, P, 3, 0.5), { tone: "mid" }) + screws(holder, M.DIE_UP + 8, 1.6)
    + S(k.cylinder(hx, hy, 2.2, M.DIE_UP + 8, 8, P, 18), { tone: "hi", crease: "lo" });
}
function pressTop() {
  const [hx, hy] = HOLDER;
  const z = ARM_Z[1];
  const out = [S(k.cylinder(hx, hy, 7.4, z, 1.4, P, 40, 0.4), { tone: "lo" })];
  out.push(S(k.cylinder(hx, hy, 6.4, z + 1.4, 10.6, P, 40, 0.6), { tone: "mid", inner: L(k.sideArc(hx, hy, 6.4, z + 8.5, P), { tone: "faint" }) }));
  out.push(S(k.cylinder(hx, hy, 7.2, z + 12, 2.2, P, 40, 0.5), { tone: "mid" }));
  out.push(D(Array.from({ length: 6 }, (_, i) => polar(5.6, i * 60 + 30)).map(([x, y]) => at([hx + x, hy + y, z + 14.2])), { size: 0.4 }));
  for (const dx of [-3, 3]) out.push(S(k.cylinder(hx + dx, hy - 1.5, 1.1, z + 14.2, 2.6, P, 14), { tone: "mid" }));
  return out.join("");
}

// The index plunger at the back: a post, an arm over the table rim and a plunger in one of the four holes.
const PLUNGER = { post: polar(62, PLUNGER_AT), hole: polar(M.HOLE_R, PLUNGER_AT), lift: 3.5 };
function plungerPost() {
  const [x, y] = PLUNGER.post;
  return S(k.cylinder(x, y, 6, 0, 1.4, P, 28, 0.4), { tone: "lo" }) + D([0, 120, 240].map((a) => polar(4.6, a + 45)).map(([dx, dy]) => at([x + dx, y + dy, 1.4])), { size: 0.4 })
    + S(k.cylinder(x, y, 3.6, 1.4, 35.6, P, 24, 0.4), { tone: "mid" });
}
function plungerArm() {
  const [hx, hy] = PLUNGER.hole;
  const u = polar(1, PLUNGER_AT);
  const v = [-u[1], u[0]];
  const ring = k.roundedPlan({ x: M.HOLE_R - 3.4, y: -2.6, w: 62 - M.HOLE_R + 6.2, d: 5.2, r: 1.2 }, 3).map(([r, t]) => [r * u[0] + t * v[0], r * u[1] + t * v[1]]);
  return S(k.cylinder(hx, hy, 2.5, 30, 3, P, 20), { tone: "mid" }) + S(k.extrude(ring, 33, 4, P, { bevel: 0.4 }), { tone: "mid" })
    + D([at([...PLUNGER.post, 37])], { size: 0.45 });
}
const plungerRod = () => S(k.cylinder(PLUNGER.hole[0], PLUNGER.hole[1], 1.15, M.TOP, 6.6, P, 14), { tone: "hi", crease: "lo" });
// Above the arm the plunger's stem and pull knob are rebuilt as it lifts.
export const knobSvg = (lift) => S(k.cylinder(PLUNGER.hole[0], PLUNGER.hole[1], 1.15, 37, 1.6 + lift, P, 14), { tone: "hi", crease: "lo" }) + S(k.cylinder(PLUNGER.hole[0], PLUNGER.hole[1], 2.3, 38.6 + lift, 2.2, P, 20, 0.4), { tone: "mid" });

// The drive at the right: gearbox, motor and the pinion that turns the table's ring gear.
function drive() {
  const box = { x: -57, y: -57, w: 24, d: 24, r: 2 };
  const out = [S(k.slabOf(box, 0, 9, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(box, 3, P, 4), { tone: "faint" }) }), screws(box, 9, 2.4)];
  out.push(S(k.cylinder(PINION.x, PINION.y, 3, 9, 1, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(PINION.x, PINION.y, PINION.r, PINION.z[0], PINION.z[1] - PINION.z[0], P, 32, 0.4), { tone: "mid" }));
  out.push(`<g data-part="pinion-teeth">${M.teethSvg(PINION.x, PINION.y, PINION.r, PINION.z[0], PINION.z[1], PINION.teeth, pinionPhase(270), P)}</g>`);
  out.push(S(k.cylinder(MOTOR.x, MOTOR.y, MOTOR.r + 1.2, 9, 1.4, P, 36), { tone: "lo" }));
  out.push(S(k.cylinder(MOTOR.x, MOTOR.y, MOTOR.r, 10.4, 17, P, 40, 0.4), { tone: "mid", inner: L(k.knurl(MOTOR.x, MOTOR.y, MOTOR.r, 12, 25, 30, P, 0) + k.sideArc(MOTOR.x, MOTOR.y, MOTOR.r, 12, P) + k.sideArc(MOTOR.x, MOTOR.y, MOTOR.r, 25, P), { tone: "lo" }) }));
  out.push(S(k.cylinder(MOTOR.x, MOTOR.y, MOTOR.r - 1.4, 27.4, 2.4, P, 36, 0.4), { tone: "mid" }));
  out.push(L(k.ring(MOTOR.x, MOTOR.y, 1.8, 29.8, P, 16), { tone: "lo" }));
  return out.join("");
}
const gearPhase = (angle) => angle * RAD;
function pinionPhase(angle) {
  return -angle * RAD * (GEAR_R / PINION.r) + Math.PI / PINION.teeth;
}

function gear() {
  return S(k.cylinder(0, 0, GEAR_R, GEAR_Z[0], GEAR_Z[1] - GEAR_Z[0], P, 72), { tone: "mid" })
    + `<g data-part="gear-teeth">${M.teethSvg(0, 0, GEAR_R, GEAR_Z[0], GEAR_Z[1], 60, gearPhase(270), P)}</g>`;
}

function table() {
  return `<path class="iso-halo" d="${k.cylinder(0, 0, M.TABLE_R - 4, M.TABLE_Z[0], 0.1, P, 48).fill}" style="filter:blur(5px)"/>`
    + S(k.cylinder(0, 0, M.TABLE_R, M.TABLE_Z[0], M.TABLE_Z[1] - M.TABLE_Z[0], P, 96, 1.2), { tone: "mid", inner: L(k.sideArc(0, 0, M.TABLE_R, 21.5, P, 48), { tone: "faint" }) })
    + L(k.ring(0, 0, 51, M.TOP, P, 96) + k.ring(0, 0, 53, M.TOP, P, 96), { tone: "lo" });
}

// The counter on the write station's column: how many lines the last report had.
function counter() {
  const post = planAt(M.STATION.write, 80, 88, -5, 5, 1.2);
  const face = post.y + post.d;
  const Mx = k.sideMatrix([post.x + 0.2, face], 38, P, "left");
  return `<g transform="${Mx}"><path class="tm-screen" d="${rrect(0, 0, 7.6, 5.4, 1)}"/><text class="iso-face-text tm-digits" data-part="counter" data-tone="hi" x="6.4" y="4.2" font-size="4.2" text-anchor="end">0${exportReport(FORMATS[START]).lines.length}</text><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 7.6, 5.4, 1)}"/></g>`
    + D([at([post.x + 1.2, face, 40.6]), at([post.x + post.w - 1.2, face, 40.6])], { size: 0.38 });
}
function nameplate() {
  const post = planAt(M.STATION.format, 80, 88, -5, 5, 1.2);
  const face = post.y + post.d;
  const Mx = k.sideMatrix([post.x + 0.8, face], 39, P, "left");
  const lines = [[1.6, 2.2, 5.4], [1.6, 4, 3.6], [1.6, 5.8, 4.6]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  return `<g transform="${Mx}"><path class="tm-plate" d="${rrect(0, 0, 8.4, 8, 0.8)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 8.4, 8, 0.8)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`;
}

const park = (theta) => k.translateAlong(P, [...local(theta, M.OUT, 0), 0]);
const dieOffset = (index) => [HOLDER[0] - RACK_X, HOLDER[1] - RACK_Y[index], M.DIE_UP - RACK_TOP];
const startBars = M.barsAt(M.REST, START);
const restAngle = M.trayAngle(M.REST);

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một máy bàn xoay chia độ. Bàn xoay mang một khay thanh dữ liệu lần lượt qua bốn trạm bắt cố định trên đế theo một thứ tự không đổi: phễu cấp sáu đơn hàng, tay gắp nhấc các đơn bị huỷ bỏ vào thùng, máy ép định dạng, và tay gắp ghi kết quả vào hộp cùng bộ đếm số dòng. Chỉ trạm định dạng lắp một khuôn lấy từ giá bên cạnh: mỗi khuôn là một lớp con (CSV, JSON Lines, fixed-width), có thêm hộp nhãn ở đầu nếu định dạng đó có header hoặc footer.",
  body: [
    base(),
    housing(),
    pedestal(M.STATION.filter),
    pedestal(M.STATION.feed),
    junction(),
    column(M.STATION.filter),
    column(M.STATION.feed),
    bin(M.STATION.filter),
    binClip(M.STATION.filter, "tm-bin-filter"),
    `<g clip-path="url(#tm-bin-filter)"><g data-part="bin-filter"></g></g>`,
    plungerPost(),
    drive(),
    gear(),
    table(),
    `<g data-part="table-top">${M.tableTopSvg(restAngle, startBars, P)}</g>`,
    pedestal(M.STATION.write),
    pedestal(M.STATION.format),
    valve(),
    rack(),
    console_(),
    bin(M.STATION.write),
    binClip(M.STATION.write, "tm-bin-write"),
    `<g clip-path="url(#tm-bin-write)"><g data-part="bin-write"></g></g>`,
    `<g data-part="air">${M.barsSvg(startBars, "air", P)}</g>`,
    hopper(),
    `<g data-part="head" data-station="filter" transform="${park(M.STATION.filter)}">${head(M.STATION.filter)}</g>`,
    `<g data-part="carriage" data-station="filter" transform="${park(M.STATION.filter)}">${carriage(M.STATION.filter)}</g>`,
    `<g data-part="plunger">${plungerRod()}</g>`,
    plungerArm(),
    `<g data-part="knob">${knobSvg(0)}</g>`,
    arm(M.STATION.filter),
    arm(M.STATION.feed),
    actuator(M.STATION.filter),
    `<g data-part="slider" data-station="filter" transform="${park(M.STATION.filter)}">${slider(M.STATION.filter)}</g>`,
    // Near side: the dies (parked ones far to near, the fitted one last), the press, the write picker.
    ...[2, 1, 0].filter((i) => i !== START).map((i) => die(i)),
    die(START).replace('data-part="die"', `data-part="die" transform="${k.translateAlong(P, dieOffset(START))}"`),
    `<g data-part="ram">${ram()}</g>`,
    S(k.cylinder(HOLDER[0], HOLDER[1], 4.2, 42, ARM_Z[0] - 42, P, 28, 0.4), { tone: "mid" }),
    `<g data-part="head" data-station="write" transform="${park(M.STATION.write)}">${head(M.STATION.write)}</g>`,
    `<g data-part="carriage" data-station="write" transform="${park(M.STATION.write)}">${carriage(M.STATION.write)}</g>`,
    column(M.STATION.write),
    column(M.STATION.format),
    counter(),
    nameplate(),
    arm(M.STATION.write),
    arm(M.STATION.format),
    actuator(M.STATION.write),
    `<g data-part="slider" data-station="write" transform="${park(M.STATION.write)}">${slider(M.STATION.write)}</g>`,
    pressTop(),
  ],
});

const strip = (source) => source.replace(/^import .*$/gm, "").replace(/^export /gm, "").replace(/\bk\./g, "");
const MODEL = strip(readFileSync(join(HERE, "model.mjs"), "utf8"));
const PARTS = strip(readFileSync(join(HERE, "parts.mjs"), "utf8"));

export const live = `
${MODEL}
${PARTS}
const P = ${JSON.stringify(P)};
const START = ${START}, GEAR_R = ${GEAR_R}, GEAR_Z = ${JSON.stringify(GEAR_Z)}, PINION = ${JSON.stringify(PINION)};
const OFFSETS = ${JSON.stringify(FORMATS.map((_, i) => dieOffset(i)))};
const PLUNGER = ${JSON.stringify(PLUNGER)};
const pinionPhase = ${pinionPhase.toString()};
const knobSvg = ${knobSvg.toString().replace(/\bk\./g, "").replace(/\bS\(/g, "solidSvg(")};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (selector) => svg.querySelector(selector);
const el = {
  table: q('[data-part="table-top"]'), gear: q('[data-part="gear-teeth"]'), pinion: q('[data-part="pinion-teeth"]'),
  air: q('[data-part="air"]'), binFilter: q('[data-part="bin-filter"]'), binWrite: q('[data-part="bin-write"]'),
  ram: q('[data-part="ram"]'), plunger: q('[data-part="plunger"]'), knob: q('[data-part="knob"]'), counter: q('[data-part="counter"]'),
  dies: [0, 1, 2].map((i) => q('[data-die="' + i + '"]')),
};
const pickers = ["filter", "write"].map((name) => ({
  name, theta: STATION[name], start: T[name][0],
  moving: svg.querySelectorAll('[data-station="' + name + '"][data-part="carriage"], [data-station="' + name + '"][data-part="slider"]'),
  head: q('[data-station="' + name + '"][data-part="head"]'),
}));
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const REPORTS = FORMATS.map((format) => exportReport(format));
let sel = START, t = REST, printed = START, fitted = START, ext = 1, move = null, count = REPORTS[START].lines.length;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0, settled = false;
const keys = {};
const put = (node, name, html) => { if (keys[name] !== html) { keys[name] = html; node.innerHTML = html; } };
// A die's way between its rack pocket and the holder: straight up out of the pocket, then across.
function diePath(i, p) {
  const [dx, dy, dz] = OFFSETS[i];
  const lift = 17;
  if (p < 0.3) return [0, 0, lift * ease(p / 0.3)];
  const u = ease((p - 0.3) / 0.7);
  return [dx * u, dy * u, lift + (dz - lift) * u];
}
function describe() {
  const report = REPORTS[sel];
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", FORMATS[sel].cls + ": đọc " + report.read + " đơn, bỏ " + report.dropped + " đơn huỷ, ghi " + report.lines.length + " dòng vào " + report.file);
  emit();
}
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function draw() {
  const angle = trayAngle(t);
  const bars = barsAt(t, printed);
  put(el.table, "table", tableTopSvg(angle, bars, P));
  put(el.gear, "gear", teethSvg(0, 0, GEAR_R, GEAR_Z[0], GEAR_Z[1], 60, angle * Math.PI / 180, P));
  put(el.pinion, "pinion", teethSvg(PINION.x, PINION.y, PINION.r, PINION.z[0], PINION.z[1], PINION.teeth, pinionPhase(angle), P));
  put(el.air, "air", barsSvg(bars, "air", P));
  put(el.binFilter, "binFilter", barsSvg(bars, "filterBin", P));
  put(el.binWrite, "binWrite", barsSvg(bars, "writeBin", P));
  for (const picker of pickers) {
    const { hz, dr } = pickerAt(t - picker.start);
    const [ux, uy] = [Math.round(Math.cos(picker.theta * Math.PI / 180)), Math.round(Math.sin(picker.theta * Math.PI / 180))];
    const slide = translateAlong(P, [dr * ux, dr * uy, 0]);
    picker.moving.forEach((node) => node.setAttribute("transform", slide));
    picker.head.setAttribute("transform", translateAlong(P, [dr * ux, dr * uy, hz - HEAD_UP]));
  }
  const press = dieAt(t) - DIE_UP;
  el.ram.setAttribute("transform", translateAlong(P, [0, 0, press]));
  el.dies.forEach((node, i) => {
    let offset = [0, 0, 0];
    if (i === fitted) offset = [OFFSETS[i][0], OFFSETS[i][1], OFFSETS[i][2] + press];
    else if (move && move.die === i) offset = diePath(i, move.p);
    node.setAttribute("transform", translateAlong(P, offset));
    const out = i === fitted ? ext * stripsOut(t) : 0;
    node.querySelectorAll('[data-part="strip"]').forEach((s) => s.setAttribute("transform", translateAlong(P, [0, 0, -BAR_H * out])));
    node.querySelectorAll('[data-part="die-body"] > .iso-solid').forEach((s) => s.toggleAttribute("data-lit", i === fitted));
  });
  const lift = plungerLift(t) * PLUNGER.lift;
  el.plunger.setAttribute("transform", translateAlong(P, [0, 0, lift]));
  put(el.knob, "knob", knobSvg(lift));
  if (el.counter.textContent !== "0" + count) el.counter.textContent = "0" + count;
  const label = (t >= CONTACT ? FORMATS[printed] : FORMATS[sel]).label;
  const report = REPORTS[printed];
  const text = t < T.i1[0] ? label + " · đọc " + report.read + " đơn"
    : t < T.i2[0] ? label + " · lọc: bỏ " + report.dropped + " đơn huỷ"
    : t < T.i3[0] ? label + " · định dạng " + report.kept + " đơn"
    : report.file + " · " + report.lines.length + " dòng";
  if (readout.textContent !== text) readout.textContent = text;
}
// The die change: retract the old die's strips, carry it to the rack, bring the
// chosen one over, slide its strips out. The ram has to be up for any of it.
function changeDie(dt) {
  const pressing = t > T.press[0] && t < T.press[1];
  if (move) {
    if (move.die !== sel && move.dir > 0) move.dir = -1;
    move.p = Math.min(1, Math.max(0, move.p + move.dir * dt / 0.9));
    if (move.dir > 0 && move.p >= 1) { fitted = move.die; ext = 0; move = null; }
    else if (move.dir < 0 && move.p <= 0) move = null;
    return;
  }
  if (pressing) return;
  if (fitted !== sel) {
    if (fitted >= 0 && ext > 0) ext = Math.max(0, ext - dt / 0.3);
    else if (fitted >= 0) { move = { die: fitted, p: 1, dir: -1 }; fitted = -1; }
    else move = { die: sel, p: 0, dir: 1 };
  } else if (ext < 1) ext = Math.min(1, ext + dt / 0.3);
}
const ready = () => fitted === sel && ext >= 1 && !move;
function advance(dt) {
  let next = t + dt;
  if (t < T.press[0] && next >= T.press[0] && !ready()) next = T.press[0];
  if (t < CONTACT && next >= CONTACT) printed = fitted >= 0 ? fitted : printed;
  if (t < REST && next >= REST) count = REPORTS[printed].lines.length;
  if (!touring && printed === sel && t < REST && next >= REST) { next = REST; settled = true; }
  if (next >= CYCLE) {
    next -= CYCLE;
    if (touring) { sel = (sel + 1) % FORMATS.length; describe(); }
  }
  t = next;
}
function rest() {
  // Reduced motion, or a jump: the resting pose of the chosen format.
  t = REST; printed = sel; fitted = sel; ext = 1; move = null; count = REPORTS[sel].lines.length; settled = true;
  draw();
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (still.matches) { rest(); frame = 0; return; }
  changeDie(dt);
  if (touring || !settled) advance(dt * (touring ? 1 : 2));
  draw();
  frame = visible && (touring || !settled || !ready()) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen format until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; emit(); run(); }, 3600);
  if (index !== sel || !settled || printed !== sel) settled = false;
  if (index !== sel) { sel = index; describe(); } else emit();
  if (still.matches) rest();
  run();
};
const pick = (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
  return Math.floor(share * FORMATS.length);
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = !still.matches; emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; settled = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để chọn định dạng";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse") choose(pick(event), false); });
stage.addEventListener("pointerdown", (event) => choose(pick(event), event.pointerType !== "mouse"));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = Math.min(FORMATS.length - 1, sel + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = Math.max(0, sel - 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = FORMATS.length - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

const steps = FORMATS.map((format, i) => {
  const report = exportReport(format);
  const hooks = [format.header && "<code>header</code>", format.footer && "<code>footer</code>"].filter(Boolean);
  const extra = hooks.length ? ` và hook ${hooks.join(", ")}` : ", không cần hook nào";
  return {
    label: format.label,
    short: format.short,
    caption: `<code>${format.cls}</code> chỉ viết <code>format_row</code>${extra}: <code>${esc(report.lines[report.header ? 1 : 0]).replace(/  /g, "&nbsp;&nbsp;")}</code>. Khung <code>export()</code> vẫn đọc ${report.read} đơn, bỏ ${report.dropped} đơn huỷ, ghi <strong>${report.lines.length} dòng</strong> vào <code>${report.file}</code>.`,
  };
});
function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const first = exportReport(FORMATS[START]);
export const plate = withSteps(k.plateHtml({
  fig: "Fig 7",
  title: "Template Method",
  hint: "Rê chuột để chọn định dạng",
  readout: `${first.file} · ${first.lines.length} dòng`,
  keys: [
    { mark: "lit", label: "Khuôn đang lắp ở trạm định dạng: phần duy nhất lớp con viết" },
    { mark: "raised", label: "Bàn xoay và ba trạm còn lại: khung export() dùng chung, thứ tự không đổi" },
  ],
  caption:
    `Bàn xoay luôn đưa khay qua bốn trạm theo đúng một thứ tự: cấp ${ORDERS.length} đơn, lọc đơn huỷ, định dạng, ghi file. Đổi định dạng chỉ là đổi khuôn ở trạm thứ ba; khuôn nào có hộp nhãn ở đầu thì thêm dòng header hoặc footer, còn bộ đếm ở trạm ghi đếm số dòng của file. Tổng tiền của cả ba file vẫn là ${groupVND(first.total)} ₫.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Template Method: phím mũi tên để chọn định dạng CSV, JSON Lines hoặc fixed-width" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước: chọn định dạng", steps, start: START }));

export const FIGURE_CSS = `
.tm-hole{fill:var(--anatomy-shade-0)}
.tm-screen{fill:var(--anatomy-shade-1)}
.tm-plate{fill:var(--anatomy-top)}
.tm-digits{letter-spacing:.06em}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
