// Observer: một sự kiện "đã đặt hàng", nhiều listener độc lập với nhau.
// Chạy: node observer.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

interface Order {
  code: string;
  items: number;
  total: number; // VND
}

const vnd = (n: number) => n.toLocaleString("vi-VN");

// Observer: interface chung. Listener nào cũng chỉ cần một hàm nhận đơn hàng.
interface OrderListener {
  onOrderPlaced(order: Order): void;
}

// Subject: giữ danh sách listener và phát sự kiện. Nó không biết listener nào làm gì.
class OrderPlaced {
  private readonly listeners: OrderListener[] = [];

  subscribe(listener: OrderListener): void {
    this.listeners.push(listener);
  }

  unsubscribe(listener: OrderListener): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) this.listeners.splice(index, 1);
  }

  notify(order: Order): void {
    for (const listener of [...this.listeners]) listener.onOrderPlaced(order);
  }
}

// Concrete observers: mỗi lớp lo một việc và không biết các lớp khác.
class EmailListener implements OrderListener {
  onOrderPlaced(order: Order): void {
    console.log(`  Email: gửi xác nhận đơn ${order.code}`);
  }
}

class StockListener implements OrderListener {
  onOrderPlaced(order: Order): void {
    console.log(`  Kho: giữ ${order.items} sản phẩm`);
  }
}

class PointsListener implements OrderListener {
  static readonly POINT_VALUE = 10_000; // 1 điểm cho mỗi 10.000 ₫

  onOrderPlaced(order: Order): void {
    console.log(`  Điểm: cộng ${Math.floor(order.total / PointsListener.POINT_VALUE)} điểm`);
  }
}

class AnalyticsListener implements OrderListener {
  onOrderPlaced(order: Order): void {
    console.log(`  Thống kê: ghi doanh thu ${vnd(order.total)} ₫`);
  }
}

// Nơi phát sự kiện: lưu đơn rồi báo cho ai đang nghe, không gọi thẳng ai cả.
class OrderService {
  private readonly placed: OrderPlaced;

  constructor(placed: OrderPlaced) {
    this.placed = placed;
  }

  place(order: Order): void {
    console.log(`Đơn ${order.code} (${order.items} sản phẩm, ${vnd(order.total)} ₫)`);
    // ... lưu đơn hàng vào cơ sở dữ liệu ...
    this.placed.notify(order);
  }
}

const placed = new OrderPlaced();
const email = new EmailListener();
for (const listener of [email, new StockListener(), new PointsListener()]) placed.subscribe(listener);
const service = new OrderService(placed);

service.place({ code: "#1001", items: 2, total: 1_250_000 });

console.log("+ subscribe(Thống kê)");
placed.subscribe(new AnalyticsListener());
service.place({ code: "#1002", items: 3, total: 860_000 });

console.log("- unsubscribe(Email)");
placed.unsubscribe(email);
service.place({ code: "#1003", items: 1, total: 2_400_000 });
