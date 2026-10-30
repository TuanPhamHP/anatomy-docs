// Builds design-patterns/decorator/index.html: the figure, then the lesson.
// Run: node build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { codeTabs, output, patternPage } from "../_shared/page.mjs";
import { FIGURE_CSS, kitScript, live, plate } from "./figure.mjs";
import { QUIZ } from "./quiz.mjs";
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
<p class="dp-lead">Decorator bọc một đối tượng trong một đối tượng khác có cùng interface, để thêm hành vi như ghi log, cache hay thử lại mà không phải sửa lớp gốc. Lớp bọc nhận lời gọi, làm phần việc của mình rồi chuyển tiếp xuống đối tượng bên trong. Vì lớp bọc cũng mang đúng interface đó, bạn có thể chồng nhiều lớp lên nhau theo thứ tự nào cũng được.</p>

${plate}

<h2>Bài toán</h2>
<p>Hệ thống bán hàng cần tỷ giá để quy đổi giá ngoại tệ sang VND. Lớp <code>HttpRateSource</code> gọi API tỷ giá của nhà cung cấp qua phương thức <code>get_rate(pair)</code>. Khi chạy thật, ta cần thêm ba thứ nữa:</p>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Cần thêm</th><th>Vì sao</th><th>Khi nào không cần</th></tr></thead>
  <tbody>
    <tr><td>Ghi log mỗi lần gọi API</td><td>Để biết lúc nào API chậm hay lỗi</td><td>Test đơn vị không cần log</td></tr>
    <tr><td>Thử lại khi hết thời gian chờ</td><td>API bên ngoài thỉnh thoảng lỗi thoáng qua</td><td>Job chạy nền đã tự thử lại theo lịch riêng</td></tr>
    <tr><td>Cache kết quả</td><td>Tỷ giá ít đổi trong vài phút, mà lần gọi API nào cũng tốn tiền và thời gian</td><td>Màn hình đối soát cần giá mới nhất</td></tr>
  </tbody>
</table></div>
<p>Mỗi nơi dùng lại cần một tổ hợp khác nhau, trong khi lớp <code>HttpRateSource</code> chỉ nên làm đúng một điều là gọi API.</p>

<h2>Khi chưa có Decorator</h2>
<p>Cách làm hay gặp là nhét cả ba thứ vào client gọi API rồi bật tắt bằng cờ:</p>
${codeTabs({ files: { python: code("before.py"), typescript: code("before.ts") } })}
<ul>
  <li><strong>Mỗi tính năng mới lại bắt sửa lớp gốc.</strong> Muốn đo thời gian hay giới hạn tần suất gọi, bạn lại phải mở <code>get_rate()</code> ra sửa, và hàm cứ phình ra theo số cờ.</li>
  <li><strong>Các phần dính chặt vào nhau.</strong> Log nằm giữa vòng thử lại, cache lại nằm giữa log, nên sửa chỗ này rất dễ làm hỏng chỗ kia. Thứ tự giữa chúng cũng bị đóng cứng trong code.</li>
  <li><strong>Không dùng lại được.</strong> Nếu có thêm một nhà cung cấp tỷ giá thứ hai cũng cần log, thử lại và cache như vậy, bạn phải chép lại cả hàm.</li>
  <li><strong>Dùng kế thừa cũng không khá hơn.</strong> Các lớp như <code>LoggedClient</code>, <code>CachedLoggedClient</code>, <code>CachedRetryingLoggedClient</code> sẽ tăng lên theo số tổ hợp.</li>
</ul>

<h2>Lời giải</h2>
<p>Ta giữ một interface chung là <code>RateSource</code> với phương thức <code>get_rate(pair)</code>, đóng vai Component. <code>HttpRateSource</code> là phần lõi thật, gọi là Concrete component.</p>
<p>Mỗi tính năng thêm vào là một lớp bọc riêng, tức một Decorator. Lớp bọc nhận một <code>RateSource</code> qua constructor, và bản thân nó cũng là một <code>RateSource</code>. Trong <code>get_rate</code>, nó làm phần của mình rồi gọi xuống đối tượng bên trong. Phần code sử dụng đóng vai Client, chỉ cầm một <code>RateSource</code> và không biết bên dưới có bao nhiêu lớp.</p>
${codeTabs({ files: { python: code("decorator.py"), typescript: code("decorator.ts") } })}
<p>Hai bản in ra cùng một kết quả. Hãy để ý bước 4: có hai lời gọi nhưng API chỉ bị gọi một lần, vì lần thứ hai <code>CachingSource</code> tự trả lời.</p>
${output(result)}

<h2>Các vai trò</h2>
<div class="dp-scroll"><table class="dp-table">
  <thead><tr><th>Vai trò</th><th>Trong hình</th><th>Trong code</th></tr></thead>
  <tbody>
    <tr><td><strong>Component</strong></td><td>Kiểu ren chung, có trên khối nguồn, trên mỗi vòng và trên các chốt của giá</td><td><code>RateSource.get_rate</code></td></tr>
    <tr><td><strong>Concrete component</strong></td><td>Khối nguồn ở dưới cùng, có màn hình kết quả và bộ đếm số lần gọi API</td><td><code>HttpRateSource</code></td></tr>
    <tr><td><strong>Decorator</strong></td><td>Ba vòng vặn: LOG đếm dòng log, RETRY đếm lần thử, CACHE có ô nhớ và cờ</td><td><code>LoggingSource</code>, <code>RetrySource</code>, <code>CachingSource</code></td></tr>
    <tr><td>Bọc thêm một lớp</td><td>Vặn một vòng từ giá lên đỉnh chồng</td><td><code>source = CachingSource(source)</code></td></tr>
    <tr><td><strong>Client</strong></td><td>Nút bấm trên cột và trục ép, lời gọi luôn đi vào vòng trên cùng</td><td><code>show(...)</code> gọi <code>source.get_rate("USD/VND")</code></td></tr>
  </tbody>
