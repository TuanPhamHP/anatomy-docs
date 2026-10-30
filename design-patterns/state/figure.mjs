// The State figure: a key bar (the request, which always offers the same four
// actions) over a state drum. Each state is one row of holes around the drum,
// and the row on top is the current state. A key whose track has a hole under it
// goes down and the drum then turns to the next state; a key that meets the
// solid track stops short, and the action is refused. A square detent cam with a
// flat follower holds the drum at each quarter turn, and the bar's window shows
// the state's name (model.mjs).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { ACTIONS, RULES, SCENARIO, STATES, actionOf, apply, stateOf } from "./model.mjs";
import { BAND, CAM, DRUM_F, DX, DZ, KNOB, R, RB, TRACK_Y, camSvg, camTop, holesSvg, knobSvg, rivetsSvg } from "./rotor.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LATHE = "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";

const WIDTH = 600;
const HEIGHT = 400;

const PLATE = { x: -70, y: -76, w: 84, d: 164, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Frame: two uprights carry the drum shaft and, on top, the key bar.
const UP_X = -46;
const UP_W = 32;
const UPRIGHTS = [-58, 50]; // y of each upright, 8 deep
const UP_TOP = 60;
const BAR = { x: -42, y: -58, w: 24, d: 116, r: 2.5 };
const BAR_Z = [60, 78];
const BAR_FACE = BAR.x + BAR.w;
const COLLAR_TOP = BAR_Z[1] + 1.6;

// Keys: a stem with a round cap above the bar, a rod below it, one plunger.
const ROD_R = 1.5;
const GAP = 5; // a key at rest stops this far above its track
const DEPTH = 7; // a key with a hole under it goes this far into the drum, until its collar lands
const TIP = DZ + RB + GAP;
const CAP_Z = 92;
const STEM_FROM = 70;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(BAR, BAR_Z[0], CAP_Z + 4)],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 40 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const Z = [0, 0, 1];
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const screwsAt = (points, z) => L(points.map(([x, y]) => k.ring(x, y, 2, z, P, 16)).join(""), { tone: "lo" }) + D(points.map(([x, y]) => at([x, y, z])), { size: 0.5 });

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  out.push(screwsAt(k.corners(PLATE, 10), 0));
  // Label plate on the front apron.
  const label = { x: -8, y: -66, w: 16, d: 30, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-3.5, -61, 20], [-0.5, -61, 13], [2.5, -61, 17], [5.5, -61, 9]].map(([x, y, w]) => k.lineOnTop([x, y], [x, y + w], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 10, label.y + 2.6, 0.8]), at([label.x + 10, label.y + label.d - 2.6, 0.8])], { size: 0.4 }));
  return out.join("");
}

// One upright on its foot block. `near` adds the parts on its visible outer face.
function upright(y) {
  const out = [];
  const foot = { x: UP_X - 4, y: y - 4, w: UP_W + 8, d: 16, r: 2 };
  out.push(S(k.slabOf(foot, 0, 3, P, 4, 0.5), { tone: "mid" }));
  out.push(D([[foot.x + 3, foot.y + 3], [foot.x + foot.w - 3, foot.y + 3], [foot.x + 3, foot.y + foot.d - 3], [foot.x + foot.w - 3, foot.y + foot.d - 3]].map(([x, yy]) => at([x, yy, 3])), { size: 0.45 }));
  const plan = { x: UP_X, y, w: UP_W, d: 8, r: 1.5 };
  out.push(S(k.slabOf(plan, 3, UP_TOP - 3, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(plan, 8, P, 4), { tone: "faint" }) }));
  // A machined slot down the front face, between two bolts.
  const M = k.sideMatrix([UP_X + UP_W, y + 5.5], 50, P, "right");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 3, 34, 1.5)}"/></g>`);
  out.push(D([at([UP_X + UP_W, y + 4, 54]), at([UP_X + UP_W, y + 4, 12])], { size: 0.45 }));
  return out.join("");
}

