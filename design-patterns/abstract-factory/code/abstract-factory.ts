// Abstract Factory: mỗi nhà cung cấp thanh toán là một factory tạo ra trọn bộ ba thành phần đi cùng nhau.
// Chạy: node abstract-factory.ts   (Node 22.18 trở lên chạy thẳng TypeScript)
import { createHmac } from "node:crypto";

interface Webhook {
  body: string;
  signature: string;
}

const sign = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("hex").slice(0, 8);
const vnd = (amount: number) => String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";

// Ba sản phẩm trừu tượng: những gì trang thanh toán cần, không gắn với nhà cung cấp nào.
interface Gateway {
  charge(order: string, amount: number): Webhook;
}

interface Refunds {
  refund(order: string, amount: number): string;
}

interface WebhookVerifier {
  verify(hook: Webhook): boolean;
}

// Họ A: ba lớp dùng chung khoá bí mật và kiểu chữ ký "a1:" của nhà cung cấp A.
const SECRET_A = "bi-mat-cua-a";

class GatewayA implements Gateway {
  charge(order: string, amount: number): Webhook {
    const body = `${order}|${amount}`;
    return { body, signature: "a1:" + sign(SECRET_A, body) };
  }
}

class RefundsA implements Refunds {
  refund(order: string, amount: number): string {
    return `HT-A-${order.slice(-4)}`;
  }
}

class VerifierA implements WebhookVerifier {
  verify(hook: Webhook): boolean {
    return hook.signature === "a1:" + sign(SECRET_A, hook.body);
  }
}

// Họ B: khoá và kiểu chữ ký "v2=" riêng của nhà cung cấp B.
const SECRET_B = "bi-mat-cua-b";

class GatewayB implements Gateway {
  charge(order: string, amount: number): Webhook {
    const body = `${order}|${amount}`;
    return { body, signature: "v2=" + sign(SECRET_B, body) };
  }
}

class RefundsB implements Refunds {
  refund(order: string, amount: number): string {
    return `HT-B-${order.slice(-4)}`;
  }
}

class VerifierB implements WebhookVerifier {
  verify(hook: Webhook): boolean {
    return hook.signature === "v2=" + sign(SECRET_B, hook.body);
  }
}

// Abstract Factory: một interface tạo ra cả bộ.
interface PaymentKitFactory {
  createGateway(): Gateway;
  createRefunds(): Refunds;
  createVerifier(): WebhookVerifier;
}

// Mỗi factory cụ thể chỉ biết tạo đúng họ của mình, nên không thể trả về một bộ lẫn.
class ProviderAFactory implements PaymentKitFactory {
  createGateway(): Gateway {
    return new GatewayA();
  }
  createRefunds(): Refunds {
    return new RefundsA();
  }
  createVerifier(): WebhookVerifier {
    return new VerifierA();
  }
}

class ProviderBFactory implements PaymentKitFactory {
  createGateway(): Gateway {
    return new GatewayB();
  }
  createRefunds(): Refunds {
    return new RefundsB();
  }
  createVerifier(): WebhookVerifier {
    return new VerifierB();
  }
}

// Client: nhận một factory và không biết đó là nhà cung cấp nào.
class Checkout {
  private readonly gateway: Gateway;
  private readonly refunds: Refunds;
  private readonly verifier: WebhookVerifier;

  constructor(factory: PaymentKitFactory) {
    this.gateway = factory.createGateway();
    this.refunds = factory.createRefunds();
    this.verifier = factory.createVerifier();
  }

  payThenRefund(order: string, amount: number, back: number): string {
    const hook = this.gateway.charge(order, amount);
    const status = this.verifier.verify(hook) ? "hợp lệ" : "bị từ chối";
    const code = this.refunds.refund(order, back);
    return `thu ${vnd(amount)}, webhook ${hook.signature} ${status}, hoàn ${vnd(back)} mã ${code}`;
  }
}

const factories: [string, PaymentKitFactory][] = [["Bộ A", new ProviderAFactory()], ["Bộ B", new ProviderBFactory()]];
for (const [name, factory] of factories) {
  console.log(`${name}: ${new Checkout(factory).payThenRefund("DH-3001", 1250000, 250000)}`);
}
