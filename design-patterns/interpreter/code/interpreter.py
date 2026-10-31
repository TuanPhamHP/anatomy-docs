"""Interpreter: quy tắc ưu đãi là một cây biểu thức, lưu như dữ liệu và tự đánh giá.

Chạy: python3 interpreter.py
"""
from dataclasses import dataclass
from typing import Protocol, Union

Value = Union[str, int]
Context = dict[str, Value]


# Mỗi nút của cây biết tự đánh giá trên một khách hàng, và tự in lại chính nó.
class Expr(Protocol):
    def evaluate(self, ctx: Context) -> Value | bool: ...


# Nút lá: đọc một giá trị của khách, hoặc một hằng số viết sẵn trong quy tắc.
@dataclass(frozen=True)
class Var:
    name: str

    def evaluate(self, ctx: Context) -> Value:
        return ctx[self.name]

    def __str__(self) -> str:
        return self.name


@dataclass(frozen=True)
class Const:
    value: Value

    def evaluate(self, ctx: Context) -> Value:
        return self.value

    def __str__(self) -> str:
        return f'"{self.value}"' if isinstance(self.value, str) else str(self.value)


# Nút so sánh: đánh giá hai nhánh con rồi so với nhau.
@dataclass(frozen=True)
class Equals:
    left: Expr
    right: Expr

    def evaluate(self, ctx: Context) -> bool:
        return self.left.evaluate(ctx) == self.right.evaluate(ctx)

    def __str__(self) -> str:
        return f"{self.left} == {self.right}"


@dataclass(frozen=True)
class AtLeast:
    left: Expr
    right: Expr

    def evaluate(self, ctx: Context) -> bool:
        return self.left.evaluate(ctx) >= self.right.evaluate(ctx)

    def __str__(self) -> str:
        return f"{self.left} >= {self.right}"


# Nút ghép: VÀ cần cả hai nhánh đúng, HOẶC chỉ cần một nhánh.
@dataclass(frozen=True)
class And:
    left: Expr
    right: Expr

    def evaluate(self, ctx: Context) -> bool:
        return bool(self.left.evaluate(ctx)) and bool(self.right.evaluate(ctx))

    def __str__(self) -> str:
        return f"({self.left} VÀ {self.right})"


@dataclass(frozen=True)
class Or:
    left: Expr
    right: Expr

    def evaluate(self, ctx: Context) -> bool:
        return bool(self.left.evaluate(ctx)) or bool(self.right.evaluate(ctx))

    def __str__(self) -> str:
        return f"{self.left} HOẶC {self.right}"


# Quy tắc của bộ phận kinh doanh, dựng thẳng thành cây. Thực tế cây này thường được
# đọc từ JSON lưu trong cơ sở dữ liệu, nên đổi quy tắc không cần sửa code.
RULE = Or(
    Equals(Var("hạng"), Const("vàng")),
    And(AtLeast(Var("tổng_đơn"), Const(500000)), Equals(Var("khu_vực"), Const("HN"))),
)

CUSTOMERS = [
    ("An", {"hạng": "vàng", "tổng_đơn": 320000, "khu_vực": "HCM"}),
    ("Bình", {"hạng": "bạc", "tổng_đơn": 650000, "khu_vực": "HN"}),
    ("Chi", {"hạng": "bạc", "tổng_đơn": 720000, "khu_vực": "ĐN"}),
]


def dots(n: int) -> str:
    return f"{n:,}".replace(",", ".")


print(f"Quy tắc: {RULE}")
for name, ctx in CUSTOMERS:
    verdict = "được ưu đãi" if RULE.evaluate(ctx) else "không"
    print(f"{name:<6}{ctx['hạng']:<6}{dots(ctx['tổng_đơn']):>8}  {ctx['khu_vực']:<5}-> {verdict}")
