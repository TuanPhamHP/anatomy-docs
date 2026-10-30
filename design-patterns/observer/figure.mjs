// The Observer figure: a signal bench. An order button (the subject) drives one
// push bar (the bus) along a guide. Four listener stations stand beside it; a
// station that is subscribed has slid in and dropped its index plunger into a
// hole in the bar, so when the bar strokes its carriage rides along and lifts
// the station's flag. A station that is not subscribed stands back with its
// plunger up and doesn't move. The bar has spare holes: hooking on a new
// station changes nothing at the button. Steps and values come from model.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { LISTENERS, STEPS, groupVND, listenerOf, reactionsOf } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 360;
const AZIMUTH = 30;
const ELEVATION = 36;

const PLATE = { x: -34, y: -148, w: 112, d: 256, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// The bus: a square push bar on three supports, pushed toward -y by the subject.
const BAR = { x: -5, y: -112, w: 10, d: 186, r: 1.4 };
const BAR_Z = [8, 15];
const SUPPORTS = [-108, -28, 46];
const HOLES = Array.from({ length: 9 }, (_, i) => -90 + i * 18);
const HOLE_R = 2;
const STROKE = 8;
const STOP_Y = -140;
const ROD_Z = 11;

// Listener stations, one per listener, left to right on screen.
const STATION_Y = [36, 0, -36, -72];
const OUT = 14; // how far an unsubscribed station stands back from the bar
const LIFT = 5; // how far its plunger is pulled up
const FLAG = 20; // how far a notified station's flag rises
const ARM_Z = [18, 21];
const SLEEVE_TOP = 24;
const HOUSING = { x: 24, w: 20, d: 22, z0: 5.5, z1: 22 };
const SLOT = { x: 31.5, w: 3, d: 19 };
const BLADE_X = 32.2;
const BLADE_T = 1.6;

// The subject: the order button's case at the front of the bar.
const CASE = { x: -24, y: 62, w: 48, d: 34, r: 4 };
const CASE_Z = [3, 36];
const BUTTON = [2, 80];
const PRESS = 2.2;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(CASE, 0, 43), [BLADE_X, STATION_Y[3] - 8, HOUSING.z1 + FLAG], [BLADE_X + OUT, STATION_Y[0] + 8, HOUSING.z1]],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: AZIMUTH, elevation: ELEVATION },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const X = [1, 0, 0];
const Y = [0, 1, 0];
const Z = [0, 0, 1];
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

