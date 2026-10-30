// Builds design-patterns/facade/index.html: the figure, then the lesson.
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
const before = execFileSync("python3", ["-I", code("before.py")], { encoding: "utf8" }).trimEnd();
const result = execFileSync("python3", ["-I", code("facade.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Facade</h1>
<p class="dp-lead">Facade đặt một cửa vào đơn giản trước cả một hệ con phức tạp. Client chỉ gọi một hàm của facade, còn facade biết phải gọi những lớp nào bên trong, theo thứ tự nào và xử lý lỗi ra sao. Các lớp bên trong vẫn còn nguyên, ai cần thì vẫn gọi thẳng được.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung một cửa hàng online. Đặt một đơn hàng ở đây thực ra là năm việc ở năm hệ con khác nhau, và phải làm đúng thứ tự:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Hệ con</th><th>Việc cần làm</th><th>Với đơn <code>DH-2041</code> (2 × Bình giữ nhiệt, 970.000 ₫)</th></tr></thead>
  <tbody>
    <tr><td>Kho</td><td>Giữ hàng cho đơn</td><td>tồn <code>SP-17</code> từ 12 còn 10</td></tr>
    <tr><td>Thanh toán</td><td>Thu tiền qua thẻ</td><td>thu 970.000 ₫, mã <code>GD-5521</code></td></tr>
    <tr><td>Vận chuyển</td><td>Đặt lịch giao</td><td>vận đơn <code>VD-3308</code></td></tr>
    <tr><td>Hoá đơn</td><td>Xuất hoá đơn</td><td><code>HD-0457</code></td></tr>
    <tr><td>Thông báo</td><td>Báo cho khách</td><td>email xác nhận</td></tr>
  </tbody>
</table></div>
<p>Thứ tự này có lý do. Phải giữ hàng trước khi thu tiền, và thu được tiền rồi mới đặt lịch giao. Nếu thẻ bị từ chối, số hàng vừa giữ phải được trả lại kho. Thêm nữa, đơn hàng đến từ ba nơi là trang web, app di động và công cụ của nhân viên.</p>

<h2>Khi chưa có Facade</h2>
<p>Mỗi nơi đặt hàng tự gọi lần lượt năm hệ con. Ba bản chép của cùng một quy trình thì sớm muộn cũng lệch nhau, và trong ví dụ này app di động quên trả hàng về kho khi thanh toán lỗi:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
${output(before)}
<ul>
  <li><strong>Lỗi nằm ở chỗ rất khó thấy.</strong> Không có gì báo lỗi cả, chỉ là tồn kho cứ hụt dần, vì mỗi lần thẻ lỗi trên app lại giữ mất vài sản phẩm.</li>
  <li><strong>Client biết quá nhiều.</strong> Trang web phải biết có năm hệ con, phải gọi theo thứ tự nào và bù trừ ra sao. Muốn thêm một bước như tích điểm thì phải sửa cả ba nơi.</li>
  <li><strong>Phụ thuộc chằng chịt.</strong> Client nào cũng phụ thuộc vào năm lớp, nên chỉ cần đổi chữ ký một hàm của hệ con là đụng đến mọi client.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta gom quy trình đó vào một lớp Facade là <code>CheckoutFacade</code>, với phương thức <code>place_order(cart)</code>. Facade giữ năm hệ con ở bên trong, gọi chúng theo đúng thứ tự và lo luôn phần trả hàng khi thanh toán lỗi.</p>
<p>Web, app hay công cụ nội bộ đều đóng vai Client. Chúng chỉ gọi một hàm, nên mọi nơi chạy chung một quy trình. Các hệ con thì không hề biết đến facade và vẫn dùng riêng được.</p>
${codeTabs({ files: { python: code("facade.py"), typescript: code("facade.ts") } })}
<p>Hai bản in ra cùng một kết quả. Đơn thứ hai dùng thẻ bị từ chối, và lần này facade trả hàng về kho, bất kể client là ai.</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Facade</strong></td><td>Tủ một nút, cùng thanh chương trình mà nó kéo vào</td><td><code>CheckoutFacade</code>, <code>place_order()</code></td></tr>
    <tr><td><strong>Subsystem</strong></td><td>Năm khối kho, thanh toán, vận chuyển, hoá đơn và thông báo</td><td><code>Inventory</code>, <code>Payments</code>, <code>Shipping</code>, <code>Invoices</code>, <code>Notifier</code></td></tr>
    <tr><td><strong>Thứ tự gọi</strong></td><td>Năm vấu trên thanh, mỗi vấu lệch nhau một nhịp</td><td>Thân hàm <code>place_order()</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Người nhấn nút</td><td>Trang web, app và công cụ admin cùng gọi <code>place_order()</code></td></tr>
    <tr><td><strong>Lối vào trực tiếp</strong></td><td>Núm và cổng bảo trì trên từng khối</td><td>Vẫn gọi được <code>inventory.release()</code>, <code>payments.charge()</code>, ...</td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi một việc nghiệp vụ cần phối hợp nhiều lớp hoặc nhiều service theo một thứ tự cố định, chẳng hạn đặt hàng, đăng ký tài khoản với các bước tạo user, gán quyền và gửi email chào, hay đóng kỳ kế toán.</li>
  <li>Khi nhiều client cùng cần làm việc đó, như web, app, API cho đối tác hay job chạy đêm. Facade bảo đảm tất cả chạy chung một quy trình.</li>
  <li>Khi bạn muốn bọc một thư viện hay SDK lớn thành vài hàm vừa đúng nhu cầu, ví dụ một <code>StorageFacade</code> chỉ có <code>upload</code> và <code>signed_url</code> đứng trước cả bộ SDK của nhà cung cấp lưu trữ.</li>
  <li>Khi bạn muốn các tầng tách bạch rõ ràng, để tầng giao diện chỉ nói chuyện với một cửa duy nhất của tầng nghiệp vụ.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi chỉ gọi một hệ con. Lúc đó facade chỉ là một lớp chuyển tiếp thừa.</li>
  <li>Khi mỗi client cần phối hợp theo một cách riêng. Một facade cố gom hết sẽ đầy cờ và tham số tuỳ chọn, nên tốt hơn là tách thành nhiều facade, mỗi cái lo một việc.</li>
  <li>Khi facade bắt đầu chứa luôn quy tắc nghiệp vụ của các hệ con. Đó là dấu hiệu nó đang thành một god object, trong khi facade chỉ nên điều phối, còn quy tắc thuộc về từng hệ con.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Adapter</strong> đổi interface của một lớp sang đúng interface mà client đã yêu cầu. Facade thì tạo ra một interface mới, đơn giản hơn, đứng trước nhiều lớp.</li>
  <li><strong>Mediator</strong> cũng đứng giữa nhiều lớp, nhưng các lớp đó gọi nhau thông qua mediator và biết nó tồn tại. Với Facade, lời gọi chỉ đi một chiều từ client vào facade rồi xuống hệ con, và hệ con không biết gì về facade.</li>
  <li><strong>Proxy</strong> có cùng interface với đúng một đối tượng thật và đứng thay cho nó. Facade không giả làm ai cả.</li>
  <li><strong>Service layer</strong>, hay application service trong kiến trúc nhiều tầng, thường chính là một tập facade, mỗi phương thức ứng với một use case.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Hãy giữ facade thật mỏng.</strong> Facade chỉ lo thứ tự gọi, bù trừ khi lỗi và gom kết quả. Tính giá, kiểm tra tồn kho hay chính sách hoàn tiền là phần của hệ con.</li>
  <li><strong>Quyết định rõ cách bù trừ.</strong> Hãy xác định bước nào lỗi thì hoàn tác bước nào, như trả hàng hay hoàn tiền. Khi các hệ con là service riêng gọi qua mạng, đây đã là một saga nhỏ, và bạn nên ghi lại từng bước để có thể chạy lại.</li>
  <li><strong>Đừng giấu hệ con đi.</strong> Facade là lối tắt cho những việc thường làm chứ không phải bức tường, nên các trường hợp đặc biệt vẫn có thể gọi thẳng hệ con.</li>
  <li><strong>Truyền hệ con vào qua constructor.</strong> Làm như ví dụ thì khi test, bạn thay được bằng bản giả và kiểm tra được thứ tự gọi.</li>
</ul>
`;

const html = patternPage({
  title: "Facade",
  description: "Facade đặt một cửa vào đơn giản trước cả một hệ con phức tạp. Bài học có hình tương tác, bài toán đặt hàng qua năm hệ con và code Python, TypeScript.",
  group: "Structural",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
