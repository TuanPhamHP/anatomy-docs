// Builds design-patterns/proxy/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// `node build.mjs --debug` writes shots/debug.html with a hook to freeze the timeline at any time, for checks.
const DEBUG = process.argv.includes("--debug");
const SEEK = `\nwindow.__seek = (at) => { touring = false; cancelAnimationFrame(frame); frame = -1; t = at; draw(); return readout.textContent; };`;
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (file) => execFileSync("python3", ["-I", code(file)], { encoding: "utf8" }).trimEnd();
const result = run("proxy.py");
const before = run("before.py");

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Proxy</h1>
<p class="dp-lead">Proxy là một đối tượng đứng thay cho đối tượng thật và có đúng interface của nó. Mọi lời gọi đều đi qua proxy trước, nên nó có thể kiểm quyền, hoãn tạo một đối tượng tốn kém cho tới khi thật sự cần, hoặc giữ lại kết quả để lần sau khỏi làm lại. Chỗ gọi không cần biết phía sau là proxy.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống có một báo cáo thường niên dài 1.240 trang, và tải nó từ kho lưu trữ mất khoảng 2,4 giây. Chỉ hai vai trò <code>ke-toan</code> và <code>giam-doc</code> được phép đọc. Giả sử có ba lượt đọc lần lượt như sau:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Lượt</th><th>Người đọc</th><th>Vai trò</th><th>Được đọc?</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Khách</td><td><code>khach</code></td><td>Không</td></tr>
    <tr><td>2</td><td>Kế toán</td><td><code>ke-toan</code></td><td>Có</td></tr>
    <tr><td>3</td><td>Kế toán đọc lại</td><td><code>ke-toan</code></td><td>Có</td></tr>
  </tbody>
</table></div>
<p>Ta muốn người không có quyền bị chặn trước khi hệ thống tốn bất kỳ giây nào, và báo cáo chỉ tải đúng một lần, dù được đọc bao nhiêu lần đi nữa.</p>

<h2>Khi chưa có Proxy</h2>
<p>Cách làm thường thấy là chỗ nào cần báo cáo thì tự tạo nó rồi tự kiểm quyền:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử, ta được kết quả này.</p>
${output(before)}
<ul>
  <li><strong>Người bị từ chối vẫn làm hệ thống tải báo cáo.</strong> Báo cáo được tạo trước khi kiểm quyền, nên lượt đọc của khách vẫn tốn 2,4 giây.</li>
  <li><strong>Mỗi lần đọc lại tải lại từ đầu.</strong> Ba lượt đọc là ba lần tải, tổng cộng 7,2 giây, dù báo cáo không hề đổi.</li>
  <li><strong>Điều kiện kiểm quyền bị chép khắp nơi.</strong> Màn hình nào, job xuất file nào cũng phải chép lại điều kiện vai trò, và chỉ cần quên ở một chỗ là báo cáo bị lộ.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta giữ một interface chung đóng vai Subject, ở đây là <code>Report</code> với phương thức <code>read(user)</code>. Báo cáo thật, gọi là RealSubject, vẫn giữ nguyên như cũ.</p>
