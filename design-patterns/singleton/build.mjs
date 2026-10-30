// Builds design-patterns/singleton/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { QUIZ } from "./quiz.mjs";
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
<p class="dp-lead">Singleton bảo đảm một lớp chỉ có đúng một đối tượng, thường gọi là instance, trong cả process, và mọi nơi đều lấy nó qua cùng một lối. Pattern này giải quyết được một vấn đề có thật, nhưng cũng là pattern dễ bị lạm dụng nhất, vì phần lớn trường hợp bạn chỉ cần tạo một đối tượng rồi truyền nó vào là đủ.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung một ứng dụng backend chạy ba service trong cùng một process là đơn hàng, thanh toán và báo cáo. Cả ba cùng đọc ghi một cơ sở dữ liệu thông qua <strong>pool kết nối</strong>. Pool mở sẵn ${POOL_SIZE} kết nối rồi cho các truy vấn mượn lại, nhờ vậy truy vấn nào cũng không phải mở kết nối mới.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Thông số</th><th>Giá trị</th></tr></thead>
  <tbody>
    <tr><td>Số kết nối tối đa cơ sở dữ liệu cho phép</td><td><code>${DB_PORTS}</code></td></tr>
    <tr><td>Số kết nối mỗi pool mở sẵn</td><td><code>${POOL_SIZE}</code></td></tr>
    <tr><td>Số service cần truy vấn</td><td><code>3</code></td></tr>
  </tbody>
</table></div>
<p>Ba service dùng chung một pool là đủ. Nếu mỗi service tự tạo pool riêng, ba pool sẽ đòi ${3 * POOL_SIZE} kết nối, trong khi cơ sở dữ liệu chỉ cho phép ${DB_PORTS}.</p>

<h2>Khi chưa có Singleton</h2>
<p>Cách viết tự nhiên nhất là để mỗi service tự gọi <code>ConnectionPool(DB)</code> trong constructor của mình:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử sẽ thấy service thứ ba hỏng:</p>
${output(before)}
<ul>
  <li><strong>Tài nguyên dùng chung bị phung phí.</strong> Pool nào cũng giữ ${POOL_SIZE} kết nối, kể cả khi service của nó gần như không dùng tới, nên đến service thứ ba thì không còn cổng nào để mở.</li>
  <li><strong>Lỗi phụ thuộc vào thứ tự khởi động.</strong> Service nào khởi tạo sau cùng thì hỏng, nên chỉ cần đổi thứ tự import là lỗi chuyển sang chỗ khác.</li>
  <li><strong>Cấu hình bị rải rác khắp nơi.</strong> Kích thước pool, timeout và chuỗi kết nối lặp lại ở mọi chỗ tạo pool, nên sửa chỗ này rất dễ quên chỗ kia.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta gom chỗ tạo pool về một hàm duy nhất. Lần gọi đầu tiên tạo pool rồi giữ nó lại, còn mọi lần gọi sau đều trả về đúng đối tượng đã giữ. Trong Python, cách tự nhiên nhất là một biến cấp module đi cùng hàm <code>get_pool()</code>. Trong TypeScript, cách kinh điển là constructor <code>private</code> kèm phương thức tĩnh <code>getInstance()</code>.</p>
${codeTabs({ files: { python: code("singleton.py"), typescript: code("singleton.ts") } })}
<p>Chạy thử, hai bản in ra giống hệt nhau:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Singleton</strong></td><td>Hộp pool #1, cắm vào một cụm 10 cổng</td><td><code>ConnectionPool</code>, instance nằm trong <code>_pool</code></td></tr>
    <tr><td><strong>Điểm truy cập</strong></td><td>Cửa sàn, chỉ mở ở lần gọi đầu tiên</td><td><code>get_pool()</code>, <code>ConnectionPool.getInstance()</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Ba xe service và cần cắm của chúng</td><td><code>OrderService</code>, <code>PaymentService</code>, <code>ReportService</code></td></tr>
    <tr><td><strong>Tài nguyên giới hạn</strong></td><td>Tủ cơ sở dữ liệu ${DB_PORTS} cổng, cùng đèn và bộ đếm</td><td><code>Database</code>, <code>MAX_CONNECTIONS</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Bạn cần đúng một bản trong process vì nó giữ tài nguyên có giới hạn hoặc trạng thái phải thống nhất. Pool kết nối, cache dùng chung, hàng đợi ghi log hay client của một dịch vụ giới hạn số kết nối là những ví dụ điển hình.</li>
  <li>Tạo nó rất tốn kém, chẳng hạn phải đọc cấu hình, mở kết nối hay nạp mô hình, trong khi mọi nơi đều dùng chung được một bản.</li>
  <li>Bạn đang viết thư viện hoặc một script nhỏ, nơi không có chỗ nào đóng vai composition root để tạo đối tượng rồi truyền đi.</li>
