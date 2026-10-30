// Builds design-patterns/singleton/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { DB_PORTS, POOL_SIZE } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const py = (name) => execFileSync("python3", ["-I", code(name)], { encoding: "utf8" }).trimEnd();
const before = py("before.py");
const result = py("singleton.py");
const di = py("di.py");

const body = `
<p class="dp-eyebrow">Creational pattern</p>
<h1>Singleton</h1>
<p class="dp-lead">Singleton bảo đảm một lớp chỉ có đúng một instance trong cả process, và cho mọi nơi một đường duy nhất để lấy instance đó. Nó giải quyết được một việc thật, nhưng cũng là pattern dễ bị lạm dụng nhất: phần lớn trường hợp, tạo một object rồi truyền nó vào là đủ.</p>

${plate}

<h2>Bài toán</h2>
<p>Một ứng dụng backend chạy ba service trong cùng một process: đơn hàng, thanh toán và báo cáo. Cả ba đọc ghi cùng một cơ sở dữ liệu qua <strong>pool kết nối</strong>: một pool mở sẵn ${POOL_SIZE} kết nối và cho mượn lại, để mỗi truy vấn không phải mở kết nối mới.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Thông số</th><th>Giá trị</th></tr></thead>
  <tbody>
    <tr><td>Kết nối tối đa cơ sở dữ liệu cho phép</td><td><code>${DB_PORTS}</code></td></tr>
    <tr><td>Kết nối mỗi pool mở sẵn</td><td><code>${POOL_SIZE}</code></td></tr>
    <tr><td>Số service cần truy vấn</td><td><code>3</code></td></tr>
  </tbody>
</table></div>
<p>Ba service chỉ cần một pool là đủ. Nếu mỗi service tự tạo pool, ba pool đòi ${3 * POOL_SIZE} kết nối trong khi cơ sở dữ liệu chỉ có ${DB_PORTS}.</p>

<h2>Khi chưa có Singleton</h2>
<p>Mỗi service tự gọi <code>ConnectionPool(DB)</code> trong constructor của mình:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Kết quả khi chạy:</p>
${output(before)}
<ul>
  <li><strong>Tốn tài nguyên chung.</strong> Mỗi pool giữ ${POOL_SIZE} kết nối dù service đó gần như không dùng tới. Service thứ ba không còn cổng nào để mở.</li>
  <li><strong>Lỗi phụ thuộc thứ tự khởi động.</strong> Service nào khởi tạo sau cùng thì hỏng, nên đổi thứ tự import là đổi chỗ lỗi.</li>
  <li><strong>Cấu hình rải rác.</strong> Kích thước pool, timeout, chuỗi kết nối bị lặp ở mọi nơi tạo pool; sửa một chỗ quên chỗ khác.</li>
</ul>

<h2>Lời giải</h2>
<p>Đưa việc tạo pool về một hàm duy nhất. Lần gọi đầu tiên tạo pool và giữ nó lại; mọi lần sau trả về đúng object đã giữ. Trong Python, cách tự nhiên là một biến cấp module cùng hàm <code>get_pool()</code>. Trong TypeScript, cách kinh điển là constructor <code>private</code> và phương thức tĩnh <code>getInstance()</code>.</p>
${codeTabs({ files: { python: code("singleton.py"), typescript: code("singleton.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Singleton</strong></td><td>Hộp pool #1, cắm vào một cụm 10 cổng</td><td><code>ConnectionPool</code>, instance trong <code>_pool</code></td></tr>
    <tr><td><strong>Điểm truy cập</strong></td><td>Cửa sàn: chỉ mở lần đầu, sau đó giữ nguyên</td><td><code>get_pool()</code>, <code>ConnectionPool.getInstance()</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Ba xe service và cần cắm của chúng</td><td><code>OrderService</code>, <code>PaymentService</code>, <code>ReportService</code></td></tr>
    <tr><td><strong>Tài nguyên giới hạn</strong></td><td>Tủ cơ sở dữ liệu ${DB_PORTS} cổng, đèn và bộ đếm</td><td><code>Database</code>, <code>MAX_CONNECTIONS</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Thứ cần đúng một bản trong process vì nó giữ tài nguyên có giới hạn hoặc trạng thái phải thống nhất: pool kết nối, bộ đệm dùng chung, hàng đợi ghi log, client của một dịch vụ có giới hạn kết nối.</li>
  <li>Tạo nó tốn kém (đọc cấu hình, mở kết nối, nạp mô hình) và mọi nơi dùng chung được một bản.</li>
  <li>Bạn viết thư viện hoặc script nhỏ, không có chỗ nào đóng vai composition root để tạo và truyền object.</li>
</ul>
<h3>Khi nào không nên</h3>
<p>Phần này quan trọng không kém phần trên. Singleton thực chất là một biến toàn cục có kiểm soát, và mang theo đủ các vấn đề của biến toàn cục:</p>
<ul>
  <li><strong>Phụ thuộc bị giấu đi.</strong> Đọc chữ ký <code>OrderService()</code> không biết nó cần cơ sở dữ liệu; phải đọc tới dòng <code>get_pool()</code> bên trong mới thấy.</li>
  <li><strong>Khó test.</strong> Test không thay được pool thật bằng pool giả nếu service tự gọi <code>get_pool()</code>. Trạng thái còn dính từ test này sang test khác vì instance sống suốt process.</li>
  <li><strong>Khó đổi về sau.</strong> Ngày cần hai pool (một cho ghi, một cho đọc từ bản sao) là ngày phải sửa mọi chỗ gọi <code>get_pool()</code>.</li>
  <li><strong>"Chỉ một" thường không đúng mãi.</strong> Cấu hình theo tenant, theo vùng, theo môi trường test… đều phá giả định chỉ có một bản.</li>
</ul>
<p>Cách thường dùng hơn: tạo đúng một pool ở <strong>composition root</strong> (hàm <code>main</code>, file khởi động, hoặc DI container với scope "singleton") rồi truyền nó vào constructor của từng service. Vẫn chỉ một pool, nhưng phụ thuộc hiện rõ và test truyền được pool giả:</p>
${codeTabs({ files: { python: code("di.py"), typescript: code("di.ts") } })}
${output(di)}

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Biến toàn cục:</strong> Singleton là biến toàn cục có thêm lớp bảo vệ: chỉ tạo một lần, tạo lười khi cần, không cho <code>new</code> từ bên ngoài. Những nhược điểm về phụ thuộc ẩn thì giữ nguyên.</li>
  <li><strong>Scope singleton của DI container:</strong> cũng chỉ một instance, nhưng do container quyết định và tiêm vào; bản thân lớp không biết mình là singleton, nên test vẫn thay được.</li>
  <li><strong>Lớp toàn hàm tĩnh</strong> (hay module toàn hàm): không có instance nào để truyền đi hoặc thay thế, cũng không implement được interface. Singleton ít ra vẫn là một object.</li>
  <li><strong>Flyweight</strong> chia sẻ nhiều object nhỏ bất biến để tiết kiệm bộ nhớ, mỗi giá trị một bản. Singleton là đúng một object cho cả lớp.</li>
  <li><strong>Factory Method:</strong> <code>getInstance()</code> trông như một factory nhưng luôn trả về cùng một object; factory thường tạo object mới mỗi lần gọi.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Luồng song song:</strong> khi tạo lười trong môi trường nhiều thread, hai thread có thể cùng thấy <code>_pool is None</code> và tạo hai pool. Dùng khoá như ví dụ (kiểm tra hai lần, khoá ở giữa), hoặc tạo sẵn ngay khi nạp module. JavaScript chạy một luồng nên không cần khoá, trừ khi khởi tạo là hàm <code>async</code>: khi đó hãy giữ <code>Promise</code> của lần tạo đầu, đừng giữ kết quả.</li>
  <li><strong>Một instance cho mỗi process, không phải cho cả hệ thống.</strong> Chạy 4 worker (gunicorn, PM2, cluster) là 4 process, nên có 4 pool: ${4 * POOL_SIZE} kết nối. Hãy tính giới hạn cơ sở dữ liệu theo tổng số process, hoặc đặt một pooler dùng chung phía trước cơ sở dữ liệu.</li>
  <li><strong>Module của Python và ES module đã là singleton:</strong> module chỉ chạy một lần và được cache, nên một biến cấp module là đủ, không cần lớp có <code>__new__</code> hay metaclass. Riêng Node, một package bị cài hai phiên bản sẽ cho hai instance.</li>
  <li><strong>Cho test một lối thoát:</strong> nếu buộc phải dùng Singleton, thêm hàm reset hoặc cho phép đặt instance từ bên ngoài trong test, và nhận nó qua tham số ở các lớp mới viết.</li>
  <li><strong>Đừng để Singleton giữ trạng thái theo người dùng</strong> (giỏ hàng, phiên đăng nhập): mọi request dùng chung một object, nên dữ liệu của người này sẽ lẫn sang người khác.</li>
</ul>
`;

const html = patternPage({
  title: "Singleton",
  description: "Singleton pattern: đúng một instance cho cả process và một điểm truy cập chung. Hình tương tác về pool kết nối cơ sở dữ liệu, khi nào không nên dùng, code Python và TypeScript.",
  group: "Creational",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
