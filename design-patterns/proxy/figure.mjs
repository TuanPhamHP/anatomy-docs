// The Proxy figure: a heavy archive vault and, in front of it, a small service
// hatch. Both have the same mouth and the same lifting door, so a reader at the
// counter can't tell from the opening which one is serving them: one interface.
// The hatch is the proxy. It checks for the key before anything else: without it
// the refusal flag rises and the vault never moves. On the first read with the
// key, the hatch is empty, so the vault's wheel spins, its door lifts and the
// shuttle crawls out with the report into the hatch (the load counter turns to
// 1). Every later read is served straight from the hatch while the vault stays
// shut. The motion is one timeline (timeline.mjs); the numbers come from model.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { REPORT, groupDots, play, secondsText } from "./model.mjs";
import { REST, SHUTTLE_AT, pose } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 380;
const AZIMUTH = 58;

const PLATE = { x: -140, y: -50, w: 268, d: 100, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Track: two rails on ties, from inside the vault to the end stop at the counter.
const RAIL_Y = [-8, 8];
const RAIL_X = [-116, 80];
const TIE_H = 1;
const RAIL_TOP = 3.5;

// The vault (real subject), its mouth on the +x face and the door that lifts in two guides.
const VAULT = { x: -128, y: -40, w: 68, d: 80, r: 4 };
const VAULT_TOP = 74;
const VAULT_FACE = VAULT.x + VAULT.w;
const MOUTH = { y: 14, z: 24 }; // half-width and height of both openings
const DOOR = { w: 1.6, half: 15.5, z0: 0.5, z1: 25.5, lift: 25.5 };
const GUIDE_TOP = 52;
const WHEEL = [-103, 37];
const WHEEL_R = 11.4;

// The hatch (proxy): two end walls with the same mouth, a back panel, a front window, a roof.
const HATCH = { x0: -28, x1: 22, y0: -30, y1: 30, top: 50 };
const WALL = 8;
const HATCH_FACE = HATCH.x1;
const KEY_Z = 43;
const KEY_REST_X = -12;
const KEY_LOCK_X = 8;
const KEY_FACE = HATCH.y1 + 1.5;

// The client counter at the end of the track.
const STAND = { x: 88, y: -24, w: 28, d: 48, r: 3 };
const DESK = { x: 85, y: -27, w: 34, d: 54, r: 2.5 };
const DESK_Z = [20, 23];
const BELL = [101, 9];

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners(VAULT, 0, VAULT_TOP + 6),
    ...k.boxCorners({ x: -38, y: -32, w: 56, d: 64, r: 2 }, 0, 70),
  ],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const Y = [0, 1, 0];
const Xa = [1, 0, 0];
const slab = (plan, z0, z1, steps = 3, bevel = 0) => k.slabOf(plan, z0, z1 - z0, P, steps, bevel);
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
// A closed polygon of world points, projected.
const poly = (points) => `M${points.map((p) => at(p).map((v) => v.toFixed(2)).join(" ")).join("L")}Z`;
const hull = (points) => screenHull(points.map(at));
function screenHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return `M${[...lower.slice(0, -1), ...upper.slice(0, -1)].map((p) => p.map((v) => v.toFixed(2)).join(" ")).join("L")}Z`;
}
const loop = (points) => `M${points.map((p) => p.map((v) => v.toFixed(2)).join(" ")).join("L")}Z`;
const circlePoints = (F, s, r, n = 48) => Array.from({ length: n }, (_, j) => at(G.pointOf(F, s, r, (j / n) * 2 * Math.PI)));

// An open ring (a handwheel rim) drawn like a solid: side band, front face, edges,
// with the hole left unfilled so the spokes and the face behind show through it.
function rimSvg(F, s0, s1, rIn, rOut) {
  const hole = loop(circlePoints(F, s1, rIn).reverse());
  const outline = screenHull([...circlePoints(F, s0, rOut), ...circlePoints(F, s1, rOut)]);
  const face = loop(circlePoints(F, s1, rOut));
  return `<g class="iso-solid"><path class="iso-fill" fill-rule="evenodd" d="${outline}${hole}"/><path class="iso-shade" data-shade="1" fill-rule="evenodd" d="${outline}${hole}"/><path class="iso-top" fill-rule="evenodd" d="${face}${hole}"/><path class="iso-line iso-crease" data-tone="faint" d="${face}"/><path class="iso-line" data-tone="lo" d="${hole}"/><path class="iso-line iso-edge" data-tone="mid" d="${outline}"/></g>`;
}

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 22).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate in front of the hatch.
  const label = { x: -24, y: 37, w: 34, d: 8, r: 1.4 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-19, 39.6, 20], [-19, 41.6, 14], [-19, 43.6, 17]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 4, 0.8]), at([label.x + label.w - 2.4, label.y + 4, 0.8])], { size: 0.4 }));
  return out.join("");
}

