// Visitor: thêm thao tác mới cho các dòng hoá đơn mà không sửa lớp của dòng.

// 500000 thành "500.000", -5000 thành "-5.000".
const vnd = (n: number): string => (n < 0 ? "-" : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

interface LineVisitor {
  visitProduct(line: ProductLine): void;
  visitShipping(line: ShippingLine): void;
  visitDiscount(line: DiscountLine): void;
}

// Các dòng hoá đơn chỉ giữ dữ liệu của mình và một phương thức accept.
// accept gọi đúng phương thức visit dành cho loại dòng này.
class ProductLine {
  readonly sku: string;
  readonly qty: number;
  readonly price: number;
  constructor(sku: string, qty: number, price: number) {
    this.sku = sku;
    this.qty = qty;
    this.price = price;
  }
  accept(visitor: LineVisitor): void {
    visitor.visitProduct(this);
  }
}

class ShippingLine {
  readonly zone: string;
  readonly fee: number;
  constructor(zone: string, fee: number) {
    this.zone = zone;
    this.fee = fee;
  }
  accept(visitor: LineVisitor): void {
    visitor.visitShipping(this);
  }
}

class DiscountLine {
  readonly code: string;
  readonly value: number; // giảm giá là số âm
  constructor(code: string, value: number) {
    this.code = code;
    this.value = value;
  }
  accept(visitor: LineVisitor): void {
    visitor.visitDiscount(this);
  }
}

// Hàng hoá chịu thuế 10%, phí giao hàng 8%, giảm giá bớt thuế theo mức của hàng.
class VatVisitor implements LineVisitor {
  total = 0;
  rows: string[] = [];

  private add(label: string, base: number, rate: number): void {
    const vat = Math.floor((base * rate) / 100);
    this.total += vat;
    this.rows.push(`  ${label.padEnd(10)}${vnd(base).padStart(9)} ₫  thuế ${String(rate).padStart(2)}%  ${vnd(vat).padStart(7)} ₫`);
  }
  visitProduct(line: ProductLine): void {
    this.add("Sản phẩm", line.qty * line.price, 10);
  }
  visitShipping(line: ShippingLine): void {
    this.add("Giao hàng", line.fee, 8);
  }
  visitDiscount(line: DiscountLine): void {
    this.add("Giảm giá", line.value, 10);
  }
}

type AccountingRecord = { kind: string; amount: number; [field: string]: string | number };

// Mỗi dòng thành một bản ghi JSON cho phần mềm kế toán.
class ExportVisitor implements LineVisitor {
  records: AccountingRecord[] = [];

  visitProduct(line: ProductLine): void {
    this.records.push({ kind: "product", sku: line.sku, qty: line.qty, amount: line.qty * line.price });
  }
  visitShipping(line: ShippingLine): void {
    this.records.push({ kind: "shipping", zone: line.zone, amount: line.fee });
  }
  visitDiscount(line: DiscountLine): void {
    this.records.push({ kind: "discount", code: line.code, amount: line.value });
  }
}

const invoice = [new ProductLine("SP-17", 2, 250_000), new ShippingLine("noi-thanh", 30_000), new DiscountLine("GIAM10", -50_000)];

const vat = new VatVisitor();
for (const line of invoice) line.accept(vat);
console.log("Tính VAT bằng VatVisitor:");
console.log(vat.rows.join("\n"));
console.log(`Tổng VAT: ${vnd(vat.total)} ₫`);

const exporter = new ExportVisitor();
for (const line of invoice) line.accept(exporter);
console.log();
console.log("Xuất cho kế toán bằng ExportVisitor:");
for (const record of exporter.records) console.log("  " + JSON.stringify(record));
console.log(`Đã xuất ${exporter.records.length} dòng, cộng lại ${vnd(exporter.records.reduce((sum, r) => sum + r.amount, 0))} ₫`);

// Một loại dòng mới. Nếu thêm visitGiftWrap vào LineVisitor, tsc sẽ báo lỗi ở mọi visitor
// chưa viết nó. Ở đây ta mô phỏng lúc chạy mà chưa cập nhật visitor.
class GiftWrapLine {
  readonly fee: number;
  constructor(fee: number) {
    this.fee = fee;
  }
  accept(visitor: LineVisitor): void {
    (visitor as unknown as { visitGiftWrap(line: GiftWrapLine): void }).visitGiftWrap(this);
  }
}

console.log();
try {
  new GiftWrapLine(15_000).accept(vat);
} catch (error) {
  if (!(error instanceof TypeError)) throw error;
  console.log(`Thêm GiftWrapLine: ${vat.constructor.name} chưa có phương thức cho dòng gói quà`);
}
