"""Khi chưa có Adapter: logic chuyển đổi của mọi ngân hàng nằm ngay trong hệ thống đối soát."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

VN = timezone(timedelta(hours=7))


def import_rows(bank: str, rows: list[dict]) -> list[dict]:
    result = []
    for row in rows:
        if bank == "A":
            amount = row["amount"]
            reference = row["desc"]
            booked_at = datetime.strptime(row["time"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=VN)
        elif bank == "B":
            amount = int(row["creditAmount"].replace(".", ""))
            reference = row["remark"]
            booked_at = datetime.strptime(row["postingDate"], "%d/%m/%Y %H:%M").replace(tzinfo=VN)
        elif bank == "C":
            amount = int(Decimal(row["txnAmt"]))
            reference = row["narrative"]
            booked_at = datetime.fromtimestamp(row["valueDate"] / 1000, tz=VN)
        else:
            raise ValueError(f"Chưa hỗ trợ ngân hàng {bank}")  # thêm ngân hàng = sửa hàm này
        result.append({"amount": amount, "reference": reference, "booked_at": booked_at})
    return result


def reconcile(statements: dict[str, list[dict]]) -> int:
    total = 0
    for bank, rows in statements.items():
        for item in import_rows(bank, rows):
            total += item["amount"]
    return total


if __name__ == "__main__":
    print(reconcile({
        "A": [{"amount": 1250000, "desc": "TT HD 1023", "time": "2026-10-30 09:12:05"}],
        "B": [{"creditAmount": "860.000", "remark": "TT HD 1024", "postingDate": "30/10/2026 10:40"}],
        "C": [{"txnAmt": "2400000.00", "narrative": "TT HD 1025", "valueDate": 1793333100000}],
    }))
