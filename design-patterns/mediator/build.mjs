// Builds design-patterns/mediator/index.html: the figure, then the lesson.
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
const before = run("before.py");
const result = run("mediator.py");
if (result !== transcript()) throw new Error("mediator.py and model.mjs disagree:\n" + result + "\n---\n" + transcript());

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Mediator</h1>
<p class="dp-lead">Mediator gom việc phối hợp giữa nhiều đối tượng về một chỗ. Các đối tượng không gọi thẳng vào nhau nữa mà chỉ báo tin cho một trung gian, và trung gian quyết định ai cần làm gì tiếp theo.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung luồng xử lý đơn hàng của một cửa hàng online, với bốn bộ phận cùng tham gia là Kho, Thanh toán, Giao hàng và Chăm sóc khách hàng. Mỗi khi một bộ phận gặp chuyện, vài bộ phận khác phải phản ứng theo:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Chuyện xảy ra</th><th>Ai báo</th><th>Ai phải làm gì</th></tr></thead>
  <tbody>
    <tr><td>Đơn <code>DH-3107</code> hết hàng</td><td>Kho</td><td>Thanh toán hoàn 1.250.000 ₫, Giao hàng huỷ chuyến, CSKH báo khách</td></tr>
    <tr><td>Thẻ của đơn <code>DH-3108</code> bị từ chối</td><td>Thanh toán</td><td>Kho nhả 1 sản phẩm đang giữ, CSKH báo khách</td></tr>
    <tr><td>Đơn <code>DH-3109</code> đã thu tiền, thêm sau</td><td>Thanh toán</td><td>Giao hàng đặt chuyến, Hoá đơn xuất hoá đơn</td></tr>
  </tbody>
</table></div>
<p>Những quy tắc này đổi liên tục. Tháng này thêm bộ phận Hoá đơn, tháng sau có thể cần báo cho kế toán mỗi khi hoàn tiền. Nếu bộ phận nào cũng tự gọi bộ phận khác, số mối nối giữa các lớp sẽ tăng rất nhanh.</p>

<h2>Khi chưa có Mediator</h2>
<p>Cách làm thường gặp là để mỗi bộ phận giữ tham chiếu tới những bộ phận nó cần báo, rồi gọi thẳng vào chúng:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử, ta được kết quả này.</p>
${output(before)}
<ul>
  <li><strong>Mỗi bộ phận phải biết quá nhiều bộ phận khác.</strong> Lớp Kho giữ tham chiếu tới ba lớp chỉ để báo một tin hết hàng, còn Thanh toán giữ thêm hai.</li>
  <li><strong>Số mối nối tăng nhanh hơn số bộ phận.</strong> Bốn bộ phận nối thẳng với nhau cần sáu dây, năm bộ phận đã cần mười, và mỗi dây là một chỗ có thể hỏng khi sửa code.</li>
  <li><strong>Quy tắc nằm rải rác ở nhiều lớp.</strong> Muốn đổi cách xử lý khi hết hàng, bạn phải mở lớp Kho, còn quy tắc khi thẻ bị từ chối lại nằm trong lớp Thanh toán.</li>
  <li><strong>Từng lớp khó dùng lại và khó test riêng.</strong> Muốn đưa lớp Kho sang một luồng khác hay viết test cho nó, bạn phải dựng đủ cả ba bộ phận mà nó gọi tới.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta đưa một đối tượng trung gian vào giữa, thường gọi là mediator, ở đây là <code>OrderMediator</code>. Mỗi bộ phận, trong pattern này gọi là colleague, chỉ giữ đúng một tham chiếu tới mediator. Khi có chuyện, nó gọi <code>notify(sender, event, order)</code> để báo tin rồi thôi.</p>
