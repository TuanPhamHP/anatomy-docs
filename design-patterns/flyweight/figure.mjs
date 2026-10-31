// The Flyweight figure: a rotary stamp turret over a moving label tape.
// The turret has twelve holders; each stamp in it is one product object, the
// heavy shared part (its engraved mark). A fixed column carries the ram: it
// pushes the stamp under it onto the tape, and the number wheel hanging beside
// the ram prints that line's own quantity next to the mark, which is the
// extrinsic part passed in at use. Without sharing the turret needs one stamp
// per order line; with a factory, three stamps print all twelve lines; and a
// discount band fitted on the shared stamp B shows up on every B line. The gauge
// on the console reads the memory the loaded lines take (model.mjs), and the
// motion is one timeline per step (timeline.mjs).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { LINES, LINES_OF, PRODUCTS, RESULTS, STEPS, kb, mb } from "./model.mjs";
import { HOLDERS, SHARED_HOLDER, STEP_DEG, endOf, stateAt } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 400;
const AZIMUTH = 58;

const PLATE = { x: -150, y: -72, w: 276, d: 118, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Turret: a disc turning on a post, twelve holders on a circle, a fixed column through its hub.
const C = [-70, -27];
const R = 31;
const DISC_R = 37;
const DISC_Z = [34, 38];
const STEM = { r: 2.6, z: [38, 46] };
const CAP = { r: 4.6, z: [46, 51] };
const BAND = { r: 5.2, z: [46.9, 49.5] };
const COLUMN_TOP = 72;
const PRESS = [C[0], C[1] + R];

// The ram and the number wheel ride down together; the stamp moves once the foot meets its cap.
const FOOT_Z = 52;
const FOOT_FREE = 1;
const STROKE = 6;
const GUIDE_Z = [64, 72];
const ARM = { x: C[0] - 4.5, y: C[1] - 8, w: 9, d: R + 22, r: 2 };
const ARM_Z = [72, 78];
const UNIT = { x: PRESS[0] - 2, y: PRESS[1] + 7, w: 4, d: 5, r: 0.8 };

// Tape on a raised bed, from the supply roll on the left to the take-up roll on the right.
const TZ = 28;
const TAPE = { x: -130, y: -2, w: 238, d: 24, r: 0 };
const BED = { x: -118, y: -4, w: 218, d: 28, r: 1.5 };
const BED_Z = [24, 27.4];
const ROLL_X = [-130, 108];
const ROLL_Z = 19;
const ROLL_R = 9;
const PITCH = 12;
const MARK_Y = PRESS[1];
const DIGIT_Y = UNIT.y + UNIT.d / 2;

// The console at the front left: memory gauge and stamp counter.
const CONSOLE = { x: 22, y: -54, w: 46, d: 16, r: 2 };
const CONSOLE_Z = 42;
const GAUGE = { u: 13, v: 14, r: 9.5, max: 25000 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(ARM, 0, ARM_Z[1] + 2)],
  WIDTH,
  HEIGHT,
  { pad: 16, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const slab = (plan, z0, z1, steps = 3, bevel = 0) => k.slabOf(plan, z0, z1 - z0, P, steps, bevel);
const Y = [0, 1, 0];
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const holderAt = (h, angle) => {
  const a = ((h * STEP_DEG + angle) * Math.PI) / 180;
  return [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)];
};

// A product's engraved mark, drawn flat at height z: a ring, a double ring or a dot.
function markSvg(product, x, y, z, scale = 1) {
  const kind = PRODUCTS[product].mark;
  if (kind === "dot") return `<path class="dp-ink" d="${k.onTop(k.circleRing(x, y, 1.5 * scale, 24), z, P, true)}"/>`;
  const rings = kind === "double" ? [2.2, 1.1] : [2.2];
  return L(rings.map((r) => k.ring(x, y, r * scale, z, P, 28)).join(""), { tone: "hi" });
}

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate at the front right.
  const label = { x: 30, y: 30, w: 40, d: 11, r: 1.4 };
  out.push(S(slab(label, 0, 0.8, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[35, 33.5, 22], [35, 36, 15], [35, 38.5, 19]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 5.5, 0.8]), at([label.x + label.w - 2.4, label.y + 5.5, 0.8])], { size: 0.4 }));
  return out.join("");
}

