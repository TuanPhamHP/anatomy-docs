// The Chain of Responsibility figure's model: three approvers in order, each with
// a spending limit, and four expense requests. figure.mjs inlines this file into
// the page, so the readout, the step captions and the sizes of the tokens and
// holes all come from here. The Python and TypeScript examples under code/ use
// the same approvers and requests and print the same decisions.

export const APPROVERS = [
  { id: "lead", role: "Trưởng nhóm", limit: 5000000 },
  { id: "head", role: "Trưởng phòng", limit: 50000000 },
  { id: "director", role: "Giám đốc", limit: 200000000 },
];

export const REQUESTS = [
  { id: "CP-101", amount: 3000000, purpose: "mua văn phòng phẩm quý 4" },
  { id: "CP-102", amount: 20000000, purpose: "mua laptop cho nhân viên mới" },
  { id: "CP-103", amount: 120000000, purpose: "tổ chức hội nghị khách hàng" },
  { id: "CP-104", amount: 900000000, purpose: "mở văn phòng mới" },
];

// Walk the chain in order: the first approver whose limit covers the amount
// handles it, everyone before it passes it on. -1 means nobody could.
export function route(amount) {
  const passed = [];
  for (let i = 0; i < APPROVERS.length; i++) {
    if (amount <= APPROVERS[i].limit) return { by: i, passed };
    passed.push(i);
  }
  return { by: -1, passed };
}

// Token and hole diameters in drawing units. Both grow with the logarithm of the
// amount, so a token is smaller than a hole exactly when its amount is within
// that approver's limit. CLEARANCE keeps a request equal to the limit falling in.
export const sizeOf = (amount) => 4.1 + 6.06 * Math.log10(amount / 1e6);
export const CLEARANCE = 0.4;
export const tokenRadius = (request) => sizeOf(request.amount) / 2;
export const holeRadius = (approver) => (sizeOf(approver.limit) + CLEARANCE) / 2;

// 20000000 -> "20.000.000"
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// What the chain answers, in the words the examples print.
export const decisionOf = (request) => {
  const { by } = route(request.amount);
  return by < 0 ? "bị từ chối: vượt mọi hạn mức" : `${APPROVERS[by].role} duyệt`;
};
