// Builds design-patterns/builder/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { QUIZ } from "./quiz.mjs";
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
<p class="dp-lead">Builder giúp bạn dựng một đối tượng phức tạp qua nhiều bước nhỏ, mỗi bước có một cái tên rõ ràng. Code gọi chỉ đặt những phần mình cần rồi gọi <code>build()</code> một lần, và đến lúc ấy builder mới kiểm tra cả bộ rồi trả về một sản phẩm hoàn chỉnh, không ai sửa được nữa.</p>

${plate}

<h2>Bài toán</h2>
<p>API danh sách đơn hàng cho phép lọc, sắp xếp và phân trang. Mỗi màn hình lại dùng một tổ hợp khác nhau. Màn đối soát lọc theo trạng thái và khoảng ngày, màn chăm sóc khách lọc theo khách hàng, còn màn báo cáo thì sắp theo tổng tiền.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Phần</th><th>Bắt buộc</th><th>Ràng buộc</th></tr></thead>
  <tbody>
    <tr><td>Trạng thái</td><td>Không</td><td>Giá trị đi qua tham số, không dán vào câu</td></tr>
    <tr><td>Khoảng ngày tạo</td><td>Không</td><td>Ngày bắt đầu phải trước ngày kết thúc</td></tr>
    <tr><td>Khách hàng</td><td>Không</td><td></td></tr>
    <tr><td>Sắp xếp</td><td>Không</td><td>Chỉ theo cột được phép, là <code>created_at</code> hoặc <code>total</code></td></tr>
    <tr><td>Trang, cỡ trang</td><td>Có</td><td>Cỡ trang tối đa 100, để không ai kéo cả bảng về</td></tr>
  </tbody>
</table></div>
<p>Thứ cần trả về là một câu SQL dùng dấu <code>?</code>, kèm một danh sách tham số riêng để driver của cơ sở dữ liệu tự gắn giá trị vào.</p>

<h2>Khi chưa có Builder</h2>
<p>Cách làm thường gặp là viết một hàm nhận mọi thứ làm tham số, rồi nối chuỗi theo từng nhánh <code>if</code>:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
${output(before)}
<ul>
  <li><strong>Tám tham số truyền theo vị trí rất khó đọc.</strong> Nhìn lời gọi ở cuối file, không ai biết <code>True, 3, 20</code> nghĩa là gì nếu không mở hàm ra đọc. Đổi chỗ trang với cỡ trang thì code vẫn chạy, chỉ có điều ra nhầm trang, như dòng thứ hai in <code>LIMIT 3 OFFSET 57</code>.</li>
  <li><strong>Ghép chuỗi theo nhánh rất dễ sai cú pháp.</strong> Chỉ cần không lọc trạng thái là câu SQL có ngay <code>WHERE AND</code>. Mỗi bộ lọc mới lại là một nhánh mới, và nhánh nào cũng phải tự nhớ khi nào dùng <code>WHERE</code>, khi nào dùng <code>AND</code>.</li>
  <li><strong>Giá trị bị dán thẳng vào câu SQL.</strong> Kiểu viết <code>'{status}'</code> mở đường cho SQL injection, và cơ sở dữ liệu cũng không dùng lại được câu đã chuẩn bị.</li>
  <li><strong>Không có chỗ nào kiểm tra cả bộ.</strong> Hàm không hề biết cỡ trang 500 là quá lớn, hay ngày bắt đầu đang nằm sau ngày kết thúc.</li>
</ul>

