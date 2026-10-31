"""Trước khi có Abstract Factory: mỗi chỗ tự chọn nhà cung cấp theo một dòng cấu hình riêng.

Chạy: python3 before.py
"""
import hashlib
import hmac

SECRETS = {"A": b"bi-mat-cua-a", "B": b"bi-mat-cua-b"}
PREFIX = {"A": "a1:", "B": "v2="}

# Ba dòng cấu hình đọc ở ba chỗ khác nhau. Lần chuyển sang A vừa rồi còn sót dòng webhook.
SETTINGS = {"payment": "A", "refund": "A", "webhook": "B"}


def sign(provider: str, body: str) -> str:
    return PREFIX[provider] + hmac.new(SECRETS[provider], body.encode(), hashlib.sha256).hexdigest()[:8]


def vnd(amount: int) -> str:
    return f"{amount:,}".replace(",", ".") + " ₫"


def charge(order: str, amount: int) -> tuple[str, str]:
    body = f"{order}|{amount}"
    if SETTINGS["payment"] == "A":
        return body, sign("A", body)
    elif SETTINGS["payment"] == "B":
        return body, sign("B", body)
    raise ValueError("nhà cung cấp lạ")


def verify(body: str, signature: str) -> bool:
    if SETTINGS["webhook"] == "A":
        return signature == sign("A", body)
    elif SETTINGS["webhook"] == "B":
        return signature == sign("B", body)
    raise ValueError("nhà cung cấp lạ")


def refund(order: str, amount: int) -> str:
    if SETTINGS["refund"] == "A":
        return f"HT-A-{order[-4:]}"
    elif SETTINGS["refund"] == "B":
        return f"HT-B-{order[-4:]}"
    raise ValueError("nhà cung cấp lạ")


body, signature = charge("DH-3001", 1250000)
print(f"Thu {vnd(1250000)} qua {SETTINGS['payment']}, webhook {signature}")
print(f"Kiểm webhook bằng bộ của {SETTINGS['webhook']}: {'hợp lệ' if verify(body, signature) else 'bị từ chối'}")
print(f"Hoàn {vnd(250000)} qua {SETTINGS['refund']}, mã {refund('DH-3001', 250000)}")
