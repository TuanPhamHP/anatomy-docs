// The Singleton figure: a database cabinet with 20 connection ports, a dock in
// front of it with three hatches, and three service carts on a cross rail. A
// pool box rises out of a hatch (it is created), slides back and plugs its
// 10 pins into a bay of ports (it opens 10 connections). A cart pushes its
// lead into a tap on a box to hold that pool.
// Without a singleton every service creates its own box: two bays fill the
// database's 20 ports and the third box knocks on a blank cover. With one, the
// first call creates box #1 and every later call leads into the same box.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/tuanpham/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { stepsHtml, withSteps } from "../_shared/page.mjs";
import { DB_PORTS, POOL_SIZE, SERVICES, STEPS, holding, ports } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 380;

const PLATE = { x: -130, y: -92, w: 144, d: 184, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Database cabinet: ports on its +x face, counters on its +y face.
const CAB = { x: -122, y: -76, w: 34, d: 152, r: 3 };
const CAB_TOP = 34;
const PLINTH = { x: -124, y: -78, w: 38, d: 156, r: 2 };
const FACE = CAB.x + CAB.w + 1; // front of the bay plates
const LANES = [-48, 0, 48];
const BAYS = 2; // DB_PORTS / POOL_SIZE: only the first two lanes have ports
const PORT_Y = [-12, -6, 0, 6, 12];
const PORT_Z = [10, 17];
const PORT_R = 1.2;

// Pool boxes: they rest over a hatch, rise out of it and slide back to dock.
const BOX_W = 22;
const BOX_D = 32;
const BOX_H = 21;
const PIN_LEN = 8;
const REST_X = -76;
const DOCK = FACE - REST_X; // negative: the slide toward the cabinet
const CONTACT = FACE + PIN_LEN - REST_X; // where the pins touch a blank cover
const SINK = 25;
const HOLE = (L) => ({ x: FACE + 2, y: L - 17, w: REST_X + BOX_W + 1 - FACE - 2, d: 34, r: 1.5 });
const TAP = 11;
const TAP_Z = 12;

// Service carts on a cross rail; each pushes a lead into a tap.
const RAIL = { x: -31, y: -82, w: 14, d: 164, r: 1.5 };
const RAIL_H = 3.5;
const CART = { x: -34, w: 22, d: 9.6 };
const CART_Z = [5.5, 20.5];
const ROD_R = 1.1;
const ROD_TIP = CART.x - 2; // lead tip when stowed
const ROD_EXT = ROD_TIP - (REST_X + DOCK + BOX_W - 2); // stroke to seat in a docked box's tap
const OWN_Y = SERVICES.map((_, c) => LANES[c] + (c - 1) * TAP);
const SHARED_Y = SERVICES.map((_, c) => LANES[0] + (c - 1) * TAP);

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(CAB, 0, CAB_TOP + 2)],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 40 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const NEG_X = [-1, 0, 0];
const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const hullPath = (points) => k.pathOf(G.hullOf(points.map(at)), true);
// Screen hull of a circle in a y-z plane, swept along x and down: a moving pin or lead stays inside it.
const sweptDisc = (y, z, r, xs, zs) => hullPath(xs.flatMap((x) => zs.flatMap((dz) => Array.from({ length: 24 }, (_, i) => [x, y + r * Math.cos((i / 24) * 2 * Math.PI), z + dz + r * Math.sin((i / 24) * 2 * Math.PI)]))));
const boxHull = (plan, z0, z1) => hullPath(k.boxCorners(plan, z0, z1));

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
  // Position scale in front of the cart rail: a major tick under each lane's tap.
  const ruler = { x: -11, y: -76, w: 6, d: 152, r: 1 };
  out.push(S(k.slabOf(ruler, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-72, 72, 4, 6, ruler.x + 0.8, 0.6, [1.8, 3.4], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([ruler.x + 3, ruler.y + 2, 0.6]), at([ruler.x + 3, ruler.y + ruler.d - 2, 0.6])], { size: 0.45 }));
  // Label plate at the near corner.
  const label = { x: 1, y: 44, w: 10, d: 30, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.5), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[4.4, 22], [6.6, 15], [8.8, 19]].map(([x, w]) => k.lineOnTop([x, 69], [x, 69 - w], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 5, label.y + 2.4, 0.8]), at([label.x + 5, label.y + label.d - 2.4, 0.8])], { size: 0.4 }));
  return out.join("");
}

// A hatch in the floor: the opening, its two far walls, and the shaft's dark floor.
function well(Ly, index) {
  const h = HOLE(Ly);
  const x0 = h.x, x1 = h.x + h.w, y0 = h.y, y1 = h.y + h.d;
  const quad = (points) => k.pathOf(points.map(at), true);
  return `<clipPath id="sg-well-${index}"><path d="${k.planOutline(h, 0, P, 4)}"/></clipPath>
    <path class="sg-shaft" d="${k.planOutline(h, 0, P, 4)}"/>
    <g clip-path="url(#sg-well-${index})">
      <path class="sg-wall" d="${quad([[x0, y0, 0], [x0, y1, 0], [x0, y1, -30], [x0, y0, -30]])}"/>
      <path class="sg-wall-side" d="${quad([[x0, y0, 0], [x1, y0, 0], [x1, y0, -30], [x0, y0, -30]])}"/>
      ${L(k.segment([x0, y0, 0], [x0, y0, -30], P), { tone: "faint" })}
    </g>
    ${L(k.planOutline(h, 0, P, 4), { tone: "lo" })}`;
}

