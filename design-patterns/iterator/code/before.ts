// Trước khi có Iterator: chỗ nào cần danh sách đơn hàng cũng tự viết vòng lặp phân trang.
// Chạy: node before.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

interface Page {
  items: [string, number][];
  nextCursor: string | null;
}

const PAGES: Record<string, Page> = {
  start: { items: [["DH-001", 450_000], ["DH-002", 1_250_000], ["DH-003", 320_000], ["DH-004", 860_000]], nextCursor: "c2" },
  c2: { items: [["DH-005", 1_900_000], ["DH-006", 2_400_000], ["DH-007", 560_000], ["DH-008", 1_100_000]], nextCursor: "c3" },
  c3: { items: [["DH-009", 3_150_000], ["DH-010", 780_000]], nextCursor: null },
};

// API giả: trả từng trang đơn hàng theo cursor và đếm số lần bị gọi.
class OrderApi {
  calls = 0;

  listOrders(cursor: string | null = null): Page {
    this.calls += 1;
    return PAGES[cursor ?? "start"];
  }
}

const vnd = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Báo cáo doanh thu tự lo chuyện phân trang: giữ cursor, gọi tiếp, biết lúc nào dừng.
function revenue(api: OrderApi): number {
  let total = 0;
  let cursor: string | null = null;
  while (true) {
    const page = api.listOrders(cursor);
    total += page.items.reduce((sum, [, amount]) => sum + amount, 0);
    cursor = page.nextCursor;
    if (cursor === null) break;
  }
  return total;
}

// Màn hình đếm đơn chép lại vòng lặp ấy, nhưng điều kiện dừng đặt sai chỗ:
// nó thoát ngay khi thấy trang cuối, trước khi kịp đếm các đơn trong trang đó.
function countOrders(api: OrderApi): number {
  let count = 0;
  let page = api.listOrders();
  while (page.nextCursor !== null) {
    count += page.items.length;
    page = api.listOrders(page.nextCursor);
  }
  return count;
}

let api = new OrderApi();
console.log(`Doanh thu: ${vnd(revenue(api))} ₫ sau ${api.calls} lần gọi API`);
api = new OrderApi();
console.log(`Số đơn: ${countOrders(api)}, đúng ra phải là 10`);