</table></div>

<h2>Khi nào dùng</h2>
<ul>
  <li>Khi cần thêm những việc bao quanh một lời gọi mà không đụng vào lớp gốc, như log, đo thời gian, cache, thử lại, giới hạn tần suất, kiểm quyền, nén hay mã hoá.</li>
  <li>Khi những việc đó cần bật tắt hoặc kết hợp theo nhiều kiểu, tuỳ nơi dùng hoặc tuỳ cấu hình lúc chạy.</li>
  <li>Khi không sửa được lớp gốc, chẳng hạn một thư viện hay SDK của bên thứ ba, nhưng vẫn cần thêm hành vi cho nó.</li>
  <li>Thật ra bạn đã gặp pattern này nhiều lần: luồng I/O của Java với <code>BufferedInputStream</code> bọc <code>FileInputStream</code>, middleware bọc HTTP client, hay <code>functools.lru_cache</code> và các decorator hàm của Python.</li>
</ul>
<h3>Khi nào không nên</h3>
<ul>
  <li>Khi chỉ cần thêm một việc, ở một nơi, và sẽ không đổi. Viết thẳng vào chỗ gọi đơn giản hơn nhiều.</li>
  <li>Khi interface có rất nhiều phương thức. Lớp bọc nào cũng phải chuyển tiếp từng phương thức, kể cả những phương thức nó không quan tâm.</li>
  <li>Khi code gọi cần biết chính xác lớp cụ thể, ví dụ dùng <code>isinstance</code> hay ép kiểu, vì bọc vào là mất kiểu gốc.</li>
  <li>Khi có quá nhiều lớp mỏng chồng lên nhau. Stack trace sẽ dài, và lần ra lỗi rất mệt.</li>
</ul>

<h2>Dễ nhầm với</h2>
<ul>
  <li><strong>Adapter</strong> đổi một interface sang interface khác, còn Decorator giữ nguyên interface và thêm hành vi.</li>
  <li><strong>Proxy</strong> cũng giữ nguyên interface và đứng trước đối tượng thật, nhưng mục đích là kiểm soát truy cập, như tải lười, kiểm quyền hay gọi từ xa. Proxy thường tự quản lý đối tượng thật, còn decorator được bọc chồng tuỳ ý từ bên ngoài. Một lớp cache có thể hiểu theo cả hai cách.</li>
  <li><strong>Chain of Responsibility</strong> cũng chuyền lời gọi qua từng mắt, nhưng mỗi mắt tự quyết định xử lý hay chuyển tiếp. Decorator thì gần như luôn chuyển tiếp xuống, trừ trường hợp như cache khi nó đã có sẵn câu trả lời.</li>
  <li><strong>Decorator của Python</strong>, tức cú pháp <code>@</code>, là cùng một ý tưởng áp dụng cho hàm: bọc một hàm bằng một hàm khác có cùng chữ ký.</li>
</ul>

<h2>Ghi chú khi triển khai</h2>
<ul>
  <li><strong>Thứ tự bọc có ý nghĩa.</strong> Nếu cache nằm ngoài cùng, lần gọi trúng cache sẽ không đi qua thử lại hay log. Nếu log nằm trong thử lại, mỗi lần thử được ghi một dòng, còn đặt log ở ngoài thì cả lời gọi chỉ có một dòng.</li>
  <li><strong>Mỗi lớp bọc chỉ nên làm một việc.</strong> Nó gọi xuống đúng một lần, trừ thử lại và cache, để khi đổi thứ tự thì kết quả vẫn đúng.</li>
  <li><strong>Hãy lắp các lớp ở một chỗ duy nhất.</strong> Dựng chồng decorator trong hàm khởi tạo hoặc container DI, đừng rải ra khắp những nơi dùng.</li>
  <li><strong>Cache và thử lại khi chạy thật cần thêm cấu hình.</strong> Cache cần thời hạn hết hạn, thường gọi là TTL, và giới hạn kích thước. Thử lại cần chờ tăng dần giữa các lần, và chỉ thử lại lỗi thoáng qua chứ không thử lại lỗi sai tham số.</li>
  <li><strong>Interface lớn thì nên có một lớp bọc gốc.</strong> Lớp này chuyển tiếp mọi phương thức, rồi mỗi decorator chỉ ghi đè phương thức mà nó cần thêm hành vi.</li>
</ul>
`;

const html = patternPage({
  title: "Decorator",
  description: "Decorator thêm log, thử lại và cache quanh một đối tượng mà vẫn giữ nguyên interface. Bài học có hình tương tác, bài toán nguồn tỷ giá và code Python, TypeScript.",
  group: "Structural",
  body,
  quiz: QUIZ,
  figureCss: FIGURE_CSS,
  script: kitScript() + live,
});

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
