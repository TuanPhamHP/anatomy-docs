// Trước khi có Abstract Factory: mỗi chỗ tự chọn nhà cung cấp theo một dòng cấu hình riêng.
// Chạy: node before.ts
import { createHmac } from "node:crypto";

const SECRETS: Record<string, string> = { A: "bi-mat-cua-a", B: "bi-mat-cua-b" };
const PREFIX: Record<string, string> = { A: "a1:", B: "v2=" };

// Ba dòng cấu hình đọc ở ba chỗ khác nhau. Lần chuyển sang A vừa rồi còn sót dòng webhook.
const SETTINGS = { payment: "A", refund: "A", webhook: "B" };

const sign = (provider: string, body: string) =>
  PREFIX[provider] + createHmac("sha256", SECRETS[provider]).update(body).digest("hex").slice(0, 8);
const vnd = (amount: number) => String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";

function charge(order: string, amount: number): [string, string] {
  const body = `${order}|${amount}`;
  if (SETTINGS.payment === "A") return [body, sign("A", body)];
  else if (SETTINGS.payment === "B") return [body, sign("B", body)];
  throw new Error("nhà cung cấp lạ");
}

function verify(body: string, signature: string): boolean {
  if (SETTINGS.webhook === "A") return signature === sign("A", body);
  else if (SETTINGS.webhook === "B") return signature === sign("B", body);
  throw new Error("nhà cung cấp lạ");
}

function refund(order: string, amount: number): string {
  if (SETTINGS.refund === "A") return `HT-A-${order.slice(-4)}`;
  else if (SETTINGS.refund === "B") return `HT-B-${order.slice(-4)}`;
  throw new Error("nhà cung cấp lạ");
}

const [body, signature] = charge("DH-3001", 1250000);
console.log(`Thu ${vnd(1250000)} qua ${SETTINGS.payment}, webhook ${signature}`);
console.log(`Kiểm webhook bằng bộ của ${SETTINGS.webhook}: ${verify(body, signature) ? "hợp lệ" : "bị từ chối"}`);
console.log(`Hoàn ${vnd(250000)} qua ${SETTINGS.refund}, mã ${refund("DH-3001", 250000)}`);