<p>Sau đó ta thêm một Proxy có cùng interface. Proxy kiểm quyền trước, chỉ tạo báo cáo thật ở lần đọc hợp lệ đầu tiên rồi giữ nó lại, sau đó chuyển lời gọi sang báo cáo thật. Chỗ gọi đóng vai Client, nhận một <code>Report</code> và không biết đó là proxy.</p>
${codeTabs({ files: { python: code("proxy.py"), typescript: code("proxy.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Vẫn ba lượt đọc ấy, nhưng từ ba lần tải và 7,2 giây giờ chỉ còn một lần tải và 2,4 giây. Khách bị chặn mà hệ thống không tốn gì.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Bàn người đọc với nút chuông gọi</td><td><code>show()</code></td></tr>
    <tr><td><strong>Subject</strong></td><td>Cửa nâng giống hệt nhau ở quầy và ở kho</td><td><code>Report</code></td></tr>
    <tr><td><strong>Proxy</strong></td><td>Quầy nhỏ có khoá chìa và cờ từ chối, giữ khay báo cáo sau lần tải đầu</td><td><code>ReportProxy</code></td></tr>
    <tr><td><strong>RealSubject</strong></td><td>Báo cáo nằm trong kho nặng, có bánh xe khoá và bộ đếm lần tải</td><td><code>AnnualReport</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li><strong>Virtual proxy</strong> dùng để tải lười. Nó hợp với những đối tượng tạo ra rất tốn kém, như file lớn, kết nối hay model nặng, nhưng không phải lúc nào cũng được dùng. ORM áp dụng đúng ý này cho các quan hệ tải lười.</li>
  <li><strong>Protection proxy</strong> dùng để kiểm quyền. Cùng một đối tượng nhưng mỗi người được làm những việc khác nhau, và bạn muốn kiểm ở một chỗ thay vì ở mọi nơi gọi.</li>
  <li><strong>Caching proxy</strong> giữ lại kết quả. Khi kết quả của đối tượng thật đắt và ít đổi, như gọi API bên ngoài hay truy vấn báo cáo, proxy trả lại kết quả cũ cho tới khi hết hạn.</li>
  <li><strong>Remote proxy</strong> đại diện cho một đối tượng nằm ở service khác. Client gọi như gọi hàm bình thường, còn proxy lo gửi request và đọc response, giống các client sinh ra từ gRPC hay OpenAPI.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi đối tượng thật rẻ và lúc nào cũng được dùng. Tải lười lúc đó chỉ thêm một tầng gián tiếp và khiến lỗi lộ ra muộn hơn.</li>
  <li>Khi quyền đã được kiểm ở tầng ngoài, như middleware hay API gateway, cho mọi đường vào. Kiểm thêm ở proxy chỉ là lặp lại.</li>
  <li>Khi dữ liệu đổi liên tục mà proxy lại giữ bản cũ. Bạn phải tính chuyện hết hạn và làm mới, nếu không người đọc sẽ thấy số liệu sai.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Decorator</strong> cũng giữ nguyên interface và bọc một đối tượng khác, nhưng để cộng thêm hành vi. Decorator thường do client tự lắp và có thể chồng nhiều lớp, còn Proxy kiểm soát quyền truy cập vào đối tượng thật và thường tự quản lý vòng đời của nó, như trong ví dụ proxy tự tạo báo cáo.</li>
  <li><strong>Adapter</strong> đổi sang một interface khác, còn Proxy giữ đúng interface của đối tượng thật.</li>
  <li><strong>Facade</strong> đưa ra một interface mới, đơn giản hơn, cho cả một hệ con. Proxy chỉ đứng trước đúng một đối tượng, với đúng interface của nó.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Kiểm quyền trước khi tạo hay gọi đối tượng thật.</strong> Làm như ví dụ thì lượt bị từ chối không tốn gì cả.</li>
  <li><strong>Khoá lại lúc tạo nếu proxy dùng chung giữa nhiều luồng.</strong> Nếu không, hai lượt đọc đầu tiên đến cùng lúc có thể khiến báo cáo bị tải hai lần.</li>
  <li><strong>Hãy giữ proxy thật mỏng.</strong> Logic nghiệp vụ của báo cáo nằm trong báo cáo, còn proxy chỉ quyết định có cho gọi tới hay không, và khi nào thì tạo.</li>
  <li><strong>Cho client nhận interface thay vì tự tạo proxy.</strong> Hãy truyền <code>Report</code> vào qua tham số hay DI, đừng để client tự tạo <code>ReportProxy</code>. Khi đó đổi sang báo cáo thật, hay sang bản giả khi test, đều không phải sửa client.</li>
</ul>
`;

const html = patternPage({
  title: "Proxy",
  description: "Proxy đứng thay cho đối tượng thật với cùng interface, để kiểm quyền, tải lười hay cache. Bài học có hình tương tác, bài toán báo cáo nặng chỉ vài vai trò được đọc, và code Python, TypeScript.",
  group: "Structural",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