<h2>Lời giải</h2>
<p>Mỗi phần của câu truy vấn trở thành một phương thức của <code>OrderQueryBuilder</code>, lớp đóng vai Builder. Đó là <code>status()</code>, <code>created_between()</code>, <code>customer()</code>, <code>order_by()</code> và <code>page()</code>. Phương thức nào cũng kiểm tra phần của mình, cất vào builder rồi trả về chính builder, nhờ vậy bạn gọi nối tiếp được.</p>
<p>Đến <code>build()</code>, builder kiểm tra những điều chỉ biết được khi đã có đủ cả bộ, ở đây là câu truy vấn đã được phân trang hay chưa. Sau đó nó ghép câu theo đúng ngữ pháp SQL và trả về một <code>Query</code>. Đó là Product, một đối tượng bất biến.</p>
${codeTabs({ files: { python: code("builder.py"), typescript: code("builder.ts") }, note: "Bản TypeScript đặt tên phương thức theo kiểu camelCase, chẳng hạn createdBetween() và orderBy()." })}
<p>Chạy thử, hai bản in ra giống hệt nhau. Lần <code>build()</code> đầu tiên bị từ chối vì chưa gọi <code>page()</code>, nên không có Query nào được tạo ra. Sau khi gọi <code>page(3, 20)</code>, builder trả về câu SQL sáu dòng cùng năm tham số, đúng như sáu bước trong hình phía trên:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Builder</strong></td><td>Khuôn năm hàng trên bệ đá, hàng đầu là dòng SELECT có sẵn</td><td><code>OrderQueryBuilder</code></td></tr>
    <tr><td><strong>Các bước dựng</strong></td><td>Các thanh chữ trong khay, mỗi lời gọi nhấc một thanh vào đúng hàng của nó</td><td><code>status()</code>, <code>created_between()</code>, <code>order_by()</code>, <code>page()</code></td></tr>
    <tr><td><strong>build()</strong></td><td>Thanh khoá có ngón dò và lá cờ, rồi trục in lăn qua khuôn</td><td><code>build()</code></td></tr>
    <tr><td><strong>Product</strong></td><td>Tờ in trồi lên từ hộp ra giấy phía sau</td><td><code>Query</code>, bất biến</td></tr>
    <tr><td><strong>Client</strong></td><td>Người đứng trước bàn, không có trong hình</td><td>Handler của API danh sách đơn</td></tr>
    <tr><td><strong>Director</strong>, tuỳ chọn</td><td>Không có trong hình</td><td>Một hàm gọi sẵn các bước cho một loại truy vấn quen dùng, ví dụ <code>paid_orders_of_month(builder, month)</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Đối tượng có nhiều phần tuỳ chọn và nhiều tổ hợp hợp lệ. Câu truy vấn, request HTTP với header, query, body và timeout, email với người nhận, cc và đính kèm, báo cáo hay cấu hình của một client đều thuộc loại này.</li>
  <li>Giữa các phần có những ràng buộc chỉ kiểm tra được khi đã có đủ cả bộ, chẳng hạn bắt buộc phân trang, ngày bắt đầu phải trước ngày kết thúc, hay có đính kèm thì phải có tên file.</li>
  <li>Bạn muốn sản phẩm bất biến nhưng vẫn dựng dần được qua nhiều chỗ trong code.</li>
  <li>Cùng một chuỗi bước cần dựng ra nhiều dạng sản phẩm, ví dụ một builder cho cú pháp Postgres và một builder cho MySQL dùng chung cách gọi.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Đối tượng chỉ có ít trường và phần lớn là bắt buộc. Một constructor hay một dataclass với tham số đặt tên là đủ, ví dụ <code>Money(amount=..., currency="VND")</code>.</li>
  <li>Bạn chỉ khổ vì có nhiều tham số tuỳ chọn, chứ không cần kiểm tra chéo hay dựng qua nhiều bước. Khi đó tham số đặt tên có giá trị mặc định trong Python, hay một đối tượng options trong TypeScript, sẽ gọn hơn.</li>
  <li>Thư viện bạn dùng đã có sẵn builder, như query builder của ORM hay builder của HTTP client. Hãy dùng nó thay vì viết lại.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Factory Method và Abstract Factory</strong> chọn loại đối tượng cần tạo rồi trả về ngay trong một lần gọi. Builder thì dựng một đối tượng qua nhiều bước rồi mới trả ra.</li>
  <li><strong>Fluent interface</strong> chỉ là kiểu viết gọi nối chuỗi như <code>.a().b()</code>. Builder hay dùng kiểu viết này, nhưng chuỗi <code>map().filter()</code> trên mảng thì không phải Builder, vì không có bước <code>build()</code> nào chốt lại sản phẩm.</li>
  <li><strong>Template Method</strong> cố định thứ tự các bước ngay trong lớp cha. Với Builder, code gọi tự chọn gọi bước nào và theo thứ tự nào, còn <code>build()</code> sẽ sắp lại cho đúng.</li>
  <li><strong>Prototype</strong> tạo đối tượng mới bằng cách sao chép một mẫu có sẵn chứ không dựng lại từ đầu.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Thứ gì kiểm tra được ngay thì nên kiểm tra sớm, nên <code>page(1, 500)</code> báo lỗi ngay ở chính lời gọi đó. Chỉ những ràng buộc cần cả bộ mới để dành cho <code>build()</code>.</li>
  <li>Giá trị luôn đi qua tham số <code>?</code>. Chỉ những phần không tham số hoá được, như tên cột để sắp xếp, mới được ghép thẳng vào câu, và chúng phải nằm trong danh sách cho phép.</li>
  <li>Builder là nơi nắm ngữ pháp, nên gọi <code>page()</code> trước <code>status()</code> vẫn ra câu đúng. Lý do là <code>build()</code> luôn ghép <code>WHERE</code> trước, rồi đến <code>ORDER BY</code>, cuối cùng là <code>LIMIT</code>, giống như trong hình mỗi thanh chữ có sẵn hàng riêng của nó.</li>
  <li>Hãy ghi rõ khi gọi lại một phương thức thì giá trị cũ bị thay hay được cộng dồn. Trong ví dụ, <code>order_by()</code> và <code>page()</code> thay giá trị cũ, còn các điều kiện lọc thì cộng thêm vào.</li>
  <li>Builder có trạng thái và thay đổi được, nên đừng dùng chung một builder cho nhiều request. Thứ nên đem đi dùng chung là <code>Query</code> bất biến.</li>
</ul>
`;

const html = patternPage({
  title: "Builder",
  description: "Builder dựng một đối tượng phức tạp qua từng bước, kiểm tra cả bộ rồi mới tạo ra sản phẩm bất biến. Bài có hình tương tác, bài toán dựng câu truy vấn danh sách đơn hàng và code Python, TypeScript.",
  group: "Creational",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