// The far upright's inner face carries the far bearing, seen behind the drum.
function farBearing() {
  const face = UPRIGHTS[0] + 8;
  return S(G.disc(face, face + 1.6, 6, DRUM_F, P), { tone: "mid" }) + D(G.dotsOf(DRUM_F, face + 1.6, 4.4, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.4 });
}

// The drum: the state object. One turned body with four raised tracks.
function drum() {
  const F = 14.6;
  const profile = [[-50, 3], [-46.4, 3], [-46.4, F - 0.6], [-45.8, F], [-44.6, F], [-44, F - 0.6], [-44, R]];
  for (const c of [...TRACK_Y].sort((a, b) => a - b)) profile.push([c - BAND, R], [c - BAND, RB], [c + BAND, RB], [c + BAND, R]);
  profile.push([44, R], [44, F - 0.6], [44.6, F], [45.8, F], [46.4, F - 0.6], [46.4, 3], [50, 3]);
  const seams = [-45.2, 45.2].map((s) => G.arcOf(DRUM_F, s, F, P)).join("");
  return `<g data-part="drum">${S(G.solidOf(profile, DRUM_F, P), { tone: "hi", crease: "lo", inner: L(seams, { tone: "faint" }) })}</g>
    <g data-part="holes">${holesSvg(P, START_D, STATES, ACTIONS, RULES)}</g>
    <g data-part="rivets">${rivetsSvg(P, START_D)}</g>`;
}

// One key's rod below the bar, clipped where it enters the drum.
function rod(index) {
  const y = TRACK_Y[index];
  const F = G.frameAlong([DX, y, TIP], Z);
  const clip = G.disc(0, 40, 3.9, G.frameAlong([DX, y, DZ + RB], Z), P).fill;
  return `<clipPath id="st-rod-${index}"><path d="${clip}"/></clipPath><g clip-path="url(#st-rod-${index})"><g data-part="plunger" data-key="${index}">
    ${S(G.solidOf([[0, ROD_R - 0.5], [0.6, ROD_R], [30, ROD_R]], F, P), { tone: "mid", lit: index === START_KEY })}
    ${S(G.disc(DEPTH, DEPTH + 1.4, 3.5, F, P), { tone: "mid", lit: index === START_KEY })}
  </g></g>`;
}

function bar() {
  const out = [];
  const seam = k.sideSeam(BAR, 74, P, 6);
  out.push(S(k.slabOf(BAR, BAR_Z[0], BAR_Z[1] - BAR_Z[0], P, 6, 1), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BAR, 3), BAR_Z[1], P, 4), { tone: "faint" }));
  out.push(screwsAt([-54, 0, 54].flatMap((y) => [[-36.5, y], [-23.5, y]]), BAR_Z[1]));
  for (const y of TRACK_Y) {
    out.push(S(k.cylinder(DX, y, 5, BAR_Z[1], 1.6, P, 36), { tone: "lo" }));
    out.push(L(k.ring(DX, y, 2.3, COLLAR_TOP, P, 20), { tone: "lo" }));
  }
  out.push(display(), nameplate());
  out.push(D([[-36, 72], [-24, 72], [-36, 64], [-24, 64]].map(([x, z]) => at([x, BAR.y + BAR.d, z])), { size: 0.45 }));
  return out.join("");
}

// The window on the bar's front face: the state's name, as the request shows it.
const WIN = { y: 26, z: 75.4, w: 52, h: 12 };
function display() {
  const M = k.sideMatrix([BAR_FACE, WIN.y], WIN.z, P, "right");
  return `<g transform="${M}">
    <clipPath id="st-win"><path d="${rrect(0, 0, WIN.w, WIN.h, 1.6)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1.6)}"/>
    <g clip-path="url(#st-win)"><path class="dp-wall" d="M0 0H${WIN.w}V1.1H1.1V${WIN.h}H0Z"/>
    <text class="iso-face-text dp-digits" data-part="display" data-tone="hi" x="${WIN.w / 2}" y="9" font-size="6.6" text-anchor="middle">${stateOf(START_STATE).display}</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1.6)}"/>
  </g>`;
}

