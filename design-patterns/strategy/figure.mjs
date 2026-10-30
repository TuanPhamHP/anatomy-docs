// The Strategy figure: a cam-follower pricing instrument. One keyed spindle and
// one spring-loaded follower (the context) never change; three cams (the
// strategies) share the same bore and keyway but each has its own profile.
// Selecting a rule retracts the follower, lifts the mounted cam back to its post,
// drops the chosen cam onto the spindle, and turns the spindle to the value that
// cam's scale reads from the order. The follower rides the rim as it turns, so
// its lift, the dial and the counter show that rule's fee.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { CAM, camSvg, radiusOf, shaftSvg, turnFor } from "./cam.mjs";
import { FEE, FEE_MAX, ORDER, STRATEGIES, groupVND, quote, valueText } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 360;
const AZIMUTH = 40;
const RAD = Math.PI / 180;

// Posts: one per cam, on an arc beside the spindle, each with the same keyed shaft.
const POST_R = 63;
const POST_ANGLES = [120, 172, 224].map((a) => a * RAD);
const POSTS = POST_ANGLES.map((a) => [POST_R * Math.cos(a), POST_R * Math.sin(a)]);
const SEAT = 16; // a cam's bottom face when it sits on a collar
const STUB_TOP = SEAT + CAM.THICK + 2.6;
const MAX_R = CAM.R0 + CAM.LIFT;

// Pedestal (the context's body) with the spindle at the origin.
const PED = { x: -21, y: -21, w: 42, d: 42, r: 5 };
const PED_TOP = 12;

// Follower along -y at the cam's mid-height. `fr` is the radius its roller touches.
const AXIS_Z = SEAT + CAM.THICK / 2;
const ROLLER_R = 3.2;
const R_OUT = MAX_R + 2.2; // retracted, clear of every cam
const FORK_BACK = ROLLER_R + 3.8; // roller centre to the fork's back
const COLLAR_W = 1.8;
const ROD = 32;
const HOUSING = { x: -12, y: -82, w: 24, d: 34, r: 3 };
const HOUSING_TOP = 30;
const BOSS = [HOUSING.y + HOUSING.d, HOUSING.y + HOUSING.d + 3.2]; // the guide boss on the housing's +y face
const DIAL = { x: 0, y: HOUSING.y + 15.5, r: 9.6 };
// Dial sweep: 270° with the gap toward the viewer (kit angle 0 points along -y).
const DIAL_FROM = 175 * RAD;
const DIAL_SPAN = 270 * RAD;
const LIFTED = HOUSING_TOP + 3.4; // a travelling cam clears every other part

const PLATE = { x: -98, y: -90, w: 132, d: 177, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Fit the plate, the housing and every cam in the air above its post or the spindle.
const camBox = ([x, y]) => k.boxCorners({ x: x - MAX_R, y: y - MAX_R, w: MAX_R * 2, d: MAX_R * 2 }, 0, LIFTED + CAM.THICK);
const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...camBox([0, 0]), ...POSTS.flatMap(camBox), ...k.boxCorners(HOUSING, 0, HOUSING_TOP + 2)],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const Y = [0, 1, 0];
const Z = [0, 0, 1];
const NY = [0, -1, 0];
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

