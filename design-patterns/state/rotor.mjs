// The parts that turn with the state drum, for any drum position `d` counted in
// detents: state i's row of holes is on top of the drum, under the keys, at d = i.
// figure.mjs draws them at rest; the page inlines this file and redraws them while
// the drum turns. Kept free of DOM code so both can run it.

import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/tuanpham/.claude/skills/anatomy/kit/lathe.mjs";

export const DX = -30; // drum axis: along y, through x = DX, z = DZ
export const DZ = 30;
export const R = 13; // drum body
export const RB = 14.2; // the raised track under each key
export const TRACK_Y = [33, 11, -11, -33]; // one track per action, in ACTIONS order
export const BAND = 4.6; // half the width of a track
export const HOLE_R = 2.8;
export const CAM = { s: [62, 68], half: 8, corner: 1.6 }; // square detent cam on the shaft
export const KNOB = { s: [70.6, 77.8], r: 6.2 };
export const QUARTER = Math.PI / 2;

// Angle 0 points at +x, π/2 straight up; s runs along +y.
export const DRUM_F = G.frameOf([DX, 0, DZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);

// Where state `row`'s holes sit on the drum when the drum stands at `d`.
export const rowAngle = (row, d) => QUARTER - row * QUARTER + d * QUARTER;

// The holes: one per action a state accepts, on that action's track.
export function holesSvg(P, d, states, actions, rules) {
  const out = [];
  states.forEach((state, row) => {
    const angle = rowAngle(row, d);
    const alpha = G.fadeOf(G.facingOf(DRUM_F, angle, P), [0.04, 0.3]);
    if (alpha < 0.02) return;
    actions.forEach((action, track) => {
      if (!rules[state.id][action.id]) return;
      const ring = (r) => k.pathOf(Array.from({ length: 32 }, (_, j) => {
        const t = (j / 32) * Math.PI * 2;
        return k.iso(G.pointOf(DRUM_F, TRACK_Y[track] + r * Math.cos(t), RB, angle + (r * Math.sin(t)) / RB), P);
      }), true);
      const hole = ring(HOLE_R);
      out.push(`<g${alpha < 0.98 ? ` opacity="${alpha.toFixed(2)}"` : ""}><path class="st-hole" d="${hole}"/><path class="iso-line" data-tone="faint" d="${ring(HOLE_R + 0.8)}"/><path class="iso-line" data-tone="lo" d="${hole}"/></g>`);
    });
  });
  return out.join("");
}

// The drum body between the tracks, as [from, to] along the axis.
export const SPANS = (() => {
  const edges = [...TRACK_Y].sort((a, b) => a - b).flatMap((c) => [c - BAND, c + BAND]);
  return [-44, ...edges, 44].reduce((out, s, i, all) => (i % 2 ? out : [...out, [s, all[i + 1]]]), []);
})();

// Rivet rings near the drum ends, and the engraved lines between the state rows,
// which turn with the drum. Each line starts on the visible step at the end of one
// track and fades out before the next track, whose step faces away.
export function rivetsSvg(P, d) {
  const dots = [-40.8, 40.8].flatMap((s) => G.dotsOf(DRUM_F, s, R, 18, P, { phase: d * QUARTER, fade: [0.04, 0.42] }));
  const lines = SPANS.slice(1, -1).flatMap(([s0, s1]) => [0, 1, 2, 3].map((j) => {
    const t = d * QUARTER + QUARTER / 2 + j * QUARTER;
    const alpha = G.fadeOf(G.facingOf(DRUM_F, t, P), [0.08, 0.5]);
    if (alpha < 0.02) return "";
    const line = k.fadeLineSvg([k.iso(G.pointOf(DRUM_F, s0, R, t), P), k.iso(G.pointOf(DRUM_F, s1, R, t), P)], { fade: [0, 6], tone: "lo" });
    return alpha < 0.98 ? `<g opacity="${alpha.toFixed(2)}">${line}</g>` : line;
  }));
  return lines.join("") + k.dotsSvg(dots, { size: 0.45 });
}

// The detent cam: a square with rounded corners. A flat follower rests on whichever
// side is up, so the drum stops square at each quarter turn.
function camRing(theta) {
  const { half, corner } = CAM;
  const c = half - corner;
  const points = [];
  [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sy], index) => {
    const start = (index * Math.PI) / 2;
    for (let j = 0; j <= 4; j++) {
      const t = start + (j / 4) * (Math.PI / 2);
      points.push([sx * c + corner * Math.cos(t), sy * c + corner * Math.sin(t)]);
    }
  });
  return points.map(([x, y]) => [x * Math.cos(theta) - y * Math.sin(theta), x * Math.sin(theta) + y * Math.cos(theta)]);
}

// Height of the cam's top above the axis: where the follower pad rests.
export function camTop(d) {
  const theta = d * QUARTER;
  return (CAM.half - CAM.corner) * (Math.abs(Math.cos(theta)) + Math.abs(Math.sin(theta))) + CAM.corner;
}

export function camSvg(P, d) {
  const theta = d * QUARTER;
  const face = CAM.s[1];
  const screws = [Math.PI / 4, (5 * Math.PI) / 4].map((t) => k.iso(G.pointOf(DRUM_F, face, 5.4, t + theta), P));
  return k.solidSvg(G.prismOf(DRUM_F, camRing(theta), CAM.s[0], face, P), { tone: "mid" })
    + k.lineSvg(G.circleOf(DRUM_F, face, 4, P, 40), { tone: "lo" })
    + k.dotsSvg(screws, { size: 0.45 });
}

// The knurl on the hand knob and the pointer on its end face.
export function knobSvg(P, d) {
  const theta = d * QUARTER;
  const ribs = G.ribsOf(DRUM_F, KNOB.s[0] + 1.4, KNOB.s[1] - 1.2, KNOB.r, 36, P, { phase: theta, fade: [0.1, 0.55], seams: true });
  const end = KNOB.s[1];
  const pointer = k.pathOf([k.iso(G.pointOf(DRUM_F, end, 1.4, theta + QUARTER), P), k.iso(G.pointOf(DRUM_F, end, KNOB.r - 0.8, theta + QUARTER), P)]);
  return k.fadedSvg(ribs, { tone: "lo" }) + k.lineSvg(pointer, { tone: "hi" });
}
