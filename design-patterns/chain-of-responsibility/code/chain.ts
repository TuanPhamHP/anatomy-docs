// Chain of Responsibility: duyệt đề nghị chi theo hạn mức.
// Chạy: node chain.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

interface Expense {
  id: string;
  amount: number; // VND
  purpose: string;
}

// Handler: mỗi người duyệt chỉ biết hạn mức của mình và người kế tiếp trong chuỗi.
class Approver {
  readonly role: string;
  readonly limit: number;
  private next: Approver | null = null;

  constructor(role: string, limit: number) {
    this.role = role;
    this.limit = limit;
  }

  setNext(approver: Approver): Approver {
    this.next = approver;
    return approver; // trả về mắt sau để nối tiếp: a.setNext(b).setNext(c)
  }

  handle(request: Expense): string {
    if (this.canApprove(request)) return `${this.role} duyệt`;
    if (this.next === null) return "bị từ chối: vượt mọi hạn mức"; // hết chuỗi mà không ai nhận
    return this.next.handle(request); // không đủ thẩm quyền thì chuyển tiếp
  }

  protected canApprove(request: Expense): boolean {
    return request.amount <= this.limit;
  }
}

function buildChain(): Approver {
  const lead = new Approver("Trưởng nhóm", 5_000_000);
  lead.setNext(new Approver("Trưởng phòng", 50_000_000)).setNext(new Approver("Giám đốc", 200_000_000));
  return lead; // client chỉ giữ mắt đầu tiên
}

const vnd = (n: number) => n.toLocaleString("vi-VN");

const chain = buildChain();
const requests: Expense[] = [
  { id: "CP-101", amount: 3_000_000, purpose: "mua văn phòng phẩm quý 4" },
  { id: "CP-102", amount: 20_000_000, purpose: "mua laptop cho nhân viên mới" },
  { id: "CP-103", amount: 120_000_000, purpose: "tổ chức hội nghị khách hàng" },
  { id: "CP-104", amount: 900_000_000, purpose: "mở văn phòng mới" },
];
for (const r of requests) {
  console.log(`${r.id}  ${vnd(r.amount).padStart(11)} ₫  →  ${chain.handle(r)}`);
}
