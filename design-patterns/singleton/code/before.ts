// Khi chưa có Singleton: mỗi service tự tạo pool kết nối của riêng nó.
// Chạy: node before.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

class Database {
  static readonly MAX_CONNECTIONS = 20;
  used = 0;

  open(count: number): void {
    if (this.used + count > Database.MAX_CONNECTIONS) {
      throw new Error(`hết cổng (đang dùng ${this.used}/${Database.MAX_CONNECTIONS}, cần thêm ${count})`);
    }
    this.used += count;
  }
}

class ConnectionPool {
  static created = 0;
  readonly id: number;

  constructor(db: Database, size = 10) {
    this.id = ++ConnectionPool.created;
    db.open(size); // mở sẵn `size` kết nối tới cơ sở dữ liệu
  }
}

const db = new Database();

// Mỗi service tự tạo pool: ba pool, cần 30 kết nối trong khi DB chỉ cho 20.
class OrderService {
  pool = new ConnectionPool(db);
}

class PaymentService {
  pool = new ConnectionPool(db);
}

class ReportService {
  pool = new ConnectionPool(db);
}

const services: [string, new () => { pool: ConnectionPool }][] = [
  ["Đơn hàng", OrderService],
  ["Thanh toán", PaymentService],
  ["Báo cáo", ReportService],
];
for (const [name, Service] of services) {
  try {
    const { pool } = new Service();
    console.log(`${name.padEnd(10)} -> pool #${pool.id}, cổng đang dùng ${db.used}/${Database.MAX_CONNECTIONS}`);
  } catch (error) {
    console.log(`${name.padEnd(10)} -> LỖI: ${(error as Error).message}`);
  }
}
console.log(`Đã tạo ${ConnectionPool.created} pool cho 3 service`);
