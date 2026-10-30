// What moves on the dial machine, as pure functions of the cycle clock: the
// turntable's angle, the two pickers, the press ram and every row bar on the
// tray. figure.mjs draws the resting pose with these at build time, and the page
// inlines this file (imports dropped, `k.` removed) to redraw the same parts per frame.

import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import { CANCELLED, FORMATS } from "./model.mjs";

const RAD = Math.PI / 180;

// Turntable.
export const TABLE_R = 54;
export const TABLE_Z = [18, 26];
export const TOP = TABLE_Z[1];
export const RN = 33; // radius of the four nest centres
export const HOLE_R = 47; // index holes, half way between nests

// The four stations around the table, by angle in degrees (x is 0, y is 90).
export const STATION = { feed: 270, filter: 180, format: 90, write: 0 };

// Slots on a nest, along its tangential axis τ: header strip, six order rows, footer strip.
const ROW_W = 2.6;
const STRIP_W = 1.8;
const GAP = 0.9;
export const SLOTS = [[-12.75, -12.75 + STRIP_W]];
for (let j = 0; j < 6; j++) SLOTS.push([-10.05 + j * (ROW_W + GAP), -10.05 + j * (ROW_W + GAP) + ROW_W]);
SLOTS.push([12.75 - STRIP_W, 12.75]);
export const BAR_RHO = 5.5; // half length of a bar along the nest's radial axis ρ
export const BAR_Z = TOP + 0.8; // bars rest on the nest plate
export const BAR_H = 1.6;
const BAR_TOP = BAR_Z + BAR_H;

// One machine cycle, in seconds. The tray starts empty under the feed hopper.
export const CYCLE = 11.6;
export const T = { feed: [0, 1.6], i1: [1.6, 2.6], filter: [2.6, 5.0], i2: [5.0, 6.0], press: [6.0, 7.2], i3: [7.2, 8.2], write: [8.2, 10.6], i4: [10.6, 11.6] };
export const REST = T.i3[1]; // the tray has just reached the write station, printed
export const CONTACT = T.press[0] + 0.45; // the die sits on the rows
const INDEXES = [T.i1, T.i2, T.i3, T.i4];
const G = 90; // gravity, slowed so a falling bar can be followed
const FALL_FROM = 35 - BAR_Z; // the feed hopper's bottom gate, above the nest
export const HEAD_UP = 35.4; // picker cups' bottom when lifted
export const HEAD_DOWN = BAR_TOP; // cups on the bars
export const OUT = 35; // picker travel, from the nest out over the bin
export const DIE_UP = 34; // die bottom with the ram up
export const DIE_DOWN = BAR_TOP;

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * u * (u * (u * 6 - 15) + 10));
const progress = (t, [a, b]) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;

// The tray's angle: it indexes a quarter turn backwards after each station.
export const trayAngle = (t) => 270 - 90 * INDEXES.reduce((turned, span) => turned + ease(progress(t, span)), 0);

// The index plunger lifts out of its hole just before each index and drops back after.
export function plungerLift(t) {
  let lift = 0;
  for (const [a, b] of INDEXES) lift = Math.max(lift, Math.min(ease(progress(t, [a - 0.22, a - 0.02])), 1 - ease(progress(t, [b - 0.12, b + 0.08]))));
  return lift;
}

// A picker's stroke. It waits over its bin, runs in over the tray, goes down,
// grips, lifts, runs back out and lets go, so the tray stays in view between picks.
export const GRIP = 0.9; // the cups reach the bars
export const LET_GO = 2.0; // the bars drop into the bin
export function pickerAt(s) {
  let dr = OUT;
  if (s >= 0 && s < 0.5) dr = OUT * (1 - ease(s / 0.5));
  else if (s >= 0.5 && s < 1.45) dr = 0;
  else if (s >= 1.45 && s < LET_GO) dr = OUT * ease((s - 1.45) / (LET_GO - 1.45));
  let hz = HEAD_UP;
  if (s >= 0.5 && s < GRIP) hz = lerp(HEAD_UP, HEAD_DOWN, ease((s - 0.5) / (GRIP - 0.5)));
  else if (s >= GRIP && s < 1.05) hz = HEAD_DOWN;
  else if (s >= 1.05 && s < 1.45) hz = lerp(HEAD_DOWN, HEAD_UP, ease((s - 1.05) / 0.4));
  return { hz, dr };
}

// The format die's bottom: down onto the rows, a short dwell, back up.
export function dieAt(t) {
  const s = t - T.press[0];
  if (s >= 0 && s < 0.45) return lerp(DIE_UP, DIE_DOWN, ease(s / 0.45));
  if (s >= 0.45 && s < 0.65) return DIE_DOWN;
  if (s >= 0.65 && s < 1.2) return lerp(DIE_DOWN, DIE_UP, ease((s - 0.65) / 0.55));
  return DIE_UP;
}

// How far the die's header and footer strips hang out of their cartridges: they
// are left on the tray at contact and the next ones slide out as the die rises.
export function stripsOut(t) {
  const s = t - T.press[0];
  return s >= 0.45 && s < 1.2 ? ease(progress(s, [0.7, 1.2])) : 1;
}

