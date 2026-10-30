"""Khi chưa có State: mỗi thao tác tự kiểm tra trạng thái bằng một chuỗi if/elif."""

NAMES = {"draft": "Nháp", "pending": "Chờ duyệt", "approved": "Đã duyệt", "rejected": "Bị từ chối"}


class ActionRefused(Exception):
    pass


class PurchaseRequest:
    def __init__(self) -> None:
        self.status = "draft"  # một chuỗi, ai cũng có thể gán nhầm

    def submit(self) -> None:
        if self.status == "draft":
            self.status = "pending"
        elif self.status == "pending":
            raise ActionRefused("hồ sơ đang chờ duyệt")
        elif self.status == "approved":
            raise ActionRefused("hồ sơ đã duyệt, không đổi được nữa")
        elif self.status == "rejected":
            raise ActionRefused("hồ sơ bị từ chối, cần sửa lại trước")

    def approve(self) -> None:
        if self.status == "pending":
            self.status = "approved"
        elif self.status == "draft":
            raise ActionRefused("hồ sơ nháp chưa được gửi đi")
        elif self.status == "approved":
            raise ActionRefused("hồ sơ đã duyệt, không đổi được nữa")
        elif self.status == "rejected":
            raise ActionRefused("hồ sơ bị từ chối, cần sửa lại trước")

    def reject(self) -> None:
        if self.status == "pending":
            self.status = "rejected"
        elif self.status == "draft":
            raise ActionRefused("hồ sơ nháp chưa được gửi đi")
        elif self.status == "approved":
            raise ActionRefused("hồ sơ đã duyệt, không đổi được nữa")
        elif self.status == "rejected":
            raise ActionRefused("hồ sơ bị từ chối, cần sửa lại trước")

    def revise(self) -> None:
        if self.status == "rejected":
            self.status = "draft"
        elif self.status == "draft":
            raise ActionRefused("hồ sơ nháp chưa được gửi đi")
        elif self.status == "pending":
            raise ActionRefused("hồ sơ đang chờ duyệt")
        elif self.status == "approved":
            raise ActionRefused("hồ sơ đã duyệt, không đổi được nữa")
    # Thêm trạng thái "Đã huỷ" = sửa cả bốn hàm trên.


if __name__ == "__main__":
    request = PurchaseRequest()
    steps = [
        ("gửi duyệt", request.submit),
        ("từ chối", request.reject),
        ("sửa lại", request.revise),
        ("gửi duyệt", request.submit),
        ("duyệt", request.approve),
        ("gửi duyệt", request.submit),
    ]
    for label, action in steps:
        before = NAMES[request.status]
        try:
            action()
            result = NAMES[request.status]
        except ActionRefused as refused:
            result = f"bị chặn: {refused}"
        print(f"{before:<10} + {label:<9} → {result}")