// A tray of blank stamps at the front: what the factory engraves a new stamp from.
function blanks() {
  const tray = { x: -98, y: 30, w: 44, d: 12, r: 2 };
  const out = [S(slab(tray, 0, 3, 4, 0.5), { tone: "mid" })];
  out.push(`<path class="dp-hole" d="${k.planOutline(k.insetPlan(tray, 1.6), 3, P, 4)}"/>`, L(k.planOutline(k.insetPlan(tray, 1.6), 3, P, 4), { tone: "lo" }));
  for (const x of [-89, -79, -69]) {
    out.push(S(k.cylinder(x, 36, STEM.r, 1.6, 6, P, 24), { tone: "mid" }));
    out.push(S(k.cylinder(x, 36, CAP.r, 7.6, CAP.z[1] - CAP.z[0], P, 32, 0.3), { tone: "mid" }));
  }
  return out.join("");
}

// The turret's fixed post, bearing and the detent that holds each holder in place.
function turretBase() {
  const [cx, cy] = C;
  const out = [];
  out.push(S(k.cylinder(cx, cy, 12, 0, 2.4, P, 40, 0.4), { tone: "lo" }));
  out.push(D(k.circleRing(cx, cy, 9.6, 6).map(([x, y]) => at([x, y, 2.4])), { size: 0.45 }));
  out.push(S(k.cylinder(cx, cy, 6.5, 2.4, 27.6, P, 32), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 9.5, 30, 4, P, 36, 0.4), { tone: "mid" }));
  // Detent at the back: a post with a roller pressing the disc's rim.
  const dx = cx - DISC_R - 4.5;
  out.push(S(slab({ x: dx - 3, y: cy - 4, w: 6, d: 8, r: 1 }, 0, 33, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(dx + 1.5, cy, 2.4, 33, 3, P, 20), { tone: "mid" }));
  out.push(D([at([dx, cy - 2.4, 33]), at([dx, cy + 2.4, 33])], { size: 0.4 }));
  return out.join("");
}

function disc() {
  const [cx, cy] = C;
  const groove = k.sideArc(cx, cy, DISC_R, (DISC_Z[0] + DISC_Z[1]) / 2, P, 48);
  const out = [S(k.cylinder(cx, cy, DISC_R, DISC_Z[0], DISC_Z[1] - DISC_Z[0], P, 72, 0.6), { tone: "mid", inner: L(groove, { tone: "faint" }) })];
  out.push(L(k.ring(cx, cy, DISC_R - 2.4, DISC_Z[1], P, 72), { tone: "faint" }));
  out.push(L(k.ring(cx, cy, R - 6.5, DISC_Z[1], P, 56), { tone: "faint" }));
  return out.join("");
}

function supplyRoll(x, wound) {
  const out = [];
  const F = G.frameAlong([x, TAPE.y - 4.6, ROLL_Z], Y);
  const bracket = (y) => S(slab({ x: x - 7, y, w: 14, d: 2, r: 0.8 }, 0, ROLL_Z + 4, 3, 0.4), { tone: "mid" }) + D([at([x - 4, y + 1, ROLL_Z + 4]), at([x + 4, y + 1, ROLL_Z + 4])], { size: 0.4 });
  out.push(bracket(TAPE.y - 7));
  out.push(S(G.solidOf([[-1.8, 1.6], [TAPE.d + 10.4, 1.6]], F, P), { tone: "mid" }));
  out.push(S(G.disc(0, 1, ROLL_R + 1.6, F, P), { tone: "mid" }));
  out.push(S(G.solidOf([[1, wound], [TAPE.d + 8.2, wound]], F, P), { tone: "lo", inner: k.fadedSvg(G.ribsOf(F, 1.4, TAPE.d + 7.8, wound, 18, P, { fade: [0.1, 0.5] }), { tone: "faint" }) }));
  out.push(S(G.disc(TAPE.d + 8.2, TAPE.d + 9.2, ROLL_R + 1.6, F, P), { tone: "mid" }));
  out.push(L(G.circleOf(F, TAPE.d + 9.2, 1.6, P, 20), { tone: "lo" }));
  out.push(bracket(TAPE.y + TAPE.d + 5));
  return out.join("");
}

