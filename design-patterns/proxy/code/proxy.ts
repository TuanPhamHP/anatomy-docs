// Proxy: đứng thay báo cáo thật, kiểm quyền trước và chỉ tải báo cáo khi thật sự cần.
// Chạy: node proxy.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

// Đồng hồ giả lập: cộng thời gian thay vì chờ thật, nên số in ra lần nào cũng giống nhau.
const clock = { seconds: 0 };

function loadFromArchive(year: number): string[] {
  clock.seconds += 2.4; // thật ra là đọc một file lớn từ kho lưu trữ: khoảng 2,4 s
  return Array.from({ length: 1240 }, (_, i) => `Trang ${i + 1}`);
}

interface User {
  name: string;
  role: string;
}

// Subject: interface chung mà mọi chỗ gọi dùng.
interface Report {
  read(user: User): string;
}

const groupDots = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Real subject: báo cáo thật. Tạo ra là phải tải ngay, rất tốn.
class AnnualReport implements Report {
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

class PermissionError extends Error {}

// Proxy: cùng interface với báo cáo thật, đứng chắn phía trước nó.
class ReportProxy implements Report {
  static readonly ALLOWED = new Set(["ke-toan", "giam-doc"]);
  private readonly year: number;
  private report: AnnualReport | null = null; // chưa tải gì cả

  constructor(year: number) {
    this.year = year;
  }

  read(user: User): string {
    if (!ReportProxy.ALLOWED.has(user.role)) { // kiểm quyền trước mọi việc khác
      throw new PermissionError(`${user.name} không có quyền xem báo cáo`);
    }
    if (this.report === null) { // chỉ tải ở lần đọc hợp lệ đầu tiên
      this.report = new AnnualReport(this.year);
    }
    return this.report.read(user);
  }
}

const seconds = (value: number) => value.toFixed(1).replace(".0", "").replace(".", ",");

// Client: chỉ biết interface Report, không biết phía sau là proxy hay báo cáo thật.
function show(report: Report, user: User): void {
  const start = clock.seconds;
  let text: string;
  try {
    text = report.read(user);
  } catch (error) {
    if (!(error instanceof PermissionError)) throw error;
    text = "bị từ chối";
  }
  console.log(`${(user.name + ":").padEnd(9)}${text}, đã tải ${AnnualReport.loads} lần, mất ${seconds(clock.seconds - start)} s`);
}

const report = new ReportProxy(2025);
show(report, { name: "Khách", role: "khach" });
show(report, { name: "Kế toán", role: "ke-toan" });
show(report, { name: "Kế toán", role: "ke-toan" });
console.log(`Tổng: tải ${AnnualReport.loads} lần, mất ${seconds(clock.seconds)} s`);
