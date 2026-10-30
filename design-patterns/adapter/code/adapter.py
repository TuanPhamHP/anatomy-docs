"""Adapter: đưa giao dịch của nhiều ngân hàng về một interface chung.

Chạy: python3 adapter.py
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Protocol

VN = timezone(timedelta(hours=7))


# Target: dạng dữ liệu và interface mà hệ thống đối soát chờ đợi.
@dataclass(frozen=True)
class Transaction:
    amount: int  # VND, số nguyên
    reference: str
    booked_at: datetime


class TransactionSource(Protocol):
    def transactions(self) -> list[Transaction]: ...


# Adaptee: client của từng ngân hàng. Mình không sửa được code này.
class BankAClient:
    def fetch(self) -> list[dict]:
        return [{"amount": 1250000, "desc": "TT HD 1023", "time": "2026-10-30 09:12:05"}]


class BankBClient:
    def get_statement(self) -> list[dict]:
        return [{"creditAmount": "860.000", "remark": "TT HD 1024", "postingDate": "30/10/2026 10:40"}]


class BankCClient:
    def list_txns(self) -> list[dict]:
        return [{"txnAmt": "2400000.00", "narrative": "TT HD 1025", "valueDate": 1793333100000}]


# Adapter: mỗi ngân hàng một lớp. Lớp nào cũng chỉ làm một việc là chuyển đổi.
class BankAAdapter:
    def __init__(self, client: BankAClient) -> None:
        self._client = client

    def transactions(self) -> list[Transaction]:
        return [
            Transaction(
                amount=row["amount"],
                reference=row["desc"],
                booked_at=datetime.strptime(row["time"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=VN),
            )
            for row in self._client.fetch()
        ]


class BankBAdapter:
    def __init__(self, client: BankBClient) -> None:
        self._client = client

    def transactions(self) -> list[Transaction]:
        return [
            Transaction(
                amount=int(row["creditAmount"].replace(".", "")),  # "860.000" -> 860000
                reference=row["remark"],
                booked_at=datetime.strptime(row["postingDate"], "%d/%m/%Y %H:%M").replace(tzinfo=VN),
            )
            for row in self._client.get_statement()
        ]


class BankCAdapter:
    def __init__(self, client: BankCClient) -> None:
        self._client = client

    def transactions(self) -> list[Transaction]:
        return [
            Transaction(
                amount=int(Decimal(row["txnAmt"])),  # "2400000.00" -> 2400000
                reference=row["narrative"],
                booked_at=datetime.fromtimestamp(row["valueDate"] / 1000, tz=VN),
            )
            for row in self._client.list_txns()
        ]


# Client: hệ thống đối soát. Nó chỉ biết TransactionSource, không biết ngân hàng nào.
class Reconciler:
    def __init__(self, sources: list[TransactionSource]) -> None:
        self._sources = sources

    def all(self) -> list[Transaction]:
        return [t for source in self._sources for t in source.transactions()]

    def total(self) -> int:
        return sum(t.amount for t in self.all())


if __name__ == "__main__":
    reconciler = Reconciler([
        BankAAdapter(BankAClient()),
        BankBAdapter(BankBClient()),
        BankCAdapter(BankCClient()),
    ])
    for t in reconciler.all():
        print(f"{t.amount:>9,} ₫  {t.reference}  {t.booked_at.isoformat()}".replace(",", "."))
    print(f"Tổng: {reconciler.total():,} ₫".replace(",", "."))
