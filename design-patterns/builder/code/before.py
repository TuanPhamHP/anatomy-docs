"""Trước khi có Builder: một hàm nhận cả tá tham số và tự nối chuỗi SQL.

Chạy: python3 before.py
"""


def find_orders_sql(status=None, date_from=None, date_to=None, customer_id=None,
                    sort=None, desc=False, page=1, size=20):
    sql = "SELECT id, code, total FROM orders WHERE"
    if status:
        sql += f" status = '{status}'"
    if date_from:
        sql += f" AND created_at >= '{date_from}'"
    if date_to:
        sql += f" AND created_at < '{date_to}'"
    if customer_id:
        sql += f" AND customer_id = {customer_id}"
    if sort:
        sql += f" ORDER BY {sort}" + (" DESC" if desc else "")
    sql += f" LIMIT {size} OFFSET {(page - 1) * size}"
    return sql


# Không lọc trạng thái: "WHERE AND ..." là SQL sai, và giá trị bị dán thẳng vào chuỗi.
print(find_orders_sql(None, "2026-10-01", "2026-11-01", None, "created_at", True, 3, 20))
# Tám tham số theo vị trí: đổi chỗ page và size vẫn chạy, chỉ là ra trang khác.
print(find_orders_sql("paid", None, None, None, "created_at", True, 20, 3))
