// Builds design-patterns/chain-of-responsibility/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed result comes from running the example, so the page can't drift from the code.
const result = execFileSync("python3", ["-I", code("chain.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Chain of Responsibility</h1>
<p class="dp-lead">Chain of Responsibility xếp các bên xử lý thành một chuỗi. Yêu cầu đi vào mắt đầu tiên; mỗi mắt hoặc tự xử lý và dừng chuỗi, hoặc chuyển cho mắt kế tiếp. Bên gửi chỉ biết mắt đầu, không cần biết ai sẽ là người xử lý thật.</p>

${plate}

<h2>Bài toán</h2>
<p>Công ty duyệt đề nghị chi theo hạn mức. Mỗi cấp chỉ được duyệt tới một mức tiền; vượt mức thì đề nghị phải lên cấp trên:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Thứ tự</th><th>Người duyệt</th><th>Duyệt tới</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Trưởng nhóm</td><td>5.000.000 ₫</td></tr>
    <tr><td>2</td><td>Trưởng phòng</td><td>50.000.000 ₫</td></tr>
    <tr><td>3</td><td>Giám đốc</td><td>200.000.000 ₫</td></tr>
    <tr><td></td><td>Không ai</td><td>Trên 200.000.000 ₫: bị từ chối</td></tr>
  </tbody>
</table></div>
<p>Hệ thống nhận các đề nghị như <code>CP-102</code>: 20.000.000 ₫ mua laptop cho nhân viên mới, và phải trả lời ai duyệt đề nghị đó. Quy trình này còn đổi: có phòng thêm cấp Phó giám đốc, có lúc trưởng nhóm nghỉ phép và đề nghị phải đi thẳng lên trưởng phòng.</p>

<h2>Khi chưa có Chain of Responsibility</h2>
<p>Cách viết thường gặp là một hàm <code>if</code>/<code>elif</code> biết hết mọi cấp và mọi hạn mức:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Thêm hay bớt một cấp là sửa lõi.</strong> Chèn Phó giám đốc vào giữa nghĩa là sửa hàm đang chạy và các test của nó.</li>
  <li><strong>Thứ tự bị đóng cứng.</strong> Mỗi phòng muốn một chuỗi duyệt khác thì phải có thêm tham số và thêm nhánh, hoặc chép hàm ra thành nhiều bản.</li>
  <li><strong>Mọi quy tắc dồn vào một chỗ.</strong> "Trưởng nhóm nghỉ phép thì bỏ qua", "giám đốc chỉ duyệt khi có mục đích chi" đều thành điều kiện lồng trong cùng một hàm.</li>
  <li><strong>Khó test riêng một cấp.</strong> Muốn kiểm tra quy tắc của trưởng phòng phải đi qua toàn bộ chuỗi <code>if</code>.</li>
</ul>

<h2>Lời giải</h2>
<p>Tạo một interface chung cho người xử lý (<strong>Handler</strong>): mỗi người duyệt giữ tham chiếu tới người kế tiếp và có một hàm <code>handle(request)</code>. Mỗi mắt (<strong>ConcreteHandler</strong>) tự quyết: đủ thẩm quyền thì duyệt và dừng, không thì gọi <code>next.handle(request)</code>. Chuỗi được ghép từ bên ngoài bằng <code>set_next</code>, nên đổi thứ tự hay chèn thêm cấp chỉ là đổi chỗ ghép. Bên gửi (<strong>Client</strong>) chỉ giữ mắt đầu tiên.</p>
${codeTabs({ files: { python: code("chain.py"), typescript: code("chain.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}
<p>Middleware của một web framework là cùng ý tưởng ở dạng khác: mỗi mắt (xác thực, giới hạn tần suất, kiểm tra dữ liệu) xem yêu cầu rồi hoặc dừng lại và trả lỗi, hoặc gọi <code>next()</code> để cho đi tiếp. Khác ở chỗ trong middleware nhiều mắt cùng làm một phần việc rồi mới chuyển, còn ở bài này chỉ đúng một mắt nhận và chuỗi dừng ở đó.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Đầu máng có cửa chắn, nơi đồng xu được thả vào</td><td><code>build_chain()</code> và vòng lặp gửi đề nghị</td></tr>
    <tr><td><strong>Request</strong></td><td>Đồng xu, to theo số tiền</td><td><code>Expense</code></td></tr>
    <tr><td><strong>Handler</strong></td><td>Một lỗ trên máng và đoạn máng dẫn tới lỗ kế tiếp</td><td><code>Approver</code>: <code>handle</code>, <code>set_next</code></td></tr>
    <tr><td><strong>ConcreteHandler</strong></td><td>Ba lỗ, mỗi lỗ khoét theo hạn mức của một người; cột và cờ bên dưới</td><td><code>Approver("Trưởng nhóm", 5_000_000)</code>, …</td></tr>
    <tr><td><strong>Cuối chuỗi</strong></td><td>Thùng từ chối ở cuối máng</td><td>Nhánh <code>self._next is None</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Một yêu cầu có thể do nhiều bên xử lý, và bên nào xử lý chỉ biết được lúc chạy: duyệt theo hạn mức, phân loại ticket hỗ trợ theo mức độ, chọn bộ giảm giá đầu tiên áp dụng được.</li>
  <li>Một chuỗi bước kiểm tra trước khi tới logic chính, mỗi bước có quyền chặn: middleware HTTP, bộ lọc dữ liệu nhập, kiểm tra quyền nhiều lớp.</li>
  <li>Muốn ghép, đổi thứ tự hay bật tắt từng mắt theo cấu hình mà không sửa các mắt còn lại.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Luật đơn giản và ít đổi, như một bảng ba mức: một bảng tra hoặc vài dòng <code>if</code> dễ đọc hơn một chuỗi object.</li>
  <li>Yêu cầu bắt buộc phải được xử lý: chuỗi có thể đi hết mà không ai nhận, nên phải có mắt cuối hoặc nhánh mặc định rõ ràng.</li>
  <li>Chuỗi dài và mỗi yêu cầu đi qua rất nhiều mắt: khó lần ra ai đã xử lý, nên cần ghi log ở từng mắt.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Decorator</strong> cũng bọc các object thành chuỗi, nhưng mọi lớp đều chạy và cùng thêm hành vi cho một kết quả. Ở Chain of Responsibility, một mắt có thể dừng chuỗi và các mắt sau không chạy nữa.</li>
  <li><strong>Command</strong> gói yêu cầu thành object để xếp hàng, chạy lại hoặc hoàn tác. Chain of Responsibility quyết định ai xử lý yêu cầu đó. Hai pattern hay đi cùng nhau: request trong chuỗi thường là một command.</li>
  <li><strong>Strategy</strong> chọn một thuật toán từ trước rồi gọi nó. Ở đây không ai chọn trước: yêu cầu đi dọc chuỗi cho tới khi gặp mắt nhận.</li>
  <li><strong>Observer</strong> gửi một sự kiện tới mọi bên đăng ký cùng lúc. Chain of Responsibility đi lần lượt từng mắt và thường dừng ở mắt đầu tiên nhận việc.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Luôn quyết định chuyện gì xảy ra ở cuối chuỗi: trả về "bị từ chối", ném lỗi, hay chuyển cho một mắt mặc định. Đừng để yêu cầu im lặng biến mất.</li>
  <li>Ghép chuỗi ở một chỗ (hàm <code>build_chain</code>, cấu hình, DI container), không ghép rải rác trong các mắt. Đổi quy trình duyệt khi đó chỉ là đổi một danh sách.</li>
  <li>Thứ tự là một phần của logic. Ở bài này mắt hạn mức nhỏ phải đứng trước; đảo lại thì giám đốc sẽ nhận cả đề nghị 3.000.000 ₫. Hãy test riêng thứ tự chuỗi.</li>
  <li>Mỗi mắt có thể có logic riêng mà không ảnh hưởng mắt khác: trưởng nhóm đang nghỉ phép thì <code>can_approve</code> trả về <code>False</code> và đề nghị tự đi tiếp.</li>
  <li>Ghi lại mắt nào đã xem và mắt nào đã nhận, để trả lời được câu hỏi "vì sao đề nghị này lên tới giám đốc".</li>
</ul>
`;

const html = patternPage({
  title: "Chain of Responsibility",
  description: "Chain of Responsibility pattern: yêu cầu đi dọc một chuỗi bên xử lý, mỗi mắt tự xử lý hoặc chuyển tiếp. Hình tương tác, bài toán duyệt đề nghị chi theo hạn mức, code Python và TypeScript.",
  group: "Behavioral",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
