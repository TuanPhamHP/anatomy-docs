// Khi chưa có State: mỗi thao tác tự kiểm tra trạng thái bằng một switch.
type Status = "draft" | "pending" | "approved" | "rejected";

const NAMES: Record<Status, string> = { draft: "Nháp", pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Bị từ chối" };

class ActionRefused extends Error {}

class PurchaseRequest {
  status: Status = "draft";

  submit(): void {
    switch (this.status) {
      case "draft": this.status = "pending"; break;
      case "pending": throw new ActionRefused("hồ sơ đang chờ duyệt");
      case "approved": throw new ActionRefused("hồ sơ đã duyệt, không đổi được nữa");
      case "rejected": throw new ActionRefused("hồ sơ bị từ chối, cần sửa lại trước");
    }
  }

  approve(): void {
    switch (this.status) {
      case "pending": this.status = "approved"; break;
      case "draft": throw new ActionRefused("hồ sơ nháp chưa được gửi đi");
      case "approved": throw new ActionRefused("hồ sơ đã duyệt, không đổi được nữa");
      case "rejected": throw new ActionRefused("hồ sơ bị từ chối, cần sửa lại trước");
    }
  }

  reject(): void {
    switch (this.status) {
      case "pending": this.status = "rejected"; break;
      case "draft": throw new ActionRefused("hồ sơ nháp chưa được gửi đi");
      case "approved": throw new ActionRefused("hồ sơ đã duyệt, không đổi được nữa");
      case "rejected": throw new ActionRefused("hồ sơ bị từ chối, cần sửa lại trước");
    }
  }

  revise(): void {
    switch (this.status) {
      case "rejected": this.status = "draft"; break;
      case "draft": throw new ActionRefused("hồ sơ nháp chưa được gửi đi");
      case "pending": throw new ActionRefused("hồ sơ đang chờ duyệt");
      case "approved": throw new ActionRefused("hồ sơ đã duyệt, không đổi được nữa");
    }
  }
  // Muốn thêm trạng thái "Đã huỷ" thì phải sửa cả bốn hàm trên.
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
  const before = NAMES[request.status];
  let result: string;
  try {
    action();
    result = NAMES[request.status];
  } catch (refused) {
    if (!(refused instanceof ActionRefused)) throw refused;
    result = `bị chặn: ${refused.message}`;
  }
  console.log(`${before.padEnd(10)} + ${label.padEnd(9)} → ${result}`);
}