// The take-up side's gear motor behind the roll, coupled to its axle.
function motor() {
  const x = ROLL_X[1];
  const box = { x: x - 10, y: -40, w: 20, d: 18, r: 2 };
  const out = [S(slab(box, 0, 26, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(box, 18, P, 4), { tone: "faint" }) })];
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: x - 7, y: -37 + i * 3.6, w: 14, d: 1.6, r: 0.8 }, 26, P, 3), { tone: "lo" }));
  out.push(D(k.corners(box, 2).map(([px, py]) => at([px, py, 26])), { size: 0.4 }));
  const F = G.frameAlong([x, box.y + box.d, ROLL_Z], Y);
  out.push(S(G.solidOf([[0, 3.2], [5, 3.2], [5, 1.6], [box.d + 20, 1.6]].map(([s, r]) => [s, r]), F, P), { tone: "mid" }));
  return out.join("");
}

function bed() {
  const out = [];
  for (const x of [-104, -6, 84]) {
    const leg = { x: x - 5, y: 0, w: 10, d: 20, r: 1.5 };
    out.push(S(slab(leg, 0, BED_Z[0], 3, 0.4), { tone: "mid", inner: L(k.sideSeam(leg, 8, P, 3), { tone: "faint" }) }));
  }
  out.push(S(slab(BED, BED_Z[0], BED_Z[1], 3, 0.5), { tone: "mid" }));
  out.push(S(slab({ x: BED.x, y: BED.y, w: BED.w, d: 2, r: 0.6 }, BED_Z[1], BED_Z[1] + 2, 2), { tone: "mid" }));
  out.push(D([-110, -60, 0, 50, 94].map((x) => at([x, BED.y + 1, BED_Z[1] + 2])), { size: 0.4 }));
  return out.join("");
}

function tape() {
  const out = [S(slab(TAPE, BED_Z[1], TZ, 2), { tone: "lo", crease: "none" })];
  out.push(`<path class="dp-paper" d="${k.planOutline(TAPE, TZ, P, 2)}"/>`);
  out.push(L(k.lineOnTop([TAPE.x, TAPE.y], [TAPE.x + TAPE.w, TAPE.y], TZ, P) + k.lineOnTop([TAPE.x, TAPE.y + TAPE.d], [TAPE.x + TAPE.w, TAPE.y + TAPE.d], TZ, P), { tone: "lo" }));
  return out.join("");
}

// The twelve labels, placed for tape position 0 (label i printed i pitches before the last).
function labels(state) {
  const out = [];
  for (let i = 0; i < LINES.length; i++) {
    const [product, qty] = LINES[i];
    const x = PRESS[0] - i * PITCH;
    const shown = state.labels.find((label) => label.i === i);
    const edit = product === "B" ? `<g data-edit${shown && shown.edited ? "" : ' display="none"'}>${L(k.ring(x, MARK_Y, 3.6, TZ, P, 32), { tone: "lit" })}${L(k.planOutline({ x: x - 4.4, y: DIGIT_Y - 3.4, w: 8.8, d: 5.4, r: 1.2 }, TZ, P, 3), { tone: "lit" })}</g>` : "";
    const digits = k.faceTextSvg(k.topMatrix([x - 3.4, DIGIT_Y + 1.6], TZ, P), `×${qty}`, { size: 4, tone: "hi" });
    out.push(`<g data-label="${i}"${shown ? (shown.alpha < 1 ? ` opacity="${shown.alpha}"` : "") : ' display="none"'}>`
      + L(k.planOutline({ x: x - 5.6, y: TAPE.y + 1.4, w: 11.2, d: TAPE.d - 2.8, r: 1 }, TZ, P, 3), { tone: "faint" })
      + markSvg(product, x, MARK_Y, TZ) + digits + edit + `</g>`);
  }
  return out.join("");
}

function frontRail() {
  const rail = { x: BED.x, y: BED.y + BED.d - 2, w: BED.w, d: 2, r: 0.6 };
  return S(slab(rail, BED_Z[1], BED_Z[1] + 2, 2), { tone: "mid" }) + D([-110, -60, 0, 50, 94].map((x) => at([x, rail.y + 1, BED_Z[1] + 2])), { size: 0.4 });
}

