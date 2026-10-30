// Khi chưa có Template Method: mỗi định dạng một hàm export, chép gần giống nhau.
type Order = { id: string; amount: number; status: string };

const ORDERS: Order[] = [
  { id: "DH-101", amount: 1250000, status: "paid" },
  { id: "DH-102", amount: 860000, status: "cancelled" },
  { id: "DH-103", amount: 2400000, status: "paid" },
  { id: "DH-104", amount: 540000, status: "paid" },
  { id: "DH-105", amount: 1100000, status: "cancelled" },
  { id: "DH-106", amount: 375000, status: "paid" },
];

const vnd = (n: number) => n.toLocaleString("vi-VN");
const sum = (rows: Order[]) => rows.reduce((total, o) => total + o.amount, 0);

function exportCsv(orders: Order[]): string[] {
  const rows = orders.filter((o) => o.status !== "cancelled");
  const lines = ["ma_don,so_tien", ...rows.map((o) => `${o.id},${o.amount}`)];
  console.log(`report.csv: ${rows.length} đơn, tổng ${vnd(sum(rows))} ₫`);
  return lines;
}

function exportJsonl(orders: Order[]): string[] {
  const rows = orders; // chép từ exportCsv rồi sửa, quên mất bước lọc đơn huỷ
  const lines = rows.map((o) => JSON.stringify({ ma_don: o.id, so_tien: o.amount }));
  console.log(`report.jsonl: ${rows.length} đơn, tổng ${vnd(sum(rows))} ₫`);
  return lines;
}

exportCsv(ORDERS);
exportJsonl(ORDERS);
