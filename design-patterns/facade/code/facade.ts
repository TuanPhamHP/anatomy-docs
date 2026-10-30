// Facade: một hàm đặt hàng che cả năm hệ con phía sau.
// Chạy: node facade.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

const vnd = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";

interface Cart {
  orderId: string;
  sku: string;
  qty: number;
  price: number;
  card: string;
  email: string;
}

const totalOf = (cart: Cart) => cart.qty * cart.price;

class PaymentDeclined extends Error {}

// Năm hệ con. Mỗi hệ con vẫn dùng riêng được; facade không giấu chúng đi.
class Inventory {
  stock: Record<string, number>;

  constructor(stock: Record<string, number>) {
    this.stock = { ...stock };
  }

  reserve(sku: string, qty: number): void {
    const before = this.stock[sku];
    this.stock[sku] -= qty;
    console.log(`  Kho: giữ ${qty} × ${sku}, tồn ${before} → ${this.stock[sku]}`);
  }

  release(sku: string, qty: number): void {
    this.stock[sku] += qty;
    console.log(`  Kho: trả lại ${qty} × ${sku}, tồn ${this.stock[sku]}`);
  }
}

class Payments {
  private next = 5521;

  charge(card: string, amount: number): string {
    if (card.endsWith("0002")) { // thẻ thử nghiệm luôn bị từ chối
      console.log(`  Thanh toán: thẻ ...${card} bị từ chối`);
      throw new PaymentDeclined(card);
    }
    const txn = `GD-${this.next++}`;
    console.log(`  Thanh toán: thu ${vnd(amount)}, mã ${txn}`);
    return txn;
  }
}

class Shipping {
  book(orderId: string): string {
    console.log(`  Vận chuyển: vận đơn VD-3308 cho ${orderId}`);
    return "VD-3308";
  }
}

class Invoices {
  issue(orderId: string, amount: number): string {
    console.log(`  Hoá đơn: HD-0457, ${vnd(amount)}`);
    return "HD-0457";
  }
}

class Notifier {
  send(email: string, text: string): void {
    console.log(`  Thông báo: gửi ${email}: ${text}`);
  }
}

interface OrderResult {
  orderId: string;
  txn: string;
  tracking: string;
  invoice: string;
}

// Facade: một cửa cho việc đặt hàng. Thứ tự gọi và cách xử lý lỗi nằm ở một chỗ.
class CheckoutFacade {
  private inventory: Inventory;
  private payments: Payments;
  private shipping: Shipping;
  private invoices: Invoices;
  private notifier: Notifier;

  constructor(inventory: Inventory, payments: Payments, shipping: Shipping, invoices: Invoices, notifier: Notifier) {
    this.inventory = inventory;
    this.payments = payments;
    this.shipping = shipping;
    this.invoices = invoices;
    this.notifier = notifier;
  }

  placeOrder(cart: Cart): OrderResult {
    this.inventory.reserve(cart.sku, cart.qty);
    let txn: string;
    try {
      txn = this.payments.charge(cart.card, totalOf(cart));
    } catch (error) {
      this.inventory.release(cart.sku, cart.qty); // mọi client đều được trả hàng về kho
      throw error;
    }
    const tracking = this.shipping.book(cart.orderId);
    const invoice = this.invoices.issue(cart.orderId, totalOf(cart));
    this.notifier.send(cart.email, `Đơn ${cart.orderId} đã được đặt`);
    return { orderId: cart.orderId, txn, tracking, invoice };
  }
}

const inventory = new Inventory({ "SP-17": 12 });
const checkout = new CheckoutFacade(inventory, new Payments(), new Shipping(), new Invoices(), new Notifier());

// Client (web, app di động, công cụ admin) chỉ gọi một hàm.
console.log("place_order(DH-2041)");
const result = checkout.placeOrder({ orderId: "DH-2041", sku: "SP-17", qty: 2, price: 485000, card: "4242", email: "khach@example.com" });
console.log(`→ ${result.orderId}: ${result.txn}, ${result.tracking}, ${result.invoice}`);

console.log("place_order(DH-2042)");
try {
  checkout.placeOrder({ orderId: "DH-2042", sku: "SP-17", qty: 3, price: 485000, card: "0002", email: "khach@example.com" });
} catch (error) {
  if (!(error instanceof PaymentDeclined)) throw error;
  console.log("→ DH-2042 không đặt được");
}

console.log(`Tồn kho SP-17: ${inventory.stock["SP-17"]}`);