const RADII = STRATEGIES.map((s) => radiusOf(s, FEE[s.id], FEE_MAX));
const TURNS = STRATEGIES.map((s) => turnFor(s, ORDER[s.field]));

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // The order ticket under a clamp bar: the one order every cam prices.
  const ticket = { x: 8, y: 34, w: 22, d: 42, r: 1.5 };
  out.push(S(k.slabOf(ticket, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(ticket, 1.6), 0.8, P, 4), { tone: "faint" }));
  const rows = [[13, 30], [17.5, 22], [22, 26], [26.5, 16]].map(([x, w]) => k.lineOnTop([x, 43], [x, 43 + w], 0.8, P)).join("");
  out.push(L(rows, { tone: "lo", free: true }));
  out.push(S(k.slabOf({ x: 8.6, y: 34.6, w: 20.8, d: 4.4, r: 1 }, 0.8, 1.4, P, 3), { tone: "mid" }));
  out.push(D([at([11.2, 36.8, 2.2]), at([26.8, 36.8, 2.2])], { size: 0.4 }));
  // Spirit level on the right edge: the bench is set level before pricing.
  const level = { x: 20.4, y: -47, w: 6.6, d: 24, r: 2 };
  out.push(S(k.slabOf(level, 0, 2.6, P, 4, 0.4), { tone: "mid" }));
  const vial = { x: 22, y: -42, w: 3.4, d: 14, r: 1.7 };
  out.push(`<path class="dp-hole" d="${k.planOutline(vial, 2.6, P, 6)}"/>`, L(k.planOutline(vial, 2.6, P, 6), { tone: "lo" }));
  out.push(`<path class="dp-bubble" d="${k.planOutline({ x: 22.6, y: -36.8, w: 2.2, d: 4.2, r: 1.1 }, 2.6, P, 6)}"/>`);
  out.push(L([-37.8, -31.6].map((y) => k.lineOnTop([22, y], [25.4, y], 2.6, P)).join(""), { tone: "mid" }));
  out.push(D([at([23.7, -45.2, 2.6]), at([23.7, -24.8, 2.6])], { size: 0.4 }));
  // Label plate by the left corner.
  const label = { x: -92, y: 50, w: 14, d: 34, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-87, 22], [-84, 15], [-81, 19]].map(([x, w]) => k.lineOnTop([x, 56], [x, 56 + w], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 7, label.y + 2.6, 0.8]), at([label.x + 7, label.y + label.d - 2.6, 0.8])], { size: 0.4 }));
  return out.join("");
}

// A turned post: foot flange, column and the collar a cam sits on.
function post([x, y]) {
  // Stacked from the bottom up: each piece hides the top of the one below.
  const out = [S(k.cylinder(x, y, 8.8, 0, 1.8, P, 40, 0.4), { tone: "mid" })];
  out.push(S(k.cylinder(x, y, 6.2, 1.8, SEAT - 4.8, P, 36), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 7.4, SEAT - 3, 3, P, 36, 0.5), { tone: "mid" }));
  out.push(D([0, 1, 2, 3].map((i) => { const a = (i / 4) * Math.PI * 2 + 0.4; return at([x + 7.5 * Math.cos(a), y + 7.5 * Math.sin(a), 1.8]); }), { size: 0.4 }));
  out.push(L(k.ring(x, y, 4.6, SEAT, P, 28), { tone: "faint" }));
  return out.join("");
}

function pedestal() {
  const out = [];
  out.push(S(k.slabOf(PED, 0, PED_TOP, P, 6, 1.2), { tone: "mid", inner: L(k.sideSeam(PED, 3.2, P, 6), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PED, 3.5), PED_TOP, P, 6), { tone: "faint" }));
  out.push(D(k.corners(PED, 4.5).map(([x, y]) => at([x, y, PED_TOP])), { size: 0.5 }));
  out.push(L(k.corners(PED, 4.5).map(([x, y]) => k.ring(x, y, 1.6, PED_TOP, P, 14)).join(""), { tone: "lo" }));
  // Hand wheel on a worm shaft through the +y face: the context turns the spindle.
  const F = G.frameAlong([0, PED.y + PED.d, 6.4], Y);
  out.push(S(G.disc(0, 1.6, 3.2, F, P), { tone: "mid" }));
  const ribs = G.ribsOf(F, 2.4, 5.4, 5.6, 30, P, { fade: [0.1, 0.5], seams: true });
  out.push(S(G.solidOf([[1.6, 2.2], [2.2, 5.6], [5.6, 5.6], [6.2, 4.8]], F, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) }));
  out.push(L(G.circleOf(F, 6.2, 1.4, P, 20), { tone: "lo" }));
  out.push(S(G.solidOf([[6.2, 1.1], [8.8, 1.1], [9.4, 0.6]], G.frameAlong([3.4, PED.y + PED.d, 6.4 + 2.4], Y), P), { tone: "mid" }));
  // Spindle collar.
  out.push(S(k.cylinder(0, 0, 9.4, PED_TOP, 1, P, 40), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 8.4, PED_TOP + 1, SEAT - PED_TOP - 1, P, 40, 0.5), { tone: "mid" }));
  return out.join("");
}

