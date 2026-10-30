// Builds design-patterns/state/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { ACTIONS, RULES, STATES, stateOf } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed result comes from running the example, so the page can't drift from the code.
const result = execFileSync("python3", ["-I", code("state.py")], { encoding: "utf8" }).trimEnd();

// The rules table comes from the same model the figure turns.
const cell = (state, action) => {
  const next = RULES[state.id][action.id];
  return next ? `→ ${stateOf(next).name}` : `<span class="st-no">bị chặn</span>`;
};
const rules = `<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Trạng thái</th>${ACTIONS.map((a) => `<th>${a.name}</th>`).join("")}</tr></thead>
  <tbody>
    ${STATES.map((s) => `<tr><td><strong>${s.name}</strong></td>${ACTIONS.map((a) => `<td>${cell(s, a)}</td>`).join("")}</tr>`).join("\n    ")}
  </tbody>
</table></div>`;

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>State</h1>
<p class="dp-lead">State cho một đối tượng đổi hành vi khi trạng thái bên trong của nó đổi. Mỗi trạng thái là một lớp riêng, giữ trọn luật của trạng thái đó; đối tượng chỉ chuyển từng yêu cầu cho trạng thái hiện tại, nên nhìn từ ngoài vào nó như đã đổi sang một lớp khác.</p>

${plate}

<h2>Bài toán</h2>
<p>Một hồ sơ đề nghị mua hàng đi qua bốn trạng thái: <strong>Nháp</strong>, <strong>Chờ duyệt</strong>, <strong>Đã duyệt</strong> và <strong>Bị từ chối</strong>. Người dùng có bốn thao tác: gửi duyệt, duyệt, từ chối, sửa lại. Cùng một thao tác cho kết quả khác nhau tuỳ trạng thái, và phần lớn ô trong bảng là "không được làm":</p>
${rules}
<p>Khi bị chặn, hệ thống phải báo đúng lý do của trạng thái đó, ví dụ hồ sơ đã duyệt thì "không đổi được nữa".</p>

<h2>Khi chưa có State</h2>
<p>Cách làm thường gặp là lưu trạng thái trong một chuỗi và để mỗi thao tác tự hỏi "mình đang ở đâu":</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Luật của một trạng thái bị rải khắp nơi.</strong> Muốn biết hồ sơ "Chờ duyệt" làm được gì phải đọc cả bốn hàm.</li>
  <li><strong>Thêm trạng thái là sửa mọi thao tác.</strong> Thêm "Đã huỷ" nghĩa là thêm một nhánh vào từng hàm, và quên một nhánh là một lỗi im lặng: thao tác lẽ ra bị chặn lại chạy qua.</li>
  <li><strong>Lý do bị chặn lặp lại.</strong> Cùng một câu báo lỗi được chép ở nhiều chỗ và dần lệch nhau.</li>
  <li><strong>Chuỗi trạng thái gõ tay.</strong> <code>"pending"</code> gõ nhầm thành <code>"pendng"</code> không lỗi lúc viết, chỉ lộ ra khi chạy.</li>
</ul>

