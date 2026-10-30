// State: mỗi trạng thái của hồ sơ là một lớp, tự quyết định thao tác nào được làm.
// Chạy: node state.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

class ActionRefused extends Error {}

// State: interface chung. Mặc định mọi thao tác đều bị chặn;
// mỗi trạng thái chỉ viết lại những thao tác nó nhận.
abstract class State {
  abstract readonly name: string;
  abstract readonly refusal: string;

  submit(request: PurchaseRequest): void {
    throw new ActionRefused(this.refusal);
  }

  approve(request: PurchaseRequest): void {
    throw new ActionRefused(this.refusal);
  }

  reject(request: PurchaseRequest): void {
    throw new ActionRefused(this.refusal);
  }

  revise(request: PurchaseRequest): void {
    throw new ActionRefused(this.refusal);
  }
}

// ConcreteState: mỗi lớp giữ trọn luật của một trạng thái.
class Draft extends State {
  readonly name = "Nháp";
  readonly refusal = "hồ sơ nháp chưa được gửi đi";

  submit(request: PurchaseRequest): void {
    request.state = new Pending();
  }
}

class Pending extends State {
  readonly name = "Chờ duyệt";
  readonly refusal = "hồ sơ đang chờ duyệt";

  approve(request: PurchaseRequest): void {
    request.state = new Approved();
  }

  reject(request: PurchaseRequest): void {
    request.state = new Rejected();
  }
}

class Approved extends State {
  readonly name = "Đã duyệt";
  readonly refusal = "hồ sơ đã duyệt, không đổi được nữa";
}

class Rejected extends State {
  readonly name = "Bị từ chối";
  readonly refusal = "hồ sơ bị từ chối, cần sửa lại trước";

  revise(request: PurchaseRequest): void {
    request.state = new Draft();
  }
}

// Context: hồ sơ đề nghị mua hàng. Nó không hỏi "mình đang ở trạng thái nào",
// chỉ chuyển thao tác cho trạng thái hiện tại.
class PurchaseRequest {
  state: State = new Draft();

  submit(): void {
    this.state.submit(this);
  }

  approve(): void {
    this.state.approve(this);
  }

  reject(): void {
    this.state.reject(this);
  }

  revise(): void {
    this.state.revise(this);
  }
}

const request = new PurchaseRequest();
const steps: [string, () => void][] = [
  ["gửi duyệt", () => request.submit()],
  ["từ chối", () => request.reject()],
  ["sửa lại", () => request.revise()],
  ["gửi duyệt", () => request.submit()],
  ["duyệt", () => request.approve()],
  ["gửi duyệt", () => request.submit()],
];
for (const [label, action] of steps) {
  const before = request.state.name;
  let result: string;
  try {
    action();
    result = request.state.name;
  } catch (refused) {
    if (!(refused instanceof ActionRefused)) throw refused;
    result = `bị chặn: ${refused.message}`;
  }
  console.log(`${before.padEnd(10)} + ${label.padEnd(9)} → ${result}`);
}
