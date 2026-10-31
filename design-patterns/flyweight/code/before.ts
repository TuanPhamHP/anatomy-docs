// Khi chưa có Flyweight: mỗi dòng đơn hàng tự giữ một bản sao thông tin sản phẩm.
// Chạy: node before.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

// Kích thước ước tính, tính bằng byte.
const PRODUCT_BYTES = 2000; // tên, mô tả dài và thông tin ảnh của một sản phẩm
const LINE_BYTES = 64; // phần riêng của một dòng: số lượng, mã đơn...

const CATALOG: Record<string, [string, string, string]> = {
  "SP-001": ["Bình giữ nhiệt", "Thép không gỉ hai lớp, giữ nóng 12 giờ, dung tích 500 ml.", "sp-001.jpg 800x800"],
  "SP-002": ["Hộp trà", "Trà ô long Bảo Lộc, hộp thiếc 200 g.", "sp-002.jpg 800x800"],
  "SP-003": ["Ly sứ", "Ly sứ trắng men bóng, 350 ml, dùng được trong lò vi sóng.", "sp-003.jpg 800x800"],
};

// Đọc tên, mô tả và ảnh của một sản phẩm từ cơ sở dữ liệu.
function details(code: string): [string, string, string] {
  return CATALOG[code] ?? [`Sản phẩm ${code}`, `Mô tả chi tiết của ${code}.`, `${code.toLowerCase()}.jpg 800x800`];
}

class ProductInfo {
  static made = 0; // đếm số đối tượng sản phẩm đã tạo
  code: string;
  name: string;
  description: string;
  image: string;

  constructor(code: string) {
    ProductInfo.made += 1;
    this.code = code;
    [this.name, this.description, this.image] = details(code);
  }
}

interface OrderLine {
  product: ProductInfo; // bản sao riêng của dòng này
  quantity: number;
}

// Dòng nào cũng tạo một ProductInfo mới, kể cả khi sản phẩm đã có ở dòng trước.
const load = (rows: [string, number][]): OrderLine[] => rows.map(([code, quantity]) => ({ product: new ProductInfo(code), quantity }));

const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const size = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${(bytes / 1000).toFixed(1)} KB`).replace(".", ",");

function summary(title: string, rows: [string, number][]): void {
  ProductInfo.made = 0;
  const lines = load(rows);
  const memory = ProductInfo.made * PRODUCT_BYTES + lines.length * LINE_BYTES;
  console.log(title);
  console.log(`  đối tượng sản phẩm: ${group(ProductInfo.made)}`);
  console.log(`  bộ nhớ ước tính: ${size(memory)}`);
}

const BATCH: [string, number][] = [
  ["SP-001", 2], ["SP-002", 1], ["SP-001", 1], ["SP-003", 3], ["SP-002", 2], ["SP-001", 1],
  ["SP-003", 1], ["SP-002", 4], ["SP-001", 3], ["SP-002", 1], ["SP-003", 2], ["SP-001", 1],
];
const REPORT: [string, number][] = Array.from({ length: 100_000 }, (_, i) => [`SP-${String((i % 300) + 1).padStart(3, "0")}`, (i % 5) + 1]);

summary("Lô 12 dòng trong hình:", BATCH);
summary("Cả báo cáo 100.000 dòng:", REPORT);
