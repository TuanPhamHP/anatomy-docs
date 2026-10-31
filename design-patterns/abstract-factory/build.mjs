// Builds design-patterns/abstract-factory/index.html: the figure, then the lesson.
// Run: node build.mjs   (`--debug` writes shots/debug.html with a hook to freeze the timeline)
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { FAMILIES } from "./model.mjs";
import { QUIZ } from "./quiz.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const DEBUG = process.argv.includes("--debug");
const SEEK = `\nwindow.__seek = (at) => { touring = false; cancelAnimationFrame(frame); frame = -1; t = at; draw(); return readout.textContent; };`;
const code = (name) => join(HERE, "code", name);

// The printed results come from running the examples, so the page can't drift from the code.
const run = (file) => execFileSync("python3", ["-I", code(file)], { encoding: "utf8" }).trimEnd();
const result = run("abstract-factory.py");
const before = run("before.py");
for (const family of Object.values(FAMILIES)) {
  if (!result.includes(family.signature) || !result.includes(family.refundCode)) throw new Error(`model.mjs and abstract-factory.py disagree on family ${family.id}`);
}
if (!before.includes(FAMILIES.A.signature) || !before.includes("bị từ chối")) throw new Error("before.py no longer shows the mixed-set failure");

const body = `
<p class="dp-eyebrow">Creational pattern</p>
<h1>Abstract Factory</h1>
<p class="dp-lead">Abstract Factory gom việc tạo cả một họ đối tượng luôn đi cùng nhau về một chỗ. Code dùng chúng chỉ chọn factory một lần, và từ đó mọi thứ nó nhận được đều thuộc cùng một họ, không bao giờ bị lẫn.</p>

${plate}

<h2>Bài toán</h2>
<p>Trang thanh toán của bạn tích hợp hai nhà cung cấp. Với nhà cung cấp nào cũng cần đủ ba thành phần, gồm cổng thanh toán để thu tiền, dịch vụ hoàn tiền, và bộ kiểm chữ ký cho webhook mà nhà cung cấp gửi về khi tiền đã vào tài khoản.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Thành phần</th><th>Nhà cung cấp A</th><th>Nhà cung cấp B</th></tr></thead>
  <tbody>
    <tr><td>Cổng thanh toán</td><td>Ký webhook kiểu <code>a1:</code> bằng khoá của A</td><td>Ký webhook kiểu <code>v2=</code> bằng khoá của B</td></tr>
    <tr><td>Hoàn tiền</td><td>Trả mã <code>HT-A-…</code></td><td>Trả mã <code>HT-B-…</code></td></tr>
    <tr><td>Kiểm chữ ký</td><td>Chỉ nhận chữ ký <code>a1:</code> của A</td><td>Chỉ nhận chữ ký <code>v2=</code> của B</td></tr>
  </tbody>
</table></div>
<p>Ba thành phần của cùng một nhà cung cấp dùng chung khoá bí mật và kiểu chữ ký, nên chúng chỉ chạy đúng khi đi cùng nhau. Nếu cổng thanh toán là của A mà bộ kiểm chữ ký lại là của B, mọi webhook từ A sẽ bị từ chối, và những đơn hàng đã thu tiền sẽ không bao giờ được xác nhận.</p>

<h2>Khi chưa có Abstract Factory</h2>
<p>Cách làm thường gặp là để mỗi chỗ tự đọc cấu hình rồi tự rẽ nhánh theo nhà cung cấp:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<p>Chạy thử, ta được kết quả này.</p>
${output(before)}
<ul>
  <li><strong>Lựa chọn nhà cung cấp bị rải ra nhiều nơi.</strong> Ba hàm, mỗi hàm tự đọc một dòng cấu hình và tự rẽ nhánh, nên không có chỗ nào bảo đảm cả ba cùng chọn một nhà cung cấp.</li>
  <li><strong>Một bộ lẫn rất dễ lọt vào production.</strong> Lần chuyển sang A vừa rồi còn sót dòng cấu hình webhook, nên tiền đã thu mà webhook bị từ chối, đúng như kết quả ở trên.</li>
  <li><strong>Thêm nhà cung cấp là sửa nhiều chỗ.</strong> Nhà cung cấp thứ ba đồng nghĩa với một nhánh mới trong cả ba hàm, và chỉ cần sót một hàm là lỗi.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta định nghĩa một interface cho cả bộ, gọi là Abstract Factory. Ở đây đó là <code>PaymentKitFactory</code> với ba phương thức <code>create_gateway()</code>, <code>create_refunds()</code> và <code>create_verifier()</code>. Mỗi nhà cung cấp có một factory cụ thể, <code>ProviderAFactory</code> hoặc <code>ProviderBFactory</code>, và factory nào cũng chỉ biết tạo đúng ba thành phần của họ mình.</p>
<p>Trang thanh toán, tức Client, nhận một factory qua constructor rồi lấy cả ba thành phần từ đó. Nó không biết đang làm việc với nhà cung cấp nào, và cũng không có cách nào tự ghép thành phần của hai nhà cung cấp với nhau.</p>
${codeTabs({ files: { python: code("abstract-factory.py"), typescript: code("abstract-factory.ts") } })}
<p>Hai bản in ra cùng một kết quả:</p>
${output(result)}
<p>Đổi nhà cung cấp giờ chỉ là đổi factory truyền vào <code>Checkout</code>, và với factory nào thì webhook cũng được chính bộ kiểm của cùng nhà cung cấp chấp nhận.</p>

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Client</strong></td><td>Khay ép và pit-tông, nhận ba chi tiết mà không cần biết chúng thuộc họ nào</td><td><code>Checkout</code></td></tr>
    <tr><td><strong>Abstract Factory</strong></td><td>Ba giá ống trên nóc máy, lần nào cũng phát đủ ba loại chi tiết</td><td><code>PaymentKitFactory</code></td></tr>
    <tr><td><strong>Concrete Factory</strong></td><td>Thanh chọn bộ đặt ở A hoặc ở B</td><td><code>ProviderAFactory</code>, <code>ProviderBFactory</code></td></tr>
    <tr><td><strong>Abstract Product</strong></td><td>Ba loại chi tiết, đánh dấu một, hai và ba chấm</td><td><code>Gateway</code>, <code>Refunds</code>, <code>WebhookVerifier</code></td></tr>
    <tr><td><strong>Concrete Product</strong></td><td>Chi tiết khớp tròn của A và chi tiết khớp vuông của B</td><td><code>GatewayA</code>, <code>VerifierB</code> và các lớp còn lại</td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li><strong>Khi có nhiều họ đối tượng buộc phải dùng cùng nhau.</strong> Ví dụ là các nhà cung cấp thanh toán, bộ giao diện sáng và tối, hay driver cho từng loại cơ sở dữ liệu với kết nối, câu lệnh và cách thoát chuỗi riêng.</li>
  <li><strong>Khi muốn đổi cả họ chỉ bằng một lựa chọn.</strong> Bạn chọn factory lúc khởi động theo cấu hình, còn phần còn lại của ứng dụng không cần biết đã chọn gì.</li>
  <li><strong>Khi muốn thay cả họ bằng bản giả lúc test.</strong> Một <code>FakePaymentFactory</code> trả về ba bản giả đi cùng nhau, nên test không phải ghép từng bản giả bằng tay.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi chỉ cần tạo một loại đối tượng. Một hàm tạo hay Factory Method là đủ, thêm cả một factory chỉ làm code dài hơn.</li>
  <li>Khi các thành phần không thật sự phụ thuộc nhau. Nếu chúng ghép tuỳ ý mà vẫn chạy đúng, buộc chúng vào một họ chỉ thêm ràng buộc thừa.</li>
  <li>Khi các loại sản phẩm còn thay đổi liên tục. Mỗi loại mới buộc bạn sửa interface factory và mọi factory cụ thể cùng lúc.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Factory Method</strong> để lớp con quyết định tạo một sản phẩm. Abstract Factory là một đối tượng tạo cả một họ sản phẩm, và mỗi phương thức tạo bên trong nó thường chính là một factory method.</li>
  <li><strong>Builder</strong> dựng một đối tượng phức tạp qua nhiều bước rồi mới trả về. Abstract Factory trả về từng sản phẩm ngay, và điều nó lo là các sản phẩm cùng họ với nhau.</li>
  <li><strong>Strategy</strong> đổi một thuật toán duy nhất. Abstract Factory đổi cả một nhóm đối tượng cần đi cùng nhau.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Chọn factory ở đúng một chỗ, lúc khởi động.</strong> Sau đó truyền nó vào nơi cần qua constructor hay DI, đừng để code nghiệp vụ tự đọc cấu hình rồi tự tạo factory.</li>
  <li><strong>Factory là nơi tự nhiên để giữ tài nguyên dùng chung của cả họ.</strong> Khoá bí mật, HTTP client hay cấu hình riêng của một nhà cung cấp có thể nằm trong factory, rồi được truyền cho từng sản phẩm nó tạo ra.</li>
  <li><strong>Hãy để trình kiểm kiểu làm việc giúp bạn.</strong> Khai báo factory bằng <code>Protocol</code> trong Python hay <code>interface</code> trong TypeScript, thì factory nào thiếu phương thức sẽ bị báo lỗi ngay.</li>
  <li><strong>Thêm nhà cung cấp là thêm code, không phải sửa code.</strong> Nhà cung cấp mới cần một factory và ba lớp sản phẩm của nó, còn <code>Checkout</code> giữ nguyên.</li>
</ul>
`;

const html = patternPage({
  title: "Abstract Factory",
  description: "Abstract Factory tạo cả một họ đối tượng luôn đi cùng nhau, để chúng không bao giờ bị lẫn. Bài học có hình tương tác, bài toán tích hợp hai nhà cung cấp thanh toán và code Python, TypeScript.",
  group: "Creational",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live + (DEBUG ? SEEK : ""),
});

writeFileSync(join(HERE, DEBUG ? "shots/debug.html" : "index.html"), html);
console.log(`wrote ${DEBUG ? "shots/debug.html" : "index.html"}`);
