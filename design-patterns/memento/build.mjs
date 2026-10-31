// Builds design-patterns/memento/index.html: the figure, then the lesson.
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
// `node build.mjs --debug` writes shots/debug.html with a hook to freeze the timeline at any time, for checks.
const DEBUG = process.argv.includes("--debug");
const SEEK = `\nwindow.__seek = (at) => { touring = false; cancelAnimationFrame(frame); frame = -1; t = at; draw(); return readout.textContent; };`;
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (file) => execFileSync("python3", ["-I", code(file)], { encoding: "utf8" }).trimEnd();
const result = run("memento.py");
const before = run("before.py");
if (!result.startsWith(transcript() + "\n")) throw new Error("memento.py no longer prints the table the figure shows (model.mjs transcript)");

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Memento</h1>
<p class="dp-lead">Memento cho phép một đối tượng tự chụp lại trạng thái của mình thành một bản lưu kín, để sau này quay về đúng trạng thái đó. Nơi cất giữ các bản lưu không cần biết bên trong có gì, nên đối tượng vẫn giữ được các trường riêng của nó.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung trang quản trị của một cửa hàng online, nơi admin chỉnh cấu hình phí giao hàng gồm ba trường. Để dễ so sánh, mỗi bước ta đều tính phí cho cùng một đơn mẫu trị giá 250.000 ₫, giao xa 5 km.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Trường</th><th>Ý nghĩa</th><th>Bản v1</th></tr></thead>
  <tbody>
    <tr><td><code>base</code></td><td>Phí gốc của mỗi đơn</td><td>15.000 ₫</td></tr>
    <tr><td><code>per_km</code></td><td>Phí cộng thêm cho mỗi km</td><td>4.000 ₫</td></tr>
    <tr><td><code>free_from</code></td><td>Đơn từ mức này được miễn phí giao hàng</td><td>300.000 ₫</td></tr>
  </tbody>
</table></div>
<p>Trước mỗi lần chỉnh lớn, admin muốn lưu lại một phiên bản. Nếu lần chỉnh sau làm hỏng giá, họ chỉ cần chọn một phiên bản cũ và bấm khôi phục, thay vì phải nhớ rồi gõ lại từng con số.</p>

<h2>Khi chưa có Memento</h2>
<p>Cách làm thường gặp là để công cụ admin tự đọc các trường của cấu hình rồi chép ra một chỗ khác:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử, ta được kết quả này.</p>
${output(before)}
<ul>
  <li><strong>Công cụ sao lưu phải biết hết ruột của cấu hình.</strong> Nó với vào từng trường riêng, nên cấu hình không còn tự quyết định được trạng thái của mình gồm những gì.</li>
  <li><strong>Thêm một trường là phải nhớ sửa ở nơi khác.</strong> Đoạn sao lưu được viết từ trước khi có ngưỡng miễn phí, nên sau khi khôi phục, ngưỡng vẫn kẹt ở 5.000.000 ₫ và đơn 600.000 ₫ lẽ ra được miễn phí lại bị tính tiền.</li>
  <li><strong>Bản sao lưu có thể bị sửa từ bên ngoài.</strong> Đó chỉ là một dict hay object thường, ai giữ nó cũng ghi đè được, và khi đó bản lưu không còn đáng tin.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta để chính cấu hình, gọi là Originator, tự chụp trạng thái của mình bằng <code>save()</code> và tự khôi phục bằng <code>restore()</code>. Bản chụp mà <code>save()</code> trả về chính là Memento. Bên ngoài chỉ thấy nhãn của nó, còn trạng thái bên trong thì chỉ cấu hình mới mở ra dùng.</p>
