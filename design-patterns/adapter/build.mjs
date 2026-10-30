// Builds design-patterns/adapter/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed result comes from running the example, so the page can't drift from the code.
const result = execFileSync("python3", ["-I", code("adapter.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Adapter</h1>
<p class="dp-lead">Adapter bọc một đối tượng có interface không khớp để nó dùng được như đúng interface mà hệ thống đang chờ. Hệ thống giữ nguyên; mỗi nguồn lạ chỉ cần thêm một lớp chuyển đổi nhỏ.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống đối soát nhận giao dịch chuyển khoản từ ba ngân hàng. Mỗi ngân hàng có SDK riêng, gọi bằng một hàm khác nhau và trả dữ liệu theo kiểu khác nhau:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Ngân hàng</th><th>Hàm của SDK</th><th>Số tiền</th><th>Thời điểm</th></tr></thead>
  <tbody>
    <tr><td>A</td><td><code>fetch()</code></td><td><code>amount: 1250000</code> (số)</td><td><code>"2026-10-30 09:12:05"</code></td></tr>
    <tr><td>B</td><td><code>get_statement()</code></td><td><code>creditAmount: "860.000"</code> (chuỗi, dấu chấm)</td><td><code>"30/10/2026 10:40"</code></td></tr>
    <tr><td>C</td><td><code>list_txns()</code></td><td><code>txnAmt: "2400000.00"</code> (chuỗi thập phân)</td><td><code>1793333100000</code> (epoch ms)</td></tr>
  </tbody>
</table></div>
<p>Còn hệ thống đối soát chỉ muốn làm việc với một kiểu: <code>Transaction(amount, reference, booked_at)</code>, số tiền là số nguyên VND, lấy qua một hàm <code>transactions()</code>.</p>

<h2>Khi chưa có Adapter</h2>
<p>Cách làm thường gặp là nhét logic chuyển đổi của mọi ngân hàng vào ngay trong hệ thống đối soát:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Thêm ngân hàng là sửa lõi.</strong> Mỗi ngân hàng mới là một nhánh <code>elif</code> mới trong hàm đối soát đang chạy ổn.</li>
  <li><strong>Logic lẫn vào nhau.</strong> Hàm phình theo số ngân hàng; sửa cách đọc ngày của B có thể làm hỏng A.</li>
  <li><strong>Khó test riêng.</strong> Muốn test cách đọc dữ liệu của C phải đi qua cả hàm đối soát.</li>
  <li><strong>Lỗi lộ ra lúc chạy.</strong> Tên ngân hàng là chuỗi <code>"A"</code>, <code>"B"</code>; gõ nhầm chỉ phát hiện khi có giao dịch thật.</li>
</ul>

<h2>Lời giải</h2>
<p>Định nghĩa một interface chung mà đối soát cần (<strong>Target</strong>). Với mỗi ngân hàng, viết một <strong>Adapter</strong>: nó giữ client của ngân hàng bên trong, gọi đúng hàm của ngân hàng đó và trả về <code>Transaction</code> chuẩn. Đối soát (<strong>Client</strong>) chỉ nhận một danh sách nguồn, không biết có bao nhiêu ngân hàng hay chúng trông thế nào.</p>
${codeTabs({ files: { python: code("adapter.py"), typescript: code("adapter.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Máy đối soát</td><td><code>Reconciler</code></td></tr>
    <tr><td><strong>Target</strong></td><td>Ổ cắm chuẩn hai chân tròn</td><td><code>TransactionSource</code>, <code>Transaction</code></td></tr>
    <tr><td><strong>Adaptee</strong></td><td>Phích cắm tròn, vuông, lục giác</td><td><code>BankAClient</code>, <code>BankBClient</code>, <code>BankCClient</code></td></tr>
    <tr><td><strong>Adapter</strong></td><td>Khối chuyển đổi trên xe trượt</td><td><code>BankAAdapter</code>, <code>BankBAdapter</code>, <code>BankCAdapter</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Cần dùng một lớp có sẵn (SDK bên thứ ba, thư viện, hệ thống cũ) nhưng interface của nó không khớp với interface hệ thống đang dùng, và bạn không sửa được hoặc không nên sửa lớp đó.</li>
  <li>Nhiều nguồn làm cùng một việc theo kiểu khác nhau: nhiều cổng thanh toán, nhiều nhà cung cấp GPS, nhiều nơi lưu file (ổ đĩa, S3), nhiều nhà cung cấp SMS hay email.</li>
  <li>Muốn cô lập phụ thuộc bên ngoài: đổi nhà cung cấp mà không chạm vào nghiệp vụ, hoặc thay bằng bản giả khi test.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ có một nguồn và interface của nó đã đủ dùng: Adapter chỉ thêm một lớp gián tiếp.</li>
  <li>Bạn sở hữu code ở cả hai phía: sửa thẳng cho khớp thường đơn giản hơn.</li>
  <li>Việc "chuyển đổi" thực ra là logic nghiệp vụ lớn (gộp, tách, bù dữ liệu): đó là một service riêng, không còn là adapter.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Facade</strong> cũng bọc thứ có sẵn, nhưng để gom cả một hệ con phức tạp thành một cửa dễ dùng. Adapter đổi một interface sang đúng interface mà client đã đòi.</li>
  <li><strong>Decorator</strong> giữ nguyên interface và thêm hành vi (cache, log, retry). Adapter đổi interface.</li>
  <li><strong>Proxy</strong> giữ nguyên interface và kiểm soát việc truy cập (tải lười, kiểm quyền, cache).</li>
  <li><strong>Bridge</strong> được thiết kế từ đầu để hai chiều biến đổi độc lập với nhau. Adapter thường được thêm vào sau, để nối hai thứ đã có.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Object adapter</strong> (giữ adaptee làm thuộc tính, như ví dụ) linh hoạt hơn <strong>class adapter</strong> (kế thừa adaptee): dùng được cả khi lớp gốc không cho kế thừa, và dễ thay bằng bản giả khi test.</li>
  <li>Giữ adapter mỏng: chỉ đổi tên hàm và hình dạng dữ liệu. Quy tắc nghiệp vụ, ví dụ bỏ qua giao dịch dưới 10.000 ₫, thuộc về hệ thống đối soát.</li>
  <li>Chuẩn hoá đơn vị ngay trong adapter: tiền về số nguyên VND, thời gian về cùng một múi giờ. Lỗi khó tìm nhất thường nằm ở đơn vị và múi giờ.</li>
  <li>Mỗi adapter test riêng được bằng dữ liệu mẫu của đúng ngân hàng đó.</li>
</ul>
`;

const html = patternPage({
  title: "Adapter",
  description: "Adapter pattern: bọc một interface không khớp để dùng như interface hệ thống đang chờ. Hình tương tác, bài toán đối soát nhiều ngân hàng, code Python và TypeScript.",
  group: "Structural",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