// One holder at a given turret angle: the hole in the disc and the stamps it may carry.
function holder(h, angle, state, variants) {
  const [x, y] = holderAt(h, angle);
  const out = [`<path class="dp-hole" d="${k.onTop(k.circleRing(x, y, 3.1, 28), DISC_Z[1], P, true)}"/>`];
  out.push(L(k.ring(x, y, 3.9, DISC_Z[1], P, 28), { tone: "lo" }));
  out.push(`<g data-part="dstem"></g>`);
  for (const product of variants) {
    const here = state.holders[h];
    const on = here.product === product && here.alpha > 0;
    const style = on ? ` transform="${k.translateAlong(P, [0, 0, here.dz])}"${here.alpha < 1 ? ` opacity="${here.alpha.toFixed(3)}"` : ""}` : ' display="none"';
    out.push(`<g data-block="${product}"${style}>`
      + `<g data-part="stem">${S(k.cylinder(x, y, STEM.r, STEM.z[0], STEM.z[1] - STEM.z[0], P, 24), { tone: "mid" })}</g>`
      + `<g data-part="cap">${S(k.cylinder(x, y, CAP.r, CAP.z[0], CAP.z[1] - CAP.z[0], P, 32, 0.3), { tone: "hi", crease: "lo" })}${markSvg(product, x, y, CAP.z[1], 0.9)}</g>`
      + `</g>`);
  }
  if (h === SHARED_HOLDER.B) {
    const b = state.holders[h].band;
    out.push(`<g data-part="band"${b > 0 ? ` transform="${k.translateAlong(P, [0, 0, 8 * (1 - b)])}"${b < 1 ? ` opacity="${b.toFixed(3)}"` : ""}` : ' display="none"'}>${S(k.cylinder(x, y, BAND.r, BAND.z[0], BAND.z[1] - BAND.z[0], P, 32), { tone: "hi" })}</g>`);
  }
  return `<g data-holder="${h}">${out.join("")}</g>`;
}

function center() {
  const [cx, cy] = C;
  const out = [S(k.cylinder(cx, cy, 8.5, DISC_Z[1], 3, P, 40, 0.5), { tone: "mid" })];
  out.push(D(k.circleRing(cx, cy, 7, 6).map(([x, y]) => at([x, y, DISC_Z[1] + 3])), { size: 0.4 }));
  out.push(S(k.cylinder(cx, cy, 5, DISC_Z[1] + 3, COLUMN_TOP - DISC_Z[1] - 3, P, 32), { tone: "mid", inner: L(k.sideArc(cx, cy, 5, 60, P, 20), { tone: "faint" }) }));
  return `<g data-holder="center">${out.join("")}</g>`;
}

function arm() {
  const out = [S(slab(ARM, ARM_Z[0], ARM_Z[1], 4, 0.8), { tone: "mid", inner: L(k.sideSeam(ARM, ARM_Z[0] + 2.4, P, 4), { tone: "faint" }) })];
  out.push(S(k.cylinder(C[0], C[1], 6.5, ARM_Z[1], 1.6, P, 32, 0.3), { tone: "mid" }));
  out.push(L(k.ring(C[0], C[1], 2.4, ARM_Z[1] + 1.6, P, 16), { tone: "lo" }));
  out.push(D([at([C[0], ARM.y + ARM.d - 3, ARM_Z[1]]), at([C[0], PRESS[1] - 8, ARM_Z[1]])], { size: 0.45 }));
  out.push(S(k.cylinder(PRESS[0], PRESS[1], 3.4, GUIDE_Z[0], GUIDE_Z[1] - GUIDE_Z[0], P, 28, 0.3), { tone: "mid" }));
  out.push(L(k.ring(PRESS[0], PRESS[1], 1.7, GUIDE_Z[0], P, 16), { tone: "lo" }));
  return out.join("");
}

const rodSvg = (down) => S(k.cylinder(PRESS[0], PRESS[1], 1.5, FOOT_Z + 3 - down, GUIDE_Z[0] - (FOOT_Z + 3 - down), P, 20), { tone: "mid" });

