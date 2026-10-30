// Strategy: mỗi cách tính phí giao hàng là một lớp, trang thanh toán chỉ giữ một cái.
// Chạy: node strategy.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

interface Order {
  weightKg: number;
  distanceKm: number;
  subtotal: number; // VND
}

// Strategy: interface chung của mọi cách tính phí.
interface ShippingStrategy {
  readonly name: string;
  quote(order: Order): number;
}

// Concrete strategies: mỗi lớp một quy tắc, không lớp nào biết lớp nào.
class WeightFee implements ShippingStrategy {
  readonly name = "Theo cân nặng";

  quote(order: Order): number {
    const extraKg = Math.max(0, Math.ceil(order.weightKg - 1)); // phần lẻ tính tròn một kg
    return 15000 + extraKg * 5000;
  }
}

class DistanceFee implements ShippingStrategy {
  readonly name = "Theo khoảng cách";

  quote(order: Order): number {
    if (order.distanceKm <= 5) return 15000;
    if (order.distanceKm <= 15) return 25000;
    return 35000;
  }
}

class FreeOverThreshold implements ShippingStrategy {
  readonly name = "Miễn phí từ 300.000 ₫";
  private readonly threshold: number;
  private readonly flatFee: number;

  constructor(threshold = 300000, flatFee = 20000) {
    this.threshold = threshold;
    this.flatFee = flatFee;
  }

  quote(order: Order): number {
    return order.subtotal >= this.threshold ? 0 : this.flatFee;
  }
}

// Context: trang thanh toán. Nó chỉ biết ShippingStrategy, không biết quy tắc nào.
class Checkout {
  private strategy: ShippingStrategy;

  constructor(strategy: ShippingStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: ShippingStrategy): void {
    this.strategy = strategy;
  }

  shipping(order: Order): number {
    return this.strategy.quote(order);
  }

  total(order: Order): number {
    return order.subtotal + this.shipping(order);
  }
}

const vnd = (n: number) => n.toLocaleString("vi-VN");

const order: Order = { weightKg: 3.5, distanceKm: 12, subtotal: 450000 };
const checkout = new Checkout(new WeightFee());
for (const strategy of [new WeightFee(), new DistanceFee(), new FreeOverThreshold()]) {
  checkout.setStrategy(strategy); // đổi cách tính lúc chạy, Checkout không đổi
  console.log(`${strategy.name.padEnd(22)} phí ${vnd(checkout.shipping(order)).padStart(6)} ₫   tổng ${vnd(checkout.total(order))} ₫`);
}
