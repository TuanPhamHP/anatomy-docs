// Builds design-patterns/adapter/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed result comes from running the example, so the page can't drift from the code.
const result = execFileSync("python3", ["-I", code("adapter.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Adapter</h1>
<p class="dp-lead">Adapter giúp hệ thống dùng được một thành phần có interface không khớp với interface mà nó đang chờ. Hệ thống chính không phải sửa gì, vì mỗi nguồn lạ chỉ cần thêm một lớp chuyển đổi nhỏ đứng ở giữa.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung một hệ thống đối soát nhận giao dịch chuyển khoản từ ba ngân hàng. Mỗi ngân hàng có SDK riêng, gọi bằng một hàm riêng và trả dữ liệu theo một kiểu riêng:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Ngân hàng</th><th>Hàm của SDK</th><th>Số tiền</th><th>Thời điểm</th></tr></thead>
  <tbody>
    <tr><td>A</td><td><code>fetch()</code></td><td><code>amount: 1250000</code> (số)</td><td><code>"2026-10-30 09:12:05"</code></td></tr>
    <tr><td>B</td><td><code>get_statement()</code></td><td><code>creditAmount: "860.000"</code> (chuỗi, dấu chấm)</td><td><code>"30/10/2026 10:40"</code></td></tr>
    <tr><td>C</td><td><code>list_txns()</code></td><td><code>txnAmt: "2400000.00"</code> (chuỗi thập phân)</td><td><code>1793333100000</code> (epoch ms)</td></tr>
  </tbody>
</table></div>
<p>Còn hệ thống đối soát thì chỉ muốn làm việc với một kiểu duy nhất là <code>Transaction(amount, reference, booked_at)</code>, với số tiền là số nguyên VND, và chỉ lấy dữ liệu qua một hàm <code>transactions()</code>.</p>

<h2>Khi chưa có Adapter</h2>
<p>Cách làm hay gặp nhất là nhét logic chuyển đổi của mọi ngân hàng vào thẳng hệ thống đối soát:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Mỗi ngân hàng mới đều bắt sửa phần lõi.</strong> Bạn phải thêm một nhánh <code>elif</code> vào chính hàm đối soát đang chạy ổn.</li>
  <li><strong>Logic của các ngân hàng trộn vào nhau.</strong> Hàm phình to theo số ngân hàng, và chỉ cần sửa cách đọc ngày của B là có thể làm hỏng A.</li>
  <li><strong>Rất khó test riêng từng ngân hàng.</strong> Muốn kiểm tra cách đọc dữ liệu của C, bạn vẫn phải chạy qua cả hàm đối soát.</li>
  <li><strong>Lỗi chỉ lộ ra lúc chạy.</strong> Tên ngân hàng là các chuỗi <code>"A"</code>, <code>"B"</code>, nên gõ nhầm một ký tự thì phải đợi có giao dịch thật mới phát hiện ra.</li>
</ul>

<h2>Lời giải</h2>
<p>Trước hết, ta định nghĩa một interface chung, đúng thứ mà hệ thống đối soát cần. Interface này gọi là Target. Sau đó, với mỗi ngân hàng, ta viết một Adapter giữ client của ngân hàng đó ở bên trong, gọi đúng hàm của nó và trả về <code>Transaction</code> chuẩn.</p>
<p>Hệ thống đối soát đóng vai Client. Nó chỉ nhận một danh sách nguồn dữ liệu, và không cần biết có bao nhiêu ngân hàng hay dữ liệu gốc của chúng trông ra sao.</p>
${codeTabs({ files: { python: code("adapter.py"), typescript: code("adapter.ts") } })}
<p>Khi chạy, bản Python và bản TypeScript in ra cùng một kết quả:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Máy đối soát</td><td><code>Reconciler</code></td></tr>
    <tr><td><strong>Target</strong></td><td>Ổ cắm chuẩn hai chân tròn</td><td><code>TransactionSource</code>, <code>Transaction</code></td></tr>
    <tr><td><strong>Adaptee</strong></td><td>Phích cắm tròn, vuông và lục giác</td><td><code>BankAClient</code>, <code>BankBClient</code>, <code>BankCClient</code></td></tr>
    <tr><td><strong>Adapter</strong></td><td>Khối chuyển đổi trên xe trượt</td><td><code>BankAAdapter</code>, <code>BankBAdapter</code>, <code>BankCAdapter</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi bạn cần dùng một lớp có sẵn, như SDK của bên thứ ba, một thư viện hay một hệ thống cũ, nhưng interface của nó không khớp với interface hệ thống đang dùng, và bạn không sửa được hoặc không nên sửa lớp đó.</li>
  <li>Khi có nhiều nguồn cùng làm một việc nhưng mỗi nguồn làm theo một kiểu, chẳng hạn nhiều cổng thanh toán, nhiều nhà cung cấp GPS, nhiều nơi lưu file như ổ đĩa hay S3, hoặc nhiều nhà cung cấp SMS và email.</li>
  <li>Khi bạn muốn cô lập phụ thuộc bên ngoài, để đổi nhà cung cấp mà không chạm vào nghiệp vụ, hoặc để thay bằng một bản giả khi test.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi chỉ có một nguồn và interface của nó đã đủ dùng. Lúc đó Adapter chỉ thêm một lớp gián tiếp không cần thiết.</li>
  <li>Khi bạn nắm code ở cả hai phía. Sửa thẳng cho hai bên khớp nhau thường đơn giản hơn.</li>
  <li>Khi phần chuyển đổi thực chất là logic nghiệp vụ lớn như gộp, tách hay bù dữ liệu. Đó đã là một service riêng chứ không còn là adapter nữa.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Facade</strong> cũng bọc những thứ có sẵn, nhưng để gom cả một hệ con phức tạp thành một cửa dễ dùng. Adapter thì đổi một interface sang đúng interface mà client đã yêu cầu.</li>
  <li><strong>Decorator</strong> giữ nguyên interface và thêm hành vi như cache, log hay retry, còn Adapter thì đổi interface.</li>
  <li><strong>Proxy</strong> cũng giữ nguyên interface, nhưng dùng để kiểm soát quyền truy cập vào đối tượng thật, chẳng hạn tải lười, kiểm quyền hoặc cache.</li>
  <li><strong>Bridge</strong> là thiết kế có chủ đích ngay từ đầu, để hai chiều thay đổi độc lập với nhau. Adapter thì thường xuất hiện về sau, để nối hai thứ đã có sẵn.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Nên chọn object adapter thay vì class adapter.</strong> Giữ adaptee làm thuộc tính như trong ví dụ linh hoạt hơn kế thừa nó, vì cách này vẫn dùng được khi lớp gốc không cho kế thừa, và dễ thay bằng bản giả khi test.</li>
  <li><strong>Hãy giữ adapter thật mỏng.</strong> Adapter chỉ nên đổi tên hàm và hình dạng dữ liệu. Các quy tắc nghiệp vụ, ví dụ bỏ qua giao dịch dưới 10.000 ₫, thuộc về hệ thống đối soát.</li>
  <li><strong>Chuẩn hoá đơn vị ngay trong adapter.</strong> Tiền nên về số nguyên VND và thời gian về cùng một múi giờ, vì những lỗi khó tìm nhất thường nằm ở đơn vị và múi giờ.</li>
  <li><strong>Mỗi adapter nên có test riêng.</strong> Bạn kiểm tra nó bằng dữ liệu mẫu của đúng ngân hàng đó, không cần dựng cả hệ thống đối soát.</li>
</ul>
`;

const html = patternPage({
  title: "Adapter",
  description: "Adapter giúp hệ thống dùng được một thành phần có interface không khớp. Bài học có hình tương tác, bài toán đối soát giao dịch từ nhiều ngân hàng và code Python, TypeScript.",
  group: "Structural",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