function track() {
  const out = [];
  for (const x of [-44, 32, 48, 64, 76]) {
    out.push(S(slab({ x: x - 2, y: -13, w: 4, d: 26, r: 0.8 }, 0, TIE_H, 3), { tone: "lo", crease: "none" }));
  }
  for (const y of RAIL_Y) {
    out.push(S(slab({ x: RAIL_X[0], y: y - 1.5, w: RAIL_X[1] - RAIL_X[0], d: 3, r: 0.8 }, TIE_H, RAIL_TOP, 3, 0.3), { tone: "mid" }));
  }
  // Cable trunking on the floor from the hatch to the vault: the hatch's line to the real report.
  const trunk = { x: VAULT_FACE, y: -27, w: HATCH.x0 - VAULT_FACE, d: 4, r: 0.6 };
  out.push(S(slab(trunk, 0, 2.4, 2, 0.3), { tone: "mid" }));
  for (const x of [VAULT_FACE + 9, HATCH.x0 - 9]) {
    out.push(S(slab({ x: x - 1.5, y: -28.2, w: 3, d: 6.4, r: 0.5 }, 0, 3, 2), { tone: "mid" }));
    out.push(D([at([x, -27.6, 3]), at([x, -21.4, 3])], { size: 0.35 }));
  }
  // Rail screws on the ties that show.
  const dots = [];
  for (const x of [-44, 32, 48, 64, 76]) for (const y of RAIL_Y) dots.push(at([x, y, RAIL_TOP]));
  out.push(D(dots, { size: 0.4 }));
  return out.join("");
}

// The mouth both doorways share: two jambs and a header around a 28 × 24 opening.
function jamb(face, side) {
  const y = side < 0 ? -MOUTH.y - 4 : MOUTH.y;
  return S(slab({ x: face, y, w: 2, d: 4, r: 0.6 }, 0, MOUTH.z + 4, 2), { tone: "mid" });
}
const header = (face) => S(slab({ x: face, y: -MOUTH.y - 4, w: 2, d: 2 * MOUTH.y + 8, r: 0.6 }, MOUTH.z, MOUTH.z + 4, 2), { tone: "mid" });
function guide(face, side) {
  const y = side < 0 ? -DOOR.half - 3.5 : DOOR.half;
  return S(slab({ x: face + 2, y, w: 2.4, d: 3.5, r: 0.6 }, 0, GUIDE_TOP, 2), { tone: "mid" })
    + D([at([face + 4.4, y + 1.75, 6]), at([face + 4.4, y + 1.75, GUIDE_TOP - 6])], { size: 0.4 });
}
function guideCap(face) {
  return S(slab({ x: face + 2, y: -DOOR.half - 3.5, w: 2.4, d: 2 * DOOR.half + 7, r: 0.6 }, GUIDE_TOP, GUIDE_TOP + 3, 2, 0.3), { tone: "mid" })
    + D([at([face + 4.4, -DOOR.half - 1.75, GUIDE_TOP + 3]), at([face + 4.4, DOOR.half + 1.75, GUIDE_TOP + 3])], { size: 0.4 });
}
// The lifting door itself, the same on the vault and on the hatch.
function door(face) {
  const x = face + 2;
  const plan = { x, y: -DOOR.half, w: DOOR.w, d: 2 * DOOR.half, r: 0.6 };
  const ribs = [8, 13, 18].map((z) => k.segment([x + DOOR.w, -DOOR.half, z], [x + DOOR.w, DOOR.half, z], P)).join("");
  return S(slab(plan, DOOR.z0, DOOR.z1, 2), { tone: "mid", inner: L(ribs, { tone: "lo" }) })
    + S(slab({ x: x + DOOR.w, y: -5, w: 1.4, d: 10, r: 0.6 }, 20.5, 22.5, 2), { tone: "mid" })
    + D([at([x + DOOR.w, -DOOR.half + 1.6, 3]), at([x + DOOR.w, DOOR.half - 1.6, 3])], { size: 0.4 });
}

function vault() {
  const out = [];
  const seamLow = k.sideSeam(VAULT, 6, P, 4);
  const seamHigh = k.sideSeam(VAULT, 66, P, 4);
  out.push(S(k.slabOf(VAULT, 0, VAULT_TOP, P, 4, 1.6), { tone: "mid", inner: L(seamLow + seamHigh, { tone: "faint" }) }));
  // Top: a lid groove, corner bolts and two lifting lugs.
  out.push(L(k.planOutline(k.insetPlan(VAULT, 9), VAULT_TOP, P, 4), { tone: "faint" }));
  out.push(D(k.corners(VAULT, 5).map(([x, y]) => at([x, y, VAULT_TOP])), { size: 0.55 }));
  out.push(L(k.corners(VAULT, 5).map(([x, y]) => k.ring(x, y, 1.6, VAULT_TOP, P, 14)).join(""), { tone: "lo" }));
  for (const x of [-114, -74]) {
    out.push(S(slab({ x: x - 4, y: -2, w: 8, d: 4, r: 1 }, VAULT_TOP, VAULT_TOP + 1.2, 3), { tone: "lo" }));
    out.push(S(slab({ x: x - 2.5, y: -1, w: 5, d: 2, r: 0.8 }, VAULT_TOP + 1.2, VAULT_TOP + 5.5, 3), { tone: "mid" }));
    out.push(L(k.sideRing([x, 1, VAULT_TOP + 3.6], 1.1, "y", P), { tone: "lo" }));
  }
  out.push(frontFace());
  // The mouth on the +x face: a dark opening, the far jamb, the header and the far guide.
  const F = VAULT_FACE;
  const mouth = poly([[F, -MOUTH.y, 0], [F, MOUTH.y, 0], [F, MOUTH.y, MOUTH.z], [F, -MOUTH.y, MOUTH.z]]);
  out.push(`<path class="dp-dark" d="${mouth}"/>`);
  // The rails run on into the dark, seen through the mouth.
  const rails = RAIL_Y.map((y) => S(slab({ x: F - 18, y: y - 1.5, w: 18, d: 3, r: 0.8 }, TIE_H, RAIL_TOP, 3), { tone: "lo" })).join("");
  out.push(`<clipPath id="dp-mouth"><path d="${mouth}"/></clipPath><g clip-path="url(#dp-mouth)" opacity=".55">${rails}</g>`);
  out.push(L(k.segment([F, -MOUTH.y, MOUTH.z], [F, MOUTH.y, MOUTH.z], P), { tone: "lo" }));
  out.push(jamb(F, -1), header(F), guide(F, -1));
  // Inspection plate on the +x face, beside the mouth.
  const M = k.sideMatrix([F, -22], 64, P, "right");
  out.push(`<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 14, 8, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 14, 8, 1)}"/></g>`);
  out.push(D([at([F, -23.6, 62.4]), at([F, -34.4, 62.4]), at([F, -23.6, 57.6]), at([F, -34.4, 57.6])], { size: 0.4 }));
  return out.join("");
}