// The follower is built retracted (roller touching radius R_OUT) and slid along y.
const XR = R_OUT + ROLLER_R; // roller centre distance from the spindle
const BACK = XR + FORK_BACK;

// The rod disappears into the guide boss: clip it to the near side of the boss's face plane.
function rodClip() {
  const p = at([0, BOSS[1] - 0.3, AXIS_Z]);
  const u = k.axisVector(P, [1, 0, 0]);
  const n = k.axisVector(P, [0, 1, 0]);
  const far = 400;
  const pts = [[p[0] - u[0] * far, p[1] - u[1] * far], [p[0] + u[0] * far, p[1] + u[1] * far], [p[0] + u[0] * far + n[0] * far, p[1] + u[1] * far + n[1] * far], [p[0] - u[0] * far + n[0] * far, p[1] - u[1] * far + n[1] * far]];
  return `<clipPath id="dp-rod" clipPathUnits="userSpaceOnUse"><path d="${k.pathOf(pts, true)}"/></clipPath>`;
}

function followerRod() {
  return S(G.solidOf([[0, 1.5], [ROD, 1.5]], G.frameAlong([0, -BACK - COLLAR_W, AXIS_Z], NY), P), { tone: "mid" });
}

const forkPlate = (z) => S(k.slabOf({ x: -3.6, y: -BACK, w: 7.2, d: BACK - XR + 3.6, r: 3.6 }, z, 1.1, P, 8, 0.3), { tone: "hi", crease: "lo" });
const UPPER_Z = SEAT + CAM.THICK + 0.7;

function followerHead() {
  const out = [];
  out.push(S(G.solidOf([[0, 2.9], [COLLAR_W, 2.9]], G.frameAlong([0, -BACK - COLLAR_W, AXIS_Z], Y), P), { tone: "mid" }));
  out.push(forkPlate(SEAT - 1.8));
  out.push(S(k.cylinder(0, -XR, ROLLER_R, SEAT - 0.7, CAM.THICK + 1.4, P, 36, 0.3), { tone: "hi", crease: "lo" }));
  return out.join("");
}

function followerTop() {
  return forkPlate(UPPER_Z) + D([at([0, -XR, UPPER_Z + 1.1])], { size: 0.55 }) + L(k.ring(0, -XR, 1.4, UPPER_Z + 1.1, P, 16), { tone: "lo" });
}