function nameplate() {
  const M = k.sideMatrix([BAR_FACE, -36], 74, P, "right");
  const lines = [[2.8, 2.8, 9], [2.8, 5, 6], [2.8, 7.2, 8]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  return `<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 18, 10, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 18, 10, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`
    + D([at([BAR_FACE, -36 - 15.2, 74 - 2.8]), at([BAR_FACE, -36 - 15.2, 74 - 7.2])], { size: 0.4 });
}

// One key above the bar: stem and cap, clipped where the stem enters its collar.
function key(index) {
  const y = TRACK_Y[index];
  const clip = G.disc(0, 40, ROD_R + 1.2, G.frameAlong([DX, y, COLLAR_TOP], Z), P).fill;
  const cap = G.frameAlong([DX, y, CAP_Z], Z);
  return `<clipPath id="st-stem-${index}"><path d="${clip}"/></clipPath><g clip-path="url(#st-stem-${index})"><g data-part="plunger" data-key="${index}">
    ${S(G.solidOf([[0, ROD_R], [CAP_Z - STEM_FROM, ROD_R]], G.frameAlong([DX, y, STEM_FROM], Z), P), { tone: "mid", lit: index === START_KEY })}
  </g></g>
  <g data-part="plunger" data-key="${index}">${S(G.solidOf([[0, 3.7], [0.7, 4.6], [3, 4.6], [3.6, 3.9]], cap, P), { tone: "hi", crease: "lo", lit: index === START_KEY, inner: L(G.circleOf(cap, 3.6, 2.6, P, 40), { tone: "faint" }) })}</g>`;
}

// Outside the near upright: bearing, shaft, detent cam with its follower, hand knob.
function nearEnd() {
  const face = UPRIGHTS[1] + 8;
  const out = [];
  out.push(S(G.disc(face, face + 1, 11, DRUM_F, P), { tone: "lo" }));
  out.push(D(G.dotsOf(DRUM_F, face + 1, 9, 6, P, { all: true, phase: Math.PI / 6 }), { size: 0.45 }));
  out.push(S(G.disc(face + 1, face + 2.5, 6.5, DRUM_F, P), { tone: "mid" }));
  out.push(D(G.dotsOf(DRUM_F, face + 2.5, 4.9, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.45 }));
  out.push(S(G.disc(face + 2.5, CAM.s[0], 3, DRUM_F, P), { tone: "hi", crease: "lo" }));
  out.push(`<g data-part="cam">${camSvg(P, START_D)}</g>`);
  out.push(S(G.disc(CAM.s[1], KNOB.s[0], 3, DRUM_F, P), { tone: "hi", crease: "lo" }));
  // Follower: a flat pad on a stem, pressed down onto the cam from a housing on the upright.
  const housing = { x: DX - 6.5, y: face, w: 13, d: 12, r: 1.5 };
  const lift = camTop(START_D);
  out.push(`<g data-part="follower">
    ${S(k.cylinder(DX, face + 6, 1.3, DZ + lift + 2, 50 - (DZ + lift + 2) + 2, P, 18), { tone: "mid" })}
    ${S(k.slabOf({ x: DX - 5, y: CAM.s[0] + 0.4, w: 10, d: CAM.s[1] - CAM.s[0] - 0.8, r: 1 }, DZ + lift, 2, P, 3, 0.4), { tone: "mid" })}
  </g>`);
  out.push(S(k.slabOf(housing, 50, 8, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(housing, 52, P, 4), { tone: "faint" }) }));
  out.push(S(k.cylinder(DX, face + 6, 2.2, 58, 1.8, P, 20), { tone: "mid" }));
  out.push(L(k.lineOnTop([DX - 1.6, face + 6], [DX + 1.6, face + 6], 59.8, P), { tone: "lo" }));
  out.push(D([at([housing.x + 2.4, face + 12, 55.6]), at([housing.x + housing.w - 2.4, face + 12, 55.6])], { size: 0.4 }));
  // Hand knob on the shaft end, knurled; its pointer turns with the drum.
  out.push(S(G.solidOf([[KNOB.s[0], 3.2], [71.2, 3.2], [71.2, 5.6], [71.8, KNOB.r], [77, KNOB.r], [KNOB.s[1], KNOB.r - 0.8]], DRUM_F, P), { tone: "mid" }));
  out.push(L(G.circleOf(DRUM_F, KNOB.s[1], 1.4, P, 20), { tone: "lo" }));
  out.push(`<g data-part="knob">${knobSvg(P, START_D)}</g>`);
  return out.join("");
}

