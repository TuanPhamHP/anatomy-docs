"""Prototype: tạo hợp đồng mới bằng cách sao chép một gói mẫu đã cấu hình sẵn."""

import copy
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

    def clone(self) -> "ServicePackage":
        # Chép sâu, để bản sao có danh sách hạng mục và điều khoản của riêng nó.
        return copy.deepcopy(self)


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


# Kho mẫu: mỗi loại gói có một bản mẫu đã cấu hình sẵn.
PROTOTYPES = {"tieu-chuan": load_standard()}


def new_contract(kind: str, customer: str) -> ServicePackage:
    contract = PROTOTYPES[kind].clone()
    contract.customer = customer
    return contract


def show(label: str, package: ServicePackage) -> None:
    print(f"  {label}: khách {package.customer or 'chưa có'}, {len(package.items)} hạng mục, {vnd(package.total())}")


standard = PROTOTYPES["tieu-chuan"]
print(f"Gói mẫu {standard.name}: {len(standard.items)} hạng mục, {vnd(standard.total())}")

an_phat = new_contract("tieu-chuan", "An Phát")
an_phat.items.append(Item("Hỗ trợ ngoài giờ", 1_500_000))
print("Sao chép sâu, rồi tuỳ chỉnh cho An Phát:")
show("Bản sao", an_phat)
show("Gói mẫu", standard)

# Cùng việc ấy với một bản sao nông, làm trên một gói mẫu khác để kho mẫu không hỏng.
trap = load_standard()
shallow = copy.copy(trap)
shallow.customer = "An Phát"
shallow.items.append(Item("Hỗ trợ ngoài giờ", 1_500_000))
print("Nếu chỉ sao chép nông:")
show("Bản sao", shallow)
show("Gói mẫu", trap)
