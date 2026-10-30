// Builds design-patterns/composite/index.html: the figure, then the lesson.
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

// The printed results come from running the examples, so the page can't drift from the code.
const run = (name) => execFileSync("python3", ["-I", code(name)], { encoding: "utf8" }).trimEnd();
const result = run("composite.py");
const before = run("before.py");

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Composite</h1>
<p class="dp-lead">Composite cho phép bạn xếp các đối tượng thành một cây, trong đó món lẻ và nhóm chứa nhiều món dùng chung một interface. Nhờ vậy, code bên ngoài gọi cùng một phương thức dù trước mặt nó là một món hàng hay một thùng lồng nhiều tầng hộp.</p>

${plate}

<h2>Bài toán</h2>
<p>Một kho đóng gói phải cân từng kiện trước khi giao, vì phí vận chuyển tính theo khối lượng. Kiện hàng thì đủ loại, từ một món lẻ cho tới một thùng chứa cả hộp lẫn món:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Kiện</th><th>Bên trong</th><th>Khối lượng</th></tr></thead>
  <tbody>
    <tr><td>Bình gốm</td><td>chỉ có chính nó</td><td>1,5 kg</td></tr>
    <tr><td>Hộp nhỏ</td><td>vỏ hộp 0,3 kg, bình giữ nhiệt 0,6 kg, hộp trà 0,5 kg</td><td>1,4 kg</td></tr>
    <tr><td>Thùng lớn</td><td>vỏ thùng 0,9 kg, một hộp nhỏ như trên, sách 1,2 kg, bình gốm 1,5 kg</td><td>5,0 kg</td></tr>
  </tbody>
</table></div>
<p>Hộp có thể nằm trong thùng, và thùng lại có thể nằm trong một thùng lớn hơn. Ngoài khối lượng, kho còn phải in danh sách đóng gói, đếm số món và tính giá trị khai báo, nên thao tác nào cũng phải đi qua hết cây kiện hàng.</p>

<h2>Khi chưa có Composite</h2>
<p>Cách làm quen thuộc là lưu kiện hàng thành các dict có trường <code>kind</code>, rồi để hàm cân tự hỏi từng thứ là món hàng hay hộp. Hàm dưới đây được viết từ hồi hộp chỉ đựng món hàng:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
${output(before)}
<p>Thùng lớn chỉ ra 3,6 kg thay vì 5,0 kg. Hộp nhỏ bên trong không có trường <code>grams</code>, nên nó bị cộng như 0 mà chẳng có lỗi nào được báo.</p>
<ul>
  <li><strong>Mỗi tầng lồng cần thêm một vòng lặp.</strong> Muốn cân đúng hộp nằm trong thùng, bạn phải viết thêm một vòng lặp lồng bên trong, rồi lại thêm một vòng nữa khi xuất hiện thùng trong thùng.</li>
  <li><strong>Phép kiểm tra loại bị rải khắp nơi.</strong> Hàm in danh sách đóng gói, hàm đếm món và hàm tính giá trị đều phải lặp lại cùng chuỗi <code>if kind == ...</code> và cùng một cách đi qua cây.</li>
  <li><strong>Thêm một loại kiện là phải sửa mọi hàm.</strong> Muốn có thêm túi quà hay pallet, bạn phải tìm và sửa từng chỗ đang hỏi <code>kind</code>.</li>
  <li><strong>Code sai mà không hề báo lỗi.</strong> Như ví dụ trên, thiếu một nhánh không làm chương trình dừng lại, nó chỉ lặng lẽ cho ra một con số sai.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta định nghĩa một interface chung cho mọi thứ có thể đặt lên cân, gọi là Component. Ở đây đó là <code>Parcel</code>, với hai phương thức <code>weight()</code> và <code>lines()</code>. Món hàng đóng vai Leaf và chỉ trả về khối lượng của chính nó.</p>