const START = 0;
const START_STATE = SCENARIO[START].state;
const START_D = STATES.findIndex((state) => state.id === START_STATE);
const START_KEY = ACTIONS.findIndex((action) => action.id === SCENARIO[START].action);

// Paint far to near: the far upright, the drum, the near upright, the rods,
// the bar over them, the keys on the bar, then the parts outside the near upright.
const order = (list) => [...list].sort((a, b) => TRACK_Y[a] - TRACK_Y[b]);
export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một cỗ máy có thanh phím phía trên và một trống trạng thái phía dưới. Thanh phím có bốn phím (gửi duyệt, duyệt, từ chối, sửa lại) và một ô kính hiện tên trạng thái. Trống có bốn hàng lỗ, mỗi hàng là một trạng thái; hàng nằm trên đỉnh là trạng thái hiện tại. Phím nào có lỗ bên dưới thì đi xuống được và trống quay sang trạng thái kế; phím chạm mặt trống thì bị chặn.",
  body: [
    base(),
    upright(UPRIGHTS[0]),
    farBearing(),
    drum(),
    upright(UPRIGHTS[1]),
    order([0, 1, 2, 3]).map(rod).join(""),
    bar(),
    order([0, 1, 2, 3]).map(key).join(""),
    nearEnd(),
  ],
});

const strip = (file) => readFileSync(file, "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");
const KIT_NAMES = "iso, pathOf, solidSvg, lineSvg, dotsSvg, fadedSvg, fadeLineSvg, translateAlong";
const LATHE_NAMES = "frameOf, frameAlong, pointOf, facingOf, fadeOf, dotsOf, prismOf, ribsOf, circleOf, arcOf";

