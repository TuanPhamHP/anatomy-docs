// Builds design-patterns/bridge/index.html: the figure, then the lesson.
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
const result = run("bridge.py");
const before = run("before.py");
if (result !== transcript().join("\n")) throw new Error("bridge.py prints something other than model.mjs's transcript");

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Bridge</h1>
<p class="dp-lead">Khi một thứ thay đổi theo hai hướng độc lập, Bridge tách nó thành hai phía riêng rồi nối chúng bằng một interface ở giữa. Mỗi phía tự lớn lên theo cách của mình, và số lớp chỉ tăng theo phép cộng thay vì phép nhân.</p>

${plate}

<h2>Bài toán</h2>
<p>Một ứng dụng gửi ba loại thông báo cho khách hàng là cảnh báo bảo mật, nhắc lịch hẹn và khuyến mãi. Loại nào cũng có thể đi qua email, SMS hay push, và mỗi kênh lại trình bày tin theo kiểu riêng của nó:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Kênh</th><th>Cách trình bày</th><th>Ví dụ</th></tr></thead>
  <tbody>
    <tr><td>Email</td><td>Có ô tiêu đề riêng</td><td><code>tiêu đề "CẢNH BÁO": Có lần đăng nhập…</code></td></tr>
    <tr><td>SMS</td><td>Không có tiêu đề, phải ghép vào đầu tin</td><td><code>Nhắc lịch - Lịch hẹn lúc 9:00 sáng mai</code></td></tr>
    <tr><td>Push</td><td>Tiêu đề nằm trong ngoặc vuông</td><td><code>[Khuyến mãi] Giảm 20%…</code></td></tr>
  </tbody>
</table></div>
<p>Sắp tới nhóm sản phẩm còn muốn thêm kênh chat. Để ý rằng loại tin và kênh gửi là hai chuyện không dính tới nhau. Thêm một loại tin không làm thay đổi cách gửi, và thêm một kênh cũng không làm thay đổi nội dung tin.</p>

<h2>Khi chưa có Bridge</h2>
<p>Cách dễ nghĩ ra nhất là kế thừa, mỗi tổ hợp loại tin và kênh thành một lớp con:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử, ta được kết quả này.</p>
${output(before)}
<ul>
  <li><strong>Số lớp tăng theo phép nhân.</strong> Ba loại tin và ba kênh đã là chín lớp. Thêm kênh chat thì thành mười hai, và thêm một loại tin nữa sẽ lên mười sáu.</li>
  <li><strong>Cùng một logic bị chép ở nhiều nơi.</strong> Cách trình bày của SMS nằm trong ba lớp, nội dung tin nhắc lịch cũng nằm trong ba lớp, nên sửa một chỗ là phải nhớ sửa đủ cả ba.</li>
  <li><strong>Không đổi được kênh lúc chạy.</strong> Một tin đã tạo bằng <code>AlertEmail</code> thì mãi là email. Muốn gửi lại qua SMS khi email lỗi, bạn phải tạo một đối tượng khác hẳn.</li>
</ul>

