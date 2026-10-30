"""Trước khi có Factory Method: dịch vụ thông báo tự lo mọi kênh trong một hàm.

Chạy: python3 before.py
"""
import math
import unicodedata


def no_accents(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in unicodedata.normalize("NFD", text) if not unicodedata.combining(c))


class NotificationService:
    def notify(self, user: dict, text: str, channel: str) -> str:
        # Mỗi kênh mới là một nhánh mới trong hàm đang chạy ổn.
        if channel == "email":
            return f"Email → {user['email']}: [Cập nhật đơn hàng] {text} ({len(text)} ký tự, phí 20 ₫)"
        elif channel == "sms":
            plain = no_accents(text)
            parts = math.ceil(len(plain) / 160)
            return f"SMS → {user['phone']}: {plain} ({parts} tin, phí {parts * 500} ₫)"
        elif channel == "push":
            short = text if len(text) <= 28 else text[:28].rsplit(" ", 1)[0] + "…"
            return f"Push → máy {user['device']}: {short} (phí 0 ₫)"
        else:
            raise ValueError(f'chưa hỗ trợ kênh "{channel}"')


if __name__ == "__main__":
    service = NotificationService()
    user = {"email": "lan@example.com", "phone": "0901234567", "device": "app-7f3a"}
    text = "Đơn DH-2041 đã giao thành công. Cảm ơn bạn!"
    for channel in ["email", "sms", "push"]:
        print(service.notify(user, text, channel))
    try:
        service.notify(user, text, "zalo")
    except ValueError as error:
        print(f"Lỗi: {error}, phải mở NotificationService ra sửa")