<p>Hộp đóng vai Composite. Bản thân nó cũng là một <code>Parcel</code>, giữ danh sách con và cộng vỏ hộp với <code>weight()</code> của từng con. Con là món hàng hay là một hộp khác cũng không sao, vì con nào cũng tự lo phần của mình. Còn cái cân, tức Client, chỉ việc gọi <code>weight()</code>.</p>
${codeTabs({ files: { python: code("composite.py"), typescript: code("composite.ts") } })}
<p>Chạy thử, bản Python và bản TypeScript in ra giống hệt nhau:</p>
${output(result)}
<p>Phần danh sách đóng gói ở cuối là thao tác thứ hai chạy trên cùng cây ấy. Mỗi nút tự in dòng của mình rồi nhờ các con in tiếp, và không có dòng code nào phải hỏi đây là món hay hộp.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Bàn cân, cảm biến lực và đồng hồ kim</td><td><code>weigh()</code></td></tr>
    <tr><td><strong>Component</strong></td><td>Bất cứ kiện nào được đặt lên bàn cân</td><td><code>Parcel</code></td></tr>
    <tr><td><strong>Leaf</strong></td><td>Bình gốm, bình giữ nhiệt, hộp trà, cuốn sách</td><td><code>Item</code></td></tr>
    <tr><td><strong>Composite</strong></td><td>Hộp các-tông và thùng gỗ, kể cả hộp nằm trong thùng</td><td><code>Box</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Dữ liệu của bạn vốn có dạng cây, gồm những phần lẻ nằm trong các nhóm lớn hơn. Kiện hàng trong thùng, danh mục và danh mục con, dự án chia thành giai đoạn rồi thành công việc, menu lồng menu hay combo chứa combo nhỏ hơn đều là những cây như vậy.</li>
  <li>Code gọi muốn đối xử với một phần tử lẻ và cả một nhóm theo cùng một cách, chẳng hạn để tính tổng, đếm, in ra, kiểm tra quyền hay xuất thành cây JSON.</li>
  <li>Bạn không biết trước cây sâu bao nhiêu tầng, hoặc người dùng tự lồng được, như với thư mục, nhóm quyền hay bộ lọc có các điều kiện AND, OR lồng nhau.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Cấu trúc luôn phẳng hoặc chỉ có đúng hai tầng cố định. Khi đó một danh sách và một vòng lặp sẽ dễ đọc hơn nhiều.</li>
  <li>Phần lẻ và nhóm thực ra cần những thao tác rất khác nhau. Ép chúng dùng chung một interface sẽ sinh ra các phương thức chỉ để báo "không hỗ trợ" ở một phía.</li>
  <li>Cây rất sâu hoặc rất lớn mà lại phải tính đi tính lại liên tục. Đệ quy ở mỗi lần gọi có thể chậm, nên bạn cần cache tổng ở từng nút hoặc để database tính.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Decorator</strong> cũng bọc một đối tượng có cùng interface, nhưng chỉ bọc đúng một đối tượng để thêm hành vi. Composite thì chứa nhiều con và gộp kết quả của chúng lại.</li>
  <li><strong>Iterator</strong> lo cách duyệt qua các phần tử, còn Composite lo cấu trúc của cây. Hai pattern này hay đi cùng nhau khi bạn cần duyệt cây theo nhiều kiểu khác nhau.</li>
  <li><strong>Visitor</strong> thêm thao tác mới cho một cây có sẵn mà không phải sửa các lớp nút. Khi cây Composite phải gánh quá nhiều thao tác, Visitor giúp tách chúng ra khỏi các lớp đó.</li>
  <li><strong>Chain of Responsibility</strong> cũng nối các đối tượng với nhau, nhưng nối thành một chuỗi để chuyền yêu cầu đi tiếp, chứ không gộp kết quả từ con lên cha.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Chỉ đưa lên interface chung những thao tác có nghĩa với cả lá lẫn nhóm, như <code>weight()</code> và <code>lines()</code>. Phương thức <code>add()</code> chỉ có ở <code>Box</code>, nên không ai vô tình thêm con vào một món hàng được.</li>
  <li>Nhóm có thể góp phần của riêng nó vào kết quả, như khối lượng vỏ hộp trong ví dụ, chứ không chỉ cộng dồn các con.</li>
  <li>Đừng để một nút nằm trong chính nó hay trong con cháu của nó, vì đệ quy sẽ chạy mãi không dừng. Khi người dùng được tự lồng, như với thư mục hay nhóm quyền, hãy kiểm tra vòng lặp ngay lúc thêm con.</li>
  <li>Trong database, người ta thường lưu cây bằng cột <code>parent_id</code>. Bạn có thể dựng lại cây đối tượng rồi gọi đệ quy, hoặc viết một truy vấn đệ quy bằng CTE khi chỉ cần một con số tổng.</li>
</ul>
`;

const html = patternPage({
  title: "Composite",
  description: "Composite cho món lẻ và nhóm dùng chung một interface, nên code gọi xử lý cả cây như một đối tượng. Bài có hình tương tác về một cân băng tải, bài toán cân kiện hàng lồng nhau và code Python, TypeScript.",
  group: "Structural",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
