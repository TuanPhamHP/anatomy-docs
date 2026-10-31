// "Kiểm tra nhanh" at the end of the Flyweight lesson. `answer` is the index of
// the right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Một trình soạn thảo lưu mỗi ký tự thành một đối tượng, kèm phông chữ, cỡ chữ và kiểu chữ. Một tài liệu dài có hai triệu ký tự nhưng chỉ dùng năm kiểu chữ. Cách nào giảm bộ nhớ lúc đang chạy nhiều nhất?",
    options: [
      "Nén cả tài liệu bằng gzip mỗi lần lưu xuống đĩa.",
      "Gom phông, cỡ và kiểu vào năm đối tượng dùng chung, mỗi ký tự chỉ giữ chữ cái và một tham chiếu tới kiểu của nó.",
      "Biến lớp kiểu chữ thành Singleton để cả chương trình chỉ có một kiểu.",
      "Tạo sẵn hai triệu đối tượng ký tự ngay khi mở tài liệu để khỏi tạo lại.",
    ],
    answer: 1,
    why: "Phần kiểu chữ lặp lại và không đổi nên gom được về năm flyweight, còn mỗi ký tự chỉ giữ phần riêng của nó. Singleton không hợp vì tài liệu cần năm kiểu chứ không phải một, còn nén khi lưu xuống đĩa chẳng giúp gì cho bộ nhớ lúc đang chạy.",
  },
  {
    q: "Ở bước đầu của hình, mười hai dòng chiếm 24,8&nbsp;KB. Sang bước hai, cũng mười hai dòng ấy chỉ còn 6,9&nbsp;KB. Phần chênh lệch đến từ đâu?",
    options: [
      "Mỗi dòng bỏ bớt số lượng và mã đơn của nó.",
      "Bánh số in số lượng gọn hơn trước.",
      "Thông tin sản phẩm chỉ còn ba bản thay vì mười hai, còn mỗi dòng giữ thêm một tham chiếu nhỏ.",
      "Băng nhãn được in thưa hơn nên tốn ít chỗ hơn.",
    ],
    answer: 2,
    why: "Mười hai bản thông tin sản phẩm, mỗi bản 2.000 byte, rút xuống còn ba bản. Mỗi dòng vẫn giữ phần riêng 64 byte và có thêm 8 byte tham chiếu, nên tổng cộng là 6.864 byte, khoảng 6,9&nbsp;KB.",
  },
  {
    q: "Trong code của bài, đâu là extrinsic state, tức phần riêng của từng dòng?",
    options: [
      "<code>OrderLine.quantity</code>",
      "<code>Product.name</code>",
      "<code>Product.image</code>",
      "Bảng tra bên trong <code>ProductCatalog</code>",
    ],
    answer: 0,
    why: "Số lượng khác nhau ở mỗi dòng nên nằm trong <code>OrderLine</code>. Tên và ảnh giống hệt nhau ở mọi dòng cùng sản phẩm nên thuộc về flyweight <code>Product</code>, còn bảng tra là nơi factory cất các flyweight đã tạo.",
  },
  {
    q: "Vì sao <code>Product</code> được khai báo với <code>frozen=True</code> trong Python và <code>Object.freeze</code> trong TypeScript?",
    options: [
      "Để Python và Node chạy nhanh hơn.",
      "Để không thể tạo hai đối tượng có cùng mã sản phẩm.",
      "Để factory không cần tới bảng tra nữa.",
      "Vì sửa một đối tượng dùng chung là mọi dòng đang trỏ tới nó đều đổi theo, như bốn dòng B ở bước cuối của hình.",
    ],
    answer: 3,
    why: "Flyweight được nhiều dòng dùng chung, nên sửa nó cho một dòng cũng là sửa cho tất cả. Việc mỗi mã chỉ có một đối tượng là nhờ factory, còn bất biến là để không ai vô tình sửa đối tượng ấy.",
  },
  {
    q: "Flyweight khác Singleton ở điểm nào?",
    options: [
      "Singleton tiết kiệm bộ nhớ hơn vì không cần factory.",
      "Flyweight có thể có nhiều thể hiện, mỗi giá trị một thể hiện dùng chung, còn Singleton chỉ có đúng một thể hiện cho cả lớp.",
      "Flyweight chỉ dùng được trong chương trình nhiều thread.",
    ],
    answer: 1,
    why: "Trong bài có ba thể hiện <code>Product</code> cho ba sản phẩm của lô nhỏ và 300 thể hiện cho cả báo cáo. Singleton không làm được vậy, vì nó chỉ cho đúng một thể hiện.",
  },
  {
    q: "Trường hợp nào không đáng dùng Flyweight?",
    options: [
      "Bản đồ game có hàng trăm nghìn cái cây, nhưng chỉ thuộc vài loại cây.",
      "Một job nạp 100.000 dòng đơn hàng thuộc 300 sản phẩm.",
      "Một màn hình quản trị chỉ hiện khoảng 200 dòng, mỗi dòng một sản phẩm khác nhau.",
      "Một trình soạn thảo giữ hàng triệu ký tự nhưng chỉ dùng vài kiểu chữ.",
    ],
    answer: 2,
    why: "Khi đối tượng ít và hầu như không có dữ liệu lặp lại thì chẳng có gì để dùng chung, nên Flyweight chỉ thêm factory và độ phức tạp. Ba trường hợp còn lại đều có rất nhiều đối tượng mang chung một phần nặng.",
  },
];
