// "Kiểm tra nhanh" at the end of the Interpreter lesson. `answer` is the index of
// the right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Một trang quản trị cho phép nhân viên tự tạo bộ lọc khách hàng bằng cách ghép các điều kiện như “trường, phép so sánh, giá trị” với VÀ và HOẶC. Hệ thống nên đánh giá các bộ lọc này thế nào?",
    options: [
      "Ghép bộ lọc thành một chuỗi code rồi chạy bằng <code>eval</code>.",
      "Dựng bộ lọc thành một cây nút như <code>Equals</code>, <code>And</code>, <code>Or</code> rồi gọi <code>evaluate</code> trên từng khách.",
      "Viết sẵn một hàm <code>if</code> cho mọi tổ hợp điều kiện có thể có.",
      "Lưu bộ lọc dưới dạng văn bản để nhân viên tự đối chiếu bằng tay.",
    ],
    answer: 1,
    why: "Cây nút cho phép ghép điều kiện tuỳ ý mà vẫn chỉ chạy đúng những phép bạn đã định nghĩa. <code>eval</code> chạy được mọi lệnh nên rất nguy hiểm, còn viết sẵn mọi tổ hợp thì không bao giờ xong.",
  },
  {
    q: "Trong ví dụ, lớp nào đóng vai TerminalExpression?",
    options: ["<code>Or</code>", "<code>AtLeast</code>", "<code>Const</code>", "<code>Expr</code>"],
    answer: 2,
    why: "Nút lá không có nhánh con, ở đây là <code>Var</code> và <code>Const</code>. <code>AtLeast</code> và <code>Or</code> là nút ghép vì chúng đánh giá các nhánh con của mình, còn <code>Expr</code> chỉ là interface chung.",
  },
  {
    q: "Khách Chi có hạng bạc, đơn 720.000 ₫ và ở ĐN. Vì sao cánh tay tín hiệu trong hình vẫn nằm ngang?",
    options: [
      "Vì cổng VÀ còn cần khu vực là HN mà Chi ở ĐN, trong khi nhánh hạng vàng cũng sai.",
      "Vì 720.000 ₫ chưa đạt ngưỡng 500.000 ₫.",
      "Vì cổng HOẶC chỉ nhấc khi cả hai nhánh cùng đúng.",
      "Vì thanh trượt tổng đơn còn kẹt ở vị trí của khách trước.",
    ],
    answer: 0,
    why: "Đơn 720.000 ₫ đủ ngưỡng nên một ngón của cổng VÀ đã nhấc, nhưng điều kiện khu vực sai nên ngón còn lại vẫn đè bàn xuống. Nhánh trái cũng sai vì hạng bạc, mà cổng HOẶC chỉ cần một nhánh đúng chứ không đòi cả hai.",
  },
  {
    q: "Khi nào nên dùng một thư viện biểu thức hay một rules engine có sẵn thay vì tự dựng các lớp nút?",
    options: [
      "Khi quy tắc chỉ có hai điều kiện cố định và hầu như không đổi.",
      "Khi bạn chỉ cần in quy tắc ra màn hình cho người khác đọc.",
      "Khi bạn muốn tránh dùng <code>eval</code> trên quy tắc do người dùng nhập.",
      "Khi ngôn ngữ lớn dần, có hàm, độ ưu tiên toán tử và cần thông báo lỗi tử tế.",
    ],
    answer: 3,
    why: "Tự dựng lớp nút hợp với một ngôn ngữ nhỏ và ổn định. Khi ngữ pháp phình ra, tự viết parser và đủ loại nút sẽ tốn công và dễ sai, nên một công cụ có sẵn đáng dùng hơn. Còn chuyện tránh <code>eval</code> thì một Interpreter tự viết đã làm được.",
  },
  {
    q: "Interpreter liên quan thế nào tới Composite?",
    options: [
      "Hai pattern không liên quan gì, chúng chỉ tình cờ cùng dùng một cái cây.",
      "Cây biểu thức chính là một Composite, còn Interpreter gán cho mỗi nút một ý nghĩa qua <code>evaluate</code>.",
      "Composite dùng để đọc chuỗi quy tắc, còn Interpreter dùng để lưu nó vào cơ sở dữ liệu.",
    ],
    answer: 1,
    why: "Nút ghép như <code>And</code> chứa các nút con và gọi xuống chúng, đúng kiểu Composite. Điều Interpreter thêm vào là mỗi cây là một câu trong một ngôn ngữ, và <code>evaluate</code> tính ra giá trị của câu đó.",
  },
  {
    q: "Quy tắc được lưu dưới dạng JSON rồi nạp lên thành cây. Điều gì làm cho cách này an toàn?",
    options: [
      "Đổi JSON thành một đoạn code Python rồi chạy đoạn code đó.",
      "Cho JSON khai báo tên lớp bất kỳ để tạo nút, cho linh hoạt.",
      "Chỉ ánh xạ những loại nút đã định nghĩa sang đúng lớp của chúng, và báo lỗi mọi thứ khác ngay lúc nạp.",
      "Bỏ qua bước kiểm tra, vì nếu có lỗi thì nó sẽ lộ ra khi khách đặt hàng.",
    ],
    answer: 2,
    why: "Danh sách nút được phép là ranh giới an toàn, vì dữ liệu chỉ ghép được những phép bạn đã viết. Cho JSON tự chọn lớp hay biến nó thành code là mở lại đúng lỗ hổng của <code>eval</code>, còn chờ tới lúc khách đặt hàng mới thấy lỗi thì đã quá muộn.",
  },
];
