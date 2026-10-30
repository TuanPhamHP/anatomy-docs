// Builds design-patterns/factory-method/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { QUIZ } from "./quiz.mjs";
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
<p class="dp-lead">Factory Method để lớp cha viết sẵn quy trình làm việc với một đối tượng, còn bước tạo ra đối tượng đó thì giao cho một phương thức mà lớp con ghi đè. Quy trình vì thế luôn giữ nguyên, và mỗi lớp con chỉ cần quyết định mình tạo loại nào.</p>

${plate}

<h2>Bài toán</h2>
<p>Khi đơn hàng đã giao xong, hệ thống bán hàng cần báo cho khách biết. Nội dung thì giống nhau, nhưng mỗi kênh lại gửi theo một kiểu riêng:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Kênh</th><th>Gửi tới</th><th>Cách gửi</th><th>Phí</th></tr></thead>
  <tbody>
    <tr><td>Email</td><td><code>lan@example.com</code></td><td>Thêm tiêu đề, giữ nguyên nội dung</td><td>20 ₫</td></tr>
    <tr><td>SMS</td><td><code>0901234567</code></td><td>Bỏ dấu, mỗi tin 160 ký tự</td><td>500 ₫ một tin</td></tr>
    <tr><td>Push</td><td>Máy <code>app-7f3a</code></td><td>Rút gọn còn 28 ký tự cho màn hình khoá</td><td>0 ₫</td></tr>
  </tbody>
</table></div>
<p>Ngoài khác biệt đó ra, kênh nào cũng đi qua đúng một quy trình: tạo một bộ gửi, đưa nội dung vào, gửi đi rồi ghi lại kết quả. Sau này chắc chắn sẽ còn thêm kênh mới, chẳng hạn Zalo hay webhook.</p>

<h2>Khi chưa có Factory Method</h2>
<p>Cách viết thường gặp là dồn hết vào một hàm <code>notify()</code>, để nó tự rẽ nhánh theo tên kênh và tự lo từng kiểu gửi:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử sẽ thấy:</p>
${output(before)}
<ul>
  <li><strong>Thêm kênh là phải sửa phần lõi.</strong> Mỗi kênh mới là thêm một nhánh <code>elif</code> vào hàm đang chạy ổn, và mọi kênh cũ lại phải test lại từ đầu.</li>
  <li><strong>Quy trình chung bị kẹp giữa các nhánh.</strong> Muốn thêm bước ghi log hay thử lại cho mọi kênh, bạn phải chèn vào từng nhánh một.</li>
  <li><strong>Tên kênh chỉ là một chuỗi.</strong> Gõ nhầm thành <code>"Sms"</code> hay gọi một kênh chưa hỗ trợ thì chỉ đến lúc chạy mới lộ ra, giống dòng cuối ở trên.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta tách quy trình gửi ra khỏi bước tạo bộ gửi. Kênh nào cũng tạo ra một bộ gửi theo cùng một interface là <code>Sender</code>, chỉ có một phương thức <code>send()</code>, và đó là Product. Lớp cha <code>Notifier</code> đóng vai Creator, viết sẵn <code>notify()</code> để gọi <code>create_sender()</code> rồi dùng thứ nó trả về.</p>
