// Builds design-patterns/proxy/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";

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
<p class="dp-lead">Proxy là một object đứng thay cho object thật, với đúng interface của object thật. Mọi lời gọi đi qua nó trước, nên nó có thể kiểm quyền, trì hoãn việc tạo object tốn kém tới lúc thật sự cần, hay giữ lại kết quả để lần sau khỏi làm lại. Chỗ gọi không cần biết phía sau là proxy.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống có một báo cáo thường niên 1.240 trang. Tải nó từ kho lưu trữ mất khoảng 2,4 giây. Chỉ vai trò <code>ke-toan</code> và <code>giam-doc</code> được đọc. Ba lượt đọc lần lượt đến:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Lượt</th><th>Người đọc</th><th>Vai trò</th><th>Được đọc?</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Khách</td><td><code>khach</code></td><td>Không</td></tr>
    <tr><td>2</td><td>Kế toán</td><td><code>ke-toan</code></td><td>Có</td></tr>
    <tr><td>3</td><td>Kế toán (đọc lại)</td><td><code>ke-toan</code></td><td>Có</td></tr>
  </tbody>
</table></div>
<p>Muốn: người không có quyền bị chặn trước khi tốn bất kỳ giây nào, và báo cáo chỉ tải đúng một lần dù được đọc bao nhiêu lần.</p>

<h2>Khi chưa có Proxy</h2>
<p>Chỗ nào cần báo cáo thì tự tạo nó, rồi tự kiểm quyền:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Kết quả khi chạy:</p>
${output(before)}
<ul>
  <li><strong>Tải cả khi bị từ chối.</strong> Báo cáo được tạo trước khi kiểm quyền, nên lượt của khách vẫn tốn 2,4 giây.</li>
  <li><strong>Tải lại mỗi lần đọc.</strong> Ba lượt đọc là ba lần tải, 7,2 giây, dù báo cáo không đổi.</li>
  <li><strong>Kiểm quyền bị chép khắp nơi.</strong> Mỗi màn hình, mỗi job xuất file đều phải chép lại điều kiện vai trò. Quên ở một chỗ là lộ báo cáo.</li>
</ul>

<h2>Lời giải</h2>
<p>Giữ interface chung <strong>Subject</strong> (<code>Report</code>, có <code>read(user)</code>). Báo cáo thật (<strong>RealSubject</strong>) vẫn như cũ. Thêm <strong>Proxy</strong> cùng interface: nó kiểm quyền trước, chỉ tạo báo cáo thật ở lần đọc hợp lệ đầu tiên rồi giữ lại, sau đó chuyển lời gọi sang báo cáo thật. Chỗ gọi (<strong>Client</strong>) nhận một <code>Report</code> và không biết đó là proxy.</p>
${codeTabs({ files: { python: code("proxy.py"), typescript: code("proxy.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}
<p>Cùng ba lượt đọc, từ 3 lần tải và 7,2 giây còn 1 lần tải và 2,4 giây. Khách bị chặn mà không tốn gì.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Bàn người đọc với nút chuông gọi</td><td><code>show()</code></td></tr>
    <tr><td><strong>Subject</strong></td><td>Cửa nâng giống hệt nhau ở quầy và ở kho</td><td><code>Report</code></td></tr>
    <tr><td><strong>Proxy</strong></td><td>Quầy nhỏ có khoá chìa, cờ từ chối, giữ khay báo cáo</td><td><code>ReportProxy</code></td></tr>
    <tr><td><strong>RealSubject</strong></td><td>Báo cáo trong kho nặng, có bánh xe khoá và bộ đếm lần tải</td><td><code>AnnualReport</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li><strong>Virtual proxy (tải lười).</strong> Object tốn kém khi tạo (file lớn, kết nối, model nặng) nhưng không phải lúc nào cũng được dùng. ORM dùng đúng ý này cho quan hệ tải lười.</li>
  <li><strong>Protection proxy (kiểm quyền).</strong> Cùng một object, mỗi người được làm những việc khác nhau, và bạn muốn kiểm ở một chỗ thay vì ở mọi chỗ gọi.</li>
  <li><strong>Caching proxy.</strong> Kết quả của object thật đắt và ít đổi, như gọi API bên ngoài hay truy vấn báo cáo: proxy trả lại kết quả cũ cho tới khi hết hạn.</li>
  <li><strong>Remote proxy.</strong> Object thật nằm ở service khác. Client gọi như gọi hàm bình thường, proxy lo việc gửi request và đọc response, như các client sinh ra từ gRPC hay OpenAPI.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Object thật rẻ và luôn được dùng: tải lười chỉ thêm một tầng gián tiếp và làm lỗi lộ ra muộn hơn.</li>
  <li>Quyền đã được kiểm ở tầng ngoài (middleware, API gateway) cho mọi đường vào: kiểm thêm ở proxy chỉ là lặp lại.</li>
  <li>Dữ liệu đổi liên tục mà proxy lại giữ bản cũ: cần tính chuyện hết hạn và làm mới, nếu không người đọc thấy số liệu sai.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Decorator</strong> cũng giữ nguyên interface và bọc object khác, nhưng để cộng thêm hành vi; thường do client tự lắp, có thể chồng nhiều lớp. Proxy kiểm soát việc truy cập object thật và thường tự quản lý vòng đời của nó, như trong ví dụ là proxy tự tạo báo cáo.</li>
  <li><strong>Adapter</strong> đổi sang một interface khác. Proxy giữ đúng interface của object thật.</li>
  <li><strong>Facade</strong> đưa ra một interface mới, đơn giản hơn, cho cả một hệ con. Proxy đứng trước đúng một object, với đúng interface của nó.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Kiểm quyền trước khi tạo hay gọi object thật, như ví dụ: lượt bị từ chối không được tốn gì.</li>
  <li>Proxy tải lười dùng chung giữa nhiều luồng thì phải khoá lúc tạo, nếu không hai lượt đọc đầu tiên đến cùng lúc có thể tải hai lần.</li>
  <li>Giữ proxy mỏng. Logic nghiệp vụ của báo cáo nằm trong báo cáo, proxy chỉ quyết định có cho gọi tới hay không và khi nào thì tạo.</li>
  <li>Cho client nhận interface (<code>Report</code>) qua tham số hay DI, đừng để nó tự tạo <code>ReportProxy</code>. Khi đó đổi sang báo cáo thật, hay sang bản giả khi test, không phải sửa client.</li>
</ul>
`;

const html = patternPage({
  title: "Proxy",
  description: "Proxy pattern: một object đứng thay object thật với cùng interface, để kiểm quyền, tải lười hay cache. Hình tương tác, bài toán báo cáo nặng chỉ một số vai trò được đọc, code Python và TypeScript.",
  group: "Structural",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
