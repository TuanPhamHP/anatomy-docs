// The Prototype figure's model: one service package configured once by the sales
// team (the prototype), and what a copy for a new customer holds at each step.
// build.mjs inlines this file, so the displays, the readout and the captions show
// these numbers; the Python and TypeScript examples under code/ print the same ones.

export const TEMPLATE = {
  name: "Bảo trì tiêu chuẩn",
  items: [
    { name: "Kiểm tra định kỳ", price: 2400000 },
    { name: "Vệ sinh thiết bị", price: 1200000 },
    { name: "Hỗ trợ từ xa", price: 1800000 },
  ],
  terms: { payment: "30 ngày", warranty: "12 tháng" },
};

export const CUSTOMER = "An Phát";
export const EXTRA = { name: "Hỗ trợ ngoài giờ", price: 1500000 };

export const total = (items) => items.reduce((sum, item) => sum + item.price, 0);

// What the template and the copy hold when each step comes to rest.
// `shared` means the copy has no list of its own and reads the template's.
export const STEPS = [
  { label: "Gói mẫu", short: "Mẫu", template: TEMPLATE.items, copy: null, customer: null, shared: false },
  { label: "Sao chép", short: "Chép", template: TEMPLATE.items, copy: TEMPLATE.items, customer: null, shared: false },
  { label: "Tuỳ chỉnh bản sao", short: "Chỉnh", template: TEMPLATE.items, copy: [...TEMPLATE.items, EXTRA], customer: CUSTOMER, shared: false },
  { label: "Nếu sao chép nông", short: "Nông", template: [...TEMPLATE.items, EXTRA], copy: [...TEMPLATE.items, EXTRA], customer: CUSTOMER, shared: true },
];

// 5400000 -> "5.400.000", the way the displays and the examples group digits.
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
