// Mediator: các bộ phận của luồng đơn hàng chỉ báo tin cho một trung gian.
// Chạy: node mediator.ts

type Order = { id: string; amount: number; items: number; waybill?: string; invoice?: string };
type OrderEvent = "out_of_stock" | "payment_failed" | "paid";

const vnd = (amount: number): string => String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";

// Mỗi bộ phận chỉ giữ một tham chiếu, tới mediator.
abstract class Department {
  abstract readonly name: string;
  mediator: OrderMediator;

  constructor(mediator: OrderMediator) {
    this.mediator = mediator;
  }
}

class Inventory extends Department {
  readonly name = "Kho";

  reportOutOfStock(order: Order): void {
    this.mediator.notify(this, "out_of_stock", order);
  }

  release(order: Order): void {
    console.log(`  Kho nhả ${order.items} sản phẩm đang giữ`);
  }
}

class Payments extends Department {
  readonly name = "Thanh toán";

  charge(order: Order, ok: boolean): void {
    this.mediator.notify(this, ok ? "paid" : "payment_failed", order);
  }

  refund(order: Order): void {
    console.log(`  Thanh toán hoàn ${vnd(order.amount)}`);
  }
}

class Shipping extends Department {
  readonly name = "Giao hàng";

  cancel(order: Order): void {
    console.log("  Giao hàng huỷ chuyến giao");
  }

  book(order: Order): void {
    console.log(`  Giao hàng đặt chuyến, mã vận đơn ${order.waybill}`);
  }
}

class CustomerCare extends Department {
  readonly name = "CSKH";

  tell(order: Order, text: string): void {
    console.log(`  CSKH báo khách ${text}`);
  }
}

class Invoicing extends Department {
  readonly name = "Hoá đơn";

  issue(order: Order): void {
    console.log(`  Hoá đơn xuất hoá đơn ${order.invoice}`);
  }
}

// Nơi duy nhất biết ai phải làm gì khi một bộ phận báo tin.
class OrderMediator {
  inventory = new Inventory(this);
  payments = new Payments(this);
  shipping = new Shipping(this);
  care = new CustomerCare(this);
  invoicing?: Invoicing;

  lines(): number {
    return 4 + (this.invoicing ? 1 : 0);
  }

  notify(sender: Department, event: OrderEvent, order: Order): void {
    const said = { out_of_stock: "hết hàng", payment_failed: "thẻ bị từ chối", paid: `đã thu ${vnd(order.amount)}` }[event];
    console.log(`Đơn ${order.id}: ${sender.name} báo ${said}`);
    if (event === "out_of_stock") {
      this.payments.refund(order);
      this.shipping.cancel(order);
      this.care.tell(order, "đơn đã hết hàng");
    } else if (event === "payment_failed") {
      this.inventory.release(order);
      this.care.tell(order, "thanh toán chưa thành công");
    } else {
      this.shipping.book(order);
      this.invoicing!.issue(order);
    }
  }
}

const hub = new OrderMediator();
hub.inventory.reportOutOfStock({ id: "DH-3107", amount: 1250000, items: 2 });
hub.payments.charge({ id: "DH-3108", amount: 540000, items: 1 }, false);

// Bộ phận mới chỉ cần nối một dây tới mediator; không lớp cũ nào phải sửa.
hub.invoicing = new Invoicing(hub);
console.log("Thêm bộ phận Hoá đơn: chỉ nối một dây tới mediator");
hub.payments.charge({ id: "DH-3109", amount: 860000, items: 1, waybill: "VD-5512", invoice: "HD-0821" }, true);
console.log(`Số dây: ${hub.lines()}, mỗi bộ phận một dây tới mediator`);
