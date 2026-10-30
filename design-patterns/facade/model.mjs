// The Facade figure's model: one order, the five subsystems the facade calls
// for it, and the program bar that calls them in order. build.mjs inlines this
// file into the page, so the readout, the displays and the followers' lift all
// come from here. The Python and TypeScript examples under code/ place the same
// order and print the same values.

export const ORDER = {
  id: "DH-2041",
  sku: "SP-17",
  item: "Bình giữ nhiệt",
  qty: 2,
  price: 485000,
  card: "4242",
  email: "khach@example.com",
};
export const TOTAL = ORDER.qty * ORDER.price;
export const STOCK_BEFORE = 12;

// 970000 -> "970.000"
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Small counts in captions read as words, the way a person would say them.
export const inWords = (n) => ["không", "một", "hai", "ba", "bốn", "năm"][n] ?? String(n);

// The subsystems, in the order the facade calls them. `shown` is what the
// module's own window reads once its call has run (`idle` before that).
// `result(call)` is the step caption, given the call already wrapped in <code>.
export const SUBSYSTEMS = [
  {
    id: "inventory",
    name: "Kho",
    call: `inventory.reserve("${ORDER.sku}", ${ORDER.qty})`,
    idle: String(STOCK_BEFORE),
    shown: String(STOCK_BEFORE - ORDER.qty),
    result: (call) => `Bước đầu tiên, facade gọi ${call} để giữ ${inWords(ORDER.qty)} sản phẩm cho đơn, nên tồn kho giảm từ ${STOCK_BEFORE} xuống <strong>${STOCK_BEFORE - ORDER.qty}</strong>.`,
    readout: `tồn ${STOCK_BEFORE} → ${STOCK_BEFORE - ORDER.qty}`,
  },
  {
    id: "payments",
    name: "Thanh toán",
    call: `payments.charge("${ORDER.card}", ${TOTAL})`,
    idle: "------",
    shown: "GD-5521",
    result: (call) => `Giữ hàng xong, facade mới gọi ${call}. Thẻ của khách bị trừ <strong>${groupVND(TOTAL)} ₫</strong>, kèm mã giao dịch GD-5521.`,
    readout: `${groupVND(TOTAL)} ₫ · GD-5521`,
  },
  {
    id: "shipping",
    name: "Vận chuyển",
    call: `shipping.book("${ORDER.id}")`,
    idle: "------",
    shown: "VD-3308",
    result: (call) => `Tiền đã về, facade gọi ${call} để đặt lịch giao và nhận mã vận đơn <strong>VD-3308</strong>.`,
    readout: "vận đơn VD-3308",
  },
  {
    id: "invoices",
    name: "Hoá đơn",
    call: `invoices.issue("${ORDER.id}", ${TOTAL})`,
    idle: "------",
    shown: "HD-0457",
    result: (call) => `Tiếp theo, facade gọi ${call} để xuất hoá đơn <strong>HD-0457</strong>.`,
    readout: "hoá đơn HD-0457",
  },
  {
    id: "notifier",
    name: "Thông báo",
    call: `notifier.send("${ORDER.email}", ...)`,
    idle: "------",
    shown: "ĐÃ GỬI",
    result: (call) => `Cuối cùng, facade gọi ${call} để gửi email xác nhận cho khách. Xong cả năm việc, facade trả kết quả cho client ngay trong một lần gọi.`,
    readout: `đơn ${ORDER.id} xong`,
  },
];

// The program bar. The facade draws it toward itself by `s` (0 at rest, up to
// STROKE). Station i's follower sits at STATIONS[i]; its lug starts LUG_GAP
// further along for every earlier station, climbs RISE over RAMP and then stays
// up to LUG_END, so the followers rise one after another and stay up: each call
// has finished before the next one starts. Lengths are in figure units.
export const PROGRAM = { stations: [-80, -40, 0, 40, 80], stroke: 32, rise: 6, ramp: 5, first: 1, gap: 6, end: 33, chamfer: 1.5, roller: 2.2 };
export const lugStart = (i) => PROGRAM.first + PROGRAM.gap * i;

// Where the bar stops for each step: step 0 is the button press, step k the
// stroke at which follower k-1 has just reached the top of its ramp.
export const STEP_STROKE = [0, ...SUBSYSTEMS.map((_, i) => lugStart(i) + PROGRAM.ramp)];

// Height of station i's lug at `u`, measured along the bar from the station at rest.
export function lugHeight(i, u) {
  const { ramp, rise, end, chamfer } = PROGRAM;
  const a = lugStart(i);
  if (u <= a || u >= end + chamfer) return 0;
  if (u < a + ramp) return (rise * (u - a)) / ramp;
  if (u <= end) return rise;
  return (rise * (end + chamfer - u)) / chamfer;
}

// How far follower i's roller is lifted when the bar has moved by s: the
// highest point where a circle of the roller's radius touches the lug.
export function lift(i, s) {
  const r = PROGRAM.roller;
  let best = 0;
  for (let k = -24; k <= 24; k++) {
    const du = (r * k) / 24;
    best = Math.max(best, lugHeight(i, s + du) + Math.sqrt(r * r - du * du) - r);
  }
  return best;
}

// A call has run once its follower is at the top.
export const done = (i, s) => lift(i, s) > PROGRAM.rise - 0.05;
