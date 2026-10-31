// The Abstract Factory figure's model: two payment providers, each a family of
// three parts that only work together (gateway, refunds, webhook verifier), and
// three runs of the kit dispenser. The parts' joints stand for the family's
// shared secret and signature format: A's round joints and B's square ones
// close only with their own kind. build.mjs inlines this file, so the readout
// and captions show these values; the examples under code/ print the same ones.

export const ORDER = { id: "DH-3001", amount: 1250000, refund: 250000 };

export const FAMILIES = {
  A: { id: "A", joint: "tròn", signature: "a1:9e2d13c1", refundCode: "HT-A-3001" },
  B: { id: "B", joint: "vuông", signature: "v2=c5881383", refundCode: "HT-B-3001" },
};

export const PARTS = ["cổng thanh toán", "dịch vụ hoàn tiền", "bộ kiểm chữ ký webhook"];

// Each run: which family every part came from. Only the first two come from a factory.
export const RUNS = [
  { label: "Bộ A", short: "Bộ A", factory: "A", parts: ["A", "A", "A"] },
  { label: "Bộ B", short: "Bộ B", factory: "B", parts: ["B", "B", "B"] },
  { label: "Bộ lẫn", short: "Bộ lẫn", factory: null, parts: ["A", "A", "B"] },
];

// The joints in plan, in units of the drawing. A part is 18 long; a knob on its
// right end fits the notch on the next part's left end only within the family.
export const JOINTS = {
  A: { kind: "round", neck: 1.7, head: 3.4, reach: 6.9, width: 6.8 },
  B: { kind: "square", half: 5, reach: 3, width: 10 },
};

// How far apart two parts' bodies stay when pushed together: 0 when the knob
// seats; otherwise the knob either bottoms out in a shallower notch or can't
// enter a narrower one at all.
export function gapBetween(left, right) {
  if (left === right) return 0;
  const knob = JOINTS[left];
  const notch = JOINTS[right];
  return knob.width <= notch.width ? Math.max(0, knob.reach - notch.reach) : knob.reach;
}

export const matched = (run) => run.parts.every((family) => family === run.parts[0]);

// 1250000 -> "1.250.000", the way the examples print amounts.
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
