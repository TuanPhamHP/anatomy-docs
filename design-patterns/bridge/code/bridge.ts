// Bridge: tách "loại thông báo" khỏi "kênh gửi" để hai bên thay đổi độc lập.
// Chạy: node bridge.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

// Implementor: interface chung của mọi kênh gửi.
interface Channel {
  deliver(title: string, text: string): string;
}

// Concrete implementor: mỗi kênh tự quyết cách trình bày tiêu đề và nội dung.
class EmailChannel implements Channel {
  address: string;
  constructor(address: string) {
    this.address = address;
  }
  deliver(title: string, text: string): string {
    return `email tới ${this.address}, tiêu đề "${title}": ${text}`;
  }
}

class SmsChannel implements Channel {
  phone: string;
  constructor(phone: string) {
    this.phone = phone;
  }
  deliver(title: string, text: string): string {
    // SMS không có ô tiêu đề, nên tiêu đề được ghép vào đầu tin.
    return `SMS tới ${this.phone}: ${title} - ${text}`;
  }
}

class PushChannel implements Channel {
  device: string;
  constructor(device: string) {
    this.device = device;
  }
  deliver(title: string, text: string): string {
    return `push tới ${this.device}: [${title}] ${text}`;
  }
}

// Kênh thêm sau chỉ là một lớp mới, không loại thông báo nào phải sửa.
class ChatChannel implements Channel {
  handle: string;
  constructor(handle: string) {
    this.handle = handle;
  }
  deliver(title: string, text: string): string {
    return `chat tới ${this.handle}: *${title}* ${text}`;
  }
}

// Abstraction: thông báo giữ một kênh và nhờ kênh đó gửi đi.
abstract class Notification {
  channel: Channel;
  constructor(channel: Channel) {
    this.channel = channel;
  }
  send(): string {
    return this.channel.deliver(this.title(), this.text());
  }
  abstract title(): string;
  abstract text(): string;
}

// Refined abstraction: mỗi loại thông báo chỉ lo phần nội dung.
class Alert extends Notification {
  event: string;
  constructor(channel: Channel, event: string) {
    super(channel);
    this.event = event;
  }
  title() {
    return "CẢNH BÁO";
  }
  text() {
    return this.event;
  }
}

class Reminder extends Notification {
  when: string;
  constructor(channel: Channel, when: string) {
    super(channel);
    this.when = when;
  }
  title() {
    return "Nhắc lịch";
  }
  text() {
    return `Lịch hẹn lúc ${this.when}`;
  }
}

class Promotion extends Notification {
  percent: number;
  minOrder: number;
  constructor(channel: Channel, percent: number, minOrder: number) {
    super(channel);
    this.percent = percent;
    this.minOrder = minOrder;
  }
  title() {
    return "Khuyến mãi";
  }
  text() {
    const amount = String(this.minOrder).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `Giảm ${this.percent}% cho đơn từ ${amount} ₫`;
  }
}

const email = new EmailChannel("lan@example.com");
const sms = new SmsChannel("0901234567");
const push = new PushChannel("điện thoại của Lan");
const chat = new ChatChannel("@lan");

const notifications: Notification[] = [
  new Alert(email, "Có lần đăng nhập từ thiết bị lạ"),
  new Reminder(sms, "9:00 sáng mai"),
  new Promotion(push, 20, 300_000),
  new Promotion(chat, 20, 300_000), // kênh mới dùng được ngay với loại tin có sẵn
];
for (const notification of notifications) console.log(notification.send());

// TypeScript không liệt kê được lớp con lúc chạy, nên ta tự kê hai danh sách.
const kinds = [Alert, Reminder, Promotion].length;
const channels = [EmailChannel, SmsChannel, PushChannel, ChatChannel].length;
console.log(
  `Số lớp: ${kinds} loại tin + ${channels} kênh = ${kinds + channels} lớp. ` +
    `Nếu viết mỗi tổ hợp một lớp thì cần ${kinds} × ${channels} = ${kinds * channels} lớp.`,
);
