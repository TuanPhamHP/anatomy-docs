// Builds design-patterns/interpreter/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { transcript } from "./model.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (file) => execFileSync("python3", ["-I", code(file)], { encoding: "utf8" }).trimEnd();
const result = run("interpreter.py");
const before = run("before.py");
if (result !== transcript()) throw new Error(`interpreter.py and model.mjs disagree:\n${result}\n---\n${transcript()}`);

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Interpreter</h1>
<p class="dp-lead">Interpreter biến một ngôn ngữ nhỏ, chẳng hạn các điều kiện ưu đãi hay phân quyền, thành một cây đối tượng biết tự đánh giá. Nhờ vậy quy tắc trở thành dữ liệu, có thể lưu lại, hiển thị và thay đổi mà không phải sửa code.</p>

${plate}

<h2>Bài toán</h2>
<p>Bộ phận kinh doanh muốn tặng ưu đãi cho khách thoả điều kiện sau, và tháng nào họ cũng muốn chỉnh lại một chút:</p>
<pre class="dp-output"><code>hạng == "vàng" HOẶC (tổng_đơn >= 500000 VÀ khu_vực == "HN")</code></pre>
<p>Hôm nay có ba khách cần xét:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Khách</th><th>Hạng</th><th>Tổng đơn</th><th>Khu vực</th></tr></thead>
  <tbody>
    <tr><td>An</td><td>vàng</td><td>320.000 ₫</td><td>HCM</td></tr>
    <tr><td>Bình</td><td>bạc</td><td>650.000 ₫</td><td>HN</td></tr>
    <tr><td>Chi</td><td>bạc</td><td>720.000 ₫</td><td>ĐN</td></tr>
  </tbody>
</table></div>
<p>Điều ta muốn là quy tắc nằm ngoài code, để người làm kinh doanh tự sửa được, còn hệ thống vẫn đánh giá đúng và an toàn.</p>

<h2>Khi chưa có Interpreter</h2>
<p>Cách làm quen thuộc nhất là viết thẳng quy tắc thành một hàm với vài câu <code>if</code>:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Kết quả thì đúng:</p>
${output(before)}
<ul>
  <li><strong>Mỗi lần đổi quy tắc là một lần deploy.</strong> Chỉ cần nâng ngưỡng lên 600.000 ₫ cũng phải sửa code, chờ review rồi phát hành lại.</li>
  <li><strong>Hàm cứ thế phình ra.</strong> Mỗi khu vực, mỗi chương trình khuyến mãi muốn một biến thể riêng, và các nhánh <code>if</code> lồng vào nhau tới mức khó đọc.</li>
  <li><strong>Không ai ngoài lập trình viên đọc được quy tắc đang chạy.</strong> Muốn hiển thị quy tắc cho bộ phận kinh doanh xem, bạn phải viết lại nó bằng lời ở một chỗ khác, và hai bản sớm muộn sẽ lệch nhau.</li>
  <li><strong>Lối tắt <code>eval</code> còn tệ hơn.</strong> Lưu quy tắc thành một chuỗi code rồi đưa vào <code>eval</code> hay <code>new Function</code> nghĩa là ai sửa được chuỗi đó thì chạy được bất kỳ lệnh nào trên server. Đừng bao giờ đánh giá quy tắc do người dùng nhập theo cách này.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta coi quy tắc là một câu trong một ngôn ngữ rất nhỏ, và biểu diễn câu đó thành một cây. Mỗi loại nút là một lớp có cùng phương thức <code>evaluate(ctx)</code>. Nút lá <code>Var</code> đọc một giá trị của khách, <code>Const</code> trả về hằng số viết trong quy tắc. Các nút <code>Equals</code> và <code>AtLeast</code> so sánh hai nhánh con, còn <code>And</code> và <code>Or</code> ghép kết quả của hai nhánh.</p>
