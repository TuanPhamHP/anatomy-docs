// "Kiểm tra nhanh" at the end of the Builder lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Sau khi gọi <code>page(3, 20)</code>, hai tham số cuối của Query là gì?",
    options: ["<code>3</code> và <code>20</code>", "<code>20</code> và <code>60</code>", "<code>20</code> và <code>40</code>", "<code>60</code> và <code>20</code>"],
    answer: 2,
    why: "Trang 3 với cỡ trang 20 nghĩa là lấy 20 dòng và bỏ qua 40 dòng của hai trang đầu, nên LIMIT nhận 20 còn OFFSET nhận 40. Bản code cũ nhầm đúng ở chỗ này khi truyền tham số theo vị trí.",
  },
  {
    q: "Trong hình, <code>build()</code> được gọi khi chưa có <code>page()</code>. Chuyện gì xảy ra?",
    options: [
      "Builder trả về một Query không có phần LIMIT.",
      "Builder từ chối, lá cờ bật lên và không có Query nào được tạo ra.",
      "Builder tự thêm <code>page(1, 100)</code> cho đủ bộ.",
      "Builder in ra một câu SQL có <code>WHERE AND</code>.",
    ],
    answer: 1,
    why: "Phân trang là ràng buộc của cả bộ, nên <code>build()</code> kiểm tra nó trước khi ghép câu. Thiếu <code>page()</code> thì builder từ chối hẳn chứ không tự đoán giá trị mặc định, vì một danh sách đơn không phân trang có thể kéo cả bảng về.",
  },
  {
    q: "Vì sao bản code cũ có thể sinh ra câu SQL chứa <code>WHERE AND</code>?",
    options: [
      "Vì mỗi nhánh if tự nối chuỗi và không chỗ nào nắm ngữ pháp của cả câu, nên khi bỏ trống trạng thái thì AND đứng ngay sau WHERE.",
      "Vì cơ sở dữ liệu tự chèn thêm AND vào câu.",
      "Vì ngày bắt đầu nằm sau ngày kết thúc.",
      "Vì cỡ trang vượt quá 100.",
    ],
    answer: 0,
    why: "Khi ghép chuỗi theo từng nhánh, nhánh nào cũng phải tự nhớ lúc nào dùng WHERE, lúc nào dùng AND. Builder gom các điều kiện lại và để <code>build()</code> ghép chúng theo đúng ngữ pháp một lần duy nhất.",
  },
  {
    q: "Trường hợp nào không cần đến Builder?",
    options: [
      "Một request HTTP có header, query, body và timeout tuỳ chọn, cùng vài ràng buộc chéo giữa chúng.",
      "Một câu truy vấn có nhiều bộ lọc tuỳ chọn và bắt buộc phải phân trang.",
      "Một email có người nhận, cc và đính kèm, trong đó có đính kèm thì phải có tên file.",
      "Một đối tượng <code>Money</code> chỉ có hai trường bắt buộc là số tiền và đơn vị tiền.",
    ],
    answer: 3,
    why: "Với ít trường và phần lớn là bắt buộc, một constructor hay dataclass với tham số đặt tên là đủ rõ ràng. Builder chỉ đáng giá khi có nhiều phần tuỳ chọn và có ràng buộc cần kiểm tra trên cả bộ.",
  },
  {
    q: "Gọi <code>page(1, 500)</code> thì builder nên báo lỗi vào lúc nào?",
    options: [
      "Ngay ở chính lời gọi <code>page()</code>, vì giới hạn cỡ trang kiểm tra được mà không cần biết các phần khác.",
      "Chỉ ở <code>build()</code>, vì mọi kiểm tra đều phải dồn tới cuối.",
      "Không cần báo lỗi, vì cơ sở dữ liệu sẽ tự giới hạn số dòng.",
    ],
    answer: 0,
    why: "Thứ gì kiểm tra được ngay thì nên kiểm tra sớm, để lỗi chỉ thẳng vào lời gọi sai. <code>build()</code> chỉ nên giữ những ràng buộc cần đủ cả bộ, như việc câu truy vấn đã được phân trang hay chưa.",
  },
  {
    q: "Chuỗi <code>items.map(...).filter(...)</code> trên một mảng có phải là Builder không?",
    options: [
      "Có, vì nó gọi nối chuỗi giống hệt builder.",
      "Có, vì mỗi lời gọi đều trả về một đối tượng mới.",
      "Không, vì nó không có bước <code>build()</code> nào chốt lại và kiểm tra một sản phẩm hoàn chỉnh.",
    ],
    answer: 2,
    why: "Gọi nối chuỗi chỉ là một kiểu viết, thường gọi là fluent interface. Builder hay dùng kiểu viết này, nhưng điều làm nên Builder là gom các phần qua nhiều bước rồi chốt lại thành một sản phẩm ở <code>build()</code>.",
  },
];
