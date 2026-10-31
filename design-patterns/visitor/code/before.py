"""Trước khi có Visitor: mỗi thao tác tự kiểm tra kiểu của từng dòng."""

from __future__ import annotations

from dataclasses import dataclass


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


@dataclass(frozen=True)
class ProductLine:
    sku: str
    qty: int
    price: int


@dataclass(frozen=True)
class ShippingLine:
    zone: str
    fee: int


@dataclass(frozen=True)
class DiscountLine:
    code: str
    value: int  # giảm giá là số âm


def vat_total(lines: list) -> int:
    total = 0
    for line in lines:
        if isinstance(line, ProductLine):
            total += line.qty * line.price * 10 // 100
        elif isinstance(line, ShippingLine):
            total += line.fee * 8 // 100
        elif isinstance(line, DiscountLine):
            total += line.value * 10 // 100
    return total


def export(lines: list) -> list[dict]:
    records = []
    for line in lines:
        if isinstance(line, ProductLine):
            records.append({"kind": "product", "sku": line.sku, "qty": line.qty, "amount": line.qty * line.price})
        elif isinstance(line, ShippingLine):
            records.append({"kind": "shipping", "zone": line.zone, "amount": line.fee})
        # Dòng giảm giá bị bỏ quên ở đây, và không có gì báo lỗi.
    return records


invoice = [ProductLine("SP-17", 2, 250_000), ShippingLine("noi-thanh", 30_000), DiscountLine("GIAM10", -50_000)]

print(f"Tổng VAT: {vnd(vat_total(invoice))} ₫")
records = export(invoice)
print(f"Đã xuất {len(records)} dòng, cộng lại {vnd(sum(r['amount'] for r in records))} ₫")
print("Tổng hoá đơn trước thuế: 480.000 ₫")
