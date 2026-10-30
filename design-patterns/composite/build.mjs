// Builds design-patterns/composite/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (name) => execFileSync("python3", ["-I", code(name)], { encoding: "utf8" }).trimEnd();
const result = run("composite.py");
const before = run("before.py");

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Composite</h1>
<p class="dp-lead">Composite ghép các object thành cây bộ phận và tổng thể, rồi cho phần lẻ và nhóm dùng chung một interface. Code bên ngoài gọi cùng một hàm cho một món đơn lẻ hay cả một thùng chứa thùng, và không cần biết bên trong lồng bao nhiêu tầng.</p>

${plate}

<h2>Bài toán</h2>
<p>Kho đóng gói cần cân từng kiện trước khi giao, vì phí vận chuyển tính theo khối lượng. Một kiện có thể là:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Kiện</th><th>Bên trong</th><th>Khối lượng</th></tr></thead>
  <tbody>
    <tr><td>Bình gốm</td><td>(một món hàng)</td><td>1,5 kg</td></tr>
    <tr><td>Hộp nhỏ</td><td>vỏ hộp 0,3 kg, bình giữ nhiệt 0,6 kg, hộp trà 0,5 kg</td><td>1,4 kg</td></tr>
    <tr><td>Thùng lớn</td><td>vỏ thùng 0,9 kg, một hộp nhỏ như trên, sách 1,2 kg, bình gốm 1,5 kg</td><td>5,0 kg</td></tr>
  </tbody>
</table></div>
<p>Hộp có thể nằm trong thùng, thùng có thể nằm trong thùng lớn hơn. Ngoài khối lượng, kho còn cần in danh sách đóng gói, đếm số món, tính giá trị khai báo: thao tác nào cũng phải đi hết cây kiện hàng.</p>

<h2>Khi chưa có Composite</h2>
<p>Dữ liệu là các dict có trường <code>kind</code>, và hàm cân tự hỏi từng thứ là món hàng hay hộp. Hàm này được viết khi hộp chỉ chứa món hàng:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
${output(before)}
<p>Thùng lớn ra 3,6 kg thay vì 5,0 kg: hộp nhỏ bên trong không có trường <code>grams</code>, nên bị cộng như 0 mà không ai báo lỗi.</p>
<ul>
  <li><strong>Mỗi tầng lồng là một vòng lặp mới.</strong> Muốn cân đúng hộp trong thùng phải viết thêm một vòng lặp lồng, rồi lại thêm nữa khi có thùng trong thùng.</li>
  <li><strong>Kiểm tra loại rải khắp nơi.</strong> Hàm in danh sách đóng gói, hàm đếm món, hàm tính giá trị đều phải lặp lại cùng chuỗi <code>if kind == ...</code> và cùng cách đi cây.</li>
  <li><strong>Thêm loại mới là sửa mọi hàm.</strong> Thêm "túi quà" hay "pallet" nghĩa là tìm và sửa từng chỗ đang hỏi <code>kind</code>.</li>
  <li><strong>Sai mà không lỗi.</strong> Như ví dụ trên, thiếu một nhánh không làm chương trình dừng, chỉ cho ra con số sai.</li>
</ul>

