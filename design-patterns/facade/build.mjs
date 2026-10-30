// Builds design-patterns/facade/index.html: the figure, then the lesson.
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
const before = execFileSync("python3", ["-I", code("before.py")], { encoding: "utf8" }).trimEnd();
const result = execFileSync("python3", ["-I", code("facade.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Facade</h1>
<p class="dp-lead">Facade đặt một cửa đơn giản trước cả một hệ con phức tạp. Client gọi một hàm của facade; facade biết phải gọi những lớp nào bên trong, theo thứ tự nào, và xử lý lỗi ra sao. Các lớp bên trong vẫn còn đó, ai cần thì vẫn gọi thẳng được.</p>

${plate}

<h2>Bài toán</h2>
<p>Một cửa hàng online. Đặt một đơn hàng không phải là một việc mà là năm việc, ở năm hệ con khác nhau, và phải làm đúng thứ tự:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Hệ con</th><th>Việc</th><th>Với đơn <code>DH-2041</code> (2 × Bình giữ nhiệt, 970.000 ₫)</th></tr></thead>
  <tbody>
    <tr><td>Kho</td><td>Giữ hàng cho đơn</td><td>tồn <code>SP-17</code> từ 12 còn 10</td></tr>
    <tr><td>Thanh toán</td><td>Thu tiền qua thẻ</td><td>thu 970.000 ₫, mã <code>GD-5521</code></td></tr>
    <tr><td>Vận chuyển</td><td>Đặt lịch giao</td><td>vận đơn <code>VD-3308</code></td></tr>
    <tr><td>Hoá đơn</td><td>Xuất hoá đơn</td><td><code>HD-0457</code></td></tr>
    <tr><td>Thông báo</td><td>Báo cho khách</td><td>email xác nhận</td></tr>
  </tbody>
</table></div>
<p>Thứ tự có lý do: phải giữ hàng trước khi thu tiền, và thu được tiền rồi mới đặt giao. Nếu thẻ bị từ chối, số hàng vừa giữ phải được trả về kho. Đơn hàng lại đến từ ba nơi: trang web, app di động và công cụ của nhân viên.</p>

<h2>Khi chưa có Facade</h2>
<p>Mỗi nơi đặt hàng tự gọi lần lượt năm hệ con. Ba bản chép của cùng một chuỗi sớm muộn sẽ lệch nhau. Ở đây app di động quên trả hàng về kho khi thanh toán lỗi:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
${output(before)}
<ul>
  <li><strong>Lỗi nằm ở chỗ khó thấy.</strong> Không có gì báo lỗi; chỉ là tồn kho cứ hụt dần vì mỗi lần thẻ lỗi trên app lại "giữ" mất vài sản phẩm.</li>
  <li><strong>Client biết quá nhiều.</strong> Trang web phải biết có năm hệ con, gọi theo thứ tự nào và bù trừ ra sao. Thêm một bước (ví dụ tích điểm) là phải sửa cả ba nơi.</li>
  <li><strong>Phụ thuộc chằng chịt.</strong> Mỗi client phụ thuộc vào năm lớp; đổi chữ ký một hàm của hệ con là đụng vào mọi client.</li>
</ul>

<h2>Lời giải</h2>
<p>Gom chuỗi đó vào một lớp <strong>Facade</strong>: <code>CheckoutFacade.place_order(cart)</code>. Facade giữ năm hệ con bên trong, gọi chúng theo đúng thứ tự, và lo luôn việc trả hàng khi thanh toán lỗi. Client (web, app, công cụ nội bộ) chỉ gọi một hàm, nên mọi nơi chạy cùng một quy trình. Các hệ con không biết gì về facade, và vẫn dùng riêng được.</p>
${codeTabs({ files: { python: code("facade.py"), typescript: code("facade.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau). Đơn thứ hai dùng thẻ bị từ chối, và facade trả hàng về kho cho mọi client:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Facade</strong></td><td>Tủ một nút, cùng thanh chương trình mà nó kéo vào</td><td><code>CheckoutFacade</code>, <code>place_order()</code></td></tr>
    <tr><td><strong>Subsystem</strong></td><td>Năm khối: kho, thanh toán, vận chuyển, hoá đơn, thông báo</td><td><code>Inventory</code>, <code>Payments</code>, <code>Shipping</code>, <code>Invoices</code>, <code>Notifier</code></td></tr>
    <tr><td><strong>Thứ tự gọi</strong></td><td>Năm vấu trên thanh, mỗi vấu lệch một nhịp</td><td>Thân hàm <code>place_order()</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Người nhấn nút</td><td>Trang web, app, công cụ admin gọi <code>place_order()</code></td></tr>
    <tr><td><strong>Lối vào trực tiếp</strong></td><td>Núm và cổng bảo trì trên từng khối</td><td>Vẫn gọi được <code>inventory.release()</code>, <code>payments.charge()</code>, ...</td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Một việc nghiệp vụ cần phối hợp nhiều lớp hoặc nhiều service, theo một thứ tự cố định: đặt hàng, đăng ký tài khoản (tạo user, gán quyền, gửi email chào), đóng kỳ kế toán.</li>
  <li>Nhiều client cần làm cùng một việc đó: web, app, API cho đối tác, job chạy đêm. Facade đảm bảo họ chạy cùng một quy trình.</li>
  <li>Muốn bọc một thư viện hoặc SDK lớn thành vài hàm đúng với nhu cầu của mình, ví dụ một <code>StorageFacade</code> chỉ có <code>upload</code> và <code>signed_url</code> trước cả bộ SDK của nhà cung cấp lưu trữ.</li>
  <li>Muốn chia lớp rõ ràng: tầng giao diện chỉ nói chuyện với một cửa của tầng nghiệp vụ.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ gọi một hệ con: facade lúc đó chỉ là một lớp chuyển tiếp thừa.</li>
  <li>Mỗi client cần một cách phối hợp khác nhau: một facade cố gom hết sẽ đầy cờ và tham số tuỳ chọn. Tách thành nhiều facade, mỗi cái cho một việc.</li>
  <li>Đừng để facade thành "god object" chứa luôn quy tắc nghiệp vụ của các hệ con. Facade điều phối; quy tắc thuộc về từng hệ con.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Adapter</strong> đổi interface của một lớp sang interface mà client đã đòi. Facade tạo ra một interface mới, đơn giản hơn, trước nhiều lớp.</li>
  <li><strong>Mediator</strong> cũng đứng giữa nhiều lớp, nhưng các lớp đó gọi nhau qua mediator và biết nó tồn tại. Với Facade, chiều gọi chỉ là client → facade → hệ con; hệ con không biết facade.</li>
  <li><strong>Proxy</strong> có cùng interface với đúng một object thật và đứng thay nó. Facade không giả làm ai.</li>
  <li><strong>Service layer</strong> (application service) trong kiến trúc nhiều tầng thường chính là một tập facade, mỗi hàm là một use case.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Giữ facade mỏng: thứ tự gọi, bù trừ khi lỗi, gom kết quả. Tính giá, kiểm tra tồn kho hay chính sách hoàn tiền nằm trong hệ con.</li>
  <li>Quyết định rõ việc bù trừ: bước nào lỗi thì hoàn tác bước nào (trả hàng, hoàn tiền). Khi các hệ con là service riêng qua mạng, đây là một saga nhỏ; nên ghi lại từng bước để chạy lại được.</li>
  <li>Không giấu hệ con đi. Facade là lối tắt cho việc thường làm, không phải bức tường; việc đặc biệt vẫn có thể gọi thẳng hệ con.</li>
  <li>Truyền hệ con vào qua constructor, như ví dụ, để khi test có thể thay bằng bản giả và kiểm tra đúng thứ tự gọi.</li>
</ul>
`;

const html = patternPage({
  title: "Facade",
  description: "Facade pattern: một cửa đơn giản trước cả một hệ con phức tạp. Hình tương tác, bài toán đặt hàng qua năm hệ con, code Python và TypeScript.",
  group: "Structural",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
