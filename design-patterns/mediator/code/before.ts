// Trước khi có Mediator: các bộ phận của luồng đơn hàng gọi thẳng vào nhau.
// Chạy: node before.ts

type Order = { id: string; amount: number; items: number };

const vnd = (amount: number): string => String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";

class Shipping {
  cancel(order: Order): void {
    console.log("  Giao hàng huỷ chuyến giao");
  }
}

class CustomerCare {
  tell(order: Order, text: string): void {
    console.log(`  CSKH báo khách ${text}`);
  }
}

class Payments {
  // Thanh toán phải biết Kho và CSKH để tự gọi họ khi thẻ bị từ chối.
  inventory?: Inventory;
  care?: CustomerCare;

  refund(order: Order): void {
    console.log(`  Thanh toán hoàn ${vnd(order.amount)}`);
  }

  charge(order: Order, ok: boolean): void {
    if (!ok) {
      console.log(`Đơn ${order.id}: Thanh toán báo thẻ bị từ chối`);
      this.inventory!.release(order);
      this.care!.tell(order, "thanh toán chưa thành công");
    }
  }
}

class Inventory {
  // Kho phải biết ba bộ phận khác chỉ để báo tin hết hàng.
  payments?: Payments;
  shipping?: Shipping;
  care?: CustomerCare;

  release(order: Order): void {
    console.log(`  Kho nhả ${order.items} sản phẩm đang giữ`);
  }

  reportOutOfStock(order: Order): void {
    console.log(`Đơn ${order.id}: Kho báo hết hàng`);
    this.payments!.refund(order);
    this.shipping!.cancel(order);
    this.care!.tell(order, "đơn đã hết hàng");
  }
}

const inventory = new Inventory();
const payments = new Payments();
const shipping = new Shipping();
const care = new CustomerCare();
// Mỗi quy tắc mới lại thêm một sợi dây nối thẳng giữa hai lớp.
inventory.payments = payments;
inventory.shipping = shipping;
inventory.care = care;
payments.inventory = inventory;
payments.care = care;

inventory.reportOutOfStock({ id: "DH-3107", amount: 1250000, items: 2 });
payments.charge({ id: "DH-3108", amount: 540000, items: 1 }, false);

const parts = 4;
console.log("Kho giữ tham chiếu tới 3 bộ phận, Thanh toán tới 2 bộ phận");
console.log(`Nối thẳng ${parts} bộ phận với nhau cần ${(parts * (parts - 1)) / 2} dây, thêm bộ phận thứ năm cần thêm ${parts} dây`);
