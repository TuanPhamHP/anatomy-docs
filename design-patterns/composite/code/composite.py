"""Composite: một kiện hàng là một món, hoặc một hộp chứa món hàng và hộp khác.

Chạy: python3 composite.py
"""
from abc import ABC, abstractmethod


def kg(grams: int) -> str:
    return f"{grams / 1000:.1f} kg".replace(".", ",")


# Component: thứ gì đặt lên cân cũng trả lời được hai câu hỏi này.
class Parcel(ABC):
    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def weight(self) -> int: ...  # gam

    @abstractmethod
    def lines(self, depth: int = 0) -> list[str]: ...


# Leaf: một món hàng, không chứa gì bên trong.
class Item(Parcel):
    def __init__(self, name: str, grams: int) -> None:
        super().__init__(name)
        self.grams = grams

    def weight(self) -> int:
        return self.grams

    def lines(self, depth: int = 0) -> list[str]:
        return [f"{'  ' * depth}{self.name}: {kg(self.weight())}"]


# Composite: một hộp. Nó cũng là Parcel, và chứa các Parcel khác: món hàng hay hộp đều được.
class Box(Parcel):
    def __init__(self, name: str, tare: int) -> None:
        super().__init__(name)
        self.tare = tare  # khối lượng của vỏ hộp
        self.children: list[Parcel] = []

    def add(self, *parcels: Parcel) -> "Box":
        self.children.extend(parcels)
        return self

    def weight(self) -> int:
        return self.tare + sum(child.weight() for child in self.children)

    def lines(self, depth: int = 0) -> list[str]:
        head = f"{'  ' * depth}{self.name}: {kg(self.weight())} (vỏ {kg(self.tare)})"
        return [head] + [line for child in self.children for line in child.lines(depth + 1)]


# Client: cái cân. Nó chỉ gọi weight(), không hỏi thứ trên bàn cân là món hàng hay hộp.
def weigh(parcel: Parcel) -> str:
    return f"{parcel.name}: {kg(parcel.weight())}"


def small_box() -> Box:
    return Box("Hộp nhỏ", 300).add(Item("Bình giữ nhiệt", 600), Item("Hộp trà", 500))


if __name__ == "__main__":
    vase = Item("Bình gốm", 1500)
    small = small_box()
    crate = Box("Thùng lớn", 900).add(small_box(), Item("Sách", 1200), Item("Bình gốm", 1500))

    for parcel in (vase, small, crate):
        print(weigh(parcel))
    print()
    print("\n".join(crate.lines()))
