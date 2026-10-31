// Trước khi có Visitor: mỗi thao tác tự kiểm tra kiểu của từng dòng.

const vnd = (n: number): string => (n < 0 ? "-" : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

class ProductLine {
  readonly sku: string;
  readonly qty: number;
  readonly price: number;
  constructor(sku: string, qty: number, price: number) {
    this.sku = sku;
    this.qty = qty;
    this.price = price;
  }
}

class ShippingLine {
  readonly zone: string;
  readonly fee: number;
  constructor(zone: string, fee: number) {
    this.zone = zone;
    this.fee = fee;
  }
}

class DiscountLine {
  readonly code: string;
  readonly value: number; // giảm giá là số âm
  constructor(code: string, value: number) {
    this.code = code;
    this.value = value;
  }
}

type Line = ProductLine | ShippingLine | DiscountLine;
type AccountingRecord = { kind: string; amount: number; [field: string]: string | number };

function vatTotal(lines: Line[]): number {
  let total = 0;
  for (const line of lines) {
    if (line instanceof ProductLine) total += Math.floor((line.qty * line.price * 10) / 100);
    else if (line instanceof ShippingLine) total += Math.floor((line.fee * 8) / 100);
    else if (line instanceof DiscountLine) total += Math.floor((line.value * 10) / 100);
  }
  return total;
}

function exportLines(lines: Line[]): AccountingRecord[] {
  const records: AccountingRecord[] = [];
  for (const line of lines) {
    if (line instanceof ProductLine) records.push({ kind: "product", sku: line.sku, qty: line.qty, amount: line.qty * line.price });
    else if (line instanceof ShippingLine) records.push({ kind: "shipping", zone: line.zone, amount: line.fee });
    // Dòng giảm giá bị bỏ quên ở đây, và không có gì báo lỗi.
  }
  return records;
}

const invoice: Line[] = [new ProductLine("SP-17", 2, 250_000), new ShippingLine("noi-thanh", 30_000), new DiscountLine("GIAM10", -50_000)];

console.log(`Tổng VAT: ${vnd(vatTotal(invoice))} ₫`);
const records = exportLines(invoice);
console.log(`Đã xuất ${records.length} dòng, cộng lại ${vnd(records.reduce((sum, r) => sum + r.amount, 0))} ₫`);
console.log("Tổng hoá đơn trước thuế: 480.000 ₫");
