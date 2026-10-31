// The Visitor figure's motion as one timeline in seconds. Every moving part is
// a track of [time, value] keys eased between; the five steps rest at REST.
// Choosing an earlier step plays the timeline backward, so the bit sets swap
// back and the counters roll back. build.mjs uses it for the pose in the static
// drawing, and the page inlines it to drive the parts.

// Where the carrier stops along x: the four line blocks, then the two ends of
// the rail where a bit set slides off onto its rack.
export const STOP = { product: -45, shipping: -15, discount: 15, gift: 45, right: 66, left: -66 };
// A bit set's slide on the carrier: position i lines up with the pusher at
// index i, and 1.5 centres the four channels. DOCK pushes the set fully onto
// the right or the left rack, where it parks at PARKED.
export const SPACING = 10;
export const PARKED = { vat: 112, export: -130 };
export const DOCK = { right: 1.5 - (PARKED.vat - STOP.right) / SPACING, left: 1.5 - (PARKED.export - STOP.left) / SPACING };
export const PUSH = 13;

export const REST = [1.0, 3.0, 5.0, 14.3, 17.6];

export const GIFT_FROM = -34;

export const TRACKS = {
  // Steps 1-3: the VAT set visits the product, shipping and discount blocks.
  carX: [
    [0, STOP.product], [1.4, STOP.product], [2.2, STOP.shipping], [3.4, STOP.shipping], [4.2, STOP.discount],
    // Step 4: park the VAT set on the right rack, fetch the JSON set from the left one, and visit the three blocks again.
    [5.4, STOP.discount], [6.6, STOP.right], [7.4, STOP.right], [9.2, STOP.left], [10.0, STOP.left],
    [10.8, STOP.product], [11.75, STOP.product], [12.2, STOP.shipping], [13.15, STOP.shipping], [13.6, STOP.discount],
    // Step 5: the gift block slides in and the carrier goes to it.
    [15.4, STOP.discount], [16.2, STOP.gift],
  ],
  index: [
    [0, 0], [1.5, 0], [2.1, 1], [3.5, 1], [4.1, 2], [5.4, 2], [5.9, 1.5], [6.6, 1.5], [7.4, DOCK.right],
    [7.4, DOCK.left], [9.2, DOCK.left], [10.0, 1.5], [10.2, 1.5], [10.8, 0], [11.75, 0], [12.2, 1], [13.15, 1], [13.6, 2],
    [15.6, 2], [16.2, 3],
  ],
  // The pusher drives the bit under it into the block's socket.
  ext: [
    [0.2, 0], [0.8, PUSH], [1.0, PUSH], [1.4, 0], [2.2, 0], [2.8, PUSH], [3.0, PUSH], [3.4, 0], [4.2, 0], [4.8, PUSH], [5.0, PUSH], [5.4, 0],
    [10.8, 0], [11.3, PUSH], [11.4, PUSH], [11.75, 0], [12.2, 0], [12.7, PUSH], [12.8, PUSH], [13.15, 0], [13.6, 0], [14.1, PUSH], [14.3, PUSH], [14.7, 0],
    [16.4, 0], [17.0, PUSH],
  ],
  vatOn: [[0, 1], [7.4, 1], [7.4, 0]],
  exportOn: [[0, 0], [9.2, 0], [9.2, 1]],
  giftY: [[14.7, GIFT_FROM], [16.0, 0]],
  flag: [[17.0, 0], [17.4, 1]],
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
  const p = {};
  for (const name in TRACKS) p[name] = track(TRACKS[name], t);
  const slide = p.carX + (1.5 - p.index) * SPACING;
  p.vatX = p.vatOn > 0.5 ? slide : PARKED.vat;
  p.exportX = p.exportOn > 0.5 ? slide : PARKED.export;
  // Only the bit lined up with the pusher moves, and only by as much as the pusher does.
  p.bits = [0, 1, 2].map((i) => (Math.abs(p.index - i) < 0.01 ? p.ext : 0));
  // What each bit set has counted so far: the visitor keeps its own result.
  p.vat = t >= 4.8 ? 2 : t >= 2.8 ? 1 : t >= 0.8 ? 0 : -1;
  p.records = t >= 14.1 ? 3 : t >= 12.7 ? 2 : t >= 11.3 ? 1 : 0;
  return p;
}

// What is happening at time t, for the readout while the parts move.
export function phase(t) {
  if (t < REST[0]) return "bộ VAT · cắm bit vuông";
  if (t < REST[1]) return "bộ VAT · sang dòng giao hàng";
  if (t < REST[2]) return "bộ VAT · sang dòng giảm giá";
  if (t < 7.4) return "đang cất bộ VAT";
  if (t < 10.0) return "đang lấy bộ JSON";
  if (t < REST[3]) return "bộ JSON · đi qua ba dòng";
  return "đưa dòng gói quà vào";
}