// The +y face of the vault: a safe door with hinges, a combination dial and the
// spoked wheel, plus the load counter and a name plate on the strip beside it.
function frontFace() {
  const out = [];
  const y = VAULT.y + VAULT.d;
  const M = k.sideMatrix([-122, y], 68, P, "left");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 38, 62, 2)}"/><path class="iso-line" data-tone="faint" d="${rrect(2.4, 2.4, 33.2, 57.2, 1.4)}"/></g>`);
  for (const [z0, z1] of [[12, 22], [48, 58]]) {
    out.push(S(k.cylinder(-122.6, y + 0.9, 1.5, z0, z1 - z0, P, 14), { tone: "mid" }));
    out.push(L(k.sideArc(-122.6, y + 0.9, 1.5, (z0 + z1) / 2, P, 14), { tone: "faint" }));
  }
  out.push(D([[-118.6, 9], [-87.4, 9], [-118.6, 65], [-87.4, 65]].map(([x, z]) => at([x, y, z])), { size: 0.45 }));
  // Combination dial.
  const Fd = G.frameAlong([-93, y, 58], Y);
  out.push(S(G.solidOf([[0, 4.2], [1.2, 4.2], [1.6, 3.4]], Fd, P), { tone: "mid" }));
  out.push(L(G.spokesOf(Fd, 1.6, 2.6, 3.4, 20, P), { tone: "lo" }));
  out.push(L(G.circleOf(Fd, 1.6, 1.2, P, 20), { tone: "lo" }));
  out.push(L(k.segment(G.pointOf(Fd, 1.6, 1.2, Math.PI / 2), G.pointOf(Fd, 1.6, 2.4, Math.PI / 2), P), { tone: "hi", free: "end" }));
  out.push(wheel());
  // Load counter: one number wheel behind a window, engraved "lần tải" under it.
  const C = k.sideMatrix([-79, y], 62, P, "left");
  out.push(`<g transform="${C}">
    <clipPath id="dp-count"><path d="${rrect(0, 0, 12, 9, 1.2)}"/></clipPath>
    <path class="dp-screen" d="${rrect(0, 0, 12, 9, 1.2)}"/>
    <g clip-path="url(#dp-count)"><path class="dp-wall" d="M0 0H12V0.9H0.9V9H0Z"/>
      <g data-part="digits" transform="translate(0 ${(-9 * at0.counter).toFixed(2)})"><text class="iso-face-text dp-digit" data-tone="hi" x="6" y="7" font-size="7" text-anchor="middle">0</text><text class="iso-face-text dp-digit" data-tone="hi" x="6" y="16" font-size="7" text-anchor="middle">1</text></g></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, 12, 9, 1.2)}"/>
    <path class="iso-line" data-tone="faint" d="M-1.5 4.5H0M12 4.5H13.5"/>
  </g>`);
  out.push(k.faceTextSvg(k.sideMatrix([-79, y], 50.2, P, "left"), "LẦN TẢI", { size: 2.4, tone: "lo" }));
  // Name plate.
  const N = k.sideMatrix([-81, y], 36, P, "left");
  const lines = [[2.6, 3, 11], [2.6, 5.2, 8], [2.6, 7.4, 10]].map(([x, yy, w]) => `M${x} ${yy}H${x + w}`).join("");
  out.push(`<g transform="${N}"><path class="dp-plate" d="${rrect(0, 0, 16, 10, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 16, 10, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="${lines}"/></g>`);
  out.push(D([at([-79.4, y, 31]), at([-66.6, y, 31])], { size: 0.4 }));
  return out.join("");
}

