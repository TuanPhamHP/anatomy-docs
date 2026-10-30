// Builds design-patterns/template-method/index.html: the figure, then the lesson.
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
const result = execFileSync("python3", ["-I", code("template-method.py")], { encoding: "utf8" }).trimEnd();
const before = execFileSync("python3", ["-I", code("before.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Template Method</h1>
<p class="dp-lead">Template Method đặt khung của một thuật toán vào một hàm ở lớp cha: các bước chạy theo thứ tự nào do lớp cha quyết định và không đổi. Lớp con chỉ viết những bước được để trống (bước bắt buộc) và, nếu cần, ghi đè vài bước tuỳ chọn (hook).</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống bán hàng cần xuất báo cáo đơn hàng trong ngày ra nhiều định dạng: CSV cho kế toán mở bằng bảng tính, JSON Lines cho kho dữ liệu, và một file độ rộng cố định gửi ngân hàng. Định dạng nào cũng phải đi qua cùng các bước:</p>
<ol>
  <li><strong>Đọc</strong> đơn hàng trong ngày (ví dụ có 6 đơn).</li>
  <li><strong>Lọc</strong> bỏ đơn đã huỷ (2 đơn), chỉ xuất 4 đơn đã thanh toán.</li>
  <li><strong>Định dạng</strong> từng dòng, có thể kèm dòng đầu (header) và dòng cuối (footer).</li>
  <li><strong>Ghi</strong> file và báo số dòng đã ghi.</li>
</ol>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Định dạng</th><th>Header</th><th>Một dòng</th><th>Footer</th></tr></thead>
  <tbody>
    <tr><td>CSV</td><td><code>ma_don,so_tien</code></td><td><code>DH-101,1250000</code></td><td>không có</td></tr>
    <tr><td>JSON Lines</td><td>không có</td><td><code>{"ma_don":"DH-101","so_tien":1250000}</code></td><td>không có</td></tr>
    <tr><td>Fixed-width</td><td><code>H20261030BAOCAO</code></td><td><code>DDH-101&nbsp;&nbsp;000001250000</code></td><td><code>T000004000004565000</code> (số dòng, tổng tiền)</td></tr>
  </tbody>
</table></div>
<p>Chỉ bước định dạng là khác nhau. Đọc, lọc và ghi phải giống hệt nhau ở mọi định dạng, nếu không ba file sẽ cho ba con số khác nhau.</p>

<h2>Khi chưa có Template Method</h2>
<p>Cách làm thường gặp là viết hàm export cho định dạng đầu tiên, rồi chép ra và sửa cho định dạng tiếp theo:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Kết quả khi chạy:</p>
${output(before)}
<ul>
  <li><strong>Hai bản chép trôi xa nhau.</strong> Bản JSON Lines quên bước lọc, nên xuất cả 2 đơn đã huỷ: 6 đơn, 6.525.000 ₫ thay vì 4 đơn, 4.565.000 ₫. Không có lỗi nào được báo, chỉ có số sai.</li>
  <li><strong>Sửa một quy tắc là sửa N chỗ.</strong> Thêm điều kiện "bỏ đơn thử nghiệm" phải nhớ sửa mọi hàm export; hàm nào sót thì sai.</li>
  <li><strong>Thứ tự các bước không được giữ.</strong> Không có gì ngăn một hàm định dạng trước rồi mới lọc, hay ghi file trước khi tính số dòng.</li>
  <li><strong>Phần khác nhau bị chìm.</strong> Đọc hàm phải tự dò xem dòng nào là logic chung, dòng nào là của riêng định dạng đó.</li>
</ul>

<h2>Lời giải</h2>
<p>Đưa khung vào một hàm <code>export()</code> ở lớp cha <code>ReportExporter</code> (<strong>template method</strong>). Nó gọi các bước theo đúng thứ tự: đọc, lọc, <code>header()</code>, <code>format_row()</code> cho từng đơn, <code>footer()</code>, ghi. Đọc, lọc và ghi được viết một lần ở lớp cha. <code>format_row()</code> là bước bắt buộc (abstract): lớp con nào cũng phải viết. <code>header()</code> và <code>footer()</code> là <strong>hook</strong>: lớp cha cho sẵn bản mặc định không làm gì, lớp con ghi đè khi định dạng của nó cần.</p>
${codeTabs({ files: { python: code("template-method.py"), typescript: code("template-method.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}
<p>Ba file có số dòng khác nhau (5, 4, 6) vì header và footer khác nhau, nhưng cùng đọc 6 đơn, cùng bỏ 2 đơn huỷ và cùng tổng 4.565.000 ₫, vì đó là phần khung dùng chung.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Abstract class</strong></td><td>Cả cỗ máy: đế, bàn xoay và bốn trạm</td><td><code>ReportExporter</code></td></tr>
    <tr><td><strong>Template method</strong></td><td>Bàn xoay chia độ và chốt định vị: thứ tự các trạm không đổi</td><td><code>export()</code></td></tr>
    <tr><td><strong>Bước dùng chung</strong></td><td>Phễu cấp, tay gắp lọc, tay gắp ghi và bộ đếm</td><td><code>read_orders()</code>, <code>keep_valid()</code>, <code>write()</code></td></tr>
    <tr><td><strong>Bước bắt buộc</strong></td><td>Khuôn ở trạm định dạng</td><td><code>format_row()</code> (abstract)</td></tr>
    <tr><td><strong>Hook</strong></td><td>Hộp nhãn ở hai đầu khuôn, có hoặc không</td><td><code>header()</code>, <code>footer()</code></td></tr>
    <tr><td><strong>Concrete class</strong></td><td>Ba khuôn trên giá</td><td><code>CsvExporter</code>, <code>JsonLinesExporter</code>, <code>FixedWidthExporter</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Nhiều biến thể chạy cùng một quy trình nhiều bước và chỉ khác nhau ở vài bước: xuất báo cáo nhiều định dạng, nhập file từ nhiều nguồn (đọc, kiểm tra, chuyển đổi, lưu), gửi thông báo qua nhiều kênh với cùng bước chọn người nhận và ghi log.</li>
  <li>Thứ tự các bước là một quy tắc cần giữ, ví dụ luôn kiểm tra quyền trước khi xử lý, hay luôn mở transaction rồi mới ghi.</li>
  <li>Bạn viết framework hoặc lớp cơ sở để người khác mở rộng: họ chỉ điền vào chỗ trống mà không làm hỏng luồng chung. Nhiều framework dùng cách này cho vòng đời của request, job hay test (<code>setUp</code>, <code>tearDown</code>).</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ có một biến thể: một hàm bình thường là đủ.</li>
  <li>Các biến thể khác nhau ở gần như mọi bước: khung chung chỉ còn là vỏ, và lớp con phải ghi đè hết.</li>
  <li>Cần đổi phần khác nhau lúc chạy, hoặc ghép nhiều phần khác nhau với nhau: kế thừa cố định lựa chọn lúc viết code, nên Strategy (truyền object vào) linh hoạt hơn.</li>
  <li>Cây kế thừa đã sâu: thêm một tầng lớp cha nữa làm code khó theo dõi hơn.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Strategy</strong> cũng tách phần thay đổi ra, nhưng bằng một object được truyền vào và có thể đổi lúc chạy, còn khung thì nằm ở object dùng nó. Template Method dùng kế thừa: phần thay đổi là các hàm lớp con ghi đè, và lớp cha giữ cả khung. Trong hình, nếu khuôn là một object cắm vào máy lúc chạy thì đó là Strategy; ở đây mỗi khuôn là một lớp con của chính cỗ máy.</li>
  <li><strong>Factory Method</strong> thường là một bước của Template Method: một bước trong khung tạo object, và lớp con quyết định tạo loại nào.</li>
  <li><strong>Hook trong framework</strong> (callback, event) giống hook ở đây về ý, nhưng thường được đăng ký từ ngoài vào thay vì ghi đè trong lớp con.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Đừng để lớp con ghi đè template method. TypeScript và Python không có <code>final</code> thật cho phương thức (Python có <code>typing.final</code> cho công cụ kiểm tra kiểu), nên hãy đặt tên rõ và ghi chú; Java dùng <code>final</code>, C# để phương thức không <code>virtual</code>.</li>
  <li>Phân biệt rõ bước bắt buộc (abstract, không có thân) và hook (có bản mặc định). Càng ít bước bắt buộc, viết lớp con mới càng dễ.</li>
  <li>Giữ các bước dùng chung ở lớp cha <code>protected</code> hoặc đặt tên bắt đầu bằng <code>_</code> nếu lớp con không nên gọi hay ghi đè chúng.</li>
  <li>Test khung một lần bằng một lớp con giả (ví dụ một exporter ghi vào list), rồi test từng lớp con chỉ ở phần định dạng của nó.</li>
</ul>
`;

const html = patternPage({
  title: "Template Method",
  description: "Template Method pattern: lớp cha giữ khung thuật toán và thứ tự các bước, lớp con chỉ viết các bước riêng. Hình tương tác, bài toán xuất báo cáo nhiều định dạng, code Python và TypeScript.",
  group: "Behavioral",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
