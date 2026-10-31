// The Memento figure's motion as one timeline in seconds. Every moving part is a
// track of [time, value] keys eased between; the five steps rest at REST.
// Choosing an earlier step plays the timeline backward, so a stored cartridge
// sinks back into its slot and the faders retrace their path. build.mjs uses it
// for the pose of the static drawing, and the page inlines it to drive the parts.
import { BAD, FIELDS, V1, V2, position } from "./model.mjs";

export const REST = [2.9, 5.9, 7.3, 10.3, 13.3];

const at = (config) => FIELDS.map((field) => position(field, config[field.key]));
const P1 = at(V1);
const P2 = at(V2);
const PB = at(BAD);

// One fader's keys: up from the bottom to v1, over to v2, up to the bad values,
// then motor-driven back to v2 and to v1. The three faders start a beat apart.
const faderKeys = (i) => [
  [0.2 + 0.15 * i, 0], [1.5 + 0.15 * i, P1[i]],
  [3.1 + 0.12 * i, P1[i]], [4.3 + 0.12 * i, P2[i]],
  [6.1 + 0.08 * i, P2[i]], [6.8 + 0.08 * i, PB[i]],
  [8.7 + 0.12 * i, PB[i]], [9.9 + 0.12 * i, P2[i]],
  [11.7 + 0.12 * i, P2[i]], [12.9 + 0.12 * i, P1[i]],
];

export const TRACKS = {
  fader0: faderKeys(0),
  fader1: faderKeys(1),
  fader2: faderKeys(2),
  // Store: the button dips, then the scene's sealed cartridge rises out of its slot.
  store: [[1.95, 0], [2.1, 1], [2.35, 0], [4.95, 0], [5.1, 1], [5.35, 0]],
  card0: [[2.1, 0], [2.8, 1]],
  card1: [[5.1, 0], [5.8, 1]],
  // The selector knob points at the slot to write into or read from (0 = slot 1).
  knob: [[4.45, 0], [4.85, 1], [10.75, 1], [11.15, 0]],
  // The bulk change lights the warning lamp; a restore puts it out.
  warn: [[6.85, 0], [6.95, 1], [8.5, 1], [8.6, 0]],
  // Recall: the button dips and the chosen cartridge is pressed against the reader.
  recall: [[8.2, 0], [8.35, 1], [8.6, 0], [11.3, 0], [11.45, 1], [11.7, 0]],
  read1: [[8.35, 0], [8.55, 1], [8.9, 0]],
  read0: [[11.45, 0], [11.65, 1], [12.0, 0]],
};

const ease = (u) => u * u * (3 - 2 * u);

export function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return t1 === t0 ? v1 : v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}

export function pose(t) {
  const out = {};
  for (const name in TRACKS) out[name] = track(TRACKS[name], t);
  return out;
}

// The one lit part at time t: the cartridge just written or being read, or the warning lamp.
export function litAt(t) {
  if (t >= 2.1 && t < 3.1) return "card0";
  if (t >= 5.1 && t < 6.1) return "card1";
  if (t >= 6.95 && t < 8.35) return "warn";
  if (t >= 8.35 && t < 10.75) return "card1";
  if (t >= 11.45) return "card0";
  return "";
}

// What is happening at time t, for the readout while the parts move.
export function phase(t) {
  if (t < 1.95) return "đang chỉnh cần gạt";
  if (t < REST[0]) return "đang lưu v1 vào ô 1";
  if (t < 4.95) return "đang chỉnh cần gạt";
  if (t < REST[1]) return "đang lưu v2 vào ô 2";
  if (t < REST[2]) return "sửa hàng loạt: nhân 10";
  if (t < 8.35) return "chọn ô 2, bấm khôi phục";
  if (t < REST[3]) return "đang khôi phục v2";
  if (t < 11.45) return "chọn ô 1, bấm khôi phục";
  return "đang khôi phục v1";
}