function cabinet() {
  const out = [];
  out.push(S(k.slabOf(PLINTH, 0, 3, P, 4, 0.5), { tone: "mid" }));
  const seam = k.sideSeam(CAB, CAB_TOP - 5, P, 6);
  out.push(S(k.slabOf(CAB, 3, CAB_TOP - 3, P, 6, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) }));
  // Lid: vents, a label plate and the port lamps, one per port above each bay.
  out.push(L(k.planOutline(k.insetPlan(CAB, 3), CAB_TOP, P, 6), { tone: "faint" }));
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: -116, y: 50 + i * 5, w: 12, d: 2.2, r: 1.1 }, CAB_TOP, P, 3), { tone: "lo" }));
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: -116, y: -69 + i * 5, w: 12, d: 2.2, r: 1.1 }, CAB_TOP, P, 3), { tone: "lo" }));
  out.push(D([[-120.4, -74.4], [-89.6, -74.4], [-120.4, 74.4], [-89.6, 74.4]].map(([x, y]) => at([x, y, CAB_TOP])), { size: 0.45 }));
  const tag = { x: -116, y: 25, w: 12, d: 18, r: 1 };
  out.push(S(k.slabOf(tag, CAB_TOP, 0.6, P, 3), { tone: "lo", crease: "none" }));
  out.push(`<g transform="${k.topMatrix([tag.x + 8.4, tag.y + tag.d - 2.4], CAB_TOP + 0.6, P, "y")}"><text class="iso-face-text sg-engrave" data-tone="mid" x="0" y="0" font-size="4.2">CSDL</text></g>`);
  out.push(`<g transform="${k.topMatrix([tag.x + 3.6, tag.y + tag.d - 2.4], CAB_TOP + 0.6, P, "y")}"><text class="iso-face-text sg-engrave" data-tone="lo" x="0" y="0" font-size="2.6">${DB_PORTS} CỔNG</text></g>`);
  for (let b = 0; b < BAYS; b++) {
    const lamps = [];
    for (const x of [-99, -94]) for (const dy of PORT_Y) lamps.push([x, LANES[b] + dy]);
    out.push(`<g data-part="lamps" data-bay="${b}">${lamps.map(([x, y]) => S(k.cylinder(x, y, 1.5, CAB_TOP, 0.7, P, 16), { tone: "lo", crease: "none" }) + `<path class="sg-lamp" d="${k.ring(x, y, 0.9, CAB_TOP + 0.7, P, 14)}"/>`).join("")}</g>`);
    out.push(L(k.planOutline({ x: -101.6, y: LANES[b] - 14.6, w: 10.2, d: 29.2, r: 1.6 }, CAB_TOP, P, 4), { tone: "faint" }));
  }
  // Bay plates with ports, and the blank cover where a third bay would be.
  LANES.forEach((Ly, b) => {
    const plate = { x: FACE - 1, y: Ly - 17, w: 1, d: 34, r: 0.6 };
    out.push(S(k.slabOf(plate, 4, 21, P, 3), { tone: b < BAYS ? "mid" : "lo" }));
    const screws = [[Ly - 15, 6], [Ly + 15, 6], [Ly - 15, 23], [Ly + 15, 23]].map(([y, z]) => at([FACE, y, z]));
    out.push(D(screws, { size: 0.45 }));
    // Engraved range above each bay; the third place has no ports to number.
    const range = b < BAYS ? `CỔNG ${b * POOL_SIZE + 1}–${(b + 1) * POOL_SIZE}` : "KHÔNG CÓ CỔNG";
    out.push(`<g transform="${k.sideMatrix([FACE - 1, Ly + 15], 30.6, P, "right")}"><text class="iso-face-text sg-label" data-tone="lo" x="0" y="0" font-size="2.6">${range}</text></g>`);
    if (b < BAYS) {
      for (const z of PORT_Z) for (const dy of PORT_Y) {
        const F = G.frameAlong([FACE, Ly + dy, z], [1, 0, 0]);
        out.push(`<path class="sg-port" d="${G.circleOf(F, 0, PORT_R + 0.35, P, 20)}"/>`, L(G.circleOf(F, 0, PORT_R + 0.35, P, 20), { tone: "lo" }));
      }
    } else {
      // Blanking plate: two engraved bars and a centre bolt.
      const M = k.sideMatrix([FACE, Ly + 12], 19, P, "right");
      out.push(`<g transform="${M}"><path class="iso-line" data-tone="lo" d="${rrect(0, 0, 24, 3, 1.5)}${rrect(0, 7, 24, 3, 1.5)}"/></g>`);
      out.push(L(k.sideRing([FACE, Ly, 13], 1.8, "x", P), { tone: "lo" }), D([at([FACE, Ly, 13])], { size: 0.5 }));
    }
  });
  out.push(counters());
  return out.join("");
}

