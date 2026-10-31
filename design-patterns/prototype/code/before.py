"""Trước khi có Prototype: chép tay từng trường của gói mẫu sang hợp đồng mới."""

from dataclasses import dataclass, field


@dataclass
class Item:
    name: str
    price: int


@dataclass
class ServicePackage:
    name: str
    customer: str
    items: list[Item]
    terms: dict[str, str] = field(default_factory=dict)

    def total(self) -> int:
        return sum(item.price for item in self.items)


def vnd(amount: int) -> str:
    return f"{amount:,}".replace(",", ".") + " ₫"


def load_standard() -> ServicePackage:
    # Gói mẫu do phòng kinh doanh cấu hình, thường được đọc từ cơ sở dữ liệu.
    return ServicePackage(
        name="Bảo trì tiêu chuẩn",
        customer="",
        items=[
            Item("Kiểm tra định kỳ", 2_400_000),
            Item("Vệ sinh thiết bị", 1_200_000),
            Item("Hỗ trợ từ xa", 1_800_000),
        ],
        terms={"thanh toán": "30 ngày", "bảo hành": "12 tháng"},
    )


standard = load_standard()

# Mỗi hợp đồng mới lại chép tay từng trường. Trường terms được thêm vào sau nên
# chỗ này quên chép, còn items chỉ chép tham chiếu tới danh sách của gói mẫu.
contract = ServicePackage(name=standard.name, customer="An Phát", items=standard.items)
contract.items.append(Item("Hỗ trợ ngoài giờ", 1_500_000))

print(f"Hợp đồng {contract.customer}: {len(contract.items)} hạng mục, {vnd(contract.total())}, điều khoản: {contract.terms or 'thiếu'}")
print(f"Gói mẫu: {len(standard.items)} hạng mục, {vnd(standard.total())}")
