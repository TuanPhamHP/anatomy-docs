"""Khi chưa có Proxy: chỗ nào đọc báo cáo cũng tự tải báo cáo và tự kiểm quyền."""
from dataclasses import dataclass


class Stopwatch:
    """Đồng hồ giả lập: cộng thời gian thay vì chờ thật."""

    def __init__(self) -> None:
        self.seconds = 0.0

    def spend(self, seconds: float) -> None:
        self.seconds += seconds


CLOCK = Stopwatch()


def load_from_archive(year: int) -> list[str]:
    CLOCK.spend(2.4)  # đọc một file lớn từ kho lưu trữ: khoảng 2,4 s
    return [f"Trang {n}" for n in range(1, 1241)]


@dataclass(frozen=True)
class User:
    name: str
    role: str


class AnnualReport:
    loads = 0

    def __init__(self, year: int) -> None:
        AnnualReport.loads += 1
        self.year = year
        self.pages = load_from_archive(year)

    def read(self, user: User) -> str:
        return f"Báo cáo thường niên {self.year} ({len(self.pages):,} trang)".replace(",", ".")


def view_report(user: User) -> str:
    report = AnnualReport(2025)  # tải ngay, kể cả khi người xem không có quyền
    if user.role not in ("ke-toan", "giam-doc"):  # chỗ nào đọc báo cáo cũng phải chép lại dòng này
        return "bị từ chối"
    return report.read(user)


def seconds(value: float) -> str:
    return f"{value:.1f}".replace(".0", "").replace(".", ",")


if __name__ == "__main__":
    for user in [User("Khách", "khach"), User("Kế toán", "ke-toan"), User("Kế toán", "ke-toan")]:
        start = CLOCK.seconds
        text = view_report(user)
        print(f"{user.name + ':':<9}{text}, đã tải {AnnualReport.loads} lần, mất {seconds(CLOCK.seconds - start)} s")
    print(f"Tổng: tải {AnnualReport.loads} lần, mất {seconds(CLOCK.seconds)} s")
