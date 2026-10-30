// Composite: một kiện hàng là một món, hoặc một hộp chứa món hàng và hộp khác.
// Chạy: node composite.ts

const kg = (grams: number): string => `${(grams / 1000).toFixed(1).replace(".", ",")} kg`;

// Component: thứ gì đặt lên cân cũng trả lời được hai câu hỏi này.
interface Parcel {
  readonly name: string;
  weight(): number; // gam
  lines(depth?: number): string[];
}

// Leaf: một món hàng, không chứa gì bên trong.
class Item implements Parcel {
  readonly name: string;
  private readonly grams: number;

  constructor(name: string, grams: number) {
    this.name = name;
    this.grams = grams;
  }

  weight(): number {
    return this.grams;
  }

  lines(depth = 0): string[] {
    return [`${"  ".repeat(depth)}${this.name}: ${kg(this.weight())}`];
  }
}

// Composite: một hộp. Nó cũng là Parcel, và chứa các Parcel khác: món hàng hay hộp đều được.
class Box implements Parcel {
  readonly name: string;
  private readonly tare: number; // khối lượng của vỏ hộp
  private readonly children: Parcel[] = [];

  constructor(name: string, tare: number) {
    this.name = name;
    this.tare = tare;
  }

  add(...parcels: Parcel[]): Box {
    this.children.push(...parcels);
    return this;
  }

  weight(): number {
    return this.tare + this.children.reduce((total, child) => total + child.weight(), 0);
  }

  lines(depth = 0): string[] {
    const head = `${"  ".repeat(depth)}${this.name}: ${kg(this.weight())} (vỏ ${kg(this.tare)})`;
    return [head, ...this.children.flatMap((child) => child.lines(depth + 1))];
  }
}

// Client: cái cân. Nó chỉ gọi weight(), không hỏi thứ trên bàn cân là món hàng hay hộp.
function weigh(parcel: Parcel): string {
  return `${parcel.name}: ${kg(parcel.weight())}`;
}

const smallBox = (): Box => new Box("Hộp nhỏ", 300).add(new Item("Bình giữ nhiệt", 600), new Item("Hộp trà", 500));

const vase = new Item("Bình gốm", 1500);
const small = smallBox();
const crate = new Box("Thùng lớn", 900).add(smallBox(), new Item("Sách", 1200), new Item("Bình gốm", 1500));

for (const parcel of [vase, small, crate]) console.log(weigh(parcel));
console.log();
console.log(crate.lines().join("\n"));
