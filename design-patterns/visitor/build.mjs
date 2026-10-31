// Builds design-patterns/visitor/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { LINES, NET, RECORDS, VAT_TOTAL, vatOf, vnd } from "./model.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// `node build.mjs --debug` writes shots/debug.html with a hook to freeze the timeline at any time, for checks.
const DEBUG = process.argv.includes("--debug");
const SEEK = `\nwindow.__seek = (at) => { touring = false; cancelAnimationFrame(frame); frame = -1; t = at; draw(); return readout.textContent; };`;
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (file) => execFileSync("python3", ["-I", code(file)], { encoding: "utf8" }).trimEnd();
const result = run("visitor.py");
const before = run("before.py");
// The figure's numbers and the example's must agree.
for (const needle of [`Tổng VAT: ${vnd(VAT_TOTAL)} ₫`, `Đã xuất ${RECORDS.length} dòng, cộng lại ${vnd(NET)} ₫`]) {
  if (!result.includes(needle)) throw new Error(`visitor.py output is missing "${needle}"`);
}

const [product, shipping, discount] = LINES;
const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Visitor</h1>
<p class="dp-lead">Visitor tách các thao tác ra khỏi những lớp mà chúng làm việc cùng. Khi các loại đối tượng gần như đứng yên còn danh sách việc cần làm với chúng cứ dài ra, bạn chỉ cần viết thêm một visitor thay vì sửa từng lớp.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung một hoá đơn bán hàng gồm ba loại dòng. Mỗi loại giữ dữ liệu riêng và chịu thuế theo một cách riêng:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Loại dòng</th><th>Lớp</th><th>Số tiền</th><th>Thuế VAT</th></tr></thead>
  <tbody>
    <tr><td>Sản phẩm</td><td><code>ProductLine</code></td><td>2 × 250.000 = ${vnd(product.amount)} ₫</td><td>${product.rate}%, tức ${vnd(vatOf(product))} ₫</td></tr>
    <tr><td>Giao hàng</td><td><code>ShippingLine</code></td><td>${vnd(shipping.amount)} ₫</td><td>${shipping.rate}%, tức ${vnd(vatOf(shipping))} ₫</td></tr>
    <tr><td>Giảm giá</td><td><code>DiscountLine</code></td><td>${vnd(discount.amount)} ₫</td><td>bớt ${discount.rate}%, tức ${vnd(vatOf(discount))} ₫</td></tr>
  </tbody>
</table></div>
<p>Các loại dòng này hiếm khi đổi. Thứ thay đổi liên tục là những việc cần làm với hoá đơn. Tháng này cần tính VAT, tháng sau cần xuất dữ liệu cho phần mềm kế toán, rồi sẽ đến kiểm tra hợp lệ hay in hoá đơn.</p>

<h2>Khi chưa có Visitor</h2>
<p>Cách làm thường gặp là mỗi thao tác tự viết một chuỗi <code>isinstance</code> để hỏi xem dòng đang xét thuộc loại nào:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử, ta được kết quả này.</p>
${output(before)}
<ul>
  <li><strong>Quên một loại dòng là sai mà không ai hay.</strong> Hàm xuất bỏ sót dòng giảm giá, nên phần mềm kế toán nhận 530.000 ₫ trong khi hoá đơn thật chỉ có ${vnd(NET)} ₫, và chương trình không hề báo lỗi.</li>
  <li><strong>Mỗi thao tác chép lại cùng một chuỗi kiểm tra kiểu.</strong> Có bao nhiêu thao tác thì có bấy nhiêu chuỗi <code>isinstance</code>, và chúng dễ lệch nhau theo thời gian.</li>
  <li><strong>Nhét thao tác vào từng lớp cũng không ổn hơn.</strong> Nếu thêm <code>vat()</code>, <code>to_json()</code> và <code>validate()</code> vào mọi lớp dòng, các lớp ấy phình ra với đủ thứ không liên quan, còn logic của một thao tác lại bị rải ra nhiều nơi.</li>
</ul>

