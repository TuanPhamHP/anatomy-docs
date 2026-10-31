"""Visitor: thêm thao tác mới cho các dòng hoá đơn mà không sửa lớp của dòng."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Protocol


def vnd(n: int) -> str:
    """500000 thành "500.000", -5000 thành "-5.000"."""
    return f"{n:,}".replace(",", ".")


# Các dòng hoá đơn chỉ giữ dữ liệu của mình và một phương thức accept.
# accept gọi đúng phương thức visit dành cho loại dòng này.
@dataclass(frozen=True)
class ProductLine:
    sku: str
    qty: int
    price: int

    def accept(self, visitor: LineVisitor) -> None:
        visitor.visit_product(self)


@dataclass(frozen=True)
class ShippingLine:
    zone: str
    fee: int

    def accept(self, visitor: LineVisitor) -> None:
        visitor.visit_shipping(self)


@dataclass(frozen=True)
class DiscountLine:
    code: str
    value: int  # giảm giá là số âm

    def accept(self, visitor: LineVisitor) -> None:
        visitor.visit_discount(self)


class LineVisitor(Protocol):
    def visit_product(self, line: ProductLine) -> None: ...
    def visit_shipping(self, line: ShippingLine) -> None: ...
    def visit_discount(self, line: DiscountLine) -> None: ...


class VatVisitor:
    """Hàng hoá chịu thuế 10%, phí giao hàng 8%, giảm giá bớt thuế theo mức của hàng."""

    def __init__(self) -> None:
        self.total = 0
        self.rows: list[str] = []

    def _add(self, label: str, base: int, rate: int) -> None:
        vat = base * rate // 100
        self.total += vat
        self.rows.append(f"  {label:<10}{vnd(base):>9} ₫  thuế {rate:>2}%  {vnd(vat):>7} ₫")

    def visit_product(self, line: ProductLine) -> None:
        self._add("Sản phẩm", line.qty * line.price, 10)

    def visit_shipping(self, line: ShippingLine) -> None:
        self._add("Giao hàng", line.fee, 8)

    def visit_discount(self, line: DiscountLine) -> None:
        self._add("Giảm giá", line.value, 10)


class ExportVisitor:
    """Mỗi dòng thành một bản ghi JSON cho phần mềm kế toán."""

    def __init__(self) -> None:
        self.records: list[dict] = []

    def visit_product(self, line: ProductLine) -> None:
        self.records.append({"kind": "product", "sku": line.sku, "qty": line.qty, "amount": line.qty * line.price})

    def visit_shipping(self, line: ShippingLine) -> None:
        self.records.append({"kind": "shipping", "zone": line.zone, "amount": line.fee})

    def visit_discount(self, line: DiscountLine) -> None:
        self.records.append({"kind": "discount", "code": line.code, "amount": line.value})


invoice = [ProductLine("SP-17", 2, 250_000), ShippingLine("noi-thanh", 30_000), DiscountLine("GIAM10", -50_000)]

vat = VatVisitor()
for line in invoice:
    line.accept(vat)
print("Tính VAT bằng VatVisitor:")
print("\n".join(vat.rows))
print(f"Tổng VAT: {vnd(vat.total)} ₫")

export = ExportVisitor()
for line in invoice:
    line.accept(export)
print()
print("Xuất cho kế toán bằng ExportVisitor:")
for record in export.records:
    print("  " + json.dumps(record, ensure_ascii=False, separators=(",", ":")))
print(f"Đã xuất {len(export.records)} dòng, cộng lại {vnd(sum(r['amount'] for r in export.records))} ₫")


# Một loại dòng mới. Chưa visitor nào có visit_gift_wrap, nên lỗi lộ ra ngay ở lần chạy đầu.
@dataclass(frozen=True)
class GiftWrapLine:
    fee: int

    def accept(self, visitor: LineVisitor) -> None:
        visitor.visit_gift_wrap(self)  # type: ignore[attr-defined]


print()
try:
    GiftWrapLine(15_000).accept(vat)
except AttributeError:
    print(f"Thêm GiftWrapLine: {type(vat).__name__} chưa có phương thức cho dòng gói quà")
