// The Prototype figure: a key duplicating machine. The master key is the
// prototype, a service package configured once. A tracer pin follows its cuts
// while a cutter, fixed the same distance away, cuts the blank beside it, so the
// copy comes out identical without the machine knowing how the master was made
// (clone()). Each key's line items hang as tags on its own rail in front. The copy
// is then engraved with the customer's name and gets one more tag on its rail.
// In the last step a sleeve joins the two rails into one, the way a shallow copy
// shares the template's list: the extra tag now counts on the template too.
// Motion: timeline.mjs. Numbers: model.mjs. Key shape: keys.mjs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { BLADE, KEY_T, depthAt, keySvg } from "./keys.mjs";
import { CUSTOMER, EXTRA, STEPS, TEMPLATE, groupVND, total } from "./model.mjs";
import { REST, pose } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 410;
const AZIMUTH = 38;

const PLATE = { x: -138, y: -62, w: 276, d: 136, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Machine body at the back, and the head that carries the tracer and the cutter.
const HOUSING = { x: -40, y: -58, w: 122, d: 28, r: 3 };
const HOUSING_TOP = 50;
const HEAD = { x: -34, y: -30, w: 108, d: 28, r: 3 };
const HEAD_Z = [40, 50];

// Tracer and cutter: fixed, exactly as far apart as the two vises.
const TRACER = { x: -22, r: 1.3 };
const CUTTER = { x: 58, r: 9 };
const CONTACT_Y = -5.2;
TRACER.y = CONTACT_Y - TRACER.r;
CUTTER.y = CONTACT_Y - CUTTER.r;

// Carriage: a saddle sliding along x on two base rails, a table sliding along y on
// the saddle (a spring pushes it back onto the tracer), and two vises on the table.
const RAIL_Y = [2, 22];
const SADDLE = { x: -80, y: -2, w: 184, d: 32, r: 2.5 };
const SADDLE_Z = [3.5, 7.5];
const TABLE = { x: -74, y: -4, w: 172, d: 26, r: 3 };
const TABLE_Z = [7.5, 12.5];
const VISE_Z = [12.5, 20];
const KEY_Z = VISE_Z[1];
const MASTER_X = -55;
const COPY_X = MASTER_X + (CUTTER.x - TRACER.x);
const PULLED = 3.5;

// Item rails in front: the template's on the left, the copy's on the right.
const RAIL = { y: 56, z: 23, r: 1.3 };
const RAIL_A = [-102, -4];
const RAIL_B = [4, 102];
const POSTS = [-78, 78];
const SLEEVE = { from: -20, length: 14, slide: 13, r: 2.3 };
const TAGS_A = [-64, -50, -36];
const TAGS_B = [22, 36, 50];
const EXTRA_OWN = 64;
const EXTRA_SHARED = 22;
const TAG = { w: 9, z: [8, 19] };
const BOX_A = { x: -132, y: 49, w: 28, d: 14, r: 2 };
const BOX_B = { x: 104, y: 49, w: 28, d: 14, r: 2 };
const BOX_TOP = 34;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(HOUSING, 0, HOUSING_TOP + 16)],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const X = [1, 0, 0];
const Y = [0, 1, 0];
const Z = [0, 0, 1];
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// Where the carriage sits for a tracer position along the master, and how far in.
const carriageAt = (along, engage) => [TRACER.x - MASTER_X - along, PULLED + ((CONTACT_Y - BLADE.back - depthAt(along)) - PULLED) * engage];

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
  // Label plate between the item rails and the front edge.
  const label = { x: -22, y: 63, w: 44, d: 8, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[-17, 65.8, 26], [-17, 68.2, 18]].map(([x, y, w]) => k.lineOnTop([x, y], [x + w, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 4, 0.8]), at([label.x + label.w - 2.4, label.y + 4, 0.8])], { size: 0.4 }));
  return out.join("");
}

