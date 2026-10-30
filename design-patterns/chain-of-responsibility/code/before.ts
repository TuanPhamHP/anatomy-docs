// Khi chưa có Chain of Responsibility: một hàm biết hết mọi cấp duyệt và hạn mức.
function approve(amount: number): string {
  if (amount <= 5_000_000) {
    return "Trưởng nhóm duyệt";
  } else if (amount <= 50_000_000) {
    return "Trưởng phòng duyệt";
  } else if (amount <= 200_000_000) {
    return "Giám đốc duyệt";
  } else {
    return "bị từ chối: vượt mọi hạn mức"; // thêm một cấp duyệt = sửa hàm này
  }
}

const requests: [string, number][] = [["CP-101", 3_000_000], ["CP-102", 20_000_000], ["CP-103", 120_000_000], ["CP-104", 900_000_000]];
for (const [id, amount] of requests) {
  console.log(`${id}  ${amount.toLocaleString("vi-VN").padStart(11)} ₫  →  ${approve(amount)}`);
}
