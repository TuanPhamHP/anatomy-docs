"""Command: gói mỗi thao tác kho thành một đối tượng để xếp hàng, ghi lịch sử và hoàn tác.

Chạy: python3 command.py
"""
from collections import deque
from typing import Protocol


# Receiver: kho hàng. Nó chỉ biết cộng và trừ tồn kho, không biết gì về lệnh.
class Inventory:
    def __init__(self, stock: int) -> None:
        self.stock = stock

    def add(self, qty: int) -> None:
        self.stock += qty

    def remove(self, qty: int) -> None:
        if qty > self.stock:
            raise ValueError(f"Không đủ hàng: còn {self.stock}, cần {qty}")
        self.stock -= qty


# Command: mỗi lệnh biết cách chạy và cách đảo ngược chính nó.
class Command(Protocol):
    name: str

    def execute(self) -> None: ...

    def undo(self) -> None: ...


class ReceiveStock:
    def __init__(self, inventory: Inventory, qty: int) -> None:
        self.inventory = inventory
        self.qty = qty
        self.name = f"Nhập {qty}"

    def execute(self) -> None:
        self.inventory.add(self.qty)

    def undo(self) -> None:
        self.inventory.remove(self.qty)


class ShipStock:
    def __init__(self, inventory: Inventory, qty: int) -> None:
        self.inventory = inventory
        self.qty = qty
        self.name = f"Xuất {qty}"

    def execute(self) -> None:
        self.inventory.remove(self.qty)

    def undo(self) -> None:
        self.inventory.add(self.qty)


# Invoker: chạy lệnh theo hàng đợi và giữ lịch sử. Nó không biết bên trong lệnh làm gì.
class CommandRunner:
    def __init__(self) -> None:
        self.queue: deque[Command] = deque()
        self.history: list[Command] = []

    def submit(self, command: Command) -> None:
        self.queue.append(command)

    def run_next(self) -> Command:
        command = self.queue.popleft()
        command.execute()
        self.history.append(command)  # chỉ ghi vào lịch sử khi đã chạy xong
        return command

    def undo(self) -> Command:
        command = self.history.pop()  # lệnh chạy sau cùng được hoàn tác trước
        command.undo()
        return command


if __name__ == "__main__":
    inventory = Inventory(stock=100)
    runner = CommandRunner()

    # Client: tạo lệnh và xếp vào hàng đợi. Lúc này chưa có gì chạy.
    for command in [
        ReceiveStock(inventory, 50),
        ShipStock(inventory, 20),
        ShipStock(inventory, 15),
    ]:
        runner.submit(command)
    print(f"Đang chờ {len(runner.queue)} lệnh, tồn kho {inventory.stock}")

    while runner.queue:
        before = inventory.stock
        command = runner.run_next()
        print(f"Chạy      {command.name}: {before} → {inventory.stock}")

    before = inventory.stock
    command = runner.undo()
    print(f"Hoàn tác  {command.name}: {before} → {inventory.stock}")
    print("Lịch sử:", ", ".join(c.name for c in runner.history))
