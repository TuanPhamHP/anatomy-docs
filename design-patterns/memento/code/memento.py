"""Memento: lưu và khôi phục cấu hình phí giao hàng mà không để bên ngoài chạm vào trạng thái bên trong.

Chạy: python3 memento.py
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class Order:
    value: int
    km: int


SAMPLE = Order(250_000, 5)  # đơn mẫu dùng để xem phí thay đổi ra sao


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


# Memento: bản chụp niêm phong. Bên ngoài chỉ thấy nhãn, còn trạng thái bên trong
# chỉ PricingConfig mới mở ra dùng. Python không cấm được việc đọc _state, nên ta
# giữ quy ước: ngoài PricingConfig, không ai chạm vào nó.
class Snapshot:
    __slots__ = ("label", "_state")

    def __init__(self, label: str, state: tuple[int, int, int]) -> None:
        self.label = label
        self._state = state


# Originator: cấu hình phí giao hàng, tự biết cách chụp lại và khôi phục chính nó.
class PricingConfig:
    def __init__(self, base: int, per_km: int, free_from: int) -> None:
        self._base = base
        self._per_km = per_km
        self._free_from = free_from

    def update(self, base: int, per_km: int, free_from: int) -> None:
        self._base, self._per_km, self._free_from = base, per_km, free_from

    def bulk_update(self, factor: int) -> None:
        # Người gọi truyền 10 với ý "tăng 10%", nhưng hàm lại nhân thẳng mọi trường với 10.
        self._base *= factor
        self._per_km *= factor
        self._free_from *= factor

    def fee(self, order: Order) -> int:
        if order.value >= self._free_from:
            return 0
        return self._base + order.km * self._per_km

    def save(self, label: str) -> Snapshot:
        return Snapshot(label, (self._base, self._per_km, self._free_from))

    def restore(self, snapshot: Snapshot) -> None:
        self._base, self._per_km, self._free_from = snapshot._state

    def row(self) -> str:
        return f"{vnd(self._base):>9}{vnd(self._per_km):>9}{vnd(self._free_from):>13}"


# Caretaker: giữ các bản chụp theo nhãn nhưng không bao giờ mở chúng ra.
class History:
    def __init__(self) -> None:
        self._snapshots: dict[str, Snapshot] = {}

    def keep(self, snapshot: Snapshot) -> None:
        self._snapshots[snapshot.label] = snapshot

    def get(self, label: str) -> Snapshot:
        return self._snapshots[label]

    def labels(self) -> list[str]:
        return list(self._snapshots)


def show(step: str, config: PricingConfig) -> None:
    print(f"{step:<15}{config.row()}{vnd(config.fee(SAMPLE)):>10} ₫")


if __name__ == "__main__":
    config = PricingConfig(15_000, 4_000, 300_000)
    history = History()
    print(f"{'Bước':<15}{'Phí gốc':>9}{'Mỗi km':>9}{'Miễn phí từ':>13}{'Đơn mẫu':>12}")

    history.keep(config.save("v1"))
    show("lưu v1", config)

    config.update(20_000, 2_500, 500_000)
    history.keep(config.save("v2"))
    show("lưu v2", config)

    config.bulk_update(10)
    show("sửa hàng loạt", config)

    config.restore(history.get("v2"))
    show("khôi phục v2", config)

    config.restore(history.get("v1"))
    show("khôi phục v1", config)

    big = Order(600_000, 5)
    print(f"Đơn {vnd(big.value)} ₫ được miễn phí đúng như v1, phí {vnd(config.fee(big))} ₫.")
    print(f"History đang giữ {len(history.labels())} bản chụp: {', '.join(history.labels())}.")
