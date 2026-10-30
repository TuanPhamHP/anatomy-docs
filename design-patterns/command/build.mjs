// Builds design-patterns/command/index.html: the figure, then the lesson.
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
const result = execFileSync("python3", ["-I", code("command.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Command</h1>
<p class="dp-lead">Command biến mỗi yêu cầu thành một đối tượng biết mình phải làm gì, làm với dữ liệu nào và đảo ngược ra sao. Khi lệnh đã là một đối tượng cầm nắm được, bạn có thể xếp nó vào hàng đợi, ghi lại, chạy lại hay hoàn tác, trong khi phần chạy lệnh không cần biết bên trong lệnh có gì.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung hệ thống kho của một cửa hàng. Mỗi khi hàng về, nhân viên nhập thêm vào tồn kho, và mỗi khi giao đơn thì xuất bớt đi. Trong một ca làm việc, mặt hàng đang xét nhận ba yêu cầu như sau:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Thứ tự</th><th>Yêu cầu</th><th>Tồn kho sau đó</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Nhập 50</td><td>100 → 150</td></tr>
    <tr><td>2</td><td>Xuất 20</td><td>150 → 130</td></tr>
    <tr><td>3</td><td>Xuất 15</td><td>130 → 115</td></tr>
  </tbody>
</table></div>
<p>Cuối ca, người vận hành phát hiện lần xuất 15 bị nhập nhầm và muốn hoàn tác nó. Hệ thống còn phải chạy các yêu cầu lần lượt theo đúng thứ tự và ghi lại những gì đã làm. Về sau, đội phát triển muốn chuyển chúng sang một worker chạy nền để có thể thử lại khi gặp lỗi.</p>

<h2>Khi chưa có Command</h2>
<p>Cách làm hay gặp nhất là để handler của API sửa thẳng tồn kho ngay khi request tới.</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Thao tác đã chạy thì không lùi lại được.</strong> Khi hàm chạy xong, không còn gì cho biết thao tác cuối là gì và với bao nhiêu hàng, nên muốn sửa thì phải tự tính rồi chỉnh tay.</li>
  <li><strong>Hệ thống không lưu lại lịch sử.</strong> Muốn ghi log hay phục vụ kiểm toán, bạn phải chèn thêm code vào từng handler.</li>
  <li><strong>Yêu cầu không thể xếp hàng hay để chạy sau.</strong> Mọi thứ diễn ra ngay trong lúc gọi hàm, nên chẳng có gì để đưa vào hàng đợi, chuyển sang worker hay thử lại.</li>
  <li><strong>Mỗi thao tác mới lại mở thêm một lối đi riêng.</strong> Phần chạy, kiểm tra và ghi log cứ thế lặp lại ở mọi handler.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta biến mỗi thao tác thành một lớp lệnh, gọi là Command, với hai phương thức <code>execute()</code> và <code>undo()</code>. Lệnh giữ sẵn mọi thứ nó cần, gồm kho hàng mà nó tác động, thường gọi là Receiver, và số lượng hàng.</p>
<p>Phần chạy lệnh, gọi là Invoker, ở đây là lớp <code>CommandRunner</code>. Nó chỉ giữ một hàng đợi và một ngăn lịch sử. Mỗi lần chạy, nó lấy lệnh đầu hàng đợi ra, gọi <code>execute()</code> rồi cất lệnh vào lịch sử. Muốn hoàn tác, nó lấy lệnh trên cùng của lịch sử và gọi <code>undo()</code>. Còn Client là nơi tạo lệnh và xếp chúng vào hàng đợi.</p>
${codeTabs({ files: { python: code("command.py"), typescript: code("command.ts") } })}
<p>Chạy thử, bản Python và bản TypeScript in ra cùng một kết quả:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Command</strong></td><td>Tấm phiếu đục lỗ ghi việc cần làm và lượng hàng</td><td><code>Command</code>, <code>ReceiveStock</code>, <code>ShipStock</code></td></tr>
    <tr><td><strong>Invoker</strong></td><td>Máy đọc phiếu, gồm khay nạp làm hàng đợi, con lăn, đầu đọc, khay lịch sử và hai nút Chạy, Hoàn tác</td><td><code>CommandRunner</code></td></tr>
    <tr><td><strong>Receiver</strong></td><td>Bộ đếm tồn kho có ba bánh số</td><td><code>Inventory</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Bàn đục phiếu phía sau, nơi lập phiếu mới trước khi xếp vào khay nạp</td><td>Đoạn <code>__main__</code> tạo lệnh rồi gọi <code>submit()</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi cần hoàn tác hoặc làm lại, như trong trình soạn thảo, các thao tác hàng loạt ở trang quản trị, hay bất cứ chỗ nào có nút Undo.</li>
  <li>Khi cần xếp hàng để chạy sau, như job queue, tác vụ nền hay lịch hẹn giờ. Mỗi job trong hàng đợi thực chất là một command được lưu lại dưới dạng tên lệnh kèm tham số.</li>
  <li>Khi muốn thử lại, ghi log hay kiểm toán mọi thao tác theo cùng một cách, thay vì chèn code vào từng handler.</li>
  <li>Khi muốn tách chuyện làm gì khỏi chuyện làm lúc nào và chạy ra sao. Nút bấm, menu, phím tắt và API khi đó cùng tạo ra một loại lệnh.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Nếu thao tác đơn giản, chạy ngay và không cần hàng đợi, lịch sử hay hoàn tác, một lời gọi hàm là đủ.</li>
  <li>Với thao tác không đảo ngược được, như gửi email hay gọi cổng thanh toán, phương thức <code>undo()</code> chỉ đem lại cảm giác an toàn giả. Hãy thiết kế một lệnh bù riêng, chẳng hạn lệnh hoàn tiền.</li>
  <li>Nếu số lớp lệnh tăng nhanh mà mỗi lớp chỉ bọc đúng một dòng code, hãy cân nhắc dùng hàm hoặc closure làm lệnh.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Strategy</strong> cũng đóng gói hành vi vào một đối tượng, nhưng mục đích là chọn cách làm một việc. Command thì là một yêu cầu cụ thể kèm dữ liệu của nó, có thể lưu lại, chạy sau và hoàn tác.</li>
  <li><strong>Memento</strong> hoàn tác bằng cách chụp lại trạng thái rồi khôi phục, còn Command hoàn tác bằng phép tính ngược, xuất 15 thì nhập lại 15. Hai cách này hay đi cùng nhau khi phép tính ngược khó viết.</li>
  <li><strong>Chain of Responsibility</strong> chuyển một yêu cầu qua nhiều nơi xử lý, và yêu cầu đó thường chính là một command.</li>
  <li><strong>Observer</strong> phát một sự kiện cho nhiều bên cùng nghe, còn Command là một lệnh gửi tới đúng một nơi thực hiện.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Chỉ cất lệnh vào lịch sử sau khi <code>execute()</code> chạy thành công, để lệnh lỗi không để lại dấu vết nào trong lịch sử.</li>
  <li>Bản thân <code>undo()</code> cũng có thể thất bại, chẳng hạn khi hoàn tác một lần nhập mà số hàng đó đã bị xuất đi. Hãy kiểm tra điều kiện ở đây kỹ như ở <code>execute()</code>.</li>
  <li>Trong job queue, lệnh được lưu thành dữ liệu gồm tên lệnh, tham số và id, rồi worker dựng lại đối tượng để chạy. Nhờ có id, lần thử lại thứ hai sẽ không trừ kho thêm lần nữa, nghĩa là lệnh có tính idempotent.</li>
  <li>Trong hệ thống nhiều người dùng, hoàn tác thường có nghĩa là chạy thêm một lệnh bù và ghi nó vào lịch sử, thay vì xoá lệnh cũ. Nhờ vậy lịch sử vẫn đầy đủ cho việc kiểm toán.</li>
  <li>Nếu lệnh giữ nhiều dữ liệu, hãy giới hạn độ dài lịch sử hoặc lưu nó ra ngoài bộ nhớ.</li>
</ul>
`;

const html = patternPage({
  title: "Command",
  description: "Command gói mỗi yêu cầu thành một đối tượng để xếp hàng, ghi lịch sử, chạy lại và hoàn tác. Bài có hình tương tác, bài toán điều chỉnh tồn kho và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
