// The Template Method figure's model: six orders, one fixed export skeleton and
// three subclasses that only say how a row (and an optional header and footer)
// looks. build.mjs inlines this file into the page, so the readout, the counter
// on the machine and the step captions show exactly these results. The Python
// and TypeScript examples under code/ use the same orders and print the same lines.

export const ORDERS = [
  { id: "DH-101", amount: 1250000, status: "paid" },
  { id: "DH-102", amount: 860000, status: "cancelled" },
  { id: "DH-103", amount: 2400000, status: "paid" },
  { id: "DH-104", amount: 540000, status: "paid" },
  { id: "DH-105", amount: 1100000, status: "cancelled" },
  { id: "DH-106", amount: 375000, status: "paid" },
];

const sum = (rows) => rows.reduce((total, order) => total + order.amount, 0);

// One entry per subclass. `header` and `footer` are hooks: null means the
// subclass keeps the base class's default, which writes nothing.
export const FORMATS = [
  {
    id: "csv",
    cls: "CsvExporter",
    label: "CSV",
    short: "CSV",
    file: "report.csv",
    header: () => "ma_don,so_tien",
    row: (order) => `${order.id},${order.amount}`,
    footer: null,
  },
  {
    id: "jsonl",
    cls: "JsonLinesExporter",
    label: "JSON Lines",
    short: "JSONL",
    file: "report.jsonl",
    header: null,
    row: (order) => JSON.stringify({ ma_don: order.id, so_tien: order.amount }),
    footer: null,
  },
  {
    id: "fixed",
    cls: "FixedWidthExporter",
    label: "Fixed-width",
    short: "Fixed",
    file: "report.txt",
    header: () => "H20261030BAOCAO",
    row: (order) => `D${order.id.padEnd(8)}${String(order.amount).padStart(12, "0")}`,
    footer: (rows) => `T${String(rows.length).padStart(6, "0")}${String(sum(rows)).padStart(12, "0")}`,
  },
];

// The template method: read, filter, header, rows, footer, write. Always in
// this order; a format only fills in its own steps.
export function exportReport(format) {
  const read = ORDERS;
  const rows = read.filter((order) => order.status !== "cancelled");
  const lines = [];
  const header = format.header ? format.header() : null;
  if (header !== null) lines.push(header);
  for (const order of rows) lines.push(format.row(order));
  const footer = format.footer ? format.footer(rows) : null;
  if (footer !== null) lines.push(footer);
  return { file: format.file, lines, read: read.length, kept: rows.length, dropped: read.length - rows.length, total: sum(rows), header: header !== null, footer: footer !== null };
}

// Which of the six slots on the tray hold a cancelled order (the filter station lifts these).
export const CANCELLED = ORDERS.map((order, i) => (order.status === "cancelled" ? i : -1)).filter((i) => i >= 0);

// 4565000 -> "4.565.000"
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
