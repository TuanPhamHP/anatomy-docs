"""Khi chưa có Strategy: mọi cách tính phí giao hàng nằm chung trong hàm thanh toán."""
import math


def shipping_fee(rule: str, order: dict) -> int:
    if rule == "weight":
        return 15000 + max(0, math.ceil(order["weight_kg"] - 1)) * 5000
    elif rule == "distance":
        km = order["distance_km"]
        return 15000 if km <= 5 else 25000 if km <= 15 else 35000
    elif rule == "free_over_300k":
        return 0 if order["subtotal"] >= 300000 else 20000
    else:
        raise ValueError(f"Chưa hỗ trợ cách tính {rule}")  # thêm cách tính nào cũng phải sửa hàm này


def checkout_total(rule: str, order: dict) -> int:
    return order["subtotal"] + shipping_fee(rule, order)


if __name__ == "__main__":
    order = {"weight_kg": 3.5, "distance_km": 12, "subtotal": 450000}
    for rule in ["weight", "distance", "free_over_300k"]:
        print(rule, shipping_fee(rule, order), checkout_total(rule, order))