<p>Chính <code>create_sender()</code> là factory method. Lớp cha chỉ khai báo nó, còn mỗi lớp con như <code>EmailNotifier</code>, <code>SmsNotifier</code> hay <code>PushNotifier</code> ghi đè bằng đúng một dòng tạo đối tượng của mình.</p>
${codeTabs({ files: { python: code("factory.py"), typescript: code("factory.ts") } })}
<p>Chạy thử, bản Python và bản TypeScript in ra giống hệt nhau:</p>
${output(result)}
<p>Dòng cuối minh hoạ một biến thể đơn giản hơn mà code thực tế rất hay dùng, đó là hàm factory <code>sender_for</code> tra bảng tên kênh ra lớp cần tạo. Cách này không cần lớp con, nhưng quyết định chọn lớp lại dồn về một chỗ phải biết hết mọi kênh. Factory Method đúng nghĩa thì đặt quyết định ấy vào lớp con, nên lớp cha không cần biết hệ thống có những kênh nào.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Creator</strong></td><td>Cổng trục và quy trình nó chạy</td><td><code>Notifier.notify()</code></td></tr>
    <tr><td><strong>Factory method</strong></td><td>Trạm tạo ở đầu mỗi làn</td><td><code>create_sender()</code></td></tr>
    <tr><td><strong>Concrete creator</strong></td><td>Ba làn, mỗi làn gắn một trạm tạo riêng</td><td><code>EmailNotifier</code>, <code>SmsNotifier</code>, <code>PushNotifier</code></td></tr>
    <tr><td><strong>Product</strong></td><td>Đĩa hút chuẩn có trên mọi sản phẩm</td><td><code>Sender</code></td></tr>
    <tr><td><strong>Concrete product</strong></td><td>Phong bì, phiếu tin nhắn, viên nang</td><td><code>EmailSender</code>, <code>SmsSender</code>, <code>PushSender</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Bạn có một quy trình chung đã ổn định, và chỉ có một bước trong đó là tạo đối tượng, với loại đối tượng thay đổi theo ngữ cảnh. Kênh thông báo, định dạng file xuất, cổng thanh toán hay kết nối tới từng loại cơ sở dữ liệu đều là những ví dụ quen thuộc.</li>
  <li>Một framework hay thư viện muốn người dùng tự cắm loại đối tượng của họ vào mà không phải sửa code của framework. Lớp cơ sở của một job hay một controller thường có sẵn các phương thức <code>create_*</code> để bạn ghi đè.</li>
  <li>Bạn cần thay đối tượng thật bằng bản giả khi test. Lớp con dành cho test chỉ cần ghi đè phương thức tạo là xong.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ có một loại và chưa có dấu hiệu sẽ thêm loại khác. Gọi thẳng constructor là đủ.</li>
  <li>Không có quy trình chung nào đáng giữ ở lớp cha. Khi đó một hàm factory hay một bảng tra như <code>sender_for</code> gọn hơn nhiều so với cả một cây lớp con.</li>
  <li>Loại đối tượng được chọn lúc chạy theo cấu hình hay dữ liệu, chứ không theo lớp con nào đang chạy. Truyền đối tượng vào từ bên ngoài, tức dependency injection, thường hợp lý hơn.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Abstract Factory</strong> tạo cả một họ đối tượng luôn đi cùng nhau, chẳng hạn bộ gửi, mẫu nội dung và bộ ghi log của cùng một kênh, thông qua một đối tượng factory riêng. Factory Method chỉ là một phương thức tạo một loại đối tượng, nằm ngay trong lớp đang dùng nó.</li>
  <li><strong>Strategy</strong> cũng đổi hành vi bằng cách đổi đối tượng, nhưng đối tượng đó được truyền vào từ bên ngoài và đổi được ngay lúc chạy. Với Factory Method, lớp con tự tạo đối tượng bên trong, và lựa chọn gắn chặt với lớp con.</li>
  <li><strong>Template Method</strong> là họ hàng gần, vì Factory Method thực chất chỉ là một bước của template method, đúng bước tạo đối tượng.</li>
  <li><strong>Builder</strong> lắp một đối tượng phức tạp qua nhiều bước, còn Factory Method trả về một đối tượng hoàn chỉnh chỉ trong một lần gọi.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Factory method nên trả về interface <code>Sender</code> chứ không phải một lớp cụ thể. Nếu lớp cha phải kiểm tra <code>isinstance</code> trên kết quả, interface của bạn đang thiếu một thứ gì đó.</li>
  <li>Lớp cha có thể cho <code>create_sender()</code> một cài đặt mặc định thay vì để trừu tượng, và lớp con nào cần mới ghi đè.</li>
  <li>Hãy đặt tên phương thức theo thứ nó tạo ra, như <code>create_sender</code> hay <code>make_connection</code>, để người đọc lớp con biết ngay mình đang ghi đè điểm nào.</li>
  <li>Khi số lớp con sinh ra chỉ để chọn một constructor ngày càng nhiều, gộp chúng lại thành một hàm factory dùng bảng tra là một bước đơn giản hoá hợp lý.</li>
</ul>
`;

const html = patternPage({
  title: "Factory Method",
  description: "Factory Method để lớp cha giữ quy trình, còn lớp con quyết định tạo đối tượng nào. Bài có hình tương tác, bài toán gửi thông báo qua Email, SMS, Push và code Python, TypeScript.",
  group: "Creational",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
