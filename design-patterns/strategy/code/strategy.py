"""Strategy: mỗi cách tính phí giao hàng là một lớp, trang thanh toán chỉ giữ một cái.

Chạy: python3 strategy.py
"""
import math
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Order:
    weight_kg: float
    distance_km: float
    subtotal: int  # VND


# Strategy: interface chung của mọi cách tính phí.
class ShippingStrategy(Protocol):
    name: str

    def quote(self, order: Order) -> int: ...


# Concrete strategies: mỗi lớp một quy tắc, không lớp nào biết lớp nào.
class WeightFee:
    name = "Theo cân nặng"

    def quote(self, order: Order) -> int:
        extra_kg = max(0, math.ceil(order.weight_kg - 1))  # phần lẻ tính tròn một kg
        return 15000 + extra_kg * 5000


class DistanceFee:
    name = "Theo khoảng cách"

    def quote(self, order: Order) -> int:
        if order.distance_km <= 5:
            return 15000
        if order.distance_km <= 15:
            return 25000
        return 35000


class FreeOverThreshold:
    name = "Miễn phí từ 300.000 ₫"

    def __init__(self, threshold: int = 300000, flat_fee: int = 20000) -> None:
        self._threshold = threshold
        self._flat_fee = flat_fee

    def quote(self, order: Order) -> int:
        return 0 if order.subtotal >= self._threshold else self._flat_fee


# Context: trang thanh toán. Nó chỉ biết ShippingStrategy, không biết quy tắc nào.
class Checkout:
    def __init__(self, strategy: ShippingStrategy) -> None:
        self._strategy = strategy

    def set_strategy(self, strategy: ShippingStrategy) -> None:
        self._strategy = strategy

    def shipping(self, order: Order) -> int:
        return self._strategy.quote(order)

    def total(self, order: Order) -> int:
        return order.subtotal + self.shipping(order)


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


if __name__ == "__main__":
    order = Order(weight_kg=3.5, distance_km=12, subtotal=450000)
    checkout = Checkout(WeightFee())
    for strategy in [WeightFee(), DistanceFee(), FreeOverThreshold()]:
        checkout.set_strategy(strategy)  # đổi cách tính lúc chạy, Checkout không đổi
        print(f"{strategy.name:<22} phí {vnd(checkout.shipping(order)):>6} ₫   tổng {vnd(checkout.total(order))} ₫")
