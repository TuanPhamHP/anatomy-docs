// The Bridge figure's model: three kinds of notification, the channels that can
// carry them, and what one notification looks like once a channel delivers it.
// A kind decides what the message says; a channel decides how it is sent. Any
// kind works with any channel because they only meet through `deliver(title,
// text)`. build.mjs inlines this file, so the readout, the counters and the step
// captions show these values; the Python and TypeScript examples under code/
// print the same lines, and build.mjs checks that they agree.

export const KINDS = [
  { id: "alert", name: "Cảnh báo", cls: "Alert", title: "CẢNH BÁO", text: "Có lần đăng nhập từ thiết bị lạ" },
  { id: "reminder", name: "Nhắc lịch", cls: "Reminder", title: "Nhắc lịch", text: "Lịch hẹn lúc 9:00 sáng mai" },
  { id: "promo", name: "Khuyến mãi", cls: "Promotion", title: "Khuyến mãi", text: "Giảm 20% cho đơn từ 300.000 ₫" },
];

// Chat is the channel added later: it waits beside the machine until the last step.
export const CHANNELS = [
  { id: "email", name: "Email", cls: "EmailChannel", to: "lan@example.com" },
  { id: "sms", name: "SMS", cls: "SmsChannel", to: "0901234567" },
  { id: "push", name: "Push", cls: "PushChannel", to: "điện thoại của Lan" },
  { id: "chat", name: "Chat", cls: "ChatChannel", to: "@lan", added: true },
];

// Each channel presents the same title and text in its own way.
const FORMAT = {
  email: (to, title, text) => `email tới ${to}, tiêu đề "${title}": ${text}`,
  sms: (to, title, text) => `SMS tới ${to}: ${title} - ${text}`,
  push: (to, title, text) => `push tới ${to}: [${title}] ${text}`,
  chat: (to, title, text) => `chat tới ${to}: *${title}* ${text}`,
};

export const deliver = (kind, channel) => FORMAT[channel.id](channel.to, kind.title, kind.text);

// The scenario: three pairings, then a new channel joins and pairs with an existing kind.
export const STEPS = [
  { kind: 0, channel: 0, label: "Cảnh báo, Email", short: "1" },
  { kind: 1, channel: 1, label: "Nhắc lịch, SMS", short: "2" },
  { kind: 2, channel: 2, label: "Khuyến mãi, Push", short: "3" },
  { kind: 2, channel: 3, label: "Thêm kênh Chat", short: "Chat" },
];

// How many concrete classes each design needs for a number of channels.
export const counts = (channels) => ({ bridge: KINDS.length + channels, inheritance: KINDS.length * channels });
export const channelsAt = (step) => (CHANNELS[STEPS[step].channel].added ? CHANNELS.length : CHANNELS.length - 1);

// The lines the after-example prints, in order.
export function transcript() {
  const lines = STEPS.map((step) => deliver(KINDS[step.kind], CHANNELS[step.channel]));
  const all = counts(CHANNELS.length);
  lines.push(`Số lớp: ${KINDS.length} loại tin + ${CHANNELS.length} kênh = ${all.bridge} lớp. Nếu viết mỗi tổ hợp một lớp thì cần ${KINDS.length} × ${CHANNELS.length} = ${all.inheritance} lớp.`);
  return lines;
}
