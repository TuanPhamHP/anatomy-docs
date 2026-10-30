// The Observer figure's model: who listens to "order placed", what each listener
// does with an order, and the three steps of the scenario. build.mjs inlines this
// file into the page, so the readout, the display and the step captions show
// exactly these values. The Python and TypeScript examples under code/ place the
// same three orders and print the same reactions.

// One point for every 10.000 ₫ of the order total.
export const POINT_VALUE = 10000;

// 1250000 -> "1.250.000", the way the display and the captions group digits.
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// The listeners, in the order their stations stand along the bus (left to right).
// `ref` is how the example code passes each one to subscribe/unsubscribe.
export const LISTENERS = [
  { id: "email", name: "Email", cls: "EmailListener", ref: "email", flag: "rect", react: (order) => `gửi xác nhận đơn ${order.code}` },
  { id: "stock", name: "Kho", cls: "StockListener", ref: "StockListener()", flag: "square", react: (order) => `giữ ${order.items} sản phẩm` },
  { id: "points", name: "Điểm", cls: "PointsListener", ref: "PointsListener()", flag: "disc", react: (order) => `cộng ${Math.floor(order.total / POINT_VALUE)} điểm` },
  { id: "analytics", name: "Thống kê", cls: "AnalyticsListener", ref: "AnalyticsListener()", flag: "pennant", react: (order) => `ghi doanh thu ${groupVND(order.total)} ₫` },
];

// Each step changes the subscriber list (or not), then one order is placed.
export const STEPS = [
  { change: null, subscribed: ["email", "stock", "points"], order: { code: "#1001", items: 2, total: 1250000 } },
  { change: { kind: "subscribe", id: "analytics" }, subscribed: ["email", "stock", "points", "analytics"], order: { code: "#1002", items: 3, total: 860000 } },
  { change: { kind: "unsubscribe", id: "email" }, subscribed: ["stock", "points", "analytics"], order: { code: "#1003", items: 1, total: 2400000 } },
];

export const listenerOf = (id) => LISTENERS.find((listener) => listener.id === id);

// What every subscribed listener does when this step's order is placed, in subscription order.
export const reactionsOf = (step) => step.subscribed.map((id) => ({ id, name: listenerOf(id).name, text: listenerOf(id).react(step.order) }));
