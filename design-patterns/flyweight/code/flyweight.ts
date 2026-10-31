// Flyweight: các dòng đơn hàng dùng chung một đối tượng cho mỗi sản phẩm.
// Chạy: node flyweight.ts   (Node 22.18 trở lên chạy thẳng TypeScript)
"use strict";

// Kích thước ước tính, tính bằng byte.
const PRODUCT_BYTES = 2000; // tên, mô tả dài và thông tin ảnh của một sản phẩm
const LINE_BYTES = 64; // phần riêng của một dòng: số lượng, mã đơn...
const REF_BYTES = 8; // một tham chiếu tới sản phẩm dùng chung

const CATALOG: Record<string, [string, string, string]> = {
  "SP-001": ["Bình giữ nhiệt", "Thép không gỉ hai lớp, giữ nóng 12 giờ, dung tích 500 ml.", "sp-001.jpg 800x800"],
  "SP-002": ["Hộp trà", "Trà ô long Bảo Lộc, hộp thiếc 200 g.", "sp-002.jpg 800x800"],
  "SP-003": ["Ly sứ", "Ly sứ trắng men bóng, 350 ml, dùng được trong lò vi sóng.", "sp-003.jpg 800x800"],
};

// Đọc tên, mô tả và ảnh của một sản phẩm từ cơ sở dữ liệu.
function details(code: string): [string, string, string] {
  return CATALOG[code] ?? [`Sản phẩm ${code}`, `Mô tả chi tiết của ${code}.`, `${code.toLowerCase()}.jpg 800x800`];
}

// Flyweight: phần nặng và không đổi của sản phẩm. Object.freeze để không ai sửa được nó,
// vì sửa một đối tượng dùng chung là sửa luôn mọi dòng đang trỏ tới nó.
interface Product {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
}

// Factory: mỗi mã sản phẩm chỉ tạo đúng một đối tượng, những lần sau trả lại đối tượng cũ.
class ProductCatalog {
  private made = new Map<string, Product>();

  get(code: string): Product {
    let product = this.made.get(code);
    if (!product) {
      const [name, description, image] = details(code);
      product = Object.freeze({ code, name, description, image });
      this.made.set(code, product);
    }
    return product;
  }

  get size(): number {
    return this.made.size;
  }
}

// Phần riêng của từng dòng: số lượng, cùng một tham chiếu tới sản phẩm dùng chung.
class OrderLine {
  product: Product;
  quantity: number;

  constructor(product: Product, quantity: number) {
    this.product = product;
    this.quantity = quantity;
  }

  label(): string {
    return `${this.product.name} x${this.quantity}`;
  }
}

const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const size = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${(bytes / 1000).toFixed(1)} KB`).replace(".", ",");

function summary(title: string, rows: [string, number][]): OrderLine[] {
  const catalog = new ProductCatalog();
  const lines = rows.map(([code, quantity]) => new OrderLine(catalog.get(code), quantity));
  const memory = catalog.size * PRODUCT_BYTES + lines.length * (LINE_BYTES + REF_BYTES);
  console.log(title);
  console.log(`  đối tượng sản phẩm: ${group(catalog.size)}`);
  console.log(`  bộ nhớ ước tính: ${size(memory)}`);
  return lines;
}

const BATCH: [string, number][] = [
  ["SP-001", 2], ["SP-002", 1], ["SP-001", 1], ["SP-003", 3], ["SP-002", 2], ["SP-001", 1],
  ["SP-003", 1], ["SP-002", 4], ["SP-001", 3], ["SP-002", 1], ["SP-003", 2], ["SP-001", 1],
];
const REPORT: [string, number][] = Array.from({ length: 100_000 }, (_, i) => [`SP-${String((i % 300) + 1).padStart(3, "0")}`, (i % 5) + 1]);

const lines = summary("Lô 12 dòng trong hình:", BATCH);
summary("Cả báo cáo 100.000 dòng:", REPORT);

const shared = lines[1].product === lines[4].product;
console.log(`Dòng 2 và dòng 5 dùng chung một đối tượng sản phẩm: ${shared ? "có" : "không"}`);
const usesB = lines.flatMap((line, i) => (line.product.code === "SP-002" ? [String(i + 1)] : []));
console.log(`Các dòng dùng sản phẩm B: ${usesB.join(", ")}`);
try {
  (lines[1].product as { name: string }).name = "Hộp trà (giảm giá)"; // chỉ muốn đổi cho riêng dòng 2
} catch {
  console.log("Thử sửa tên sản phẩm B cho riêng dòng 2: bị chặn, vì sản phẩm dùng chung là bất biến");
}
