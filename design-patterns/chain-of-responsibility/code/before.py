"""Khi chưa có Chain of Responsibility: một hàm biết hết mọi cấp duyệt và hạn mức."""


def approve(amount: int) -> str:
    if amount <= 5_000_000:
        return "Trưởng nhóm duyệt"
    elif amount <= 50_000_000:
        return "Trưởng phòng duyệt"
    elif amount <= 200_000_000:
        return "Giám đốc duyệt"
    else:
        return "bị từ chối: vượt mọi hạn mức"  # thêm một cấp duyệt là phải sửa hàm này


if __name__ == "__main__":
    for id_, amount in [("CP-101", 3_000_000), ("CP-102", 20_000_000), ("CP-103", 120_000_000), ("CP-104", 900_000_000)]:
        print(f"{id_}  {amount:>11,} ₫  →  {approve(amount)}".replace(",", "."))
