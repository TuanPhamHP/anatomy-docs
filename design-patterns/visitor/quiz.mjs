// "Kiểm tra nhanh" at the end of the Visitor lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Một trình biên dịch nhỏ có cây cú pháp với khoảng mười loại nút, và các loại nút này gần như không đổi. Nhóm lần lượt cần thêm kiểm tra kiểu, tối ưu và sinh mã. Cách nào hợp nhất?",
    options: [
      "Thêm ba phương thức <code>check</code>, <code>optimize</code> và <code>emit</code> vào từng lớp nút.",
      "Viết mỗi thao tác thành một visitor, còn các lớp nút chỉ có <code>accept</code>.",
      "Viết mỗi thao tác thành một hàm lớn với chuỗi <code>isinstance</code> cho từng loại nút.",
      "Gom cả cây vào một Singleton để mọi thao tác cùng truy cập.",
    ],
    answer: 1,
    why: "Các loại nút ít đổi còn thao tác cứ tăng, đúng chỗ mạnh của Visitor. Thêm phương thức vào từng lớp nút nghĩa là sửa cả mười lớp cho mỗi thao tác mới, còn chuỗi <code>isinstance</code> thì rất dễ quên một loại nút.",
  },
  {
    q: "Trong hình, khi xe dừng trước khối giảm giá, điều gì quyết định bit tam giác là bit được đẩy vào?",
    options: [
      "Bộ bit đang lắp trên xe.",
      "Vị trí của khối trong hàng.",
      "Lỗ cắm tam giác của khối, tức <code>accept</code> của <code>DiscountLine</code> gọi <code>visit_discount</code>.",
      "Con số trên bộ đếm ở đầu bộ bit.",
    ],
    answer: 2,
    why: "Lỗ cắm là loại của dòng, và nó chọn phương thức visit nào được gọi. Bộ bit đang lắp chỉ quyết định bit ấy làm gì, tính thuế hay ghi JSON, và đó là lần chọn thứ hai của double dispatch.",
  },
  {
    q: "Bộ VAT đi qua cả ba dòng của hoá đơn. Tổng VAT cuối cùng là bao nhiêu?",
    options: ["52.400 ₫", "48.000 ₫", "57.400 ₫", "47.400 ₫"],
    answer: 3,
    why: "Sản phẩm cho 50.000 ₫, giao hàng 2.400 ₫, còn dòng giảm giá bớt 5.000 ₫ thuế, nên tổng là 47.400 ₫. Con số 52.400 ₫ là tổng khi bạn quên trừ phần thuế của khoản giảm giá, còn 48.000 ₫ là khi tính chung 10% cho cả hoá đơn.",
  },
  {
    q: "Vì sao bản code cũ xuất ra 530.000 ₫ trong khi hoá đơn chỉ có 480.000 ₫?",
    options: [
      "Chuỗi <code>isinstance</code> trong hàm xuất thiếu nhánh cho <code>DiscountLine</code>, nên khoản giảm 50.000 ₫ không được ghi.",
      "Hàm xuất cộng nhầm thuế VAT vào số tiền của mỗi dòng.",
      "Phí giao hàng bị ghi hai lần.",
      "JSON làm tròn số tiền lên hàng chục nghìn.",
    ],
    answer: 0,
    why: "Hàm xuất chỉ có nhánh cho sản phẩm và giao hàng, nên dòng giảm giá rơi qua mà không có lỗi nào. Với Visitor, một visitor thiếu phương thức cho dòng giảm giá sẽ lỗi ngay ở lần chạy đầu thay vì âm thầm bỏ qua.",
  },
  {
    q: "Cửa hàng thêm một loại dòng mới là phí gói quà. Với thiết kế Visitor của bài, bạn phải sửa những gì?",
    options: [
      "Chỉ cần thêm lớp <code>GiftWrapLine</code>, các visitor sẽ tự xử lý dòng mới.",
      "Thêm <code>GiftWrapLine</code> có <code>accept</code>, rồi viết thêm một phương thức cho nó trong mọi visitor đang có.",
      "Chỉ sửa <code>VatVisitor</code>, vì phí gói quà không cần xuất cho kế toán.",
    ],
    answer: 1,
    why: "Đây là cái giá của Visitor. Thêm thao tác thì dễ, nhưng thêm loại đối tượng thì visitor nào cũng phải có phương thức mới, nếu không lần chạy đầu sẽ báo lỗi như dòng cuối của kết quả.",
  },
  {
    q: "Điểm khác nhau chính giữa Visitor và Strategy là gì?",
    options: [
      "Strategy luôn giữ trạng thái, còn Visitor thì không bao giờ giữ.",
      "Visitor chỉ dùng được khi các đối tượng xếp thành cây.",
      "Visitor có một phương thức cho mỗi loại đối tượng và chọn theo loại đang được thăm, còn Strategy là một thuật toán thay được cho cùng một kiểu dữ liệu.",
      "Strategy gọi <code>accept</code> trên dữ liệu, còn Visitor thì không cần.",
    ],
    answer: 2,
    why: "Strategy thay cả một thuật toán cho cùng một kiểu dữ liệu, như cách tính phí giao hàng. Visitor chứa nhiều phương thức, mỗi phương thức cho một loại đối tượng, và chính loại của đối tượng được thăm quyết định phương thức nào chạy.",
  },
];
