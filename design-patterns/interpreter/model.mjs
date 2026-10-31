// The Interpreter figure's model: one promotion rule kept as an expression tree,
// and the three customers it is evaluated against. build.mjs inlines this file,
// so the readout and the step captions come from evaluating this tree; the
// Python and TypeScript examples under code/ build the same tree and print the
// same results (transcript() reproduces their output line for line).

const node = (op, left, right) => ({ op, left, right });
export const Var = (name) => ({ op: "var", name });
export const Const = (value) => ({ op: "const", value });
export const Equals = (left, right) => node("==", left, right);
export const AtLeast = (left, right) => node(">=", left, right);
export const And = (left, right) => node("VÀ", left, right);
export const Or = (left, right) => node("HOẶC", left, right);

// hạng == "vàng" HOẶC (tổng_đơn >= 500000 VÀ khu_vực == "HN")
export const RULE = Or(
  Equals(Var("hạng"), Const("vàng")),
  And(AtLeast(Var("tổng_đơn"), Const(500000)), Equals(Var("khu_vực"), Const("HN"))),
);

export const CUSTOMERS = [
  { name: "An", ctx: { "hạng": "vàng", "tổng_đơn": 320000, "khu_vực": "HCM" } },
  { name: "Bình", ctx: { "hạng": "bạc", "tổng_đơn": 650000, "khu_vực": "HN" } },
  { name: "Chi", ctx: { "hạng": "bạc", "tổng_đơn": 720000, "khu_vực": "ĐN" } },
];

// The same evaluate() every node class has in the examples.
export function evaluate(expr, ctx) {
  switch (expr.op) {
    case "var": return ctx[expr.name];
    case "const": return expr.value;
    case "==": return evaluate(expr.left, ctx) === evaluate(expr.right, ctx);
    case ">=": return evaluate(expr.left, ctx) >= evaluate(expr.right, ctx);
    case "VÀ": return Boolean(evaluate(expr.left, ctx)) && Boolean(evaluate(expr.right, ctx));
    case "HOẶC": return Boolean(evaluate(expr.left, ctx)) || Boolean(evaluate(expr.right, ctx));
  }
  throw new Error(`unknown node ${expr.op}`);
}

// The same __str__ / toString(): VÀ wraps itself in brackets, HOẶC doesn't.
export function text(expr) {
  switch (expr.op) {
    case "var": return expr.name;
    case "const": return typeof expr.value === "string" ? `"${expr.value}"` : String(expr.value);
    case "VÀ": return `(${text(expr.left)} VÀ ${text(expr.right)})`;
    default: return `${text(expr.left)} ${expr.op} ${text(expr.right)}`;
  }
}

// The three comparison leaves of RULE, left to right, as the figure's three sensors.
export const LEAVES = [RULE.left, RULE.right.left, RULE.right.right];
export const leafTruths = (ctx) => LEAVES.map((leaf) => evaluate(leaf, ctx));

// 650000 -> "650.000", as the examples print it.
export const dots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function transcript() {
  const lines = [`Quy tắc: ${text(RULE)}`];
  for (const { name, ctx } of CUSTOMERS) {
    const verdict = evaluate(RULE, ctx) ? "được ưu đãi" : "không";
    lines.push(`${name.padEnd(6)}${ctx["hạng"].padEnd(6)}${dots(ctx["tổng_đơn"]).padStart(8)}  ${ctx["khu_vực"].padEnd(5)}-> ${verdict}`);
  }
  return lines.join("\n");
}
