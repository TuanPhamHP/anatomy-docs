// Builds design-patterns/state/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { QUIZ } from "./quiz.mjs";
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
<p class="dp-lead">State cho phép một đối tượng đổi cách cư xử khi trạng thái bên trong của nó thay đổi. Mỗi trạng thái là một lớp riêng giữ trọn luật của chính nó, còn đối tượng chỉ việc chuyển từng yêu cầu cho trạng thái hiện tại, nên nhìn từ bên ngoài, nó như thể đã đổi sang một lớp khác.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy xét một hồ sơ đề nghị mua hàng. Hồ sơ đi qua bốn trạng thái là Nháp, Chờ duyệt, Đã duyệt và Bị từ chối, còn người dùng có bốn thao tác là gửi duyệt, duyệt, từ chối và sửa lại. Cùng một thao tác cho ra kết quả khác nhau tuỳ trạng thái, và phần lớn các ô trong bảng dưới đây là những thao tác không được phép.</p>
${rules}
<p>Khi một thao tác bị chặn, hệ thống phải báo đúng lý do của trạng thái lúc đó. Chẳng hạn với hồ sơ đã duyệt, lý do là hồ sơ không đổi được nữa.</p>

<h2>Khi chưa có State</h2>
<p>Cách làm thường gặp là lưu trạng thái trong một chuỗi và để mỗi thao tác tự hỏi xem mình đang ở đâu.</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Luật của một trạng thái nằm rải rác khắp nơi.</strong> Muốn biết hồ sơ đang chờ duyệt làm được gì, bạn phải đọc cả bốn hàm.</li>
  <li><strong>Thêm một trạng thái là phải sửa mọi thao tác.</strong> Thêm trạng thái Đã huỷ nghĩa là thêm một nhánh vào từng hàm. Quên một nhánh là sinh ra lỗi im lặng, vì thao tác lẽ ra bị chặn lại chạy qua.</li>
  <li><strong>Lý do bị chặn bị chép đi chép lại.</strong> Cùng một câu báo lỗi xuất hiện ở nhiều chỗ, và lâu dần chúng lệch nhau.</li>
  <li><strong>Tên trạng thái là chuỗi gõ tay.</strong> Gõ nhầm <code>"pending"</code> thành <code>"pendng"</code> không báo lỗi lúc viết code mà chỉ lộ ra khi chạy.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta định nghĩa một interface State có đủ bốn thao tác, và mặc định thao tác nào cũng bị chặn. Mỗi trạng thái cụ thể, thường gọi là ConcreteState, là một lớp con chỉ viết lại những thao tác nó chấp nhận, và chính nó quyết định trạng thái kế tiếp.</p>
<p>Hồ sơ đóng vai Context. Nó giữ một đối tượng trạng thái và chuyển mọi thao tác cho đối tượng đó, nên trong hồ sơ không còn câu <code>if</code> nào hỏi về trạng thái.</p>
${codeTabs({ files: { python: code("state.py"), typescript: code("state.ts") } })}
<p>Chạy thử, bản Python và bản TypeScript in ra cùng một kết quả, và kết quả này cũng giống hệt bản trước khi có State:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Context</strong></td><td>Thanh phím có ô kính hiện tên trạng thái</td><td><code>PurchaseRequest</code></td></tr>
    <tr><td><strong>State</strong></td><td>Trống trạng thái, lúc nào cũng có đủ bốn rãnh nằm dưới bốn phím</td><td><code>State</code></td></tr>
    <tr><td><strong>ConcreteState</strong></td><td>Từng hàng lỗ quanh trống</td><td><code>Draft</code>, <code>Pending</code>, <code>Approved</code>, <code>Rejected</code></td></tr>
    <tr><td><strong>Chuyển trạng thái</strong></td><td>Trống quay một hoặc hai nấc, cam vuông giữ nó dừng đúng nấc</td><td><code>request.state = Pending()</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi một đối tượng có vòng đời rõ ràng và cách cư xử đổi theo từng chặng, như hồ sơ phê duyệt, đơn hàng đi từ lúc mới tạo, đã thanh toán, đang giao, đã giao cho tới đã huỷ, hay ticket hỗ trợ, hợp đồng, kết nối mạng.</li>
  <li>Khi nhiều hàm cùng rẽ nhánh theo một biến trạng thái, và các nhánh đó cứ dài thêm mỗi lần có trạng thái mới.</li>
  <li>Khi mỗi trạng thái có luật riêng đáng kể, chẳng hạn kiểm tra quyền, tính toán hay gửi thông báo lúc vào hoặc rời trạng thái.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Nếu chỉ có hai, ba trạng thái với luật đơn giản, một câu <code>if</code> hoặc một bảng chuyển trạng thái sẽ ngắn và dễ đọc hơn. Bảng đó có thể chỉ là một dict ánh xạ từ cặp trạng thái và thao tác sang trạng thái kế tiếp.</li>
  <li>Nếu các trạng thái không có hành vi riêng mà chỉ khác nhau ở cái nhãn, thì đó là dữ liệu, và một cột enum là đủ.</li>
  <li>Nếu luồng phức tạp, có nhánh song song, có hẹn giờ và cần vẽ ra cho người khác duyệt, một thư viện state machine hoặc workflow engine sẽ hợp hơn là tự viết từng lớp.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Strategy</strong> có cấu trúc gần như y hệt, vì context cũng giữ một đối tượng và giao việc cho nó. Điểm khác nằm ở chỗ ai đổi đối tượng đó. Với Strategy, code bên ngoài chọn cách làm, còn với State, chính trạng thái hiện tại tự chuyển sang trạng thái kế.</li>
  <li><strong>Bảng chuyển trạng thái</strong>, tức state machine viết dưới dạng dữ liệu, chỉ trả lời câu hỏi đi đâu tiếp. State pattern giữ thêm cả hành vi của từng trạng thái, và hai cách này thường đi cùng nhau.</li>
  <li><strong>Command</strong> gói một thao tác thành đối tượng để xếp hàng hay hoàn tác. Ở đây thao tác vẫn là lời gọi hàm bình thường, thứ được gói lại là trạng thái.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Trong cơ sở dữ liệu, trạng thái vẫn nằm trong một cột chuỗi hoặc enum. Khi đọc hồ sơ lên, bạn dựng lại đối tượng trạng thái từ cột đó, và khi lưu thì ghi ngược tên trạng thái ra.</li>
  <li>Các lớp trạng thái trong ví dụ không có dữ liệu riêng, nên mọi hồ sơ có thể dùng chung một instance thay vì tạo mới mỗi lần chuyển.</li>
  <li>Nếu hai người cùng bấm duyệt và từ chối một lúc, cả hai thao tác có thể cùng báo thành công. Để tránh chuyện đó, hãy đặt bước kiểm tra trạng thái và bước ghi trạng thái mới trong cùng một giao dịch, hoặc dùng cột phiên bản theo kiểu optimistic locking.</li>
  <li>Thao tác bị chặn là lỗi nghiệp vụ chứ không phải lỗi hệ thống. Hãy trả về một mã rõ ràng như HTTP 409 kèm lý do của trạng thái, và ghi lại lịch sử mỗi lần chuyển trạng thái để tra cứu về sau.</li>
</ul>
`;

const html = patternPage({
  title: "State",
  description: "State biến mỗi trạng thái thành một lớp tự quyết định thao tác nào được làm và trạng thái kế tiếp là gì. Bài có hình tương tác, bài toán phê duyệt hồ sơ và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS + ".st-no{color:var(--anatomy-muted)}",
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
