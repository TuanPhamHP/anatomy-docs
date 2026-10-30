"""Observer: một sự kiện "đã đặt hàng", nhiều listener độc lập với nhau.

Chạy: python3 observer.py
"""
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Order:
    code: str
    items: int
    total: int  # VND


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


# Observer: interface chung. Listener nào cũng chỉ cần một hàm nhận đơn hàng.
class OrderListener(Protocol):
    def on_order_placed(self, order: Order) -> None: ...


# Subject: giữ danh sách listener và phát sự kiện. Nó không biết listener nào làm gì.
class OrderPlaced:
    def __init__(self) -> None:
        self._listeners: list[OrderListener] = []

    def subscribe(self, listener: OrderListener) -> None:
        self._listeners.append(listener)

    def unsubscribe(self, listener: OrderListener) -> None:
        self._listeners.remove(listener)

    def notify(self, order: Order) -> None:
        for listener in list(self._listeners):
            listener.on_order_placed(order)


# Concrete observers: mỗi lớp lo một việc và không biết các lớp khác.
class EmailListener:
    def on_order_placed(self, order: Order) -> None:
        print(f"  Email: gửi xác nhận đơn {order.code}")


class StockListener:
    def on_order_placed(self, order: Order) -> None:
        print(f"  Kho: giữ {order.items} sản phẩm")


class PointsListener:
    POINT_VALUE = 10_000  # 1 điểm cho mỗi 10.000 ₫

    def on_order_placed(self, order: Order) -> None:
        print(f"  Điểm: cộng {order.total // self.POINT_VALUE} điểm")


class AnalyticsListener:
    def on_order_placed(self, order: Order) -> None:
        print(f"  Thống kê: ghi doanh thu {vnd(order.total)} ₫")


# Nơi phát sự kiện: lưu đơn rồi báo cho ai đang nghe, không gọi thẳng ai cả.
class OrderService:
    def __init__(self, placed: OrderPlaced) -> None:
        self._placed = placed

    def place(self, order: Order) -> None:
        print(f"Đơn {order.code} ({order.items} sản phẩm, {vnd(order.total)} ₫)")
        # ... lưu đơn hàng vào cơ sở dữ liệu ...
        self._placed.notify(order)


if __name__ == "__main__":
    placed = OrderPlaced()
    email = EmailListener()
    for listener in (email, StockListener(), PointsListener()):
        placed.subscribe(listener)
    service = OrderService(placed)

    service.place(Order("#1001", 2, 1_250_000))

    print("+ subscribe(Thống kê)")
    placed.subscribe(AnalyticsListener())
    service.place(Order("#1002", 3, 860_000))

    print("- unsubscribe(Email)")
    placed.unsubscribe(email)
    service.place(Order("#1003", 1, 2_400_000))