function housing() {
  const out = [];
  const seam = k.sideSeam(HOUSING, 5, P, 4);
  out.push(S(k.slabOf(HOUSING, 0, HOUSING_TOP, P, 4, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(D([[-8.5, HOUSING.y + 3.5], [8.5, HOUSING.y + 3.5], [-8.5, HOUSING.y + HOUSING.d - 3.5], [8.5, HOUSING.y + HOUSING.d - 3.5]].map(([x, y]) => at([x, y, HOUSING_TOP])), { size: 0.45 }));
  out.push(D([[-9, 3.5], [9, 3.5], [-9, HOUSING_TOP - 3.5], [9, HOUSING_TOP - 3.5]].map(([x, z]) => at([x, HOUSING.y + HOUSING.d, z])), { size: 0.45 }));
  // Guide boss on the +y face: the rod runs through it.
  const BF = G.frameAlong([0, BOSS[0], AXIS_Z], Y);
  out.push(S(G.solidOf([[0, 4.6], [BOSS[1] - BOSS[0] - 0.6, 4.6], [BOSS[1] - BOSS[0], 4]], BF, P), { tone: "mid" }));
  out.push(`<path class="dp-hole" d="${G.circleOf(BF, BOSS[1] - BOSS[0], 1.9, P, 24)}"/>`);
  out.push(L(G.circleOf(BF, BOSS[1] - BOSS[0], 1.9, P, 24), { tone: "lo" }));
  out.push(D([[-2.5, AXIS_Z + 2.5], [2.5, AXIS_Z - 2.5]].map(([x, z]) => at([x, BOSS[1], z])), { size: 0.35 }));
  // Counter window and nameplate on the +x face, drawn in that face's own plane.
  const face = HOUSING.x + HOUSING.w;
  const WIN = { y: HOUSING.y + HOUSING.d - 4, z: 25, w: 26, h: 9.4 };
  const M = k.sideMatrix([face, WIN.y], WIN.z, P, "right");
  out.push(`<g transform="${M}">
    <clipPath id="dp-win"><path d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/>
    <g clip-path="url(#dp-win)"><path class="dp-wall" d="M0 0H${WIN.w}V1H1V${WIN.h}H0Z"/>
    <text class="iso-face-text dp-digits" data-part="counter" data-tone="hi" x="${WIN.w - 2.2}" y="7" font-size="6" text-anchor="end">${groupVND(quote(STRATEGIES[START]))}</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, WIN.w, WIN.h, 1.2)}"/>
  </g>`);
  const N = k.sideMatrix([face, WIN.y], 12, P, "right");
  const lines = [[3, 3, 12], [3, 5.2, 8], [3, 7.4, 10]].map(([x, y, w]) => `M${x} ${y}H${x + w}`).join("");
  out.push(`<g transform="${N}"><path class="dp-plate" d="${rrect(0, 0, 18, 10, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 18, 10, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`);
  out.push(D([at([face, WIN.y - 15.8, 12 - 2.6]), at([face, WIN.y - 15.8, 12 - 7.4])], { size: 0.4 }));
  // Zero-adjust knob on the +x face.
  const KF = G.frameAlong([face, HOUSING.y + 6.6, 7], [1, 0, 0]);
  out.push(S(G.disc(0, 1, 3.6, KF, P), { tone: "lo" }));
  const kr = G.ribsOf(KF, 1.4, 4.2, 2.8, 20, P, { fade: [0.1, 0.5], seams: true });
  out.push(S(G.solidOf([[1, 2.8], [4.2, 2.8], [4.6, 2.3]], KF, P), { tone: "mid", inner: k.fadedSvg(kr, { tone: "lo" }) }));
  out.push(dial());
  return out.join("");
}

function dial() {
  const { x, y, r } = DIAL;
  const out = [];
  out.push(S(k.cylinder(x, y, r + 1.4, HOUSING_TOP, 1.6, P, 48, 0.3), { tone: "mid" }));
  out.push(`<path class="dp-dial" d="${k.ring(x, y, r, HOUSING_TOP + 1.6, P, 48)}"/>`);
  out.push(L(k.ring(x, y, r, HOUSING_TOP + 1.6, P, 48), { tone: "lo" }));
  const ticks = k.radialTicks(x, y, r - 0.6, 16, 4, HOUSING_TOP + 1.6, [1.2, 2.4], P, DIAL_FROM, DIAL_SPAN);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.radialTicks(x, y, r - 0.6, 16, 16, HOUSING_TOP + 1.6, [1.2, 3.2], P, DIAL_FROM, 0).major, { tone: "hi" }));
  out.push(`<path class="iso-line" data-tone="hi" data-free="start" data-part="needle" d="${needle(quote(STRATEGIES[START]))}"/>`);
  out.push(S(k.cylinder(x, y, 1.1, HOUSING_TOP + 1.6, 0.8, P, 16), { tone: "hi", crease: "none" }));
  return out.join("");
}

function needle(fee) {
  const a = DIAL_FROM + (fee / FEE_MAX) * DIAL_SPAN;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const { x, y, r } = DIAL;
  return k.lineOnTop([x - dx * 2.2, y - dy * 2.2], [x + dx * (r - 1.6), y + dy * (r - 1.6)], HOUSING_TOP + 1.9, P);
}

const START = 0;

function camAt(i, [x, y, z], theta, lit) {
  return `<g data-part="cam" data-cam="${i}" transform="${k.translateAlong(P, [x, y, z])}">${camSvg(k, P, STRATEGIES[i], RADII[i], theta, { lit })}</g>`;
}

// One post with its cam (when the cam is home) and the shaft stub above it.
const postSlot = (j) =>
  `${post(POSTS[j])}<g data-hold="post-${j}">${j === START ? "" : camAt(j, [...POSTS[j], SEAT], CAM.READ, false)}</g><g data-stub="post-${j}">${shaftSvg(k, P, POSTS[j][0], POSTS[j][1], j === START ? SEAT : SEAT + CAM.THICK, STUB_TOP)}</g>`;
const viewOf = ([x, y]) => x * Math.cos(AZIMUTH * RAD) + y * Math.sin(AZIMUTH * RAD);
// Posts behind the pedestal are drawn before it; a post in front of the spindle after it.
const backPosts = POSTS.map((p, j) => [viewOf(p), j]).filter(([v]) => v < 0).sort((a, b) => a[0] - b[0]).map(([, j]) => postSlot(j));
const frontPosts = POSTS.map((p, j) => [viewOf(p), j]).filter(([v]) => v >= 0).sort((a, b) => a[0] - b[0]).map(([, j]) => postSlot(j));
const contact0 = RADII[START](CAM.READ - TURNS[START]);
const slideOf = (fr) => k.translateAlong(P, [0, R_OUT - fr, 0]);

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một máy tính phí giao hàng kiểu cam. Giữa bệ là một trục đứng có then; phía sau là cần đọc có lò xo, đầu cần là con lăn tì vào mép cam, nối với đồng hồ và ô số trên hộp. Bên trái có ba trụ, mỗi trụ giữ một cam: cùng lỗ trục và rãnh then nhưng biên dạng khác nhau, mỗi cam là một cách tính phí. Khi chọn cách tính, cần đọc lùi ra, cam đang lắp về trụ của nó, cam được chọn hạ xuống trục, trục quay tới giá trị đơn hàng ghi trên cam đó và cần đọc chỉ ra phí.",
  body: [
    base(),
    ...backPosts,
    housing(),
    pedestal(),
    `<path class="iso-line" data-tone="mid" data-part="spring-back" d=""/>`,
    rodClip(),
    `<g clip-path="url(#dp-rod)"><g data-part="follower" transform="${slideOf(contact0)}">${followerRod()}</g></g>`,
    `<path class="iso-line" data-tone="mid" data-part="spring-front" d=""/>`,
    `<g data-part="follower" transform="${slideOf(contact0)}">${followerHead()}</g>`,
    `<g data-hold="spindle">${camAt(START, [0, 0, SEAT], TURNS[START], true)}</g><g data-stub="spindle">${shaftSvg(k, P, 0, 0, SEAT + CAM.THICK, STUB_TOP, TURNS[START])}</g>`,
    `<g data-part="follower" transform="${slideOf(contact0)}">${followerTop()}</g>`,
    ...frontPosts,
    `<g data-hold="high"></g>`,
  ],
});