// Every bar of this cycle and where it is: on the tray, in the air (falling from
// the hopper, or held by a picker), or dropping into one of the two bins.
export function barsAt(t, printed) {
  const out = [];
  const angle = trayAngle(t);
  const format = printed >= 0 ? FORMATS[printed] : null;
  const ink = t >= CONTACT + 0.05 ? printed : -1;
  const lifted = (s, alpha, bin) => {
    if (s < GRIP) return null;
    if (s < LET_GO) {
      const { hz, dr } = pickerAt(s);
      return { where: "air", alpha, dr, dz: hz - HEAD_DOWN };
    }
    const dz = HEAD_UP - HEAD_DOWN - 0.5 * G * (s - LET_GO) ** 2;
    return BAR_Z + dz < 9 ? { where: "gone" } : { where: bin, alpha, dr: OUT, dz };
  };
  for (let j = 0; j < 6; j++) {
    const from = 0.15 + 0.12 * j;
    if (t < from) continue;
    const fall = Math.sqrt((2 * FALL_FROM) / G);
    let pose = { where: "tray", alpha: angle, dr: 0, dz: 0 };
    if (t < from + fall) pose = { where: "air", alpha: STATION.feed, dr: 0, dz: FALL_FROM - 0.5 * G * (t - from) ** 2 };
    const cancelled = CANCELLED.includes(j);
    const picked = cancelled ? lifted(t - T.filter[0], STATION.filter, "filterBin") : lifted(t - T.write[0], STATION.write, "writeBin");
    if (picked) pose = picked;
    if (pose.where !== "gone") out.push({ slot: j + 1, cancelled, ink: cancelled ? -1 : ink, ...pose });
  }
  if (format && t >= CONTACT) {
    for (const [slot, has] of [[0, format.header], [7, format.footer]]) {
      if (!has) continue;
      const pose = lifted(t - T.write[0], STATION.write, "writeBin") ?? { where: "tray", alpha: angle, dr: 0, dz: 0 };
      if (pose.where !== "gone") out.push({ slot, cancelled: false, ink, ...pose });
    }
  }
  return out;
}

// Nest-local (ρ radial, τ tangential) to world, for a nest at `alpha` degrees pushed out by `dr`.
export function frameAt(alpha, dr = 0) {
  const a = alpha * RAD;
  const u = [Math.cos(a), Math.sin(a)];
  const v = [-u[1], u[0]];
  const c = [(RN + dr) * u[0], (RN + dr) * u[1]];
  return (rho, tau) => [c[0] + rho * u[0] + tau * v[0], c[1] + rho * u[1] + tau * v[1]];
}

const rect = (at, r0, r1, t0, t1, r = 0.4, steps = 2) => k.roundedPlan({ x: r0, y: t0, w: r1 - r0, d: t1 - t0, r }, steps).map(([rho, tau]) => at(rho, tau));

// The printed marks on a bar: what one line of that format looks like.
function inkOf(at, slot, format, z, P) {
  const [t0, t1] = SLOTS[slot];
  const tm = (t0 + t1) / 2;
  const seg = (r0, r1, tau = tm) => k.lineOnTop(at(r0, tau), at(r1, tau), z, P);
  if (slot === 0 || slot === 7) return { lines: seg(-4.2, 4.2), dots: [] };
  if (format === 0) return { lines: seg(-4.2, -0.9) + seg(0.9, 4.2), dots: [k.iso([...at(0, tm), z], P)] };
  const across = (rho) => k.lineOnTop(at(rho, t0 + 0.55), at(rho, t1 - 0.55), z, P);
  if (format === 1) return { lines: across(-4.4) + seg(-3.4, 3.4) + across(4.4), dots: [] };
  return { lines: [[-4.3, -2.6], [-2.1, -0.4], [0.1, 1.8], [2.3, 4.0]].map(([a, b]) => seg(a, b)).join(""), dots: [] };
}

// One bar (a row or a header/footer strip) as a solid with its marks.
export function barSvg(bar, P) {
  const at = frameAt(bar.alpha, bar.dr);
  const [t0, t1] = SLOTS[bar.slot];
  const z = BAR_Z + bar.dz;
  let inner = "";
  let dots = "";
  if (bar.cancelled) inner = k.lineSvg(k.onTop(k.circleRing(0, 0, 0.62, 12).map(([x, y]) => at(3.9 + x, (t0 + t1) / 2 + y)), z + BAR_H, P, true), { tone: "mid" });
  if (bar.ink >= 0) {
    const ink = inkOf(at, bar.slot, bar.ink, z + BAR_H, P);
    inner = k.lineSvg(ink.lines, { tone: "mid", free: true });
    if (ink.dots.length) dots = k.dotsSvg(ink.dots, { size: 0.42, tone: "hi" });
  }
  return k.solidSvg(k.extrude(rect(at, -BAR_RHO, BAR_RHO, t0, t1, 0.4), z, BAR_H, P), { tone: "hi", crease: "lo", inner }) + dots;
}

