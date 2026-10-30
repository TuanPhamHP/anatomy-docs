// The Builder figure's model: the builder calls of the scenario, what each one
// adds to the form, and the Query that build() returns. figure.mjs inlines this
// file into the page, so the readout, the captions and the printed proof are
// exactly what this builder produces. code/builder.py and builder.ts run the
// same calls and print the same lines (build.mjs checks that).

export const BASE = "SELECT id, code, total FROM orders";
export const SORTABLE = ["created_at", "total"];
export const MAX_SIZE = 100;

export class OrderQueryBuilder {
  constructor() {
    this.where = [];
    this.order = null;
    this.paging = null;
  }

  status(value) {
    this.where.push(["status = ?", value]);
    return this;
  }

  createdBetween(start, end) {
    if (start >= end) throw new Error("ngày bắt đầu phải trước ngày kết thúc");
    this.where.push(["created_at >= ?", start], ["created_at < ?", end]);
    return this;
  }

  orderBy(column, desc = false) {
    if (!SORTABLE.includes(column)) throw new Error("không sắp xếp theo cột " + column);
    this.order = "ORDER BY " + column + (desc ? " DESC" : "");
    return this;
  }

  page(number, size) {
    if (number < 1 || size < 1 || size > MAX_SIZE) throw new Error("page từ 1, size từ 1 đến " + MAX_SIZE);
    this.paging = [size, (number - 1) * size];
    return this;
  }

  build() {
    if (!this.paging) throw new Error("thiếu page(): danh sách đơn phải phân trang");
    const lines = [BASE];
    const params = [];
    this.where.forEach(([condition, value], i) => {
      lines.push((i === 0 ? "WHERE " : "  AND ") + condition);
      params.push(value);
    });
    if (this.order) lines.push(this.order);
    lines.push("LIMIT ? OFFSET ?");
    params.push(...this.paging);
    return Object.freeze({ sql: lines.join("\n"), params: Object.freeze(params) });
  }
}

// The builder calls, in the order the scenario makes them. `row` is the form row
// the call's slug drops into; `type` is the text cast on that slug.
export const CALLS = [
  { row: 1, py: 'status("paid")', apply: (b) => b.status("paid"), type: "status = ?" },
  { row: 2, py: 'created_between("2026-10-01", "2026-11-01")', short: "created_between(…)", apply: (b) => b.createdBetween("2026-10-01", "2026-11-01"), type: "created_at >= ? created_at < ?" },
  { row: 3, py: 'order_by("created_at", desc=True)', short: "order_by(…)", apply: (b) => b.orderBy("created_at", true), type: "ORDER BY created_at DESC" },
  { row: 4, py: "page(3, 20)", apply: (b) => b.page(3, 20), type: "LIMIT ? OFFSET ?" },
];

// The scenario: three calls, a build() that is refused, the missing call, then build().
export const STEPS = [
  { kind: "add", call: 0 },
  { kind: "add", call: 1 },
  { kind: "add", call: 2 },
  { kind: "build" },
  { kind: "add", call: 3 },
  { kind: "build" },
];

// Replays the scenario up to step n: the builder's parts, and build()'s result if step n is a build.
export function replay(n) {
  const builder = new OrderQueryBuilder();
  let result = null;
  for (let i = 0; i <= n; i++) {
    const step = STEPS[i];
    if (step.kind === "add") CALLS[step.call].apply(builder);
    else {
      try {
        result = { query: builder.build() };
      } catch (error) {
        result = { error: error.message };
      }
    }
  }
  const rows = [0, ...CALLS.filter((_, c) => STEPS.slice(0, n + 1).some((s) => s.kind === "add" && s.call === c)).map((call) => call.row)];
  return { builder, rows, result: STEPS[n].kind === "build" ? result : null };
}

// Params as the examples print them: strings quoted, numbers bare.
export const showParams = (params) => "[" + params.map((p) => (typeof p === "string" ? '"' + p + '"' : String(p))).join(", ") + "]";

// What builder.py prints: the refused build(), then the finished Query.
export function transcript() {
  const refused = replay(3).result.error;
  const { query } = replay(5).result;
  return ["build() từ chối: " + refused, query.sql, "params = " + showParams(query.params)].join("\n");
}
