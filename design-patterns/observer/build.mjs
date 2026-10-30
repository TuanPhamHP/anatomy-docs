// Builds design-patterns/observer/index.html: the figure, then the lesson.
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
const result = execFileSync("python3", ["-I", code("observer.py")], { encoding: "utf8" }).trimEnd();

const body = `
<p class="dp-eyebrow">Behavioral pattern</p>
<h1>Observer</h1>
<p class="dp-lead">Observer cho một đối tượng (subject) báo một sự kiện tới mọi đối tượng đã đăng ký nghe nó (observer, hay listener), mà không cần biết đó là ai hay chúng làm gì. Muốn thêm một phản ứng mới, chỉ cần đăng ký thêm một listener; nơi phát sự kiện giữ nguyên.</p>

${plate}

<h2>Bài toán</h2>
<p>Một cửa hàng online. Mỗi khi khách đặt hàng thành công, vài bộ phận cần biết, và mỗi bộ phận làm một việc riêng:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Ai cần biết</th><th>Làm gì</th><th>Với đơn <code>#1001</code> (2 sản phẩm, 1.250.000 ₫)</th></tr></thead>
  <tbody>
    <tr><td>Email</td><td>Gửi email xác nhận cho khách</td><td>gửi xác nhận đơn <code>#1001</code></td></tr>
    <tr><td>Kho</td><td>Giữ hàng cho đơn</td><td>giữ 2 sản phẩm</td></tr>
    <tr><td>Điểm thưởng</td><td>1 điểm cho mỗi 10.000 ₫</td><td>cộng 125 điểm</td></tr>
    <tr><td>Thống kê (thêm sau)</td><td>Ghi doanh thu</td><td>ghi 1.250.000 ₫</td></tr>
  </tbody>
</table></div>
<p>Danh sách này thay đổi theo thời gian: tháng sau thêm thống kê, có lúc phải tạm tắt email khi nhà cung cấp email bảo trì. Phần đặt hàng thì không nên phải sửa theo mỗi lần như vậy.</p>

<h2>Khi chưa có Observer</h2>
<p>Cách làm thường gặp là để dịch vụ đặt hàng gọi thẳng từng bộ phận, ngay sau khi lưu đơn:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Thêm phản ứng là sửa lõi.</strong> Muốn ghi thống kê phải sửa <code>place()</code>, sửa constructor và mọi chỗ tạo <code>OrderService</code>.</li>
  <li><strong>Phụ thuộc chằng chịt.</strong> Dịch vụ đặt hàng phải biết lớp email, kho, điểm thưởng và tên hàm của từng lớp, dù việc của nó chỉ là nhận đơn.</li>
  <li><strong>Khó bật tắt lúc chạy.</strong> Tạm tắt email nghĩa là thêm một cờ <code>if</code> vào giữa luồng đặt hàng.</li>
  <li><strong>Khó test.</strong> Test riêng việc đặt hàng vẫn phải dựng hoặc giả lập cả ba bộ phận.</li>
</ul>

<h2>Lời giải</h2>
<p>Tách việc "báo cho ai" ra khỏi việc đặt hàng. <strong>Subject</strong> (<code>OrderPlaced</code>) chỉ giữ một danh sách listener với ba hàm: <code>subscribe</code>, <code>unsubscribe</code> và <code>notify</code>. Mỗi bộ phận là một <strong>Observer</strong> có cùng một hàm <code>on_order_placed(order)</code>. Dịch vụ đặt hàng lưu đơn rồi gọi <code>notify</code>, và không biết có bao nhiêu listener hay chúng làm gì. Thêm thống kê hay tắt email là việc đăng ký ở chỗ lắp ráp chương trình, không đụng vào <code>OrderService</code>.</p>
${codeTabs({ files: { python: code("observer.py"), typescript: code("observer.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau):</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Subject</strong></td><td>Hộp nút đặt hàng và thanh truyền có hàng lỗ</td><td><code>OrderPlaced</code></td></tr>
    <tr><td><strong>Observer</strong> (interface)</td><td>Chốt cắm giống hệt nhau ở mọi trạm</td><td><code>OrderListener.on_order_placed</code></td></tr>
    <tr><td><strong>Concrete observer</strong></td><td>Bốn trạm với bốn kiểu cờ</td><td><code>EmailListener</code>, <code>StockListener</code>, <code>PointsListener</code>, <code>AnalyticsListener</code></td></tr>
    <tr><td><code>subscribe</code> / <code>unsubscribe</code></td><td>Trạm trượt vào và cắm chốt / nhấc chốt và lùi ra</td><td><code>placed.subscribe(...)</code>, <code>placed.unsubscribe(...)</code></td></tr>
    <tr><td><code>notify</code></td><td>Nút được bấm, thanh đẩy đi một hành trình, cờ của trạm đang cắm bật lên</td><td><code>OrderService.place</code> gọi <code>notify(order)</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Một thay đổi ở một chỗ kéo theo việc ở nhiều chỗ khác, và danh sách những chỗ đó thay đổi theo thời gian: đơn hàng mới, người dùng đăng ký, thanh toán xong, file tải lên xong.</li>
  <li>Bên phát không nên biết bên nghe: module lõi phát sự kiện, các module phụ (email, thống kê, tích điểm) tự đăng ký nghe.</li>
  <li>Cần bật tắt phản ứng lúc chạy, hoặc để plugin bên ngoài gắn thêm hành vi mà không sửa code gốc.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ có một bên cần biết và sẽ luôn chỉ có một: gọi thẳng hàm đó rõ ràng hơn.</li>
  <li>Các bước phải chạy theo thứ tự chặt chẽ hoặc cùng thành công hay cùng thất bại (trừ tiền rồi mới giao hàng): đó là một quy trình, nên viết thành luồng tường minh.</li>
  <li>Quá nhiều sự kiện gọi dây chuyền nhau: listener phát sự kiện mới, sự kiện đó lại kích listener khác. Luồng chạy trở nên khó lần theo và khó debug.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Publish/Subscribe qua message broker</strong> (hàng đợi, Kafka, Redis Pub/Sub) là cùng ý tưởng nhưng giữa các service: bên phát và bên nghe không cùng tiến trình, có hàng đợi ở giữa, chạy bất đồng bộ. Observer thường nằm trong một tiến trình và gọi đồng bộ.</li>
  <li><strong>Mediator</strong> cũng làm các bên không gọi nhau trực tiếp, nhưng trung gian biết từng bên và điều phối chúng. Subject trong Observer không biết listener làm gì.</li>
  <li><strong>Chain of Responsibility</strong> chuyền yêu cầu qua từng mắt cho đến khi một mắt xử lý xong thì dừng. Observer gửi cho mọi listener.</li>
  <li><strong>Event emitter, callback, signal</strong> (như <code>EventEmitter</code> của Node hay signal của Django) chính là các bản cài sẵn của Observer.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li>Đừng dựa vào thứ tự gọi listener. Nếu kho phải giữ hàng trước khi gửi email, đó là một quy trình chứ không còn là hai listener độc lập.</li>
  <li>Một listener lỗi không nên chặn các listener còn lại: bắt lỗi từng listener trong <code>notify</code> và ghi log, hoặc đẩy việc chậm (gửi email) vào hàng đợi.</li>
  <li>Chỉ phát sự kiện sau khi đơn đã lưu thành công. Nếu phát trong lúc giao dịch cơ sở dữ liệu còn mở rồi giao dịch bị huỷ, email đã gửi cho một đơn không tồn tại.</li>
  <li>Nhớ huỷ đăng ký listener không còn dùng. Subject còn giữ tham chiếu thì listener không được giải phóng và vẫn bị gọi (lỗi listener bị bỏ quên).</li>
  <li>Truyền dữ liệu sự kiện dạng bất biến (như <code>@dataclass(frozen=True)</code>) để listener này không sửa đơn hàng mà listener sau nhận được.</li>
</ul>
`;

const html = patternPage({
  title: "Observer",
  description: "Observer pattern: một subject phát sự kiện tới mọi listener đã đăng ký mà không cần biết chúng. Hình tương tác, bài toán đơn hàng mới kéo theo email, kho, điểm thưởng, thống kê, code Python và TypeScript.",
  group: "Behavioral",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
