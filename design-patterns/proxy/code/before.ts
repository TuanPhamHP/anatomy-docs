// Khi chưa có Proxy: chỗ nào đọc báo cáo cũng tự tải báo cáo và tự kiểm quyền.

const clock = { seconds: 0 }; // đồng hồ giả lập: cộng thời gian thay vì chờ thật

function loadFromArchive(year: number): string[] {
  clock.seconds += 2.4; // đọc một file lớn từ kho lưu trữ: khoảng 2,4 s
  return Array.from({ length: 1240 }, (_, i) => `Trang ${i + 1}`);
}

interface User {
  name: string;
  role: string;
}

const groupDots = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

class AnnualReport {
  static loads = 0;
  readonly year: number;
  readonly pages: string[];

  constructor(year: number) {
    AnnualReport.loads += 1;
    this.year = year;
    this.pages = loadFromArchive(year);
  }

  read(user: User): string {
    return `Báo cáo thường niên ${this.year} (${groupDots(this.pages.length)} trang)`;
  }
}

function viewReport(user: User): string {
  const report = new AnnualReport(2025); // tải ngay, kể cả khi người xem không có quyền
  if (!["ke-toan", "giam-doc"].includes(user.role)) { // chỗ nào đọc báo cáo cũng phải chép lại dòng này
    return "bị từ chối";
  }
  return report.read(user);
}

const seconds = (value: number) => value.toFixed(1).replace(".0", "").replace(".", ",");

const users: User[] = [
  { name: "Khách", role: "khach" },
  { name: "Kế toán", role: "ke-toan" },
  { name: "Kế toán", role: "ke-toan" },
];
for (const user of users) {
  const start = clock.seconds;
  const text = viewReport(user);
  console.log(`${(user.name + ":").padEnd(9)}${text}, đã tải ${AnnualReport.loads} lần, mất ${seconds(clock.seconds - start)} s`);
}
console.log(`Tổng: tải ${AnnualReport.loads} lần, mất ${seconds(clock.seconds)} s`);