// Foot and number wheel, drawn at rest and moved down as one.
function ram() {
  const foot = { x: PRESS[0] - 3, y: PRESS[1] - 3, w: 6, d: UNIT.y + UNIT.d - PRESS[1] + 3, r: 1 };
  const out = [S(slab(foot, FOOT_Z, FOOT_Z + 3, 3, 0.4), { tone: "mid" })];
  out.push(S(slab(UNIT, FOOT_Z - STROKE - FOOT_FREE - 9, FOOT_Z, 3, 0.4), { tone: "mid" }));
  // The wheel window on the unit's front face, and the digit wheels behind it.
  const M = k.sideMatrix([UNIT.x + 0.7, UNIT.y + UNIT.d], FOOT_Z - 3, P, "left");
  out.push(`<g transform="${M}"><path class="dp-screen" d="${rrect(0, 0, 2.6, 5, 0.5)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 2.6, 5, 0.5)}"/><path class="iso-line" data-tone="faint" d="M0 2.5H2.6"/></g>`);
  out.push(D([at([UNIT.x + 2, UNIT.y + UNIT.d, FOOT_Z - 11])], { size: 0.4 }));
  return out.join("");
}

function console_() {
  const out = [S(slab(CONSOLE, 0, CONSOLE_Z, 4, 0.8), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(CONSOLE, 2.4), CONSOLE_Z, P, 4), { tone: "faint" }));
  out.push(D(k.corners(CONSOLE, 2.6).map(([x, y]) => at([x, y, CONSOLE_Z])), { size: 0.45 }));
  const M = k.sideMatrix([CONSOLE.x, CONSOLE.y + CONSOLE.d], CONSOLE_Z, P, "left");
  const { u, v, r } = GAUGE;
  const ticks = Array.from({ length: 26 }, (_, i) => {
    const a = ((-120 + (240 * i) / 25) * Math.PI) / 180;
    const r0 = i % 5 === 0 ? r - 2.2 : r - 1.2;
    return `M${(u + r0 * Math.sin(a)).toFixed(2)} ${(v - r0 * Math.cos(a)).toFixed(2)}L${(u + (r - 0.4) * Math.sin(a)).toFixed(2)} ${(v - (r - 0.4) * Math.cos(a)).toFixed(2)}`;
  });
  out.push(`<g transform="${M}">
    <circle class="dp-dial" cx="${u}" cy="${v}" r="${r + 1.4}"/><circle class="iso-line" data-tone="mid" cx="${u}" cy="${v}" r="${r + 1.4}" fill="none"/>
    <path class="iso-line" data-tone="lo" d="${ticks.filter((_, i) => i % 5).join("")}"/><path class="iso-line" data-tone="hi" d="${ticks.filter((_, i) => i % 5 === 0).join("")}"/>
    <text class="iso-face-text" data-tone="lo" x="${u - 6.4}" y="${v + 6.6}" font-size="2.4">0</text><text class="iso-face-text" data-tone="lo" x="${u + 6.4}" y="${v + 6.6}" font-size="2.4" text-anchor="end">25</text>
    <text class="iso-face-text" data-tone="lo" x="${u}" y="${v + 5.4}" font-size="2.2" text-anchor="middle">KB</text>
    <g data-part="needle"><path class="iso-line" data-tone="hi" d="M${u} ${v + 1.6}V${v - r + 2.2}"/></g><circle class="dp-ink" cx="${u}" cy="${v}" r="1"/>
    <text class="iso-face-text" data-tone="mid" x="${u}" y="${v + r + 5.4}" font-size="2.6" text-anchor="middle">BỘ NHỚ</text>
    <path class="dp-screen" d="${rrect(27, 9, 12, 7.5, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(27, 9, 12, 7.5, 1)}"/>
    <text class="iso-face-text dp-digits" data-part="counter" data-tone="hi" x="37.6" y="14.9" font-size="5.4" text-anchor="end">03</text>
    <text class="iso-face-text" data-tone="mid" x="33" y="7.2" font-size="2.4" text-anchor="middle">CON DẤU</text>
    <path class="iso-line" data-tone="faint" d="${rrect(27, 20, 12, 7, 1)}"/><circle class="iso-line" data-tone="lo" cx="33" cy="23.5" r="2" fill="none"/>
  </g>`);
  return out.join("");
}

const START = 1;
const startState = stateAt(STEPS[START], endOf(STEPS[START]), null);
const variantsOf = (h) => [...new Set([LINES[h][0], ...Object.entries(SHARED_HOLDER).filter(([, at]) => at === h).map(([p]) => p)])];
const VARIANTS = Array.from({ length: HOLDERS }, (_, h) => variantsOf(h));