<p>Muốn đánh giá cả quy tắc, ta chỉ gọi <code>evaluate</code> ở gốc, và mỗi nút tự gọi xuống các nút con của mình. Cũng chính cái cây đó in lại được thành câu quy tắc, nên thứ được hiển thị luôn là thứ đang chạy.</p>
${codeTabs({ files: { python: code("interpreter.py"), typescript: code("interpreter.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Trong thực tế, cây này thường được dựng từ JSON lưu trong cơ sở dữ liệu, hoặc từ chính câu chữ qua một parser nhỏ. Đổi ngưỡng 500.000 ₫ hay thêm một khu vực lúc đó chỉ là sửa dữ liệu, còn các lớp nút không thay đổi.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>AbstractExpression</strong></td><td>Mọi bộ phận đều nhận lực từ dưới lên và truyền lên trên theo cùng một kiểu</td><td><code>Expr</code> với <code>evaluate(ctx)</code></td></tr>
    <tr><td><strong>TerminalExpression</strong></td><td>Thanh trượt mang giá trị của khách, và chiếc răng gia công sẵn trên thanh</td><td><code>Var</code>, <code>Const</code></td></tr>
    <tr><td><strong>NonterminalExpression</strong></td><td>Cần cảm biến trên mỗi thanh, bàn có lò xo của cổng VÀ và thanh ngang của cổng HOẶC</td><td><code>Equals</code>, <code>AtLeast</code>, <code>And</code>, <code>Or</code></td></tr>
    <tr><td><strong>Context</strong></td><td>Tấm thẻ khách hàng trong khay, quyết định vị trí của ba thanh trượt</td><td>Từ điển <code>ctx</code> của từng khách</td></tr>
    <tr><td><strong>Client</strong></td><td>Người nhìn cánh tay tín hiệu trên đỉnh</td><td>Vòng lặp gọi <code>RULE.evaluate(ctx)</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi có một ngôn ngữ nhỏ và ổn định cần đánh giá nhiều lần, như điều kiện khuyến mãi, quy tắc phân quyền, bộ lọc tìm kiếm do người dùng tự ghép hay công thức tính phí.</li>
  <li>Khi quy tắc phải nằm ngoài code, do người không phải lập trình viên chỉnh, và bạn cần đánh giá nó một cách an toàn thay vì chạy code tuỳ ý.</li>
  <li>Khi cùng một quy tắc còn cần làm việc khác ngoài đánh giá, như in ra thành câu, kiểm tra hợp lệ hay giải thích vì sao khách không đạt. Mỗi việc chỉ là thêm một phương thức trên cây.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi quy tắc gần như không đổi. Vài câu <code>if</code> rõ ràng trong code dễ đọc và dễ test hơn cả một cây lớp.</li>
  <li>Khi ngôn ngữ lớn dần, có biến, hàm, độ ưu tiên toán tử và thông báo lỗi tử tế. Lúc đó hãy dùng một bộ sinh parser, một thư viện biểu thức hay một rules engine có sẵn, thay vì tự dựng từng lớp nút.</li>
  <li>Khi hiệu năng là ưu tiên số một. Duyệt cây cho mỗi lần đánh giá chậm hơn code biên dịch sẵn, nên với khối lượng rất lớn người ta thường dịch cây sang dạng khác trước khi chạy.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Composite</strong> là hình dạng mà Interpreter dùng. Cây biểu thức chính là một Composite, trong đó nút ghép chứa các nút con và gọi xuống chúng. Interpreter thêm vào đó một ý nghĩa, mỗi cây là một câu trong một ngôn ngữ và <code>evaluate</code> cho ra giá trị của câu.</li>
  <li><strong>Strategy</strong> chọn một thuật toán có sẵn để chạy. Với Interpreter, chính người viết quy tắc ghép ra "thuật toán" bằng cách lắp các nút lại với nhau.</li>
  <li><strong>Visitor</strong> hay đi cùng Interpreter. Khi số thao tác trên cây tăng lên, như đánh giá, in, kiểm tra và tối ưu, bạn có thể tách từng thao tác ra thành một visitor thay vì nhét tất cả vào các lớp nút.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Giữ các nút bất biến.</strong> Một cây không đổi sau khi dựng thì dùng chung được giữa nhiều luồng, và có thể lưu vào cache theo phiên bản của quy tắc.</li>
  <li><strong>Kiểm tra cây ngay khi nạp.</strong> Tên biến lạ, so sánh chuỗi với số hay một nút thiếu nhánh nên bị báo lỗi lúc lưu quy tắc, chứ đừng để tới lúc khách đặt hàng mới lộ ra.</li>
  <li><strong>Chỉ cho phép đúng những nút bạn định nghĩa.</strong> Khi đọc quy tắc từ JSON, hãy ánh xạ từng loại nút sang đúng lớp của nó và từ chối mọi thứ khác. Đó là lý do cách này an toàn còn <code>eval</code> thì không.</li>
  <li><strong>Nghĩ tới lời giải thích.</strong> Người dùng thường hỏi vì sao mình không được ưu đãi. Một phương thức trả về nhánh nào đúng, nhánh nào sai trên cây sẽ trả lời câu đó rất gọn.</li>
</ul>
`;

const html = patternPage({
  title: "Interpreter",
  description: "Interpreter biến một ngôn ngữ quy tắc nhỏ thành cây đối tượng biết tự đánh giá. Bài học có hình tương tác, bài toán điều kiện ưu đãi lưu như dữ liệu và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
