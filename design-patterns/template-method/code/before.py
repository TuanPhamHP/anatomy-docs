"""Khi chưa có Template Method: mỗi định dạng một hàm export, chép gần giống nhau."""
import json

ORDERS = [
    {"id": "DH-101", "amount": 1250000, "status": "paid"},
    {"id": "DH-102", "amount": 860000, "status": "cancelled"},
    {"id": "DH-103", "amount": 2400000, "status": "paid"},
    {"id": "DH-104", "amount": 540000, "status": "paid"},
    {"id": "DH-105", "amount": 1100000, "status": "cancelled"},
    {"id": "DH-106", "amount": 375000, "status": "paid"},
]


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def export_csv(orders: list[dict]) -> list[str]:
    rows = [o for o in orders if o["status"] != "cancelled"]
    lines = ["ma_don,so_tien"] + [f"{o['id']},{o['amount']}" for o in rows]
    print(f"report.csv: {len(rows)} đơn, tổng {vnd(sum(o['amount'] for o in rows))} ₫")
    return lines


def export_jsonl(orders: list[dict]) -> list[str]:
    rows = orders  # chép từ export_csv rồi sửa, quên mất bước lọc đơn huỷ
    lines = [json.dumps({"ma_don": o["id"], "so_tien": o["amount"]}, separators=(",", ":")) for o in rows]
    print(f"report.jsonl: {len(rows)} đơn, tổng {vnd(sum(o['amount'] for o in rows))} ₫")
    return lines


if __name__ == "__main__":
    export_csv(ORDERS)
    export_jsonl(ORDERS)
