"""Proxy: đứng thay báo cáo thật, kiểm quyền trước và chỉ tải báo cáo khi thật sự cần.

Chạy: python3 proxy.py
"""
from dataclasses import dataclass
from typing import Protocol


class Stopwatch:
    """Đồng hồ giả lập: cộng thời gian thay vì chờ thật, nên số in ra lần nào cũng giống nhau."""

    def __init__(self) -> None:
        self.seconds = 0.0

    def spend(self, seconds: float) -> None:
        self.seconds += seconds


CLOCK = Stopwatch()


def load_from_archive(year: int) -> list[str]:
    CLOCK.spend(2.4)  # thật ra là đọc một file lớn từ kho lưu trữ: khoảng 2,4 s
    return [f"Trang {n}" for n in range(1, 1241)]


@dataclass(frozen=True)
class User:
    name: str
    role: str


# Subject: interface chung mà mọi chỗ gọi dùng.
class Report(Protocol):
    def read(self, user: User) -> str: ...


# Real subject: báo cáo thật. Tạo ra là phải tải ngay, rất tốn.
class AnnualReport:
    loads = 0

    def __init__(self, year: int) -> None:
        AnnualReport.loads += 1
        self.year = year
        self.pages = load_from_archive(year)

    def read(self, user: User) -> str:
        return f"Báo cáo thường niên {self.year} ({len(self.pages):,} trang)".replace(",", ".")


# Proxy: cùng interface với báo cáo thật, đứng chắn phía trước nó.
class ReportProxy:
    ALLOWED = {"ke-toan", "giam-doc"}

    def __init__(self, year: int) -> None:
        self._year = year
        self._report: AnnualReport | None = None  # chưa tải gì cả

    def read(self, user: User) -> str:
        if user.role not in self.ALLOWED:  # kiểm quyền trước mọi việc khác
            raise PermissionError(f"{user.name} không có quyền xem báo cáo")
        if self._report is None:  # chỉ tải ở lần đọc hợp lệ đầu tiên
            self._report = AnnualReport(self._year)
        return self._report.read(user)


def seconds(value: float) -> str:
    return f"{value:.1f}".replace(".0", "").replace(".", ",")


# Client: chỉ biết interface Report, không biết phía sau là proxy hay báo cáo thật.
def show(report: Report, user: User) -> None:
    start = CLOCK.seconds
    try:
        text = report.read(user)
    except PermissionError:
        text = "bị từ chối"
    print(f"{user.name + ':':<9}{text}, đã tải {AnnualReport.loads} lần, mất {seconds(CLOCK.seconds - start)} s")


if __name__ == "__main__":
    report = ReportProxy(2025)
    show(report, User("Khách", "khach"))
    show(report, User("Kế toán", "ke-toan"))
    show(report, User("Kế toán", "ke-toan"))
    print(f"Tổng: tải {AnnualReport.loads} lần, mất {seconds(CLOCK.seconds)} s")
