// Interpreter: quy tắc ưu đãi là một cây biểu thức, lưu như dữ liệu và tự đánh giá.
// Chạy: node interpreter.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

type Value = string | number;
type Context = Record<string, Value>;

// Mỗi nút của cây biết tự đánh giá trên một khách hàng, và tự in lại chính nó.
interface Expr {
  evaluate(ctx: Context): Value | boolean;
  toString(): string;
}

// Nút lá: đọc một giá trị của khách, hoặc một hằng số viết sẵn trong quy tắc.
class Var implements Expr {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  evaluate(ctx: Context): Value {
    return ctx[this.name];
  }
  toString(): string {
    return this.name;
  }
}

class Const implements Expr {
  readonly value: Value;
  constructor(value: Value) {
    this.value = value;
  }
  evaluate(): Value {
    return this.value;
  }
  toString(): string {
    return typeof this.value === "string" ? `"${this.value}"` : String(this.value);
  }
}

// Nút so sánh và nút ghép đều có hai nhánh con.
abstract class Binary implements Expr {
  readonly left: Expr;
  readonly right: Expr;
  constructor(left: Expr, right: Expr) {
    this.left = left;
    this.right = right;
  }
  abstract evaluate(ctx: Context): boolean;
}

class Equals extends Binary {
  evaluate(ctx: Context): boolean {
    return this.left.evaluate(ctx) === this.right.evaluate(ctx);
  }
  toString(): string {
    return `${this.left} == ${this.right}`;
  }
}

class AtLeast extends Binary {
  evaluate(ctx: Context): boolean {
    return (this.left.evaluate(ctx) as number) >= (this.right.evaluate(ctx) as number);
  }
  toString(): string {
    return `${this.left} >= ${this.right}`;
  }
}

// VÀ cần cả hai nhánh đúng, HOẶC chỉ cần một nhánh.
class And extends Binary {
  evaluate(ctx: Context): boolean {
    return Boolean(this.left.evaluate(ctx)) && Boolean(this.right.evaluate(ctx));
  }
  toString(): string {
    return `(${this.left} VÀ ${this.right})`;
  }
}

class Or extends Binary {
  evaluate(ctx: Context): boolean {
    return Boolean(this.left.evaluate(ctx)) || Boolean(this.right.evaluate(ctx));
  }
  toString(): string {
    return `${this.left} HOẶC ${this.right}`;
  }
}

// Quy tắc của bộ phận kinh doanh, dựng thẳng thành cây. Thực tế cây này thường được
// đọc từ JSON lưu trong cơ sở dữ liệu, nên đổi quy tắc không cần sửa code.
const RULE: Expr = new Or(
  new Equals(new Var("hạng"), new Const("vàng")),
  new And(new AtLeast(new Var("tổng_đơn"), new Const(500000)), new Equals(new Var("khu_vực"), new Const("HN"))),
);

const CUSTOMERS: [string, Context][] = [
  ["An", { "hạng": "vàng", "tổng_đơn": 320000, "khu_vực": "HCM" }],
  ["Bình", { "hạng": "bạc", "tổng_đơn": 650000, "khu_vực": "HN" }],
  ["Chi", { "hạng": "bạc", "tổng_đơn": 720000, "khu_vực": "ĐN" }],
];

const dots = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

console.log(`Quy tắc: ${RULE}`);
for (const [name, ctx] of CUSTOMERS) {
  const verdict = RULE.evaluate(ctx) ? "được ưu đãi" : "không";
  const line = name.padEnd(6) + String(ctx["hạng"]).padEnd(6) + dots(ctx["tổng_đơn"] as number).padStart(8) + "  " + String(ctx["khu_vực"]).padEnd(5);
  console.log(`${line}-> ${verdict}`);
}