<h2>Lời giải</h2>
<p>Visitor gom mỗi thao tác vào một lớp riêng, gọi là visitor. Mỗi visitor có một phương thức cho từng loại dòng, ở đây là <code>visit_product</code>, <code>visit_shipping</code> và <code>visit_discount</code>. Các lớp dòng chỉ cần thêm đúng một phương thức <code>accept(visitor)</code>, và phương thức ấy gọi phương thức visit dành cho chính loại của mình.</p>
<p>Cách gọi hai lần này có tên là double dispatch. Lần thứ nhất, hoá đơn gọi <code>accept</code> trên một dòng mà không cần biết dòng ấy thuộc loại nào. Lần thứ hai, dòng gọi đúng phương thức visit của mình trên visitor đang ghé thăm, nên phần code chạy phụ thuộc vào cả loại dòng lẫn loại visitor. Trong hình, lỗ cắm của khối chọn bit, còn bộ bit đang lắp quyết định bit ấy làm gì.</p>
${codeTabs({ files: { python: code("visitor.py"), typescript: code("visitor.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Bộ VAT và bộ xuất đi qua đúng ba dòng ấy mà không dòng nào phải sửa. Dòng giảm giá cũng không thể bị quên, vì một visitor thiếu phương thức cho nó sẽ báo lỗi ngay ở lần chạy đầu. Dòng cuối của kết quả cho thấy mặt trái của pattern này: khi thêm loại dòng <code>GiftWrapLine</code>, mọi visitor đều phải viết thêm một phương thức.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Visitor</strong></td><td>Một bộ bit nói chung, với một rãnh cho mỗi loại lỗ cắm</td><td><code>LineVisitor</code></td></tr>
    <tr><td><strong>ConcreteVisitor</strong></td><td>Bộ bit VAT và bộ bit JSON, mỗi bộ có bộ đếm riêng ở đầu</td><td><code>VatVisitor</code>, <code>ExportVisitor</code></td></tr>
    <tr><td><strong>Element</strong></td><td>Khối dòng hoá đơn có lỗ cắm để nhận bit</td><td>phương thức <code>accept(visitor)</code></td></tr>
    <tr><td><strong>ConcreteElement</strong></td><td>Khối sản phẩm lỗ vuông, khối giao hàng lỗ tròn, khối giảm giá lỗ tam giác</td><td><code>ProductLine</code>, <code>ShippingLine</code>, <code>DiscountLine</code></td></tr>
    <tr><td><strong>Object structure</strong></td><td>Hàng khối đứng dọc đường ray</td><td>danh sách <code>invoice</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Xe trượt chạy dọc ray, dừng ở từng khối và đẩy bit vào</td><td>vòng lặp gọi <code>line.accept(vat)</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi tập các loại đối tượng gần như đứng yên còn danh sách thao tác cứ dài ra. Cây cú pháp trong trình biên dịch là ví dụ kinh điển, bên cạnh các dòng hoá đơn, các phần tử của một tài liệu hay các nút trong một cây cấu hình.</li>
  <li>Khi một thao tác cần giữ trạng thái suốt lượt đi, như tổng VAT hay danh sách bản ghi, và bạn muốn trạng thái ấy nằm gọn trong một đối tượng thay vì rải qua nhiều lớp.</li>
  <li>Khi muốn thao tác mới nằm trong một module riêng, chẳng hạn phần xuất cho kế toán do một nhóm khác viết mà không phải chạm vào các lớp lõi.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi các loại đối tượng còn thay đổi thường xuyên. Mỗi loại mới buộc bạn sửa mọi visitor, đúng như bước cuối trong hình.</li>
  <li>Khi chỉ có một hai thao tác. Thêm thẳng một phương thức vào các lớp vẫn đơn giản hơn nhiều.</li>
  <li>Khi ngôn ngữ đã có pattern matching kèm kiểm tra đủ trường hợp. Câu <code>match</code> của Python với <code>assert_never</code>, hay <code>switch</code> trên trường <code>kind</code> của một union trong TypeScript với nhánh kiểu <code>never</code>, cũng bắt được loại bị quên mà không cần <code>accept</code>.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Strategy</strong> cũng đưa thuật toán ra một đối tượng riêng, nhưng đó là một thuật toán thay được cho cùng một kiểu dữ liệu. Visitor chứa nhiều phương thức, mỗi phương thức cho một loại đối tượng, và loại của đối tượng được thăm quyết định phương thức nào chạy.</li>
  <li><strong>Iterator</strong> lo việc đi qua từng phần tử, còn Visitor lo việc làm gì với mỗi phần tử. Hai pattern này rất hay đi cùng nhau.</li>
  <li><strong>Composite</strong> dựng nên một cây đối tượng, và Visitor là cách quen thuộc để thêm thao tác lên cây ấy mà không sửa các lớp nút.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Hãy tạo visitor mới cho mỗi lượt đi.</strong> <code>VatVisitor</code> giữ tổng ngay trong nó, nên dùng lại một visitor cũ sẽ cộng dồn thuế sang hoá đơn khác.</li>
  <li><strong>Mỗi loại đối tượng cần một tên phương thức riêng.</strong> Python và TypeScript không chọn phương thức theo kiểu tham số như Java, nên ta đặt tên <code>visit_product</code> hay <code>visitProduct</code> thay vì một <code>visit</code> chung.</li>
  <li><strong>Cân nhắc kỹ trước khi cho visitor một phương thức mặc định.</strong> Một lớp cha có sẵn <code>visit_gift_wrap</code> rỗng giúp code cũ chạy tiếp, nhưng cũng khiến dòng mới bị bỏ qua trong im lặng, đúng loại lỗi mà Visitor giúp bạn tránh.</li>
  <li><strong>Visitor chỉ thấy những gì đối tượng cho thấy.</strong> Nếu visitor cần dữ liệu bên trong, lớp phải mở thêm thuộc tính để đọc, nên hãy giữ phần mở ra ấy ở mức vừa đủ.</li>
</ul>
`;

const html = patternPage({
  title: "Visitor",
  description: "Visitor tách thao tác ra khỏi các lớp đối tượng, để thêm việc mới mà không sửa từng lớp. Bài học có hình tương tác, bài toán tính VAT và xuất dữ liệu cho các dòng hoá đơn, và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
