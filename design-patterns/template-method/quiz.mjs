// "Kiểm tra nhanh" at the end of the Template Method lesson. `answer` is the index
// of the right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Bạn có ba luồng nhập file từ ba đối tác. Luồng nào cũng đọc file, kiểm tra, chuyển đổi rồi lưu, và chỉ bước chuyển đổi là khác nhau. Bạn muốn chắc chắn không luồng nào bỏ sót bước kiểm tra. Cách nào hợp nhất?",
    options: [
      "Chép hàm nhập của đối tác đầu tiên ra hai bản rồi sửa bước chuyển đổi.",
      "Viết một hàm lớn nhận tên đối tác và rẽ nhánh if/else ở mọi bước.",
      "Đặt khung bốn bước vào một phương thức ở lớp cha, và để mỗi lớp con chỉ viết bước chuyển đổi.",
      "Để mỗi đối tác tự viết toàn bộ luồng nhập của mình.",
    ],
    answer: 2,
    why: "Khi khung nằm ở lớp cha, thứ tự các bước và bước kiểm tra chỉ được viết một lần, nên lớp con không có cách nào bỏ qua. Chép hàm ra nhiều bản chính là cách đã khiến bản JSON Lines trong bài quên bước lọc.",
  },
  {
    q: "Ở phiên bản chưa có Template Method, file report.jsonl báo sáu đơn với tổng 6.525.000&nbsp;₫. Vì sao lại như vậy?",
    options: [
      "Bản chép dành cho JSON Lines quên bước lọc nên xuất luôn cả hai đơn đã huỷ.",
      "JSON Lines cộng thêm header và footer vào tổng tiền.",
      "Hàm xuất JSON đọc dữ liệu của hai ngày.",
      "JSON làm tròn số tiền lên hàng nghìn.",
    ],
    answer: 0,
    why: "Bốn đơn đã thanh toán có tổng 4.565.000&nbsp;₫. Hai đơn huỷ lọt vào làm tổng thành 6.525.000&nbsp;₫, và không có lỗi nào được báo, chỉ có một con số sai.",
  },
  {
    q: "Sau khi áp dụng Template Method, ba file CSV, JSON Lines và Fixed-width lần lượt ghi bao nhiêu dòng?",
    options: [
      "Bốn, bốn và bốn dòng, vì cả ba có cùng bốn đơn.",
      "Sáu, sáu và sáu dòng.",
      "Năm, sáu và bốn dòng.",
      "Năm, bốn và sáu dòng.",
    ],
    answer: 3,
    why: "Cả ba đều còn bốn đơn sau bước lọc. CSV thêm một dòng header nên có năm dòng, JSON Lines không dùng hook nào nên giữ bốn dòng, còn Fixed-width có cả header lẫn footer nên thành sáu dòng.",
  },
  {
    q: "Trong ví dụ, <code>header()</code> và <code>footer()</code> đóng vai gì?",
    options: [
      "Phương thức abstract mà lớp con nào cũng bắt buộc phải viết.",
      "Hook, tức bước tuỳ chọn có sẵn bản mặc định không làm gì, và lớp con chỉ ghi đè khi cần.",
      "Template method điều khiển thứ tự các bước.",
      "Bước dùng chung được viết một lần ở lớp cha và không ai được ghi đè.",
    ],
    answer: 1,
    why: "Bước bắt buộc trong ví dụ là <code>format_row()</code>. Còn <code>header()</code> và <code>footer()</code> có sẵn bản mặc định, nên <code>JsonLinesExporter</code> không cần viết chúng, trong khi <code>FixedWidthExporter</code> ghi đè cả hai.",
  },
  {
    q: "Template Method khác Strategy ở điểm nào?",
    options: [
      "Template Method dùng kế thừa và lớp cha giữ khung, còn Strategy nhận vào một đối tượng có thể đổi ngay lúc chạy.",
      "Strategy giữ cố định thứ tự các bước, còn Template Method cho đổi thứ tự lúc chạy.",
      "Template Method chỉ dùng được cho việc xuất file, còn Strategy dùng được cho mọi việc.",
    ],
    answer: 0,
    why: "Với Template Method, lựa chọn được chốt khi bạn chọn lớp con lúc viết code. Với Strategy, khung nằm ở đối tượng dùng nó và phần thay đổi là một đối tượng khác được truyền vào, nên có thể đổi ngay lúc chạy.",
  },
  {
    q: "Khi viết một lớp con mới của <code>ReportExporter</code>, điều gì nên tránh?",
    options: [
      "Viết phương thức <code>format_row()</code> cho định dạng mới.",
      "Ghi đè <code>header()</code> khi định dạng cần một dòng đầu.",
      "Ghi đè chính <code>export()</code>, vì như vậy lớp con có thể đổi thứ tự hoặc bỏ qua bước lọc.",
      "Giữ nguyên bản mặc định của <code>footer()</code>.",
    ],
    answer: 2,
    why: "<code>export()</code> là template method giữ khung, nên lớp con không được ghi đè nó. Python và TypeScript không có final thật sự cho phương thức, vì vậy hãy đặt tên rõ ràng và ghi chú lại, còn trong Java thì dùng final.",
  },
];
