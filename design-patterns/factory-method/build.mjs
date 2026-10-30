// Builds design-patterns/factory-method/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { CHANNELS, line } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// --debug writes shots/debug.html with a seek hook for checking poses; it is never published.
const DEBUG = process.argv.includes("--debug");
const SEEK = `\nwindow.__seek = (index, before, at) => { touring = false; cancelAnimationFrame(frame); frame = -1; prev = before; cur = sel = index; pending = -1; u = at; draw(); return readout.textContent; };`;
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (name) => execFileSync("python3", ["-I", code(name)], { encoding: "utf8" }).trimEnd();
const result = run("factory.py");
const before = run("before.py");

// The figure's model must print exactly what the Python example prints.
const expected = CHANNELS.map(line).join("\n");
if (!result.startsWith(expected)) throw new Error(`model.mjs and factory.py disagree:\n${expected}\n---\n${result}`);

const body = `
<p class="dp-eyebrow">Creational pattern</p>
<h1>Factory Method</h1>
<p class="dp-lead">Factory Method để lớp cha viết sẵn quy trình làm việc với một object, nhưng giao việc tạo object đó cho một phương thức mà lớp con ghi đè. Quy trình giữ nguyên; mỗi lớp con chỉ quyết định tạo loại nào.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống bán hàng cần báo cho khách khi đơn đã giao. Cùng một nội dung, nhưng mỗi kênh gửi một kiểu:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Kênh</th><th>Gửi tới</th><th>Cách gửi</th><th>Phí</th></tr></thead>
  <tbody>
    <tr><td>Email</td><td><code>lan@example.com</code></td><td>Thêm tiêu đề, giữ nguyên nội dung</td><td>20 ₫</td></tr>
    <tr><td>SMS</td><td><code>0901234567</code></td><td>Bỏ dấu, 160 ký tự một tin</td><td>500 ₫ một tin</td></tr>
    <tr><td>Push</td><td>Máy <code>app-7f3a</code></td><td>Rút gọn còn 28 ký tự cho màn hình khoá</td><td>0 ₫</td></tr>
  </tbody>
</table></div>
<p>Phần còn lại của việc thông báo thì kênh nào cũng như nhau: tạo một bộ gửi, đưa nội dung vào, gửi đi, ghi lại kết quả. Sau này sẽ còn thêm kênh mới như Zalo hay webhook.</p>

<h2>Khi chưa có Factory Method</h2>
<p>Cách viết thường gặp là một hàm <code>notify()</code> tự rẽ nhánh theo tên kênh và tự làm hết từng kiểu gửi:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Kết quả khi chạy:</p>
${output(before)}
<ul>
  <li><strong>Thêm kênh là sửa lõi.</strong> Kênh mới là một nhánh <code>elif</code> mới trong hàm đang chạy ổn, và mọi kênh cũ phải test lại.</li>
  <li><strong>Quy trình chung bị kẹp giữa các nhánh.</strong> Muốn thêm bước ghi log hay thử lại cho mọi kênh, phải chèn vào từng nhánh một.</li>
  <li><strong>Tên kênh là chuỗi.</strong> Gõ nhầm <code>"Sms"</code> hay kênh chưa hỗ trợ chỉ lộ ra lúc chạy, như dòng cuối ở trên.</li>
</ul>

<h2>Lời giải</h2>
<p>Tách hai việc ra. Mọi kênh đều trả về một <strong>Product</strong> chung là <code>Sender</code> với một hàm <code>send()</code>. Lớp cha <code>Notifier</code> (<strong>Creator</strong>) viết sẵn <code>notify()</code>: gọi <code>create_sender()</code> rồi dùng thứ nó trả về. Chính <code>create_sender()</code> là <strong>factory method</strong>: lớp cha chỉ khai báo, mỗi lớp con (<code>EmailNotifier</code>, <code>SmsNotifier</code>, <code>PushNotifier</code>) ghi đè bằng đúng một dòng tạo object của mình.</p>
${codeTabs({ files: { python: code("factory.py"), typescript: code("factory.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}
<p>Dòng cuối là biến thể đơn giản hơn mà code thực tế hay dùng: một <strong>hàm factory</strong> (<code>sender_for</code>) tra bảng tên kênh ra lớp cần tạo. Nó không cần lớp con, nhưng việc chọn lớp lại dồn về một chỗ biết mọi kênh. Factory Method đúng nghĩa đặt quyết định đó vào lớp con, để lớp cha không phải biết có những kênh nào.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Creator</strong></td><td>Cổng trục và quy trình nó chạy</td><td><code>Notifier.notify()</code></td></tr>
    <tr><td><strong>Factory method</strong></td><td>Trạm tạo ở đầu mỗi làn</td><td><code>create_sender()</code></td></tr>
    <tr><td><strong>Concrete creator</strong></td><td>Ba làn, mỗi làn gắn trạm tạo riêng</td><td><code>EmailNotifier</code>, <code>SmsNotifier</code>, <code>PushNotifier</code></td></tr>
    <tr><td><strong>Product</strong></td><td>Đĩa hút chuẩn trên mọi sản phẩm</td><td><code>Sender</code></td></tr>
    <tr><td><strong>Concrete product</strong></td><td>Phong bì, phiếu tin nhắn, viên nang</td><td><code>EmailSender</code>, <code>SmsSender</code>, <code>PushSender</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Có một quy trình chung đã ổn định, và chỉ một bước trong đó là tạo object với loại thay đổi theo ngữ cảnh: kênh thông báo, định dạng file xuất, cổng thanh toán, kết nối tới từng loại cơ sở dữ liệu.</li>
  <li>Framework hay thư viện muốn cho người dùng tự cắm loại object của họ vào mà không phải sửa code của framework, ví dụ lớp cơ sở của một job hay một controller có hàm <code>create_*</code> để ghi đè.</li>
  <li>Cần thay object thật bằng bản giả khi test: lớp con cho test chỉ ghi đè hàm tạo.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ có một loại và chưa có dấu hiệu sẽ thêm: gọi thẳng constructor là đủ.</li>
  <li>Không có quy trình chung đáng giữ ở lớp cha: một hàm factory hay một bảng tra (như <code>sender_for</code>) gọn hơn nhiều so với một cây lớp con.</li>
  <li>Loại object được chọn lúc chạy theo cấu hình hay dữ liệu, không theo loại lớp: truyền object vào từ ngoài (dependency injection) thường hợp hơn.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Abstract Factory</strong> tạo cả một họ object luôn đi cùng nhau (ví dụ bộ gửi, mẫu nội dung và bộ ghi log của cùng một kênh) qua một object factory riêng. Factory Method chỉ là một phương thức tạo một loại object, nằm trong lớp đang dùng nó.</li>
  <li><strong>Strategy</strong> cũng đổi hành vi bằng cách đổi object, nhưng object được truyền vào từ ngoài và đổi được lúc chạy. Factory Method để lớp con tự tạo object bên trong, và lựa chọn gắn với lớp con.</li>
  <li><strong>Template Method</strong> là họ hàng gần: Factory Method thực chất là một bước của template method, đúng bước tạo object.</li>
  <li><strong>Builder</strong> lắp một object phức tạp qua nhiều bước. Factory Method trả về object hoàn chỉnh trong một lần gọi.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Kiểu trả về của factory method là interface (<code>Sender</code>), không phải lớp cụ thể. Nếu lớp cha phải kiểm tra <code>isinstance</code> trên kết quả thì interface đang thiếu gì đó.</li>
  <li>Lớp cha có thể cho <code>create_sender()</code> một cài đặt mặc định thay vì để trừu tượng; lớp con nào cần mới ghi đè.</li>
  <li>Đặt tên hàm theo thứ nó tạo (<code>create_sender</code>, <code>make_connection</code>) để người đọc lớp con biết ngay mình đang ghi đè điểm nào.</li>
  <li>Khi số lớp con chỉ để chọn một constructor ngày càng nhiều, gộp chúng thành một hàm factory với bảng tra là bước đơn giản hoá hợp lý.</li>
</ul>
`;

const html = patternPage({
  title: "Factory Method",
  description: "Factory Method pattern: lớp cha giữ quy trình, lớp con quyết định tạo object nào. Hình tương tác, bài toán gửi thông báo qua Email, SMS, Push, code Python và TypeScript.",
  group: "Creational",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
