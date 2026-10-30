"""Chain of Responsibility: duyệt đề nghị chi theo hạn mức.

Chạy: python3 chain.py
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Expense:
    id: str
    amount: int  # VND
    purpose: str


# Handler: mỗi người duyệt chỉ biết hạn mức của mình và người kế tiếp trong chuỗi.
class Approver:
    def __init__(self, role: str, limit: int) -> None:
        self.role = role
        self.limit = limit
        self._next: Approver | None = None

    def set_next(self, approver: Approver) -> Approver:
        self._next = approver
        return approver  # trả về mắt sau để nối tiếp: a.set_next(b).set_next(c)

    def handle(self, request: Expense) -> str:
        if self.can_approve(request):
            return f"{self.role} duyệt"
        if self._next is None:
            return "bị từ chối: vượt mọi hạn mức"  # hết chuỗi mà không ai nhận
        return self._next.handle(request)  # không đủ thẩm quyền thì chuyển tiếp

    def can_approve(self, request: Expense) -> bool:
        return request.amount <= self.limit


def build_chain() -> Approver:
    lead = Approver("Trưởng nhóm", 5_000_000)
    lead.set_next(Approver("Trưởng phòng", 50_000_000)).set_next(Approver("Giám đốc", 200_000_000))
    return lead  # client chỉ giữ mắt đầu tiên


if __name__ == "__main__":
    chain = build_chain()
    requests = [
        Expense("CP-101", 3_000_000, "mua văn phòng phẩm quý 4"),
        Expense("CP-102", 20_000_000, "mua laptop cho nhân viên mới"),
        Expense("CP-103", 120_000_000, "tổ chức hội nghị khách hàng"),
        Expense("CP-104", 900_000_000, "mở văn phòng mới"),
    ]
    for r in requests:
        print(f"{r.id}  {r.amount:>11,} ₫  →  {chain.handle(r)}".replace(",", "."))
