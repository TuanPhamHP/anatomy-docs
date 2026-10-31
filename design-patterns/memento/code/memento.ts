// Memento: lưu và khôi phục cấu hình phí giao hàng mà không để bên ngoài chạm vào trạng thái bên trong.
// Chạy: node memento.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

interface Order {
  value: number;
  km: number;
}

const SAMPLE: Order = { value: 250_000, km: 5 }; // đơn mẫu dùng để xem phí thay đổi ra sao

const vnd = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Memento: bên ngoài chỉ thấy nhãn của bản chụp.
interface Snapshot {
  readonly label: string;
}

interface State {
  base: number;
  perKm: number;
  freeFrom: number;
}

// Trạng thái của từng bản chụp nằm trong WeakMap này. Chỉ PricingConfig, viết cùng
// module, mới tra được, nên với mọi chỗ khác bản chụp là một hộp niêm phong.
const sealed = new WeakMap<Snapshot, State>();

// Originator: cấu hình phí giao hàng, tự biết cách chụp lại và khôi phục chính nó.
class PricingConfig {
  private base: number;
  private perKm: number;
  private freeFrom: number;

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
    // Người gọi truyền 10 với ý "tăng 10%", nhưng hàm lại nhân thẳng mọi trường với 10.
    this.base *= factor;
    this.perKm *= factor;
    this.freeFrom *= factor;
  }

  fee(order: Order): number {
    if (order.value >= this.freeFrom) return 0;
    return this.base + order.km * this.perKm;
  }

  save(label: string): Snapshot {
    const snapshot: Snapshot = Object.freeze({ label });
    sealed.set(snapshot, { base: this.base, perKm: this.perKm, freeFrom: this.freeFrom });
    return snapshot;
  }

  restore(snapshot: Snapshot): void {
    const state = sealed.get(snapshot);
    if (!state) throw new Error(`Bản chụp ${snapshot.label} không do cấu hình này tạo ra`);
    this.update(state.base, state.perKm, state.freeFrom);
  }

  row(): string {
    return vnd(this.base).padStart(9) + vnd(this.perKm).padStart(9) + vnd(this.freeFrom).padStart(13);
  }
}

// Caretaker: giữ các bản chụp theo nhãn nhưng không bao giờ mở chúng ra.
class History {
  private snapshots = new Map<string, Snapshot>();

  keep(snapshot: Snapshot): void {
    this.snapshots.set(snapshot.label, snapshot);
  }

  get(label: string): Snapshot {
    const snapshot = this.snapshots.get(label);
    if (!snapshot) throw new Error(`Không có bản chụp ${label}`);
    return snapshot;
  }

  labels(): string[] {
    return [...this.snapshots.keys()];
  }
}

function show(step: string, config: PricingConfig): void {
  console.log(step.padEnd(15) + config.row() + vnd(config.fee(SAMPLE)).padStart(10) + " ₫");
}

const config = new PricingConfig(15_000, 4_000, 300_000);
const history = new History();
console.log("Bước".padEnd(15) + "Phí gốc".padStart(9) + "Mỗi km".padStart(9) + "Miễn phí từ".padStart(13) + "Đơn mẫu".padStart(12));

history.keep(config.save("v1"));
show("lưu v1", config);

config.update(20_000, 2_500, 500_000);
history.keep(config.save("v2"));
show("lưu v2", config);

config.bulkUpdate(10);
show("sửa hàng loạt", config);

config.restore(history.get("v2"));
show("khôi phục v2", config);

config.restore(history.get("v1"));
show("khôi phục v1", config);

const big: Order = { value: 600_000, km: 5 };
console.log(`Đơn ${vnd(big.value)} ₫ được miễn phí đúng như v1, phí ${vnd(config.fee(big))} ₫.`);
console.log(`History đang giữ ${history.labels().length} bản chụp: ${history.labels().join(", ")}.`);
