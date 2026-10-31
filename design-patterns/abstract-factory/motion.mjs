// Where the nine parts are at any pose of the timeline. The build uses it for
// the static drawing and the page inlines it, so both agree. Uses RUNS and
// gapBetween from model.mjs and PUSH from timeline.mjs; the page inlines those too.

import { RUNS, gapBetween } from "./model.mjs";
import { PUSH } from "./timeline.mjs";

export const PART = { half: 10, len: 20, h: 6 };
export const LANDING = [-28, 0, 28]; // where each run's parts land on the bed, under the columns
export const STATION = -30; // where a tube drops its part inside the housing
export const LAND_Y = 19; // the bed's centre line
export const TRAY_Y = 44.5; // the tray's centre line
export const BED_TOP = 14;
export const BED_EDGE = 30; // the bed's front edge
export const FLOOR = 1.5; // the tray floor's top

const runGaps = () => RUNS.map((run) => [gapBetween(run.parts[0], run.parts[1]), gapBetween(run.parts[1], run.parts[2])]);

// The pusher drives the first part; each part moves only once the one behind it reaches it.
export function chain(kit, face) {
  const [g1, g2] = runGaps()[kit];
  const x0 = Math.max(LANDING[0], face + PART.half);
  const x1 = Math.max(LANDING[1], x0 + PART.len + g1);
  const x2 = Math.max(LANDING[2], x1 + PART.len + g2);
  return [x0, x1, x2];
}

// Off the bed's edge a part falls into the tray, onto the floor or the kit already there.
function fall(u, floor) {
  const from = (BED_EDGE + 8 - LAND_Y) / (TRAY_Y - LAND_Y);
  const v = Math.min(1, Math.max(0, (u - from) / (1 - from)));
  return (floor - BED_TOP) * v * v;
}

// Offsets [dx, dy, dz] of every part from its landing place, kit by kit, column by column.
export function partOffsets(p) {
  const outs = [p.out0, p.out1, p.out2];
  const closes = [p.close0, p.close1, p.close2];
  const sweeps = [p.sweep0, p.sweep1, 0];
  const floors = [FLOOR, FLOOR + PART.h, FLOOR];
  return closes.map((face, kit) => {
    const xs = chain(kit, face);
    const y = STATION + (LAND_Y - STATION) * outs[kit] + (TRAY_Y - LAND_Y) * sweeps[kit];
    return xs.map((x, col) => [x - LANDING[col], y - LAND_Y, fall(sweeps[kit], floors[kit])]);
  });
}

// The kit that has just closed tight and still sits on the bed, or -1.
export function closedKit(p) {
  const closes = [p.close0, p.close1];
  const sweeps = [p.sweep0, p.sweep1];
  return [0, 1].find((kit) => Math.abs(closes[kit] - PUSH.closed[kit]) < 0.05 && sweeps[kit] < 0.02) ?? -1;
}