<p>Việc cất giữ các bản chụp thuộc về một lớp khác, gọi là Caretaker, ở đây là <code>History</code>. Nó nhận bản chụp, giữ theo nhãn và đưa lại khi được hỏi, nhưng không bao giờ đọc hay sửa bên trong. Bản TypeScript giữ trạng thái trong một <code>WeakMap</code> mà chỉ module của cấu hình truy cập được, nên bản chụp thật sự kín. Python không cấm được việc đọc trường có dấu gạch dưới, nên ta dựa vào quy ước.</p>
${codeTabs({ files: { python: code("memento.py"), typescript: code("memento.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Lần sửa hàng loạt vẫn sai như trước, nhưng giờ chỉ cần hai lời gọi <code>restore()</code> là cấu hình quay về v2 rồi v1, đủ cả ba trường, và đơn 600.000 ₫ lại được miễn phí.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Originator</strong></td><td>Bàn điều khiển với ba cần gạt có motor, tự ghi và tự đọc hộp nhớ</td><td><code>PricingConfig</code></td></tr>
    <tr><td><strong>Memento</strong></td><td>Hộp niêm phong ghi phiên bản, không có cửa sổ nhìn vào trong</td><td><code>Snapshot</code></td></tr>
    <tr><td><strong>Caretaker</strong></td><td>Ngăn nhớ bốn ô đánh số, chỉ giữ hộp mà không đọc được</td><td><code>History</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Nút lưu, nút khôi phục và núm chọn ô</td><td>Đoạn chương trình chính gọi <code>save()</code> và <code>restore()</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi cần lưu phiên bản rồi khôi phục, như cấu hình, bản nháp bài viết hay biểu mẫu nhiều bước, mà không muốn để lộ các trường riêng của đối tượng.</li>
  <li>Khi cần hoàn tác nhưng thao tác không đảo ngược được dễ dàng, chẳng hạn một lệnh sửa hàng loạt hay một phép biến đổi làm mất thông tin.</li>
  <li>Khi muốn chạy thử một thay đổi rồi quay lại nếu kết quả không ổn, như thử một chính sách giá trên bản sao trước khi áp dụng thật.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi trạng thái rất lớn mà lại phải lưu thường xuyên. Mỗi bản chụp là một bản sao trọn vẹn, nên bộ nhớ tăng rất nhanh, và lưu phần chênh lệch hay dùng Command sẽ hợp hơn.</li>
  <li>Khi trạng thái đã nằm trong cơ sở dữ liệu có sẵn lịch sử phiên bản. Lúc đó cứ dùng bảng lịch sử hay audit log, đừng giữ thêm một bản trong bộ nhớ.</li>
  <li>Khi đối tượng chỉ có vài trường công khai và không có ràng buộc nào cần giữ kín. Một bản sao đơn giản là đủ.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Command</strong> hoàn tác bằng phép ngược, như nhập 50 thì hoàn tác bằng cách xuất 50. Memento hoàn tác bằng cách đặt lại cả trạng thái đã chụp, nên dùng được cả khi không có phép ngược, nhưng tốn bộ nhớ hơn. Hai pattern hay đi cùng nhau, khi mỗi lệnh giữ một bản chụp của trạng thái trước nó.</li>
  <li><strong>Prototype</strong> cũng sao chép đối tượng, nhưng để tạo ra một đối tượng mới dùng độc lập. Bản chụp của Memento không dùng để làm việc, nó chỉ để quay về.</li>
  <li><strong>Lưu xuống cơ sở dữ liệu</strong> thường có lịch sử riêng ở tầng dữ liệu. Memento sống trong bộ nhớ, ngay trong tầng nghiệp vụ, và hợp với các thao tác ngắn hạn như hoàn tác trong một phiên làm việc.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Hãy giữ bản chụp bất biến.</strong> Nếu trạng thái có danh sách hay dict lồng bên trong, hãy chép sâu khi chụp, vì nếu không thì sửa cấu hình sau đó sẽ sửa luôn cả bản chụp.</li>
  <li><strong>Đặt giới hạn số bản chụp.</strong> History nên giữ một số bản gần nhất, hoặc bỏ bớt bản cũ theo thời gian, để bộ nhớ không phình ra mãi.</li>
  <li><strong>Để Originator tự quyết định thứ cần chụp.</strong> Khi cấu hình có thêm trường mới, chỉ <code>save()</code> và <code>restore()</code> phải đổi, còn History không cần biết gì.</li>
  <li><strong>Kiểm tra bản chụp khi khôi phục.</strong> Bản TypeScript từ chối một bản chụp không do chính cấu hình tạo ra, để không ai nhét được một trạng thái tự chế vào.</li>
</ul>
`;

const html = patternPage({
  title: "Memento",
  description: "Memento cho đối tượng tự chụp lại trạng thái thành bản lưu kín để khôi phục về sau. Bài học có hình tương tác, bài toán lưu và khôi phục cấu hình phí giao hàng, và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