// The spoked wheel that unlocks the vault. Its spokes are pre-drawn at 16 angles
// over a third of a turn (three spokes repeat every 120°); the page shows one set.
const SPOKE_FRAMES = 16;
function wheel() {
  const y = VAULT.y + VAULT.d;
  const F = G.frameAlong([WHEEL[0], y, WHEEL[1]], Y);
  const out = [];
  out.push(S(G.solidOf([[0, 4.4], [1.0, 4.4], [1.5, 3.6]], F, P), { tone: "lo" }));
  const frames = [];
  for (let i = 0; i < SPOKE_FRAMES; i++) {
    const turn = (i / SPOKE_FRAMES) * ((2 * Math.PI) / 3);
    const spokes = [0, 1, 2].map((j) => {
      const angle = turn + (j * 2 * Math.PI) / 3 + Math.PI / 2;
      const dir = G.radialOf(F, angle);
      const Fs = G.frameAlong(G.pointOf(F, 2.8, 2.4, angle), dir);
      return { depth: k.depthOf(G.pointOf(F, 2.8, 6, angle), P), svg: S(G.solidOf([[0, 0.8], [WHEEL_R - 2.4 - 1.6, 0.8]], Fs, P), { tone: "mid" }) };
    }).sort((a, b) => a.depth - b.depth);
    frames.push(`<g data-frame="${i}"${i === 0 ? "" : ' display="none"'}>${spokes.map((s) => s.svg).join("")}</g>`);
  }
  out.push(`<g data-part="spokes">${frames.join("")}</g>`);
  out.push(rimSvg(F, 2.0, 3.6, WHEEL_R - 2.0, WHEEL_R));
  out.push(S(G.solidOf([[1.5, 2.8], [4.2, 2.8], [4.8, 1.8]], F, P), { tone: "mid" }));
  out.push(L(G.circleOf(F, 4.8, 0.9, P, 16), { tone: "lo" }));
  return out.join("");
}

// The vault's door, its near jamb and guide and the cap: painted after the shuttle,
// since they stand in front of it whenever it is in the mouth.
function vaultFront() {
  const F = VAULT_FACE;
  return `<g data-part="vault-door">${door(F)}</g>${jamb(F, 1)}${guide(F, 1)}${guideCap(F)}`;
}

// Hatch parts behind the shuttle's path.
function hatchBack() {
  const out = [];
  out.push(S(slab({ x: HATCH.x0 + WALL, y: HATCH.y0, w: HATCH.x1 - HATCH.x0 - 2 * WALL, d: 4, r: 0.6 }, 0, HATCH.top, 2), { tone: "mid" }));
  for (const x of [HATCH.x0, HATCH.x1 - WALL]) {
    out.push(S(slab({ x, y: HATCH.y0, w: WALL, d: -MOUTH.y - HATCH.y0, r: 1 }, 0, HATCH.top, 3, 0.5), { tone: "mid" }));
  }
  // The far jamb and guide of the hatch's mouth, on its +x face.
  out.push(jamb(HATCH_FACE, -1), guide(HATCH_FACE, -1));
  return out.join("");
}

// Hatch parts in front of the shuttle's path: lintels, near posts, the front
// panel with its window and counter ledge, the roof, the key fittings.
function hatchFront() {
  const out = [];
  for (const x of [HATCH.x0, HATCH.x1 - WALL]) {
    const plan = { x, y: -MOUTH.y, w: WALL, d: 2 * MOUTH.y, r: 0.6 };
    out.push(S(slab(plan, MOUTH.z, HATCH.top, 2), { tone: "mid" }));
  }
  out.push(S(slab({ x: HATCH.x0, y: MOUTH.y, w: WALL, d: HATCH.y1 - MOUTH.y, r: 1 }, 0, HATCH.top, 3, 0.5), { tone: "mid" }));
  const panel = { x: HATCH.x0 + WALL, y: HATCH.y1 - 4, w: HATCH.x1 - HATCH.x0 - 2 * WALL, d: 4, r: 0.4 };
  // The inside is in shade: everything seen through the window gets a light wash.
  out.push(`<path class="dp-inside" d="${poly([[panel.x + 4, HATCH.y1, 12], [panel.x + panel.w - 4, HATCH.y1, 12], [panel.x + panel.w - 4, HATCH.y1, 34], [panel.x + 4, HATCH.y1, 34]])}"/>`);
  // A wall with a window in it: sill, head and two stiles.
  out.push(S(slab(panel, 0, 12, 2), { tone: "mid" }));
  out.push(S(slab({ ...panel, w: 4 }, 12, 34, 2), { tone: "mid" }));
  out.push(S(slab({ ...panel, x: panel.x + panel.w - 4, w: 4 }, 12, 34, 2), { tone: "mid" }));
  out.push(S(slab(panel, 34, HATCH.top, 2), { tone: "mid" }));
  // The counter ledge under the window.
  out.push(S(slab({ x: panel.x + 2, y: HATCH.y1, w: panel.w - 4, d: 4, r: 0.8 }, 10.6, 12.6, 3, 0.3), { tone: "mid" }));
  out.push(D([at([panel.x + 4.4, HATCH.y1 + 2, 12.6]), at([panel.x + panel.w - 4.4, HATCH.y1 + 2, 12.6])], { size: 0.4 }));
  out.push(D([[panel.x + 2, 4], [panel.x + panel.w - 2, 4], [panel.x + 2, 48], [panel.x + panel.w - 2, 48]].map(([x, z]) => at([x, HATCH.y1, z])), { size: 0.4 }));
  out.push(S(slab({ x: HATCH.x1 - WALL, y: MOUTH.y, w: WALL, d: HATCH.y1 - MOUTH.y, r: 1 }, 0, HATCH.top, 3, 0.5), { tone: "mid" }));
  // Roof with a drip seam, corner screws and the flag housing.
  const roof = { x: HATCH.x0 - 2, y: HATCH.y0 - 2, w: HATCH.x1 - HATCH.x0 + 4, d: HATCH.y1 - HATCH.y0 + 4, r: 2 };
  out.push(S(k.slabOf(roof, HATCH.top, 4, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(roof, HATCH.top + 1.4, P, 4), { tone: "faint" }) }));
  out.push(D(k.corners(roof, 3.4).map(([x, y]) => at([x, y, HATCH.top + 4])), { size: 0.45 }));
  out.push(L(k.planOutline(k.insetPlan(roof, 6), HATCH.top + 4, P, 3), { tone: "faint" }));
  // The near jamb and the header of the hatch's mouth, the same as the vault's.
  out.push(jamb(HATCH_FACE, 1), header(HATCH_FACE));
  out.push(keyFittings());
  return out.join("");
}