function housing() {
  const out = [];
  const seam = k.sideSeam(HOUSING, 26, P, 6);
  out.push(S(k.slabOf(HOUSING, 0, HOUSING_TOP, P, 6, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(D([[-35, -53], [77, -53], [-35, -35], [77, -35]].map(([x, y]) => at([x, y, HOUSING_TOP])), { size: 0.45 }));
  // Right face: vents, the power switch and a rating plate.
  const right = HOUSING.x + HOUSING.w;
  const M = (y, z) => k.sideMatrix([right, y], z, P, "right");
  const vents = Array.from({ length: 5 }, (_, i) => rrect(3, 4 + i * 3.4, 14, 1.6, 0.8)).join("");
  out.push(`<g transform="${M(HOUSING.y + HOUSING.d - 2, 46)}"><path class="iso-line" data-tone="lo" d="${vents}"/></g>`);
  out.push(`<g transform="${M(HOUSING.y + HOUSING.d - 2, 22)}"><path class="dp-plate" d="${rrect(0, 0, 9, 12, 1.2)}"/><path class="iso-line" data-tone="mid" d="${rrect(0, 0, 9, 12, 1.2)}"/><path class="dp-hole" d="${rrect(3, 3.2, 3, 5.6, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(3, 3.2, 3, 5.6, 1)}"/><path class="iso-line" data-tone="hi" d="M4.5 4.2V2.4"/></g>`);
  out.push(`<g transform="${M(HOUSING.y + 13, 22)}"><path class="dp-plate" d="${rrect(0, 0, 10, 8, 1)}"/><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 10, 8, 1)}"/><path class="iso-line" data-tone="lo" data-free="" d="M2 2.6H8M2 4.4H6.5M2 6H7.4"/></g>`);
  out.push(D([at([right, HOUSING.y + 12.2, 21.2]), at([right, HOUSING.y + 3.8, 21.2])], { size: 0.4 }));
  return out.join("");
}

function chipTray() {
  const tray = { x: 46, y: -29, w: 28, d: 19, r: 1.5 };
  const out = [S(k.slabOf(tray, 0, 2.4, P, 3, 0.4), { tone: "lo" })];
  out.push(L(k.planOutline(k.insetPlan(tray, 1.6), 2.4, P, 3), { tone: "faint" }));
  const chips = [[52, -24], [55, -20], [58, -23], [61, -18], [63, -25], [66, -21], [57, -15], [68, -16], [60, -27], [64, -13]];
  out.push(D(chips.map(([x, y]) => at([x, y, 2.4])), { size: 0.35, tone: "mid" }));
  return out.join("");
}

// A tray of key blanks at the back left, where every copy starts.
function blanks() {
  const tray = { x: -122, y: -57, w: 60, d: 39, r: 2 };
  const out = [S(k.slabOf(tray, 0, 3, P, 4, 0.5), { tone: "lo" })];
  out.push(L(k.planOutline(k.insetPlan(tray, 2), 3, P, 4), { tone: "faint" }));
  for (const y of [-47, -28]) out.push(keySvg(k, P, -110, y, 3, Infinity, "mid"));
  out.push(D([at([tray.x + 3, tray.y + 3, 3]), at([tray.x + tray.w - 3, tray.y + tray.d - 3, 3])], { size: 0.4 }));
  return out.join("");
}

function baseRails() {
  const out = [];
  for (const y of RAIL_Y) {
    out.push(S(k.slabOf({ x: -114, y, w: 228, d: 4, r: 1 }, 0, SADDLE_Z[0], P, 3, 0.4), { tone: "mid" }));
    out.push(D([-108, 108].map((x) => at([x, y + 2, SADDLE_Z[0]])), { size: 0.4 }));
  }
  for (const x of [-122, 116]) {
    out.push(S(k.slabOf({ x, y: -1, w: 6, d: 30, r: 1.2 }, 0, 8, P, 3, 0.5), { tone: "mid" }));
    out.push(D([4, 24].map((y) => at([x + 3, y, 8])), { size: 0.45 }));
  }
  return out.join("");
}

// The saddle and what rides on it with it: travels along x only.
function saddle() {
  const out = [S(k.slabOf(SADDLE, SADDLE_Z[0], SADDLE_Z[1] - SADDLE_Z[0], P, 4, 0.5), { tone: "mid" })];
  out.push(D([-74, -40, 0, 40, 80, 98].map((x) => at([x, SADDLE.y + SADDLE.d - 2, SADDLE_Z[1]])), { size: 0.4, tone: "lo" }));
  return out.join("");
}

// The spring post at the front of the saddle; the spring itself is redrawn as the table moves.
const SPRING = { x: -66, z: 10, r: 1.6, post: SADDLE.y + SADDLE.d - 3.5 };
function springPost() {
  const plan = { x: SPRING.x - 4, y: SPRING.post, w: 8, d: 3.5, r: 0.8 };
  return S(k.slabOf(plan, SADDLE_Z[1], 7.5, P, 3, 0.4), { tone: "mid" }) + D([at([SPRING.x, SPRING.post + 1.75, SADDLE_Z[1] + 7.5])], { size: 0.4 });
}
const springOf = (cy) => k.coil(TABLE.y + TABLE.d + cy, SPRING.post, [SPRING.x, SPRING.z], SPRING.r, 7, "y", P);
function spring(cy) {
  const c = springOf(cy);
  return L(c.back, { tone: "lo" }) + L(c.front, { tone: "mid" });
}

function table() {
  const out = [S(k.slabOf(TABLE, TABLE_Z[0], TABLE_Z[1] - TABLE_Z[0], P, 5, 0.6), { tone: "mid" })];
  out.push(D([-68, -30, 10, 50, 92].map((x) => at([x, TABLE.y + TABLE.d - 2, TABLE_Z[1]])), { size: 0.4, tone: "lo" }));
  return out.join("");
}

// One vise with its key, clamp bar and thumb screw. `ox` is the key's bow centre.
function vise(ox) {
  const out = [];
  const plan = { x: ox - 10, y: -1.5, w: 62, d: 15, r: 2 };
  out.push(S(k.slabOf(plan, VISE_Z[0], VISE_Z[1] - VISE_Z[0], P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.lineOnTop([ox - 10, 9.6], [ox + 52, 9.6], VISE_Z[1], P), { tone: "faint" }));
  out.push(D([at([ox - 7, 11, VISE_Z[1]]), at([ox + 49, 11, VISE_Z[1]])], { size: 0.4 }));
  // Clamp lever on the front face.
  const F = G.frameAlong([ox + 20, plan.y + plan.d, 16.2], Y);
  out.push(S(G.solidOf([[0, 1.5], [3.6, 1.5], [3.6, 2.4], [6, 2.4]], F, P), { tone: "mid" }));
  return out.join("");
}

function clamp(ox) {
  const out = [];
  const bar = { x: ox + 12, y: 0.6, w: 34, d: 5.6, r: 1.2 };
  out.push(S(k.slabOf(bar, KEY_Z + KEY_T, 3, P, 3, 0.4), { tone: "mid" }));
  const top = KEY_Z + KEY_T + 3;
  out.push(D([at([bar.x + 2.5, 3.4, top]), at([bar.x + bar.w - 2.5, 3.4, top])], { size: 0.45 }));
  const [sx, sy] = [ox + 29, 3.4];
  out.push(S(k.cylinder(sx, sy, 4, top, 0.8, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(sx, sy, 3.1, top + 0.8, 4.4, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(sx, sy, 3.1, top + 0.8, top + 5.2, 26, P), { tone: "lo" }));
  out.push(L(k.ring(sx, sy, 1.1, top + 5.2, P, 14), { tone: "mid" }));
  return out.join("");
}

function handle() {
  const F = G.frameAlong([92, TABLE.y + TABLE.d, 10], Y);
  const ribs = G.ribsOf(F, 11.6, 16.6, 2.6, 18, P, { fade: [0.1, 0.55], seams: true });
  return S(G.solidOf([[0, 1.1], [11, 1.1]], F, P), { tone: "mid" })
    + S(G.solidOf([[11, 2.2], [11.6, 2.6], [16.6, 2.6], [17.2, 2.1]], F, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) });
}

// The engraved customer name on the copy's bow, revealed left to right.
function engraving() {
  const M = k.topMatrix([COPY_X + 2.8, 0], KEY_Z + KEY_T, P);
  return `<g transform="${M}"><clipPath id="dp-engrave"><rect data-part="engrave" x="-6" y="-3" width="12" height="6"/></clipPath>
    <text class="iso-face-text dp-engraving" data-tone="mid" x="0" y="0.85" font-size="2.4" text-anchor="middle" clip-path="url(#dp-engrave)">${CUSTOMER.toUpperCase()}</text></g>`;
}

// Fixed tools hanging from the head: the tracer over the master, the cutter over the copy.
const TEETH = 24;
const TEETH_FRAMES = 4;
function tools() {
  const out = [];
  // Rear guard behind the cutter.
  out.push(S(k.slabOf({ x: CUTTER.x - 12, y: CUTTER.y - 13, w: 24, d: 3, r: 1 }, 16, HEAD_Z[0] - 16, P, 3, 0.4), { tone: "mid" }));
  // Tracer: holder block, thick shank with a lock nut, then the pin down to the master's edge.
  const { x: tx, y: ty } = TRACER;
  out.push(S(k.slabOf({ x: tx - 5, y: ty - 3.5, w: 10, d: 7, r: 1 }, 31, HEAD_Z[0] - 31, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(tx, ty, 2, 27, 4, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(tx, ty, 3, 27.4, 2, P, 6), { tone: "mid" }));
  out.push(S(k.cylinder(tx, ty, TRACER.r, KEY_Z - 0.2, 27.4 - KEY_Z + 0.2, P, 18), { tone: "hi", crease: "lo" }));
  // Cutter: quill, spindle, collet nut and the toothed disc.
  const { x: cx, y: cy } = CUTTER;
  // Bottom up: the disc, its teeth, the collet nut, the spindle, the quill.
  out.push(S(k.cylinder(cx, cy, CUTTER.r, KEY_Z - 0.2, 2.2, P, 48), { tone: "hi", crease: "lo" }));
  const teethZ = KEY_Z + 2;
  const frames = Array.from({ length: TEETH_FRAMES }, (_, f) => {
    const lines = Array.from({ length: TEETH }, (_, i) => {
      const a = ((i + f / TEETH_FRAMES) / TEETH) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return k.segment([cx + 6.8 * c, cy + 6.8 * s, teethZ], [cx + (CUTTER.r - 0.4) * c, cy + (CUTTER.r - 0.4) * s, teethZ], P);
    }).join("");
    return `<g data-frame="${f}"${f ? ' display="none"' : ""}>${L(lines, { tone: "lo" })}</g>`;
  });
  out.push(`<g data-part="teeth">${frames.join("")}</g>`);
  // Chips thrown back from the cut, shown only while the cutter is in the blank.
  out.push(`<g data-part="chips" display="none"></g>`);
  out.push(S(k.cylinder(cx, cy, 3.6, teethZ, 1.6, P, 6), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 2.2, teethZ + 1.6, 32 - teethZ - 1.6, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 4.6, 32, HEAD_Z[0] - 32, P, 28), { tone: "mid" }));
  return out.join("");
}

function head() {
  const out = [];
  const seam = k.sideSeam(HEAD, HEAD_Z[0] + 5, P, 6);
  out.push(S(k.slabOf(HEAD, HEAD_Z[0], HEAD_Z[1] - HEAD_Z[0], P, 6, 1), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  out.push(D([[-30, -26], [70, -26], [-30, -6], [70, -6]].map(([x, y]) => at([x, y, HEAD_Z[1]])), { size: 0.45 }));
  // Front face: a scale for the cut depth beside the tracer.
  const M = k.sideMatrix([HEAD.x + 4, HEAD.y + HEAD.d], HEAD_Z[1] - 2.5, P, "left");
  const ticks = Array.from({ length: 9 }, (_, i) => `M${2 + i * 2.2} 0V${i % 4 ? 1.6 : 3}`).join("");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="lo" d="${ticks}"/></g>`);
  // Tracer depth knob on top.
  const { x: tx, y: ty } = TRACER;
  out.push(S(k.cylinder(tx, ty, 4.4, HEAD_Z[1], 0.8, P, 30), { tone: "lo" }));
  out.push(S(k.cylinder(tx, ty, 3.4, HEAD_Z[1] + 0.8, 3.6, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(tx, ty, 3.4, HEAD_Z[1] + 0.8, HEAD_Z[1] + 4.4, 26, P), { tone: "lo" }));
  out.push(L(k.ring(tx, ty, 1.2, HEAD_Z[1] + 4.4, P, 14), { tone: "mid" }));
  // Motor on top of the cutter, with cooling ribs and an end cap.
  const { x: cx, y: cy } = CUTTER;
  out.push(S(k.cylinder(cx, cy, 9.6, HEAD_Z[1], 1, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(cx, cy, 8.2, HEAD_Z[1] + 1, 12, P, 40), { tone: "mid", inner: L(k.knurl(cx, cy, 8.2, HEAD_Z[1] + 1, HEAD_Z[1] + 13, 40, P, 0.1), { tone: "faint" }) }));
  out.push(S(k.cylinder(cx, cy, 6.4, HEAD_Z[1] + 13, 1.6, P, 32), { tone: "mid" }));
  out.push(D([0, 1, 2, 3].map((i) => at([cx + 4.6 * Math.cos(i * Math.PI / 2 + 0.4), cy + 4.6 * Math.sin(i * Math.PI / 2 + 0.4), HEAD_Z[1] + 14.6])), { size: 0.4 }));
  return out.join("");
}

// One hanging item tag: a plate on an S-hook under the rail, two engraved lines.
function tag(tx, { lit = false } = {}) {
  const plan = { x: tx - TAG.w / 2, y: RAIL.y - 0.4, w: TAG.w, d: 0.8, r: 0.3 };
  const M = k.sideMatrix([plan.x, RAIL.y + 0.4], TAG.z[1], P, "left");
  const marks = `<g transform="${M}"><path class="iso-line" data-tone="lo" data-free="" d="M2 3.4H7M2 5.4H5.6"/><path class="iso-line" data-tone="mid" data-free="" d="M2 8.4H6.2"/></g>`;
  const band = S(G.solidOf([[-0.6, RAIL.r + 0.35], [0.6, RAIL.r + 0.35]], G.frameAlong([tx, RAIL.y, RAIL.z], X), P), { tone: "mid" });
  return band + L(k.segment([tx, RAIL.y, TAG.z[1]], [tx, RAIL.y, RAIL.z - RAIL.r - 0.35], P), { tone: "mid" })
    + S(k.slabOf(plan, TAG.z[0], TAG.z[1] - TAG.z[0], P, 2), { tone: lit ? "lit" : "hi", crease: "lo", lit, className: "dp-tag", inner: marks })
    + D([at([tx, RAIL.y + 0.4, TAG.z[1] - 1.4])], { size: 0.4 });
}

const rod = (from, to) => S(G.solidOf([[0, RAIL.r], [to - from, RAIL.r]], G.frameAlong([from, RAIL.y, RAIL.z], X), P), { tone: "mid" });

function post(x) {
  const out = [S(k.cylinder(x, RAIL.y, 3.4, 0, 1.2, P, 24), { tone: "lo" })];
  out.push(S(k.cylinder(x, RAIL.y, 1.6, 1.2, RAIL.z - 2.6 - 1.2, P, 18), { tone: "mid" }));
  return out.join("");
}
// The clamp block at the top of a post, drawn after the rod it holds.
const postClamp = (x) => S(k.slabOf({ x: x - 2.6, y: RAIL.y - 2.6, w: 5.2, d: 5.2, r: 0.8 }, RAIL.z - 2.6, 5.2, P, 3, 0.4), { tone: "mid" })
  + D([at([x, RAIL.y + 2.6, RAIL.z + 1.2])], { size: 0.4 });

// The display box at the end of each rail: the total of that rail's items.
function displayBox(box, label, part, text) {
  const out = [S(k.slabOf(box, 0, BOX_TOP, P, 4, 0.8), { tone: "mid" })];
  out.push(D([[box.x + 3, box.y + 3], [box.x + box.w - 3, box.y + 3], [box.x + 3, box.y + box.d - 3], [box.x + box.w - 3, box.y + box.d - 3]].map(([x, y]) => at([x, y, BOX_TOP])), { size: 0.4 }));
  const M = k.sideMatrix([box.x + 2.5, box.y + box.d], BOX_TOP - 4, P, "left");
  const win = rrect(0, 0, 23, 9, 1.2);
  out.push(`<g transform="${M}">
    <clipPath id="dp-win-${part}"><path d="${win}"/></clipPath>
    <path class="dp-screen" d="${win}"/>
    <g clip-path="url(#dp-win-${part})"><path class="dp-wall" d="M0 0H23V1H1V9H0Z"/>
    <text class="iso-face-text dp-digits" data-part="${part}" data-tone="hi" x="21.4" y="6.6" font-size="3.6" text-anchor="end">${text}</text></g>
    <path class="iso-line" data-tone="lo" d="${win}"/>
    <text class="iso-face-text dp-unit" data-tone="mid" x="0.4" y="14.6" font-size="2.8">${label}</text>
    <path class="iso-line" data-tone="lo" data-free="" d="M0.4 20H12M0.4 22.4H9"/>
  </g>`);
  return out.join("");
}

// Static parts, posed at the starting step; moving parts carry data-part names.
const START = 2;
const P0 = pose(REST[START]);
const [CX0, CY0] = carriageAt(P0.along, P0.engage);
const move = (x, y = 0, z = 0) => k.translateAlong(P, [x, y, z]);
const fade = (name, value, dz = 5) => `data-part="${name}" opacity="${value.toFixed(3)}" transform="${move(0, 0, (1 - value) * dz)}"`;

const textFor = (items) => (items ? groupVND(total(items)) : "-------");

export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Một máy sao chép chìa khoá. Chìa gốc kẹp ở ê-tô bên trái là gói dịch vụ mẫu, còn ê-tô bên phải giữ chìa sao chép. Đầu dò chạy theo các vết cắt của chìa gốc, và dao cắt đặt cách đúng một khoảng như thế cắt ra một chìa giống hệt. Phía trước là hai giá treo thẻ, mỗi thẻ là một hạng mục, và mỗi giá có một màn hình hiện tổng tiền. Ở bước cuối, một ống nối gộp hai giá làm một, giống như bản sao nông dùng chung danh sách với gói mẫu.",
  body: [
    base(),
    blanks(),
    housing(),
    chipTray(),
    baseRails(),
    `<g data-part="saddle" transform="${move(CX0)}">${saddle()}</g>`,
    `<g data-part="table-low" transform="${move(CX0, CY0)}">${table()}</g>`,
    `<g data-part="saddle-front" transform="${move(CX0)}">${springPost()}<g data-part="spring">${spring(CY0)}</g></g>`,
    tools(),
    `<g data-part="table-up" transform="${move(CX0, CY0)}">
      ${vise(MASTER_X)}${vise(COPY_X)}
      <g data-part="master-key">${keySvg(k, P, MASTER_X, 0, KEY_Z, -Infinity)}</g>
      <g data-part="copy-key">${keySvg(k, P, COPY_X, 0, KEY_Z, P0.cutFrom)}</g>
      ${engraving()}
      ${clamp(MASTER_X)}${clamp(COPY_X)}${handle()}
    </g>`,
    head(),
    displayBox(BOX_A, "MẪU", "show-a", textFor(STEPS[START].template)),
    post(POSTS[0]),
    rod(RAIL_A[0], RAIL_A[1]),
    postClamp(POSTS[0]),
    TAGS_A.map((x) => tag(x)).join(""),
    rod(RAIL_B[0], RAIL_B[1]),
    `<g data-part="sleeve" transform="${move(P0.sleeve * SLEEVE.slide)}">${S(G.solidOf([[0, SLEEVE.r - 0.4], [0.6, SLEEVE.r], [SLEEVE.length - 0.6, SLEEVE.r], [SLEEVE.length, SLEEVE.r - 0.4]], G.frameAlong([SLEEVE.from, RAIL.y, RAIL.z], X), P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(G.frameAlong([SLEEVE.from, RAIL.y, RAIL.z], X), 1.4, SLEEVE.length - 1.4, SLEEVE.r, 20, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) })}</g>`,
    TAGS_B.map((x, i) => `<g ${fade(`own${i}`, P0[`own${i}`])}>${tag(x)}</g>`).join(""),
    `<g ${fade("extra-own", P0.extraOwn)}>${tag(EXTRA_OWN)}</g>`,
    `<g ${fade("extra-shared", P0.extraShared)}>${tag(EXTRA_SHARED)}</g>`,
    post(POSTS[1]),
    postClamp(POSTS[1]),
    displayBox(BOX_B, "BẢN SAO", "show-b", textFor(STEPS[START].copy)),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const TIMELINE = readFileSync(join(HERE, "timeline.mjs"), "utf8").replace(/^export /gm, "");
const KEYS = readFileSync(join(HERE, "keys.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
${TIMELINE}
${KEYS}
const P = ${JSON.stringify(P)};
const K = { extrude, solidSvg, iso, pathOf };
const START = ${START}, N = STEPS.length, MASTER_X = ${MASTER_X}, COPY_X = ${COPY_X}, KEY_Z = ${KEY_Z};
const TRACER_X = ${TRACER.x}, CONTACT_Y = ${CONTACT_Y}, PULLED = ${PULLED}, SLIDE = ${SLEEVE.slide}, FRAMES = ${TEETH_FRAMES};
const SPRING = ${JSON.stringify({ ...SPRING, front: TABLE.y + TABLE.d })};
const CUT_AT = ${JSON.stringify([CUTTER.x, CONTACT_Y, KEY_Z + KEY_T / 2])};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector('[data-part="' + name + '"]');
const parts = {
  saddle: q("saddle"), saddleFront: q("saddle-front"), tableLow: q("table-low"), tableUp: q("table-up"),
  spring: q("spring"), copy: q("copy-key"), master: q("master-key"), engrave: q("engrave"), sleeve: q("sleeve"),
  own: [q("own0"), q("own1"), q("own2")], extraOwn: q("extra-own"), extraShared: q("extra-shared"),
  showA: q("show-a"), showB: q("show-b"), chips: q("chips"),
};
const teeth = [...q("teeth").children];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const money = (items) => groupVND(total(items));
const restText = [
  "Mẫu · " + STEPS[0].template.length + " hạng mục · " + money(STEPS[0].template) + " ₫",
  "clone() → " + STEPS[1].copy.length + " hạng mục · " + money(STEPS[1].copy) + " ₫",
  CUSTOMER + " · " + STEPS[2].copy.length + " hạng mục · " + money(STEPS[2].copy) + " ₫",
  "sao chép nông → mẫu cũng thành " + money(STEPS[3].template) + " ₫",
];
const spoken = [
  "Bước 1. Chìa gốc là gói mẫu " + TEMPLATE.name + ", " + STEPS[0].template.length + " hạng mục, tổng " + money(STEPS[0].template) + " đồng.",
  "Bước 2. Máy cắt ra một bản sao giống hệt, có giá hạng mục riêng, tổng " + money(STEPS[1].copy) + " đồng.",
  "Bước 3. Bản sao được khắc tên " + CUSTOMER + " và thêm một hạng mục, tổng " + money(STEPS[2].copy) + " đồng, còn gói mẫu vẫn " + money(STEPS[2].template) + " đồng.",
  "Bước 4. Với bản sao nông, hai chìa dùng chung một giá, nên gói mẫu cũng thành " + money(STEPS[3].template) + " đồng.",
];
let sel = START, t = REST[START], aim = sel, speed = 1, dwell = 0, spinPhase = 0;
let frame = 0, last = 0, touring = !still.matches, visible = false, idleTimer = 0;
const DWELL = 3.6;
const shown = {};
const set = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.setAttribute("transform", value); } };
const setText = (el, key, value) => { if (shown[key] !== value) { shown[key] = value; el.textContent = value; } };
// Light a part, or give it back the tone it was drawn with.
const lit = (el, on, pick = ".iso-solid") => {
  const solid = el.querySelector(pick);
  const edge = solid.querySelector(".iso-edge");
  edge.dataset.tone0 ??= edge.getAttribute("data-tone");
  solid.toggleAttribute("data-lit", on);
  edge.setAttribute("data-tone", on ? "lit" : edge.dataset.tone0);
};
const appear = (el, key, value) => {
  const v = value.toFixed(3);
  if (shown[key] === v) return;
  shown[key] = v;
  el.setAttribute("opacity", v);
  el.setAttribute("transform", translateAlong(P, [0, 0, (1 - value) * 5]));
  el.setAttribute("display", value > 0.002 ? "inline" : "none");
};
function describe() {
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", spoken[sel]);
  emit();
}
// Tell the step controls under the card which step is showing and whether the tour runs.
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));
function copyText(t) {
  if (t < SHOWS.copyCut) return "-------";
  if (t < SHOWS.copyExtra) return money(STEPS[1].copy);
  if (t < SHOWS.copyGone) return money(STEPS[2].copy);
  if (t < SHOWS.shared) return "-------";
  return money(STEPS[3].copy);
}
function draw(dt) {
  const p = pose(t);
  const cx = TRACER_X - MASTER_X - p.along;
  const cy = PULLED + ((CONTACT_Y - BLADE.back - depthAt(p.along)) - PULLED) * p.engage;
  set(parts.saddle, "sd", translateAlong(P, [cx, 0, 0]));
  set(parts.saddleFront, "sf", translateAlong(P, [cx, 0, 0]));
  const table = translateAlong(P, [cx, cy, 0]);
  set(parts.tableLow, "tl", table);
  set(parts.tableUp, "tu", table);
  const springKey = cy.toFixed(2);
  if (shown.spring !== springKey) {
    shown.spring = springKey;
    const c = coil(SPRING.front + cy, SPRING.post, [SPRING.x, SPRING.z], SPRING.r, 7, "y", P);
    parts.spring.innerHTML = lineSvg(c.back, { tone: "lo" }) + lineSvg(c.front, { tone: "mid" });
  }
  const on = focusAt(t);
  const copyKey = p.cutFrom.toFixed(2) + (on === "copy" ? "*" : "");
  if (shown.copy !== copyKey) { shown.copy = copyKey; parts.copy.innerHTML = keySvg(K, P, COPY_X, 0, KEY_Z, p.cutFrom, on === "copy" ? "lit" : "hi"); }
  if (shown.on !== on) {
    shown.on = on;
    lit(parts.master, on === "master");
    lit(parts.extraOwn, on === "extra", ".dp-tag");
    lit(parts.sleeve, on === "sleeve");
  }
  parts.engrave.setAttribute("width", (12 * p.engrave).toFixed(2));
  set(parts.sleeve, "sl", translateAlong(P, [p.sleeve * SLIDE, 0, 0]));
  parts.own.forEach((el, i) => appear(el, "o" + i, p["own" + i]));
  appear(parts.extraOwn, "xo", p.extraOwn);
  appear(parts.extraShared, "xs", p.extraShared);
  // The cutter's teeth turn while the motor runs.
  spinPhase = (spinPhase + (dt || 0) * p.spin * 28) % FRAMES;
  const f = p.spin > 0.02 ? Math.floor(spinPhase) : 0;
  if (shown.teeth !== f) { shown.teeth = f; teeth.forEach((el, i) => el.setAttribute("display", i === f ? "inline" : "none")); }
  // While the cutter is in the blank, a few chips fly back from the contact, a new spray each frame.
  const cutting = p.engage > 0.9 && p.spin > 0.5 && p.cutFrom > 13.2 && p.cutFrom < 54.8;
  if (cutting) {
    const dots = Array.from({ length: 7 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const r = 1 + Math.random() * 7;
      const [x, y] = iso([CUT_AT[0] + r * Math.cos(a) * 0.6, CUT_AT[1] + r * Math.sin(a), CUT_AT[2] + Math.random() * 2.4 - 0.6], P);
      return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (0.35 + Math.random() * 0.3).toFixed(2) + '"/>';
    }).join("");
    parts.chips.innerHTML = '<g class="iso-dots" data-tone="hi">' + dots + "</g>";
  }
  if (shown.cutting !== cutting) { shown.cutting = cutting; parts.chips.setAttribute("display", cutting ? "inline" : "none"); }
  setText(parts.showA, "sa", money(t >= SHOWS.shared ? STEPS[3].template : STEPS[0].template));
  setText(parts.showB, "sb", copyText(t));
  const warn = t >= SHOWS.shared ? "lit" : "hi";
  if (shown.warn !== warn) { shown.warn = warn; parts.showA.setAttribute("data-tone", warn); }
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
  draw(dt);
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
draw(0);
`;

const name = TEMPLATE.name;
const base3 = groupVND(total(STEPS[0].template));
const steps = STEPS.map((step, i) => ({
  label: step.label,
  short: step.short,
  caption: [
    `Chìa gốc là gói mẫu ${name} mà phòng kinh doanh đã cấu hình sẵn, với ${["không", "một", "hai", "ba", "bốn"][step.template.length]} hạng mục và tổng <strong>${base3} ₫</strong>. Ê-tô bên phải đang giữ một phôi chìa còn trơn.`,
    `Gọi <code>clone()</code> thì đầu dò chạy theo chìa gốc và dao cắt ra một chìa giống hệt. Bản sao có giá riêng với ba hạng mục được chép lại, tổng cũng là <strong>${groupVND(total(STEPS[1].copy))} ₫</strong>.`,
    `Bản sao được khắc tên ${CUSTOMER} và thêm hạng mục ${EXTRA.name} trên giá của riêng nó, nên lên <strong>${groupVND(total(STEPS[2].copy))} ₫</strong>. Chìa gốc vẫn giữ nguyên ${base3} ₫.`,
    `Nếu chỉ sao chép nông, bản sao không có danh sách riêng mà dùng chung giá của chìa gốc. Thêm hạng mục cho ${CUSTOMER} thì gói mẫu cũng đổi theo, lên <strong>${groupVND(total(STEPS[3].template))} ₫</strong>.`,
  ][i],
}));

export const plate = withSteps(k.plateHtml({
  fig: "Fig 16",
  title: "Prototype",
  hint: "Rê chuột để chọn bước",
  readout: `${CUSTOMER} · ${STEPS[START].copy.length} hạng mục · ${groupVND(total(STEPS[START].copy))} ₫`,
  keys: [
    { mark: "lit", label: "Phần thay đổi ở bước đang xem: chìa vừa cắt, hạng mục vừa thêm hoặc ống nối hai giá" },
    { mark: "raised", label: "Thẻ treo trên giá, mỗi thẻ là một hạng mục trong gói dịch vụ" },
  ],
  caption:
    "Máy không cần biết chìa gốc được làm ra sao. Nó chỉ dò theo chìa gốc và cắt ra một bản giống hệt, sau đó bản sao được khắc tên khách và thêm hạng mục trên giá của riêng nó. Ở bước cuối, ống nối gộp hai giá làm một, đúng như một bản sao nông, nên thêm hạng mục cho khách thì gói mẫu cũng đổi theo.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Prototype, dùng phím mũi tên để chọn bước" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${START + 1}">${svg}</div>`,
}), stepsHtml({ label: "Bốn bước sao chép gói mẫu", steps, start: START }));

export const FIGURE_CSS = `
.dp-screen{fill:var(--anatomy-shade-1)}
.dp-wall{fill:var(--anatomy-shade-0)}
.dp-plate{fill:var(--anatomy-top)}
.dp-hole{fill:var(--anatomy-shade-0)}
.dp-digits{letter-spacing:.02em}
.dp-unit{letter-spacing:.08em}
.dp-engraving{letter-spacing:.06em;font-weight:500}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
