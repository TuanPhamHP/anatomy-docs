"""Trước khi có Mediator: các bộ phận của luồng đơn hàng gọi thẳng vào nhau.

Chạy: python3 before.py
"""


def vnd(amount: int) -> str:
    return f"{amount:,}".replace(",", ".") + " ₫"


class Shipping:
    def cancel(self, order: dict) -> None:
        print("  Giao hàng huỷ chuyến giao")


class CustomerCare:
    def tell(self, order: dict, text: str) -> None:
        print(f"  CSKH báo khách {text}")


class Payments:
    def __init__(self) -> None:
        # Thanh toán phải biết Kho và CSKH để tự gọi họ khi thẻ bị từ chối.
        self.inventory: "Inventory | None" = None
        self.care: CustomerCare | None = None

    def refund(self, order: dict) -> None:
        print(f"  Thanh toán hoàn {vnd(order['amount'])}")

    def charge(self, order: dict, ok: bool) -> None:
        if not ok:
            print(f"Đơn {order['id']}: Thanh toán báo thẻ bị từ chối")
            self.inventory.release(order)
            self.care.tell(order, "thanh toán chưa thành công")


class Inventory:
    def __init__(self) -> None:
        # Kho phải biết ba bộ phận khác chỉ để báo tin hết hàng.
        self.payments: Payments | None = None
        self.shipping: Shipping | None = None
        self.care: CustomerCare | None = None

    def release(self, order: dict) -> None:
        print(f"  Kho nhả {order['items']} sản phẩm đang giữ")

    def report_out_of_stock(self, order: dict) -> None:
        print(f"Đơn {order['id']}: Kho báo hết hàng")
        self.payments.refund(order)
        self.shipping.cancel(order)
        self.care.tell(order, "đơn đã hết hàng")


inventory, payments, shipping, care = Inventory(), Payments(), Shipping(), CustomerCare()
# Mỗi quy tắc mới lại thêm một sợi dây nối thẳng giữa hai lớp.
inventory.payments, inventory.shipping, inventory.care = payments, shipping, care
payments.inventory, payments.care = inventory, care

inventory.report_out_of_stock({"id": "DH-3107", "amount": 1250000, "items": 2})
payments.charge({"id": "DH-3108", "amount": 540000, "items": 1}, ok=False)

parts = 4
print("Kho giữ tham chiếu tới 3 bộ phận, Thanh toán tới 2 bộ phận")
print(f"Nối thẳng {parts} bộ phận với nhau cần {parts * (parts - 1) // 2} dây, thêm bộ phận thứ năm cần thêm {parts} dây")
