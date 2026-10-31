// The Iterator figure's motion as one timeline. Time T is counted in next() calls:
// the first loop runs T = 0..11 (eleven calls, the last one finds nothing left),
// a new iterator is made during T = 11..12, and the second loop runs T = 12..18
// (six calls, then break). Within a call, the lever goes down and the sprocket
// turns on by one pin (u = 0..0.45); if the tray in hand is used up it slides out to
// the bin (0..0.55) and the magazine pushes the next one in (0.5..1). Choosing an
// earlier step plays the timeline backward. build.mjs uses it for the static pose
// and the page inlines it after model.mjs, dropping the import line.

import { FIRST, ORDERS, SIZE } from "./model.mjs";

export const PITCH = 12;
export const TRAY_T = 3;
export const CH_Z = 12;
export const GX = -24;
export const MAGX = -82;
export const BINX = 82;
export const BIN_Z = 2;
export const PUSH = 20;

export const REST = [1, 5, 11, 18];
const RUN_END = ORDERS.length + 1;
const RESET = RUN_END + 1;

const ease = (u) => u * u * (3 - 2 * u);
const clamp = (u) => Math.max(0, Math.min(1, u));

// Where tray i is after c calls of one loop: x of its first slot, z of its underside.
function trayAt(i, c) {
  const first = FIRST[i];
  const last = first + SIZE[i];
  let level = i;
  for (let j = 0; j < i; j++) level -= ease(clamp((c - FIRST[j] - 0.92) / 0.08));
  if (c <= first + 0.5) return { x: MAGX, z: CH_Z + level * TRAY_T };
  if (c < first + 1) return { x: MAGX + (GX - MAGX) * ease((c - first - 0.5) / 0.5), z: CH_Z };
  const lastX = GX + PITCH * (SIZE[i] - 1);
  if (c <= last) {
    const f = c - first - 1;
    const k = Math.floor(f);
    return { x: Math.min(lastX, GX + PITCH * (k + ease(clamp((f - k) / 0.45)))), z: CH_Z };
  }
  const u = c - last;
  const floor = BIN_Z + i * TRAY_T;
  const fall = clamp((u - 0.42) / 0.13);
  return { x: lastX + (BINX - lastX) * ease(clamp(u / 0.42)), z: CH_Z - (CH_Z - floor) * fall * fall };
}

function runPose(run, c) {
  const trays = FIRST.map((_, i) => ({ ...trayAt(i, c), opacity: 1 }));
  const u = c - Math.floor(c);
  const lever = u < 0.45 ? ease(u / 0.45) : u < 0.55 ? 1 : 1 - ease(clamp((u - 0.55) / 0.4));
  // How far the sprocket has turned, counted in calls (each call turns it one pin on).
  const turn = Math.floor(c) + ease(clamp(u / 0.45));
  let push = 0;
  FIRST.forEach((first) => {
    const u2 = (c - first - 0.5) / 0.5;
    if (u2 <= 0 || u2 >= 1) return;
    push = u2 < 0.75 ? Math.min((GX - MAGX) * ease(u2), PUSH) : PUSH * (1 - ease((u2 - 0.75) / 0.25));
  });
  const pages = FIRST.reduce((sum, first) => sum + clamp((c - first - 0.5) / 0.3), 0);
  const items = ORDERS.reduce((sum, _, k) => sum + clamp((c - k - (FIRST.includes(k) ? 0.85 : 0.3)) / 0.15), 0);
  const done = run === 0 ? clamp((c - ORDERS.length - 0.55) / 0.35) : 0;
  // The slide under the reading head: a tray resting with one of its slots at the gate.
  let lit = null;
  trays.forEach((tray, i) => {
    if (Math.abs(tray.z - CH_Z) > 0.01) return;
    const slot = (tray.x - GX) / PITCH;
    const j = Math.round(slot);
    if (Math.abs(slot - j) < 0.02 && j >= 0 && j < SIZE[i] && items > FIRST[i] + j + 0.99) lit = { tray: i, slot: j };
  });
  return { run, c, trays, lever, turn, push, pages, items, done, lit };
}

export function pose(T) {
  if (T <= RUN_END) return runPose(0, T);
  if (T >= RESET) return runPose(1, T - RESET);
  // A new loop asks for a new iterator: the used trays clear out and a full magazine stands ready.
  const u = T - RUN_END;
  const old = runPose(0, RUN_END);
  const fresh = runPose(1, 0);
  const trays = u < 0.5
    ? old.trays.map((tray) => ({ ...tray, opacity: 1 - clamp(u / 0.4) }))
    : fresh.trays.map((tray) => ({ ...tray, opacity: clamp((u - 0.55) / 0.4) }));
  return { run: -1, c: 0, trays, lever: 0, turn: old.turn, push: 0, pages: old.pages * (1 - ease(u)), items: old.items * (1 - ease(u)), done: 1 - clamp(u / 0.3), lit: null };
}

// What is happening at time T, for the readout while the parts move.
export function phase(T) {
  if (T > RUN_END && T < RESET) return "vòng lặp mới, iterator mới";
  const c = T <= RUN_END ? T : T - RESET;
  const n = Math.floor(c);
  const u = c - n;
  if (FIRST.includes(n) && u >= 0.4) return "trang trước đã hết: gọi API lấy trang " + (FIRST.indexOf(n) + 1);
  if (n >= ORDERS.length) return "trang cuối đã hết";
  return "next(): đang lấy đơn kế";
}
