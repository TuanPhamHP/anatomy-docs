// Khi chưa có Composite: code cân phải tự hỏi từng thứ là món hàng hay hộp.

type Node = { kind: "item"; name: string; grams: number } | { kind: "box"; name: string; tare: number; contents: Node[] };

const kg = (grams: number): string => `${(grams / 1000).toFixed(1).replace(".", ",")} kg`;

function weigh(parcel: Node): number {
  if (parcel.kind === "item") return parcel.grams;
  let total = parcel.tare;
  for (const child of parcel.contents) {
    // Viết khi hộp chỉ chứa món hàng. Hộp con không có "grams" nên bị tính là 0.
    total += child.kind === "item" ? child.grams : 0;
  }
  return total;
}

const smallBox = (): Node => ({
  kind: "box", name: "Hộp nhỏ", tare: 300, contents: [
    { kind: "item", name: "Bình giữ nhiệt", grams: 600 },
    { kind: "item", name: "Hộp trà", grams: 500 },
  ],
});

const vase: Node = { kind: "item", name: "Bình gốm", grams: 1500 };
const crate: Node = {
  kind: "box", name: "Thùng lớn", tare: 900, contents: [
    smallBox(),
    { kind: "item", name: "Sách", grams: 1200 },
    { kind: "item", name: "Bình gốm", grams: 1500 },
  ],
};

for (const parcel of [vase, smallBox(), crate]) console.log(`${parcel.name}: ${kg(weigh(parcel))}`);