<h2>Lời giải</h2>
<p>Định nghĩa một interface <strong>State</strong> có đủ bốn thao tác, mặc định thao tác nào cũng bị chặn. Mỗi trạng thái là một lớp con (<strong>ConcreteState</strong>) và chỉ viết lại những thao tác nó nhận; chính nó quyết định trạng thái kế tiếp. Hồ sơ (<strong>Context</strong>) giữ một object trạng thái và chuyển mọi thao tác cho nó, không còn câu <code>if</code> nào về trạng thái.</p>
${codeTabs({ files: { python: code("state.py"), typescript: code("state.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau, và giống bản trước khi có State):</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Context</strong></td><td>Thanh phím với ô kính tên trạng thái</td><td><code>PurchaseRequest</code></td></tr>
    <tr><td><strong>State</strong></td><td>Trống trạng thái: luôn có đủ bốn rãnh dưới bốn phím</td><td><code>State</code></td></tr>
    <tr><td><strong>ConcreteState</strong></td><td>Mỗi hàng lỗ quanh trống</td><td><code>Draft</code>, <code>Pending</code>, <code>Approved</code>, <code>Rejected</code></td></tr>
    <tr><td><strong>Chuyển trạng thái</strong></td><td>Trống quay một hoặc hai nấc, cam vuông giữ nó đúng nấc</td><td><code>request.state = Pending()</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Một đối tượng có vòng đời rõ ràng và hành vi đổi theo từng chặng: hồ sơ phê duyệt, đơn hàng (mới, đã thanh toán, đang giao, đã giao, đã huỷ), ticket hỗ trợ, hợp đồng, kết nối mạng.</li>
  <li>Nhiều hàm cùng rẽ nhánh theo một biến trạng thái, và các nhánh đó cứ dài thêm mỗi lần có trạng thái mới.</li>
  <li>Mỗi trạng thái có luật riêng đáng kể: kiểm tra quyền, tính toán, gửi thông báo khi vào hoặc rời trạng thái.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ có hai, ba trạng thái và luật đơn giản: một <code>if</code> hoặc một bảng chuyển trạng thái (dict từ cặp trạng thái và thao tác sang trạng thái kế) ngắn và dễ đọc hơn.</li>
  <li>Các trạng thái không có hành vi riêng, chỉ khác nhau ở nhãn: đó là dữ liệu, một cột enum là đủ.</li>
  <li>Luồng phức tạp, có nhánh song song, hẹn giờ, cần vẽ ra cho người khác duyệt: một thư viện state machine hoặc workflow engine hợp hơn tự viết lớp.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Strategy</strong> có cấu trúc gần như y hệt: context giữ một object và giao việc cho nó. Khác ở chỗ ai đổi object: strategy do code gọi chọn từ ngoài, còn state tự chuyển sang trạng thái kế từ bên trong.</li>
  <li><strong>Bảng chuyển trạng thái</strong> (state machine dạng dữ liệu) chỉ trả lời "đi đâu tiếp". State pattern còn giữ cả hành vi của từng trạng thái; hai cách thường đi cùng nhau.</li>
  <li><strong>Command</strong> gói một thao tác thành object để xếp hàng hay hoàn tác. Ở đây thao tác vẫn là lời gọi hàm bình thường; thứ được gói là trạng thái.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Trong cơ sở dữ liệu vẫn lưu trạng thái là một cột chuỗi hoặc enum. Khi đọc hồ sơ lên, dựng lại object trạng thái từ cột đó; khi lưu, ghi ngược tên trạng thái ra.</li>
  <li>Các lớp trạng thái ở ví dụ không có dữ liệu riêng, nên có thể dùng chung một instance cho mọi hồ sơ thay vì tạo mới mỗi lần chuyển.</li>
  <li>Hai người cùng bấm duyệt và từ chối một lúc: kiểm tra trạng thái và ghi trạng thái mới phải nằm trong một giao dịch, hoặc dùng cột phiên bản (optimistic locking), nếu không cả hai thao tác đều "thành công".</li>
  <li>Thao tác bị chặn là lỗi nghiệp vụ, không phải lỗi hệ thống: trả về mã rõ ràng (ví dụ HTTP 409) kèm lý do của trạng thái, và ghi lịch sử mỗi lần chuyển trạng thái để tra lại về sau.</li>
</ul>
`;

const html = patternPage({
  title: "State",
  description: "State pattern: mỗi trạng thái là một lớp, tự quyết định thao tác nào được làm và trạng thái kế tiếp. Hình tương tác, bài toán phê duyệt hồ sơ, code Python và TypeScript.",
  group: "Behavioral",
  body,
  figureCss: FIGURE_CSS + ".st-no{color:var(--anatomy-muted)}",
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
