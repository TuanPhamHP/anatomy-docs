// The Proxy figure's motion as one timeline in seconds. Every moving part is a
// track of [time, value] keys eased between; the three steps rest at REST.
// Choosing an earlier step plays the timeline backward, so the report goes back
// into the vault and the load counter rolls back. build.mjs uses it for the
// pose in the static drawing, and the page inlines it to drive the parts.

// Where the shuttle stops along x: in the vault, in the hatch, at the client counter.
export const SHUTTLE_AT = { vault: -88, hatch: -3, client: 66 };

export const REST = [1.7, 9.7, 12.8];

export const TRACKS = {
  // Step 1: the guest rings, the hatch checks, the refusal flag rises.
  bell: [[0.2, 0], [0.4, 1], [0.7, 0], [3.8, 0], [4.0, 1], [4.3, 0], [10.9, 0], [11.1, 1], [11.4, 0]],
  flag: [[0.8, 0], [1.4, 1], [1.8, 1], [2.2, 0]],
  // Step 2: the key leaves its rest, goes into the lock and turns.
  keyOut: [[2.2, 0], [2.5, 1], [3.1, 1], [3.4, 0]],
  keyAlong: [[2.5, 0], [3.1, 1]],
  keyTurn: [[3.4, 0], [3.7, 1]],
  // The hatch is empty, so it opens the vault: the wheel spins, the door lifts,
  // the shuttle crawls out with the report, the door drops, the counter rolls.
  wheel: [[4.4, 0], [5.6, 1.5], [7.6, 1.5], [8.6, 0]],
  vaultDoor: [[4.6, 0], [5.7, 1], [7.6, 1], [8.5, 0]],
  shuttle: [
    [5.7, SHUTTLE_AT.vault], [7.5, SHUTTLE_AT.hatch], [8.9, SHUTTLE_AT.hatch], [9.6, SHUTTLE_AT.client],
    [9.7, SHUTTLE_AT.client], [10.4, SHUTTLE_AT.hatch], [11.9, SHUTTLE_AT.hatch], [12.6, SHUTTLE_AT.client],
  ],
  counter: [[7.8, 0], [8.3, 1]],
  // The hatch's own door, the same shape as the vault's: open to serve, shut between reads.
  hatchDoor: [[8.5, 0], [8.9, 1], [10.4, 1], [10.8, 0], [11.5, 0], [11.9, 1]],
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

// What is happening at time t, for the readout while the parts move.
export function phase(t) {
  if (t < REST[0]) return "Khách gọi read(): đang kiểm quyền";
  if (t < 3.8) return "Kế toán đưa chìa vào khoá";
  if (t < 4.4) return "đang kiểm quyền";
  if (t < 8.6) return "quầy trống: đang tải từ kho";
  if (t < REST[1]) return "đang trả báo cáo";
  if (t < 10.9) return "khay về quầy";
  if (t < 11.5) return "đang kiểm quyền";
  return "trả ngay bản đã tải";
}
