// Iterator: duyệt đơn hàng của một API phân trang mà chỗ gọi không phải biết gì về trang hay cursor.
// Chạy: node iterator.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

interface Page {
  items: [string, number][];
  nextCursor: string | null;
}

const PAGES: Record<string, Page> = {
  start: { items: [["DH-001", 450_000], ["DH-002", 1_250_000], ["DH-003", 320_000], ["DH-004", 860_000]], nextCursor: "c2" },
  c2: { items: [["DH-005", 1_900_000], ["DH-006", 2_400_000], ["DH-007", 560_000], ["DH-008", 1_100_000]], nextCursor: "c3" },
  c3: { items: [["DH-009", 3_150_000], ["DH-010", 780_000]], nextCursor: null },
};

interface Order {
  code: string;
  total: number;
}

const vnd = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// API giả: trả từng trang đơn hàng theo cursor, đếm và in ra mỗi lần bị gọi.
class OrderApi {
  calls = 0;

  listOrders(cursor: string | null = null): Page {
    this.calls += 1;
    const page = PAGES[cursor ?? "start"];
    const tail = page.nextCursor === null ? ", đây là trang cuối" : "";
    console.log(`  gọi API lần ${this.calls}, cursor ${cursor ?? "đầu"}: nhận ${page.items.length} đơn${tail}`);
    return page;
  }
}

// Iterator: nhớ trang đang cầm và vị trí trong trang, chỉ gọi API khi trang ấy đã dùng hết.
class OrderIterator implements Iterator<Order> {
  private readonly api: OrderApi;
  private items: [string, number][] = [];
  private pos = 0;
  private cursor: string | null = null;
  private started = false;

  constructor(api: OrderApi) {
    this.api = api;
  }

  next(): IteratorResult<Order> {
    while (this.pos === this.items.length) {
      // Trang cuối đã dùng hết: báo cho vòng for dừng lại.
      if (this.started && this.cursor === null) return { done: true, value: undefined };
      const page = this.api.listOrders(this.cursor);
      this.started = true;
      this.items = page.items;
      this.pos = 0;
      this.cursor = page.nextCursor;
    }
    const [code, total] = this.items[this.pos];
    this.pos += 1;
    return { done: false, value: { code, total } };
  }
}

// Aggregate: tập đơn hàng nằm sau API. Mỗi vòng lặp nhận một iterator mới của riêng nó.
class OrderList implements Iterable<Order> {
  private readonly api: OrderApi;

  constructor(api: OrderApi) {
    this.api = api;
  }

  [Symbol.iterator](): OrderIterator {
    return new OrderIterator(this.api);
  }
}

// Client chỉ viết vòng for. Không có cursor, không có số trang, không có điều kiện dừng nào.
console.log("Duyệt hết danh sách:");
let api = new OrderApi();
const orders = [...new OrderList(api)];
const sum = orders.reduce((s, order) => s + order.total, 0);
console.log(`  ${orders.length} đơn, tổng ${vnd(sum)} ₫, ${api.calls} lần gọi API`);

console.log("Tìm đơn đầu tiên trên 2.000.000 ₫:");
api = new OrderApi();
let seen = 0;
for (const order of new OrderList(api)) {
  seen += 1;
  if (order.total > 2_000_000) {
    console.log(`  thấy ${order.code} (${vnd(order.total)} ₫) ở đơn thứ ${seen} rồi dừng vòng lặp`);
    break;
  }
}
console.log(`  ${api.calls} lần gọi API, trang thứ ba không bao giờ được tải`);
