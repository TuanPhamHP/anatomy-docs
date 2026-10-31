"""Mediator: các bộ phận của luồng đơn hàng chỉ báo tin cho một trung gian.

Chạy: python3 mediator.py
"""
from __future__ import annotations


def vnd(amount: int) -> str:
    return f"{amount:,}".replace(",", ".") + " ₫"


class Department:
    """Mỗi bộ phận chỉ giữ một tham chiếu, tới mediator."""

    name = ""

    def __init__(self, mediator: OrderMediator) -> None:
        self.mediator = mediator


class Inventory(Department):
    name = "Kho"

    def report_out_of_stock(self, order: dict) -> None:
        self.mediator.notify(self, "out_of_stock", order)

    def release(self, order: dict) -> None:
        print(f"  Kho nhả {order['items']} sản phẩm đang giữ")


class Payments(Department):
    name = "Thanh toán"

    def charge(self, order: dict, ok: bool) -> None:
        self.mediator.notify(self, "paid" if ok else "payment_failed", order)

    def refund(self, order: dict) -> None:
        print(f"  Thanh toán hoàn {vnd(order['amount'])}")


class Shipping(Department):
    name = "Giao hàng"

    def cancel(self, order: dict) -> None:
        print("  Giao hàng huỷ chuyến giao")

    def book(self, order: dict) -> None:
        print(f"  Giao hàng đặt chuyến, mã vận đơn {order['waybill']}")


class CustomerCare(Department):
    name = "CSKH"

    def tell(self, order: dict, text: str) -> None:
        print(f"  CSKH báo khách {text}")


class Invoicing(Department):
    name = "Hoá đơn"

    def issue(self, order: dict) -> None:
        print(f"  Hoá đơn xuất hoá đơn {order['invoice']}")


class OrderMediator:
    """Nơi duy nhất biết ai phải làm gì khi một bộ phận báo tin."""

    def __init__(self) -> None:
        self.inventory = Inventory(self)
        self.payments = Payments(self)
        self.shipping = Shipping(self)
        self.care = CustomerCare(self)
        self.invoicing: Invoicing | None = None

    def lines(self) -> int:
        return 4 + (self.invoicing is not None)

    def notify(self, sender: Department, event: str, order: dict) -> None:
        said = {"out_of_stock": "hết hàng", "payment_failed": "thẻ bị từ chối", "paid": f"đã thu {vnd(order['amount'])}"}[event]
        print(f"Đơn {order['id']}: {sender.name} báo {said}")
        if event == "out_of_stock":
            self.payments.refund(order)
            self.shipping.cancel(order)
            self.care.tell(order, "đơn đã hết hàng")
        elif event == "payment_failed":
            self.inventory.release(order)
            self.care.tell(order, "thanh toán chưa thành công")
        elif event == "paid":
            self.shipping.book(order)
            self.invoicing.issue(order)


hub = OrderMediator()
hub.inventory.report_out_of_stock({"id": "DH-3107", "amount": 1250000, "items": 2})
hub.payments.charge({"id": "DH-3108", "amount": 540000, "items": 1}, ok=False)

# Bộ phận mới chỉ cần nối một dây tới mediator; không lớp cũ nào phải sửa.
hub.invoicing = Invoicing(hub)
print("Thêm bộ phận Hoá đơn: chỉ nối một dây tới mediator")
hub.payments.charge({"id": "DH-3109", "amount": 860000, "items": 1, "waybill": "VD-5512", "invoice": "HD-0821"}, ok=True)
print(f"Số dây: {hub.lines()}, mỗi bộ phận một dây tới mediator")
