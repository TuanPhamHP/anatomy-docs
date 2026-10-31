// The Mediator figure's model: the departments of an order workflow, the
// events they report and who has to react. Without a mediator every department
// is wired straight to every other one (n(n-1)/2 wires); with OrderMediator each
// has one line to the exchange and the exchange's rules decide who is called.
// build.mjs inlines this file, so the wire counter, the readout and the step
// captions come from here, and transcript() must print what code/mediator.py prints.

export const STATIONS = [
  { id: "kho", tag: "KHO", name: "Kho" },
  { id: "tt", tag: "TT", name: "Thanh toán" },
  { id: "gh", tag: "GH", name: "Giao hàng" },
  { id: "cskh", tag: "CSKH", name: "CSKH" },
  { id: "hd", tag: "HĐ", name: "Hoá đơn" },
];

// 1250000 -> "1.250.000 ₫", the way the examples print money.
export const vnd = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";

export const ORDERS = {
  out_of_stock: { id: "DH-3107", amount: 1250000, items: 2 },
  payment_failed: { id: "DH-3108", amount: 540000, items: 1 },
  paid: { id: "DH-3109", amount: 860000, items: 1, waybill: "VD-5512", invoice: "HD-0821" },
};

// Who reports each event, what they say, and the mediator's rule: who reacts and how.
export const EVENTS = {
  out_of_stock: {
    from: "kho",
    says: () => "hết hàng",
    to: (o) => [["tt", `hoàn ${vnd(o.amount)}`], ["gh", "huỷ chuyến giao"], ["cskh", "báo khách đơn đã hết hàng"]],
  },
  payment_failed: {
    from: "tt",
    says: () => "thẻ bị từ chối",
    to: (o) => [["kho", `nhả ${o.items} sản phẩm đang giữ`], ["cskh", "báo khách thanh toán chưa thành công"]],
  },
  paid: {
    from: "tt",
    says: (o) => `đã thu ${vnd(o.amount)}`,
    to: (o) => [["gh", `đặt chuyến, mã vận đơn ${o.waybill}`], ["hd", `xuất hoá đơn ${o.invoice}`]],
  },
};

// The four steps of the figure: the wiring (mesh or exchange), how many departments, and the event.
export const STEPS = [
  { label: "Nối thẳng", short: "Lưới", mesh: true, stations: 4, event: "out_of_stock" },
  { label: "Hết hàng", short: "Hết", mesh: false, stations: 4, event: "out_of_stock" },
  { label: "Thanh toán lỗi", short: "TT lỗi", mesh: false, stations: 4, event: "payment_failed" },
  { label: "Thêm Hoá đơn", short: "+HĐ", mesh: false, stations: 5, event: "paid" },
];

export const index = (id) => STATIONS.findIndex((s) => s.id === id);
export const wires = (step) => (step.mesh ? (step.stations * (step.stations - 1)) / 2 : step.stations);

// The resolved story of one step: sender, targets (station indexes) and the reactions.
export function story(step) {
  const event = EVENTS[step.event];
  const order = ORDERS[step.event];
  const reactions = event.to(order).map(([id, does]) => ({ at: index(id), id, does }));
  return { order, sender: index(event.from), says: event.says(order), reactions, wires: wires(step) };
}

// What code/mediator.py prints; build.mjs compares the two.
export function transcript() {
  const lines = [];
  const tell = (name) => {
    const { order, sender, says, reactions } = story(STEPS.find((s) => s.event === name));
    lines.push(`Đơn ${order.id}: ${STATIONS[sender].name} báo ${says}`);
    for (const r of reactions) lines.push(`  ${STATIONS[r.at].name} ${r.does}`);
  };
  tell("out_of_stock");
  tell("payment_failed");
  lines.push("Thêm bộ phận Hoá đơn: chỉ nối một dây tới mediator");
  tell("paid");
  lines.push(`Số dây: ${wires(STEPS[3])}, mỗi bộ phận một dây tới mediator`);
  return lines.join("\n");
}
