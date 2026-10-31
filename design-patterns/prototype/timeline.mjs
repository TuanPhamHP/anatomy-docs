// The Prototype figure's motion as one timeline in seconds. Each moving part is a
// track of [time, value] keys eased between; the four steps rest at REST. Choosing
// an earlier step plays the timeline backward, so the copy grows back into a blank.
// build.mjs poses the static drawing with it, and the page inlines it.

export const REST = [0, 7, 9.2, 12.4];

// Where the tracer sits along the master (key x): parked over the shoulder, run out
// past the tip, then back along the blade from the tip to the shoulder while cutting.
export const PARK = 10;
export const TIP = 55;
export const SHOULDER = 13;

export const TRACKS = {
  // Step 2: the motor spins the cutter up, the carriage runs out to the tip, is let
  // back onto the tracer, follows the blade to the shoulder, then is pulled off.
  spin: [[0.5, 0], [1.1, 1], [5.2, 1], [5.8, 0]],
  along: [[0.3, PARK], [1.3, TIP], [1.7, TIP], [5.2, SHOULDER], [5.5, SHOULDER], [5.9, PARK]],
  engage: [[1.35, 0], [1.7, 1], [5.2, 1], [5.5, 0]],
  cutFrom: [[1.7, TIP], [5.2, SHOULDER]],
  // The copy's own rail fills with copies of the template's three tags.
  own0: [[5.9, 0], [6.3, 1], [9.6, 1], [10.0, 0]],
  own1: [[6.1, 0], [6.5, 1], [9.7, 1], [10.1, 0]],
  own2: [[6.3, 0], [6.7, 1], [9.8, 1], [10.2, 0]],
  // Step 3: the customer's name is engraved on the copy, and its own rail gets one more tag.
  engrave: [[7.2, 0], [8.2, 1]],
  extraOwn: [[8.3, 0], [8.8, 1], [9.6, 1], [10.0, 0]],
  // Step 4, the trap: the copy's own list goes, a sleeve joins the two rails into
  // one, and the same extra tag now hangs on the rail both keys read.
  sleeve: [[10.3, 0], [11.1, 1]],
  extraShared: [[11.3, 0], [11.8, 1]],
};

// When each display changes, read from the model's steps by the page.
export const SHOWS = { copyCut: 6.7, copyExtra: 8.8, copyGone: 9.6, shared: 11.8 };

// Which part to watch at time t: the master, the copy being cut, the extra tag, the sleeve.
export const focusAt = (t) => (t < 1.3 ? "master" : t < 7.1 ? "copy" : t < 9.4 ? "extra" : "sleeve");

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
  if (t < 1.3) return "đưa xe trượt ra đầu chìa";
  if (t < 5.2) return "clone(): đang cắt theo chìa gốc";
  if (t < 5.9) return "cắt xong, xe trượt lùi về";
  if (t < REST[1]) return "chép danh sách hạng mục";
  if (t < 8.3) return "khắc tên khách lên bản sao";
  if (t < REST[2]) return "thêm hạng mục cho bản sao";
  if (t < 10.3) return "sao chép nông: bỏ danh sách riêng";
  if (t < 11.3) return "nối chung một giá hạng mục";
  return "thêm hạng mục vào giá dùng chung";
}
