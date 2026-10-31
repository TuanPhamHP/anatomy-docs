"""Iterator: duyệt đơn hàng của một API phân trang mà chỗ gọi không phải biết gì về trang hay cursor.

Chạy: python3 iterator.py
"""
from dataclasses import dataclass

PAGES = {
    None: {"items": [("DH-001", 450_000), ("DH-002", 1_250_000), ("DH-003", 320_000), ("DH-004", 860_000)], "next_cursor": "c2"},
    "c2": {"items": [("DH-005", 1_900_000), ("DH-006", 2_400_000), ("DH-007", 560_000), ("DH-008", 1_100_000)], "next_cursor": "c3"},
    "c3": {"items": [("DH-009", 3_150_000), ("DH-010", 780_000)], "next_cursor": None},
}


@dataclass(frozen=True)
class Order:
    code: str
    total: int


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


class OrderApi:
    """API giả: trả từng trang đơn hàng theo cursor, đếm và in ra mỗi lần bị gọi."""

    def __init__(self) -> None:
        self.calls = 0

    def list_orders(self, cursor: str | None = None) -> dict:
        self.calls += 1
        page = PAGES[cursor]
        tail = ", đây là trang cuối" if page["next_cursor"] is None else ""
        print(f"  gọi API lần {self.calls}, cursor {cursor or 'đầu'}: nhận {len(page['items'])} đơn{tail}")
        return page


class OrderIterator:
    """Iterator: nhớ trang đang cầm và vị trí trong trang, chỉ gọi API khi trang ấy đã dùng hết."""

    def __init__(self, api: OrderApi) -> None:
        self._api = api
        self._items: list = []
        self._pos = 0
        self._cursor: str | None = None
        self._started = False

    def __iter__(self) -> "OrderIterator":
        return self

    def __next__(self) -> Order:
        while self._pos == len(self._items):
            if self._started and self._cursor is None:
                raise StopIteration  # trang cuối đã dùng hết: báo cho vòng for dừng lại
            page = self._api.list_orders(self._cursor)
            self._started = True
            self._items, self._pos = page["items"], 0
            self._cursor = page["next_cursor"]
        code, total = self._items[self._pos]
        self._pos += 1
        return Order(code, total)


class OrderList:
    """Aggregate: tập đơn hàng nằm sau API. Mỗi vòng lặp nhận một iterator mới của riêng nó."""

    def __init__(self, api: OrderApi) -> None:
        self._api = api

    def __iter__(self) -> OrderIterator:
        return OrderIterator(self._api)


# Client chỉ viết vòng for. Không có cursor, không có số trang, không có điều kiện dừng nào.
print("Duyệt hết danh sách:")
api = OrderApi()
orders = [order for order in OrderList(api)]
print(f"  {len(orders)} đơn, tổng {vnd(sum(order.total for order in orders))} ₫, {api.calls} lần gọi API")

print("Tìm đơn đầu tiên trên 2.000.000 ₫:")
api = OrderApi()
for seen, order in enumerate(OrderList(api), start=1):
    if order.total > 2_000_000:
        print(f"  thấy {order.code} ({vnd(order.total)} ₫) ở đơn thứ {seen} rồi dừng vòng lặp")
        break
print(f"  {api.calls} lần gọi API, trang thứ ba không bao giờ được tải")
