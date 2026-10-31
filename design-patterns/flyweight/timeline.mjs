// The Flyweight figure's motion: one timeline per step, a pure function of time.
// A step clears the turret and the tape, loads the 12 order lines (dropping a
// stamp into the turret for each line, or only on a product's first line when
// stamps are shared), optionally fits the discount band on stamp B, then prints
// the 12 labels: the turret turns the line's stamp under the ram, the ram presses
// it and the number wheel beside it onto the tape, and the tape moves one pitch.
// build.mjs uses it for the drawing's resting pose; the page inlines it.

import { LINES, SIZE } from "./model.mjs";

export const HOLDERS = 12;
export const STEP_DEG = 360 / HOLDERS;
export const PRESS_DEG = 90; // the holder under the ram sits on the +y side of the turret
export const SHARED_HOLDER = { A: 0, B: 3, C: 8 };

export const CLEAR = 0.9;
export const LOAD_EACH = 0.2;
export const EDIT = 1.2;
export const PRINT_EACH = 0.62;
export const RUNOUT = 0.35;

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const span = (t, from, to) => ease((t - from) / (to - from));
const angleFor = (holder) => PRESS_DEG - holder * STEP_DEG;
const shortest = (from, to) => from + ((((to - from) % 360) + 540) % 360) - 180;

// Which holder carries the stamp for order line i, and which stamp each holder carries.
const holderOf = (step, i) => (step.shared ? SHARED_HOLDER[LINES[i][0]] : i);
function loading(step) {
  const firstSeen = new Set();
  return LINES.map(([product], i) => {
    const fresh = !step.shared || !firstSeen.has(product);
    firstSeen.add(product);
    return { holder: holderOf(step, i), product, fresh, cost: step.shared ? SIZE.line + SIZE.ref + (fresh ? SIZE.product : 0) : SIZE.product + SIZE.line };
  });
}

const printStart = (step) => CLEAR + LINES.length * LOAD_EACH + (step.edited ? EDIT : 0);
export const endOf = (step) => printStart(step) + LINES.length * PRINT_EACH + RUNOUT;

// The whole state of the machine at time t of `step`. `before` is the state the
// machine was in when the step was chosen (null for an empty machine).
export function stateAt(step, t, before) {
  const holders = Array.from({ length: HOLDERS }, () => ({ product: null, dz: 0, alpha: 0, band: 0 }));
  const labels = [];
  let angle = angleFor(0), press = 0, pressing = -1, lit = -1, digit = "", tape = 0, stamps = 0, memory = 0, phase = "";

  if (t < CLEAR && before) {
    // Clearing: the stamps that were there lift out and fade, the labels fade, the turret turns home.
    const u = span(t, 0, CLEAR);
    before.holders.forEach((h, i) => { if (h.product) holders[i] = { ...h, dz: h.dz + (12 - h.dz) * u, alpha: h.alpha * (1 - u), band: h.band * (1 - u) }; });
    before.labels.forEach((label) => labels.push({ ...label, alpha: label.alpha * (1 - span(t, 0, CLEAR * 0.6)) }));
    angle = before.angle + (shortest(before.angle, angleFor(0)) - before.angle) * u;
    tape = before.tape;
    stamps = Math.round(before.stamps * (1 - u));
    memory = before.memory * (1 - u);
    return { holders, labels, angle, press, pressing, lit, digit, tape, stamps, memory, phase: "dọn máy" };
  }

  // Loading: one line every LOAD_EACH seconds; a new stamp drops in where one is needed.
  const plan = loading(step);
  plan.forEach((line, i) => {
    const at = CLEAR + i * LOAD_EACH;
    if (t < at) return;
    const u = span(t, at, at + LOAD_EACH * 0.9);
    memory += line.cost * Math.min(1, (t - at) / (LOAD_EACH * 0.9));
    if (line.fresh) {
      stamps += 1;
      holders[line.holder] = { product: line.product, dz: 12 * (1 - u), alpha: u, band: 0 };
    }
  });
  const loadEnd = CLEAR + LINES.length * LOAD_EACH;
  if (t < loadEnd) phase = `nạp dòng ${Math.min(LINES.length, Math.floor((t - CLEAR) / LOAD_EACH) + 1)}/${LINES.length}`;

  // The discount band goes onto stamp B under the ram.
  if (step.edited && t >= loadEnd) {
    const h = SHARED_HOLDER[step.edited];
    angle = angleFor(0) + (shortest(angleFor(0), angleFor(h)) - angleFor(0)) * span(t, loadEnd, loadEnd + 0.35);
    holders[h].band = span(t, loadEnd + 0.4, loadEnd + 0.95);
    lit = t >= loadEnd + 0.4 ? h : -1;
    if (t < loadEnd + EDIT) phase = "gắn nhãn giảm giá lên con dấu B";
  }

  // Printing.
  const start = printStart(step);
  for (let i = 0; i < LINES.length; i++) {
    const at = start + i * PRINT_EACH;
    if (t < at) break;
    const h = plan[i].holder;
    const target = shortest(angle, angleFor(h));
    angle = angle + (target - angle) * span(t, at, at + 0.24);
    digit = String(LINES[i][1]);
    if (t >= at + 0.24) {
      press = t < at + 0.42 ? span(t, at + 0.24, at + 0.36) : 1 - span(t, at + 0.42, at + 0.54);
      pressing = press > 0 ? h : -1;
    }
    if (!step.edited) lit = t >= at + 0.24 ? h : -1;
    if (t >= at + 0.36) labels.push({ i, product: LINES[i][0], qty: LINES[i][1], edited: step.edited === LINES[i][0], alpha: 1 });
    tape = i + span(t, at + 0.54, at + PRINT_EACH);
    phase = `in dòng ${i + 1}/${LINES.length}`;
  }
  const printEnd = start + LINES.length * PRINT_EACH;
  if (t >= printEnd) {
    tape = LINES.length + span(t, printEnd, printEnd + RUNOUT);
    press = 0;
    pressing = -1;
    phase = "";
  }
  return { holders, labels, angle, press, pressing, lit, digit, tape, stamps, memory, phase };
}
