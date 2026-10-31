// Builds design-patterns/flyweight/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { RESULTS, SIZE, REPORT, groupDots, kb, mb } from "./model.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// `node build.mjs --debug` writes shots/debug.html with a hook to freeze any step at any time, for checks.
const DEBUG = process.argv.includes("--debug");
const SEEK = `\nwindow.__seek = (index, at, fromIndex) => { touring = false; cancelAnimationFrame(frame); frame = -1; const prev = fromIndex == null ? null : stateAt(STEPS[fromIndex], endOf(STEPS[fromIndex]), null); sel = index; t = at; before = prev; state = stateAt(STEPS[sel], t, before); draw(); return readout.textContent; };`;
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (file) => execFileSync("python3", ["-I", code(file)], { encoding: "utf8" }).trimEnd();
const result = run("flyweight.py");
const before = run("before.py");

// The figure and the examples must tell the same story.
const [copy, share] = RESULTS;
for (const text of [kb(share.batch), mb(share.report)]) if (!result.includes(text)) throw new Error(`flyweight.py does not print ${text}`);
for (const text of [kb(copy.batch), mb(copy.report)]) if (!before.includes(text)) throw new Error(`before.py does not print ${text}`);
const times = Math.floor(copy.report / share.report);

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Flyweight</h1>
<p class="dp-lead">Flyweight giúp rất nhiều đối tượng nhỏ dùng chung phần dữ liệu nặng và không đổi, thay vì mỗi đối tượng giữ một bản sao riêng. Phần riêng của từng đối tượng vẫn ở nguyên chỗ cũ, còn phần chung chỉ tồn tại đúng một lần trong bộ nhớ.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung một job dựng báo cáo bán hàng, nạp cùng lúc ${groupDots(REPORT.lines)} dòng đơn hàng vào bộ nhớ. Dòng nào cũng cần biết sản phẩm của nó, gồm tên, phần mô tả dài và thông tin ảnh. Điều đáng chú ý là ${groupDots(REPORT.lines)} dòng ấy chỉ thuộc về ${REPORT.products} sản phẩm khác nhau.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Phần dữ liệu</th><th>Ví dụ</th><th>Ước tính</th><th>Đặc điểm</th></tr></thead>
  <tbody>
    <tr><td>Thông tin sản phẩm</td><td>tên, mô tả, ảnh</td><td>${groupDots(SIZE.product)} byte</td><td>giống hệt nhau ở mọi dòng cùng sản phẩm</td></tr>
    <tr><td>Phần riêng của dòng</td><td>số lượng, mã đơn</td><td>${SIZE.line} byte</td><td>mỗi dòng một khác</td></tr>
  </tbody>
</table></div>
<p>Lô nhỏ trong hình là mười hai dòng đầu của báo cáo, thuộc ba sản phẩm. Các con số kích thước là ước tính đơn giản để thấy tỉ lệ, với quy ước 1 KB bằng 1.000 byte.</p>

<h2>Khi chưa có Flyweight</h2>
<p>Cách viết tự nhiên nhất là để mỗi dòng giữ luôn đối tượng sản phẩm của riêng nó, đọc từ cơ sở dữ liệu ra là tạo mới:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
${output(before)}
<ul>
  <li><strong>Bộ nhớ tăng theo số dòng chứ không theo số sản phẩm.</strong> ${groupDots(REPORT.lines)} dòng tạo ra ${groupDots(REPORT.lines)} đối tượng sản phẩm, trong khi chỉ có ${REPORT.products} sản phẩm thật sự khác nhau.</li>
  <li><strong>Gần như toàn bộ chỗ ấy là bản sao.</strong> Trong ${mb(copy.report)}, phần thông tin sản phẩm bị chép đi chép lại chiếm hơn chín mươi phần trăm.</li>
  <li><strong>Sửa thông tin sản phẩm phải sửa ở nhiều nơi.</strong> Muốn cập nhật mô tả của một sản phẩm khi job đang chạy, bạn phải tìm cho đủ mọi bản sao của nó.</li>
</ul>

