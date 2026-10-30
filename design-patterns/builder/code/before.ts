// Trước khi có Builder: một hàm nhận cả tá tham số và tự nối chuỗi SQL.
// Chạy: node before.ts

function findOrdersSql(
  status: string | null = null,
  dateFrom: string | null = null,
  dateTo: string | null = null,
  customerId: number | null = null,
  sort: string | null = null,
  desc = false,
  page = 1,
  size = 20,
): string {
  let sql = "SELECT id, code, total FROM orders WHERE";
  if (status) sql += ` status = '${status}'`;
  if (dateFrom) sql += ` AND created_at >= '${dateFrom}'`;
  if (dateTo) sql += ` AND created_at < '${dateTo}'`;
  if (customerId) sql += ` AND customer_id = ${customerId}`;
  if (sort) sql += ` ORDER BY ${sort}` + (desc ? " DESC" : "");
  sql += ` LIMIT ${size} OFFSET ${(page - 1) * size}`;
  return sql;
}

// Không lọc trạng thái: "WHERE AND ..." là SQL sai, và giá trị bị dán thẳng vào chuỗi.
console.log(findOrdersSql(null, "2026-10-01", "2026-11-01", null, "created_at", true, 3, 20));
// Tám tham số theo vị trí: đổi chỗ page và size vẫn chạy, chỉ là ra trang khác.
console.log(findOrdersSql("paid", null, null, null, "created_at", true, 20, 3));