const FLAG_HOUSING = { x: -6, y: -4, w: 18, d: 8, r: 1 };
const FLAG_TOP = HATCH.top + 4 + 6;
const FLAG = { x: -3, w: 12, h: 12, rise: 10 };
function flagHousing() {
  const out = [];
  out.push(S(slab(FLAG_HOUSING, HATCH.top + 4, FLAG_TOP, 3, 0.4), { tone: "mid" }));
  out.push(L(k.planOutline({ x: FLAG.x - 0.6, y: -0.9, w: FLAG.w + 1.2, d: 1.8, r: 0.6 }, FLAG_TOP, P, 2), { tone: "lo" }));
  out.push(D([at([FLAG_HOUSING.x + 1.6, 0, FLAG_TOP]), at([FLAG_HOUSING.x + FLAG_HOUSING.w - 1.6, 0, FLAG_TOP])], { size: 0.4 }));
  return out.join("");
}
// The refusal flag rises out of its housing. The clip keeps only what is above
// the housing's top, in the flag's own plane.
function flag() {
  const z0 = FLAG_TOP - FLAG.h - 0.6;
  const plan = { x: FLAG.x, y: -0.5, w: FLAG.w, d: 1, r: 0.3 };
  const M = k.sideMatrix([FLAG.x, 0.5], z0 + FLAG.h, P, "left");
  const cross = `<g transform="${M}"><path class="iso-line" data-tone="lo" d="${rrect(1.2, 1.2, FLAG.w - 2.4, FLAG.h - 2.4, 0.6)}"/><path class="iso-line" data-tone="hi" d="M2.4 1.2L${FLAG.w - 2.4} ${FLAG.h - 1.2}M${FLAG.w - 2.4} 1.2L2.4 ${FLAG.h - 1.2}"/></g>`;
  const clip = poly([[-200, 0.5, FLAG_TOP], [200, 0.5, FLAG_TOP], [200, 0.5, 400], [-200, 0.5, 400]]);
  return `<clipPath id="dp-flag-clip"><path d="${clip}"/></clipPath><g clip-path="url(#dp-flag-clip)"><g data-part="flag"><g data-part="flag-plate">${S(slab(plan, z0, z0 + FLAG.h, 2), { tone: "hi", crease: "lo", inner: cross })}</g></g></g>`;
}

// Key rest and lock on the panel above the window, both 1.5 proud of the face.
function keyFittings() {
  const out = [];
  const y = HATCH.y1;
  out.push(S(slab({ x: KEY_REST_X - 4, y, w: 8, d: 1.5, r: 0.6 }, KEY_Z - 4, KEY_Z + 4, 2), { tone: "mid" }));
  out.push(keyhole(KEY_REST_X));
  out.push(D([at([KEY_REST_X - 2.6, KEY_FACE, KEY_Z - 2.6]), at([KEY_REST_X + 2.6, KEY_FACE, KEY_Z + 2.6])], { size: 0.35 }));
  const F = G.frameAlong([KEY_LOCK_X, y, KEY_Z], Y);
  out.push(S(G.solidOf([[0, 3.4], [1.0, 3.4], [1.5, 2.8]], F, P), { tone: "mid" }));
  out.push(L(G.circleOf(F, 1.5, 1.9, P, 20), { tone: "faint" }));
  out.push(keyhole(KEY_LOCK_X));
  // Engraved marks for the lock's two positions: shut (up) and open (a quarter turn).
  out.push(L(k.segment(G.pointOf(F, 0.05, 3.4, Math.PI / 2), G.pointOf(F, 0.05, 4.8, Math.PI / 2), P) + k.segment(G.pointOf(F, 0.05, 3.4, Math.PI), G.pointOf(F, 0.05, 4.8, Math.PI), P), { tone: "lo" }));
  return out.join("");
}

const keyhole = (x) => `<path class="dp-hole" d="${poly([[x - 0.4, KEY_FACE, KEY_Z - 1.5], [x + 0.4, KEY_FACE, KEY_Z - 1.5], [x + 0.4, KEY_FACE, KEY_Z + 1.5], [x - 0.4, KEY_FACE, KEY_Z + 1.5]])}"/>`;

// The key's bow, pre-drawn at seven angles of its quarter turn in the lock. The
// bow is a flat rounded plate in the plane of the key's axis (y) and its up direction.
const BOW_FRAMES = 7;
function keyBow() {
  const frames = [];
  for (let i = 0; i < BOW_FRAMES; i++) {
    const theta = (i / (BOW_FRAMES - 1)) * (Math.PI / 2);
    const normal = [Math.cos(theta), 0, -Math.sin(theta)];
    const up = [Math.sin(theta), 0, Math.cos(theta)];
    const F = G.frameOf([KEY_LOCK_X, KEY_FACE, KEY_Z], normal, Y, up);
    const outline = [];
    const corner = (cu, cv, from) => { for (let j = 0; j <= 4; j++) { const a = from + (j / 4) * (Math.PI / 2); outline.push([cu + 1.8 * Math.cos(a), cv + 1.8 * Math.sin(a)]); } };
    corner(6.4, 0.9, 0);
    corner(3.0, 0.9, Math.PI / 2);
    corner(3.0, -0.9, Math.PI);
    corner(6.4, -0.9, (3 * Math.PI) / 2);
    const neck = G.frameAlong([KEY_LOCK_X, KEY_FACE, KEY_Z], Y);
    const collar = S(G.solidOf([[0, 1.1], [1.6, 1.1]], neck, P), { tone: "mid" });
    const plate = S(G.prismOf(F, outline, -0.6, 0.6, P), { tone: "mid" });
    frames.push(`<g data-frame="${i}"${i === BOW_FRAMES - 1 ? "" : ' display="none"'}>${collar}${plate}</g>`);
  }
  return `<g data-part="key-bow">${frames.join("")}</g>`;
}

