// The Strategy figure's model: one order and three ways to price its shipping.
// build.mjs inlines this file into the page, so the cams' profiles, the dial and
// the readout all come from these fee rules. The Python and TypeScript examples
// under code/ price the same order with the same rules and print the same fees.

export const ORDER = { weightKg: 3.5, distanceKm: 12, subtotal: 450000 };

export const STRATEGIES = [
  {
    id: "weight",
    cls: "WeightFee",
    name: "Theo cân nặng",
    short: "Cân nặng",
    field: "weightKg",
    unit: "kg",
    max: 6,
    tick: 1,
    rule: "15.000 ₫ cho kg đầu, thêm 5.000 ₫ cho mỗi kg sau (phần lẻ tính tròn một kg)",
  },
  {
    id: "distance",
    cls: "DistanceFee",
    name: "Theo khoảng cách",
    short: "Khoảng cách",
    field: "distanceKm",
    unit: "km",
    max: 30,
    tick: 5,
    rule: "đến 5 km 15.000 ₫, đến 15 km 25.000 ₫, xa hơn 35.000 ₫",
  },
  {
    id: "free",
    cls: "FreeOverThreshold",
    name: "Miễn phí từ 300.000 ₫",
    short: "Miễn phí",
    field: "subtotal",
    unit: "₫",
    max: 600000,
    tick: 100000,
    rule: "đơn từ 300.000 ₫ được miễn phí, dưới mức đó đồng giá 20.000 ₫",
  },
];

// The rules themselves: each takes the value its strategy reads from the order.
export const FEE = {
  weight: (kg) => 15000 + Math.max(0, Math.ceil(kg - 1)) * 5000,
  distance: (km) => (km <= 5 ? 15000 : km <= 15 ? 25000 : 35000),
  free: (subtotal) => (subtotal >= 300000 ? 0 : 20000),
};

// The largest fee any cam can show: the full lift of a cam and the end of the dial.
export const FEE_MAX = 40000;

export const quote = (strategy, order = ORDER) => FEE[strategy.id](order[strategy.field]);

// 30000 -> "30.000", the way the dial's counter groups digits.
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// The value a strategy reads, written for people: "3,2 kg", "12 km", "450.000 ₫".
export const valueText = (strategy, order = ORDER) => {
  const value = order[strategy.field];
  return strategy.unit === "₫" ? `${groupVND(value)} ₫` : `${String(value).replace(".", ",")} ${strategy.unit}`;
};
