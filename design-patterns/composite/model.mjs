// The Composite figure's model: three parcels for the same scale. A parcel is
// an Item (a leaf) or a Box that holds items and other boxes, and both answer
// weight() the same way. build.mjs inlines this file into the page, so the dial,
// the display and the captions read these numbers; the Python and TypeScript
// examples under code/ build the same tree and print the same weights.

export class Item {
  constructor(name, grams) {
    this.name = name;
    this.grams = grams;
  }
  weight() {
    return this.grams;
  }
  // The sum as a reader would write it: an item is just its own weight.
  sum() {
    return kg(this.grams);
  }
}

export class Box {
  constructor(name, tare, children) {
    this.name = name;
    this.tare = tare; // the empty box itself
    this.children = children;
  }
  weight() {
    return this.tare + this.children.reduce((total, child) => total + child.weight(), 0);
  }
  // A box inside a box is written in brackets: 0,9 + (0,3 + 0,6 + 0,5) + 1,2.
  sum(nested = false) {
    const text = [kg(this.tare), ...this.children.map((child) => child.sum(true))].join(" + ");
    return nested ? `(${text})` : text;
  }
}

const smallBox = () => new Box("Hộp nhỏ", 300, [new Item("Bình giữ nhiệt", 600), new Item("Hộp trà", 500)]);

// The three steps: one item, a box of items, and a crate holding a box like the
// one in step 2, a book and a vase like the one in step 1.
export const PARCELS = [
  { id: "vase", label: "Một món hàng", short: "1 món", tree: new Item("Bình gốm", 1500) },
  { id: "small", label: "Hộp nhỏ", short: "Hộp nhỏ", tree: smallBox() },
  { id: "crate", label: "Thùng lớn", short: "Thùng", tree: new Box("Thùng lớn", 900, [smallBox(), new Item("Sách", 1200), new Item("Bình gốm", 1500)]) },
];

// Grams to kilograms with a decimal comma: 1500 -> "1,5", 5000 -> "5,0".
export const kg = (grams, digits = 1) => (grams / 1000).toFixed(digits).replace(".", ",");
