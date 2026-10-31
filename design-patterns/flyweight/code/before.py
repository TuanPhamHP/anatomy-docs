"""Khi chưa có Flyweight: mỗi dòng đơn hàng tự giữ một bản sao thông tin sản phẩm.

Chạy: python3 before.py
"""
from dataclasses import dataclass

# Kích thước ước tính, tính bằng byte.
PRODUCT_BYTES = 2000  # tên, mô tả dài và thông tin ảnh của một sản phẩm
LINE_BYTES = 64       # phần riêng của một dòng: số lượng, mã đơn...

CATALOG = {
    "SP-001": ("Bình giữ nhiệt", "Thép không gỉ hai lớp, giữ nóng 12 giờ, dung tích 500 ml.", "sp-001.jpg 800x800"),
    "SP-002": ("Hộp trà", "Trà ô long Bảo Lộc, hộp thiếc 200 g.", "sp-002.jpg 800x800"),
    "SP-003": ("Ly sứ", "Ly sứ trắng men bóng, 350 ml, dùng được trong lò vi sóng.", "sp-003.jpg 800x800"),
}


def details(code: str) -> tuple[str, str, str]:
    """Đọc tên, mô tả và ảnh của một sản phẩm từ cơ sở dữ liệu."""
    return CATALOG.get(code, (f"Sản phẩm {code}", f"Mô tả chi tiết của {code}.", f"{code.lower()}.jpg 800x800"))


class ProductInfo:
    made = 0  # đếm số đối tượng sản phẩm đã tạo

    def __init__(self, code: str) -> None:
        ProductInfo.made += 1
        self.code = code
        self.name, self.description, self.image = details(code)


@dataclass
class OrderLine:
    product: ProductInfo  # bản sao riêng của dòng này
    quantity: int


def load(rows: list[tuple[str, int]]) -> list[OrderLine]:
    # Dòng nào cũng tạo một ProductInfo mới, kể cả khi sản phẩm đã có ở dòng trước.
    return [OrderLine(ProductInfo(code), quantity) for code, quantity in rows]


def group(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def size(nbytes: int) -> str:
    value, unit = (nbytes / 1e6, "MB") if nbytes >= 1e6 else (nbytes / 1000, "KB")
    return f"{value:.1f} {unit}".replace(".", ",")


def summary(title: str, rows: list[tuple[str, int]]) -> None:
    ProductInfo.made = 0
    lines = load(rows)
    memory = ProductInfo.made * PRODUCT_BYTES + len(lines) * LINE_BYTES
    print(title)
    print(f"  đối tượng sản phẩm: {group(ProductInfo.made)}")
    print(f"  bộ nhớ ước tính: {size(memory)}")


BATCH = [("SP-001", 2), ("SP-002", 1), ("SP-001", 1), ("SP-003", 3), ("SP-002", 2), ("SP-001", 1),
         ("SP-003", 1), ("SP-002", 4), ("SP-001", 3), ("SP-002", 1), ("SP-003", 2), ("SP-001", 1)]
REPORT = [(f"SP-{i % 300 + 1:03d}", i % 5 + 1) for i in range(100_000)]

summary("Lô 12 dòng trong hình:", BATCH)
summary("Cả báo cáo 100.000 dòng:", REPORT)
