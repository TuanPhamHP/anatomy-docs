"""Singleton: cả process dùng chung đúng một pool kết nối.

Chạy: python3 singleton.py
"""
import threading


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
        db.open(size)


DB = Database()

# Singleton theo kiểu Python: một biến cấp module giữ instance duy nhất.
_pool: ConnectionPool | None = None
_lock = threading.Lock()


def get_pool() -> ConnectionPool:
    """Lần gọi đầu tạo pool, mọi lần sau trả lại đúng đối tượng đó."""
    global _pool
    if _pool is None:
        with _lock:  # hai thread gọi cùng lúc vẫn chỉ tạo một pool
            if _pool is None:
                _pool = ConnectionPool(DB)
    return _pool


class OrderService:
    def __init__(self) -> None:
        self.pool = get_pool()


class PaymentService:
    def __init__(self) -> None:
        self.pool = get_pool()


class ReportService:
    def __init__(self) -> None:
        self.pool = get_pool()


if __name__ == "__main__":
    kinds = [("Đơn hàng", OrderService), ("Thanh toán", PaymentService), ("Báo cáo", ReportService)]
    services = []
    for name, kind in kinds:
        services.append(kind())
        print(f"{name:<10} -> pool #{services[-1].pool.id}, cổng đang dùng {DB.used}/{Database.MAX_CONNECTIONS}")
    same = all(s.pool is services[0].pool for s in services)
    print(f"Đã tạo {ConnectionPool.created} pool cho 3 service; cùng một object: {'có' if same else 'không'}")
