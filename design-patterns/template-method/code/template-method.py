"""Template Method: một khung export cố định, lớp con chỉ viết phần định dạng.

Chạy: python3 template-method.py
"""
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class Order:
    id: str
    amount: int  # VND
    status: str  # "paid" hoặc "cancelled"


ORDERS = [
    Order("DH-101", 1250000, "paid"),
    Order("DH-102", 860000, "cancelled"),
    Order("DH-103", 2400000, "paid"),
    Order("DH-104", 540000, "paid"),
    Order("DH-105", 1100000, "cancelled"),
    Order("DH-106", 375000, "paid"),
]


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


class ReportExporter(ABC):
    extension = "txt"

    # Template method: thứ tự các bước cố định. Lớp con không ghi đè hàm này.
    def export(self) -> list[str]:
        orders = self.read_orders()
        rows = self.keep_valid(orders)
        lines = []
        header = self.header()
        if header is not None:
            lines.append(header)
        lines.extend(self.format_row(order) for order in rows)
        footer = self.footer(rows)
        if footer is not None:
            lines.append(footer)
        self.write(lines, orders, rows)
        return lines

    # Các bước dùng chung: viết một lần ở lớp cha.
    def read_orders(self) -> list[Order]:
        return ORDERS  # thực tế: truy vấn cơ sở dữ liệu

    def keep_valid(self, orders: list[Order]) -> list[Order]:
        return [order for order in orders if order.status != "cancelled"]

    def write(self, lines: list[str], orders: list[Order], rows: list[Order]) -> None:
        print(f"== report.{self.extension} ==")
        print("\n".join(lines))
        total = sum(order.amount for order in rows)
        print(f"-> đọc {len(orders)} đơn, bỏ {len(orders) - len(rows)} đơn huỷ, ghi {len(lines)} dòng, tổng {vnd(total)} ₫\n")

    # Bước bắt buộc: lớp con phải viết.
    @abstractmethod
    def format_row(self, order: Order) -> str: ...

    # Hook: mặc định không làm gì, lớp con ghi đè khi cần.
    def header(self) -> str | None:
        return None

    def footer(self, rows: list[Order]) -> str | None:
        return None


class CsvExporter(ReportExporter):
    extension = "csv"

    def header(self) -> str:
        return "ma_don,so_tien"

    def format_row(self, order: Order) -> str:
        return f"{order.id},{order.amount}"


class JsonLinesExporter(ReportExporter):
    extension = "jsonl"

    def format_row(self, order: Order) -> str:
        return json.dumps({"ma_don": order.id, "so_tien": order.amount}, separators=(",", ":"))


class FixedWidthExporter(ReportExporter):
    """File độ rộng cố định, kiểu file gửi ngân hàng: bản ghi đầu, chi tiết, bản ghi cuối."""

    def header(self) -> str:
        return "H20261030BAOCAO"

    def format_row(self, order: Order) -> str:
        return f"D{order.id:<8}{order.amount:012d}"

    def footer(self, rows: list[Order]) -> str:
        return f"T{len(rows):06d}{sum(order.amount for order in rows):012d}"


if __name__ == "__main__":
    for exporter in (CsvExporter(), JsonLinesExporter(), FixedWidthExporter()):
        exporter.export()
