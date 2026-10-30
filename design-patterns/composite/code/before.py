"""Khi chưa có Composite: code cân phải tự hỏi từng thứ là món hàng hay hộp."""


def kg(grams: int) -> str:
    return f"{grams / 1000:.1f} kg".replace(".", ",")


def weigh(parcel: dict) -> int:
    if parcel["kind"] == "item":
        return parcel["grams"]
    if parcel["kind"] == "box":
        total = parcel["tare"]
        for child in parcel["contents"]:
            # Viết khi hộp chỉ chứa món hàng. Hộp con không có "grams" nên bị tính là 0.
            total += child.get("grams", 0)
        return total
    raise ValueError(f"Không biết cân loại {parcel['kind']}")


def small_box() -> dict:
    return {"kind": "box", "name": "Hộp nhỏ", "tare": 300, "contents": [
        {"kind": "item", "name": "Bình giữ nhiệt", "grams": 600},
        {"kind": "item", "name": "Hộp trà", "grams": 500},
    ]}


if __name__ == "__main__":
    vase = {"kind": "item", "name": "Bình gốm", "grams": 1500}
    crate = {"kind": "box", "name": "Thùng lớn", "tare": 900, "contents": [
        small_box(),
        {"kind": "item", "name": "Sách", "grams": 1200},
        {"kind": "item", "name": "Bình gốm", "grams": 1500},
    ]}
    for parcel in (vase, small_box(), crate):
        print(f"{parcel['name']}: {kg(weigh(parcel))}")
