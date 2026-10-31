// Builds design-patterns/prototype/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { CUSTOMER, EXTRA, STEPS, TEMPLATE, groupVND, total } from "./model.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (file) => execFileSync("python3", ["-I", code(file)], { encoding: "utf8" }).trimEnd();
const result = run("prototype.py");
const before = run("before.py");

// The model and the example must tell the same story.
const base = groupVND(total(TEMPLATE.items));
const custom = groupVND(total(STEPS[2].copy));
for (const needle of [`3 hạng mục, ${base} ₫`, `4 hạng mục, ${custom} ₫`, `khách ${CUSTOMER}`]) {
  if (!result.includes(needle)) throw new Error(`prototype.py output is missing "${needle}"`);
}

const vnd = (n) => `${groupVND(n)} ₫`;
const rows = TEMPLATE.items.map((item) => `<tr><td>${item.name}</td><td>${vnd(item.price)}</td></tr>`).join("");

const body = `
<p class="dp-eyebrow">Creational pattern</p>
<h1>Prototype</h1>
<p class="dp-lead">Prototype tạo đối tượng mới bằng cách sao chép một đối tượng mẫu đã được cấu hình sẵn, thay vì dựng lại từ đầu. Bên gọi chỉ cần chọn mẫu và gọi <code>clone()</code>, còn bản sao tự mang theo mọi thứ mà mẫu đang có.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung phòng kinh doanh của một công ty bảo trì thiết bị. Họ tự cấu hình các gói dịch vụ mẫu ngay trong trang quản trị, và mỗi gói gồm một danh sách hạng mục cùng điều khoản thanh toán, bảo hành. Gói ${TEMPLATE.name} trông như sau:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Hạng mục</th><th>Giá mỗi năm</th></tr></thead>
  <tbody>${rows}<tr><td><strong>Tổng</strong></td><td><strong>${vnd(total(TEMPLATE.items))}</strong></td></tr></tbody>
</table></div>
<p>Khi ký với khách mới, nhân viên chọn một gói mẫu rồi chỉnh vài chỗ cho riêng khách đó. Khách ${CUSTOMER} muốn thêm hạng mục ${EXTRA.name} giá ${vnd(EXTRA.price)}, nên hợp đồng của họ phải là ${vnd(total(STEPS[2].copy))}. Gói mẫu thì phải giữ nguyên ${vnd(total(TEMPLATE.items))} cho những khách đến sau.</p>
<p>Vì gói mẫu là dữ liệu do người dùng cấu hình lúc chạy, code không thể viết sẵn một hàm dựng riêng cho từng gói.</p>

<h2>Khi chưa có Prototype</h2>
<p>Cách làm hay gặp là tạo hợp đồng mới rồi chép tay từng trường của gói mẫu sang:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử thì thấy ngay hai lỗi:</p>
${output(before)}
<ul>
  <li><strong>Trường mới rất dễ bị bỏ sót.</strong> Trường điều khoản được thêm vào lớp sau này, nhưng chỗ chép tay không ai nhớ sửa, nên hợp đồng của ${CUSTOMER} thiếu điều khoản.</li>
  <li><strong>Gói mẫu bị sửa theo mà không ai hay.</strong> Dòng <code>items=standard.items</code> chỉ chép tham chiếu, nên thêm hạng mục cho ${CUSTOMER} cũng là thêm vào gói mẫu. Khách tiếp theo sẽ nhận gói ${vnd(total(STEPS[3].template))}.</li>
  <li><strong>Nơi nào tạo hợp đồng cũng phải biết cấu trúc bên trong của gói.</strong> Mỗi nơi phải tự nhớ gói có những trường nào và trường nào cần chép sâu, nên càng nhiều nơi gọi thì càng nhiều chỗ để sai.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta giao việc sao chép cho chính đối tượng mẫu. Lớp <code>ServicePackage</code> có phương thức <code>clone()</code> trả về một bản sao đầy đủ, chép sâu cả danh sách hạng mục lẫn điều khoản, nên bản sao không còn dính gì tới mẫu. Đối tượng mẫu đóng vai Prototype, còn bản sao là một đối tượng mới cùng lớp.</p>
<p>Các gói mẫu được giữ trong một kho, ở đây là từ điển <code>PROTOTYPES</code>. Hàm <code>new_contract()</code> lấy mẫu theo tên, gọi <code>clone()</code> rồi chỉnh những gì riêng cho khách, và nó không cần biết gói có bao nhiêu trường.</p>
${codeTabs({ files: { python: code("prototype.py"), typescript: code("prototype.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Với bản sao sâu, gói mẫu vẫn còn ba hạng mục và ${vnd(total(TEMPLATE.items))}. Phần cuối làm lại đúng việc ấy với một bản sao nông để thấy cái bẫy. Tên khách là một giá trị đơn nên không lọt sang mẫu, nhưng danh sách hạng mục thì hai bên dùng chung, nên mẫu cũng lên ${vnd(total(STEPS[3].template))}.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Prototype</strong></td><td>Chìa gốc kẹp ở ê-tô bên trái, để máy dò theo</td><td><code>ServicePackage</code> với phương thức <code>clone()</code></td></tr>
    <tr><td><strong>Bản sao</strong></td><td>Chìa được cắt ra ở ê-tô bên phải, có giá hạng mục của riêng nó</td><td><code>an_phat</code>, kết quả của <code>clone()</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Người đứng máy, chỉ chọn chìa gốc rồi bấm cắt</td><td><code>new_contract()</code></td></tr>
    <tr><td><strong>Kho mẫu</strong></td><td>Không có trong hình, giống một tủ treo các chìa gốc</td><td><code>PROTOTYPES</code></td></tr>
    <tr><td><strong>Phần lồng bên trong</strong></td><td>Giá treo thẻ, mỗi thẻ là một hạng mục</td><td><code>items</code>, <code>terms</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi đối tượng được cấu hình lúc chạy, bởi người dùng hay từ cơ sở dữ liệu, và mỗi đối tượng mới chỉ khác mẫu ở vài chỗ. Gói dịch vụ, mẫu báo giá, mẫu email hay cấu hình sản phẩm đều thuộc loại này.</li>
  <li>Khi dựng một đối tượng từ đầu rất tốn kém, chẳng hạn phải đọc nhiều bảng hay tính toán lâu, còn sao chép một bản đã có thì rẻ hơn nhiều.</li>
  <li>Khi bên gọi không nên biết lớp cụ thể hay cấu trúc bên trong của đối tượng, mà chỉ cần một bản giống mẫu.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi đối tượng đơn giản và một hàm dựng hay Builder đã đủ rõ. Sao chép lúc đó không đem lại gì, lại kéo theo rủi ro chép nông.</li>
  <li>Khi đối tượng giữ tài nguyên không chép được, như kết nối cơ sở dữ liệu, file đang mở hay khoá. Bản sao sẽ dùng chung tài nguyên ấy với mẫu và gây ra những lỗi rất khó tìm.</li>
  <li>Khi đồ thị đối tượng có tham chiếu vòng hoặc cố ý dùng chung một phần. Chép sâu tất cả khi đó có thể tạo ra quá nhiều bản, hoặc tách rời những thứ vốn phải dùng chung.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Factory Method</strong> cũng tạo đối tượng mà bên gọi không cần biết lớp cụ thể, nhưng nó dựng đối tượng mới từ đầu trong lớp con. Prototype sao chép một đối tượng đã có, nên thứ được chép là cả dữ liệu lẫn cấu hình.</li>
  <li><strong>Builder</strong> lắp một đối tượng phức tạp qua từng bước. Prototype bỏ qua các bước ấy bằng cách chép từ một mẫu đã lắp xong, và hai pattern có thể đi cùng nhau, dựng mẫu bằng Builder rồi tạo hàng loạt bằng <code>clone()</code>.</li>
  <li><strong>Memento</strong> cũng chụp lại trạng thái của đối tượng, nhưng để khôi phục về sau. Bản sao của Prototype là một đối tượng mới, sống độc lập với mẫu.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Hãy quyết định rõ phần nào phải chép sâu.</strong> Danh sách, từ điển và các đối tượng lồng bên trong đều cần chép sâu, nếu không bản sao sẽ dùng chung chúng với mẫu như ở bước cuối của hình.</li>
  <li><strong>Trong TypeScript, <code>structuredClone</code> trả về đối tượng thường.</strong> Nó chép sâu dữ liệu nhưng làm mất lớp và phương thức, nên ví dụ dùng nó cho phần dữ liệu rồi dựng lại lớp. Còn toán tử spread như <code>{ ...pkg }</code> thì chỉ chép nông.</li>
  <li><strong>Đặt lại những trường không được chép.</strong> Mã định danh, ngày tạo hay trạng thái phải là của bản sao, nên <code>clone()</code> hoặc hàm gọi nó cần gán lại các trường này.</li>
  <li><strong>Đừng sửa trực tiếp đối tượng trong kho mẫu.</strong> Mọi thay đổi cho khách đều làm trên bản sao. Nếu cần, hãy đóng băng mẫu để bắt sớm những chỗ lỡ tay sửa vào nó.</li>
</ul>
`;

const html = patternPage({
  title: "Prototype",
  description: "Prototype tạo đối tượng mới bằng cách sao chép một mẫu đã cấu hình sẵn. Bài học có hình tương tác là một máy sao chép chìa khoá, bài toán gói dịch vụ mẫu, cái bẫy chép nông và code Python, TypeScript.",
  group: "Creational",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