const strip = (file) => readFileSync(join(HERE, file), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");

export const live = `
${strip("model.mjs")}
${strip("cam.mjs")}
const P = ${JSON.stringify(P)};
const K = { extrude, solidSvg, lineSvg, onTop, iso, dotsSvg, topMatrix, pathOf, towardViewer, cameraOf };
const POSTS = ${JSON.stringify(POSTS)}, SEAT = ${SEAT}, STUB_TOP = ${STUB_TOP}, LIFTED = ${LIFTED};
const R_OUT = ${R_OUT}, ROLLER_R = ${ROLLER_R}, FORK_BACK = ${FORK_BACK}, COLLAR_W = ${COLLAR_W}, BOSS_Y = ${BOSS[1]}, AXIS_Z = ${AXIS_Z};
const DIAL = ${JSON.stringify(DIAL)}, DIAL_FROM = ${DIAL_FROM}, DIAL_SPAN = ${DIAL_SPAN}, DIAL_Z = ${HOUSING_TOP + 1.9};
const START = ${START};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const camEls = STRATEGIES.map((_, i) => svg.querySelector('[data-cam="' + i + '"]'));
const holds = Object.fromEntries([...svg.querySelectorAll("[data-hold]")].map((el) => [el.dataset.hold, el]));
const stubEls = [...POSTS.map((_, j) => svg.querySelector('[data-stub="post-' + j + '"]')), svg.querySelector('[data-stub="spindle"]')];
const followerEls = svg.querySelectorAll('[data-part="follower"]');
const springBack = svg.querySelector('[data-part="spring-back"]');
const springFront = svg.querySelector('[data-part="spring-front"]');
const needleEl = svg.querySelector('[data-part="needle"]');
const counter = svg.querySelector('[data-part="counter"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const radii = STRATEGIES.map((s) => radiusOf(s, FEE[s.id], FEE_MAX));
const turns = STRATEGIES.map((s) => turnFor(s, ORDER[s.field]));
const fees = STRATEGIES.map((s) => quote(s));
const SPINDLE = [0, 0];
const cams = STRATEGIES.map((_, i) => (i === START ? { x: 0, y: 0, z: SEAT } : { x: POSTS[i][0], y: POSTS[i][1], z: SEAT }));
const drawnCam = cams.map(() => "");
const drawnStub = stubEls.map(() => "");
let sel = START, theta = turns[START], fr = radii[START](CAM.READ - theta), dialFee = fees[START];
let frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0, shownText = "", shownCount = "";
const TOUR = 8.5;
const follow = (value, target, dt, tau) => {
  const next = value + (target - value) * (1 - Math.exp(-dt / tau));
  return Math.abs(target - next) < 0.02 ? target : next;
};
// Eased, but never faster than \`rate\` per second: the spindle turns at a steady pace.
const toward = (value, target, dt, rate, tau, eps = 0.01) => {
  let step = (target - value) * (1 - Math.exp(-dt / tau));
  if (Math.abs(step) > rate * dt) step = Math.sign(step) * rate * dt;
  const next = value + step;
  return Math.abs(target - next) < eps ? target : next;
};
const near = (c, [x, y]) => Math.abs(c.x - x) < 0.05 && Math.abs(c.y - y) < 0.05;
const onSpindle = (c) => near(c, SPINDLE);
const seated = (c) => Math.abs(c.z - SEAT) < 0.05;
const lifted = (c) => c.z > LIFTED - 0.5;
const mounted = () => cams.findIndex((c) => onSpindle(c) && seated(c));
const rimAt = (m) => radii[m](CAM.READ - theta);
function describe() {
  const s = STRATEGIES[sel];
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", s.name + ": " + valueText(s) + " cho phí " + groupVND(fees[sel]) + " đồng");
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
const tourFrom = (index) => ((index - START + STRATEGIES.length) % STRATEGIES.length) * TOUR;

// One frame of the machine, in this order: retract the follower, turn the cam
// back to rest, lift it home, bring the chosen cam, let the roller down onto its
// rim, then turn the spindle to the order's value while the roller rides the rim.
function step(dt, calm) {
  if (calm) {
    cams.forEach((c, i) => { const [x, y] = i === sel ? SPINDLE : POSTS[i]; c.x = x; c.y = y; c.z = SEAT; });
    theta = turns[sel];
    fr = rimAt(sel);
    return;
  }
  const outgoing = cams.findIndex((c, i) => i !== sel && onSpindle(c) && seated(c));
  const retracted = fr > R_OUT - 0.05;
  const atRest = Math.abs(theta - CAM.READ) < 0.002;
  if (outgoing >= 0) {
    if (!retracted) fr = follow(fr, R_OUT, dt, 0.07);
    else if (!atRest) theta = toward(theta, CAM.READ, dt, 6, 0.14);
  }
  cams.forEach((c, i) => {
    const goal = i === sel ? SPINDLE : POSTS[i];
    const others = cams.filter((_, j) => j !== i);
    if (near(c, goal)) {
      // Only lower onto the spindle once the follower is clear.
      if (i !== sel || retracted || seated(c)) c.z = follow(c.z, SEAT, dt, 0.075);
      return;
    }
    if (!lifted(c)) {
      // Leave the spindle once the follower is out and the cam is back at rest;
      // leave a post toward the spindle once no other cam sits on the spindle.
      const free = onSpindle(c) ? retracted && atRest : !others.some((o) => onSpindle(o) && !lifted(o));
      if (free) c.z = follow(c.z, LIFTED, dt, 0.075);
      return;
    }
    // Travel at height. A cam heading for the spindle waits until no other cam is in the air.
    if (i === sel && others.some((o) => lifted(o))) return;
    // Straight to the goal at a steady pace, easing in at the end.
    const dx = goal[0] - c.x, dy = goal[1] - c.y, dist = Math.hypot(dx, dy);
    const next = toward(dist, 0, dt, 190, 0.1, 0.02);
    c.x = next === 0 ? goal[0] : goal[0] - (dx / dist) * next;
    c.y = next === 0 ? goal[1] : goal[1] - (dy / dist) * next;
  });
  const m = mounted();
  if (m === sel) {
    // The spring pushes the roller in until it meets the rim; the rim pushes it back out.
    // The spindle turns once the roller has come down to the rim; at a drop the
    // roller falls after it with the spring and the turn carries on.
    const rim = rimAt(m);
    if (fr - rim < 0.6) theta = toward(theta, turns[sel], dt, 2.6, 0.18);
    fr = Math.max(rimAt(m), follow(fr, rimAt(m), dt, 0.045));
  }
}

function needlePath(fee) {
  const a = DIAL_FROM + (fee / FEE_MAX) * DIAL_SPAN;
  const dx = Math.sin(a), dy = -Math.cos(a);
  return onTop([[DIAL.x - dx * 2.2, DIAL.y - dy * 2.2], [DIAL.x + dx * (DIAL.r - 1.6), DIAL.y + dy * (DIAL.r - 1.6)]], DIAL_Z, P);
}

function draw(dt, calm) {
  const m = mounted();
  // Touching: the roller rides this cam (it may hang a moment above a drop).
  const engaged = m === sel && fr - rimAt(m) < 0.6;
  const settled = engaged && theta === turns[sel] && fr === rimAt(m);
  cams.forEach((c, i) => {
    const el = camEls[i];
    el.setAttribute("transform", translateAlong(P, [c.x, c.y, c.z]));
    const turn = onSpindle(c) ? theta : CAM.READ;
    const lit = i === m && engaged;
    const key = turn.toFixed(4) + (lit ? "L" : "");
    if (drawnCam[i] !== key) { drawnCam[i] = key; el.innerHTML = camSvg(K, P, STRATEGIES[i], radii[i], turn, { lit }); }
    // A cam above the shaft stubs travels above every other part, so it is drawn last.
    const layer = c.z >= STUB_TOP ? "high" : onSpindle(c) ? "spindle" : "post-" + POSTS.findIndex((p) => near(c, p));
    const target = holds[layer];
    if (target && el.parentNode !== target) target.appendChild(el);
  });
  stubEls.forEach((el, j) => {
    const spot = j < POSTS.length ? POSTS[j] : SPINDLE;
    const low = cams.find((c) => near(c, spot) && c.z < STUB_TOP);
    const bottom = low ? Math.max(SEAT, low.z + CAM.THICK) : SEAT;
    const turn = j === POSTS.length ? theta : CAM.READ;
    const key = bottom.toFixed(2) + "/" + turn.toFixed(4);
    if (drawnStub[j] !== key) { drawnStub[j] = key; el.innerHTML = shaftSvg(K, P, spot[0], spot[1], bottom, STUB_TOP, turn); }
  });
  // Follower: slide the head, stretch the spring, show the lift on the dial.
  const slide = translateAlong(P, [0, R_OUT - fr, 0]);
  followerEls.forEach((el) => el.setAttribute("transform", slide));
  const coilPaths = coil(-(fr + ROLLER_R + FORK_BACK + COLLAR_W), BOSS_Y, [0, AXIS_Z], 2.5, 7, "y", P, 14);
  springBack.setAttribute("d", coilPaths.back);
  springFront.setAttribute("d", coilPaths.front);
  const reading = engaged ? Math.max(0, Math.min(1, (fr - CAM.R0) / CAM.LIFT)) * FEE_MAX : 0;
  dialFee = calm ? reading : follow(dialFee, reading, dt, 0.08);
  needleEl.setAttribute("d", needlePath(dialFee));
  const s = STRATEGIES[sel];
  const count = settled ? groupVND(fees[sel]) : "------";
  if (count !== shownCount) { shownCount = count; counter.textContent = count; counter.setAttribute("data-tone", settled ? "hi" : "lo"); }
  const text = settled ? s.short + " · " + valueText(s) + " → " + groupVND(fees[sel]) + " ₫" : m === sel ? "đang đọc " + valueText(s) : "đang lắp cam " + s.short.toLowerCase();
  if (text !== shownText) { shownText = text; readout.textContent = text; }
  return settled && dialFee === reading;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    const next = (Math.floor(clock / TOUR) + START) % STRATEGIES.length;
    if (next !== sel) { sel = next; describe(); }
  }
  step(dt, calm);
  const settled = draw(dt, calm);
  const placed = cams.every((c, i) => near(c, i === sel ? SPINDLE : POSTS[i]) && seated(c));
  frame = visible && !(settled && placed && !touring) ? requestAnimationFrame(tick) : 0;
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
  return Math.floor(share * STRATEGIES.length);
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); touring = true; clock = tourFrom(sel); emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để chọn cách tính phí";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse") choose(pick(event), false); });
stage.addEventListener("pointerdown", (event) => choose(pick(event), event.pointerType !== "mouse"));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = Math.min(STRATEGIES.length - 1, sel + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = Math.max(0, sel - 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = STRATEGIES.length - 1;
  if (to === null) return;
  event.preventDefault();
  choose(to, true);
});
describe();
draw(0, true);
`;

const first = STRATEGIES[START];
const reads = { kg: "cân nặng", km: "quãng đường", "₫": "tiền hàng" };
const steps = STRATEGIES.map((s) => ({
  label: s.name,
  short: s.short,
  caption: `<code>${s.cls}</code> đọc ${reads[s.unit]} <code>${valueText(s)}</code>: ${s.rule}. Phí: <strong>${groupVND(quote(s))} ₫</strong>.`,
}));
export const plate = withSteps(k.plateHtml({
  fig: "Fig 2",
  title: "Strategy",
  hint: "Rê chuột để chọn cách tính phí",
  readout: `${first.short} · ${valueText(first)} → ${groupVND(quote(first))} ₫`,
  keys: [
    { mark: "lit", label: "Cam đang lắp trên trục: cách tính phí đang dùng" },
    { mark: "raised", label: "Cam trên trụ: các cách tính khác, cùng lỗ trục và rãnh then" },
  ],
  caption:
    "Máy chỉ có một trục có then và một cần đọc, và hai thứ đó không bao giờ đổi. Mỗi cách tính phí là một cam: lỗ trục và rãnh then giống hệt nhau, chỉ có biên dạng là khác. Lắp cam nào thì trục quay tới giá trị của đơn hàng mà cam đó đọc (3,5 kg, 12 km hay 450.000 ₫); con lăn tì lên mép cam, nên mép cam nhô ra bao nhiêu thì phí bấy nhiêu. Thêm một cách tính mới chỉ là tiện thêm một cam.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Strategy: phím mũi tên để chọn cách tính phí" aria-valuemin="1" aria-valuemax="${STRATEGIES.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước: chọn cách tính phí", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-dial{fill:var(--anatomy-top)}
.dp-bubble{fill:var(--anatomy-top);stroke:var(--anatomy-lo);stroke-width:.5}
.dp-digits{letter-spacing:.04em}
.dp-unit{letter-spacing:.06em}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
