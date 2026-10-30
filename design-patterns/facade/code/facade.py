"""Facade: một hàm đặt hàng che cả năm hệ con phía sau.

Chạy: python3 facade.py
"""
from dataclasses import dataclass


def vnd(n: int) -> str:
    return f"{n:,} ₫".replace(",", ".")


@dataclass(frozen=True)
class Cart:
    order_id: str
    sku: str
    qty: int
    price: int
    card: str
    email: str

    @property
    def total(self) -> int:
        return self.qty * self.price


class PaymentDeclined(Exception):
    pass


# Năm hệ con. Mỗi hệ con vẫn dùng riêng được; facade không giấu chúng đi.
class Inventory:
    def __init__(self, stock: dict[str, int]) -> None:
        self.stock = dict(stock)

    def reserve(self, sku: str, qty: int) -> None:
        before = self.stock[sku]
        self.stock[sku] -= qty
        print(f"  Kho: giữ {qty} × {sku}, tồn {before} → {self.stock[sku]}")

    def release(self, sku: str, qty: int) -> None:
        self.stock[sku] += qty
        print(f"  Kho: trả lại {qty} × {sku}, tồn {self.stock[sku]}")


class Payments:
    def __init__(self) -> None:
        self._next = 5521

    def charge(self, card: str, amount: int) -> str:
        if card.endswith("0002"):  # thẻ thử nghiệm luôn bị từ chối
            print(f"  Thanh toán: thẻ ...{card} bị từ chối")
            raise PaymentDeclined(card)
        txn = f"GD-{self._next}"
        self._next += 1
        print(f"  Thanh toán: thu {vnd(amount)}, mã {txn}")
        return txn


class Shipping:
    def book(self, order_id: str) -> str:
        print(f"  Vận chuyển: vận đơn VD-3308 cho {order_id}")
        return "VD-3308"


class Invoices:
    def issue(self, order_id: str, amount: int) -> str:
        print(f"  Hoá đơn: HD-0457, {vnd(amount)}")
        return "HD-0457"


class Notifier:
    def send(self, email: str, text: str) -> None:
        print(f"  Thông báo: gửi {email}: {text}")


@dataclass(frozen=True)
class OrderResult:
    order_id: str
    txn: str
    tracking: str
    invoice: str


# Facade: một cửa cho việc đặt hàng. Thứ tự gọi và cách xử lý lỗi nằm ở một chỗ.
class CheckoutFacade:
    def __init__(self, inventory: Inventory, payments: Payments, shipping: Shipping,
                 invoices: Invoices, notifier: Notifier) -> None:
        self._inventory = inventory
        self._payments = payments
        self._shipping = shipping
        self._invoices = invoices
        self._notifier = notifier

    def place_order(self, cart: Cart) -> OrderResult:
        self._inventory.reserve(cart.sku, cart.qty)
        try:
            txn = self._payments.charge(cart.card, cart.total)
        except PaymentDeclined:
            self._inventory.release(cart.sku, cart.qty)  # mọi client đều được trả hàng về kho
            raise
        tracking = self._shipping.book(cart.order_id)
        invoice = self._invoices.issue(cart.order_id, cart.total)
        self._notifier.send(cart.email, f"Đơn {cart.order_id} đã được đặt")
        return OrderResult(cart.order_id, txn, tracking, invoice)


if __name__ == "__main__":
    inventory = Inventory({"SP-17": 12})
    checkout = CheckoutFacade(inventory, Payments(), Shipping(), Invoices(), Notifier())

    # Client (web, app di động, công cụ admin) chỉ gọi một hàm.
    print("place_order(DH-2041)")
    result = checkout.place_order(Cart("DH-2041", "SP-17", 2, 485000, "4242", "khach@example.com"))
    print(f"→ {result.order_id}: {result.txn}, {result.tracking}, {result.invoice}")

    print("place_order(DH-2042)")
    try:
        checkout.place_order(Cart("DH-2042", "SP-17", 3, 485000, "0002", "khach@example.com"))
    except PaymentDeclined:
        print("→ DH-2042 không đặt được")

    print(f"Tồn kho SP-17: {inventory.stock['SP-17']}")
