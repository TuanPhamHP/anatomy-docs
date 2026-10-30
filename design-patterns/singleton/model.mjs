// The Singleton figure's model: a database with 20 connection ports, pools of 10
// connections, and three services that each need a pool. build.mjs inlines this
// file into the page, so the counters and captions show exactly these numbers.
// The Python and TypeScript examples under code/ run the same scenarios and
// print the same lines.

export const DB_PORTS = 20;
export const POOL_SIZE = 10;

export const SERVICES = [
  { name: "Đơn hàng", short: "ĐH", tag: "ĐƠN HÀNG", cls: "OrderService" },
  { name: "Thanh toán", short: "TT", tag: "T.TOÁN", cls: "PaymentService" },
  { name: "Báo cáo", short: "BC", tag: "BÁO CÁO", cls: "ReportService" },
];

// Runs one scenario: `shared` is false when every service creates its own pool,
// true when every service asks get_pool() for the one shared pool. `calls` is how
// many services have asked so far. Returns the pools that exist, what each
// service holds and the database's port count, as the code prints them.
export function simulate(shared, calls) {
  let used = 0;
  const pools = [];
  const held = [];
  const open = () => {
    const pool = { id: pools.length + 1, ok: used + POOL_SIZE <= DB_PORTS };
    if (pool.ok) used += POOL_SIZE;
    pools.push(pool);
    return pool;
  };
  for (let i = 0; i < calls; i++) held.push(shared ? (pools[0] ?? open()) : open());
  return { pools, held, used };
}

// The figure's steps: the contrast first, then the Singleton scenario one call at a time.
export const STEPS = [
  { shared: false, calls: 3 },
  { shared: true, calls: 1 },
  { shared: true, calls: 2 },
  { shared: true, calls: 3 },
].map((step) => ({ ...step, ...simulate(step.shared, step.calls) }));

// What a service's window shows: the pool it holds, an error, or nothing yet.
export const holding = (step, i) => {
  const pool = step.held[i];
  return !pool ? "--" : pool.ok ? `#${pool.id}` : "LỖI";
};

export const ports = (used) => `${used}/${DB_PORTS}`;