// The shuttle: a tray on four bushings with the report standing in it. Built at
// x = 0 and moved along the track; drawn twice, inside and outside the hatch.
function shuttle(copy) {
  const out = [];
  for (const y of RAIL_Y) for (const x of [-9, 9]) {
    out.push(S(slab({ x: x - 3, y: y - 2.5, w: 6, d: 5, r: 1 }, RAIL_TOP, RAIL_TOP + 2, 2), { tone: "mid" }));
  }
  const tray = { x: -13, y: -12, w: 26, d: 24, r: 2 };
  out.push(S(slab(tray, RAIL_TOP + 2, RAIL_TOP + 4, 4, 0.4), { tone: "mid" }));
  out.push(S(slab({ x: -13, y: -10, w: 2, d: 20, r: 0.6 }, RAIL_TOP + 4, RAIL_TOP + 6.5, 2), { tone: "mid" }));
  const binder = { x: -9, y: -10, w: 18, d: 20, r: 1 };
  const z0 = RAIL_TOP + 4;
  const z1 = z0 + 13;
  const spine = k.sideSeam(binder, z0 + 2, P, 2) + k.sideSeam(binder, z1 - 2, P, 2);
  const delivered = Math.abs(at0.shuttle - SHUTTLE_AT.client) < 0.5;
  out.push(`<g data-part="binder">${S(slab(binder, z0, z1, 2, 0.5), { tone: "hi", crease: "lo", lit: delivered, inner: L(spine, { tone: "faint" }) })}</g>`);
  out.push(L(k.planOutline(k.insetPlan(binder, 2.2), z1, P, 2), { tone: "faint" }));
  const M = k.sideMatrix([binder.x + 4, binder.y + binder.d], z1 - 4, P, "left");
  out.push(`<g transform="${M}"><path class="dp-plate" d="${rrect(0, 0, 10, 4.6, 0.5)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 10, 4.6, 0.5)}"/></g>`);
  out.push(S(slab({ x: 11, y: -10, w: 2, d: 20, r: 0.6 }, RAIL_TOP + 4, RAIL_TOP + 6.5, 2), { tone: "mid" }));
  out.push(D([at([-11, -10.6, RAIL_TOP + 4]), at([-11, 10.6, RAIL_TOP + 4]), at([11, 10.6, RAIL_TOP + 4])], { size: 0.4 }));
  return `<g data-part="shuttle-${copy}">${out.join("")}</g>`;
}

function hatchDoor() {
  return `<g data-part="hatch-door" transform="${tz(at0.hatchDoor * DOOR.lift)}">${door(HATCH_FACE)}</g>${guide(HATCH_FACE, 1)}${guideCap(HATCH_FACE)}`;
}

function counter() {
  const out = [];
  // End stop with two rubber bumpers facing the shuttle.
  for (const y of RAIL_Y) {
    const F = G.frameAlong([80, y, 6], [-1, 0, 0]);
    out.push(S(G.solidOf([[0, 1.8], [0.8, 1.8], [1.0, 1.4]], F, P), { tone: "lo" }));
  }
  out.push(S(slab({ x: 80, y: -13, w: 5, d: 26, r: 1 }, 0, 9, 3, 0.4), { tone: "mid" }));
  out.push(D([at([82.5, -9, 9]), at([82.5, 9, 9])], { size: 0.45 }));
  // The counter where the reader stands: pedestal, desk top, the bell, a slip tray.
  out.push(S(slab(STAND, 0, DESK_Z[0], 4, 0.6), { tone: "mid", inner: L(k.sideSeam(STAND, 4, P, 4), { tone: "faint" }) }));
  // Recessed panels on the two faces that show, each held by two screws.
  const front = k.sideMatrix([STAND.x + 4, STAND.y + STAND.d], DESK_Z[0] - 3, P, "left");
  out.push(`<g transform="${front}"><path class="iso-line" data-tone="faint" d="${rrect(0, 0, STAND.w - 8, 10, 1)}"/></g>`);
  const side = k.sideMatrix([STAND.x + STAND.w, STAND.y + STAND.d - 4], DESK_Z[0] - 3, P, "right");
  out.push(`<g transform="${side}"><path class="iso-line" data-tone="faint" d="${rrect(0, 0, STAND.d - 8, 10, 1)}"/></g>`);
  out.push(D([at([STAND.x + 6, STAND.y + STAND.d, DESK_Z[0] - 5]), at([STAND.x + STAND.w - 6, STAND.y + STAND.d, DESK_Z[0] - 5]), at([STAND.x + STAND.w, STAND.y + STAND.d - 6, DESK_Z[0] - 5]), at([STAND.x + STAND.w, STAND.y + 6, DESK_Z[0] - 5])], { size: 0.4 }));
  out.push(S(slab(DESK, DESK_Z[0], DESK_Z[1], 4, 0.8), { tone: "mid" }));
  out.push(D(k.corners(DESK, 3).map(([x, y]) => at([x, y, DESK_Z[1]])), { size: 0.45 }));
  const slip = { x: 93, y: -20, w: 18, d: 14, r: 1 };
  out.push(S(slab(slip, DESK_Z[1], DESK_Z[1] + 0.8, 3), { tone: "lo", crease: "none" }));
  out.push(L([[96, -16.5, 11], [96, -13.5, 8], [96, -10.5, 10]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], DESK_Z[1] + 0.8, P)).join(""), { tone: "lo", free: true }));
  const [bx, by] = BELL;
  out.push(S(k.cylinder(bx, by, 4.6, DESK_Z[1], 1.2, P, 32, 0.3), { tone: "lo" }));
  out.push(`<g data-part="bell">${S(k.cylinder(bx, by, 3.2, DESK_Z[1] + 1.2, 2.8, P, 28, 0.3), { tone: "mid" })}${L(k.ring(bx, by, 1.6, DESK_Z[1] + 4, P, 16), { tone: "faint" })}</g>`);
  return out.join("");
}

