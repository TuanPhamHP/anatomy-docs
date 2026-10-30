"""Builder: dựng câu truy vấn danh sách đơn hàng từng bước, kiểm tra rồi mới tạo Query.

Chạy: python3 builder.py
"""
from dataclasses import dataclass

SORTABLE = {"created_at", "total"}
MAX_SIZE = 100


# Product: câu truy vấn đã dựng xong. frozen=True nên không ai sửa được nữa.
@dataclass(frozen=True)
class Query:
    sql: str
    params: tuple


# Builder: gom từng phần. Mỗi hàm trả về chính builder để gọi nối tiếp.
class OrderQueryBuilder:
    def __init__(self) -> None:
        self._where: list[tuple[str, object]] = []
        self._order: str | None = None
        self._page: tuple[int, int] | None = None

    def status(self, value: str) -> "OrderQueryBuilder":
        self._where.append(("status = ?", value))
        return self

    def created_between(self, start: str, end: str) -> "OrderQueryBuilder":
        if start >= end:
            raise ValueError("ngày bắt đầu phải trước ngày kết thúc")
        self._where.append(("created_at >= ?", start))
        self._where.append(("created_at < ?", end))
        return self

    def customer(self, customer_id: int) -> "OrderQueryBuilder":
        self._where.append(("customer_id = ?", customer_id))
        return self

    def order_by(self, column: str, desc: bool = False) -> "OrderQueryBuilder":
        if column not in SORTABLE:  # tên cột không đi qua tham số được, nên chỉ nhận cột trong danh sách
            raise ValueError(f"không sắp xếp theo cột {column}")
        self._order = f"ORDER BY {column}" + (" DESC" if desc else "")
        return self

    def page(self, number: int, size: int) -> "OrderQueryBuilder":
        if number < 1 or not 1 <= size <= MAX_SIZE:
            raise ValueError(f"page từ 1, size từ 1 đến {MAX_SIZE}")
        self._page = (size, (number - 1) * size)
        return self

    def build(self) -> Query:
        # Kiểm tra cả bộ một lần, rồi mới ghép câu theo đúng ngữ pháp SQL.
        if self._page is None:
            raise ValueError("thiếu page(): danh sách đơn phải phân trang")
        lines = ["SELECT id, code, total FROM orders"]
        params: list[object] = []
        for i, (condition, value) in enumerate(self._where):
            lines.append(("WHERE " if i == 0 else "  AND ") + condition)
            params.append(value)
        if self._order:
            lines.append(self._order)
        lines.append("LIMIT ? OFFSET ?")
        params.extend(self._page)
        return Query("\n".join(lines), tuple(params))


def show(params: tuple) -> str:
    return "[" + ", ".join(f'"{p}"' if isinstance(p, str) else str(p) for p in params) + "]"


if __name__ == "__main__":
    builder = (
        OrderQueryBuilder()
        .status("paid")
        .created_between("2026-10-01", "2026-11-01")
        .order_by("created_at", desc=True)
    )
    try:
        builder.build()
    except ValueError as error:
        print(f"build() từ chối: {error}")

    query = builder.page(3, 20).build()
    print(query.sql)
    print("params =", show(query.params))
