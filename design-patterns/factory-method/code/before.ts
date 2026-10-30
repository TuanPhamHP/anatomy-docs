// Trước khi có Factory Method: dịch vụ thông báo tự lo mọi kênh trong một hàm.
// Chạy: node before.ts

const noAccents = (text: string) =>
  text.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/\p{M}/gu, "");

type User = { email: string; phone: string; device: string };

class NotificationService {
  notify(user: User, text: string, channel: string): string {
    // Mỗi kênh mới là một nhánh mới trong hàm đang chạy ổn.
    if (channel === "email") {
      return `Email → ${user.email}: [Cập nhật đơn hàng] ${text} (${text.length} ký tự, phí 20 ₫)`;
    } else if (channel === "sms") {
      const plain = noAccents(text);
      const parts = Math.ceil(plain.length / 160);
      return `SMS → ${user.phone}: ${plain} (${parts} tin, phí ${parts * 500} ₫)`;
    } else if (channel === "push") {
      const cut = text.slice(0, 28);
      const short = text.length <= 28 ? text : cut.slice(0, cut.lastIndexOf(" ")) + "…";
      return `Push → máy ${user.device}: ${short} (phí 0 ₫)`;
    }
    throw new Error(`chưa hỗ trợ kênh "${channel}"`);
  }
}

const service = new NotificationService();
const user: User = { email: "lan@example.com", phone: "0901234567", device: "app-7f3a" };
const text = "Đơn DH-2041 đã giao thành công. Cảm ơn bạn!";
for (const channel of ["email", "sms", "push"]) {
  console.log(service.notify(user, text, channel));
}
try {
  service.notify(user, text, "zalo");
} catch (error) {
  console.log(`Lỗi: ${(error as Error).message}, phải mở NotificationService ra sửa`);
}
