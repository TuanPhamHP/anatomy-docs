// Builds design-patterns/command/index.html: the figure, then the lesson.
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
const result = execFileSync("python3", ["-I", code("command.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Command</h1>
<p class="dp-lead">Command gói một yêu cầu thành một object: lệnh biết phải làm gì, với dữ liệu nào, và cách đảo ngược chính nó. Khi lệnh đã là một object, bạn có thể xếp nó vào hàng đợi, ghi lại, chạy lại hoặc hoàn tác mà phần chạy lệnh không cần biết bên trong lệnh là gì.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống kho nhận các yêu cầu điều chỉnh tồn kho của một mặt hàng: nhập thêm khi hàng về, xuất khi giao đơn. Trong một ca làm việc có ba yêu cầu:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Thứ tự</th><th>Yêu cầu</th><th>Tồn kho sau đó</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Nhập 50</td><td>100 → 150</td></tr>
    <tr><td>2</td><td>Xuất 20</td><td>150 → 130</td></tr>
    <tr><td>3</td><td>Xuất 15</td><td>130 → 115</td></tr>
  </tbody>
</table></div>
<p>Sau đó người vận hành phát hiện lần xuất 15 bị nhập nhầm và cần hoàn tác nó. Hệ thống cũng cần chạy các yêu cầu lần lượt theo đúng thứ tự, ghi lại đã làm gì, và về sau đẩy chúng sang một worker chạy nền, thử lại khi lỗi.</p>

<h2>Khi chưa có Command</h2>
<p>Cách làm thường gặp là để handler của API sửa thẳng tồn kho ngay khi request tới:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Không hoàn tác được.</strong> Sau khi hàm chạy xong, không còn gì cho biết thao tác cuối là gì và với bao nhiêu hàng. Muốn sửa phải tự tính rồi chỉnh tay.</li>
  <li><strong>Không có lịch sử.</strong> Muốn ghi log hay kiểm toán thì phải chèn thêm code vào từng handler.</li>
  <li><strong>Không xếp hàng hay chạy sau được.</strong> Yêu cầu được thực hiện ngay trong lúc gọi; không có gì để đưa vào hàng đợi, chuyển sang worker hay thử lại.</li>
  <li><strong>Mỗi thao tác mới là thêm một đường đi riêng.</strong> Logic chạy, kiểm tra và ghi log lặp lại ở mọi handler.</li>
</ul>

<h2>Lời giải</h2>
<p>Mỗi thao tác trở thành một lớp <strong>Command</strong> có hai hàm <code>execute()</code> và <code>undo()</code>. Lệnh giữ sẵn mọi thứ nó cần: kho nào (<strong>Receiver</strong>) và bao nhiêu hàng. <strong>Invoker</strong> (<code>CommandRunner</code>) chỉ có hàng đợi và lịch sử: lấy lệnh từ hàng đợi, gọi <code>execute()</code>, đẩy lệnh vào lịch sử; hoàn tác là lấy lệnh trên cùng của lịch sử và gọi <code>undo()</code>. <strong>Client</strong> là nơi tạo lệnh và đưa vào hàng đợi.</p>
${codeTabs({ files: { python: code("command.py"), typescript: code("command.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Command</strong></td><td>Phiếu đục lỗ: ghi việc cần làm và lượng hàng</td><td><code>Command</code>, <code>ReceiveStock</code>, <code>ShipStock</code></td></tr>
    <tr><td><strong>Invoker</strong></td><td>Máy đọc: khay nạp (hàng đợi), con lăn, đầu đọc, khay lịch sử, hai nút Chạy và Hoàn tác</td><td><code>CommandRunner</code></td></tr>
    <tr><td><strong>Receiver</strong></td><td>Bộ đếm tồn kho với ba bánh số</td><td><code>Inventory</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Bàn đục phiếu phía sau: nơi lập phiếu mới trước khi xếp vào khay nạp</td><td>Đoạn <code>__main__</code> tạo lệnh và gọi <code>submit()</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Cần hoàn tác hoặc làm lại: trình soạn thảo, thao tác hàng loạt trong trang quản trị, chỉnh sửa có nút "Undo".</li>
  <li>Cần xếp hàng và chạy sau: job queue, tác vụ nền, lịch hẹn giờ. Mỗi job trong hàng đợi chính là một command được ghi lại dưới dạng tên lệnh cộng tham số.</li>
  <li>Cần thử lại, ghi log hoặc kiểm toán từng thao tác một cách thống nhất, không chèn code vào từng handler.</li>
  <li>Muốn tách nơi quyết định "làm gì" khỏi nơi quyết định "khi nào và chạy ra sao": nút bấm, menu, phím tắt và API cùng tạo ra một loại lệnh.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Thao tác đơn giản, chạy ngay, không cần hàng đợi, lịch sử hay hoàn tác: một lời gọi hàm là đủ.</li>
  <li>Thao tác không đảo ngược được (gửi email, gọi cổng thanh toán): <code>undo()</code> lúc đó chỉ là ảo tưởng. Hãy thiết kế một lệnh bù riêng, như hoàn tiền.</li>
  <li>Số lớp lệnh tăng nhanh mà mỗi lớp chỉ bọc một dòng code: cân nhắc dùng hàm hoặc closure làm lệnh.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Strategy</strong> cũng đóng gói hành vi vào object, nhưng là để chọn <em>cách làm</em> một việc. Command là <em>một yêu cầu cụ thể</em> kèm dữ liệu của nó, có thể lưu lại, chạy sau và hoàn tác.</li>
  <li><strong>Memento</strong> hoàn tác bằng cách chụp lại trạng thái rồi khôi phục. Command hoàn tác bằng phép tính ngược (xuất 15 thì nhập lại 15). Hai cách hay đi cùng nhau khi phép ngược khó viết.</li>
  <li><strong>Chain of Responsibility</strong> chuyển một yêu cầu qua nhiều nơi xử lý; yêu cầu đó thường chính là một command.</li>
  <li><strong>Observer</strong> phát một sự kiện cho nhiều bên nghe. Command là một lệnh gửi tới đúng một nơi thực hiện.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Chỉ đẩy lệnh vào lịch sử sau khi <code>execute()</code> chạy thành công; lệnh lỗi không được để lại dấu trong lịch sử.</li>
  <li><code>undo()</code> cũng có thể thất bại. Ví dụ: hoàn tác một lần nhập khi hàng đã bị xuất đi. Kiểm tra điều kiện ở đây như ở <code>execute()</code>.</li>
  <li>Trong job queue, lệnh được lưu thành dữ liệu (tên lệnh, tham số, id) rồi worker dựng lại object để chạy. Gán cho mỗi lệnh một id để lần thử lại thứ hai không trừ kho thêm lần nữa (idempotent).</li>
  <li>Trong hệ thống nhiều người dùng, "hoàn tác" thường là chạy thêm một lệnh bù và ghi nó vào lịch sử, thay vì xoá lệnh cũ. Lịch sử vẫn đầy đủ để kiểm toán.</li>
  <li>Giới hạn độ dài lịch sử, hoặc lưu nó ra ngoài bộ nhớ, nếu lệnh giữ nhiều dữ liệu.</li>
</ul>
`;

const html = patternPage({
  title: "Command",
  description: "Command pattern: gói mỗi yêu cầu thành một object để xếp hàng, ghi lịch sử, chạy lại và hoàn tác. Hình tương tác, bài toán điều chỉnh tồn kho, code Python và TypeScript.",
  group: "Behavioral",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
