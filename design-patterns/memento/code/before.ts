// Khi chưa có Memento: công cụ admin tự với vào các trường của cấu hình để sao lưu.
// Chạy: node before.ts

interface Order {
  value: number;
  km: number;
}

const SAMPLE: Order = { value: 250_000, km: 5 };

const vnd = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

class PricingConfig {
  // Để công cụ admin sao lưu được, các trường đành phải để công khai.
  base: number;
  perKm: number;
  freeFrom: number; // trường này được thêm sau, khi có chương trình miễn phí

  constructor(base: number, perKm: number, freeFrom: number) {
    this.base = base;
    this.perKm = perKm;
    this.freeFrom = freeFrom;
  }

  update(base: number, perKm: number, freeFrom: number): void {
    this.base = base;
    this.perKm = perKm;
    this.freeFrom = freeFrom;
  }

  bulkUpdate(factor: number): void {
    this.base *= factor;
    this.perKm *= factor;
    this.freeFrom *= factor;
  }

  fee(order: Order): number {
    if (order.value >= this.freeFrom) return 0;
    return this.base + order.km * this.perKm;
  }

  row(): string {
    return vnd(this.base).padStart(9) + vnd(this.perKm).padStart(9) + vnd(this.freeFrom).padStart(13);
  }
}

class AdminTool {
  private config: PricingConfig;
  private backups = new Map<string, { base: number; perKm: number }>();

  constructor(config: PricingConfig) {
    this.config = config;
  }

  backup(label: string): void {
    // Chép tay từng trường. Đoạn này viết từ trước khi có freeFrom, nên quên mất nó.
    this.backups.set(label, { base: this.config.base, perKm: this.config.perKm });
  }

  restore(label: string): void {
    const saved = this.backups.get(label)!;
    this.config.base = saved.base;
    this.config.perKm = saved.perKm;
  }
}

function show(step: string, config: PricingConfig): void {
  console.log(step.padEnd(15) + config.row() + vnd(config.fee(SAMPLE)).padStart(10) + " ₫");
}

const config = new PricingConfig(15_000, 4_000, 300_000);
const admin = new AdminTool(config);
console.log("Bước".padEnd(15) + "Phí gốc".padStart(9) + "Mỗi km".padStart(9) + "Miễn phí từ".padStart(13) + "Đơn mẫu".padStart(12));

admin.backup("v1");
show("lưu v1", config);

config.update(20_000, 2_500, 500_000);
admin.backup("v2");
show("lưu v2", config);

config.bulkUpdate(10);
show("sửa hàng loạt", config);

admin.restore("v2");
show("khôi phục v2", config);

admin.restore("v1");
show("khôi phục v1", config);

const big: Order = { value: 600_000, km: 5 };
console.log(`Đơn ${vnd(big.value)} ₫ lẽ ra được miễn phí theo v1, nhưng vẫn bị tính ${vnd(config.fee(big))} ₫.`);