export const live = `
const k = { ${KIT_NAMES} };
const G = (() => {
${strip(LATHE)}
return { ${LATHE_NAMES} };
})();
${strip(join(HERE, "model.mjs"))}
${strip(join(HERE, "rotor.mjs"))}
const P = ${JSON.stringify(P)};
const TIP = ${TIP}, FREE = ${GAP + DEPTH}, BLOCKED = ${GAP}, CLEAR = ${GAP - 0.6}, START = ${START};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const keys = ACTIONS.map((_, i) => [...svg.querySelectorAll('[data-part="plunger"][data-key="' + i + '"]')]);
const edgesOf = keys.map((list) => list.flatMap((el) => [...el.querySelectorAll(".iso-solid")]).map((el) => {
  const edge = el.querySelector(".iso-edge");
  return { el, edge, tone: edge.getAttribute("data-tone") };
}));
const holes = svg.querySelector('[data-part="holes"]');
const rivets = svg.querySelector('[data-part="rivets"]');
const cam = svg.querySelector('[data-part="cam"]');
const knob = svg.querySelector('[data-part="knob"]');
const follower = svg.querySelector('[data-part="follower"]');
const display = svg.querySelector('[data-part="display"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const rowOf = (id) => STATES.findIndex((state) => state.id === id);
const LIFT0 = camTop(rowOf(SCENARIO[START].state));
// Timing of one step: press, hold the key down, release, then the drum turns.
const PRESS = 0.95, DWELL = 1.9;

let sel = START, mode = "setup", modeClock = 0;
let d = rowOf(SCENARIO[sel].state), target = d, drawnD = null;
let push = ACTIONS.map(() => 0);
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0, shown = "", lit = -1;
const follow = (value, to, dt, tau, calm) => {
  if (calm) return to;
  const next = value + (to - value) * (1 - Math.exp(-dt / tau));
  return Math.abs(to - next) < 0.004 ? to : next;
};
// The ratchet only turns forward: the next detent at or after the drum that shows this row.
const forwardTo = (from, row) => {
  const base = Math.ceil(from - 0.02);
  return base + ((((row - base) % 4) + 4) % 4);
};
const stepOf = (index) => {
  const step = SCENARIO[index];
  return { ...step, from: stateOf(step.state), act: actionOf(step.action), key: ACTIONS.findIndex((a) => a.id === step.action), result: apply(step.state, step.action) };
};
let step = stepOf(sel);
function describe() {
  const outcome = step.result.ok ? "chuyển sang " + stateOf(step.result.next).name : "bị chặn";
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", "Bước " + (sel + 1) + ": " + step.from.name + ", bấm " + step.act.name + ", " + outcome);
  emit();
}
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function start(index) {
  sel = index;
  step = stepOf(index);
  mode = "setup";
  modeClock = 0;
  target = forwardTo(d, rowOf(step.state));
  describe();
}
function text() {
  const from = step.from.name, act = step.act.name;
  if (mode === "setup") return target !== d ? "về " + from : from + " · bấm " + act;
  if (mode === "press" || mode === "release") return from + " · bấm " + act + (step.result.ok ? "" : ": chạm mặt trống");
  if (mode === "turn") return from + " → " + stateOf(step.result.next).name;
  return from + " · " + act + " → " + (step.result.ok ? stateOf(step.result.next).name : "bị chặn");
}
function draw() {
  keys.forEach((list, i) => {
    const t = translateAlong(P, [0, 0, -push[i]]);
    list.forEach((el) => el.setAttribute("transform", t));
  });
  if (lit !== step.key) {
    lit = step.key;
    edgesOf.forEach((list, i) => list.forEach(({ el, edge, tone }) => {
      el.toggleAttribute("data-lit", i === lit);
      edge.setAttribute("data-tone", i === lit ? "lit" : tone);
    }));
  }
  if (d !== drawnD) {
    drawnD = d;
    holes.innerHTML = holesSvg(P, d, STATES, ACTIONS, RULES);
    rivets.innerHTML = rivetsSvg(P, d);
    cam.innerHTML = camSvg(P, d);
    knob.innerHTML = knobSvg(P, d);
    follower.setAttribute("transform", translateAlong(P, [0, 0, camTop(d) - LIFT0]));
  }
  const settled = Math.abs(d - Math.round(d)) < 0.02;
  const screen = settled ? STATES[((Math.round(d) % 4) + 4) % 4].display : "· · ·";
  if (screen !== shown) {
    shown = screen;
    display.textContent = screen;
    display.setAttribute("data-tone", settled ? "hi" : "lo");
  }
  const words = text();
  if (readout.textContent !== words) readout.textContent = words;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  modeClock += dt;
  const key = step.key;
  if (mode === "setup") {
    // The drum may turn only while every key is clear of it.
    if (push.every((p) => p < CLEAR) || calm) d = follow(d, target, dt, 0.32, calm);
    if (d === target) { mode = "press"; modeClock = 0; }
  }
  if (mode === "press") {
    // A key with a hole under it goes all the way; one over the solid track stops on it.
    push[key] = follow(push[key], step.result.ok ? FREE : BLOCKED, dt, 0.16, calm);
    if (modeClock > PRESS || calm) { mode = "release"; modeClock = 0; }
  }
  if (mode === "release") {
    push[key] = follow(push[key], 0, dt, 0.14, calm);
    // The drum may turn only once the key is back out of its hole.
    if (push[key] < CLEAR || calm) {
      if (step.result.ok) { mode = "turn"; target = forwardTo(d, rowOf(step.result.next)); }
      else mode = "done";
      modeClock = 0;
    }
  }
  if (mode === "turn") {
    d = follow(d, target, dt, 0.26, calm);
    if (d === target) { mode = "done"; modeClock = 0; }
  }
  push = push.map((p, i) => (i === key && mode !== "done" ? p : follow(p, 0, dt, 0.14, calm)));
  if (mode === "done" && touring && modeClock > DWELL) start((sel + 1) % SCENARIO.length);
  draw();
  const idle = mode === "done" && !touring && push.every((p) => p === 0);
  frame = visible && !idle ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again.
const pause = () => {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { touring = !still.matches; emit(); run(); }, 3600);
  emit();
  run();
};
const choose = (index) => {
  touring = false;
  clearTimeout(idleTimer);
  start(index);
  run();
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = true; if (mode === "done") modeClock = DWELL; emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để sang bước tiếp";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse" && touring) pause(); });
stage.addEventListener("pointerdown", () => choose((sel + 1) % SCENARIO.length));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = (sel + 1) % SCENARIO.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = (sel - 1 + SCENARIO.length) % SCENARIO.length;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = SCENARIO.length - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to);
});
describe();
draw();
`;

