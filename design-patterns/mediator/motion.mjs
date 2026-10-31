// The Mediator figure's motion, as a pure function of the time since a step
// was chosen. Every step plays the same three phases:
//   clear   (0 to 0.6 s)  the previous step's flags, keys and drops go back;
//   rewire  (0.4 to 1.6 s) the mesh wires fade and the exchange lines are laid
//                          (or the reverse), the fifth station comes or goes, and
//                          the wire counter rolls;
//   event   (from 1.7 s)   the sender presses its key, a pulse runs to whoever it
//                          calls, and their flags rise.
// build.mjs uses pose() at the end of the start step for the static drawing; the
// page inlines this file to drive the parts.

export const CLEAR = 0.6;
export const REWIRE = [0.4, 1.6];
export const EVENT = 1.7;
// Event times, relative to EVENT. Through the exchange: sender to hub, the drop
// falls, the operator throws the keys, pulses run out, flags rise.
export const HUB = { press: [0, 0.3, 0.55, 0.85], toHub: [0.3, 1.1], drop: [1.0, 1.4], keys: [1.4, 1.8], out: [1.8, 2.6], flags: [2.4, 2.9], end: 3.0 };
// Wired straight: the pulses run along the mesh wires to every target at once.
export const MESH = { press: [0, 0.3, 0.55, 0.85], along: [0.3, 1.4], flags: [1.3, 1.8], end: 2.0 };
export const END = EVENT + HUB.end;

const ease = (u) => u * u * (3 - 2 * u);
const ramp = (t, [a, b]) => (t <= a ? 0 : t >= b ? 1 : ease((t - a) / (b - a)));
// Up, hold, down: a key press that comes back.
const bump = (t, [a, b, c, d]) => (t <= a || t >= d ? 0 : t < b ? ease((t - a) / (b - a)) : t <= c ? 1 : 1 - ease((t - c) / (d - c)));
// A pulse travelling along a wire: where it is (0..1) and how visible.
const pulse = (t, span) => ({ s: ramp(t, span), alpha: t <= span[0] || t >= span[1] + 0.12 ? 0 : Math.min(1, (t - span[0]) / 0.1, (span[1] + 0.12 - t) / 0.12) });

export const nothing = (count) => ({
  press: Array(count).fill(0), drop: Array(count).fill(0), key: Array(count).fill(0), flag: Array(count).fill(0),
  litIn: Array(count).fill(0), litOut: Array(count).fill(0), arcs: {},
});

// The event part of a step: what each part does `t` seconds into it.
export function eventPose(plan, t, count) {
  const out = nothing(count);
  const { sender, targets, mesh } = plan;
  out.pulses = [];
  if (mesh) {
    out.press[sender] = bump(t, MESH.press);
    for (const target of targets) {
      out.arcs[[sender, target].sort().join("-")] = ramp(t, [MESH.along[0], MESH.along[0] + 0.2]);
      out.pulses.push({ kind: "arc", from: sender, to: target, ...pulse(t, MESH.along) });
      out.flag[target] = ramp(t, MESH.flags);
    }
    return out;
  }
  out.press[sender] = bump(t, HUB.press);
  out.litIn[sender] = ramp(t, [HUB.toHub[0], HUB.toHub[0] + 0.25]);
  out.pulses.push({ kind: "in", line: sender, ...pulse(t, HUB.toHub) });
  out.drop[sender] = ramp(t, HUB.drop);
  for (const target of targets) {
    out.key[target] = ramp(t, HUB.keys);
    out.litOut[target] = ramp(t, [HUB.out[0], HUB.out[0] + 0.25]);
    out.pulses.push({ kind: "out", line: target, ...pulse(t, HUB.out) });
    out.flag[target] = ramp(t, HUB.flags);
  }
  return out;
}

// The whole pose `u` seconds after choosing a step. `from` is the pose the
// parts were in when the choice was made: its event values fade out during the
// clear phase, and its wiring blends into the new step's wiring.
export function pose(plan, u, from) {
  const count = plan.count;
  const clear = 1 - ramp(u, [0, CLEAR]);
  const blend = ramp(u, REWIRE);
  const now = eventPose(plan, u - EVENT, count);
  const fade = (list, own) => list.map((v, i) => Math.max(v * clear, own[i]));
  const arcs = {};
  for (const key of new Set([...Object.keys(from.arcs), ...Object.keys(now.arcs)])) arcs[key] = Math.max((from.arcs[key] ?? 0) * clear, now.arcs[key] ?? 0);
  return {
    mesh: from.mesh + ((plan.mesh ? 1 : 0) - from.mesh) * blend,
    fifth: from.fifth + ((plan.fifth ? 1 : 0) - from.fifth) * blend,
    wires: from.wires + (plan.wires - from.wires) * ramp(u, [REWIRE[0] + 0.2, REWIRE[1]]),
    press: fade(from.press, now.press), drop: fade(from.drop, now.drop), key: fade(from.key, now.key), flag: fade(from.flag, now.flag),
    litIn: fade(from.litIn, now.litIn), litOut: fade(from.litOut, now.litOut), arcs,
    pulses: now.pulses,
  };
}

// The resting pose of a step, as if it had played to the end from its own wiring.
export function rest(plan) {
  const start = { ...nothing(plan.count), mesh: plan.mesh ? 1 : 0, fifth: plan.fifth ? 1 : 0, wires: plan.wires };
  return pose(plan, END, start);
}