// Two counters on the cabinet's +y face: ports in use and pools created.
const WIN = [
  { z: 29, label: "CỔNG ĐANG DÙNG", part: "ports", text: `0/${DB_PORTS}` },
  { z: 15, label: "SỐ POOL", part: "pools", text: "0" },
];
function counters() {
  const out = [];
  const y = CAB.y + CAB.d;
  for (const win of WIN) {
    const M = k.sideMatrix([CAB.x + 4, y], win.z, P, "left");
    out.push(`<g transform="${M}">
      <text class="iso-face-text sg-label" data-tone="lo" x="0.4" y="-1.4" font-size="2.4">${win.label}</text>
      <clipPath id="sg-win-${win.part}"><path d="${rrect(0, 0, 26, 8, 1.4)}"/></clipPath>
      <path class="sg-screen" d="${rrect(0, 0, 26, 8, 1.4)}"/>
      <g clip-path="url(#sg-win-${win.part})"><path class="sg-screen-wall" d="M0 0H26V1H1V8H0Z"/>
      <text class="iso-face-text sg-digits" data-part="${win.part}" data-tone="hi" x="24" y="6.6" font-size="6" text-anchor="end">${win.text}</text></g>
      <path class="iso-line" data-tone="lo" d="${rrect(0, 0, 26, 8, 1.4)}"/>
    </g>`);
  }
  out.push(D([[CAB.x + 2, CAB_TOP - 2], [CAB.x + CAB.w - 2, CAB_TOP - 2], [CAB.x + 2, 5.5], [CAB.x + CAB.w - 2, 5.5]].map(([x, z]) => at([x, y, z])), { size: 0.45 }));
  return out.join("");
}

function guide(Ly, side) {
  const plan = { x: FACE, y: Ly + side * 18.6 - 1, w: REST_X + BOX_W + 4 - FACE, d: 2, r: 0.6 };
  return S(k.slabOf(plan, 0, 2.6, P, 3, 0.3), { tone: "mid" }) + D([at([plan.x + 3, plan.y + 1, 2.6]), at([plan.x + plan.w - 3, plan.y + 1, 2.6])], { size: 0.35 });
}

// The lift platform under a box: flush with the floor when up, a hatch lid.
function platform(Ly) {
  const h = HOLE(Ly);
  const plan = k.insetPlan(h, 0.7);
  return S(k.slabOf(plan, -2.4, 2.4, P, 3), { tone: "lo", crease: "none" }) + D(k.corners(plan, 2.4).map(([x, y]) => at([x, y, 0])), { size: 0.35 });
}

// The box's 10 pins, on its -x face (identical on every box and every port bay).
function pins(Ly) {
  const out = [];
  for (const z of PORT_Z) for (const dy of PORT_Y) {
    const F = G.frameAlong([REST_X, Ly + dy, z], NEG_X);
    out.push(S(G.solidOf([[0, PORT_R], [PIN_LEN - 0.8, PORT_R], [PIN_LEN, PORT_R - 0.5]], F, P), { tone: "hi", crease: "lo" }));
  }
  return out.join("");
}

function poolBox(Ly, index) {
  const out = [];
  const plan = { x: REST_X, y: Ly - BOX_D / 2, w: BOX_W, d: BOX_D, r: 2 };
  const seam = k.sideSeam(plan, 4, P, 4);
  out.push(`<g data-part="body">${S(k.slabOf(plan, 0, BOX_H, P, 4, 1), { tone: "hi", crease: "lo", inner: L(seam, { tone: "faint" }) })}</g>`);
  // +y face: cooling grooves.
  const M = k.sideMatrix([plan.x + 3, plan.y + plan.d], 16, P, "left");
  out.push(`<g transform="${M}"><path class="iso-line" data-tone="faint" d="${[0, 2.6, 5.2, 7.8].map((v) => rrect(0, v, 16, 1.2, 0.6)).join("")}"/></g>`);
  // +x face: three taps, so services can lead into the same pool.
  const face = plan.x + plan.w;
  for (const dy of [-TAP, 0, TAP]) {
    const F = G.frameAlong([face, Ly + dy, TAP_Z], [1, 0, 0]);
    out.push(S(G.disc(0, 0.8, 3.1, F, P), { tone: "mid", crease: "none" }));
    out.push(`<path class="sg-port" d="${G.circleOf(F, 0.8, 1.7, P, 20)}"/>`, L(G.circleOf(F, 0.8, 1.7, P, 20), { tone: "lo" }));
  }
  const strip = k.sideMatrix([face, Ly + 13], 18.4, P, "right");
  out.push(`<g transform="${strip}"><path class="iso-line" data-tone="faint" d="${rrect(0, 0, 26, 2.4, 1.2)}"/></g>`);
  // Lid: the instance tag and two screws; a flag slot near the back.
  const tag = { x: plan.x + 4, y: Ly - 9, w: 14, d: 16, r: 1.2 };
  out.push(S(k.slabOf(tag, BOX_H, 0.5, P, 3), { tone: "mid", crease: "none" }));
  out.push(`<g transform="${k.topMatrix([tag.x + 9.6, tag.y + tag.d - 2.6], BOX_H + 0.5, P, "y")}"><text class="iso-face-text sg-tag" data-tone="hi" x="0" y="0" font-size="7.4">#${index + 1}</text></g>`);
  out.push(D([at([plan.x + 2.4, Ly + 13.4, BOX_H]), at([plan.x + BOX_W - 2.4, Ly - 13.4, BOX_H])], { size: 0.4 }));
  out.push(L(k.planOutline(FLAG_SLOT(Ly), BOX_H, P, 2), { tone: "lo" }));
  return out.join("");
}

