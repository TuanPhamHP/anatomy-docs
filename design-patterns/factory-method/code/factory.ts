// Factory Method: lớp cha giữ quy trình gửi thông báo, lớp con quyết định tạo Sender nào.
// Chạy: node factory.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

interface User {
  email: string;
  phone: string;
  device: string;
}

const noAccents = (text: string) =>
  text.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/\p{M}/gu, "");

// Product: interface chung của mọi Sender. Code gọi chỉ cần biết send().
interface Sender {
  send(user: User, text: string): string;
}

// Concrete products: mỗi kênh gửi theo cách riêng.
class EmailSender implements Sender {
  send(user: User, text: string): string {
    return `${user.email}: [Cập nhật đơn hàng] ${text} (${text.length} ký tự, phí 20 ₫)`;
  }
}

class SmsSender implements Sender {
  send(user: User, text: string): string {
    const plain = noAccents(text); // tin không dấu: 160 ký tự một tin
    const parts = Math.ceil(plain.length / 160);
    return `${user.phone}: ${plain} (${parts} tin, phí ${parts * 500} ₫)`;
  }
}

class PushSender implements Sender {
  send(user: User, text: string): string {
    const cut = text.slice(0, 28);
    const short = text.length <= 28 ? text : cut.slice(0, cut.lastIndexOf(" ")) + "…"; // màn hình khoá hiện 28 ký tự
    return `máy ${user.device}: ${short} (phí 0 ₫)`;
  }
}

// Creator: notify() là quy trình cố định. Chỉ createSender() để lớp con quyết định.
abstract class Notifier {
  abstract createSender(): Sender; // factory method

  notify(user: User, text: string): string {
    const sender = this.createSender();
    const result = sender.send(user, text);
    return `${this.constructor.name} tạo ${sender.constructor.name} → ${result}`;
  }
}

// Concrete creators: mỗi lớp con chỉ viết đúng một dòng tạo object.
class EmailNotifier extends Notifier {
  createSender(): Sender {
    return new EmailSender();
  }
}

class SmsNotifier extends Notifier {
  createSender(): Sender {
    return new SmsSender();
  }
}

class PushNotifier extends Notifier {
  createSender(): Sender {
    return new PushSender();
  }
}

// Biến thể đơn giản hơn: một hàm factory chọn lớp theo tên kênh, không cần lớp con.
const SENDERS: Record<string, new () => Sender> = { email: EmailSender, sms: SmsSender, push: PushSender };

function senderFor(channel: string): Sender {
  return new SENDERS[channel]();
}

const user: User = { email: "lan@example.com", phone: "0901234567", device: "app-7f3a" };
const text = "Đơn DH-2041 đã giao thành công. Cảm ơn bạn!";
for (const notifier of [new EmailNotifier(), new SmsNotifier(), new PushNotifier()]) {
  console.log(notifier.notify(user, text));
}
console.log(`Hàm factory với "sms" → ${senderFor("sms").constructor.name}`);