// The turret's holders and its fixed column, drawn back to front for the resting angle.
function turret(state) {
  const items = Array.from({ length: HOLDERS }, (_, h) => ({ depth: k.depthOf([...holderAt(h, state.angle), 44], P), svg: holder(h, state.angle, state, VARIANTS[h]) }));
  items.push({ depth: k.depthOf([...C, 44], P), svg: center() });
  return items.sort((a, b) => a.depth - b.depth).map((item) => item.svg).join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một mâm xoay mười hai lỗ cắm con dấu nằm trên một băng nhãn chạy từ cuộn bên trái sang cuộn bên phải. Mỗi con dấu mang hình khắc của một sản phẩm. Đầu ép trên cột giữa dập con dấu nằm dưới nó xuống băng, còn bánh số treo cạnh đầu ép in số lượng riêng của từng dòng. Đồng hồ trên hộp điều khiển chỉ lượng bộ nhớ các dòng đang chiếm, cạnh đó là ô đếm số con dấu.",
  body: [
    base(),
    motor(),
    console_(),
    turretBase(),
    supplyRoll(ROLL_X[0], ROLL_R),
    bed(),
    tape(),
    `<g data-part="labels" transform="${k.translateAlong(P, [startState.tape * PITCH, 0, 0])}">${labels(startState)}</g>`,
    `<g data-part="under"></g>`,
    disc(),
    `<g data-part="turret">${turret(startState)}</g>`,
    arm(),
    `<g data-part="rod">${rodSvg(0)}</g>`,
    `<g data-part="ram">${ram()}</g>`,
    frontRail(),
    blanks(),
    supplyRoll(ROLL_X[1], ROLL_R + 1.2),
  ],
});

