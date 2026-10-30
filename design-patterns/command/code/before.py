"""Khi chưa có Command: mỗi request sửa thẳng tồn kho ngay lúc nó tới."""


class Inventory:
    def __init__(self, stock: int) -> None:
        self.stock = stock


inventory = Inventory(stock=100)


# Handler của API: nhận request là làm luôn, không để lại dấu vết gì.
def handle_receive(qty: int) -> None:
    inventory.stock += qty


def handle_ship(qty: int) -> None:
    if qty > inventory.stock:
        raise ValueError("Không đủ hàng")
    inventory.stock -= qty


if __name__ == "__main__":
    handle_receive(50)
    handle_ship(20)
    handle_ship(15)
    print(inventory.stock)
    # Lần xuất cuối bị nhập nhầm? Không có gì ghi lại
    # lần cuối là thao tác nào, với bao nhiêu hàng.
