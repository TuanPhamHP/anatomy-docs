// Builds design-patterns/iterator/index.html: the figure, then the lesson.
// Run: node build.mjs   (`--debug` writes shots/debug.html with a hook to freeze the timeline, for checks)
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { ORDERS, PAGES } from "./model.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEBUG = process.argv.includes("--debug");
const SEEK = `\nwindow.__seek = (at) => { touring = false; cancelAnimationFrame(frame); frame = -1; t = at; draw(); return readout.textContent; };`;
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (file) => execFileSync("python3", ["-I", code(file)], { encoding: "utf8" }).trimEnd();
const result = run("iterator.py");
const before = run("before.py");

const pageRows = PAGES.map((page, i) => `<tr><td>${i + 1}</td><td>${page.cursor ? `<code>${page.cursor}</code>` : "không có"}</td><td>${page.orders.map(([c]) => c).join(", ")}</td><td>${page.next ? `<code>${page.next}</code>` : "không có, đây là trang cuối"}</td></tr>`).join("\n    ");

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Iterator</h1>
<p class="dp-lead">Iterator cho phép bạn đi qua từng phần tử của một tập hợp mà không cần biết tập hợp ấy được lưu ra sao, dù nó nằm sẵn trong bộ nhớ, chia thành từng trang trên một API hay đọc dần từ một file lớn. Chỗ gọi chỉ việc xin phần tử kế tiếp, còn chuyện lấy nó ở đâu là việc của iterator.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống cần đọc danh sách đơn hàng từ API của một đối tác. API trả về mỗi lần một trang bốn đơn, kèm một cursor để lấy trang sau, và trang cuối thì không có cursor nào. Hiện có ${ORDERS.length} đơn nằm trong ${PAGES.length} trang như sau:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Trang</th><th>Cursor gửi lên</th><th>Đơn hàng</th><th>Cursor của trang sau</th></tr></thead>
  <tbody>
    ${pageRows}
  </tbody>
</table></div>
<p>Nhiều nơi trong hệ thống cần danh sách này. Báo cáo doanh thu phải đọc hết, còn màn hình tìm kiếm chỉ cần đọc tới đơn đầu tiên trên 2.000.000 ₫ rồi dừng. Ta muốn không nơi nào phải bận tâm tới trang hay cursor, và không trang nào bị tải khi chưa cần.</p>

<h2>Khi chưa có Iterator</h2>
<p>Cách làm thường thấy là chỗ nào cần đơn hàng thì tự viết vòng lặp gọi API, tự giữ cursor và tự quyết lúc nào dừng:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử, ta được kết quả này.</p>
${output(before)}
<ul>
  <li><strong>Logic phân trang bị chép ra khắp nơi.</strong> Mỗi chỗ gọi đều phải biết API trả cursor thế nào và trang cuối trông ra sao, dù việc của nó chỉ là xử lý đơn hàng.</li>
  <li><strong>Chép lại thì dễ chép sai.</strong> Hàm đếm đơn đặt điều kiện dừng sai chỗ nên bỏ sót trang cuối, đếm ra 8 thay vì 10, và chẳng có lỗi nào được báo ra.</li>
  <li><strong>Muốn dừng sớm thì mỗi nơi lại tự xoay xở.</strong> Vòng lặp nào cần ngừng khi đã tìm thấy thứ mình cần cũng phải tự thêm cờ và điều kiện của riêng nó.</li>
  <li><strong>Đối tác đổi API là phải sửa mọi nơi.</strong> Khi họ chuyển từ cursor sang số trang, mọi vòng lặp đã chép đều phải viết lại.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta tách việc duyệt ra một đối tượng riêng, gọi là Iterator. Nó nhớ trang đang cầm và vị trí trong trang, và mỗi lần được gọi <code>next()</code> thì trả về đúng một đơn. Chỉ khi trang trong tay đã dùng hết, nó mới gọi API lấy trang sau bằng cursor. Khi cả trang cuối cũng hết, nó báo cho vòng lặp biết để dừng.</p>