const strip = (file) => readFileSync(join(HERE, file), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");

export const live = `
${strip("model.mjs")}
${strip("timeline.mjs")}
const P = ${JSON.stringify(P)};
const C = ${JSON.stringify(C)}, R = ${R}, PRESS = ${JSON.stringify(PRESS)}, PITCH = ${PITCH}, STROKE = ${STROKE}, FOOT_FREE = ${FOOT_FREE};
const STEM = ${JSON.stringify(STEM)}, DISC_TOP = ${DISC_Z[1]}, DISC_BOTTOM = ${DISC_Z[0]}, FOOT_Z = ${FOOT_Z}, GUIDE_BOTTOM = ${GUIDE_Z[0]}, MAXMEM = ${GAUGE.max};
const GAUGE = ${JSON.stringify(GAUGE)};
const START = ${START}, STATIC_ANGLE = ${startState.angle};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (name, root = svg) => root.querySelector('[data-part="' + name + '"]');
const turretEl = q("turret");
const holderEls = Array.from({ length: HOLDERS }, (_, h) => turretEl.querySelector('[data-holder="' + h + '"]'));
const centerEl = turretEl.querySelector('[data-holder="center"]');
const blocks = holderEls.map((el) => Object.fromEntries([...el.querySelectorAll("[data-block]")].map((b) => [b.dataset.block, b])));
const dstems = holderEls.map((el) => q("dstem", el));
const bandEl = q("band");
const labelsEl = q("labels");
const labelEls = [...labelsEl.querySelectorAll("[data-label]")];
const parts = { under: q("under"), rod: q("rod"), ram: q("ram"), needle: q("needle"), counter: q("counter") };
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const holderAt = (h, angle) => { const a = ((h * STEP_DEG + angle) * Math.PI) / 180; return [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)]; };
const home = Array.from({ length: HOLDERS }, (_, h) => holderAt(h, STATIC_ANGLE));
const restText = RESULTS.map((r) => r.edited ? "B bị sửa · " + LINES_OF(r.edited).length + " dòng đổi theo" : r.stamps + " con dấu · " + kb(r.batch));
const spoken = RESULTS.map((r) => r.edited
  ? "Con dấu B bị gắn nhãn giảm giá, nên cả " + LINES_OF(r.edited).length + " dòng dùng sản phẩm B đều in ra có nhãn"
  : r.shared ? "Ba con dấu dùng chung in đủ mười hai dòng, bộ nhớ " + kb(r.batch) : "Mười hai dòng cần mười hai con dấu, bộ nhớ " + kb(r.batch));
let sel = START, t = endOf(STEPS[START]), before = null, state = stateAt(STEPS[START], t, null);
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0, dwell = 0;
const DWELL = 3.2;
const shown = {};
const set = (el, key, attr, value) => { if (shown[key] !== value) { shown[key] = value; if (value === null) el.removeAttribute(attr); else el.setAttribute(attr, value); } };
const lit = (el, on) => {
  if (!el) return;
  el.toggleAttribute("data-lit", on);
  el.querySelector(".iso-edge")?.setAttribute("data-tone", on ? "lit" : "hi");
};
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", spoken[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
let order = "";
function draw() {
  const step = STEPS[sel];
  const footDown = state.pressing >= 0 ? (STROKE + FOOT_FREE) * state.press : 0;
  const blockDown = Math.max(0, footDown - FOOT_FREE);
  // Holders: move with the turret, show the stamp they carry, raised while it drops in or lifts out.
  const depths = [];
  holderEls.forEach((el, h) => {
    const [x, y] = holderAt(h, state.angle);
    set(el, "h" + h, "transform", translateAlong(P, [x - home[h][0], y - home[h][1], 0]));
    depths.push([depthOf([x, y, 44], P), el]);
    const here = state.holders[h];
    for (const product in blocks[h]) {
      const b = blocks[h][product];
      const on = here.product === product && here.alpha > 0.002;
      set(b, "bd" + h + product, "display", on ? null : "none");
      if (!on) continue;
      const pressed = state.pressing === h;
      set(b, "bt" + h + product, "transform", translateAlong(P, [0, 0, here.dz]));
      set(b, "bo" + h + product, "opacity", here.alpha < 0.998 ? here.alpha.toFixed(3) : null);
      set(q("stem", b), "bs" + h + product, "display", pressed ? "none" : null);
      set(q("cap", b), "bc" + h + product, "transform", pressed ? translateAlong(P, [0, 0, -blockDown]) : null);
      lit(q("cap", b).querySelector(".iso-solid"), !step.edited && state.lit === h);
    }
    const stemKey = state.pressing === h ? blockDown.toFixed(2) : "";
    if (shown["ds" + h] !== stemKey) {
      shown["ds" + h] = stemKey;
      dstems[h].innerHTML = stemKey ? solidSvg(cylinder(home[h][0], home[h][1], STEM.r, STEM.z[0], STEM.z[1] - STEM.z[0] - blockDown, P, 24), { tone: "mid" }) : "";
    }
  });
  depths.push([depthOf([C[0], C[1], 44], P), centerEl]);
  depths.sort((a, b) => a[0] - b[0]);
  const next = depths.map(([, el]) => el.dataset.holder).join(",");
  if (next !== order) { order = next; depths.forEach(([, el]) => turretEl.append(el)); }
  // The discount band on stamp B.
  const band = state.holders[SHARED_HOLDER.B].band;
  set(bandEl, "band", "display", band > 0.002 ? null : "none");
  set(bandEl, "bandt", "transform", translateAlong(P, [0, 0, 8 * (1 - band)]));
  set(bandEl, "bando", "opacity", band < 0.998 ? band.toFixed(3) : null);
  lit(bandEl.querySelector(".iso-solid"), !!step.edited && state.lit === SHARED_HOLDER.B);
  // The stamp's face below the disc while it presses, the rod and the ram.
  const underKey = blockDown.toFixed(2);
  if (shown.under !== underKey) {
    shown.under = underKey;
    parts.under.innerHTML = blockDown > 0.05 ? solidSvg(cylinder(PRESS[0], PRESS[1], 3, DISC_BOTTOM - blockDown, blockDown, P, 24), { tone: "hi", crease: "lo" }) : "";
    parts.rod.innerHTML = solidSvg(cylinder(PRESS[0], PRESS[1], 1.5, FOOT_Z + 3 - footDown, GUIDE_BOTTOM - (FOOT_Z + 3 - footDown), P, 20), { tone: "mid" });
  }
  set(parts.ram, "ram", "transform", translateAlong(P, [0, 0, -footDown]));
  // Labels ride the tape.
  set(labelsEl, "tape", "transform", translateAlong(P, [state.tape * PITCH, 0, 0]));
  labelEls.forEach((el, i) => {
    const label = state.labels.find((l) => l.i === i);
    set(el, "ld" + i, "display", label ? null : "none");
    set(el, "lo" + i, "opacity", label && label.alpha < 0.998 ? label.alpha.toFixed(3) : null);
    const edit = el.querySelector("[data-edit]");
    if (edit) set(edit, "le" + i, "display", label && label.edited ? null : "none");
  });
  // Gauge and counter.
  const angle = -120 + 240 * Math.min(1, state.memory / MAXMEM);
  set(parts.needle, "needle", "transform", "rotate(" + angle.toFixed(1) + " " + GAUGE.u + " " + GAUGE.v + ")");
  const count = String(state.stamps).padStart(2, "0");
  if (parts.counter.textContent !== count) parts.counter.textContent = count;
  const text = t >= endOf(step) ? restText[sel] : state.phase || restText[sel];
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const end = endOf(STEPS[sel]);
  t = still.matches ? end : Math.min(end, t + dt);
  state = stateAt(STEPS[sel], t, before);
  if (touring && t >= end) {
    dwell += dt;
    if (dwell > DWELL) go((sel + 1) % STEPS.length);
  }
  draw();
  const settled = !touring && t >= end;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// Start a step over from whatever the machine shows now.
function go(index) {
  dwell = 0;
  if (index === sel && t < endOf(STEPS[sel])) return;
  before = state;
  sel = index;
  t = still.matches ? endOf(STEPS[sel]) : 0;
  state = stateAt(STEPS[sel], t, before);
  describe();
  draw();
}
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; dwell = 0; emit(); run(); }, 3600);
  if (index !== sel) go(index); else emit();
  run();
};
const pick = (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
  return Math.floor(share * STEPS.length);
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
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = Math.min(STEPS.length - 1, sel + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = Math.max(0, sel - 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = STEPS.length - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

const linesB = LINES_OF("B");
const listB = `${linesB.slice(0, -1).join(", ")} và ${linesB[linesB.length - 1]}`;
const WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười", "mười một", "mười hai"];
const steps = RESULTS.map((r) => ({
  label: r.label,
  short: r.short,
  caption: r.edited
    ? `Ai đó gắn nhãn giảm giá lên con dấu B, chỉ định dùng cho dòng 2. Nhưng con dấu ấy đang được các dòng ${listB} dùng chung, nên khi in lại thì cả <strong>${WORDS[linesB.length]} dòng</strong> đều mang nhãn. Vì thế flyweight phải là đối tượng bất biến.`
    : r.shared
      ? `<code>ProductCatalog</code> chỉ khắc con dấu cho mỗi sản phẩm một lần rồi đưa lại đúng con dấu ấy cho mọi dòng sau, còn số lượng thì bánh số in riêng cho từng dòng. Lô này chỉ tốn <strong>${kb(r.batch)}</strong>, cả báo cáo khoảng ${mb(r.report)}.`
      : `Mỗi dòng tự giữ một bản sao thông tin sản phẩm, nên ${WORDS[LINES.length]} dòng cần ${WORDS[r.stamps]} con dấu dù chỉ có ba sản phẩm. Lô này chiếm <strong>${kb(r.batch)}</strong>, còn cả báo cáo 100.000 dòng sẽ cần khoảng ${mb(r.report)}.`,
}));

export const plate = withSteps(k.plateHtml({
  fig: "Fig 18",
  title: "Flyweight",
  hint: "Rê chuột để chọn bước",
  readout: `${RESULTS[START].stamps} con dấu · ${kb(RESULTS[START].batch)}`,
  keys: [
    { mark: "lit", label: "Con dấu đang nằm dưới đầu ép, hoặc nhãn giảm giá gắn lên con dấu B ở bước cuối" },
    { mark: "raised", label: "Con dấu trên mâm xoay, mỗi con dấu là một đối tượng sản phẩm" },
  ],
  caption:
    "Mỗi con dấu mang phần nặng và không đổi của một sản phẩm, còn số lượng của từng dòng do bánh số cạnh đầu ép in thêm lúc dập. Khi không dùng chung, mâm phải chứa một con dấu cho mỗi dòng, còn khi có factory thì ba con dấu là đủ cho cả lô. Kim đồng hồ bộ nhớ cho thấy khoảng chênh ấy.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Flyweight, dùng phím mũi tên để chọn bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Ba bước của lô mười hai dòng", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-dial{fill:var(--anatomy-top)}
.dp-paper{fill:var(--anatomy-top)}
.dp-hole{fill:#d2d2cf}
.dp-ink{fill:var(--anatomy-hi)}
.dp-digits{letter-spacing:.04em}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