const depthAt = (xy, z, P) => k.depthOf([xy[0], xy[1], z], P);

// The bars that belong to one view group, far to near.
export function barsSvg(bars, where, P) {
  return bars
    .filter((bar) => bar.where === where)
    .map((bar) => ({ bar, depth: depthAt(frameAt(bar.alpha, bar.dr)(0, (SLOTS[bar.slot][0] + SLOTS[bar.slot][1]) / 2), BAR_Z + bar.dz, P) }))
    .sort((a, b) => a.depth - b.depth)
    .map(({ bar }) => barSvg(bar, P))
    .join("");
}

// Everything on the turntable's top that turns with it: the scale, the index
// holes, the hub bolts and the four nests, with the tray's bars between each
// nest's far and near rails.
export function tableTopSvg(angle, bars, P) {
  const out = [];
  const a0 = angle * RAD;
  const ticks = { minor: "", major: "" };
  for (let i = 0; i < 72; i++) {
    const a = a0 + (i * 5 + 2.5) * RAD;
    const c = [Math.cos(a), Math.sin(a)];
    ticks[i % 9 === 0 ? "major" : "minor"] += k.lineOnTop([51 * c[0], 51 * c[1]], [53 * c[0], 53 * c[1]], TOP, P);
  }
  out.push(k.lineSvg(ticks.minor, { tone: "lo" }), k.lineSvg(ticks.major, { tone: "mid" }));
  for (let i = 0; i < 4; i++) {
    const a = a0 + (45 + i * 90) * RAD;
    const [x, y] = [HOLE_R * Math.cos(a), HOLE_R * Math.sin(a)];
    out.push(`<path class="tm-hole" d="${k.ring(x, y, 1.9, TOP, P, 20)}"/>`, k.lineSvg(k.ring(x, y, 1.9, TOP, P, 20), { tone: "lo" }), k.lineSvg(k.ring(x, y, 3.1, TOP, P, 24), { tone: "faint" }));
  }
  const nests = [0, 1, 2, 3].map((i) => ({ i, alpha: angle + i * 90, depth: depthAt(frameAt(angle + i * 90)(0, 0), TOP, P) })).sort((a, b) => a.depth - b.depth);
  for (const { i, alpha, depth } of nests) {
    const at = frameAt(alpha);
    out.push(k.solidSvg(k.extrude(rect(at, -7, 7, -15, 15, 1.2, 3), TOP, 0.8, P), { tone: "lo", flat: true }));
    const frame = [
      rect(at, -7, -6, -13.4, 13.4, 0.3),
      rect(at, 6, 7, -13.4, 13.4, 0.3),
      rect(at, -7, 7, -15, -13.6, 0.4),
      rect(at, -7, 7, 13.6, 15, 0.4),
    ].map((ring) => ({ ring, depth: depthAt(ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]), TOP, P) }));
    const draw = ({ ring }, n) => k.solidSvg(k.extrude(ring, TOP + 0.8, n < 2 ? 1.4 : 1.8, P), { tone: "mid" });
    const indexed = frame.map((f, n) => ({ ...f, n }));
    for (const f of indexed.filter((f) => f.depth <= depth)) out.push(draw(f, f.n));
    if (i === 0) out.push(barsSvg(bars, "tray", P));
    for (const f of indexed.filter((f) => f.depth > depth)) out.push(draw(f, f.n));
    out.push(k.dotsSvg([at(0, -14.3), at(0, 14.3)].map(([x, y]) => k.iso([x, y, TOP + 2.6], P)), { size: 0.4 }));
  }
  // Hub cap bolts turn with the table.
  out.push(k.solidSvg(k.cylinder(0, 0, 9, TOP, 2.4, P, 40, 0.6), { tone: "mid" }));
  out.push(k.lineSvg(k.ring(0, 0, 2.2, TOP + 2.4, P, 20), { tone: "lo" }));
  out.push(k.dotsSvg([0, 1, 2, 3, 4, 5].map((i) => k.iso([6.3 * Math.cos(a0 + i * 60 * RAD), 6.3 * Math.sin(a0 + i * 60 * RAD), TOP + 2.4], P)), { size: 0.45 }));
  return out.join("");
}

// Vertical tooth lines on a gear's visible side, fading toward its limbs.
export function teethSvg(cx, cy, r, z0, z1, count, phase, P) {
  const [vx, vy] = k.towardViewer(P);
  const list = [];
  for (let i = 0; i < count; i++) {
    const a = phase + (i / count) * Math.PI * 2;
    const facing = Math.cos(a) * vx + Math.sin(a) * vy;
    if (facing < 0.08) continue;
    const alpha = Math.min(1, (facing - 0.08) / 0.4);
    list.push([k.segment([cx + r * Math.cos(a), cy + r * Math.sin(a), z0 + 0.3], [cx + r * Math.cos(a), cy + r * Math.sin(a), z1 - 0.3], P), alpha]);
  }
  return k.fadedSvg(list, { tone: "lo" });
}