<p>Tập đơn hàng đóng vai Aggregate. Mỗi khi có một vòng lặp mới, nó tạo một iterator mới, nên hai vòng lặp không giẫm lên vị trí của nhau. Python gọi hai phương thức này là <code>__iter__</code> và <code>__next__</code>, còn TypeScript dùng <code>[Symbol.iterator]()</code> và <code>next()</code>, nhờ vậy vòng <code>for</code> quen thuộc dùng được ngay.</p>
${codeTabs({ files: { python: code("iterator.py"), typescript: code("iterator.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Vòng lặp thứ nhất đọc đủ ${ORDERS.length} đơn với ba lần gọi API. Vòng lặp thứ hai dừng ở DH-006 nên chỉ gọi API hai lần, vì iterator chỉ lấy trang khi thật sự cần, và trang thứ ba không bao giờ được tải.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Cần gạt phía trước, mỗi lần kéo là một lần gọi next()</td><td>Vòng <code>for</code></td></tr>
    <tr><td><strong>Aggregate</strong></td><td>Hộp API chứa các khay chưa tải</td><td><code>OrderList</code></td></tr>
    <tr><td><strong>Iterator</strong></td><td>Bộ đọc gồm bánh răng, đầu đọc và cơ cấu đẩy khay, luôn biết khay nào đang đọc và ô nào nằm dưới đầu đọc</td><td><code>OrderIterator</code></td></tr>
    <tr><td><strong>Phần tử</strong></td><td>Tấm phim dưới đầu đọc, cùng đơn hàng hiện trên màn hình</td><td><code>Order</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Dữ liệu đến dần hoặc quá lớn để nạp hết vào bộ nhớ, như API phân trang, kết quả truy vấn đọc theo lô hay một file log hàng triệu dòng.</li>
  <li>Bạn muốn giấu cấu trúc bên trong của một tập hợp, có thể là cây, đồ thị hay nhiều nguồn ghép lại, và chỉ cho bên ngoài một cách duyệt duy nhất.</li>
  <li>Một tập hợp cần nhiều cách duyệt khác nhau, chẳng hạn theo thời gian hay theo từng khách hàng, mà bạn không muốn nhồi hết vào lớp tập hợp.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi dữ liệu nhỏ và đã nằm sẵn trong một list. Ngôn ngữ đã có iterator cho list, viết thêm một lớp chỉ làm code dài hơn.</li>
  <li>Khi bạn cần truy cập ngẫu nhiên, biết trước tổng số phần tử hay đọc đi đọc lại nhiều lần. Iterator chỉ đi tới, nên những việc ấy cần một danh sách thật hoặc một API khác.</li>
  <li>Khi dữ liệu có thể thay đổi giữa chừng mà bạn cần một ảnh chụp nhất quán. Iterator lười thấy dữ liệu ở thời điểm nó lấy từng trang, chứ không phải lúc vòng lặp bắt đầu.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Composite</strong> hay đi cùng Iterator, vì iterator là cách gọn gàng để duyệt một cây composite. Composite lo hình dạng của cây, còn Iterator lo thứ tự đi qua nó.</li>
  <li><strong>Visitor</strong> cũng đi qua một tập đối tượng, nhưng nó mang theo một thao tác để làm trên từng loại phần tử. Iterator chỉ đưa từng phần tử ra, còn làm gì với phần tử đó là việc của chỗ gọi.</li>
  <li><strong>Generator</strong> trong Python hay TypeScript không phải một pattern khác. Đó là cách ngôn ngữ giúp bạn viết Iterator ngắn hơn, vì hàm có <code>yield</code> tự nhớ mình đang dừng ở đâu.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Mỗi vòng lặp nên có một iterator riêng.</strong> Nếu <code>__iter__</code> trả về một đối tượng dùng chung đang giữ vị trí, hai vòng lặp sẽ giẫm lên nhau và vòng sau có thể chẳng nhận được đơn nào.</li>
  <li><strong>Trong Python, generator viết ngắn hơn nhiều.</strong> Cả lớp <code>OrderIterator</code> có thể thay bằng một hàm với vòng <code>while</code> và <code>yield</code>, còn việc nhớ vị trí và báo dừng thì Python tự lo.</li>
  <li><strong>Với API thật, hãy dùng iterator bất đồng bộ.</strong> Python có <code>async for</code> với <code>__anext__</code>, TypeScript có <code>for await</code> với <code>Symbol.asyncIterator</code>, để việc chờ mạng không chặn cả chương trình.</li>
  <li><strong>Hãy dọn dẹp khi vòng lặp dừng sớm.</strong> Nếu iterator giữ kết nối hay file, hãy đóng chúng khi gặp <code>break</code>, chẳng hạn bằng <code>try/finally</code> trong generator hoặc phương thức <code>return()</code> trong TypeScript.</li>
</ul>
`;

const html = patternPage({
  title: "Iterator",
  description: "Iterator cho phép duyệt từng phần tử mà không cần biết tập hợp được lưu ra sao. Bài học có hình tương tác, bài toán đọc đơn hàng từ một API phân trang và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
