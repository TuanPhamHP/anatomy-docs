// Cách thường dùng hơn Singleton: tạo đúng một pool ở composition root rồi truyền vào.
// Chạy: node di.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

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

interface Pool {
  readonly id: number;
  query(sql: string): object[];
}

class ConnectionPool implements Pool {
  static created = 0;
  readonly id: number;

  constructor(db: Database, size = 10) {
    this.id = ++ConnectionPool.created;
    db.open(size);
  }

  query(sql: string): object[] {
    return [];
  }
}

// Service không tự đi tìm pool: nó nhận pool qua constructor.
class OrderService {
  readonly pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
}

class PaymentService {
  readonly pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
}

class ReportService {
  readonly pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }

  daily(): number {
    return this.pool.query("SELECT * FROM orders WHERE day = today").length;
  }
}

// Pool giả cho test: không mở kết nối nào.
const fakePool: Pool = { id: 0, query: () => [{ id: 1 }, { id: 2 }] };

// Composition root: chỗ duy nhất quyết định "chỉ có một pool".
const db = new Database();
const pool = new ConnectionPool(db);
const services: [string, { pool: Pool }][] = [
  ["Đơn hàng", new OrderService(pool)],
  ["Thanh toán", new PaymentService(pool)],
  ["Báo cáo", new ReportService(pool)],
];
for (const [name, service] of services) {
  console.log(`${name.padEnd(10)} -> pool #${service.pool.id}, cổng đang dùng ${db.used}/${Database.MAX_CONNECTIONS}`);
}
const same = services.every(([, service]) => service.pool === pool);
console.log(`Đã tạo ${ConnectionPool.created} pool cho 3 service; cùng một object: ${same ? "có" : "không"}`);
console.log(`Test với pool giả: ReportService đọc ${new ReportService(fakePool).daily()} dòng, không mở kết nối nào`);
