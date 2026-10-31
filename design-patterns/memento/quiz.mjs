// "Kiểm tra nhanh" at the end of the Memento lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Một trình soạn biểu mẫu cho người dùng kéo thả nhiều trường và cần nút Hoàn tác, kể cả cho thao tác sắp xếp tự động vốn rất khó viết phép ngược. Cách nào hợp nhất?",
    options: [
      "Viết một hàm đảo ngược riêng cho từng thao tác, kể cả thao tác sắp xếp tự động.",
      "Cho biểu mẫu tự chụp trạng thái trước mỗi thao tác và giữ các bản chụp trong một History.",
      "Ghi toàn bộ biểu mẫu xuống cơ sở dữ liệu sau mỗi lần kéo thả.",
      "Cho lớp History đọc thẳng các trường của biểu mẫu để tự sao chép.",
    ],
    answer: 1,
    why: "Memento hợp khi thao tác khó đảo ngược, vì ta chỉ cần đặt lại trạng thái đã chụp. Viết phép ngược cho thao tác sắp xếp tự động rất dễ sai, còn để History đọc thẳng các trường thì phá vỡ tính đóng gói của biểu mẫu.",
  },
  {
    q: "Trong ví dụ cấu hình phí giao hàng, lớp nào đóng vai Caretaker?",
    options: ["<code>PricingConfig</code>", "<code>Snapshot</code>", "<code>History</code>", "<code>Order</code>"],
    answer: 2,
    why: "<code>History</code> giữ các bản chụp theo nhãn và đưa lại khi được hỏi, nhưng không đọc bên trong. <code>PricingConfig</code> là Originator, nơi tạo và đọc bản chụp, còn <code>Snapshot</code> chính là Memento.",
  },
  {
    q: "Sau lệnh sửa hàng loạt, admin khôi phục bản v2. Đơn mẫu trị giá 250.000 ₫, giao xa 5 km, giờ tốn bao nhiêu tiền giao hàng?",
    options: ["325.000 ₫", "35.000 ₫", "0 ₫", "32.500 ₫"],
    answer: 3,
    why: "Bản v2 có phí gốc 20.000 ₫ và 2.500 ₫ mỗi km, còn đơn 250.000 ₫ chưa tới ngưỡng miễn phí 500.000 ₫. Vì vậy phí là 20.000 ₫ cộng năm lần 2.500 ₫, tức 32.500 ₫. Con số 325.000 ₫ là phí lúc cấu hình còn đang sai.",
  },
  {
    q: "Ở bản chưa có Memento, vì sao sau khi khôi phục v1 thì đơn 600.000 ₫ vẫn bị tính 35.000 ₫?",
    options: [
      "Vì đoạn sao lưu tự viết không chép trường ngưỡng miễn phí, nên ngưỡng vẫn kẹt ở 5.000.000 ₫.",
      "Vì bản v1 vốn không có chương trình miễn phí giao hàng.",
      "Vì phí mỗi km không được khôi phục cùng với phí gốc.",
      "Vì công cụ admin lấy nhầm bản v2 thay cho bản v1.",
    ],
    answer: 0,
    why: "Công cụ admin với vào từng trường và chỉ chép phí gốc với phí mỗi km, vì đoạn đó được viết từ trước khi có ngưỡng miễn phí. Với Memento, chính cấu hình tự chụp đủ trạng thái của nó, nên thêm trường mới chỉ cần sửa <code>save()</code> và <code>restore()</code>.",
  },
  {
    q: "Memento khác Command ở cách hoàn tác như thế nào?",
    options: [
      "Memento chỉ dùng được cho cấu hình, còn Command dùng được cho mọi loại thao tác.",
      "Command hoàn tác bằng một phép ngược, còn Memento đặt lại toàn bộ trạng thái đã chụp.",
      "Memento không cần lưu gì cả, còn Command phải lưu lại toàn bộ lịch sử.",
    ],
    answer: 1,
    why: "Command, như ở bài nhập xuất kho, hoàn tác bằng một thao tác ngược, nên tiết kiệm bộ nhớ nhưng cần viết được phép ngược. Memento chỉ cần đặt lại bản chụp, nên dùng được cả khi không có phép ngược, đổi lại mỗi bản chụp là một bản sao trạng thái.",
  },
  {
    q: "Cấu hình có thêm một danh sách vùng giao hàng. Khi viết <code>save()</code>, việc nào dễ gây lỗi nhất?",
    options: [
      "Cất bản chụp vào History theo nhãn phiên bản như v1, v2.",
      "Để History giữ bản chụp mà không đọc nội dung bên trong.",
      "Gán thẳng danh sách vùng vào bản chụp thay vì chép ra một bản mới.",
      "Giới hạn History chỉ giữ vài bản chụp gần nhất.",
    ],
    answer: 2,
    why: "Nếu bản chụp chỉ giữ tham chiếu tới cùng một danh sách, lần sửa sau sẽ sửa luôn cả bản chụp và việc khôi phục không còn tác dụng. Hãy chép sâu hoặc dùng cấu trúc bất biến khi chụp. Ba lựa chọn còn lại đều là cách làm đúng.",
  },
];
