// Builds design-patterns/template-method/index.html: the figure, then the lesson.
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
const result = execFileSync("python3", ["-I", code("template-method.py")], { encoding: "utf8" }).trimEnd();
const before = execFileSync("python3", ["-I", code("before.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Template Method</h1>
<p class="dp-lead">Template Method đặt khung của một thuật toán vào một phương thức ở lớp cha, và lớp cha quyết định các bước chạy theo thứ tự nào. Lớp con chỉ viết những bước còn để trống, và khi cần thì ghi đè thêm vài bước tuỳ chọn, thường gọi là hook.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống bán hàng cần xuất báo cáo đơn hàng trong ngày ra nhiều định dạng. Kế toán cần file CSV để mở bằng bảng tính, kho dữ liệu cần JSON Lines, còn ngân hàng nhận một file có độ rộng cố định. Dù là định dạng nào, báo cáo cũng phải đi qua cùng bốn bước:</p>
<ol>
  <li><strong>Đọc</strong> các đơn hàng trong ngày, ở ví dụ này có sáu đơn.</li>
  <li><strong>Lọc</strong> bỏ hai đơn đã huỷ, chỉ giữ lại bốn đơn đã thanh toán.</li>
  <li><strong>Định dạng</strong> từng dòng, có thể kèm một dòng đầu gọi là header và một dòng cuối gọi là footer.</li>
  <li><strong>Ghi</strong> ra file và báo lại số dòng đã ghi.</li>
</ol>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Định dạng</th><th>Header</th><th>Một dòng</th><th>Footer</th></tr></thead>
  <tbody>
    <tr><td>CSV</td><td><code>ma_don,so_tien</code></td><td><code>DH-101,1250000</code></td><td>không có</td></tr>
    <tr><td>JSON Lines</td><td>không có</td><td><code>{"ma_don":"DH-101","so_tien":1250000}</code></td><td>không có</td></tr>
    <tr><td>Fixed-width</td><td><code>H20261030BAOCAO</code></td><td><code>DDH-101&nbsp;&nbsp;000001250000</code></td><td><code>T000004000004565000</code>, gồm số dòng và tổng tiền</td></tr>
  </tbody>
</table></div>
<p>Chỉ có bước định dạng là khác nhau. Ba bước đọc, lọc và ghi phải giống hệt nhau ở mọi định dạng, nếu không ba file sẽ cho ra ba con số khác nhau.</p>

<h2>Khi chưa có Template Method</h2>
<p>Cách làm thường gặp là viết hàm export cho định dạng đầu tiên, rồi chép nó ra và sửa lại cho định dạng tiếp theo.</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử bản này, hai file cho ra hai con số khác nhau:</p>
${output(before)}
<ul>
  <li><strong>Hai bản chép dần trôi xa nhau.</strong> Bản JSON Lines quên bước lọc nên xuất luôn cả hai đơn đã huỷ, thành sáu đơn với tổng 6.525.000 ₫ thay vì bốn đơn với tổng 4.565.000 ₫. Không có lỗi nào được báo, chỉ có con số sai.</li>
  <li><strong>Sửa một quy tắc là phải sửa ở nhiều nơi.</strong> Muốn thêm điều kiện bỏ đơn thử nghiệm, bạn phải nhớ sửa mọi hàm export, và hàm nào bị sót thì ra số sai.</li>
  <li><strong>Không có gì giữ thứ tự các bước.</strong> Một hàm hoàn toàn có thể định dạng trước rồi mới lọc, hoặc ghi file trước khi tính xong số dòng.</li>
  <li><strong>Phần khác nhau bị chìm giữa phần giống nhau.</strong> Người đọc phải tự dò xem dòng nào là logic chung, dòng nào là của riêng định dạng đó.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta đưa khung vào phương thức <code>export()</code> của lớp cha <code>ReportExporter</code>, và phương thức này chính là template method. Nó luôn gọi các bước theo cùng một thứ tự là đọc, lọc, viết header, định dạng từng đơn, viết footer rồi ghi file.</p>
<p>Ba bước đọc, lọc và ghi được viết một lần ở lớp cha. Bước định dạng <code>format_row()</code> là bước bắt buộc, tức một phương thức abstract mà lớp con nào cũng phải viết. Còn <code>header()</code> và <code>footer()</code> là hook. Lớp cha cho sẵn bản mặc định không làm gì, và lớp con chỉ ghi đè khi định dạng của nó cần.</p>
${codeTabs({ files: { python: code("template-method.py"), typescript: code("template-method.ts") } })}
<p>Chạy thử, bản Python và bản TypeScript in ra cùng một kết quả:</p>
${output(result)}
<p>Ba file có số dòng khác nhau, lần lượt là năm, bốn và sáu dòng, vì header và footer của chúng khác nhau. Nhưng cả ba đều đọc sáu đơn, bỏ hai đơn huỷ và có cùng tổng 4.565.000 ₫, vì đó là phần khung dùng chung.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Abstract class</strong></td><td>Cả cỗ máy, gồm đế, bàn xoay và bốn trạm</td><td><code>ReportExporter</code></td></tr>
    <tr><td><strong>Template method</strong></td><td>Bàn xoay chia độ cùng chốt định vị, giữ cho thứ tự các trạm không đổi</td><td><code>export()</code></td></tr>
    <tr><td><strong>Bước dùng chung</strong></td><td>Phễu cấp, tay gắp lọc, tay gắp ghi và bộ đếm</td><td><code>read_orders()</code>, <code>keep_valid()</code>, <code>write()</code></td></tr>
    <tr><td><strong>Bước bắt buộc</strong></td><td>Khuôn ở trạm định dạng</td><td><code>format_row()</code>, là phương thức abstract</td></tr>
    <tr><td><strong>Hook</strong></td><td>Hộp nhãn ở hai đầu khuôn, tuỳ khuôn mà có hoặc không</td><td><code>header()</code>, <code>footer()</code></td></tr>
    <tr><td><strong>Concrete class</strong></td><td>Ba khuôn trên giá</td><td><code>CsvExporter</code>, <code>JsonLinesExporter</code>, <code>FixedWidthExporter</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi nhiều biến thể chạy cùng một quy trình nhiều bước và chỉ khác nhau ở vài bước. Ví dụ là xuất báo cáo ra nhiều định dạng, nhập file từ nhiều nguồn với cùng các bước đọc, kiểm tra, chuyển đổi và lưu, hay gửi thông báo qua nhiều kênh nhưng cùng cách chọn người nhận và ghi log.</li>
  <li>Khi thứ tự các bước là một quy tắc cần giữ, chẳng hạn luôn kiểm tra quyền trước khi xử lý, hay luôn mở transaction rồi mới ghi.</li>
  <li>Khi bạn viết framework hoặc lớp cơ sở cho người khác mở rộng. Họ chỉ cần điền vào chỗ trống mà không làm hỏng luồng chung, và nhiều framework dùng đúng cách này cho vòng đời của request, job hay test, như cặp <code>setUp</code> và <code>tearDown</code>.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Nếu chỉ có một biến thể, một hàm bình thường là đủ.</li>
  <li>Nếu các biến thể khác nhau ở gần như mọi bước, khung chung chỉ còn là cái vỏ và lớp con nào cũng phải ghi đè hết.</li>
  <li>Nếu cần đổi phần khác nhau lúc chạy, hoặc ghép nhiều phần khác nhau lại với nhau, thì Strategy linh hoạt hơn. Kế thừa chốt lựa chọn ngay lúc viết code, còn Strategy cho phép truyền một đối tượng khác vào.</li>
  <li>Nếu cây kế thừa đã sâu, thêm một tầng lớp cha nữa chỉ làm code khó theo dõi hơn.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Strategy</strong> cũng tách phần thay đổi ra ngoài, nhưng bằng một đối tượng được truyền vào và có thể đổi lúc chạy, còn khung thì nằm ở đối tượng dùng nó. Template Method dùng kế thừa, phần thay đổi là các phương thức lớp con ghi đè, và lớp cha giữ trọn khung. Trong hình, nếu khuôn là một đối tượng cắm vào máy lúc chạy thì đó là Strategy, còn ở đây mỗi khuôn là một lớp con của chính cỗ máy.</li>
  <li><strong>Factory Method</strong> thường là một bước nằm trong Template Method. Khung có một bước tạo đối tượng, và lớp con quyết định tạo loại nào.</li>
  <li><strong>Hook trong framework</strong>, như callback hay event, có cùng ý tưởng với hook ở đây, nhưng thường được đăng ký từ bên ngoài thay vì ghi đè trong lớp con.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Đừng để lớp con ghi đè template method. TypeScript và Python không có <code>final</code> thật sự cho phương thức, Python chỉ có <code>typing.final</code> dành cho công cụ kiểm tra kiểu, nên hãy đặt tên rõ ràng và ghi chú lại. Java thì dùng <code>final</code>, còn C# chỉ cần không khai báo phương thức là <code>virtual</code>.</li>
  <li>Hãy phân biệt rõ bước bắt buộc, tức phương thức abstract không có thân, với hook vốn có sẵn bản mặc định. Càng ít bước bắt buộc thì viết lớp con mới càng dễ.</li>
  <li>Nếu lớp con không nên gọi hay ghi đè các bước dùng chung, hãy để chúng ở mức <code>protected</code> hoặc đặt tên bắt đầu bằng dấu <code>_</code>.</li>
  <li>Hãy test khung một lần bằng một lớp con giả, chẳng hạn một exporter ghi vào list, rồi test từng lớp con chỉ ở phần định dạng của nó.</li>
</ul>
`;

const html = patternPage({
  title: "Template Method",
  description: "Template Method để lớp cha giữ khung thuật toán và thứ tự các bước, còn lớp con chỉ viết những bước riêng. Bài có hình tương tác, bài toán xuất báo cáo nhiều định dạng và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