<h2>Lời giải</h2>
<p>Bridge tách hai hướng thay đổi thành hai cây lớp. Phía thứ nhất là Abstraction, ở đây là <code>Notification</code> cùng các lớp con <code>Alert</code>, <code>Reminder</code> và <code>Promotion</code>. Mỗi lớp con chỉ lo tiêu đề và nội dung của loại tin mình.</p>
<p>Phía thứ hai là Implementor, tức interface <code>Channel</code> cùng các kênh cụ thể. Mỗi kênh chỉ lo cách gửi một tiêu đề và một nội dung đi. <code>Notification</code> giữ một tham chiếu tới <code>Channel</code>, và mọi việc gửi đều đi qua đúng một phương thức <code>deliver(title, text)</code>. Tham chiếu ấy chính là cây cầu nối hai phía.</p>
${codeTabs({ files: { python: code("bridge.py"), typescript: code("bridge.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Kênh chat chỉ cần thêm đúng một lớp <code>ChatChannel</code>, và nó dùng được ngay với <code>Promotion</code> mà không lớp tin nào phải sửa. Bốn kênh với ba loại tin giờ là bảy lớp, thay vì mười hai.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Abstraction</strong></td><td>Bàn trượt phía sau, nơi đầu tin nào cũng mang cùng một chốt chuẩn</td><td><code>Notification</code></td></tr>
    <tr><td><strong>Refined abstraction</strong></td><td>Ba đầu tin, với đèn hiệu, mặt đồng hồ và nhãn giá trên nắp</td><td><code>Alert</code>, <code>Reminder</code>, <code>Promotion</code></td></tr>
    <tr><td><strong>Implementor</strong></td><td>Chốt chuẩn trên mỗi khối kênh, chỗ thanh nối ghép vào</td><td><code>Channel</code>, <code>deliver()</code></td></tr>
    <tr><td><strong>Concrete implementor</strong></td><td>Các khối kênh trên bàn trượt phía trước và khối Chat chờ trên bệ</td><td><code>EmailChannel</code>, <code>SmsChannel</code>, <code>PushChannel</code>, <code>ChatChannel</code></td></tr>
    <tr><td><strong>Cây cầu</strong></td><td>Thanh nối trên cột giữa, hạ xuống ghép đúng hai chốt</td><td><code>self.channel</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi một khái niệm thay đổi theo hai hướng độc lập với nhau, như loại thông báo và kênh gửi, loại báo cáo và định dạng xuất, hay thành phần giao diện và nền tảng vẽ nó.</li>
  <li>Khi bạn muốn đổi phần hiện thực ngay lúc chạy, chẳng hạn chuyển một tin sang SMS khi push không gửi được.</li>
  <li>Khi hai phía do hai nhóm khác nhau phát triển, ví dụ nhóm làm nội dung và nhóm lo hạ tầng gửi tin, và bạn muốn họ không phải chờ nhau.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi chỉ có một hướng thay đổi, hoặc phía hiện thực chỉ có đúng một lớp. Bridge lúc đó chỉ thêm một tầng gián tiếp.</li>
  <li>Khi hai phía không thật sự độc lập, chẳng hạn mỗi loại tin cần biết rõ kênh đang dùng để làm việc riêng. Interface ở giữa sẽ phình ra và cây cầu không còn chuẩn nữa.</li>
  <li>Khi số tổ hợp nhỏ và hầu như không đổi. Hai loại tin với một kênh thì viết thẳng sẽ dễ đọc hơn.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Adapter</strong> nối hai thứ đã có sẵn nhưng không khớp nhau, và thường được thêm vào sau. Bridge được thiết kế ngay từ đầu để hai phía phát triển riêng.</li>
  <li><strong>Strategy</strong> cũng cho một đối tượng giữ một đối tượng khác qua interface. Khác biệt là Strategy chỉ thay một thuật toán bên trong một lớp, còn Bridge tách cả một cây lớp thành hai cây và cả hai phía đều có lớp con riêng.</li>
  <li><strong>Abstract Factory</strong> hay đi cùng Bridge để tạo đúng bộ implementor cho từng môi trường. Nó lo chuyện tạo đối tượng, chứ không lo chuyện tách hai hướng thay đổi.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Hãy giữ interface ở giữa thật nhỏ và ổn định.</strong> Ở đây kênh chỉ cần một tiêu đề và một nội dung, nên kênh nào cũng hiện thực được dễ dàng.</li>
  <li><strong>Truyền implementor vào qua constructor.</strong> Đừng để abstraction tự tạo kênh, vì như vậy khi test bạn có thể thay bằng một kênh giả chỉ ghi lại những tin đã gửi.</li>
  <li><strong>Đừng ép mọi kênh hỗ trợ tính năng riêng của một kênh.</strong> Nếu chỉ email gửi được tệp đính kèm, hãy để thông báo hỏi kênh có hỗ trợ hay không, thay vì thêm phương thức đó vào interface chung.</li>
  <li><strong>Đổi kênh lúc chạy chỉ là gán lại tham chiếu.</strong> Ví dụ, thử gửi push trước, và khi push lỗi thì gán kênh SMS rồi gửi lại.</li>
</ul>
`;

const html = patternPage({
  title: "Bridge",
  description: "Bridge tách một thứ thay đổi theo hai hướng thành hai phía nối với nhau qua một interface. Bài học có hình tương tác, bài toán loại thông báo và kênh gửi, và code Python, TypeScript.",
  group: "Structural",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
