// Template Method: một khung export cố định, lớp con chỉ viết phần định dạng.
// Chạy: node template-method.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

interface Order {
  id: string;
  amount: number; // VND
  status: "paid" | "cancelled";
}

const ORDERS: Order[] = [
  { id: "DH-101", amount: 1250000, status: "paid" },
  { id: "DH-102", amount: 860000, status: "cancelled" },
  { id: "DH-103", amount: 2400000, status: "paid" },
  { id: "DH-104", amount: 540000, status: "paid" },
  { id: "DH-105", amount: 1100000, status: "cancelled" },
  { id: "DH-106", amount: 375000, status: "paid" },
];

const vnd = (n: number) => n.toLocaleString("vi-VN");
const sum = (rows: Order[]) => rows.reduce((total, order) => total + order.amount, 0);

abstract class ReportExporter {
  protected extension = "txt";

  // Template method: thứ tự các bước cố định. Lớp con không ghi đè hàm này.
  export(): string[] {
    const orders = this.readOrders();
    const rows = this.keepValid(orders);
    const lines: string[] = [];
    const header = this.header();
    if (header !== null) lines.push(header);
    for (const order of rows) lines.push(this.formatRow(order));
    const footer = this.footer(rows);
    if (footer !== null) lines.push(footer);
    this.write(lines, orders, rows);
    return lines;
  }

  // Các bước dùng chung: viết một lần ở lớp cha.
  protected readOrders(): Order[] {
    return ORDERS; // thực tế: truy vấn cơ sở dữ liệu
  }

  protected keepValid(orders: Order[]): Order[] {
    return orders.filter((order) => order.status !== "cancelled");
  }

  protected write(lines: string[], orders: Order[], rows: Order[]): void {
    console.log(`== report.${this.extension} ==`);
    console.log(lines.join("\n"));
    console.log(`-> đọc ${orders.length} đơn, bỏ ${orders.length - rows.length} đơn huỷ, ghi ${lines.length} dòng, tổng ${vnd(sum(rows))} ₫\n`);
  }

  // Bước bắt buộc: lớp con phải viết.
  protected abstract formatRow(order: Order): string;

  // Hook: mặc định không làm gì, lớp con ghi đè khi cần.
  protected header(): string | null {
    return null;
  }

  protected footer(rows: Order[]): string | null {
    return null;
  }
}

class CsvExporter extends ReportExporter {
  protected extension = "csv";

  protected header(): string {
    return "ma_don,so_tien";
  }

  protected formatRow(order: Order): string {
    return `${order.id},${order.amount}`;
  }
}

class JsonLinesExporter extends ReportExporter {
  protected extension = "jsonl";

  protected formatRow(order: Order): string {
    return JSON.stringify({ ma_don: order.id, so_tien: order.amount });
  }
}

// File độ rộng cố định, kiểu file gửi ngân hàng: bản ghi đầu, chi tiết, bản ghi cuối.
class FixedWidthExporter extends ReportExporter {
  protected header(): string {
    return "H20261030BAOCAO";
  }

  protected formatRow(order: Order): string {
    return `D${order.id.padEnd(8)}${String(order.amount).padStart(12, "0")}`;
  }

  protected footer(rows: Order[]): string {
    return `T${String(rows.length).padStart(6, "0")}${String(sum(rows)).padStart(12, "0")}`;
  }
}

for (const exporter of [new CsvExporter(), new JsonLinesExporter(), new FixedWidthExporter()]) {
  exporter.export();
}
