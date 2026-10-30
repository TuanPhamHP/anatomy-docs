// Builds design-patterns/decorator/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { fullTranscript } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const code = (name) => join(HERE, "code", name);

// The printed result comes from running the example, so the page can't drift from the code.
const result = execFileSync("python3", ["-I", code("decorator.py")], { encoding: "utf8" }).trimEnd();
// The figure moves by the model's trace; it must tell the same story as the code.
if (result !== fullTranscript()) throw new Error("decorator.py and model.mjs disagree:\n" + result + "\n---\n" + fullTranscript());

const body = `
<p class="dp-eyebrow">Structural pattern</p>
<h1>Decorator</h1>
<p class="dp-lead">Decorator bọc một đối tượng bằng một đối tượng khác có <em>cùng interface</em>, để thêm một hành vi (ghi log, cache, thử lại) mà không sửa lớp gốc. Lớp bọc nhận lời gọi, làm thêm việc của nó, rồi chuyển tiếp xuống đối tượng bên trong. Vì lớp bọc cũng có đúng interface đó, ta bọc chồng nhiều lớp lên nhau theo thứ tự tuỳ chọn.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống bán hàng cần tỷ giá để quy đổi giá ngoại tệ sang VND. Một lớp <code>HttpRateSource</code> gọi API tỷ giá của nhà cung cấp qua hàm <code>get_rate(pair)</code>. Chạy thật thì cần thêm:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Cần thêm</th><th>Vì sao</th><th>Không phải lúc nào cũng cần</th></tr></thead>
  <tbody>
    <tr><td>Ghi log mỗi lần gọi API</td><td>Để biết lúc nào API chậm hay lỗi</td><td>Test đơn vị không cần log</td></tr>
    <tr><td>Thử lại khi hết thời gian chờ</td><td>API bên ngoài thỉnh thoảng lỗi thoáng qua</td><td>Job chạy nền tự thử lại theo lịch riêng</td></tr>
    <tr><td>Cache kết quả</td><td>Tỷ giá ít đổi trong vài phút, mà mỗi lần gọi API đều tốn tiền và thời gian</td><td>Màn hình đối soát cần giá mới nhất</td></tr>
  </tbody>
</table></div>
<p>Mỗi nơi dùng cần một tổ hợp khác nhau, và lớp <code>HttpRateSource</code> nên giữ đúng một việc: gọi API.</p>

<h2>Khi chưa có Decorator</h2>
<p>Cách làm thường gặp là nhét cả ba việc vào client gọi API, rồi bật tắt bằng cờ:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Mỗi việc mới là sửa lớp gốc.</strong> Muốn thêm đo thời gian hay giới hạn tần suất gọi, lại phải mở <code>get_rate()</code> ra sửa, và hàm phình theo số cờ.</li>
  <li><strong>Các việc dính vào nhau.</strong> Log nằm giữa vòng thử lại, cache nằm giữa log: sửa một việc dễ làm hỏng việc khác. Thứ tự giữa chúng bị đóng cứng trong code.</li>
  <li><strong>Không dùng lại được.</strong> Nguồn tỷ giá thứ hai (một nhà cung cấp khác) cần đúng log, thử lại, cache ấy thì phải chép lại cả hàm.</li>
  <li><strong>Cách khác cũng tệ.</strong> Dùng kế thừa (<code>LoggedClient</code>, <code>CachedLoggedClient</code>, <code>CachedRetryingLoggedClient</code>...) thì số lớp tăng theo số tổ hợp.</li>
</ul>

<h2>Lời giải</h2>
<p>Giữ một interface chung <code>RateSource</code> với hàm <code>get_rate(pair)</code> (<strong>Component</strong>). <code>HttpRateSource</code> là lõi thật (<strong>Concrete component</strong>). Mỗi việc thêm là một lớp bọc riêng (<strong>Decorator</strong>): nó nhận một <code>RateSource</code> trong constructor, và bản thân nó cũng là một <code>RateSource</code>. Trong <code>get_rate</code>, nó làm việc của mình rồi gọi xuống đối tượng bên trong. Code dùng (<strong>Client</strong>) chỉ cầm một <code>RateSource</code> và không biết bên dưới có mấy lớp.</p>
${codeTabs({ files: { python: code("decorator.py"), typescript: code("decorator.ts") } })}
<p>Kết quả khi chạy (hai bản in ra giống nhau). Ở bước 4 có hai lời gọi nhưng API chỉ bị gọi một lần, vì lần sau <code>CachingSource</code> tự trả lời:</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Component</strong></td><td>Kiểu ren chung: đầu ren trên khối nguồn, trên mỗi vòng, trên các chốt của giá</td><td><code>RateSource.get_rate</code></td></tr>
    <tr><td><strong>Concrete component</strong></td><td>Khối nguồn ở dưới cùng, có màn hình kết quả và bộ đếm số lần gọi API</td><td><code>HttpRateSource</code></td></tr>
    <tr><td><strong>Decorator</strong></td><td>Ba vòng vặn được: LOG (đếm dòng log), RETRY (đếm lần thử), CACHE (ô nhớ và cờ)</td><td><code>LoggingSource</code>, <code>RetrySource</code>, <code>CachingSource</code></td></tr>
    <tr><td>Bọc thêm một lớp</td><td>Vặn một vòng từ giá lên đỉnh chồng</td><td><code>source = CachingSource(source)</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Nút bấm trên cột và trục ép: lời gọi luôn đi vào vòng trên cùng</td><td><code>show(...)</code> gọi <code>source.get_rate("USD/VND")</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Cần thêm việc "xung quanh" một lời gọi mà không đụng vào lớp gốc: log, đo thời gian, cache, thử lại, giới hạn tần suất, kiểm quyền, nén, mã hoá.</li>
  <li>Các việc đó được bật tắt, kết hợp theo nhiều kiểu khác nhau tuỳ nơi dùng, hoặc theo cấu hình lúc chạy.</li>
  <li>Không sửa được lớp gốc (thư viện, SDK bên thứ ba) nhưng vẫn cần thêm hành vi cho nó.</li>
  <li>Ví dụ quen thuộc: luồng I/O của Java (<code>BufferedInputStream</code> bọc <code>FileInputStream</code>), middleware bọc HTTP client, <code>functools.lru_cache</code> và các decorator hàm của Python.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Chỉ cần một việc thêm, ở một nơi, và sẽ không đổi: viết thẳng vào chỗ gọi đơn giản hơn.</li>
  <li>Interface có rất nhiều hàm: lớp bọc nào cũng phải chuyển tiếp từng hàm, kể cả hàm nó không quan tâm.</li>
  <li>Code gọi cần biết đúng lớp cụ thể (<code>isinstance</code>, ép kiểu): bọc vào là mất kiểu gốc.</li>
  <li>Quá nhiều lớp mỏng chồng nhau làm stack trace dài và khó lần theo lỗi.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Adapter</strong> đổi một interface sang interface khác. Decorator giữ nguyên interface và thêm hành vi.</li>
  <li><strong>Proxy</strong> cũng giữ nguyên interface và đứng trước đối tượng thật, nhưng để kiểm soát việc truy cập (tải lười, kiểm quyền, gọi từ xa). Proxy thường tự quản lý đối tượng thật; decorator được bọc chồng tuỳ ý từ bên ngoài. Một lớp cache có thể đọc theo cả hai cách.</li>
  <li><strong>Chain of Responsibility</strong> cũng chuyền lời gọi qua từng mắt, nhưng mỗi mắt quyết định xử lý hay chuyển tiếp. Mỗi decorator gần như luôn chuyển tiếp xuống (trừ khi như cache, nó đã có sẵn câu trả lời).</li>
  <li><strong>Decorator của Python</strong> (cú pháp <code>@</code>) là cùng ý tưởng áp cho hàm: bọc một hàm bằng một hàm có cùng chữ ký.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Thứ tự bọc có ý nghĩa.</strong> Cache ở ngoài cùng thì lần gọi trúng cache không đi qua thử lại hay log. Log ở trong thử lại thì mỗi lần thử được ghi một dòng; đặt log ở ngoài thì chỉ thấy một dòng cho cả lời gọi.</li>
  <li>Mỗi lớp bọc làm đúng một việc và gọi xuống đúng một lần (trừ thử lại và cache), để thay đổi thứ tự không làm sai kết quả.</li>
  <li>Lắp các lớp ở một chỗ (hàm khởi tạo, container DI), không rải khắp nơi dùng.</li>
  <li>Cache thật cần thời hạn (TTL) và giới hạn kích thước; thử lại thật cần chờ tăng dần giữa các lần và chỉ thử lại lỗi thoáng qua, không thử lại lỗi sai tham số.</li>
  <li>Nếu interface lớn, viết một lớp bọc gốc chuyển tiếp mọi hàm, rồi mỗi decorator chỉ ghi đè hàm cần thêm việc.</li>
</ul>
`;

const html = patternPage({
  title: "Decorator",
  description: "Decorator pattern: bọc thêm log, thử lại, cache quanh một đối tượng mà vẫn giữ nguyên interface. Hình tương tác, bài toán nguồn tỷ giá, code Python và TypeScript.",
  group: "Structural",
  body,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
