"""Khi chưa có Observer: dịch vụ đặt hàng tự gọi từng bên cần biết về đơn hàng."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Order:
    code: str
    items: int
    total: int  # VND


class EmailSender:
    def send_confirmation(self, order: Order) -> None:
        print(f"  Email: gửi xác nhận đơn {order.code}")


class Inventory:
    def reserve(self, order: Order) -> None:
        print(f"  Kho: giữ {order.items} sản phẩm")


class Loyalty:
    def add_points(self, order: Order) -> None:
        print(f"  Điểm: cộng {order.total // 10_000} điểm")


class OrderService:
    def __init__(self, email: EmailSender, inventory: Inventory, loyalty: Loyalty) -> None:
        self._email = email
        self._inventory = inventory
        self._loyalty = loyalty

    def place(self, order: Order) -> None:
        print(f"Đơn {order.code}")
        # ... lưu đơn hàng ...
        self._email.send_confirmation(order)
        self._inventory.reserve(order)
        self._loyalty.add_points(order)
        # Thêm thống kê? Phải sửa hàm này, constructor và mọi chỗ tạo OrderService.


if __name__ == "__main__":
    service = OrderService(EmailSender(), Inventory(), Loyalty())
    service.place(Order("#1001", 2, 1_250_000))
    service.place(Order("#1002", 3, 860_000))
