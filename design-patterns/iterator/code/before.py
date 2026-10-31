"""Trước khi có Iterator: chỗ nào cần danh sách đơn hàng cũng tự viết vòng lặp phân trang.

Chạy: python3 before.py
"""

PAGES = {
    None: {"items": [("DH-001", 450_000), ("DH-002", 1_250_000), ("DH-003", 320_000), ("DH-004", 860_000)], "next_cursor": "c2"},
    "c2": {"items": [("DH-005", 1_900_000), ("DH-006", 2_400_000), ("DH-007", 560_000), ("DH-008", 1_100_000)], "next_cursor": "c3"},
    "c3": {"items": [("DH-009", 3_150_000), ("DH-010", 780_000)], "next_cursor": None},
}


class OrderApi:
    """API giả: trả từng trang đơn hàng theo cursor và đếm số lần bị gọi."""

    def __init__(self) -> None:
        self.calls = 0

    def list_orders(self, cursor: str | None = None) -> dict:
        self.calls += 1
        return PAGES[cursor]


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


# Báo cáo doanh thu tự lo chuyện phân trang: giữ cursor, gọi tiếp, biết lúc nào dừng.
def revenue(api: OrderApi) -> int:
    total, cursor = 0, None
    while True:
        page = api.list_orders(cursor)
        total += sum(amount for _, amount in page["items"])
        cursor = page["next_cursor"]
        if cursor is None:
            break
    return total


# Màn hình đếm đơn chép lại vòng lặp ấy, nhưng điều kiện dừng đặt sai chỗ:
# nó thoát ngay khi thấy trang cuối, trước khi kịp đếm các đơn trong trang đó.
def count_orders(api: OrderApi) -> int:
    count = 0
    page = api.list_orders()
    while page["next_cursor"] is not None:
        count += len(page["items"])
        page = api.list_orders(page["next_cursor"])
    return count


api = OrderApi()
print(f"Doanh thu: {vnd(revenue(api))} ₫ sau {api.calls} lần gọi API")
api = OrderApi()
print(f"Số đơn: {count_orders(api)}, đúng ra phải là 10")
