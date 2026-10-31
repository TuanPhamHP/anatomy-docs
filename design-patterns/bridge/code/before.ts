// Trước khi có Bridge: mỗi tổ hợp loại tin và kênh gửi là một lớp riêng.
// Chạy: node before.ts

abstract class Notification {
  to: string;
  detail: string;
  constructor(to: string, detail: string) {
    this.to = to;
    this.detail = detail;
  }
  abstract send(): string;
}

// Ba loại tin nhân với ba kênh thành chín lớp. Cách trình bày của mỗi kênh
// và nội dung của mỗi loại tin bị chép đi chép lại trong từng lớp.
class AlertEmail extends Notification {
  send() { return `email tới ${this.to}, tiêu đề "CẢNH BÁO": ${this.detail}`; }
}
class AlertSms extends Notification {
  send() { return `SMS tới ${this.to}: CẢNH BÁO - ${this.detail}`; }
}
class AlertPush extends Notification {
  send() { return `push tới ${this.to}: [CẢNH BÁO] ${this.detail}`; }
}
class ReminderEmail extends Notification {
  send() { return `email tới ${this.to}, tiêu đề "Nhắc lịch": Lịch hẹn lúc ${this.detail}`; }
}
class ReminderSms extends Notification {
  send() { return `SMS tới ${this.to}: Nhắc lịch - Lịch hẹn lúc ${this.detail}`; }
}
class ReminderPush extends Notification {
  send() { return `push tới ${this.to}: [Nhắc lịch] Lịch hẹn lúc ${this.detail}`; }
}
class PromotionEmail extends Notification {
  send() { return `email tới ${this.to}, tiêu đề "Khuyến mãi": ${this.detail}`; }
}
class PromotionSms extends Notification {
  send() { return `SMS tới ${this.to}: Khuyến mãi - ${this.detail}`; }
}
class PromotionPush extends Notification {
  send() { return `push tới ${this.to}: [Khuyến mãi] ${this.detail}`; }
}

const notifications: Notification[] = [
  new AlertEmail("lan@example.com", "Có lần đăng nhập từ thiết bị lạ"),
  new ReminderSms("0901234567", "9:00 sáng mai"),
  new PromotionPush("điện thoại của Lan", "Giảm 20% cho đơn từ 300.000 ₫"),
];
for (const notification of notifications) console.log(notification.send());

const classes = [AlertEmail, AlertSms, AlertPush, ReminderEmail, ReminderSms, ReminderPush, PromotionEmail, PromotionSms, PromotionPush].length;
console.log(`Số lớp: ${classes} lớp cho 3 loại tin và 3 kênh. Thêm kênh Chat sẽ phải viết thêm 3 lớp, thành ${classes + 3}.`);
