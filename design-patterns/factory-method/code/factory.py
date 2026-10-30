"""Factory Method: lớp cha giữ quy trình gửi thông báo, lớp con quyết định tạo Sender nào.

Chạy: python3 factory.py
"""
import math
import unicodedata
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class User:
    email: str
    phone: str
    device: str


def no_accents(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in unicodedata.normalize("NFD", text) if not unicodedata.combining(c))


# Product: interface chung của mọi Sender. Code gọi chỉ cần biết send().
class Sender(ABC):
    @abstractmethod
    def send(self, user: User, text: str) -> str: ...


# Concrete products: mỗi kênh gửi theo cách riêng.
class EmailSender(Sender):
    def send(self, user: User, text: str) -> str:
        return f"{user.email}: [Cập nhật đơn hàng] {text} ({len(text)} ký tự, phí 20 ₫)"


class SmsSender(Sender):
    def send(self, user: User, text: str) -> str:
        plain = no_accents(text)  # tin không dấu: 160 ký tự một tin
        parts = math.ceil(len(plain) / 160)
        return f"{user.phone}: {plain} ({parts} tin, phí {parts * 500} ₫)"


class PushSender(Sender):
    def send(self, user: User, text: str) -> str:
        short = text if len(text) <= 28 else text[:28].rsplit(" ", 1)[0] + "…"  # màn hình khoá hiện 28 ký tự
        return f"máy {user.device}: {short} (phí 0 ₫)"


# Creator: notify() là quy trình cố định. Chỉ create_sender() để lớp con quyết định.
class Notifier(ABC):
    @abstractmethod
    def create_sender(self) -> Sender: ...  # factory method

    def notify(self, user: User, text: str) -> str:
        sender = self.create_sender()
        result = sender.send(user, text)
        return f"{type(self).__name__} tạo {type(sender).__name__} → {result}"


# Concrete creators: mỗi lớp con chỉ viết đúng một dòng tạo object.
class EmailNotifier(Notifier):
    def create_sender(self) -> Sender:
        return EmailSender()


class SmsNotifier(Notifier):
    def create_sender(self) -> Sender:
        return SmsSender()


class PushNotifier(Notifier):
    def create_sender(self) -> Sender:
        return PushSender()


# Biến thể đơn giản hơn: một hàm factory chọn lớp theo tên kênh, không cần lớp con.
SENDERS: dict[str, type[Sender]] = {"email": EmailSender, "sms": SmsSender, "push": PushSender}


def sender_for(channel: str) -> Sender:
    return SENDERS[channel]()


if __name__ == "__main__":
    user = User(email="lan@example.com", phone="0901234567", device="app-7f3a")
    text = "Đơn DH-2041 đã giao thành công. Cảm ơn bạn!"
    for notifier in [EmailNotifier(), SmsNotifier(), PushNotifier()]:
        print(notifier.notify(user, text))
    print(f'Hàm factory với "sms" → {type(sender_for("sms")).__name__}')