// One step per action of the scenario; the caption says what the current state decided.
const steps = SCENARIO.map((s, i) => {
  const from = stateOf(s.state);
  const act = actionOf(s.action);
  const result = apply(s.state, s.action);
  const said = result.ok
    ? `<code>${from.cls}.${s.action}()</code> chuyển hồ sơ sang <strong>${stateOf(result.next).name}</strong>.`
    : `<code>${from.cls}</code> không nhận thao tác này (${result.reason}), nên phím chạm mặt trống và trạng thái giữ nguyên.`;
  return { label: s.label, short: String(i + 1), caption: `Ở trạng thái <strong>${from.name}</strong>, bấm <em>${act.name}</em>: ${said}` };
});

const first = SCENARIO[START];
export const plate = withSteps(k.plateHtml({
  fig: "Fig 6",
  title: "State",
  hint: "Bấm vào hình để sang bước tiếp",
  readout: `${stateOf(first.state).name} · bấm ${actionOf(first.action).name}`,
  keys: [
    { mark: "lit", label: "Phím đang bấm: một thao tác trên hồ sơ" },
    { mark: "raised", label: "Trống trạng thái: hàng lỗ trên đỉnh là trạng thái hiện tại" },
  ],
  caption:
    "Thanh phím là hồ sơ: lúc nào cũng có đúng bốn phím gửi duyệt, duyệt, từ chối, sửa lại. Bên dưới là trống trạng thái, mỗi trạng thái một hàng lỗ, và hàng nằm trên đỉnh là trạng thái hiện tại. Phím có lỗ bên dưới thì đi xuống được, rồi trống quay sang trạng thái kế; phím chạm mặt trống thì bị chặn. Cùng một phím, kết quả do trạng thái quyết định.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="State: phím mũi tên để chuyển giữa các bước" aria-valuemin="1" aria-valuemax="${SCENARIO.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước: hồ sơ đi qua các trạng thái", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.st-hole{fill:var(--anatomy-lo);fill-opacity:.5}
.dp-digits{letter-spacing:.06em}
.iso-stage{touch-action:pan-y;cursor:pointer;overflow:hidden}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:122%;margin:-5% -11% 0}}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
