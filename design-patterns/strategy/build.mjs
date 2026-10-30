// Builds design-patterns/strategy/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed result comes from running the example, so the page can't drift from the code.
const result = execFileSync("python3", ["-I", code("strategy.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Strategy</h1>
<p class="dp-lead">Strategy tách từng cách làm của cùng một việc thành những lớp riêng dùng chung một interface. Code sử dụng chỉ giữ một strategy và gọi qua interface đó, nên muốn đổi cách làm lúc chạy thì thay strategy khác là xong, không phải sửa chính nó.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung trang thanh toán của một cửa hàng online cần tính phí giao hàng. Cửa hàng không dùng một cách tính cố định mà đổi tuỳ khu vực, đơn vị vận chuyển hoặc chương trình khuyến mãi đang chạy.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Cách tính</th><th>Quy tắc</th><th>Đọc từ đơn</th><th>Phí cho đơn mẫu</th></tr></thead>
  <tbody>
    <tr><td>Theo cân nặng</td><td>15.000 ₫ cho kg đầu, mỗi kg sau thêm 5.000 ₫, phần lẻ làm tròn lên</td><td><code>3,5 kg</code></td><td>30.000 ₫</td></tr>
    <tr><td>Theo khoảng cách</td><td>Tới 5 km là 15.000 ₫, tới 15 km là 25.000 ₫, xa hơn là 35.000 ₫</td><td><code>12 km</code></td><td>25.000 ₫</td></tr>
    <tr><td>Miễn phí từ 300.000 ₫</td><td>Đơn từ 300.000 ₫ được miễn phí, dưới mức đó đồng giá 20.000 ₫</td><td><code>450.000 ₫</code></td><td>0 ₫</td></tr>
  </tbody>
</table></div>
<p>Đơn mẫu trong bài nặng 3,5 kg, giao xa 12 km và có tiền hàng 450.000 ₫. Những phần còn lại của trang thanh toán như cộng tiền hàng, áp mã giảm giá hay tạo đơn đều giống nhau với mọi cách tính, chỉ riêng con số phí giao hàng là thay đổi.</p>

<h2>Khi chưa có Strategy</h2>
<p>Cách làm hay gặp nhất là viết một chuỗi <code>if</code>/<code>elif</code> theo tên quy tắc, đặt ngay trong code thanh toán.</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Thêm cách tính nào cũng phải sửa phần lõi.</strong> Mỗi chương trình khuyến mãi mới lại thêm một nhánh vào hàm thanh toán vốn đang chạy ổn.</li>
  <li><strong>Hàm cứ thế phình to.</strong> Các quy tắc nằm sát nhau và dùng chung biến, nên sửa bậc giá theo km có khi lại làm hỏng một nhánh khác.</li>
  <li><strong>Khó test riêng từng quy tắc.</strong> Muốn kiểm tra quy tắc miễn phí ở đúng mốc 300.000 ₫, bạn vẫn phải đi qua cả hàm thanh toán.</li>
  <li><strong>Lỗi chỉ lộ ra khi chạy thật.</strong> Tên quy tắc là một chuỗi, nên lỡ gõ nhầm <code>"free_over_300k"</code> thì phải đợi tới lúc có khách đặt hàng mới biết.</li>
</ul>

<h2>Lời giải</h2>
<p>Trước hết, ta định nghĩa một interface chung cho mọi cách tính, gọi là <strong>Strategy</strong>, với phương thức <code>quote(order)</code> nhận đơn hàng và trả về phí. Mỗi quy tắc trở thành một lớp riêng, gọi là Concrete Strategy, và tự đọc phần dữ liệu nó cần. Trang thanh toán đóng vai Context. Nó giữ một strategy, gọi <code>quote</code> qua interface và cho phép thay strategy ngay lúc chạy bằng <code>set_strategy</code>.</p>
${codeTabs({ files: { python: code("strategy.py"), typescript: code("strategy.ts") } })}
<p>Khi chạy, bản Python và bản TypeScript in ra giống hệt nhau:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Context</strong></td><td>Bệ máy với trục có then, cần đọc có lò xo, đồng hồ và ô số</td><td><code>Checkout</code></td></tr>
    <tr><td><strong>Strategy</strong></td><td>Lỗ trục và rãnh then mà cam nào cũng có</td><td><code>ShippingStrategy</code></td></tr>
    <tr><td><strong>Concrete Strategy</strong></td><td>Ba cam với ba biên dạng khác nhau</td><td><code>WeightFee</code>, <code>DistanceFee</code>, <code>FreeOverThreshold</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Người chọn cam để lắp lên trục</td><td>Code tạo <code>Checkout</code> rồi gọi <code>set_strategy</code>, thường dựa vào cấu hình</td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi một việc có nhiều cách làm và cách nào được dùng tuỳ vào cấu hình, khách hàng hay thời điểm, chẳng hạn phí giao hàng, cách tính thuế, chính sách giảm giá hay cách làm tròn tiền.</li>
  <li>Khi cần đổi cách làm lúc chạy mà code gọi không cần biết, ví dụ chọn thuật toán nén, cách sắp xếp kết quả tìm kiếm, hay cách thử lại khi dịch vụ bên ngoài báo lỗi.</li>
  <li>Khi bạn muốn test từng quy tắc riêng bằng một bảng giá trị biên, và thêm quy tắc mới mà không đụng tới code đang chạy.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi mới chỉ có một cách làm và chưa thấy cách thứ hai nào, một hàm bình thường là đủ.</li>
  <li>Khi các biến thể chỉ khác nhau ở một con số, chẳng hạn phí 20.000 hay 25.000 ₫. Hãy đưa con số đó vào cấu hình thay vì thêm lớp.</li>
  <li>Khi biến thể tự chuyển qua lại theo vòng đời của đối tượng, như từ nháp sang chờ duyệt rồi đã duyệt. Trường hợp đó là việc của State.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>State</strong> có cấu trúc gần như y hệt, chỉ khác ở chỗ ai là người đổi. Strategy do bên ngoài chọn và các strategy không hề biết nhau, còn các state tự chuyển sang state kế tiếp khi có sự kiện.</li>
  <li><strong>Template Method</strong> cố định khung thuật toán ở lớp cha và để lớp con thay vài bước thông qua kế thừa. Strategy thì thay cả thuật toán bằng cách ghép đối tượng, và đổi được ngay lúc chạy.</li>
  <li><strong>Command</strong> gói một yêu cầu thành đối tượng để xếp hàng, chạy sau hoặc hoàn tác. Strategy chỉ là một cách làm một việc, và được gọi ngay khi cần.</li>
  <li><strong>Factory Method</strong> hay đi cùng Strategy. Factory đọc cấu hình rồi trả về strategy phù hợp, nhờ vậy chuỗi <code>if</code> chỉ còn nằm ở đúng một chỗ.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Trong Python và TypeScript, một strategy có thể chỉ là một hàm như <code>Callable[[Order], int]</code> hay <code>(order: Order) =&gt; number</code>. Hãy dùng lớp khi strategy có tham số riêng, giống ngưỡng và phí đồng giá của <code>FreeOverThreshold</code>.</li>
  <li>Nên chọn strategy từ cấu hình bằng một bảng tra như <code>{"weight": WeightFee, ...}</code> đặt ở một chỗ, thay vì rải <code>if</code> khắp nơi.</li>
  <li>Nếu strategy không giữ trạng thái, một đối tượng duy nhất có thể dùng chung cho mọi request.</li>
  <li>Interface chung phải đủ cho mọi strategy. Ở đây <code>quote</code> nhận cả đơn hàng, để mỗi quy tắc tự đọc cân nặng, quãng đường hay tiền hàng.</li>
  <li>Hãy test mỗi strategy ở đúng các mốc biên, như 1 kg, 5 km, 15 km, 299.999 ₫ và 300.000 ₫.</li>
</ul>
`;

const html = patternPage({
  title: "Strategy",
  description: "Strategy tách từng cách làm của một việc thành lớp riêng có chung interface, để đổi cách làm ngay lúc chạy. Bài có hình tương tác, bài toán tính phí giao hàng và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
