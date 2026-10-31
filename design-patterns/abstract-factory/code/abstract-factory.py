"""Abstract Factory: mỗi nhà cung cấp thanh toán là một factory tạo ra trọn bộ ba thành phần đi cùng nhau.

Chạy: python3 abstract-factory.py
"""
import hashlib
import hmac
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Webhook:
    body: str
    signature: str


def sign(secret: bytes, body: str) -> str:
    return hmac.new(secret, body.encode(), hashlib.sha256).hexdigest()[:8]


def vnd(amount: int) -> str:
    return f"{amount:,}".replace(",", ".") + " ₫"


# Ba sản phẩm trừu tượng: những gì trang thanh toán cần, không gắn với nhà cung cấp nào.
class Gateway(Protocol):
    def charge(self, order: str, amount: int) -> Webhook: ...


class Refunds(Protocol):
    def refund(self, order: str, amount: int) -> str: ...


class WebhookVerifier(Protocol):
    def verify(self, hook: Webhook) -> bool: ...


# Họ A: ba lớp dùng chung khoá bí mật và kiểu chữ ký "a1:" của nhà cung cấp A.
SECRET_A = b"bi-mat-cua-a"


class GatewayA:
    def charge(self, order: str, amount: int) -> Webhook:
        body = f"{order}|{amount}"
        return Webhook(body, "a1:" + sign(SECRET_A, body))


class RefundsA:
    def refund(self, order: str, amount: int) -> str:
        return f"HT-A-{order[-4:]}"


class VerifierA:
    def verify(self, hook: Webhook) -> bool:
        return hook.signature == "a1:" + sign(SECRET_A, hook.body)


# Họ B: khoá và kiểu chữ ký "v2=" riêng của nhà cung cấp B.
SECRET_B = b"bi-mat-cua-b"


class GatewayB:
    def charge(self, order: str, amount: int) -> Webhook:
        body = f"{order}|{amount}"
        return Webhook(body, "v2=" + sign(SECRET_B, body))


class RefundsB:
    def refund(self, order: str, amount: int) -> str:
        return f"HT-B-{order[-4:]}"


class VerifierB:
    def verify(self, hook: Webhook) -> bool:
        return hook.signature == "v2=" + sign(SECRET_B, hook.body)


# Abstract Factory: một interface tạo ra cả bộ.
class PaymentKitFactory(Protocol):
    def create_gateway(self) -> Gateway: ...
    def create_refunds(self) -> Refunds: ...
    def create_verifier(self) -> WebhookVerifier: ...


# Mỗi factory cụ thể chỉ biết tạo đúng họ của mình, nên không thể trả về một bộ lẫn.
class ProviderAFactory:
    def create_gateway(self) -> Gateway:
        return GatewayA()

    def create_refunds(self) -> Refunds:
        return RefundsA()

    def create_verifier(self) -> WebhookVerifier:
        return VerifierA()


class ProviderBFactory:
    def create_gateway(self) -> Gateway:
        return GatewayB()

    def create_refunds(self) -> Refunds:
        return RefundsB()

    def create_verifier(self) -> WebhookVerifier:
        return VerifierB()


# Client: nhận một factory và không biết đó là nhà cung cấp nào.
class Checkout:
    def __init__(self, factory: PaymentKitFactory) -> None:
        self.gateway = factory.create_gateway()
        self.refunds = factory.create_refunds()
        self.verifier = factory.create_verifier()

    def pay_then_refund(self, order: str, amount: int, back: int) -> str:
        hook = self.gateway.charge(order, amount)
        status = "hợp lệ" if self.verifier.verify(hook) else "bị từ chối"
        code = self.refunds.refund(order, back)
        return f"thu {vnd(amount)}, webhook {hook.signature} {status}, hoàn {vnd(back)} mã {code}"


for name, factory in [("Bộ A", ProviderAFactory()), ("Bộ B", ProviderBFactory())]:
    print(f"{name}: {Checkout(factory).pay_then_refund('DH-3001', 1250000, 250000)}")
