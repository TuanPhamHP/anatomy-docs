// The Visitor figure's model: one invoice of three line types and two visitors
// that walk it. VAT charges goods at 10% and delivery at 8%, and a discount
// lowers the goods' taxable value, so its VAT is negative at the goods' rate.
// The export writes one accounting record per line. A fourth line type, gift
// wrapping, has no visit method in either visitor yet. build.mjs inlines this
// file, so the readout, the counters and the captions show these numbers; the
// Python and TypeScript examples under code/ print the same ones.

export const LINES = [
  { kind: "product", type: "ProductLine", method: "visit_product", label: "Sản phẩm", shape: "square", amount: 500000, rate: 10, record: { kind: "product", sku: "SP-17", qty: 2, amount: 500000 } },
  { kind: "shipping", type: "ShippingLine", method: "visit_shipping", label: "Giao hàng", shape: "round", amount: 30000, rate: 8, record: { kind: "shipping", zone: "noi-thanh", amount: 30000 } },
  { kind: "discount", type: "DiscountLine", method: "visit_discount", label: "Giảm giá", shape: "triangle", amount: -50000, rate: 10, record: { kind: "discount", code: "GIAM10", amount: -50000 } },
];

// The line type added in the last step: no visitor has a method for it.
export const NEW_LINE = { kind: "gift", type: "GiftWrapLine", label: "Gói quà", shape: "cross", amount: 15000 };

// VAT of one line, rounded toward minus infinity like the examples' integer division.
export const vatOf = (line) => Math.floor((line.amount * line.rate) / 100);

// Running VAT after each line, and the export after the whole pass.
export function vatPass() {
  let total = 0;
  return LINES.map((line) => {
    const vat = vatOf(line);
    total += vat;
    return { line, vat, total };
  });
}
export const VAT_TOTAL = vatPass().at(-1).total;
export const RECORDS = LINES.map((line) => line.record);
export const NET = LINES.reduce((sum, line) => sum + line.amount, 0);

// 47400 -> "47.400", -5000 -> "-5.000", the way the examples print money.
export const vnd = (n) => (n < 0 ? "-" : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
