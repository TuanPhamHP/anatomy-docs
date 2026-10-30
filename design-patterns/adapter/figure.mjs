// The Adapter figure: a reconciliation meter with one standard socket, and a
// carriage carrying three adapter blocks. Each block takes one bank's plug
// (round, square, hexagonal) on its front and ends in the same two standard
// pins at its back. Selecting a bank slides the carriage until that block
// faces the socket, then pushes its pins in; the meter's display shows the
// amount the adapter produced from that bank's raw record (model.mjs).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { ADAPT, BANKS, groupVND, rawAmount } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 400;

const PLATE = { x: -114, y: -88, w: 170, d: 176, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Reconciliation meter (the client) and its standard socket.
const PLINTH = { x: -108, y: -44, w: 58, d: 88, r: 3 };
const CASE = { x: -106, y: -42, w: 54, d: 84, r: 4 };
const CASE_Z = 3;
const CASE_TOP = 52;
const BOSS = { x: -52, y: -15, w: 6, d: 30, r: 2 };
const BOSS_Z = [13, 39];
const SOCK_FACE = BOSS.x + BOSS.w;
const PIN_Z = 26;
const PIN_Y = [-4.5, 4.5];
const PIN_R = 1.3;
const KNOB = [-66, 26];

// Carriage on two rails along y, with one adapter per bank.
const RAIL_X = [-40, 16];
const CAR = { x: -46, y: -48, w: 76, d: 96, r: 3 };
const CAR_Z = 3;
const CAR_TOP = 9;
const ADAPTER_Y = [-30, 0, 30];
const STOPS = ADAPTER_Y.map((y) => -y);
const BODY = { x: -28, y: -10, w: 18, d: 20, r: 2.5 };
const BODY_Z = [16, 36];
const PIN_LEN = 9;
const STROKE = BODY.x - SOCK_FACE;
const RULER = { x: 42, y: -66, w: 8, d: 132, r: 1 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(CASE, CASE_Z, CASE_TOP + 4)],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 40 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const X = [1, 0, 0];
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const shift = (plan, dy) => ({ ...plan, y: plan.y + dy });
const hexagon = (r) => Array.from({ length: 6 }, (_, i) => [r * Math.cos(Math.PI / 6 + (i * Math.PI) / 3), r * Math.sin(Math.PI / 6 + (i * Math.PI) / 3)]);
// A closed rounded rectangle in a face's own 2D coordinates.
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

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
  // Selection scale under the carriage pointer: a major tick at each bank's stop.
  out.push(S(k.slabOf(RULER, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-60, 60, 5, 6, RULER.x + 0.8, 0.6, [2, 3.6], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([RULER.x + 4, RULER.y + 2.4, 0.6]), at([RULER.x + 4, RULER.y + RULER.d - 2.4, 0.6])], { size: 0.45 }));
  // Label plate.
  const label = { x: -100, y: 62, w: 40, d: 14, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-94, 66.5, 22], [-94, 69.5, 15], [-94, 72.5, 19]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.6, label.y + 7, 0.8]), at([label.x + label.w - 2.6, label.y + 7, 0.8])], { size: 0.4 }));
  return out.join("");
}

