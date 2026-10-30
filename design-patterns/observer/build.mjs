// Builds design-patterns/observer/index.html: the figure, then the lesson.
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
const result = execFileSync("python3", ["-I", code("observer.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Observer</h1>
<p class="dp-lead">Observer cho phép một đối tượng báo tin cho tất cả những ai đã đăng ký lắng nghe nó, mà không cần biết họ là ai hay sẽ làm gì với tin đó. Muốn thêm một phản ứng mới, bạn chỉ cần đăng ký thêm một listener, còn nơi phát sự kiện vẫn giữ nguyên.</p>

${plate}

<h2>Bài toán</h2>
<p>Hãy hình dung một cửa hàng online. Mỗi khi khách đặt hàng thành công, vài bộ phận cần được biết, và mỗi bộ phận làm một việc riêng.</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Ai cần biết</th><th>Làm gì</th><th>Với đơn <code>#1001</code> (2 sản phẩm, 1.250.000 ₫)</th></tr></thead>
  <tbody>
    <tr><td>Email</td><td>Gửi email xác nhận cho khách</td><td>gửi xác nhận đơn <code>#1001</code></td></tr>
    <tr><td>Kho</td><td>Giữ hàng cho đơn</td><td>giữ 2 sản phẩm</td></tr>
    <tr><td>Điểm thưởng</td><td>Cộng 1 điểm cho mỗi 10.000 ₫</td><td>cộng 125 điểm</td></tr>
    <tr><td>Thống kê (thêm sau)</td><td>Ghi doanh thu</td><td>ghi 1.250.000 ₫</td></tr>
  </tbody>
</table></div>
<p>Danh sách này còn thay đổi theo thời gian. Tháng sau có thể thêm thống kê, có lúc lại phải tạm tắt email vì nhà cung cấp đang bảo trì. Phần đặt hàng thì không nên phải sửa theo mỗi lần như vậy.</p>

<h2>Khi chưa có Observer</h2>
<p>Cách làm hay gặp là để dịch vụ đặt hàng gọi thẳng từng bộ phận ngay sau khi lưu đơn.</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Thêm một phản ứng là phải sửa phần lõi.</strong> Muốn ghi thống kê, bạn phải sửa <code>place()</code>, sửa constructor và cả mọi chỗ tạo <code>OrderService</code>.</li>
  <li><strong>Dịch vụ đặt hàng phụ thuộc vào quá nhiều thứ.</strong> Nó phải biết lớp email, kho, điểm thưởng và tên phương thức của từng lớp, dù việc của nó chỉ là nhận đơn.</li>
  <li><strong>Bật tắt lúc chạy rất vất vả.</strong> Tạm tắt email nghĩa là phải chèn thêm một cờ <code>if</code> vào giữa luồng đặt hàng.</li>
  <li><strong>Test cũng khó hơn.</strong> Chỉ muốn test riêng phần đặt hàng thôi, bạn vẫn phải dựng hoặc giả lập cả ba bộ phận.</li>
</ul>

<h2>Lời giải</h2>
<p>Ý tưởng là tách chuyện "báo cho ai" ra khỏi chuyện đặt hàng. Đối tượng phát sự kiện, gọi là <strong>Subject</strong>, ở đây là <code>OrderPlaced</code>. Nó chỉ giữ một danh sách listener cùng ba phương thức <code>subscribe</code>, <code>unsubscribe</code> và <code>notify</code>. Mỗi bộ phận là một Observer có chung phương thức <code>on_order_placed(order)</code>. Dịch vụ đặt hàng lưu đơn rồi gọi <code>notify</code>, và không cần biết có bao nhiêu listener hay chúng làm gì. Nhờ vậy, thêm thống kê hay tắt email chỉ là chuyện đăng ký ở nơi lắp ráp chương trình, không đụng tới <code>OrderService</code>.</p>
${codeTabs({ files: { python: code("observer.py"), typescript: code("observer.ts") } })}
<p>Khi chạy, bản Python và bản TypeScript in ra giống hệt nhau:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Subject</strong></td><td>Hộp nút đặt hàng và thanh truyền có hàng lỗ</td><td><code>OrderPlaced</code></td></tr>
    <tr><td><strong>Observer</strong> (interface)</td><td>Chốt cắm giống hệt nhau ở mọi trạm</td><td><code>OrderListener.on_order_placed</code></td></tr>
    <tr><td><strong>Concrete observer</strong></td><td>Bốn trạm với bốn kiểu cờ</td><td><code>EmailListener</code>, <code>StockListener</code>, <code>PointsListener</code>, <code>AnalyticsListener</code></td></tr>
    <tr><td><code>subscribe</code> / <code>unsubscribe</code></td><td>Trạm trượt vào và cắm chốt, hoặc nhấc chốt và lùi ra</td><td><code>placed.subscribe(...)</code>, <code>placed.unsubscribe(...)</code></td></tr>
    <tr><td><code>notify</code></td><td>Nút được bấm, thanh đẩy đi một đoạn và cờ của các trạm đang cắm chốt bật lên</td><td><code>OrderService.place</code> gọi <code>notify(order)</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi một thay đổi ở một chỗ kéo theo việc ở nhiều chỗ khác, và danh sách những chỗ đó thay đổi theo thời gian, chẳng hạn có đơn hàng mới, có người dùng đăng ký, thanh toán xong hay file tải lên xong.</li>
  <li>Khi bên phát không nên biết bên nghe là ai. Module lõi chỉ phát sự kiện, còn các module phụ như email, thống kê hay tích điểm tự đăng ký lắng nghe.</li>
  <li>Khi cần bật tắt phản ứng lúc chạy, hoặc muốn để plugin bên ngoài gắn thêm hành vi mà không phải sửa code gốc.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi chỉ có một bên cần biết và sẽ luôn chỉ có một bên đó. Gọi thẳng hàm đó rõ ràng hơn nhiều.</li>
  <li>Khi các bước phải chạy theo thứ tự chặt chẽ, hoặc phải cùng thành công hay cùng thất bại, như trừ tiền rồi mới giao hàng. Đó là một quy trình, nên viết thành một luồng tường minh.</li>
  <li>Khi sự kiện bắt đầu gọi dây chuyền nhau, listener này phát sự kiện mới và sự kiện đó lại kích hoạt listener khác. Lúc ấy luồng chạy rất khó lần theo và khó debug.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Publish/Subscribe qua message broker</strong>, như hàng đợi, Kafka hay Redis Pub/Sub, có cùng ý tưởng nhưng diễn ra giữa các service. Bên phát và bên nghe không chạy chung tiến trình, ở giữa có hàng đợi và mọi thứ chạy bất đồng bộ, trong khi Observer thường nằm gọn trong một tiến trình và gọi đồng bộ.</li>
  <li><strong>Mediator</strong> cũng giúp các bên không gọi nhau trực tiếp, nhưng trung gian biết rõ từng bên và điều phối chúng. Subject trong Observer thì không biết listener làm gì.</li>
  <li><strong>Chain of Responsibility</strong> chuyền yêu cầu qua từng mắt xích cho tới khi có một mắt xử lý xong thì dừng. Observer thì gửi tới mọi listener.</li>
  <li><strong>Event emitter, callback hay signal</strong>, như <code>EventEmitter</code> của Node hoặc signal của Django, chính là những bản Observer làm sẵn.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Đừng dựa vào thứ tự gọi listener. Nếu kho bắt buộc phải giữ hàng trước khi gửi email, đó là một quy trình chứ không còn là hai listener độc lập.</li>
  <li>Một listener bị lỗi không nên chặn các listener còn lại. Hãy bắt lỗi từng listener trong <code>notify</code> và ghi log, hoặc đẩy những việc chậm như gửi email vào hàng đợi.</li>
  <li>Chỉ phát sự kiện sau khi đơn đã lưu thành công. Nếu phát trong lúc giao dịch cơ sở dữ liệu còn mở mà giao dịch lại bị huỷ, khách sẽ nhận email cho một đơn không hề tồn tại.</li>
  <li>Nhớ huỷ đăng ký những listener không còn dùng. Chừng nào subject còn giữ tham chiếu, listener đó không được giải phóng và vẫn bị gọi như thường.</li>
  <li>Hãy truyền dữ liệu sự kiện ở dạng bất biến, ví dụ <code>@dataclass(frozen=True)</code>, để listener trước không sửa được đơn hàng mà listener sau nhận.</li>
</ul>
`;

const html = patternPage({
  title: "Observer",
  description: "Observer cho một đối tượng báo tin tới mọi listener đã đăng ký mà không cần biết họ là ai. Bài có hình tương tác, bài toán đơn hàng mới kéo theo email, kho, điểm thưởng, thống kê và code Python, TypeScript.",
  group: "Behavioral",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
