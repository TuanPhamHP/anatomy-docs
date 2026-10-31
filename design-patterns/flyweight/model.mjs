// The Flyweight figure's model: a batch of 12 order lines over 3 products, and
// what holding them costs in memory with and without shared product objects.
// build.mjs inlines this file, so the counters, the gauge and the captions show
// these numbers; the Python and TypeScript examples under code/ load the same
// 12 lines (and a 100.000-line report) and print the same ones.

// The shared, heavy part of a product: name, description, image details.
export const PRODUCTS = {
  A: { code: "SP-001", name: "Bình giữ nhiệt", mark: "ring" },
  B: { code: "SP-002", name: "Hộp trà", mark: "double" },
  C: { code: "SP-003", name: "Ly sứ", mark: "dot" },
};

// The 12 order lines of the batch in the figure: [product, quantity].
export const LINES = [
  ["A", 2], ["B", 1], ["A", 1], ["C", 3], ["B", 2], ["A", 1],
  ["C", 1], ["B", 4], ["A", 3], ["B", 1], ["C", 2], ["A", 1],
];

// Estimated sizes in bytes: one product object with its name, description and
// image details; one order line's own fields; one reference to a shared object.
export const SIZE = { product: 2000, line: 64, ref: 8 };

// The whole report the batch comes from.
export const REPORT = { lines: 100000, products: 300 };

// Memory to hold `lines` order lines over `products` distinct products.
export const memory = (lines, products, shared) =>
  shared ? products * SIZE.product + lines * (SIZE.line + SIZE.ref) : lines * (SIZE.product + SIZE.line);

// 24768 -> "24,8 KB", 206400000 -> "206,4 MB" (1 KB = 1.000 byte, as the examples print).
const oneDecimal = (n) => n.toFixed(1).replace(".", ",");
export const kb = (bytes) => `${oneDecimal(bytes / 1000)} KB`;
export const mb = (bytes) => `${oneDecimal(bytes / 1e6)} MB`;
export const groupDots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// The three steps of the figure.
export const STEPS = [
  { id: "copy", shared: false, label: "Mỗi dòng một con dấu", short: "Riêng" },
  { id: "share", shared: true, label: "Dùng chung con dấu", short: "Chung" },
  { id: "edit", shared: true, edited: "B", label: "Lỡ sửa con dấu B", short: "Sửa B" },
];

const distinct = new Set(LINES.map(([product]) => product)).size;
// What each step ends with: stamps made, memory for the batch and for the whole report.
export const RESULTS = STEPS.map((step) => ({
  ...step,
  stamps: step.shared ? distinct : LINES.length,
  batch: memory(LINES.length, distinct, step.shared),
  report: memory(REPORT.lines, REPORT.products, step.shared),
}));

// The order lines (1-based) that use product B: they all change when its stamp does.
export const LINES_OF = (product) => LINES.map(([p], i) => (p === product ? i + 1 : 0)).filter(Boolean);
