// Trước khi có Interpreter: quy tắc ưu đãi viết cứng trong một hàm.
// Chạy: node before.ts

type Context = { "hạng": string; "tổng_đơn": number; "khu_vực": string };

const CUSTOMERS: [string, Context][] = [
  ["An", { "hạng": "vàng", "tổng_đơn": 320000, "khu_vực": "HCM" }],
  ["Bình", { "hạng": "bạc", "tổng_đơn": 650000, "khu_vực": "HN" }],
  ["Chi", { "hạng": "bạc", "tổng_đơn": 720000, "khu_vực": "ĐN" }],
];

function eligible(ctx: Context): boolean {
  // Mỗi lần bộ phận kinh doanh đổi điều kiện là một lần sửa hàm này, review rồi deploy lại.
  // Khu vực khác muốn quy tắc khác thì hàm lại mọc thêm nhánh if.
  if (ctx["hạng"] === "vàng") return true;
  if (ctx["tổng_đơn"] >= 500000) {
    if (ctx["khu_vực"] === "HN") return true;
  }
  return false;
}

const dots = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

console.log("Quy tắc: nằm trong hàm eligible(), muốn đổi phải sửa code");
for (const [name, ctx] of CUSTOMERS) {
  const verdict = eligible(ctx) ? "được ưu đãi" : "không";
  const line = name.padEnd(6) + ctx["hạng"].padEnd(6) + dots(ctx["tổng_đơn"]).padStart(8) + "  " + ctx["khu_vực"].padEnd(5);
  console.log(`${line}-> ${verdict}`);
}
