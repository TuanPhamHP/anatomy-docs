// Builds design-patterns/strategy/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed result comes from running the example, so the page can't drift from the code.
const result = execFileSync("python3", ["-I", code("strategy.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Strategy</h1>
<p class="dp-lead">Strategy tách một việc có nhiều cách làm thành các lớp riêng có chung một interface. Code dùng nó chỉ giữ một strategy và gọi qua interface, nên có thể chọn hoặc đổi cách làm lúc chạy mà không phải sửa chính mình.</p>

${plate}

<h2>Bài toán</h2>
<p>Trang thanh toán của một cửa hàng online phải tính phí giao hàng. Cửa hàng dùng nhiều cách tính, tuỳ khu vực, đơn vị vận chuyển hay chương trình khuyến mãi đang chạy:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Cách tính</th><th>Quy tắc</th><th>Đọc từ đơn</th><th>Phí cho đơn mẫu</th></tr></thead>
  <tbody>
    <tr><td>Theo cân nặng</td><td>15.000 ₫ cho kg đầu, thêm 5.000 ₫ mỗi kg sau, phần lẻ tính tròn một kg</td><td><code>3,5 kg</code></td><td>30.000 ₫</td></tr>
    <tr><td>Theo khoảng cách</td><td>Đến 5 km 15.000 ₫, đến 15 km 25.000 ₫, xa hơn 35.000 ₫</td><td><code>12 km</code></td><td>25.000 ₫</td></tr>
    <tr><td>Miễn phí từ 300.000 ₫</td><td>Đơn từ 300.000 ₫ được miễn phí, dưới mức đó đồng giá 20.000 ₫</td><td><code>450.000 ₫</code></td><td>0 ₫</td></tr>
  </tbody>
</table></div>
<p>Đơn mẫu nặng 3,5 kg, giao xa 12 km, tiền hàng 450.000 ₫. Phần còn lại của trang thanh toán (cộng tiền hàng, áp mã giảm giá, tạo đơn) giống nhau với mọi cách tính; chỉ riêng con số phí giao hàng là thay đổi.</p>

<h2>Khi chưa có Strategy</h2>
<p>Cách làm thường gặp là một chuỗi <code>if</code>/<code>elif</code> theo tên quy tắc, nằm ngay trong code thanh toán:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Thêm cách tính là sửa lõi.</strong> Mỗi chương trình khuyến mãi mới là một nhánh mới trong hàm thanh toán đang chạy ổn.</li>
  <li><strong>Hàm phình theo số quy tắc.</strong> Các quy tắc nằm cạnh nhau, dùng chung biến; sửa bậc giá theo km có thể làm hỏng nhánh khác.</li>
  <li><strong>Khó test riêng.</strong> Muốn kiểm tra quy tắc miễn phí ở đúng 300.000 ₫ phải đi qua cả hàm thanh toán.</li>
  <li><strong>Lỗi lộ ra lúc chạy.</strong> Tên quy tắc là chuỗi; gõ nhầm <code>"free_over_300k"</code> chỉ phát hiện khi có khách đặt hàng.</li>
</ul>

<h2>Lời giải</h2>
<p>Định nghĩa một interface chung cho mọi cách tính (<strong>Strategy</strong>): <code>quote(order)</code> nhận đơn hàng và trả về phí. Mỗi quy tắc là một lớp riêng (<strong>Concrete Strategy</strong>) tự đọc phần dữ liệu nó cần. Trang thanh toán (<strong>Context</strong>) giữ một strategy, gọi <code>quote</code> qua interface, và cho phép thay strategy lúc chạy bằng <code>set_strategy</code>.</p>
${codeTabs({ files: { python: code("strategy.py"), typescript: code("strategy.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Context</strong></td><td>Bệ máy: trục có then, cần đọc có lò xo, đồng hồ và ô số</td><td><code>Checkout</code></td></tr>
    <tr><td><strong>Strategy</strong></td><td>Lỗ trục và rãnh then mà cam nào cũng có</td><td><code>ShippingStrategy</code></td></tr>
    <tr><td><strong>Concrete Strategy</strong></td><td>Ba cam với ba biên dạng khác nhau</td><td><code>WeightFee</code>, <code>DistanceFee</code>, <code>FreeOverThreshold</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Người chọn cam để lắp lên trục</td><td>Code tạo <code>Checkout</code> và gọi <code>set_strategy</code>, thường dựa trên cấu hình</td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Một việc có nhiều cách làm, và cách nào được dùng phụ thuộc cấu hình, khách hàng hay thời điểm: phí giao hàng, cách tính thuế, chính sách giảm giá, cách làm tròn tiền.</li>
  <li>Cần đổi cách làm lúc chạy mà code gọi không biết: chọn thuật toán nén, cách sắp xếp kết quả tìm kiếm, cách thử lại khi gọi dịch vụ ngoài lỗi.</li>
  <li>Muốn test từng quy tắc riêng bằng bảng giá trị biên, và thêm quy tắc mới mà không đụng vào code đang chạy.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ có một cách làm và chưa thấy cách thứ hai: một hàm thường là đủ.</li>
  <li>Các biến thể chỉ khác nhau ở một con số (phí 20.000 hay 25.000): đưa con số vào cấu hình, không cần thêm lớp.</li>
  <li>Biến thể tự chuyển qua lại theo vòng đời của object (nháp, chờ duyệt, đã duyệt): đó là State.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>State</strong> có cấu trúc gần như giống hệt. Khác ở chỗ ai đổi: strategy do bên ngoài chọn và các strategy không biết nhau; còn các state tự chuyển sang state tiếp theo khi có sự kiện.</li>
  <li><strong>Template Method</strong> cố định khung thuật toán ở lớp cha và để lớp con thay vài bước, bằng kế thừa. Strategy thay cả thuật toán bằng composition, và đổi được lúc chạy.</li>
  <li><strong>Command</strong> gói một yêu cầu thành object để xếp hàng, chạy sau hoặc hoàn tác. Strategy là cách làm một việc, được gọi ngay khi cần.</li>
  <li><strong>Factory Method</strong> thường đi cùng Strategy: factory đọc cấu hình và trả về strategy phù hợp, để chuỗi <code>if</code> chỉ còn ở đúng một chỗ.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Trong Python và TypeScript, một strategy có thể chỉ là một hàm (<code>Callable[[Order], int]</code> hay <code>(order: Order) =&gt; number</code>). Dùng lớp khi strategy có tham số riêng, như ngưỡng và phí đồng giá của <code>FreeOverThreshold</code>.</li>
  <li>Chọn strategy từ cấu hình bằng một bảng tra (<code>{"weight": WeightFee, ...}</code>) đặt ở một chỗ, thay vì rải <code>if</code> khắp code.</li>
  <li>Giữ strategy không có trạng thái thì một instance dùng chung được cho mọi request.</li>
  <li>Interface chung phải đủ cho mọi strategy: ở đây <code>quote</code> nhận cả đơn hàng, để mỗi quy tắc tự đọc cân nặng, quãng đường hay tiền hàng.</li>
  <li>Test mỗi strategy ở đúng các mốc biên: 1 kg, 5 km, 15 km, 299.999 ₫ và 300.000 ₫.</li>
</ul>
`;

const html = patternPage({
  title: "Strategy",
  description: "Strategy pattern: tách các cách làm một việc thành lớp riêng có chung interface để đổi lúc chạy. Hình tương tác, bài toán tính phí giao hàng, code Python và TypeScript.",
  group: "Behavioral",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