function railsAndBackStop() {
  const out = [];
  for (const x of RAIL_X) {
    out.push(S(k.slabOf({ x, y: -82, w: 5, d: 164, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
    out.push(D([-76, 76].map((y) => at([x + 2.5, y, 3])), { size: 0.4 }));
  }
  out.push(endStop(-86));
  return out.join("");
}

function endStop(y) {
  const plan = { x: -45, y, w: 67, d: 4, r: 1.2 };
  return S(k.slabOf(plan, 0, 7, P, 3, 0.5), { tone: "mid" }) + D([-38, 15].map((x) => at([x, y + 2, 7])), { size: 0.45 });
}

function meter() {
  const out = [];
  out.push(S(k.slabOf(PLINTH, 0, CASE_Z, P, 4, 0.5), { tone: "mid" }));
  const seam = k.sideSeam(CASE, 45, P, 6);
  out.push(S(k.slabOf(CASE, CASE_Z, CASE_TOP - CASE_Z, P, 6, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  // Vents on the lid: closed slots.
  for (let i = 0; i < 5; i++) out.push(L(k.planOutline({ x: -98, y: -33 + i * 6, w: 26, d: 2.4, r: 1.2 }, CASE_TOP, P, 3), { tone: "lo" }));
  out.push(D([[-101, -37], [-57, -37], [-101, 37], [-57, 37]].map(([x, y]) => at([x, y, CASE_TOP])), { size: 0.45 }));
  // Range knob on the lid.
  const [kx, ky] = KNOB;
  out.push(S(k.cylinder(kx, ky, 7.2, CASE_TOP, 1.2, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(kx, ky, 5.6, CASE_TOP + 1.2, 4.4, P, 36), { tone: "mid" }));
  out.push(L(k.knurl(kx, ky, 5.6, CASE_TOP + 1.2, CASE_TOP + 5.6, 36, P), { tone: "lo" }));
  out.push(L(k.ring(kx, ky, 1.3, CASE_TOP + 5.6, P, 16), { tone: "mid" }));
  out.push(L(k.lineOnTop([kx + 1.3, ky], [kx + 5.6, ky], CASE_TOP + 5.6, P), { tone: "hi" }));
  out.push(display(), nameplate(), socket());
  return out.join("");
}

// The display window on the +y face, drawn in that face's own coordinates.
const WIN = { x: -102, z: 41, w: 46, h: 11 };
function display() {
  const M = k.sideMatrix([WIN.x, CASE.y + CASE.d], WIN.z, P, "left");
  return `<g transform="${M}">
    <clipPath id="dp-win"><path d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/>
    <g clip-path="url(#dp-win)"><path class="dp-wall" d="M0 0H${WIN.w}V1.1H1.1V${WIN.h}H0Z"/>
    <text class="iso-face-text dp-digits" data-part="display" data-tone="lo" x="${WIN.w - 2.2}" y="8.1" font-size="7" text-anchor="end">-------</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1.4)}"/>
  </g>`;
}

function nameplate() {
  const M = k.sideMatrix([WIN.x, CASE.y + CASE.d], 24, P, "left");
  const lines = [[3, 3.2, 17], [3, 5.4, 12], [3, 7.6, 15]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  return `<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 28, 11, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 28, 11, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`
    + D([at([WIN.x + 25.4, CASE.y + CASE.d, 24 - 3]), at([WIN.x + 25.4, CASE.y + CASE.d, 24 - 8])], { size: 0.4 });
}

function socket() {
  const out = [];
  out.push(S(k.slabOf(BOSS, BOSS_Z[0], BOSS_Z[1] - BOSS_Z[0], P, 4, 0.6), { tone: "mid" }));
  // Face recess and the two standard holes, in the boss face's own plane.
  const M = k.sideMatrix([SOCK_FACE, BOSS.y + BOSS.d - 3.5], BOSS_Z[1] - 3.5, P, "right");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="faint" d="${rrect(0, 0, BOSS.d - 7, BOSS_Z[1] - BOSS_Z[0] - 7, 2)}"/></g>`);
  for (const y of PIN_Y) {
    const F = G.frameAlong([SOCK_FACE, y, PIN_Z], X);
    out.push(`<path class="dp-hole" d="${G.circleOf(F, 0, PIN_R + 0.5, P, 32)}"/>`);
    out.push(L(G.circleOf(F, 0, PIN_R + 0.5, P, 32), { tone: "lo" }));
  }
  out.push(D([[BOSS.y + 2, BOSS_Z[0] + 2], [BOSS.y + BOSS.d - 2, BOSS_Z[0] + 2], [BOSS.y + 2, BOSS_Z[1] - 2], [BOSS.y + BOSS.d - 2, BOSS_Z[1] - 2]].map(([y, z]) => at([SOCK_FACE, y, z])), { size: 0.45 }));
  return out.join("");
}

function carriagePlate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CAR, 3), CAR_Z, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(CAR, CAR_Z, CAR_TOP - CAR_Z, P, 5, 0.6), { tone: "mid" }));
  out.push(D([-40, -28, -16, -4, 8, 20, 32, 40].map((y) => at([CAR.x + CAR.w - 2.6, y, CAR_TOP])), { size: 0.4, tone: "lo" }));
  // Bushings over each rail at both ends of the carriage.
  for (const y of [CAR.y + 1, CAR.y + CAR.d - 7]) {
    for (const x of RAIL_X) {
      out.push(S(k.slabOf({ x: x - 2, y, w: 9, d: 6, r: 1.4 }, CAR_TOP, 3, P, 3, 0.4), { tone: "mid" }));
      out.push(D([at([x + 2.5, y + 3, CAR_TOP + 3])], { size: 0.45 }));
    }
  }
  return out.join("");
}

// Front fittings of the carriage, drawn after the adapters: pointer and handle.
function carriageFront() {
  const out = [];
  out.push(S(k.slabOf({ x: CAR.x + CAR.w, y: -1.6, w: 17, d: 3.2, r: 0.8 }, CAR_Z, 1.2, P, 3), { tone: "mid" }));
  out.push(L(k.lineOnTop([CAR.x + CAR.w, 0], [CAR.x + CAR.w + 17, 0], CAR_Z + 1.2, P), { tone: "hi" }));
  const hx = CAR.x + CAR.w;
  out.push(S(k.slabOf({ x: hx, y: 22.6, w: 3.6, d: 2.8, r: 0.8 }, CAR_Z + 1.2, 3, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(hx + 6.4, 24, 3, CAR_Z + 0.4, 5.6, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(hx + 6.4, 24, 3, CAR_Z + 0.4, CAR_Z + 6, 18, P), { tone: "lo" }));
  return out.join("");
}

// Static parts of one adapter's slide: guides and the end stop.
function guides(ay) {
  const out = [];
  for (const y of [ay - 9, ay + 6]) out.push(S(k.slabOf({ x: -45, y, w: 40, d: 3, r: 0.8 }, CAR_TOP, 2, P, 3, 0.3), { tone: "mid" }));
  return out.join("");
}

function endBlock(ay) {
  const plan = { x: -6, y: ay - 9, w: 3, d: 18, r: 0.8 };
  return S(k.slabOf(plan, CAR_TOP, 5, P, 3, 0.4), { tone: "mid" }) + D([at([-4.5, ay - 6, CAR_TOP + 5]), at([-4.5, ay + 6, CAR_TOP + 5])], { size: 0.4 });
}

// Moving parts under the adapter: the slide plate and the pedestal.
function slide(ay) {
  const out = [];
  out.push(S(k.slabOf(shift({ x: -28, y: -9, w: 22, d: 18, r: 1.5 }, ay), CAR_TOP + 2, 2.4, P, 3, 0.4), { tone: "mid" }));
  out.push(D([-24, -10].map((x) => at([x, ay + 7.2, CAR_TOP + 4.4])), { size: 0.4 }));
  out.push(S(k.slabOf(shift({ x: -25, y: -6, w: 14, d: 12, r: 1 }, ay), CAR_TOP + 4.4, BODY_Z[0] - CAR_TOP - 4.4, P, 3), { tone: "mid" }));
  return out.join("");
}

// The two standard pins at the back of every adapter (identical on all three).
function pins(ay) {
  return PIN_Y.map((py) => {
    const F = G.frameAlong([SOCK_FACE, ay + py, PIN_Z], X);
    const from = STROKE - PIN_LEN;
    return S(G.solidOf([[from, PIN_R - 0.5], [from + 0.9, PIN_R], [STROKE, PIN_R]], F, P), { tone: "hi", crease: "lo" });
  }).join("");
}

// Clip for the pins: the space in front of the socket face, so a pin pushed in disappears into its hole.
function pinClip(index, ay) {
  const paths = PIN_Y.map((py) => G.disc(0, STROKE + 0.6, PIN_R + 0.9, G.frameAlong([SOCK_FACE, ay + py, PIN_Z], X), P).fill);
  return `<clipPath id="dp-pins-${index}">${paths.map((d) => `<path d="${d}"/>`).join("")}</clipPath>`;
}

// The adapter body and the bank's plug seated in its front.
function adapterBody(bank, ay) {
  const out = [];
  const plan = shift(BODY, ay);
  const seam = k.sideSeam(plan, 31, P, 3);
  out.push(`<g data-part="body">${S(k.slabOf(plan, BODY_Z[0], BODY_Z[1] - BODY_Z[0], P, 3, 0.8), { tone: "hi", crease: "lo", inner: L(seam, { tone: "faint" }) })}</g>`);
  out.push(L(k.planOutline(k.insetPlan(plan, 3), BODY_Z[1], P, 3), { tone: "faint" }));
  out.push(D([at([plan.x + 5, plan.y + 5, BODY_Z[1]]), at([plan.x + 5, plan.y + plan.d - 5, BODY_Z[1]])], { size: 0.45 }));
  const face = plan.x + plan.w;
  const F = G.frameAlong([face, ay, PIN_Z], X);
  if (bank.plug === "round") {
    out.push(S(G.disc(0, 1.4, 8.4, F, P), { tone: "hi", crease: "lo" }));
    const ribs = G.ribsOf(F, 2.8, 11.2, 6.8, 30, P, { fade: [0.1, 0.55], seams: true });
    out.push(S(G.solidOf([[1.4, 6.8], [12.4, 6.8], [12.4, 4.6], [17.6, 3.8]], F, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) }));
  } else if (bank.plug === "square") {
    out.push(S(k.slabOf({ x: face, y: ay - 8.6, w: 1.4, d: 17.2, r: 1.2 }, PIN_Z - 8.6, 17.2, P, 3), { tone: "hi", crease: "lo" }));
    const plug = { x: face + 1.4, y: ay - 7, w: 11, d: 14, r: 2 };
    const grooves = [face + 5, face + 8.4].map((x) => k.lineOnTop([x, ay - 7], [x, ay + 7], PIN_Z + 7, P)).join("");
    out.push(S(k.slabOf(plug, PIN_Z - 7, 14, P, 3, 0.5), { tone: "mid", inner: L(grooves, { tone: "faint" }) }));
    out.push(S(G.solidOf([[0, 4.6], [5.2, 3.8]], G.frameAlong([plug.x + plug.w, ay, PIN_Z], X), P), { tone: "mid" }));
  } else {
    out.push(S(G.prismOf(F, hexagon(8.8), 0, 1.4, P), { tone: "hi", crease: "lo" }));
    out.push(S(G.prismOf(F, hexagon(7.8), 1.4, 12.4, P), { tone: "mid" }));
    out.push(S(G.solidOf([[12.4, 4.6], [17.6, 3.8]], F, P), { tone: "mid" }));
  }
  return out.join("");
}

function adapters() {
  return BANKS.map((bank, index) => {
    const ay = ADAPTER_Y[index];
    return `<g data-part="adapter" data-bank="${bank.id}">
      ${guides(ay)}
      <g data-part="slide">${slide(ay)}</g>
      ${endBlock(ay)}
      ${pinClip(index, ay)}<g clip-path="url(#dp-pins-${index})"><g data-part="pins">${pins(ay)}</g></g>
      <g data-part="slide">${adapterBody(bank, ay)}</g>
    </g>`;
  }).join("");
}

const START = 1;
export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một máy đối soát có một ổ cắm chuẩn hai chân tròn và một màn hình số. Phía trước là xe trượt chở ba khối chuyển đổi; mỗi khối nhận phích cắm riêng của một ngân hàng (tròn, vuông, lục giác) ở mặt trước và kết thúc bằng cùng hai chân chuẩn ở mặt sau. Khi chọn một ngân hàng, xe trượt đưa khối của ngân hàng đó tới trước ổ cắm rồi đẩy chân cắm vào, và màn hình hiện số tiền đã chuẩn hoá.",
  body: [
    base(),
    railsAndBackStop(),
    meter(),
    `<g data-part="carriage" transform="${k.translateAlong(P, [0, STOPS[START], 0])}">${carriagePlate()}${adapters()}</g>`,
    `<g data-part="carriage-front" transform="${k.translateAlong(P, [0, STOPS[START], 0])}">${carriageFront()}</g>`,
    endStop(82),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const STOPS = ${JSON.stringify(STOPS)}, STROKE = ${STROKE}, CLEAR = ${STROKE - PIN_LEN - 0.5}, ALIGN = 0.3, SEATED = STROKE - 0.3;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const carriage = svg.querySelectorAll('[data-part="carriage"], [data-part="carriage-front"]');
const groups = [...svg.querySelectorAll('[data-part="adapter"]')].map((el) => ({
  moving: el.querySelectorAll('[data-part="slide"], [data-part="pins"]'),
  body: el.querySelector('[data-part="body"] > .iso-solid'),
}));
const digits = svg.querySelector('[data-part="display"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const converted = BANKS.map((bank) => ADAPT[bank.id](bank.raw));
let sel = ${START}, y = STOPS[sel], push = BANKS.map((_, i) => (i === sel ? STROKE : 0));
let frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0, shown = "";
const TOUR = 4.2;
const follow = (value, target, dt, tau, calm) => {
  if (calm) return target;
  const next = value + (target - value) * (1 - Math.exp(-dt / tau));
  return Math.abs(target - next) < 0.02 ? target : next;
};
function describe() {
  const bank = BANKS[sel];
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", "Ngân hàng " + bank.id + ": " + rawAmount(bank) + " được chuyển thành " + groupVND(converted[sel].amount) + " đồng");
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
const tourFrom = (index) => ((index - ${START} + BANKS.length) % BANKS.length) * TOUR;
function draw() {
  const move = translateAlong(P, [0, y, 0]);
  carriage.forEach((el) => el.setAttribute("transform", move));
  groups.forEach((group, i) => {
    const t = translateAlong(P, [-push[i], 0, 0]);
    group.moving.forEach((el) => el.setAttribute("transform", t));
  });
  const aligned = Math.abs(y - STOPS[sel]) < ALIGN;
  const engaged = aligned && push[sel] > SEATED;
  groups.forEach((group, i) => {
    const on = engaged && i === sel;
    group.body.toggleAttribute("data-lit", on);
    group.body.querySelector(".iso-edge").setAttribute("data-tone", on ? "lit" : "hi");
  });
  const bank = BANKS[sel];
  const text = engaged
    ? bank.id + " · " + rawAmount(bank) + " → " + groupVND(converted[sel].amount) + " ₫"
    : aligned && push[sel] > 0 ? "đang cắm " + bank.id : "đang chuyển sang " + bank.id;
  if (readout.textContent !== text) readout.textContent = text;
  const screen = engaged ? groupVND(converted[sel].amount) : "-------";
  if (screen !== shown) {
    shown = screen;
    digits.textContent = screen;
    digits.setAttribute("data-tone", engaged ? "hi" : "lo");
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    const next = (Math.floor(clock / TOUR) + ${START}) % BANKS.length;
    if (next !== sel) { sel = next; describe(); }
  }
  // The carriage may slide once every other adapter's pins have left their holes,
  // and an adapter pushes in once its pins line up with the holes.
  const clear = push.every((p, i) => i === sel || p < CLEAR);
  y = follow(y, clear ? STOPS[sel] : y, dt, 0.25, calm);
  const lined = Math.abs(y - STOPS[sel]) < ALIGN;
  push = push.map((p, i) => follow(p, i === sel && (lined || calm) ? STROKE : 0, dt, 0.18, calm));
  draw();
  const settled = !touring && y === STOPS[sel] && push.every((p, i) => p === (i === sel ? STROKE : 0));
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
  return BANKS.length - 1 - Math.floor(share * BANKS.length);
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = true; clock = tourFrom(sel); emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để chọn ngân hàng";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse") choose(pick(event), false); });
stage.addEventListener("pointerdown", (event) => choose(pick(event), event.pointerType !== "mouse"));
stage.addEventListener("keydown", (event) => {
  let to = null;
  // Bank A sits on the right of the drawing and C on the left, so the arrows follow the screen.
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = Math.max(0, sel - 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = Math.min(BANKS.length - 1, sel + 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = BANKS.length - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw();
`;

const first = BANKS[START];
const steps = BANKS.map((bank) => ({
  label: `Ngân hàng ${bank.id}`,
  short: bank.id,
  caption: `Ngân hàng ${bank.id} gửi <code>${bank.field}: ${rawAmount(bank)}</code>, ${bank.sent}. <code>Bank${bank.id}Adapter</code> ${bank.how}: <strong>${groupVND(ADAPT[bank.id](bank.raw).amount)} ₫</strong>.`,
}));
export const plate = withSteps(k.plateHtml({
  fig: "Fig 1",
  title: "Adapter",
  hint: "Rê chuột để chọn ngân hàng",
  readout: `${first.id} · ${rawAmount(first)} → ${groupVND(ADAPT[first.id](first.raw).amount)} ₫`,
  keys: [
    { mark: "lit", label: "Khối chuyển đổi đang cắm: adapter của ngân hàng được chọn" },
    { mark: "raised", label: "Phích cắm tròn, vuông, lục giác: dữ liệu riêng của ngân hàng A, B, C" },
  ],
  caption:
    "Máy đối soát chỉ có một ổ cắm chuẩn và không bao giờ thay đổi. Mỗi ngân hàng gửi số tiền theo kiểu riêng (số nguyên, chuỗi có dấu chấm, chuỗi thập phân), nên mỗi ngân hàng có một khối chuyển đổi riêng: mặt trước khớp phích của ngân hàng, mặt sau luôn là hai chân chuẩn. Thêm ngân hàng mới chỉ là thêm một khối.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Adapter: phím mũi tên để chọn ngân hàng A, B hoặc C" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước: chọn ngân hàng", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-digits{letter-spacing:.04em}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
