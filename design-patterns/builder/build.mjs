// Builds design-patterns/builder/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { transcript } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const before = execFileSync("python3", ["-I", code("before.py")], { encoding: "utf8" }).trimEnd();
const result = execFileSync("python3", ["-I", code("builder.py")], { encoding: "utf8" }).trimEnd();
// The figure is driven by the model; it must tell the same story as the code.
if (result !== transcript()) throw new Error("builder.py and model.mjs disagree:\n" + result + "\n---\n" + transcript());

const body = `
<p class="dp-eyebrow">Creational pattern</p>
<h1>Builder</h1>
<p class="dp-lead">Builder tách việc dựng một object phức tạp thành nhiều bước nhỏ có tên. Code gọi đặt từng phần mình cần, bỏ qua phần không cần, rồi gọi <code>build()</code> một lần. Lúc đó builder mới kiểm tra cả bộ và trả về sản phẩm hoàn chỉnh, không sửa được nữa.</p>

${plate}

<h2>Bài toán</h2>
<p>API danh sách đơn hàng cho lọc, sắp xếp và phân trang. Mỗi màn hình dùng một tổ hợp khác nhau: màn đối soát lọc theo trạng thái và khoảng ngày, màn chăm sóc khách lọc theo khách hàng, báo cáo sắp theo tổng tiền.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Phần</th><th>Bắt buộc</th><th>Ràng buộc</th></tr></thead>
  <tbody>
    <tr><td>Trạng thái</td><td>Không</td><td>Giá trị đi qua tham số, không dán vào câu</td></tr>
    <tr><td>Khoảng ngày tạo</td><td>Không</td><td>Ngày bắt đầu phải trước ngày kết thúc</td></tr>
    <tr><td>Khách hàng</td><td>Không</td><td></td></tr>
    <tr><td>Sắp xếp</td><td>Không</td><td>Chỉ theo cột cho phép: <code>created_at</code>, <code>total</code></td></tr>
    <tr><td>Trang, cỡ trang</td><td>Có</td><td>Cỡ trang tối đa 100, để không ai kéo cả bảng</td></tr>
  </tbody>
</table></div>
<p>Kết quả cần là một câu SQL dùng dấu <code>?</code> kèm danh sách tham số riêng, để driver của cơ sở dữ liệu tự gắn giá trị vào.</p>

<h2>Khi chưa có Builder</h2>
<p>Cách làm thường gặp là một hàm nhận mọi thứ làm tham số, rồi nối chuỗi theo từng nhánh <code>if</code>:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
${output(before)}
<ul>
  <li><strong>Tám tham số theo vị trí.</strong> Nhìn lời gọi ở cuối file, không ai biết <code>True, 3, 20</code> là gì nếu không mở hàm ra đọc. Đổi chỗ trang và cỡ trang vẫn chạy, chỉ là ra trang khác: dòng thứ hai in <code>LIMIT 3 OFFSET 57</code>.</li>
  <li><strong>Ghép chuỗi theo nhánh.</strong> Không lọc trạng thái là ra <code>WHERE AND</code>, câu SQL sai cú pháp. Thêm một bộ lọc là thêm một nhánh, và nhánh nào cũng phải nhớ lúc nào dùng <code>WHERE</code>, lúc nào dùng <code>AND</code>.</li>
  <li><strong>Giá trị dán thẳng vào câu.</strong> <code>'{status}'</code> mở đường cho SQL injection, và cơ sở dữ liệu không dùng lại được câu đã chuẩn bị.</li>
  <li><strong>Không có chỗ kiểm tra cả bộ.</strong> Hàm không biết cỡ trang 500 là quá lớn, hay ngày bắt đầu nằm sau ngày kết thúc.</li>
</ul>

<h2>Lời giải</h2>
<p>Mỗi phần của câu truy vấn là một hàm của <code>OrderQueryBuilder</code> (<strong>Builder</strong>): <code>status()</code>, <code>created_between()</code>, <code>customer()</code>, <code>order_by()</code>, <code>page()</code>. Mỗi hàm kiểm tra phần của nó, cất vào builder, rồi trả về chính builder để gọi nối tiếp. <code>build()</code> kiểm tra những gì chỉ biết được khi có đủ cả bộ (ở đây: đã phân trang chưa), ghép câu theo đúng ngữ pháp SQL, và trả về <code>Query</code> (<strong>Product</strong>). <code>Query</code> là một object bất biến.</p>
${codeTabs({ files: { python: code("builder.py"), typescript: code("builder.ts") }, note: "Bản TypeScript đặt tên hàm theo kiểu camelCase: createdBetween(), orderBy()." })}
<p>Kết quả khi chạy (hai bản in ra giống nhau). Lần <code>build()</code> đầu bị từ chối vì chưa gọi <code>page()</code>, nên không có <code>Query</code> nào được tạo ra. Sau <code>page(3, 20)</code>, <code>build()</code> trả về câu SQL sáu dòng cùng năm tham số. Đây cũng là sáu bước của hình phía trên:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Builder</strong></td><td>Khuôn trên bệ đá: năm hàng, hàng đầu là dòng SELECT có sẵn</td><td><code>OrderQueryBuilder</code></td></tr>
    <tr><td><strong>Các bước dựng</strong></td><td>Các thanh chữ trong khay; mỗi lời gọi nhấc một thanh vào đúng hàng của nó</td><td><code>status()</code>, <code>created_between()</code>, <code>order_by()</code>, <code>page()</code></td></tr>
    <tr><td><strong>build()</strong></td><td>Thanh khoá có ngón dò và lá cờ, rồi trục in lăn qua khuôn</td><td><code>build()</code></td></tr>
    <tr><td><strong>Product</strong></td><td>Tờ in trồi lên từ hộp ra giấy phía sau</td><td><code>Query</code> (bất biến)</td></tr>
    <tr><td><strong>Client</strong></td><td>Người đứng trước bàn (không vẽ)</td><td>Handler của API danh sách đơn</td></tr>
    <tr><td><strong>Director</strong> (tuỳ chọn)</td><td>Không có trong hình</td><td>Một hàm gọi sẵn các bước cho một loại truy vấn quen dùng, ví dụ <code>paid_orders_of_month(builder, month)</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Object có nhiều phần tuỳ chọn và nhiều tổ hợp hợp lệ: câu truy vấn, request HTTP (header, query, body, timeout), email (người nhận, cc, đính kèm), báo cáo, cấu hình của một client.</li>
  <li>Có ràng buộc giữa các phần mà chỉ kiểm tra được khi đã có đủ cả bộ: phân trang bắt buộc, ngày bắt đầu trước ngày kết thúc, có đính kèm thì phải có tên file.</li>
  <li>Muốn sản phẩm bất biến nhưng vẫn dựng dần được, qua nhiều chỗ trong code.</li>
  <li>Cùng một chuỗi bước dựng ra nhiều dạng sản phẩm, ví dụ một builder cho cú pháp Postgres và một builder cho MySQL dùng chung cách gọi.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Object ít trường và phần lớn bắt buộc: constructor, hoặc dataclass với tham số đặt tên, là đủ, ví dụ <code>Money(amount=..., currency="VND")</code>.</li>
  <li>Chỉ khổ vì nhiều tham số tuỳ chọn, không cần kiểm tra chéo hay dựng qua nhiều bước: tham số đặt tên có giá trị mặc định (Python) hoặc một object tuỳ chọn (TypeScript) gọn hơn.</li>
  <li>Thư viện đã có builder: query builder của ORM, builder của HTTP client. Dùng nó, đừng viết lại.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Factory Method, Abstract Factory</strong> chọn tạo loại object nào và trả về ngay trong một lần gọi. Builder dựng một object qua nhiều bước rồi mới trả ra.</li>
  <li><strong>Fluent interface</strong> chỉ là cách viết nối chuỗi <code>.a().b()</code>. Builder hay dùng cách viết này, nhưng chuỗi <code>map().filter()</code> trên mảng không phải Builder: không có bước <code>build()</code> chốt sản phẩm.</li>
  <li><strong>Template Method</strong> cố định thứ tự các bước trong lớp cha. Với Builder, code gọi tự chọn bước nào, theo thứ tự nào, và <code>build()</code> mới sắp lại cho đúng.</li>
  <li><strong>Prototype</strong> tạo object mới bằng cách sao chép một mẫu có sẵn, không dựng từ đầu.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Kiểm tra sớm những gì kiểm tra được ngay: <code>page(1, 500)</code> báo lỗi ở chính lời gọi đó. Để dành cho <code>build()</code> những ràng buộc cần cả bộ.</li>
  <li>Giá trị luôn đi qua tham số <code>?</code>. Chỉ những phần không tham số hoá được, như tên cột để sắp xếp, mới được ghép vào câu, và phải qua danh sách cho phép.</li>
  <li>Builder nắm ngữ pháp: gọi <code>page()</code> trước <code>status()</code> vẫn ra câu đúng, vì <code>build()</code> luôn ghép <code>WHERE</code>, rồi <code>ORDER BY</code>, rồi <code>LIMIT</code>. Trong hình, mỗi thanh chữ có hàng riêng của nó.</li>
  <li>Ghi rõ gọi lại một hàm thì thay hay cộng dồn. Trong ví dụ, <code>order_by()</code> và <code>page()</code> thay giá trị cũ, còn các điều kiện lọc được cộng thêm.</li>
  <li>Builder có trạng thái và thay đổi được, nên đừng dùng chung một builder giữa nhiều request. Thứ đem đi dùng chung là <code>Query</code> bất biến.</li>
</ul>
`;

const html = patternPage({
  title: "Builder",
  description: "Builder pattern: dựng một object phức tạp từng bước, kiểm tra rồi mới tạo sản phẩm bất biến. Hình tương tác, bài toán dựng câu truy vấn danh sách đơn hàng, code Python và TypeScript.",
  group: "Creational",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
