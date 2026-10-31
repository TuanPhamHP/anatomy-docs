"""Trước khi có Bridge: mỗi tổ hợp loại tin và kênh gửi là một lớp riêng.

Chạy: python3 before.py
"""


class Notification:
    def __init__(self, to: str, detail: str) -> None:
        self.to = to
        self.detail = detail

    def send(self) -> str:
        raise NotImplementedError


# Ba loại tin nhân với ba kênh thành chín lớp. Cách trình bày của mỗi kênh
# và nội dung của mỗi loại tin bị chép đi chép lại trong từng lớp.
class AlertEmail(Notification):
    def send(self) -> str:
        return f'email tới {self.to}, tiêu đề "CẢNH BÁO": {self.detail}'


class AlertSms(Notification):
    def send(self) -> str:
        return f"SMS tới {self.to}: CẢNH BÁO - {self.detail}"


class AlertPush(Notification):
    def send(self) -> str:
        return f"push tới {self.to}: [CẢNH BÁO] {self.detail}"


class ReminderEmail(Notification):
    def send(self) -> str:
        return f'email tới {self.to}, tiêu đề "Nhắc lịch": Lịch hẹn lúc {self.detail}'


class ReminderSms(Notification):
    def send(self) -> str:
        return f"SMS tới {self.to}: Nhắc lịch - Lịch hẹn lúc {self.detail}"


class ReminderPush(Notification):
    def send(self) -> str:
        return f"push tới {self.to}: [Nhắc lịch] Lịch hẹn lúc {self.detail}"


class PromotionEmail(Notification):
    def send(self) -> str:
        return f'email tới {self.to}, tiêu đề "Khuyến mãi": {self.detail}'


class PromotionSms(Notification):
    def send(self) -> str:
        return f"SMS tới {self.to}: Khuyến mãi - {self.detail}"


class PromotionPush(Notification):
    def send(self) -> str:
        return f"push tới {self.to}: [Khuyến mãi] {self.detail}"


if __name__ == "__main__":
    notifications = [
        AlertEmail("lan@example.com", "Có lần đăng nhập từ thiết bị lạ"),
        ReminderSms("0901234567", "9:00 sáng mai"),
        PromotionPush("điện thoại của Lan", "Giảm 20% cho đơn từ 300.000 ₫"),
    ]
    for notification in notifications:
        print(notification.send())

    classes = len(Notification.__subclasses__())
    print(f"Số lớp: {classes} lớp cho 3 loại tin và 3 kênh. Thêm kênh Chat sẽ phải viết thêm 3 lớp, thành {classes + 3}.")
