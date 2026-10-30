// The Factory Method figure's model: one notification, three creators. Each
// creator's create_sender() makes a different Sender, and every Sender answers
// the same send(). build.mjs inlines this file into the page, so the readout,
// the console and the step captions show exactly these results; the Python and
// TypeScript examples under code/ print the same lines.

export const USER = { email: "lan@example.com", phone: "0901234567", device: "app-7f3a" };
export const TEXT = "Đơn DH-2041 đã giao thành công. Cảm ơn bạn!";

// Vietnamese without accents, the way SMS gateways send it (160 characters per message).
export const noAccents = (text) => text.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/\p{M}/gu, "");

// The lock screen shows 28 characters; cut at the last space before that.
const preview = (text) => (text.length <= 28 ? text : text.slice(0, 28).slice(0, text.slice(0, 28).lastIndexOf(" ")) + "…");

// One entry per concrete creator, in step order.
export const CHANNELS = [
  {
    id: "email",
    code: "EMAIL",
    label: "Email",
    creator: "EmailNotifier",
    product: "EmailSender",
    made: "một phong bì",
    send(user, text) {
      return { to: user.email, body: `[Cập nhật đơn hàng] ${text}`, note: `${text.length} ký tự`, cost: 20 };
    },
  },
  {
    id: "sms",
    code: "SMS",
    label: "SMS",
    creator: "SmsNotifier",
    product: "SmsSender",
    made: "một phiếu tin nhắn",
    send(user, text) {
      const plain = noAccents(text);
      const parts = Math.ceil(plain.length / 160);
      return { to: user.phone, body: plain, note: `${parts} tin`, cost: parts * 500 };
    },
  },
  {
    id: "push",
    code: "PUSH",
    label: "Push",
    creator: "PushNotifier",
    product: "PushSender",
    made: "một viên thông báo đẩy",
    send(user, text) {
      return { to: `máy ${user.device}`, body: preview(text), note: "", cost: 0 };
    },
  },
];

// The base class's notify(): make a sender with the factory method, then use it.
export function notify(channel, user = USER, text = TEXT) {
  return { creator: channel.creator, product: channel.product, ...channel.send(user, text) };
}

// The line the examples print for one channel.
export function line(channel) {
  const r = notify(channel);
  const tail = r.note ? `${r.note}, phí ${r.cost} ₫` : `phí ${r.cost} ₫`;
  return `${r.creator} tạo ${r.product} → ${r.to}: ${r.body} (${tail})`;
}