// The error flag: a plate that rises out of a slot in the lid when the pool could not open.
const FLAG_SLOT = (Ly) => ({ x: REST_X + 3, y: Ly + 11.6, w: 7, d: 1.6, r: 0.5 });
function flag(Ly, index) {
  const slot = FLAG_SLOT(Ly);
  const plate = { x: slot.x + 0.4, y: slot.y + 0.3, w: slot.w - 0.8, d: 1, r: 0.3 };
  const clip = boxHull(slot, BOX_H, BOX_H + 40);
  const M = k.sideMatrix([plate.x + 1.4, plate.y + plate.d], BOX_H - 0.6, P, "left");
  return `<clipPath id="sg-flag-${index}"><path d="${clip}"/></clipPath>
    <g clip-path="url(#sg-flag-${index})"><g data-part="flag">${S(k.slabOf(plate, BOX_H - 9.2, 9, P, 2), { tone: "hi", crease: "lo" })}
    <g transform="${M}"><path class="iso-line" data-tone="lo" d="M0.4 0.6L3.2 3.4M3.2 0.6L0.4 3.4"/></g></g></g>`;
}

// Hatch doors: two leaves that slide apart under the floor while a box goes through.
function doors(Ly, index) {
  const h = HOLE(Ly);
  const half = h.d / 2;
  const leaf = (y, side) => {
    const plan = { x: h.x + 0.3, y, w: h.w - 0.6, d: half - 0.3, r: 0.6 };
    const grip = { x: h.x + h.w / 2 - 5, y: side < 0 ? y + plan.d - 4.4 : y + 2.4, w: 10, d: 2, r: 1 };
    return `<g data-part="door" data-side="${side}">${S(k.slabOf(plan, -0.6, 0.6, P, 3), { tone: "lo", crease: "none" })}${L(k.planOutline(grip, 0, P, 3), { tone: "lo" })}</g>`;
  };
  return `<g clip-path="url(#sg-well-${index})">${leaf(h.y + 0.3, -1)}${leaf(h.y + half, 1)}</g>`;
}

function lane(Ly, index) {
  const chimney = [boxHull(HOLE(Ly), 0, 60), boxHull({ x: FACE - 0.5, y: Ly - 16.6, w: REST_X + BOX_W - FACE + 1, d: 33.2 }, 0, 60)];
  const pinClip = [];
  for (const z of PORT_Z) for (const dy of PORT_Y) pinClip.push(sweptDisc(Ly + dy, z, PORT_R + 0.6, [FACE, REST_X + 4], [0, -SINK - 2]));
  return `<g data-part="lane" data-lane="${index}">
    ${guide(Ly, -1)}
    <clipPath id="sg-chimney-${index}">${chimney.map((d) => `<path d="${d}"/>`).join("")}</clipPath>
    <clipPath id="sg-pins-${index}">${pinClip.map((d) => `<path d="${d}"/>`).join("")}</clipPath>
    <g clip-path="url(#sg-chimney-${index})">
      <g data-part="platform">${platform(Ly)}</g>
      <g clip-path="url(#sg-pins-${index})"><g data-part="box-move">${pins(Ly)}</g></g>
      <g data-part="box-move" data-box="${index}">${poolBox(Ly, index)}${flag(Ly, index)}</g>
      ${doors(Ly, index)}
    </g>
    ${guide(Ly, 1)}
  </g>`;
}

