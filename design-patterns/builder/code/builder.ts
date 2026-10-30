// Builder: dựng câu truy vấn danh sách đơn hàng từng bước, kiểm tra rồi mới tạo Query.
// Chạy: node builder.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

const SORTABLE = new Set(["created_at", "total"]);
const MAX_SIZE = 100;

type Param = string | number;

// Product: câu truy vấn đã dựng xong, chỉ đọc.
interface Query {
  readonly sql: string;
  readonly params: readonly Param[];
}

// Builder: gom từng phần. Mỗi hàm trả về chính builder để gọi nối tiếp.
class OrderQueryBuilder {
  private where: [string, Param][] = [];
  private order: string | null = null;
  private paging: [number, number] | null = null;

  status(value: string): this {
    this.where.push(["status = ?", value]);
    return this;
  }

  createdBetween(start: string, end: string): this {
    if (start >= end) throw new Error("ngày bắt đầu phải trước ngày kết thúc");
    this.where.push(["created_at >= ?", start], ["created_at < ?", end]);
    return this;
  }

  customer(customerId: number): this {
    this.where.push(["customer_id = ?", customerId]);
    return this;
  }

  orderBy(column: string, desc = false): this {
    // Tên cột không đi qua tham số được, nên chỉ nhận cột trong danh sách.
    if (!SORTABLE.has(column)) throw new Error(`không sắp xếp theo cột ${column}`);
    this.order = `ORDER BY ${column}` + (desc ? " DESC" : "");
    return this;
  }

  page(num: number, size: number): this {
    if (num < 1 || size < 1 || size > MAX_SIZE) throw new Error(`page từ 1, size từ 1 đến ${MAX_SIZE}`);
    this.paging = [size, (num - 1) * size];
    return this;
  }

  build(): Query {
    // Kiểm tra cả bộ một lần, rồi mới ghép câu theo đúng ngữ pháp SQL.
    if (!this.paging) throw new Error("thiếu page(): danh sách đơn phải phân trang");
    const lines = ["SELECT id, code, total FROM orders"];
    const params: Param[] = [];
    this.where.forEach(([condition, value], i) => {
      lines.push((i === 0 ? "WHERE " : "  AND ") + condition);
      params.push(value);
    });
    if (this.order) lines.push(this.order);
    lines.push("LIMIT ? OFFSET ?");
    params.push(...this.paging);
    return Object.freeze({ sql: lines.join("\n"), params: Object.freeze(params) });
  }
}

const show = (params: readonly Param[]) =>
  "[" + params.map((p) => (typeof p === "string" ? `"${p}"` : String(p))).join(", ") + "]";

const builder = new OrderQueryBuilder()
  .status("paid")
  .createdBetween("2026-10-01", "2026-11-01")
  .orderBy("created_at", true);

try {
  builder.build();
} catch (error) {
  console.log(`build() từ chối: ${(error as Error).message}`);
}

const query = builder.page(3, 20).build();
console.log(query.sql);
console.log("params =", show(query.params));
