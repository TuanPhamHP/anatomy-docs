// Khi chưa có Facade: mỗi nơi đặt hàng tự gọi lần lượt cả năm hệ con.
// Chạy: node before.ts   (năm hệ con ở cuối file, giống hệt bản facade.ts)

// Trang web: viết đủ, có trả hàng về kho khi thanh toán lỗi.
function webCheckout(orderId: string, sku: string, qty: number, price: number, card: string, email: string): void {
  inventory.reserve(sku, qty);
  try {
    payments.charge(card, qty * price);
  } catch (error) {
    inventory.release(sku, qty);
    throw error;
  }
  shipping.book(orderId);
  invoices.issue(orderId, qty * price);
  notifier.send(email, `Đơn ${orderId} đã được đặt`);
}

// App di động: chép lại cùng chuỗi đó, nhưng quên trả hàng khi thanh toán lỗi.
function mobileCheckout(orderId: string, sku: string, qty: number, price: number, card: string, email: string): void {
  inventory.reserve(sku, qty);
  payments.charge(card, qty * price);
  shipping.book(orderId);
  invoices.issue(orderId, qty * price);
  notifier.send(email, `Đơn ${orderId} đã được đặt`);
}

// Công cụ admin có bản chép thứ ba, và cứ thế lệch dần.

// Năm hệ con, rút gọn.
class PaymentDeclined extends Error {}

class Inventory {
  stock: Record<string, number>;
  constructor(stock: Record<string, number>) {
    this.stock = { ...stock };
  }
  reserve(sku: string, qty: number) { this.stock[sku] -= qty; }
  release(sku: string, qty: number) { this.stock[sku] += qty; }
}

class Payments {
  charge(card: string, amount: number): string {
    if (card.endsWith("0002")) throw new PaymentDeclined(card);
    return "GD-5521";
  }
}

class Shipping { book(orderId: string) { return "VD-3308"; } }
class Invoices { issue(orderId: string, amount: number) { return "HD-0457"; } }
class Notifier { send(email: string, text: string) {} }

const inventory = new Inventory({ "SP-17": 12 });
const payments = new Payments(), shipping = new Shipping(), invoices = new Invoices(), notifier = new Notifier();

webCheckout("DH-2041", "SP-17", 2, 485000, "4242", "khach@example.com");
console.log(`Sau DH-2041 (web): tồn ${inventory.stock["SP-17"]}`);
try {
  mobileCheckout("DH-2042", "SP-17", 3, 485000, "0002", "khach@example.com");
} catch (error) {
  if (!(error instanceof PaymentDeclined)) throw error;
  console.log("DH-2042 (app): thẻ bị từ chối");
}
console.log(`Tồn kho SP-17: ${inventory.stock["SP-17"]}, đúng ra phải là 10`);
