// The Iterator figure's model: ten orders behind a paginated API, four to a
// page, and two loops over them. The first reads everything; the second stops
// at the first order above 2.000.000 ₫. Each next() call takes one order; a page
// is fetched only when the one in hand is used up. build.mjs inlines this file,
// so the counters, the screen and the captions show these numbers; the Python
// and TypeScript examples under code/ use the same pages and print the same ones.

export const PAGES = [
  { cursor: null, next: "c2", orders: [["DH-001", 450000], ["DH-002", 1250000], ["DH-003", 320000], ["DH-004", 860000]] },
  { cursor: "c2", next: "c3", orders: [["DH-005", 1900000], ["DH-006", 2400000], ["DH-007", 560000], ["DH-008", 1100000]] },
  { cursor: "c3", next: null, orders: [["DH-009", 3150000], ["DH-010", 780000]] },
];

export const ORDERS = PAGES.flatMap((page, index) => page.orders.map(([code, total]) => ({ code, total, page: index })));
// Index of each page's first order, and how many orders it holds.
export const FIRST = PAGES.map((_, i) => PAGES.slice(0, i).reduce((n, page) => n + page.orders.length, 0));
export const SIZE = PAGES.map((page) => page.orders.length);

export const LIMIT = 2000000;
export const BIG = ORDERS.findIndex((order) => order.total > LIMIT);

// What `calls` next() calls have done: orders handed out, pages fetched, and
// whether the last call found nothing left (StopIteration).
export function after(calls) {
  const given = Math.min(calls, ORDERS.length);
  const pages = FIRST.filter((first) => first < calls).length;
  return { given, pages, done: calls > ORDERS.length, current: given ? ORDERS[given - 1] : null };
}

// The four steps: two loops over the same API. `calls` is how many times the loop has called next().
export const STEPS = [
  { label: "Đơn đầu tiên", short: "Đơn\u00a01", run: 0, calls: 1 },
  { label: "Sang trang 2", short: "Đơn\u00a05", run: 0, calls: FIRST[1] + 1 },
  { label: "Hết dữ liệu", short: "Hết", run: 0, calls: ORDERS.length + 1 },
  { label: "Dừng sớm", short: "Break", run: 1, calls: BIG + 1 },
];

export const total = (orders) => orders.reduce((sum, order) => sum + order.total, 0);
// 1250000 -> "1.250.000", the way the examples print money.
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
