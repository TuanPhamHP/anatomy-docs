"""Trước khi có Interpreter: quy tắc ưu đãi viết cứng trong một hàm.

Chạy: python3 before.py
"""

CUSTOMERS = [
    ("An", {"hạng": "vàng", "tổng_đơn": 320000, "khu_vực": "HCM"}),
    ("Bình", {"hạng": "bạc", "tổng_đơn": 650000, "khu_vực": "HN"}),
    ("Chi", {"hạng": "bạc", "tổng_đơn": 720000, "khu_vực": "ĐN"}),
]


def eligible(ctx: dict) -> bool:
    # Mỗi lần bộ phận kinh doanh đổi điều kiện là một lần sửa hàm này, review rồi deploy lại.
    # Khu vực khác muốn quy tắc khác thì hàm lại mọc thêm nhánh if.
    if ctx["hạng"] == "vàng":
        return True
    if ctx["tổng_đơn"] >= 500000:
        if ctx["khu_vực"] == "HN":
            return True
    return False


def dots(n: int) -> str:
    return f"{n:,}".replace(",", ".")


print("Quy tắc: nằm trong hàm eligible(), muốn đổi phải sửa code")
for name, ctx in CUSTOMERS:
    verdict = "được ưu đãi" if eligible(ctx) else "không"
    print(f"{name:<6}{ctx['hạng']:<6}{dots(ctx['tổng_đơn']):>8}  {ctx['khu_vực']:<5}-> {verdict}")