const START = 1;
const at0 = pose(REST[START]);
const tz = (dz) => k.translateAlong(P, [0, 0, dz]);
const tx = (dx) => k.translateAlong(P, [dx, 0, 0]);
// The clip for the shuttle drawn inside: the space in front of the vault's face
// within the mouth's width and height, so inside the vault it shows only through the mouth.
const V2 = [[VAULT_FACE, -MOUTH.y, 0], [200, -MOUTH.y, 0], [200, MOUTH.y, 0], [VAULT_FACE, MOUTH.y, 0]].flatMap(([x, y]) => [[x, y, 0], [x, y, MOUTH.z]]);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một kho lưu trữ nặng nề có cửa nâng, bánh xe khoá và bộ đếm số lần tải; phía trước là một quầy nhỏ có cùng kiểu cửa. Khay chở báo cáo chạy trên đường ray từ trong kho, qua quầy, tới bàn người đọc. Quầy kiểm chìa khoá trước: không có chìa thì cờ từ chối bật lên và kho không mở. Lần đọc hợp lệ đầu tiên, kho mở và khay chở báo cáo về quầy; những lần sau quầy trả ngay báo cáo đang giữ.",
  body: [
    base(),
    track(),
    vault(),
    hatchBack(),
    `<clipPath id="dp-v2"><path d="${hull(V2)}"/></clipPath><g clip-path="url(#dp-v2)"><g data-part="move-in" transform="${tx(at0.shuttle)}">${shuttle("in")}</g></g>`,
    vaultFront(),
    hatchFront(),
    flagHousing(),
    flag(),
    `<g data-part="key-blade"></g>`,
    `<g data-part="key" transform="${k.translateAlong(P, [(at0.keyAlong - 1) * (KEY_LOCK_X - KEY_REST_X), at0.keyOut * 6.5, 0])}">${keyBow()}</g>`,
    hatchDoor(),
    `<g data-part="move-out" transform="${tx(at0.shuttle)}">${shuttle("out")}</g>`,
    counter(),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const TIMELINE = readFileSync(join(HERE, "timeline.mjs"), "utf8").replace(/^export /gm, "");
const results = play();

export const live = `
${MODEL}
${TIMELINE}
const P = ${JSON.stringify(P)};
const START = ${START}, N = REQUESTS.length, LIFT = ${DOOR.lift}, FLAG_RISE = ${FLAG.rise}, BELL_DIP = 1.6;
const KEY = { rest: ${KEY_REST_X}, lock: ${KEY_LOCK_X}, out: 6.5, face: ${KEY_FACE}, z: ${KEY_Z} };
const SPOKES = ${SPOKE_FRAMES}, BOWS = ${BOW_FRAMES}, INSIDE = ${HATCH_FACE + 13};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector('[data-part="' + name + '"]');
const parts = {
  moveIn: q("move-in"), moveOut: q("move-out"), vaultDoor: q("vault-door"), hatchDoor: q("hatch-door"),
  flag: q("flag"), bell: q("bell"), key: q("key"), blade: q("key-blade"), digits: q("digits"),
};
const spokeFrames = [...q("spokes").children];
const bowFrames = [...q("key-bow").children];
const binders = [...svg.querySelectorAll('[data-part="binder"] > .iso-solid')];
const flagPlate = svg.querySelector('[data-part="flag-plate"] > .iso-solid');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const results = play();
const restText = results.map((r) => r.who + " → " + (!r.allowed ? "bị từ chối" : r.loadsNow ? "tải từ kho" : "bản đã tải") + " · " + r.loads + " lần tải" + (r.allowed ? " · " + secondsText(r.seconds) : ""));
let sel = START, t = REST[START], aim = sel, speed = 1, dwell = 0;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0;
const DWELL = 3.4;
const shown = {};
const set = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.setAttribute("transform", value); } };
const show = (list, index, key) => {
  if (shown[key] === index) return;
  shown[key] = index;
  list.forEach((el, i) => el.setAttribute("display", i === index ? "inline" : "none"));
};
const lit = (el, on) => {
  el.toggleAttribute("data-lit", on);
  el.querySelector(".iso-edge")?.setAttribute("data-tone", on ? "lit" : "hi");
};
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", restText[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function blade(o, x) {
  const length = Math.min(6, o);
  if (length < 0.05) return "";
  const y0 = Math.max(KEY.face, KEY.face - 6 + o);
  return solidSvg(slabOf({ x: x - 0.4, y: y0, w: 0.8, d: length, r: 0.2 }, KEY.z - 1.1, 2.2, P, 2), { tone: "mid" });
}
function draw() {
  const p = pose(t);
  const move = translateAlong(P, [p.shuttle, 0, 0]);
  set(parts.moveIn, "in", move);
  set(parts.moveOut, "out", move);
  // Inside or in the hatch's mouth the shuttle is painted behind the hatch's front; past it, in front of everything.
  const outside = p.shuttle > INSIDE;
  if (shown.outside !== outside) {
    shown.outside = outside;
    parts.moveIn.setAttribute("display", outside ? "none" : "inline");
    parts.moveOut.setAttribute("display", outside ? "inline" : "none");
  }
  set(parts.vaultDoor, "vd", translateAlong(P, [0, 0, p.vaultDoor * LIFT]));
  set(parts.hatchDoor, "hd", translateAlong(P, [0, 0, p.hatchDoor * LIFT]));
  set(parts.flag, "fl", translateAlong(P, [0, 0, p.flag * FLAG_RISE]));
  set(parts.bell, "bl", translateAlong(P, [0, 0, -p.bell * BELL_DIP]));
  const o = p.keyOut * KEY.out;
  const x = KEY.rest + p.keyAlong * (KEY.lock - KEY.rest);
  set(parts.key, "key", translateAlong(P, [x - KEY.lock, o, 0]));
  const bladeKey = o.toFixed(2) + "/" + x.toFixed(2);
  if (shown.blade !== bladeKey) { shown.blade = bladeKey; parts.blade.innerHTML = blade(o, x); }
  show(bowFrames, Math.round(p.keyTurn * (BOWS - 1)), "bow");
  const turns = p.wheel * SPOKES * 3;
  show(spokeFrames, ((Math.round(turns) % SPOKES) + SPOKES) % SPOKES, "spk");
  set(parts.digits, "dg", "translate(0 " + (-9 * p.counter).toFixed(2) + ")");
  const delivered = Math.abs(p.shuttle - SHUTTLE_AT.client) < 0.5;
  if (shown.lit !== delivered) { shown.lit = delivered; binders.forEach((el) => lit(el, delivered)); }
  const refused = p.flag > 0.5;
  if (shown.refused !== refused) { shown.refused = refused; lit(flagPlate, refused); }
  const resting = REST.findIndex((r) => Math.abs(r - t) < 0.001);
  const text = resting >= 0 ? restText[resting] : t > REST[aim] ? "đang tua lại" : phase(t);
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const target = REST[sel];
  if (sel !== aim) {
    aim = sel;
    // Play forward in real time, faster when skipping a step, and rewind quickly.
    speed = target < t ? 3.5 : target > REST[Math.min(N - 1, REST.findIndex((r) => r > t + 0.001))] ? 2.2 : 1;
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

const steps = results.map((r, i) => ({
  label: r.label,
  short: r.short,
  caption: !r.allowed
    ? `<code>proxy.read(khach)</code>: ${r.who} không có vai trò được xem, nên Proxy từ chối ngay ở quầy. Kho không mở, báo cáo chưa được tải: <strong>${r.loads} lần tải</strong>, 0 s.`
    : r.loadsNow
      ? `<code>proxy.read(ke_toan)</code>: ${r.who} có quyền, nhưng Proxy chưa giữ báo cáo nên mở kho và tải ${groupDots(REPORT.pages)} trang: <strong>${r.loads} lần tải</strong>, ${secondsText(r.seconds)}.`
      : `<code>proxy.read(ke_toan)</code> lần nữa: Proxy vẫn kiểm quyền, rồi trả ngay báo cáo đang giữ, kho vẫn đóng: <strong>vẫn ${r.loads} lần tải</strong>, ${secondsText(r.seconds)}.`,
}));

export const plate = withSteps(k.plateHtml({
  fig: "Fig 10",
  title: "Proxy",
  hint: "Rê chuột để chọn bước",
  readout: `${results[START].who} → tải từ kho · ${results[START].loads} lần tải · ${secondsText(results[START].seconds)}`,
  keys: [
    { mark: "lit", label: "Báo cáo đến tay người đọc, hoặc cờ từ chối khi không có quyền" },
    { mark: "raised", label: "Hai cửa giống hệt nhau: cửa quầy (Proxy) và cửa kho (báo cáo thật) có cùng interface" },
  ],
  caption:
    "Người đọc chỉ làm việc với quầy phía trước. Cửa quầy giống hệt cửa kho, nên với người đọc hai bên dùng như nhau. Quầy kiểm chìa khoá trước mọi việc: không có chìa thì cờ từ chối bật lên và kho không hề mở. Lần đọc hợp lệ đầu tiên, quầy mới mở cái kho nặng nề để lấy báo cáo về (bộ đếm lên 1); những lần sau quầy trả ngay bản đang giữ.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Proxy: phím mũi tên để chọn bước" aria-valuemin="1" aria-valuemax="${results.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Các bước: ba lần đọc báo cáo", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-dark{fill:#c9c9c6}
.dp-inside{fill:#8c8c90;fill-opacity:.16}
.dp-digit{letter-spacing:0}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