function rail() {
  const out = [];
  out.push(S(k.slabOf(RAIL, 0, RAIL_H, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.lineOnTop([RAIL.x + 4, RAIL.y + 3], [RAIL.x + 4, RAIL.y + RAIL.d - 3], RAIL_H, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([RAIL.x + RAIL.w - 4, RAIL.y + 3], [RAIL.x + RAIL.w - 4, RAIL.y + RAIL.d - 3], RAIL_H, P), { tone: "faint" }));
  out.push(D([-74, -24, 24, 74].map((y) => at([RAIL.x + RAIL.w / 2, y, RAIL_H])), { size: 0.4 }));
  return out.join("");
}

function railStop(y) {
  const plan = { x: RAIL.x - 1, y, w: RAIL.w + 2, d: 3.4, r: 0.8 };
  return S(k.slabOf(plan, 0, 8, P, 3, 0.4), { tone: "mid" }) + D([at([plan.x + 3, y + 1.7, 8]), at([plan.x + plan.w - 3, y + 1.7, 8])], { size: 0.4 });
}

// One service cart: its lead (clipped to where it leaves the cart), carriage, body, window and tag.
function cart(c) {
  const y0 = OWN_Y[c];
  const body = { x: CART.x, y: y0 - CART.d / 2, w: CART.w, d: CART.d, r: 1.4 };
  const F = G.frameAlong([ROD_TIP, y0, TAP_Z], [1, 0, 0]);
  const lead = S(G.solidOf([[0, 0.9], [0.6, 1.4], [3.4, 1.4], [3.4, ROD_R], [ROD_EXT + 4, ROD_R]], F, P), { tone: "hi", crease: "lo" });
  const clip = sweptDisc(y0, TAP_Z, 1.9, [CART.x + 1, ROD_TIP - ROD_EXT - 6], [0]);
  const out = [`<clipPath id="sg-lead-${c}"><path d="${clip}"/></clipPath><g clip-path="url(#sg-lead-${c})"><g data-part="lead">${lead}</g></g>`];
  out.push(S(k.slabOf({ x: CART.x + 1, y: y0 - 5.1, w: CART.w - 2, d: 10.2, r: 1 }, RAIL_H, CART_Z[0] - RAIL_H, P, 3, 0.3), { tone: "mid" }));
  out.push(`<g data-part="cart-body">${S(k.slabOf(body, CART_Z[0], CART_Z[1] - CART_Z[0], P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(body, 9, P, 3), { tone: "faint" }) })}</g>`);
  // Window on the +x face: which pool this service holds.
  const M = k.sideMatrix([CART.x + CART.w, y0 + 3.8], CART_Z[1] - 1.6, P, "right");
  out.push(`<g transform="${M}">
    <clipPath id="sg-cw-${c}"><path d="${rrect(0, 0, 7.6, 5.4, 0.9)}"/></clipPath>
    <path class="sg-screen" d="${rrect(0, 0, 7.6, 5.4, 0.9)}"/>
    <g clip-path="url(#sg-cw-${c})"><text class="iso-face-text sg-digits" data-part="held" data-tone="lo" x="3.8" y="4.4" font-size="3.3" text-anchor="middle">--</text></g>
    <path class="iso-line" data-tone="lo" d="${rrect(0, 0, 7.6, 5.4, 0.9)}"/>
  </g>`);
  // Lid: the service's tag and the call button.
  out.push(`<g transform="${k.topMatrix([CART.x + 17.6, y0 + 3.4], CART_Z[1], P, "y")}"><text class="iso-face-text sg-engrave" data-tone="mid" x="0" y="0" font-size="4.6">${SERVICES[c].short}</text></g>`);
  out.push(`<g data-part="button">${S(k.cylinder(CART.x + 5, y0, 2.4, CART_Z[1], 1.4, P, 20), { tone: "hi", crease: "lo" })}</g>`);
  out.push(L(k.ring(CART.x + 5, y0, 3.2, CART_Z[1], P, 20), { tone: "lo" }));
  out.push(D([at([CART.x + CART.w - 2, y0 - 3.4, CART_Z[1]]), at([CART.x + CART.w - 2, y0 + 3.4, CART_Z[1]])], { size: 0.35 }));
  return `<g data-part="cart" data-cart="${c}">${out.join("")}</g>`;
}

const START = 3; // rest on the whole story: three services, one pool
export const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Hình vẽ một tủ cơ sở dữ liệu có 20 cổng kết nối, chia thành hai cụm 10 cổng, còn chỗ của cụm thứ ba chỉ là một tấm che trơn. Trước tủ có ba cửa sàn. Mỗi hộp pool trồi lên từ một cửa sàn rồi lùi vào, cắm 10 chân vào một cụm cổng. Ba xe service chạy trên ray ngang, mỗi xe đẩy một cần cắm vào lỗ trên mặt hộp. Khi mỗi service tự tạo pool, hai hộp đầu chiếm hết 20 cổng, còn hộp thứ ba đâm vào tấm che rồi bật cờ lỗi. Với Singleton, chỉ một hộp #1 được tạo và cả ba xe cùng cắm vào nó.",
  body: [
    base(),
    LANES.map(well).join(""),
    cabinet(),
    LANES.map(lane).join(""),
    rail(),
    railStop(RAIL.y - 3.4),
    SERVICES.map((_, c) => cart(c)).join(""),
    railStop(RAIL.y + RAIL.d),
  ],
});

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const DOCK = ${DOCK}, CONTACT = ${CONTACT}, SINK = ${SINK}, ROD_EXT = ${ROD_EXT}, HALF = ${HOLE(0).d / 2};
const OWN_Y = ${JSON.stringify(OWN_Y)}, SHARED_Y = ${JSON.stringify(SHARED_Y)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const lanes = [...svg.querySelectorAll('[data-part="lane"]')].map((el) => ({
  move: el.querySelectorAll('[data-part="box-move"]'),
  platform: el.querySelector('[data-part="platform"]'),
  body: el.querySelector('[data-part="body"] > .iso-solid'),
  flag: el.querySelector('[data-part="flag"]'),
  flagSolid: el.querySelector('[data-part="flag"] > .iso-solid'),
  doors: [...el.querySelectorAll('[data-part="door"]')],
}));
const carts = [...svg.querySelectorAll('[data-part="cart"]')].map((el) => ({
  el,
  lead: el.querySelector('[data-part="lead"]'),
  button: el.querySelector('[data-part="button"]'),
  held: el.querySelector('[data-part="held"]'),
}));
const lamps = [...svg.querySelectorAll('[data-part="lamps"]')];
const portsText = svg.querySelector('[data-part="ports"]');
const poolsText = svg.querySelector('[data-part="pools"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

// Live state. A box carries the scenario it was created in: switching scenario
// is a fresh process, so every box goes back down before anything is created.
let sel = ${START};
const boxes = [0, 1, 2].map(() => ({ x: 0, z: -SINK, door: 0, flag: 0, knocked: false, gen: -1 }));
const cs = OWN_Y.map((y) => ({ y, rod: 0, press: 0 }));
let gen = 0, scenario = null;
let frame = 0, last = 0, dwell = 0, touring = !still.matches, visible = false, idleTimer = 0, settled = false;
const DWELL = 3.4;
const follow = (value, target, dt, tau, calm) => {
  if (calm) return target;
  const next = value + (target - value) * (1 - Math.exp(-dt / tau));
  return Math.abs(target - next) < 0.03 ? target : next;
};
const near = (a, b, eps = 0.05) => Math.abs(a - b) < eps;
const emit = () => stage.dispatchEvent(new CustomEvent("dp:state", { detail: { index: sel, touring } }));

function wanted(step, i) {
  return step.shared ? i === 0 && step.calls >= 1 : i < step.calls;
}
// Which box a cart leads into for this step, or -1.
function leadsTo(step, c) {
  if (c >= step.calls) return -1;
  const pool = step.held[c];
  if (!pool.ok) return -1;
  return step.shared ? 0 : c;
}
// Where a cart waits: at its own lane until it calls, at the shared box once it has.
const cartTarget = (step, c) => (step.shared && c < step.calls ? SHARED_Y[c] : OWN_Y[c]);
// The box whose lane a cart's lead is in right now, judged by position.
const laneOf = (y) => (y < -24 ? 0 : y < 24 ? 1 : 2);

function update(dt, calm) {
  const step = STEPS[sel];
  const key = step.shared ? "shared" : "own";
  if (scenario !== key) { scenario = key; gen++; }
  // Leads first: a lead comes out before its cart moves or its box leaves.
  cs.forEach((cart, c) => {
    const target = cartTarget(step, c);
    const to = leadsTo(step, c);
    const box = to >= 0 ? boxes[to] : null;
    const ready = box && box.gen === gen && near(box.x, DOCK) && box.z === 0;
    const seat = to >= 0 && near(cart.y, target, 0.08) && ready;
    cart.rod = follow(cart.rod, seat ? ROD_EXT : 0, dt, 0.16, calm);
    if (cart.rod < 0.4 || near(cart.y, target, 0.08)) cart.y = follow(cart.y, target, dt, 0.24, calm);
    // The call button stays down while the service waits for its pool.
    const calling = c < step.calls && !(to >= 0 ? cart.rod > ROD_EXT - 0.5 : boxes[c].flag > 0.9);
    cart.press = follow(cart.press, calling ? 1 : 0, dt, 0.08, calm);
  });
  boxes.forEach((box, i) => {
    const plugged = cs.some((cart) => cart.rod > 0.4 && laneOf(cart.y) === i);
    if (!(wanted(step, i) && box.gen === gen)) {
      // Unplug, slide out over the hatch, sink, then close the doors.
      box.flag = follow(box.flag, 0, dt, 0.12, calm);
      if (!plugged && box.flag < 0.05) box.x = follow(box.x, 0, dt, 0.16, calm);
      if (box.x === 0 && box.z > -SINK) box.z = follow(box.z, -SINK, dt, 0.17, calm);
      if (box.z === -SINK) {
        if (wanted(step, i)) { box.gen = gen; box.knocked = false; }
        else box.door = follow(box.door, 0, dt, 0.1, calm);
      }
      return;
    }
    // Open the doors and rise (the pool is created), then dock, or knock on the blank cover and back off.
    if (box.z < 0) {
      box.door = follow(box.door, 1, dt, 0.1, calm);
      if (box.door === 1) box.z = follow(box.z, 0, dt, 0.17, calm);
    }
    if (box.z !== 0) return;
    const ok = step.shared || step.held[i].ok;
    if (ok) box.x = follow(box.x, DOCK, dt, 0.16, calm);
    else if (!box.knocked) { box.x = follow(box.x, CONTACT, dt, 0.12, calm); if (near(box.x, CONTACT, 0.1)) box.knocked = true; }
    else { box.x = follow(box.x, 0, dt, 0.16, calm); if (box.x === 0) box.flag = follow(box.flag, 1, dt, 0.12, calm); }
  });
}

function draw() {
  const step = STEPS[sel];
  boxes.forEach((box, i) => {
    const lane = lanes[i];
    const t = translateAlong(P, [box.x, 0, box.z]);
    lane.move.forEach((el) => el.setAttribute("transform", t));
    lane.platform.setAttribute("transform", translateAlong(P, [0, 0, box.z]));
    lane.doors.forEach((el) => el.setAttribute("transform", translateAlong(P, [0, Number(el.dataset.side) * box.door * (HALF + 2), 0])));
    lane.flag.setAttribute("transform", translateAlong(P, [0, 0, box.flag * 8.6]));
    const lit = step.shared && i === 0 && box.gen === gen && near(box.x, DOCK);
    lane.body.toggleAttribute("data-lit", lit);
    lane.body.querySelector(".iso-edge").setAttribute("data-tone", lit ? "lit" : "hi");
    const flagLit = box.flag > 0.5;
    lane.flagSolid.toggleAttribute("data-lit", flagLit);
    lane.flagSolid.querySelector(".iso-edge").setAttribute("data-tone", flagLit ? "lit" : "hi");
  });
  cs.forEach((cart, c) => {
    const view = carts[c];
    view.el.setAttribute("transform", translateAlong(P, [0, cart.y - OWN_Y[c], 0]));
    view.lead.setAttribute("transform", translateAlong(P, [-cart.rod, 0, 0]));
    view.button.setAttribute("transform", translateAlong(P, [0, 0, -cart.press]));
    const to = leadsTo(step, c);
    const done = to >= 0 ? cart.rod > ROD_EXT - 0.3 : c < step.calls && boxes[c].flag > 0.9;
    const text = done ? holding(step, c) : "--";
    if (view.held.textContent !== text) {
      view.held.textContent = text;
      view.held.setAttribute("data-tone", done ? "hi" : "lo");
    }
  });
  // The counters read the machine: ports held by docked boxes, boxes standing above the floor.
  const docked = boxes.map((box) => near(box.x, DOCK, 0.6) && box.z === 0);
  lamps.forEach((el, b) => el.toggleAttribute("data-on", docked[b]));
  const used = docked.filter(Boolean).length * POOL_SIZE;
  const made = boxes.filter((box) => box.z > -SINK / 2).length;
  portsText.textContent = ports(used);
  poolsText.textContent = String(made);
  const text = settled ? summary(step) : step.shared ? STEPS[sel].calls === 1 ? "get_pool() tạo pool #1" : SERVICES[step.calls - 1].short + " gọi get_pool()" : "mỗi service tự tạo pool";
  if (readout.textContent !== text) readout.textContent = text;
}
const summary = (step) => step.shared
  ? SERVICES[step.calls - 1].short + " → pool #1 · " + step.pools.length + " pool, cổng " + ports(step.used)
  : step.pools.length + " pool · cần " + step.pools.length * POOL_SIZE + " > " + DB_PORTS + " cổng";

function isSettled() {
  const step = STEPS[sel];
  const boxesDone = boxes.every((box, i) => {
    if (!(wanted(step, i) && box.gen === gen)) return box.z === -SINK && box.x === 0 && box.flag === 0 && box.door === 0 && !wanted(step, i);
    const ok = step.shared || step.held[i].ok;
    return box.z === 0 && box.door === 1 && (ok ? box.x === DOCK : box.knocked && box.x === 0 && box.flag === 1);
  });
  const cartsDone = cs.every((cart, c) => {
    const target = cartTarget(step, c);
    return cart.y === target && cart.rod === (leadsTo(step, c) >= 0 ? ROD_EXT : 0) && cart.press === 0;
  });
  return boxesDone && cartsDone;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  // Under reduced motion every gate opens in turn within one frame.
  for (let i = 0; i < (calm ? 12 : 1); i++) update(dt, calm);
  settled = isSettled();
  if (touring && settled) {
    dwell += dt;
    if (dwell > DWELL) { dwell = 0; sel = (sel + 1) % STEPS.length; settled = false; emit(); }
  }
  draw();
  frame = visible && !(settled && !touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// A hover pauses the tour for a moment; a tap, a key or a step button holds the
// chosen step until the reader presses play again.
const choose = (index, hold) => {
  touring = false;
  dwell = 0;
  clearTimeout(idleTimer);
  idleTimer = hold ? 0 : setTimeout(() => { idleTimer = 0; touring = !still.matches; dwell = 0; emit(); run(); }, 3600);
  if (index !== sel) { sel = index; settled = false; }
  emit();
  run();
};
stage.addEventListener("dp:select", (event) => choose(event.detail.index, true));
stage.addEventListener("dp:play", () => { clearTimeout(idleTimer); idleTimer = 0; touring = true; dwell = 0; emit(); run(); });
stage.addEventListener("dp:pause", () => { clearTimeout(idleTimer); idleTimer = 0; touring = false; emit(); run(); });
const hint = document.querySelector('.iso-plate-corner[data-corner="hint"]');
if (hint && matchMedia("(hover: none) and (pointer: coarse)").matches) hint.textContent = "Chạm để sang bước tiếp";
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse" && touring) choose(sel, false); });
// While the mouse stays over a briefly paused figure, keep it paused.
stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse" && idleTimer) choose(sel, false); });
stage.addEventListener("click", () => choose((sel + 1) % STEPS.length, true));
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
emit();
draw();
`;

// Small counts read as words in the captions: "hai pool đầu", "pool thứ ba".
const WORDS = ["không", "một", "hai", "ba", "bốn", "năm"];
const say = (n) => WORDS[n] ?? String(n);
const caption = (step) => {
  if (!step.shared) {
    const ok = step.pools.filter((pool) => pool.ok);
    const word = say(ok.length);
    return `Khi chưa có Singleton, mỗi service tự gọi <code>ConnectionPool()</code>. ${word[0].toUpperCase() + word.slice(1)} pool đầu đã chiếm hết <strong>${ports(step.used)}</strong> cổng, nên pool thứ ${say(step.pools.length)} bị từ chối vì ${say(step.pools.length)} pool cần tới ${step.pools.length * POOL_SIZE} cổng.`;
  }
  const service = SERVICES[step.calls - 1];
  if (step.calls === 1) return `${service.name} là service đầu tiên gọi <code>get_pool()</code>. Lúc này chưa có pool nào, nên <strong>pool #1</strong> được tạo và mở ${POOL_SIZE} kết nối, chiếm ${ports(step.used)} cổng.`;
  return `${service.name} cũng gọi <code>get_pool()</code>, nhưng pool đã có sẵn nên nó nhận lại đúng <strong>pool #1</strong>. Hệ thống vẫn chỉ có ${say(step.pools.length)} pool, chiếm ${ports(step.used)} cổng.`;
};
const steps = STEPS.map((step, i) => ({
  label: i === 0 ? "Mỗi service tự tạo" : `${SERVICES[step.calls - 1].name} gọi`,
  short: i === 0 ? "Riêng" : SERVICES[step.calls - 1].short,
  caption: caption(step),
}));

const first = STEPS[START];
export const plate = withSteps(k.plateHtml({
  fig: "Fig 14",
  title: "Singleton",
  hint: "Bấm để sang bước tiếp",
  readout: `${SERVICES[first.calls - 1].short} → pool #1 · ${first.pools.length} pool, cổng ${ports(first.used)}`,
  keys: [
    { mark: "lit", label: "Pool #1, instance duy nhất mà mọi service đều nhận được" },
    { mark: "raised", label: "Xe service, với cần cắm vào hộp là tham chiếu tới pool đó" },
  ],
  caption:
    `Cơ sở dữ liệu chỉ có ${DB_PORTS} cổng mà mỗi pool đã chiếm ${POOL_SIZE}, nên nếu mỗi service tự tạo pool thì đến pool thứ ba sẽ không còn cổng để mở. Singleton trả về cùng một hộp cho mọi lời gọi get_pool(). Lần đầu nó tạo hộp, các lần sau chỉ cắm thêm vào hộp đó, nên lúc nào cũng chỉ có một pool.`,
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Singleton, bấm hoặc dùng phím mũi tên để sang bước tiếp">${svg}</div>`,
}), stepsHtml({ label: "Các bước tạo và dùng chung pool", steps, start: START }));

export const FIGURE_CSS = `
.sg-shaft{fill:var(--anatomy-shade-0)}
.sg-wall{fill:var(--anatomy-shade-1)}
.sg-wall-side{fill:var(--anatomy-shade-0)}
.sg-port{fill:var(--anatomy-shade-0)}
.sg-screen{fill:var(--anatomy-shade-1)}
.sg-screen-wall{fill:var(--anatomy-shade-0)}
.sg-plate{fill:var(--anatomy-top)}
.sg-lamp{fill:var(--anatomy-top);stroke:var(--anatomy-lo);stroke-width:.4}
[data-on] > .sg-lamp{fill:var(--anatomy-hi);stroke:var(--anatomy-hi)}
.sg-digits{letter-spacing:.04em}
.sg-label{letter-spacing:.08em}
.iso-stage{touch-action:pan-y;cursor:pointer;overflow:hidden}
@media (max-width:520px){.iso-plate .iso-stage .iso-svg{width:112%;margin:-3% -6% -2%}}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

export { kitScript };
