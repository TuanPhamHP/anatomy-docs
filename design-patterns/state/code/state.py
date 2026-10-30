"""State: mỗi trạng thái của hồ sơ là một lớp, tự quyết định thao tác nào được làm.

Chạy: python3 state.py
"""
from __future__ import annotations


class ActionRefused(Exception):
    pass


# State là interface chung. Mặc định mọi thao tác đều bị chặn,
# mỗi trạng thái chỉ viết lại những thao tác nó nhận.
class State:
    name = ""
    refusal = ""

    def submit(self, request: PurchaseRequest) -> None:
        raise ActionRefused(self.refusal)

    def approve(self, request: PurchaseRequest) -> None:
        raise ActionRefused(self.refusal)

    def reject(self, request: PurchaseRequest) -> None:
        raise ActionRefused(self.refusal)

    def revise(self, request: PurchaseRequest) -> None:
        raise ActionRefused(self.refusal)


# Mỗi ConcreteState giữ trọn luật của một trạng thái.
class Draft(State):
    name = "Nháp"
    refusal = "hồ sơ nháp chưa được gửi đi"

    def submit(self, request: PurchaseRequest) -> None:
        request.state = Pending()


class Pending(State):
    name = "Chờ duyệt"
    refusal = "hồ sơ đang chờ duyệt"

    def approve(self, request: PurchaseRequest) -> None:
        request.state = Approved()

    def reject(self, request: PurchaseRequest) -> None:
        request.state = Rejected()


class Approved(State):
    name = "Đã duyệt"
    refusal = "hồ sơ đã duyệt, không đổi được nữa"


class Rejected(State):
    name = "Bị từ chối"
    refusal = "hồ sơ bị từ chối, cần sửa lại trước"

    def revise(self, request: PurchaseRequest) -> None:
        request.state = Draft()


# Context là hồ sơ đề nghị mua hàng. Nó không hỏi mình đang ở trạng thái nào,
# mà chỉ chuyển thao tác cho trạng thái hiện tại.
class PurchaseRequest:
    def __init__(self) -> None:
        self.state: State = Draft()

    def submit(self) -> None:
        self.state.submit(self)

    def approve(self) -> None:
        self.state.approve(self)

    def reject(self) -> None:
        self.state.reject(self)

    def revise(self) -> None:
        self.state.revise(self)


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
        before = request.state.name
        try:
            action()
            result = request.state.name
        except ActionRefused as refused:
            result = f"bị chặn: {refused}"
        print(f"{before:<10} + {label:<9} → {result}")
