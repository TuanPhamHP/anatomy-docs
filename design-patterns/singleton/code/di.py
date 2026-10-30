"""Cách thường dùng hơn Singleton: tạo đúng một pool ở composition root rồi truyền vào.

Chạy: python3 di.py
"""
from typing import Protocol


class Database:
    MAX_CONNECTIONS = 20

    def __init__(self) -> None:
        self.used = 0

    def open(self, count: int) -> None:
        if self.used + count > self.MAX_CONNECTIONS:
            raise RuntimeError(f"hết cổng (đang dùng {self.used}/{self.MAX_CONNECTIONS}, cần thêm {count})")
        self.used += count


class Pool(Protocol):
    id: int

    def query(self, sql: str) -> list[dict]: ...


class ConnectionPool:
    created = 0

    def __init__(self, db: Database, size: int = 10) -> None:
        ConnectionPool.created += 1
        self.id = ConnectionPool.created
        db.open(size)

    def query(self, sql: str) -> list[dict]:
        return []


# Service không tự đi tìm pool: nó nhận pool qua constructor.
class OrderService:
    def __init__(self, pool: Pool) -> None:
        self.pool = pool


class PaymentService:
    def __init__(self, pool: Pool) -> None:
        self.pool = pool


class ReportService:
    def __init__(self, pool: Pool) -> None:
        self.pool = pool

    def daily(self) -> int:
        return len(self.pool.query("SELECT * FROM orders WHERE day = today"))


# Pool giả cho test: không mở kết nối nào.
class FakePool:
    id = 0

    def query(self, sql: str) -> list[dict]:
        return [{"id": 1}, {"id": 2}]


if __name__ == "__main__":
    # Composition root: chỗ duy nhất quyết định "chỉ có một pool".
    db = Database()
    pool = ConnectionPool(db)
    services = [
        ("Đơn hàng", OrderService(pool)),
        ("Thanh toán", PaymentService(pool)),
        ("Báo cáo", ReportService(pool)),
    ]
    for name, service in services:
        print(f"{name:<10} -> pool #{service.pool.id}, cổng đang dùng {db.used}/{Database.MAX_CONNECTIONS}")
    same = all(service.pool is pool for _, service in services)
    print(f"Đã tạo {ConnectionPool.created} pool cho 3 service; cùng một object: {'có' if same else 'không'}")
    print(f"Test với pool giả: ReportService đọc {ReportService(FakePool()).daily()} dòng, không mở kết nối nào")