// The screen hull of a set of world points, as a closed path: clip regions.
function hullPath(points) {
  const flat = points.map(at).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of flat) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (const p of [...flat].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  return `M${hull.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;
}
// The space above z0 over a floor outline: whatever is clipped to it disappears into that face.
const columnClip = (ring, z0, z1) => hullPath(ring.flatMap(([x, y]) => [[x, y, z0], [x, y, z1]]));
const circle = (cx, cy, r, n = 24) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), cy + r * Math.sin((2 * Math.PI * i) / n)]);
const box = (x, y, w, d) => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];

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
  // Label plate at the front corner.
  const label = { x: 44, y: 70, w: 30, d: 22, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[50, 74, 16], [53.5, 74, 10], [57, 74, 13]].map(([x, y, w]) => k.lineOnTop([x, y], [x, y + w], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 4, label.y + 2.6, 0.8]), at([label.x + 4, label.y + label.d - 2.6, 0.8])], { size: 0.4 }));
  return out.join("");
}

// The stroke scale at the far end: a raised pad with a ruler, read by the bar's pointer.
const PAD = { x: 7, y: -132, w: 9, d: 36, r: 1.2 };
const PAD_Z = 10.4;
function strokeScale() {
  const out = [];
  out.push(S(k.slabOf(PAD, 0, PAD_Z, P, 3, 0.5), { tone: "mid" }));
  const strip = { x: PAD.x + 0.8, y: PAD.y + 2, w: PAD.w - 1.6, d: PAD.d - 4, r: 0.6 };
  out.push(S(k.slabOf(strip, PAD_Z, 0.5, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-126.4, -102.4, 2, 4, strip.x, PAD_Z + 0.5, [2, 3.6], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + strip.w - 1.6, strip.y + 1.4, PAD_Z + 0.5]), at([strip.x + strip.w - 1.6, strip.y + strip.d - 1.4, PAD_Z + 0.5])], { size: 0.4 }));
  return out.join("");
}

function supportsBehind() {
  const out = [];
  for (const y of SUPPORTS) {
    const block = { x: -10.4, y, w: 20.8, d: 10, r: 1.4 };
    out.push(S(k.slabOf(block, 0, BAR_Z[0], P, 3, 0.5), { tone: "mid" }));
    out.push(S(k.slabOf({ x: -10.4, y: y + 1, w: 4.4, d: 8, r: 0.8 }, BAR_Z[0], 4.4, P, 3, 0.3), { tone: "mid" }));
  }
  return out.join("");
}

function supportsFront() {
  const out = [];
  for (const y of SUPPORTS) {
    out.push(S(k.slabOf({ x: 6, y: y + 1, w: 4.4, d: 8, r: 0.8 }, BAR_Z[0], 4.4, P, 3, 0.3), { tone: "mid" }));
    out.push(D([at([8.2, y + 3, BAR_Z[0] + 4.4]), at([8.2, y + 7, BAR_Z[0] + 4.4])], { size: 0.4 }));
  }
  return out.join("");
}

// The return spring and its guide rod between the end stop and the bar's end.
// The spring sits in a seat on the stop's face: a short boss with a groove ring it ends on.
const SEAT = G.frameAlong([0, STOP_Y + 6, ROD_Z], Y);
function endStop() {
  const stop = { x: -9, y: STOP_Y, w: 18, d: 6, r: 1.2 };
  return S(k.slabOf(stop, 0, 18, P, 3, 0.5), { tone: "mid" })
    + D([at([-5, STOP_Y + 3, 18]), at([5, STOP_Y + 3, 18])], { size: 0.45 })
    + S(G.disc(0, 1.2, 4, SEAT, P), { tone: "mid" })
    + L(G.circleOf(SEAT, 1.2, 2.8, P, 40), { tone: "lo" });
}

const ROD = G.disc(1.2, 40, 1.4, SEAT, P);
function returnSpring(b) {
  const c = k.coil(STOP_Y + 7.2, BAR.y - b, [0, ROD_Z], 2.8, 6, "y", P);
  return c;
}

function bus() {
  const out = [];
  out.push(S(k.slabOf(BAR, BAR_Z[0], BAR_Z[1] - BAR_Z[0], P, 3, 0.5), { tone: "hi", crease: "lo" }));
  for (const y of HOLES) {
    out.push(`<path class="dp-hole" d="${k.ring(0, y, HOLE_R, BAR_Z[1], P, 24)}"/>`);
    out.push(L(k.ring(0, y, HOLE_R, BAR_Z[1], P, 24), { tone: "lo" }));
  }
  // Pointer tab on the near side at the far end, over the stroke scale.
  const tab = { x: 5, y: -112, w: 8.6, d: 2.4, r: 0.6 };
  out.push(S(k.slabOf(tab, PAD_Z + 0.9, 0.8, P, 2), { tone: "mid" }));
  out.push(L(k.lineOnTop([5, -110.8], [13.6, -110.8], PAD_Z + 1.7, P), { tone: "hi" }));
  return out.join("");
}

// One listener station: a way on the plate, and a slide carrying the carriage,
// the plunger and the flag housing.
function way(sy) {
  const plan = { x: 9, y: sy - 13, w: 58, d: 20, r: 1.5 };
  return S(k.slabOf(plan, 0, 2.5, P, 3, 0.4), { tone: "lo" })
    + L(k.planOutline({ x: 11, y: sy - 4, w: 54, d: 2, r: 1 }, 2.5, P, 3), { tone: "faint" })
    + S(k.slabOf({ x: 63.4, y: sy - 9, w: 3, d: 12, r: 0.8 }, 2.5, 4.5, P, 2, 0.3), { tone: "mid" })
    + D([at([64.9, sy - 6, 7]), at([64.9, sy, 7])], { size: 0.4 });
}

function blade(listener, sy, on) {
  const top = HOUSING.z1 - 3;
  const height = { rect: 10, square: 11, disc: 12, pennant: 11 }[listener.flag];
  const z0 = top - height;
  const F = G.frameOf([BLADE_X, sy, z0], X, Y, Z);
  const stem = S(G.prismOf(G.frameOf([BLADE_X + 0.2, sy, z0], X, Y, Z), [[-0.9, -15], [0.9, -15], [0.9, 0.5], [-0.9, 0.5]], 0, 1.2, P), { tone: "mid" });
  let paths;
  if (listener.flag === "rect") paths = G.prismOf(F, [[-8.4, 0], [8.4, 0], [8.4, 10], [-8.4, 10]], 0, BLADE_T, P);
  else if (listener.flag === "square") paths = G.prismOf(F, [[-5.5, 0], [5.5, 0], [5.5, 11], [-5.5, 11]], 0, BLADE_T, P);
  else if (listener.flag === "disc") paths = G.disc(0, BLADE_T, 6, G.frameAlong([BLADE_X, sy, z0 + 6], X), P);
  else paths = G.prismOf(F, [[-7, 0], [8.4, 5.5], [-7, 11]], 0, BLADE_T, P);
  const rivet = listener.flag === "pennant" ? [-3.4, 5.5] : [0, height / 2];
  return stem + `<g data-part="blade">${S(paths, { tone: on ? "lit" : "hi", crease: "lo", lit: on })}</g>` + D([at([BLADE_X + BLADE_T, sy + rivet[0], z0 + rivet[1]])], { size: 0.45 });
}

// A small screwed plate on the housing's +x face, with rule lines for its printed text.
function housingPlate(sy) {
  const face = HOUSING.x + HOUSING.w;
  const M = k.sideMatrix([face, sy + 6], 15.5, P, "right");
  const lines = [[2.4, 2.6, 7], [2.4, 4.6, 4.6]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  return `<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 12, 7, 0.8)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 12, 7, 0.8)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`
    + D([at([face, sy + 6 - 10.4, 15.5 - 2]), at([face, sy + 6 - 10.4, 15.5 - 5])], { size: 0.38 });
}

// Three vent slots on the housing's +y face.
function housingVents(sy) {
  const M = k.sideMatrix([HOUSING.x + 5, sy - 13 + HOUSING.d], 15, P, "left");
  return `<g transform="${M}">${[0, 3.6, 7.2].map((x) => `<path class="dp-hole" d="${rrect(x, 0, 1.8, 7, 0.9)}"/><path class="iso-line" data-tone="lo" d="${rrect(x, 0, 1.8, 7, 0.9)}"/>`).join("")}</g>`;
}

function station(listener, index, attached) {
  const sy = STATION_Y[index];
  const pin = (z0) => S(k.cylinder(0, sy, 1.4, z0, 17, P, 16), { tone: "hi", crease: "none" });
  const housing = { x: HOUSING.x, y: sy - 13, w: HOUSING.w, d: HOUSING.d, r: 2.5 };
  const slot = { x: SLOT.x, y: sy - SLOT.d / 2, w: SLOT.w, d: SLOT.d, r: 1 };
  const lo = `ob-pinlo-${index}`, hi = `ob-pinhi-${index}`, fl = `ob-flag-${index}`;
  const lift = attached ? 0 : LIFT;
  const slide = attached ? 0 : OUT;
  return `${way(sy)}
  <g data-part="station" data-listener="${listener.id}" transform="${k.translateAlong(P, [slide, 0, 0])}">
    ${S(k.slabOf({ x: 11, y: sy - 17, w: 36, d: 28, r: 2 }, 2.5, 3, P, 3, 0.5), { tone: "mid" })}
    ${D([[13.4, sy - 14.6], [44.6, sy - 14.6], [44.6, sy + 8.6], [22, sy + 8.6]].map(([x, y]) => at([x, y, 5.5])), { size: 0.4 })}
    ${S(k.slabOf({ x: 12.5, y: sy - 16, w: 6, d: 26, r: 1 }, 5.5, 2.5, P, 3, 0.3), { tone: "mid" })}
    ${S(k.slabOf({ x: 12.5, y: sy - 17, w: 6, d: 2.2, r: 0.6 }, 5.5, 5, P, 2), { tone: "mid" })}
    <g data-part="carriage"${attached ? ` transform="${k.translateAlong(P, [0, -STROKE, 0])}"` : ""}>
      <clipPath id="${lo}"><path d="${columnClip(circle(0, sy, 2.2), BAR_Z[1], 40)}"/></clipPath>
      <clipPath id="${hi}"><path d="${columnClip(circle(0, sy, 2.2), SLEEVE_TOP, 50)}"/></clipPath>
      <g clip-path="url(#${lo})"><g data-part="plunger" transform="${k.translateAlong(P, [0, 0, lift])}">${pin(11)}</g></g>
      ${S(k.slabOf({ x: -3.5, y: sy - 2.6, w: 16.5, d: 5.2, r: 1.4 }, ARM_Z[0], ARM_Z[1] - ARM_Z[0], P, 3, 0.4), { tone: "mid" })}
      ${S(k.cylinder(0, sy, 2.8, ARM_Z[1], SLEEVE_TOP - ARM_Z[1], P, 24), { tone: "mid" })}
      ${L(k.ring(0, sy, 1.8, SLEEVE_TOP, P, 16), { tone: "lo" })}
      <g clip-path="url(#${hi})"><g data-part="plunger" transform="${k.translateAlong(P, [0, 0, lift])}">${pin(11)}</g></g>
      <g data-part="plunger" transform="${k.translateAlong(P, [0, 0, lift])}">
        ${S(k.cylinder(0, sy, 3.1, SLEEVE_TOP + 0.4, 3.8, P, 32), { tone: "mid" })}
        ${L(k.knurl(0, sy, 3.1, SLEEVE_TOP + 0.4, SLEEVE_TOP + 4.2, 26, P), { tone: "lo" })}
        ${L(k.ring(0, sy, 1.2, SLEEVE_TOP + 4.2, P, 16), { tone: "lo" })}
      </g>
      ${S(k.slabOf({ x: 11, y: sy - 4.5, w: 8.5, d: 9, r: 1.5 }, 8, 12.6, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam({ x: 11, y: sy - 4.5, w: 8.5, d: 9, r: 1.5 }, 11, P, 3), { tone: "faint" }) })}
      ${D([at([15.25, sy - 2.2, 20.6]), at([15.25, sy + 2.2, 20.6])], { size: 0.4 })}
      ${S(G.disc(0, 4.8, 1, G.frameAlong([19.5, sy, 13], X), P), { tone: "mid" })}
    </g>
    ${S(k.slabOf({ x: 12.5, y: sy + 8, w: 6, d: 2.2, r: 0.6 }, 5.5, 5, P, 2), { tone: "mid" })}
    ${S(k.slabOf(housing, HOUSING.z0, HOUSING.z1 - HOUSING.z0, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(housing, 18, P, 4), { tone: "faint" }) })}
    ${housingPlate(sy)}
    ${housingVents(sy)}
    <path class="dp-hole" d="${k.planOutline(slot, HOUSING.z1, P, 3)}"/>
    ${L(k.planOutline(slot, HOUSING.z1, P, 3), { tone: "lo" })}
    ${D([[26.4, sy - 10.6], [41.6, sy - 10.6], [26.4, sy + 6.6], [41.6, sy + 6.6]].map(([x, y]) => at([x, y, HOUSING.z1])), { size: 0.45 })}
    <clipPath id="${fl}"><path d="${columnClip(box(slot.x, slot.y, slot.w, slot.d), HOUSING.z1, 80)}"/></clipPath>
    <g clip-path="url(#${fl})"><g data-part="flag"${attached ? ` transform="${k.translateAlong(P, [0, 0, FLAG])}"` : ""}>${blade(listener, sy, attached)}</g></g>
  </g>`;
}

// The subject: a case with the order button on top and the order number in a window.
const WIN = { x: -18, z: 30, w: 30, h: 9 };
function subject() {
  const out = [];
  out.push(S(k.slabOf({ x: -26, y: 60, w: 52, d: 38, r: 4 }, 0, CASE_Z[0], P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf(CASE, CASE_Z[0], CASE_Z[1] - CASE_Z[0], P, 6, 1.2), { tone: "mid", inner: L(k.sideSeam(CASE, 20, P, 6), { tone: "faint" }) }));
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: -18 + i * 5, y: 65, w: 2.4, d: 12, r: 1.2 }, CASE_Z[1], P, 3), { tone: "lo" }));
  out.push(D([[-20, 66], [20, 66], [-20, 92], [20, 92]].map(([x, y]) => at([x, y, CASE_Z[1]])), { size: 0.45 }));
  const [bx, by] = BUTTON;
  out.push(S(k.cylinder(bx, by, 10, CASE_Z[1], 1.4, P, 48, 0.4), { tone: "mid" }));
  out.push(L(k.ring(bx, by, 7.7, CASE_Z[1] + 1.4, P, 48), { tone: "lo" }));
  // The cap sinks into the bezel as it is pressed: clip it to the space above the bezel.
  out.push(`<clipPath id="ob-button"><path d="${columnClip(circle(bx, by, 8.2, 48), CASE_Z[1] + 1.4, 80)}"/></clipPath>`);
  out.push(`<g clip-path="url(#ob-button)"><g data-part="button">${S(k.cylinder(bx, by, 7.4, CASE_Z[1] + 1.4 - PRESS, 4.8, P, 48, 0.6), { tone: "hi", crease: "lo" })}${L(k.ring(bx, by, 5, CASE_Z[1] + 1.4 - PRESS + 4.8, P, 40), { tone: "faint" })}</g></g>`);
  out.push(displayWindow(), nameplate(), sidePanel());
  return out.join("");
}

function displayWindow() {
  const M = k.sideMatrix([WIN.x, CASE.y + CASE.d], WIN.z, P, "left");
  return `<g transform="${M}">
    <clipPath id="ob-win"><path d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/>
    <g clip-path="url(#ob-win)"><path class="dp-wall" d="M0 0H${WIN.w}V1.1H1.1V${WIN.h}H0Z"/>
    <text class="iso-face-text dp-digits" data-part="display" data-tone="lo" x="${WIN.w - 2.2}" y="6.8" font-size="6" text-anchor="end">-----</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/>
  </g>`;
}

function nameplate() {
  const M = k.sideMatrix([WIN.x, CASE.y + CASE.d], 16, P, "left");
  const lines = [[3, 3.2, 17], [3, 5.4, 11], [3, 7.6, 14]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  return `<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 24, 11, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 24, 11, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`
    + D([at([WIN.x + 21.4, CASE.y + CASE.d, 16 - 3]), at([WIN.x + 21.4, CASE.y + CASE.d, 16 - 8])], { size: 0.4 });
}

// The +x face, toward the stations: a screwed service panel.
function sidePanel() {
  const M = k.sideMatrix([CASE.x + CASE.w, CASE.y + CASE.d - 6], 31, P, "right");
  return `<g transform="${M}"><path class="iso-line" data-tone="faint" d="${rrect(0, 0, 22, 22, 1.6)}"/></g>`
    + D([[CASE.y + CASE.d - 8.4, 28.6], [CASE.y + 8.4, 28.6], [CASE.y + CASE.d - 8.4, 11.4], [CASE.y + 8.4, 11.4]].map(([y, z]) => at([CASE.x + CASE.w, y, z])), { size: 0.4 });
}

const START = 0;
const startSet = new Set(STEPS[START].subscribed);
const stations = LISTENERS.map((listener, index) => ({ listener, index })).sort((a, b) => STATION_Y[a.index] - STATION_Y[b.index]);
const spring0 = returnSpring(STROKE);

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một bàn tín hiệu với hộp nút đặt hàng ở đầu một thanh truyền vuông. Thanh chạy trên ba gối đỡ và có một hàng lỗ cách đều. Bên cạnh là bốn trạm listener gồm Email, Kho, Điểm và Thống kê. Trạm đã đăng ký trượt sát vào thanh và cắm chốt xuống một lỗ, nên khi nút được bấm và thanh đẩy đi, xe trượt của trạm chạy theo và cờ bật lên. Trạm chưa đăng ký thì lùi ra, nhấc chốt và đứng yên.",
  body: [
    base(),
    strokeScale(),
    endStop(),
    L(spring0.back, { tone: "lo", className: "ob-coil-back" }),
    S(ROD, { tone: "mid" }),
    L(spring0.front, { tone: "mid", className: "ob-coil-front" }),
    supportsBehind(),
    `<g data-part="bus" transform="${k.translateAlong(P, [0, -STROKE, 0])}">${bus()}</g>`,
    supportsFront(),
    ...stations.map(({ listener, index }) => station(listener, index, startSet.has(listener.id))),
    `<g data-part="subject">${subject()}</g>`,
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const STROKE = ${STROKE}, OUT = ${OUT}, LIFT = ${LIFT}, FLAG = ${FLAG}, PRESS = ${PRESS};
const SPRING = [${STOP_Y + 7.2}, ${BAR.y}, ${ROD_Z}];
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const bus = svg.querySelector('[data-part="bus"]');
const button = svg.querySelector('[data-part="button"]');
const coilBack = svg.querySelector(".ob-coil-back"), coilFront = svg.querySelector(".ob-coil-front");
const stations = LISTENERS.map((listener) => {
  const el = svg.querySelector('[data-listener="' + listener.id + '"]');
  return {
    el,
    carriage: el.querySelector('[data-part="carriage"]'),
    plungers: el.querySelectorAll('[data-part="plunger"]'),
    flag: el.querySelector('[data-part="flag"]'),
    blade: el.querySelector('[data-part="blade"] > .iso-solid'),
  };
});
const digits = svg.querySelector('[data-part="display"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const TOUR = 5.2;
const wanted = (index) => LISTENERS.map((listener) => STEPS[index].subscribed.includes(listener.id) ? 1 : 0);
let sel = ${START}, want = wanted(sel);
let b = STROKE, slide = want.slice(), pin = want.slice(), refire = false;
let frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0, shown = "", drawn = "";
const follow = (value, target, dt, tau, calm, eps) => {
  if (calm) return target;
  const next = value + (target - value) * (1 - Math.exp(-dt / tau));
  return Math.abs(target - next) < eps ? target : next;
};
const configured = () => stations.every((_, i) => slide[i] === want[i] && pin[i] === want[i]);
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
const tourFrom = (index) => ((index - ${START} + STEPS.length) % STEPS.length) * TOUR;
function describe() {
  want = wanted(sel);
  const step = STEPS[sel];
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", "Bước " + (sel + 1) + ", đơn " + step.order.code + " đến " + step.subscribed.length + " listener là " + reactionsOf(step).map((r) => r.name).join(", "));
  emit();
}
function draw() {
  const key = [b, ...slide, ...pin].map((v) => v.toFixed(3)).join();
  if (key !== drawn) {
    drawn = key;
    bus.setAttribute("transform", translateAlong(P, [0, -b, 0]));
    button.setAttribute("transform", translateAlong(P, [0, 0, PRESS - PRESS * b / STROKE]));
    const c = coil(SPRING[0], SPRING[1] - b, [0, SPRING[2]], 2.8, 6, "y", P);
    coilBack.setAttribute("d", c.back);
    coilFront.setAttribute("d", c.front);
    stations.forEach((s, i) => {
      // A carriage rides with the bar only while its plunger sits in the bar's hole.
      const ride = pin[i] > 0.5 ? b : 0;
      s.el.setAttribute("transform", translateAlong(P, [OUT * (1 - slide[i]), 0, 0]));
      s.carriage.setAttribute("transform", translateAlong(P, [0, -ride, 0]));
      const up = translateAlong(P, [0, 0, LIFT * (1 - pin[i])]);
      s.plungers.forEach((el) => el.setAttribute("transform", up));
      s.flag.setAttribute("transform", translateAlong(P, [0, 0, FLAG * ride / STROKE]));
      const on = ride > STROKE - 0.2;
      s.blade.toggleAttribute("data-lit", on);
      s.blade.querySelector(".iso-edge").setAttribute("data-tone", on ? "lit" : "hi");
    });
  }
  const step = STEPS[sel];
  const ready = configured() && !refire;
  const leaving = stations.findIndex((_, i) => !want[i] && (slide[i] || pin[i]));
  const joining = stations.findIndex((_, i) => want[i] && (slide[i] !== 1 || pin[i] !== 1));
  const text = !ready && leaving >= 0 ? "đang huỷ đăng ký " + LISTENERS[leaving].name
    : !ready && joining >= 0 ? "đang đăng ký " + LISTENERS[joining].name
    : b === STROKE ? "Đơn " + step.order.code + " → " + step.subscribed.length + " listener"
    : "đang phát đơn " + step.order.code;
  if (readout.textContent !== text) readout.textContent = text;
  const screen = b > 0.5 && ready ? step.order.code : "-----";
  if (screen !== shown) {
    shown = screen;
    digits.textContent = screen;
    digits.setAttribute("data-tone", screen === "-----" ? "lo" : "hi");
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    const next = (Math.floor(clock / TOUR) + ${START}) % STEPS.length;
    if (next !== sel) { sel = next; refire = true; describe(); }
  }
  if (calm) { slide = want.slice(); pin = want.slice(); refire = false; b = STROKE; }
  // The bar goes home before any station moves; a station slides in before its
  // plunger drops, and lifts its plunger before it slides out; the bar strokes
  // again only once every station stands where this step wants it.
  // "Close enough" thresholds let one move start while the last one settles:
  // a pin 0.15 units off its hole still drops in, and still sits in it.
  const home = b < 0.15;
  if (home) refire = false;
  // Away from home only the last few hundredths of a move may finish.
  stations.forEach((_, i) => {
    if (want[i]) {
      if (home || slide[i] > 0.99) slide[i] = follow(slide[i], 1, dt, 0.13, calm, 0.004);
      if (slide[i] > 0.99 && (home || pin[i] > 0.97)) pin[i] = follow(pin[i], 1, dt, 0.06, calm, 0.004);
    } else {
      if (home || pin[i] < 0.03) pin[i] = follow(pin[i], 0, dt, 0.06, calm, 0.004);
      if (pin[i] < 0.02 && (home || slide[i] < 0.01)) slide[i] = follow(slide[i], 0, dt, 0.13, calm, 0.004);
    }
  });
  const placed = !refire && stations.every((_, i) => Math.abs(slide[i] - want[i]) < 0.01 && Math.abs(pin[i] - want[i]) < 0.03);
  b = follow(b, placed ? STROKE : 0, dt, 0.11, calm, 0.02);
  draw();
  const settled = !touring && !refire && configured() && b === STROKE;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again. Choosing the step that is
// already showing places its order once more.
const choose = (index, hold) => {
  touring = false;
  clearTimeout(idleTimer);
  if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; clock = tourFrom(sel) + 0.6; emit(); run(); }, 3600);
  if (index !== sel) { sel = index; refire = true; describe(); } else { if (hold && !still.matches) refire = true; emit(); }
  run();
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = !still.matches; clock = tourFrom(sel) + 0.6; emit(); run(); });
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
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

// Step captions, built from the model: what changed in the subscriber list, then who reacted and how.
const listOf = (items) => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} và ${items[items.length - 1]}`;
const COUNT = ["không", "một", "hai", "ba", "bốn", "năm"];
const steps = STEPS.map((step) => {
  const heard = `<strong>${COUNT[step.subscribed.length]}</strong> listener`;
  const all = listOf(reactionsOf(step).map((r) => `${r.name} ${r.text}`));
  const order = `Đơn ${step.order.code} trị giá ${groupVND(step.order.total)} ₫`;
  const changed = step.change && listenerOf(step.change.id);
  if (!step.change) return {
    label: `Đặt đơn ${step.order.code}`,
    short: "Đặt đơn",
    caption: `Đơn ${step.order.code} gồm ${step.order.items} sản phẩm, trị giá ${groupVND(step.order.total)} ₫. Cả ${heard} đang đăng ký đều nhận tin: ${all}.`,
  };
  if (step.change.kind === "subscribe") return {
    label: `Đăng ký ${changed.name}`,
    short: "Thêm trạm",
    caption: `Lệnh <code>subscribe</code> cắm trạm ${changed.name} vào thanh, còn nút đặt hàng không phải sửa gì. ${order} giờ đến cả ${heard}, trong đó ${changed.name} ${changed.react(step.order)}.`,
  };
  return {
    label: `Huỷ đăng ký ${changed.name}`,
    short: "Bớt trạm",
    caption: `Lệnh <code>unsubscribe</code> nhấc chốt của trạm ${changed.name} nên trạm đứng yên. ${order} chỉ đến ${heard} còn lại: ${all}.`,
  };
});

const first = STEPS[START];
export const plate = withSteps(k.plateHtml({
  fig: "Fig 3",
  title: "Observer",
  hint: "Bấm vào hình để sang bước sau",
  readout: `Đơn ${first.order.code} → ${first.subscribed.length} listener`,
  keys: [
    { mark: "lit", label: "Cờ bật lên ở những trạm vừa nhận sự kiện" },
    { mark: "raised", label: "Bốn trạm từ trái sang phải là Email, Kho, Điểm và Thống kê" },
  ],
  caption:
    "Nút đặt hàng chỉ đẩy một thanh truyền chung và không hề biết có bao nhiêu trạm đang nghe. Trạm nào cắm chốt xuống lỗ trên thanh thì chạy theo thanh và bật cờ, còn trạm đã nhấc chốt thì đứng yên. Đăng ký hay huỷ đăng ký chỉ là cắm hay nhấc một chốt, và trên thanh vẫn còn lỗ trống cho trạm mới.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Bàn tín hiệu, dùng phím mũi tên để chuyển bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Đăng ký và phát sự kiện", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-digits{letter-spacing:.06em}
.iso-stage{touch-action:pan-y;cursor:pointer}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
