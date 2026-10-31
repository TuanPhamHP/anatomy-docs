"""Khi chưa có Memento: công cụ admin tự với vào các trường riêng của cấu hình để sao lưu."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Order:
    value: int
    km: int


SAMPLE = Order(250_000, 5)


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


class PricingConfig:
    def __init__(self, base: int, per_km: int, free_from: int) -> None:
        self._base = base
        self._per_km = per_km
        self._free_from = free_from  # trường này được thêm sau, khi có chương trình miễn phí

    def update(self, base: int, per_km: int, free_from: int) -> None:
        self._base, self._per_km, self._free_from = base, per_km, free_from

    def bulk_update(self, factor: int) -> None:
        self._base *= factor
        self._per_km *= factor
        self._free_from *= factor

    def fee(self, order: Order) -> int:
        if order.value >= self._free_from:
            return 0
        return self._base + order.km * self._per_km

    def row(self) -> str:
        return f"{vnd(self._base):>9}{vnd(self._per_km):>9}{vnd(self._free_from):>13}"


class AdminTool:
    def __init__(self, config: PricingConfig) -> None:
        self.config = config
        self.backups: dict[str, dict[str, int]] = {}

    def backup(self, label: str) -> None:
        # Chép tay từng trường riêng. Đoạn này viết từ trước khi có _free_from, nên quên mất nó.
        self.backups[label] = {"base": self.config._base, "per_km": self.config._per_km}

    def restore(self, label: str) -> None:
        saved = self.backups[label]
        self.config._base = saved["base"]
        self.config._per_km = saved["per_km"]


def show(step: str, config: PricingConfig) -> None:
    print(f"{step:<15}{config.row()}{vnd(config.fee(SAMPLE)):>10} ₫")


if __name__ == "__main__":
    config = PricingConfig(15_000, 4_000, 300_000)
    admin = AdminTool(config)
    print(f"{'Bước':<15}{'Phí gốc':>9}{'Mỗi km':>9}{'Miễn phí từ':>13}{'Đơn mẫu':>12}")

    admin.backup("v1")
    show("lưu v1", config)

    config.update(20_000, 2_500, 500_000)
    admin.backup("v2")
    show("lưu v2", config)

    config.bulk_update(10)
    show("sửa hàng loạt", config)

    admin.restore("v2")
    show("khôi phục v2", config)

    admin.restore("v1")
    show("khôi phục v1", config)

    big = Order(600_000, 5)
    print(f"Đơn {vnd(big.value)} ₫ lẽ ra được miễn phí theo v1, nhưng vẫn bị tính {vnd(config.fee(big))} ₫.")
