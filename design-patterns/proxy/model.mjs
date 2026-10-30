// The Proxy figure's model: one annual report behind a proxy, and three reads.
// The proxy refuses a reader without the right role before touching anything,
// loads the real report on the first permitted read (the slow part) and hands
// the same loaded report to every later read. build.mjs inlines this file, so
// the readout and captions show these numbers; the Python and TypeScript
// examples under code/ run the same three reads and print the same ones.

export const REPORT = { title: "Báo cáo thường niên 2025", pages: 1240, loadSeconds: 2.4 };
export const ALLOWED = ["ke-toan", "giam-doc"];

export const REQUESTS = [
  { who: "Khách", role: "khach", label: "Khách đọc", short: "Khách" },
  { who: "Kế toán", role: "ke-toan", label: "Kế toán, lần đầu", short: "Lần đầu" },
  { who: "Kế toán", role: "ke-toan", label: "Kế toán đọc lại", short: "Đọc lại" },
];

// The proxy's rules, step by step: what each read got, how many loads so far, and the time it took.
export function play(requests = REQUESTS) {
  let loads = 0;
  return requests.map((request) => {
    const allowed = ALLOWED.includes(request.role);
    const loadsNow = allowed && loads === 0;
    if (loadsNow) loads += 1;
    return { ...request, allowed, loadsNow, loads, seconds: loadsNow ? REPORT.loadSeconds : 0 };
  });
}

// 1240 -> "1.240", 2.4 -> "2,4 s", the way the examples print them.
export const groupDots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const secondsText = (s) => `${String(s).replace(".", ",")} s`;
