"""Bridge: tách "loại thông báo" khỏi "kênh gửi" để hai bên thay đổi độc lập.

Chạy: python3 bridge.py
"""
from abc import ABC, abstractmethod


# Implementor: interface chung của mọi kênh gửi.
class Channel(ABC):
    @abstractmethod
    def deliver(self, title: str, text: str) -> str: ...


# Concrete implementor: mỗi kênh tự quyết cách trình bày tiêu đề và nội dung.
class EmailChannel(Channel):
    def __init__(self, address: str) -> None:
        self.address = address

    def deliver(self, title: str, text: str) -> str:
        return f'email tới {self.address}, tiêu đề "{title}": {text}'


class SmsChannel(Channel):
    def __init__(self, phone: str) -> None:
        self.phone = phone

    def deliver(self, title: str, text: str) -> str:
        # SMS không có ô tiêu đề, nên tiêu đề được ghép vào đầu tin.
        return f"SMS tới {self.phone}: {title} - {text}"


class PushChannel(Channel):
    def __init__(self, device: str) -> None:
        self.device = device

    def deliver(self, title: str, text: str) -> str:
        return f"push tới {self.device}: [{title}] {text}"


# Kênh thêm sau chỉ là một lớp mới, không loại thông báo nào phải sửa.
class ChatChannel(Channel):
    def __init__(self, handle: str) -> None:
        self.handle = handle

    def deliver(self, title: str, text: str) -> str:
        return f"chat tới {self.handle}: *{title}* {text}"


# Abstraction: thông báo giữ một kênh và nhờ kênh đó gửi đi.
class Notification(ABC):
    def __init__(self, channel: Channel) -> None:
        self.channel = channel

    def send(self) -> str:
        return self.channel.deliver(self.title(), self.text())

    @abstractmethod
    def title(self) -> str: ...

    @abstractmethod
    def text(self) -> str: ...


# Refined abstraction: mỗi loại thông báo chỉ lo phần nội dung.
class Alert(Notification):
    def __init__(self, channel: Channel, event: str) -> None:
        super().__init__(channel)
        self.event = event

    def title(self) -> str:
        return "CẢNH BÁO"

    def text(self) -> str:
        return self.event


class Reminder(Notification):
    def __init__(self, channel: Channel, when: str) -> None:
        super().__init__(channel)
        self.when = when

    def title(self) -> str:
        return "Nhắc lịch"

    def text(self) -> str:
        return f"Lịch hẹn lúc {self.when}"


class Promotion(Notification):
    def __init__(self, channel: Channel, percent: int, min_order: int) -> None:
        super().__init__(channel)
        self.percent = percent
        self.min_order = min_order

    def title(self) -> str:
        return "Khuyến mãi"

    def text(self) -> str:
        amount = f"{self.min_order:,}".replace(",", ".")
        return f"Giảm {self.percent}% cho đơn từ {amount} ₫"


if __name__ == "__main__":
    email = EmailChannel("lan@example.com")
    sms = SmsChannel("0901234567")
    push = PushChannel("điện thoại của Lan")
    chat = ChatChannel("@lan")

    notifications = [
        Alert(email, "Có lần đăng nhập từ thiết bị lạ"),
        Reminder(sms, "9:00 sáng mai"),
        Promotion(push, 20, 300_000),
        Promotion(chat, 20, 300_000),  # kênh mới dùng được ngay với loại tin có sẵn
    ]
    for notification in notifications:
        print(notification.send())

    kinds = len(Notification.__subclasses__())
    channels = len(Channel.__subclasses__())
    print(
        f"Số lớp: {kinds} loại tin + {channels} kênh = {kinds + channels} lớp. "
        f"Nếu viết mỗi tổ hợp một lớp thì cần {kinds} × {channels} = {kinds * channels} lớp."
    )
