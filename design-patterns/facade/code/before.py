"""Khi chưa có Facade: mỗi nơi đặt hàng tự gọi lần lượt cả năm hệ con.

Chạy: python3 before.py   (năm hệ con ở cuối file, giống hệt bản facade.py)
"""


# Trang web: viết đủ, có trả hàng về kho khi thanh toán lỗi.
def web_checkout(order_id: str, sku: str, qty: int, price: int, card: str, email: str) -> None:
    inventory.reserve(sku, qty)
    try:
        payments.charge(card, qty * price)
    except PaymentDeclined:
        inventory.release(sku, qty)
        raise
    shipping.book(order_id)
    invoices.issue(order_id, qty * price)
    notifier.send(email, f"Đơn {order_id} đã được đặt")


# App di động: chép lại cùng chuỗi đó, nhưng quên trả hàng khi thanh toán lỗi.
def mobile_checkout(order_id: str, sku: str, qty: int, price: int, card: str, email: str) -> None:
    inventory.reserve(sku, qty)
    payments.charge(card, qty * price)
    shipping.book(order_id)
    invoices.issue(order_id, qty * price)
    notifier.send(email, f"Đơn {order_id} đã được đặt")


# Công cụ admin có bản chép thứ ba, và cứ thế lệch dần.


# Năm hệ con, rút gọn.
class PaymentDeclined(Exception):
    pass


class Inventory:
    def __init__(self, stock: dict[str, int]) -> None:
        self.stock = dict(stock)

    def reserve(self, sku: str, qty: int) -> None:
        self.stock[sku] -= qty

    def release(self, sku: str, qty: int) -> None:
        self.stock[sku] += qty


class Payments:
    def charge(self, card: str, amount: int) -> str:
        if card.endswith("0002"):
            raise PaymentDeclined(card)
        return "GD-5521"


class Shipping:
    def book(self, order_id: str) -> str:
        return "VD-3308"


class Invoices:
    def issue(self, order_id: str, amount: int) -> str:
        return "HD-0457"


class Notifier:
    def send(self, email: str, text: str) -> None:
        pass


inventory, payments, shipping, invoices, notifier = Inventory({"SP-17": 12}), Payments(), Shipping(), Invoices(), Notifier()

if __name__ == "__main__":
    web_checkout("DH-2041", "SP-17", 2, 485000, "4242", "khach@example.com")
    print(f"Sau DH-2041 (web): tồn {inventory.stock['SP-17']}")
    try:
        mobile_checkout("DH-2042", "SP-17", 3, 485000, "0002", "khach@example.com")
    except PaymentDeclined:
        print("DH-2042 (app): thẻ bị từ chối")
    print(f"Tồn kho SP-17: {inventory.stock['SP-17']}, đúng ra phải là 10")