<h2>Lời giải</h2>
<p>Định nghĩa một interface chung cho mọi thứ đặt lên cân (<strong>Component</strong>): <code>Parcel</code> với <code>weight()</code> và <code>lines()</code>. Món hàng (<strong>Leaf</strong>) trả về khối lượng của chính nó. Hộp (<strong>Composite</strong>) cũng là một <code>Parcel</code>, giữ danh sách con và cộng vỏ hộp với <code>weight()</code> của từng con; con là món hàng hay hộp khác đều được, vì con nào cũng tự lo phần của mình. Cái cân (<strong>Client</strong>) chỉ gọi <code>weight()</code>.</p>
${codeTabs({ files: { python: code("composite.py"), typescript: code("composite.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}
<p>Danh sách đóng gói phía dưới là thao tác thứ hai trên cùng cây: mỗi nút tự in mình rồi nhờ các con in tiếp, không có dòng nào hỏi "đây là món hay hộp".</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Bàn cân, cảm biến lực và đồng hồ kim</td><td><code>weigh()</code></td></tr>
    <tr><td><strong>Component</strong></td><td>Bất cứ kiện nào đặt lên bàn cân</td><td><code>Parcel</code></td></tr>
    <tr><td><strong>Leaf</strong></td><td>Bình gốm, bình giữ nhiệt, hộp trà, cuốn sách</td><td><code>Item</code></td></tr>
    <tr><td><strong>Composite</strong></td><td>Hộp các-tông và thùng gỗ, kể cả hộp nằm trong thùng</td><td><code>Box</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Dữ liệu tự nhiên có dạng cây bộ phận và tổng thể: kiện hàng và thùng, danh mục và danh mục con, dự án gồm giai đoạn gồm công việc, menu gồm menu con, phòng ban gồm phòng ban, sản phẩm combo gồm sản phẩm và combo nhỏ hơn.</li>
  <li>Code gọi muốn xử lý một phần tử lẻ và một nhóm theo cùng một cách: tính tổng, đếm, in, kiểm tra quyền, xuất ra cây JSON.</li>
  <li>Độ sâu của cây không biết trước, hoặc người dùng tự lồng được (thư mục, nhóm quyền, bộ lọc gồm điều kiện AND/OR lồng nhau).</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Cấu trúc luôn phẳng, hoặc chỉ có đúng hai tầng cố định: một danh sách và một vòng lặp đọc dễ hơn.</li>
  <li>Phần lẻ và nhóm thực ra cần những thao tác rất khác nhau. Ép chúng vào chung một interface sẽ đẻ ra các hàm "không hỗ trợ" ở một phía.</li>
  <li>Cây rất sâu hoặc rất lớn và phải tính lại liên tục: đệ quy mỗi lần gọi có thể chậm, khi đó cần cache tổng ở từng nút hoặc tính trong database.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Decorator</strong> cũng bọc một object cùng interface, nhưng bọc đúng một object để thêm hành vi. Composite chứa nhiều con và gộp kết quả của chúng.</li>
  <li><strong>Iterator</strong> lo cách duyệt qua các phần tử. Composite lo cấu trúc cây; hai pattern hay đi cùng nhau khi cần duyệt cây theo nhiều kiểu.</li>
  <li><strong>Visitor</strong> thêm thao tác mới lên một cây có sẵn mà không sửa các lớp nút. Khi cây Composite cần quá nhiều thao tác, Visitor giúp tách chúng ra.</li>
  <li><strong>Chain of Responsibility</strong> cũng nối các object với nhau, nhưng thành một chuỗi để chuyển yêu cầu đi tiếp, không phải để gộp kết quả từ con lên cha.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Chỉ đặt trên interface chung những thao tác có nghĩa cho cả lá và nhóm (<code>weight()</code>, <code>lines()</code>). <code>add()</code> chỉ có ở <code>Box</code>, nên không thể vô tình thêm con vào một món hàng.</li>
  <li>Nhóm có thể đóng góp phần của chính nó, như vỏ hộp ở đây, chứ không chỉ cộng các con.</li>
  <li>Không để một nút nằm trong chính nó hoặc trong con cháu của nó: đệ quy sẽ không bao giờ dừng. Khi người dùng tự lồng được (thư mục, nhóm quyền), kiểm tra vòng lặp lúc thêm con.</li>
  <li>Trong database, cây thường lưu bằng <code>parent_id</code>; dựng lại cây object rồi gọi đệ quy, hoặc dùng truy vấn đệ quy (CTE) khi chỉ cần một con số tổng.</li>
</ul>
`;

const html = patternPage({
  title: "Composite",
  description: "Composite pattern: phần lẻ và nhóm dùng chung một interface, nên code gọi xử lý cả cây như một object. Hình tương tác cân băng tải, bài toán cân kiện hàng lồng nhau, code Python và TypeScript.",
  group: "Structural",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