<p>Mediator là nơi duy nhất biết quy tắc phối hợp, tức là nghe tin gì thì gọi ai và theo thứ tự nào. Thêm một bộ phận mới chỉ cần nối nó với mediator và thêm quy tắc của nó vào đây, còn các bộ phận cũ không phải sửa gì.</p>
${codeTabs({ files: { python: code("mediator.py"), typescript: code("mediator.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Bộ phận Hoá đơn được thêm vào mà không lớp cũ nào phải sửa. Thứ duy nhất thay đổi là quy tắc trong mediator, và đó cũng chính là chỗ ta muốn nó thay đổi.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Mediator</strong></td><td>Tổng đài với bàn phím của người trực</td><td><code>OrderMediator</code></td></tr>
    <tr><td><strong>Colleague</strong></td><td>Các máy trạm của Kho, Thanh toán, Giao hàng, CSKH và Hoá đơn</td><td><code>Inventory</code>, <code>Payments</code>, <code>Shipping</code>, <code>CustomerCare</code>, <code>Invoicing</code></td></tr>
    <tr><td><strong>Báo tin</strong></td><td>Nút gọi trên máy trạm và cờ báo gọi rơi xuống ở tổng đài</td><td><code>notify(sender, event, order)</code></td></tr>
    <tr><td><strong>Điều phối</strong></td><td>Phím được gạt và lá cờ bật lên ở những máy được gọi</td><td>Các nhánh trong <code>notify</code> gọi <code>refund</code>, <code>cancel</code>, <code>tell</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Nhiều đối tượng phối hợp chặt với nhau theo những quy tắc hay thay đổi, như các bước của một luồng đơn hàng, một màn hình có nhiều ô nhập phụ thuộc nhau, hay nhiều dịch vụ cùng tham gia một quy trình.</li>
  <li>Bạn muốn dùng lại hoặc test từng đối tượng riêng rẽ mà không phải kéo theo cả một mạng phụ thuộc.</li>
  <li>Bạn cần một chỗ duy nhất để đọc và sửa toàn bộ quy tắc phối hợp, thay vì lần theo lời gọi qua nhiều lớp.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi chỉ có hai đối tượng nói chuyện với nhau theo một cách cố định. Một lời gọi thẳng dễ hiểu hơn nhiều.</li>
  <li>Khi mediator bắt đầu ôm luôn việc của từng bộ phận, như tự tính tiền hoàn hay tự trừ tồn kho. Nó sẽ phình thành một god object mà ai cũng ngại sửa, nên hãy để mediator chỉ điều phối, còn việc cụ thể vẫn nằm ở từng bộ phận.</li>
  <li>Khi các bên chỉ cần phát tin cho ai quan tâm mà không có quy tắc điều phối nào. Lúc đó Observer hoặc một event bus gọn hơn.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Observer</strong> cũng tách người phát tin khỏi người nhận, nhưng người phát không biết ai đang nghe và cũng không có ai quyết định thay. Với Mediator, quy tắc điều phối nằm hẳn trong mediator, nên nó biết rõ khi hết hàng thì phải gọi đúng ba bộ phận nào. Trong thực tế, mediator hay được cài bằng cơ chế observer ở bên dưới.</li>
  <li><strong>Facade</strong> cũng là một cửa đứng trước nhiều lớp, nhưng chỉ theo một chiều. Client gọi facade, còn các hệ con không hề biết facade tồn tại. Trong Mediator, các colleague chủ động báo tin cho mediator và nhận lời gọi từ nó.</li>
  <li><strong>Chain of Responsibility</strong> chuyển một yêu cầu dọc theo một chuỗi cho tới khi có người xử lý. Mediator thì nhìn được toàn cảnh và có thể gọi nhiều bên cùng lúc.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Truyền mediator vào qua constructor.</strong> Colleague chỉ nên biết interface của mediator, đừng để nó tự tìm mediator qua một biến toàn cục.</li>
  <li><strong>Giữ mediator mỏng.</strong> Nó chỉ nên quyết định ai làm gì và theo thứ tự nào. Khi số quy tắc lớn dần, hãy tách thành nhiều mediator theo từng luồng, chẳng hạn một cho đặt hàng và một cho đổi trả.</li>
  <li><strong>Đặt tên sự kiện theo nghiệp vụ.</strong> Những tên như <code>out_of_stock</code> hay <code>payment_failed</code> nói chuyện gì đã xảy ra, nên bên báo tin không cần biết ai sẽ xử lý nó.</li>
  <li><strong>Trong hệ thống phân tán, vai trò này thường thuộc về một orchestrator.</strong> Một saga điều phối các service qua message là cùng ý tưởng ấy, chỉ khác là lời gọi đi qua mạng.</li>
</ul>
`;

const html = patternPage({
  title: "Mediator",
  description: "Mediator gom việc phối hợp giữa nhiều đối tượng về một chỗ để chúng không gọi thẳng vào nhau. Bài học có hình tương tác, bài toán luồng đơn hàng với nhiều bộ phận, và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
