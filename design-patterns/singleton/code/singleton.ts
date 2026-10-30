// Singleton: cả process dùng chung đúng một pool kết nối.
// Chạy: node singleton.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

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

const db = new Database();

class ConnectionPool {
  static created = 0;
  private static instance: ConnectionPool | null = null;
  readonly id: number;

  // private: code bên ngoài không gọi được `new ConnectionPool()`.
  private constructor(size = 10) {
    this.id = ++ConnectionPool.created;
    db.open(size);
  }

  // Lần gọi đầu tạo pool, mọi lần sau trả lại đúng đối tượng đó.
  // JavaScript chạy một luồng, nên không cần khoá như bản Python.
  static getInstance(): ConnectionPool {
    if (ConnectionPool.instance === null) ConnectionPool.instance = new ConnectionPool();
    return ConnectionPool.instance;
  }
}

class OrderService {
  pool = ConnectionPool.getInstance();
}

class PaymentService {
  pool = ConnectionPool.getInstance();
}

class ReportService {
  pool = ConnectionPool.getInstance();
}

const services: { pool: ConnectionPool }[] = [];
const kinds: [string, new () => { pool: ConnectionPool }][] = [
  ["Đơn hàng", OrderService],
  ["Thanh toán", PaymentService],
  ["Báo cáo", ReportService],
];
for (const [name, Service] of kinds) {
  services.push(new Service());
  console.log(`${name.padEnd(10)} -> pool #${services.at(-1)!.pool.id}, cổng đang dùng ${db.used}/${Database.MAX_CONNECTIONS}`);
}
const same = services.every((s) => s.pool === services[0].pool);
console.log(`Đã tạo ${ConnectionPool.created} pool cho 3 service; cùng một object: ${same ? "có" : "không"}`);
