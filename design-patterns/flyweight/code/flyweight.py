"""Flyweight: các dòng đơn hàng dùng chung một đối tượng cho mỗi sản phẩm.

Chạy: python3 flyweight.py
"""
from dataclasses import FrozenInstanceError, dataclass

# Kích thước ước tính, tính bằng byte.
PRODUCT_BYTES = 2000  # tên, mô tả dài và thông tin ảnh của một sản phẩm
LINE_BYTES = 64       # phần riêng của một dòng: số lượng, mã đơn...
REF_BYTES = 8         # một tham chiếu tới sản phẩm dùng chung

CATALOG = {
    "SP-001": ("Bình giữ nhiệt", "Thép không gỉ hai lớp, giữ nóng 12 giờ, dung tích 500 ml.", "sp-001.jpg 800x800"),
    "SP-002": ("Hộp trà", "Trà ô long Bảo Lộc, hộp thiếc 200 g.", "sp-002.jpg 800x800"),
    "SP-003": ("Ly sứ", "Ly sứ trắng men bóng, 350 ml, dùng được trong lò vi sóng.", "sp-003.jpg 800x800"),
}


def details(code: str) -> tuple[str, str, str]:
    """Đọc tên, mô tả và ảnh của một sản phẩm từ cơ sở dữ liệu."""
    return CATALOG.get(code, (f"Sản phẩm {code}", f"Mô tả chi tiết của {code}.", f"{code.lower()}.jpg 800x800"))


# Flyweight: phần nặng và không đổi của sản phẩm. frozen=True để không ai sửa được nó,
# vì sửa một đối tượng dùng chung là sửa luôn mọi dòng đang trỏ tới nó.
@dataclass(frozen=True)
class Product:
    code: str
    name: str
    description: str
    image: str


# Factory: mỗi mã sản phẩm chỉ tạo đúng một đối tượng, những lần sau trả lại đối tượng cũ.
class ProductCatalog:
    def __init__(self) -> None:
        self._made: dict[str, Product] = {}

    def get(self, code: str) -> Product:
        product = self._made.get(code)
        if product is None:
            product = Product(code, *details(code))
            self._made[code] = product
        return product

    def __len__(self) -> int:
        return len(self._made)


# Phần riêng của từng dòng: số lượng, cùng một tham chiếu tới sản phẩm dùng chung.
@dataclass
class OrderLine:
    product: Product
    quantity: int

    def label(self) -> str:
        return f"{self.product.name} x{self.quantity}"


def group(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def size(nbytes: int) -> str:
    value, unit = (nbytes / 1e6, "MB") if nbytes >= 1e6 else (nbytes / 1000, "KB")
    return f"{value:.1f} {unit}".replace(".", ",")


def summary(title: str, rows: list[tuple[str, int]]) -> list[OrderLine]:
    catalog = ProductCatalog()
    lines = [OrderLine(catalog.get(code), quantity) for code, quantity in rows]
    memory = len(catalog) * PRODUCT_BYTES + len(lines) * (LINE_BYTES + REF_BYTES)
    print(title)
    print(f"  đối tượng sản phẩm: {group(len(catalog))}")
    print(f"  bộ nhớ ước tính: {size(memory)}")
    return lines


BATCH = [("SP-001", 2), ("SP-002", 1), ("SP-001", 1), ("SP-003", 3), ("SP-002", 2), ("SP-001", 1),
         ("SP-003", 1), ("SP-002", 4), ("SP-001", 3), ("SP-002", 1), ("SP-003", 2), ("SP-001", 1)]
REPORT = [(f"SP-{i % 300 + 1:03d}", i % 5 + 1) for i in range(100_000)]

lines = summary("Lô 12 dòng trong hình:", BATCH)
summary("Cả báo cáo 100.000 dòng:", REPORT)

shared = lines[1].product is lines[4].product
print(f"Dòng 2 và dòng 5 dùng chung một đối tượng sản phẩm: {'có' if shared else 'không'}")
uses_b = [str(i + 1) for i, line in enumerate(lines) if line.product.code == "SP-002"]
print(f"Các dòng dùng sản phẩm B: {', '.join(uses_b)}")
try:
    lines[1].product.name = "Hộp trà (giảm giá)"  # chỉ muốn đổi cho riêng dòng 2
except FrozenInstanceError:
    print("Thử sửa tên sản phẩm B cho riêng dòng 2: bị chặn, vì sản phẩm dùng chung là bất biến")