<h2>Lời giải</h2>
<p>Hãy tách dữ liệu của mỗi dòng thành hai phần. Phần nặng và không đổi của sản phẩm, thường gọi là intrinsic state, được gom vào một đối tượng <code>Product</code> bất biến, và đó chính là flyweight. Phần riêng của từng dòng như số lượng, thường gọi là extrinsic state, vẫn nằm trong <code>OrderLine</code> và đi kèm mỗi lần dùng tới sản phẩm.</p>
<p>Lớp <code>ProductCatalog</code> đóng vai factory. Nó giữ một bảng tra theo mã sản phẩm, lần đầu gặp một mã thì tạo đối tượng rồi cất lại, những lần sau trả về đúng đối tượng ấy. Nhờ vậy mỗi sản phẩm chỉ tồn tại một lần, dù có bao nhiêu dòng trỏ tới nó.</p>
${codeTabs({ files: { python: code("flyweight.py"), typescript: code("flyweight.ts") } })}
<p>Kết quả khi chạy, hai bản in ra giống nhau:</p>
${output(result)}
<p>Lô mười hai dòng giờ chỉ cần ba đối tượng sản phẩm, còn cả báo cáo cần ${REPORT.products} thay vì ${groupDots(REPORT.lines)}. Bộ nhớ ước tính giảm từ ${mb(copy.report)} xuống ${mb(share.report)}, tức hơn ${times} lần.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Flyweight</strong></td><td>Con dấu trên mâm xoay, mang hình khắc của một sản phẩm</td><td><code>Product</code></td></tr>
    <tr><td><strong>Flyweight factory</strong></td><td>Mâm xoay, nơi chỉ thêm con dấu khi sản phẩm chưa có</td><td><code>ProductCatalog</code></td></tr>
    <tr><td><strong>Context</strong></td><td>Số lượng mà bánh số in thêm cạnh hình khắc lúc dập</td><td><code>OrderLine</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Đầu ép và băng nhãn, ghép con dấu với số lượng của từng dòng</td><td>job dựng báo cáo, phương thức <code>label()</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Chương trình phải giữ rất nhiều đối tượng cùng lúc, và bạn đã đo được bộ nhớ là vấn đề thật.</li>
  <li>Phần lớn dữ liệu của các đối tượng ấy lặp lại và không đổi, như thông tin sản phẩm trong dòng đơn hàng, kiểu chữ trong trình soạn thảo, loại ô trong sơ đồ kho hay loại cây trên bản đồ game.</li>
  <li>Phần riêng của mỗi đối tượng nhỏ và tách ra được, để có thể truyền vào lúc dùng.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi số đối tượng chỉ vài nghìn, phần bộ nhớ tiết kiệm được rất nhỏ so với độ phức tạp thêm vào.</li>
  <li>Khi phần tưởng là dùng chung lại hay bị sửa theo từng đối tượng, vì khi ấy không thể dùng chung một cách an toàn.</li>
  <li>Khi chưa đo. Hãy đo bộ nhớ trước, vì nút thắt nhiều khi nằm ở chỗ khác.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Singleton</strong> chỉ cho đúng một thể hiện của cả lớp. Flyweight có nhiều thể hiện, mỗi giá trị khác nhau một thể hiện, và chúng được dùng chung theo giá trị.</li>
  <li><strong>Cache</strong> cũng giữ lại đối tượng để dùng lại, nhưng mục đích thường là tránh tính lại hay tải lại. Flyweight nhắm vào bộ nhớ và đòi đối tượng dùng chung phải bất biến.</li>
  <li><strong>Prototype</strong> sao chép một mẫu để có đối tượng mới độc lập. Flyweight làm điều ngược lại: không sao chép mà cùng trỏ tới một đối tượng.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Đối tượng dùng chung phải bất biến. Python có <code>@dataclass(frozen=True)</code>, TypeScript có <code>Object.freeze</code> đi kèm <code>readonly</code>. Nếu không, sửa ở một dòng là sửa luôn mọi dòng đang trỏ tới nó, đúng như bước cuối của hình.</li>
  <li>Chuỗi giống nhau cũng có thể dùng chung theo cách này. Python tự gộp nhiều chuỗi ngắn và có <code>sys.intern</code> cho chuỗi bạn tự tạo, còn các engine JavaScript cũng gộp chuỗi literal. Đó là Flyweight ở mức ngôn ngữ.</li>
  <li>Hãy để factory là nơi duy nhất tạo flyweight. Chỉ cần một chỗ khác gọi thẳng constructor là bản sao lại xuất hiện.</li>
  <li>Khi nhiều thread cùng gọi factory, bảng tra cần được khoá, hoặc bạn tạo sẵn toàn bộ flyweight ngay từ đầu.</li>
  <li>Con số trong bài chỉ là ước tính để thấy tỉ lệ. Muốn biết thật, hãy đo bằng <code>tracemalloc</code> trong Python hoặc heap snapshot trong Node.</li>
</ul>
`;

const html = patternPage({
  title: "Flyweight",
  description: "Flyweight cho rất nhiều đối tượng dùng chung phần dữ liệu nặng và không đổi. Bài học có hình tương tác, bài toán nạp 100.000 dòng đơn hàng và code Python, TypeScript.",
  group: "Structural",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
