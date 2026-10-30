// Builds design-patterns/chain-of-responsibility/index.html: the figure, then the lesson.
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
const result = execFileSync("python3", ["-I", code("chain.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Chain of Responsibility</h1>
<p class="dp-lead">Chain of Responsibility xếp những bên có thể xử lý một yêu cầu thành một chuỗi. Yêu cầu đi vào mắt xích đầu tiên, và mỗi mắt hoặc tự xử lý rồi dừng lại, hoặc chuyển tiếp cho mắt sau. Nhờ vậy bên gửi chỉ cần biết mắt đầu tiên, không cần biết rốt cuộc ai sẽ xử lý.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung một công ty duyệt đề nghị chi theo hạn mức. Mỗi cấp chỉ được duyệt tới một mức tiền nhất định, vượt mức thì đề nghị phải chuyển lên cấp trên.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Thứ tự</th><th>Người duyệt</th><th>Duyệt tới</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Trưởng nhóm</td><td>5.000.000 ₫</td></tr>
    <tr><td>2</td><td>Trưởng phòng</td><td>50.000.000 ₫</td></tr>
    <tr><td>3</td><td>Giám đốc</td><td>200.000.000 ₫</td></tr>
    <tr><td></td><td>Không ai</td><td>Trên 200.000.000 ₫ thì bị từ chối</td></tr>
  </tbody>
</table></div>
<p>Hệ thống nhận những đề nghị như <code>CP-102</code>, xin 20.000.000 ₫ để mua laptop cho nhân viên mới, và phải trả lời được ai sẽ duyệt nó. Quy trình này cũng hay thay đổi. Có phòng thêm cấp phó giám đốc, có lúc trưởng nhóm nghỉ phép và đề nghị phải đi thẳng lên trưởng phòng.</p>

<h2>Khi chưa có Chain of Responsibility</h2>
<p>Cách viết hay gặp là một hàm <code>if</code>/<code>elif</code> biết hết mọi cấp và mọi hạn mức.</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Thêm hay bớt một cấp là phải sửa phần lõi.</strong> Muốn chèn phó giám đốc vào giữa, bạn phải sửa hàm đang chạy và cả các test của nó.</li>
  <li><strong>Thứ tự duyệt bị đóng cứng.</strong> Phòng nào muốn một chuỗi duyệt khác thì lại phải thêm tham số, thêm nhánh, hoặc chép hàm ra thành nhiều bản.</li>
  <li><strong>Mọi quy tắc dồn vào một chỗ.</strong> Những luật như "trưởng nhóm nghỉ phép thì bỏ qua" hay "giám đốc chỉ duyệt khi có mục đích chi" đều thành điều kiện lồng nhau trong cùng một hàm.</li>
  <li><strong>Khó test riêng từng cấp.</strong> Muốn kiểm tra quy tắc của trưởng phòng, bạn vẫn phải đi qua toàn bộ chuỗi <code>if</code>.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta tạo một interface chung cho mọi người duyệt, gọi là <strong>Handler</strong>. Mỗi người duyệt giữ tham chiếu tới người kế tiếp và có phương thức <code>handle(request)</code>. Từng mắt xích cụ thể, gọi là ConcreteHandler, tự quyết định lấy: đủ thẩm quyền thì duyệt và dừng, chưa đủ thì gọi <code>next.handle(request)</code>. Chuỗi được ghép từ bên ngoài bằng <code>set_next</code>, nên muốn đổi thứ tự hay chèn thêm cấp, bạn chỉ cần ghép lại. Bên gửi, tức Client, chỉ giữ mắt đầu tiên.</p>
${codeTabs({ files: { python: code("chain.py"), typescript: code("chain.ts") } })}
<p>Khi chạy, bản Python và bản TypeScript in ra giống hệt nhau:</p>
${output(result)}
<p>Middleware của các web framework cũng dựa trên ý tưởng này. Mỗi mắt, chẳng hạn xác thực, giới hạn tần suất hay kiểm tra dữ liệu, xem qua yêu cầu rồi hoặc dừng lại và trả lỗi, hoặc gọi <code>next()</code> để cho đi tiếp. Điểm khác là trong middleware, nhiều mắt cùng làm một phần việc rồi mới chuyển đi, còn ở bài này chỉ đúng một mắt nhận việc và chuỗi dừng ở đó.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Đầu máng có cửa chắn, nơi đồng xu được thả vào</td><td><code>build_chain()</code> và vòng lặp gửi đề nghị</td></tr>
    <tr><td><strong>Request</strong></td><td>Đồng xu, càng nhiều tiền càng to</td><td><code>Expense</code></td></tr>
    <tr><td><strong>Handler</strong></td><td>Một lỗ trên máng cùng đoạn máng dẫn tới lỗ kế tiếp</td><td><code>Approver</code> với <code>handle</code> và <code>set_next</code></td></tr>
    <tr><td><strong>ConcreteHandler</strong></td><td>Ba lỗ khoét theo hạn mức của từng người, bên dưới là cột và cờ</td><td><code>Approver("Trưởng nhóm", 5_000_000)</code>, …</td></tr>
    <tr><td><strong>Cuối chuỗi</strong></td><td>Thùng từ chối ở cuối máng</td><td>Nhánh <code>self._next is None</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi một yêu cầu có thể do nhiều bên xử lý và chỉ biết được bên nào lúc chạy, như duyệt theo hạn mức, phân loại ticket hỗ trợ theo mức độ, hay chọn chương trình giảm giá đầu tiên áp dụng được.</li>
  <li>Khi cần một chuỗi bước kiểm tra trước khi tới logic chính và bước nào cũng có quyền chặn, như middleware HTTP, bộ lọc dữ liệu nhập hay kiểm tra quyền nhiều lớp.</li>
  <li>Khi muốn ghép, đổi thứ tự hay bật tắt từng mắt theo cấu hình mà không phải sửa những mắt còn lại.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi luật đơn giản và ít đổi, như một bảng ba mức. Một bảng tra hay vài dòng <code>if</code> sẽ dễ đọc hơn một chuỗi đối tượng.</li>
  <li>Khi yêu cầu bắt buộc phải được xử lý. Chuỗi có thể đi hết mà không ai nhận, nên bạn cần một mắt cuối hoặc một nhánh mặc định rõ ràng.</li>
  <li>Khi chuỗi quá dài và mỗi yêu cầu phải đi qua rất nhiều mắt. Lúc đó rất khó lần ra ai đã xử lý, nên mắt nào cũng phải ghi log.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Decorator</strong> cũng xếp các đối tượng thành chuỗi, nhưng mọi lớp đều chạy và cùng thêm hành vi cho một kết quả. Ở Chain of Responsibility, một mắt có thể dừng chuỗi và các mắt sau không chạy nữa.</li>
  <li><strong>Command</strong> gói yêu cầu thành đối tượng để xếp hàng, chạy lại hoặc hoàn tác, còn Chain of Responsibility quyết định ai sẽ xử lý yêu cầu đó. Hai pattern này hay đi cùng nhau, vì yêu cầu chạy trong chuỗi thường chính là một command.</li>
  <li><strong>Strategy</strong> chọn sẵn một thuật toán rồi gọi nó. Ở đây không ai chọn trước, yêu cầu cứ đi dọc chuỗi cho tới khi gặp mắt nhận.</li>
  <li><strong>Observer</strong> gửi một sự kiện tới mọi bên đăng ký cùng lúc. Chain of Responsibility thì đi lần lượt từng mắt và thường dừng ở mắt đầu tiên nhận việc.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Luôn quyết định trước chuyện gì xảy ra ở cuối chuỗi, có thể là trả về "bị từ chối", ném lỗi, hay chuyển cho một mắt mặc định. Đừng để yêu cầu lặng lẽ biến mất.</li>
  <li>Hãy ghép chuỗi ở một chỗ duy nhất, như hàm <code>build_chain</code>, file cấu hình hay DI container, thay vì ghép rải rác trong các mắt. Khi đó, đổi quy trình duyệt chỉ còn là đổi một danh sách.</li>
  <li>Thứ tự cũng là một phần của logic. Ở bài này, mắt có hạn mức nhỏ phải đứng trước, vì nếu đảo lại thì giám đốc sẽ nhận cả đề nghị 3.000.000 ₫. Hãy viết test riêng cho thứ tự của chuỗi.</li>
  <li>Mỗi mắt có thể có logic riêng mà không ảnh hưởng tới mắt khác. Chẳng hạn khi trưởng nhóm nghỉ phép, <code>can_approve</code> trả về <code>False</code> và đề nghị tự đi tiếp.</li>
  <li>Hãy ghi lại mắt nào đã xem và mắt nào đã nhận, để trả lời được câu hỏi vì sao đề nghị này lại lên tới giám đốc.</li>
</ul>
`;

const html = patternPage({
  title: "Chain of Responsibility",
  description: "Chain of Responsibility cho yêu cầu đi dọc một chuỗi bên xử lý, mỗi mắt tự xử lý hoặc chuyển tiếp. Bài có hình tương tác, bài toán duyệt đề nghị chi theo hạn mức và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