</ul>
<h3>Khi nào không nên</h3>
<p>Phần này quan trọng không kém phần trên. Singleton thực chất là một biến toàn cục có kiểm soát, nên nó mang theo đủ mọi vấn đề của biến toàn cục:</p>
<ul>
  <li><strong>Phụ thuộc bị giấu đi.</strong> Nhìn chữ ký <code>OrderService()</code>, bạn không biết nó cần cơ sở dữ liệu, phải đọc tới dòng <code>get_pool()</code> bên trong mới thấy.</li>
  <li><strong>Code trở nên khó test.</strong> Khi service tự gọi <code>get_pool()</code>, test không thay được pool thật bằng pool giả. Trạng thái còn dính từ test này sang test khác, vì instance sống suốt process.</li>
  <li><strong>Về sau rất khó thay đổi.</strong> Đến ngày cần hai pool, một để ghi và một để đọc từ bản sao, bạn sẽ phải sửa mọi chỗ đang gọi <code>get_pool()</code>.</li>
  <li><strong>Giả định "chỉ có một" hiếm khi đúng mãi.</strong> Chỉ cần cấu hình theo tenant, theo vùng hay theo môi trường test là giả định ấy đã bị phá.</li>
</ul>
<p>Vì thế, cách được dùng nhiều hơn là tạo đúng một pool ở <strong>composition root</strong>, tức hàm <code>main</code>, file khởi động hay DI container với scope singleton, rồi truyền nó vào constructor của từng service. Hệ thống vẫn chỉ có một pool, nhưng phụ thuộc giờ hiện rõ và test truyền được pool giả vào. Đoạn code dưới đây làm đúng như vậy.</p>
${codeTabs({ files: { python: code("di.py"), typescript: code("di.ts") } })}
${output(di)}

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Biến toàn cục</strong> là họ hàng gần nhất. Singleton chỉ thêm vài lớp bảo vệ là tạo đúng một lần, tạo lười khi cần và không cho <code>new</code> từ bên ngoài, còn nhược điểm phụ thuộc ẩn thì vẫn nguyên đó.</li>
  <li><strong>Scope singleton của DI container</strong> cũng chỉ cho ra một instance, nhưng do container quyết định và tiêm vào. Bản thân lớp không biết mình là singleton, nên test vẫn thay được.</li>
  <li><strong>Lớp toàn phương thức tĩnh</strong>, hay một module toàn hàm, không có instance nào để truyền đi hay thay thế, và cũng không implement được interface. Singleton ít ra vẫn là một đối tượng.</li>
  <li><strong>Flyweight</strong> chia sẻ nhiều đối tượng nhỏ bất biến để tiết kiệm bộ nhớ, mỗi giá trị một bản. Singleton thì chỉ có đúng một đối tượng cho cả lớp.</li>
  <li><strong>Factory Method</strong> trông khá giống <code>getInstance()</code>, nhưng factory thường tạo đối tượng mới ở mỗi lần gọi, còn <code>getInstance()</code> lần nào cũng trả về cùng một đối tượng.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Cẩn thận khi có nhiều thread.</strong> Nếu tạo lười trong môi trường nhiều thread, hai thread có thể cùng thấy <code>_pool is None</code> và tạo ra hai pool. Hãy dùng khoá như ví dụ, kiểm tra hai lần với khoá ở giữa, hoặc tạo sẵn ngay khi nạp module. JavaScript chạy một luồng nên không cần khoá, trừ khi bước khởi tạo là hàm <code>async</code>. Khi đó hãy giữ <code>Promise</code> của lần tạo đầu tiên chứ đừng giữ kết quả.</li>
  <li><strong>Mỗi process có một instance, chứ không phải cả hệ thống.</strong> Chạy bốn worker bằng gunicorn, PM2 hay cluster là có bốn process, tức bốn pool với tổng cộng ${4 * POOL_SIZE} kết nối. Hãy tính giới hạn của cơ sở dữ liệu theo tổng số process, hoặc đặt một pooler dùng chung phía trước cơ sở dữ liệu.</li>
  <li><strong>Module trong Python và ES module vốn đã là singleton.</strong> Module chỉ chạy một lần rồi được cache, nên một biến cấp module là đủ, không cần lớp có <code>__new__</code> hay metaclass. Riêng với Node, một package bị cài hai phiên bản sẽ cho ra hai instance.</li>
  <li><strong>Hãy chừa cho test một lối thoát.</strong> Nếu buộc phải dùng Singleton, hãy thêm hàm reset hoặc cho phép đặt instance từ bên ngoài khi test, và ở các lớp mới viết thì nhận nó qua tham số.</li>
  <li><strong>Đừng để Singleton giữ trạng thái theo người dùng.</strong> Giỏ hàng hay phiên đăng nhập mà nằm trong Singleton thì mọi request đều dùng chung một đối tượng, và dữ liệu của người này sẽ lẫn sang người khác.</li>
</ul>
`;

const html = patternPage({
  title: "Singleton",
  description: "Singleton giữ đúng một instance cho cả process và một lối truy cập chung. Bài có hình tương tác về pool kết nối cơ sở dữ liệu, phần khi nào không nên dùng và code Python, TypeScript.",
  group: "Creational",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
