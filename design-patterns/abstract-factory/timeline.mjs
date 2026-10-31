// The Abstract Factory figure's motion as one timeline in seconds. Every moving
// part is a track of [time, value] keys eased between; the three runs rest at
// REST. Choosing an earlier run plays the timeline backward. build.mjs uses it
// for the pose in the static drawing, and the page inlines it to drive the parts.

export const REST = [3.0, 8.2, 14.0];

// Where the pusher's face stands: back, and closed on each run's parts.
export const PUSH = { rest: -39, closed: [-22, -22, -25.9] };

export const TRACKS = {
  // Run 1 (A): the A tubes drop their bottom parts, the parts come out of the
  // mouth, the pusher closes them against the end stop.
  dropA01: [[0.2, 0], [0.6, 1], [11.0, 1], [11.4, 2]],
  dropA2: [[0.2, 0], [0.6, 1]],
  out0: [[0.6, 0], [1.4, 1]],
  close0: [[1.6, PUSH.rest], [2.6, PUSH.closed[0]]],
  // Run 2 (B): the sweeper clears kit A into the tray, the factory bar moves all
  // three slides to B at once, B parts drop and close.
  sweep0: [[3.3, 0], [4.0, 1]],
  bar: [[4.2, 0], [5.2, 1]],
  dropB01: [[5.4, 0], [5.8, 1]],
  dropB2: [[5.4, 0], [5.8, 1], [11.0, 1], [11.4, 2]],
  out1: [[5.8, 0], [6.6, 1]],
  close1: [[6.8, PUSH.rest], [7.8, PUSH.closed[1]]],
  // Run 3 (mixed): kit B goes into the tray, the bar is lifted off, two slides
  // are set back to A one by one while the third stays at B, and the mixed
  // parts can't close.
  sweep1: [[8.5, 0], [9.2, 1]],
  lift: [[9.4, 0], [9.9, 1]],
  slide01: [[4.2, 0], [5.2, 1], [10.0, 1], [10.9, 0]],
  slide2: [[4.2, 0], [5.2, 1]],
  out2: [[11.4, 0], [12.2, 1]],
  close2: [[12.4, PUSH.rest], [13.2, PUSH.closed[2]]],
  flag: [[13.3, 0], [13.8, 1]],
  // The pusher itself: in for each run, back out before the next.
  pusher: [
    [1.6, PUSH.rest], [2.6, PUSH.closed[0]], [3.2, PUSH.closed[0]], [3.8, PUSH.rest],
    [6.8, PUSH.rest], [7.8, PUSH.closed[1]], [8.4, PUSH.closed[1]], [9.0, PUSH.rest],
    [12.4, PUSH.rest], [13.2, PUSH.closed[2]],
  ],
  // The sweeper plate comes out of the mouth to push a finished kit off the bed.
  // It reaches the parts' backs as they start to move, and pushes them to the bed's edge.
  sweeper: [[3.0, 0], [3.3, 0.3], [3.75, 1], [4.1, 0], [8.2, 0], [8.5, 0.3], [8.95, 1], [9.3, 0]],
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
  if (t < 0.6) return "Bộ A: các ống thả chi tiết";
  if (t < 1.5) return "Bộ A: chi tiết ra khỏi máy";
  if (t < REST[0]) return "Bộ A: đang ép khít";
  if (t < 4.1) return "đưa bộ A vào khay";
  if (t < 5.3) return "thanh chọn bộ chuyển sang B";
  if (t < 6.7) return "Bộ B: các ống thả chi tiết";
  if (t < REST[1]) return "Bộ B: đang ép khít";
  if (t < 9.3) return "đưa bộ B vào khay";
  if (t < 10.0) return "nhấc thanh chọn bộ ra";
  if (t < 11.0) return "từng giá tự chọn: A, A, còn B";
  if (t < 12.3) return "thả ba chi tiết lẫn";
  return "đang ép: khớp không vừa";
}
