// The Decorator figure's moving parts, as pure functions of their state. The
// build imports this module to draw the resting pose, and figure.mjs inlines it
// into the page (without the `export`s), so a ring or the ram moves along the
// same path in the browser as in the build.

// The stack: the base unit's top, the rings' height, and the shared boss.
export const UNIT_TOP = 28;
export const RING_H = 9;
export const BOSS_H = 3;

// The rack beside the stack: one threaded stub per ring.
export const RACK_TOP = 4;
export const RACK_AT = [[49, 37], [49, 0], [49, -37]];

// The ram: its rest height, radius, and the bottom of the guide it slides in.
export const REST = 66;
export const RAM_R = 2.6;
export const GUIDE_BOTTOM = 70;

const ease = (t) => t * t * (3 - 2 * t);

// The offset of ring i from its place in the stack, for a placement p: 0 on the
// rack, 1 on the stack. It lifts off its stub, travels above the stack's top
// boss, then lowers into place.
export function ringPose(i, p) {
  const [rx, ry] = RACK_AT[i];
  const fz = UNIT_TOP + i * RING_H;
  const lift = fz + 5;
  const part = (a, b) => ease(Math.min(1, Math.max(0, (p - a) / (b - a))));
  const up = part(0, 0.3);
  const over = part(0.3, 0.72);
  const down = part(0.72, 1);
  const z = RACK_TOP + (lift - RACK_TOP) * up + (fz - lift) * down;
  return [rx * (1 - over), ry * (1 - over), z - fz];
}

// The ram as SVG: a rod from its tip up into the guide with a chamfered nose,
// or, once the tip is inside the stack, from where it enters the top bore.
// `kit` is the anatomy kit (its cylinder and solidSvg).
export function ramSvg(kit, P, tip, top) {
  const nose = tip >= top;
  const from = nose ? tip + 0.8 : top;
  const rod = kit.solidSvg(kit.cylinder(0, 0, RAM_R, from, GUIDE_BOTTOM - from, P, 20), { tone: "hi", crease: "none" });
  return nose ? kit.solidSvg(kit.cylinder(0, 0, 1.9, tip, 0.8, P, 16), { tone: "hi", crease: "none" }) + rod : rod;
}
