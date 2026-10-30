"""Khi chưa có Singleton: mỗi service tự tạo pool kết nối của riêng nó.

Chạy: python3 before.py
"""


class Database:
    MAX_CONNECTIONS = 20

    def __init__(self) -> None:
        self.used = 0

    def open(self, count: int) -> None:
        if self.used + count > self.MAX_CONNECTIONS:
            raise RuntimeError(f"hết cổng (đang dùng {self.used}/{self.MAX_CONNECTIONS}, cần thêm {count})")
        self.used += count


class ConnectionPool:
    created = 0

    def __init__(self, db: Database, size: int = 10) -> None:
        ConnectionPool.created += 1
        self.id = ConnectionPool.created
        db.open(size)  # mở sẵn `size` kết nối tới cơ sở dữ liệu


DB = Database()


# Mỗi service tự tạo pool: ba pool, cần 30 kết nối trong khi DB chỉ cho 20.
class OrderService:
    def __init__(self) -> None:
        self.pool = ConnectionPool(DB)


class PaymentService:
    def __init__(self) -> None:
        self.pool = ConnectionPool(DB)


class ReportService:
    def __init__(self) -> None:
        self.pool = ConnectionPool(DB)


if __name__ == "__main__":
    services = [("Đơn hàng", OrderService), ("Thanh toán", PaymentService), ("Báo cáo", ReportService)]
    for name, service in services:
        try:
            pool = service().pool
            print(f"{name:<10} -> pool #{pool.id}, cổng đang dùng {DB.used}/{Database.MAX_CONNECTIONS}")
        except RuntimeError as error:
            print(f"{name:<10} -> LỖI: {error}")
    print(f"Đã tạo {ConnectionPool.created} pool cho 3 service")
