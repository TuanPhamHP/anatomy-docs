// "Kiểm tra nhanh" at the end of the Observer lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Mỗi khi có người đăng ký tài khoản, hệ thống cần gửi email chào mừng, tạo ví điểm thưởng và báo cho đội bán hàng. Danh sách việc này còn thay đổi thường xuyên. Cách tổ chức nào hợp nhất?",
    options: [
      "Gọi lần lượt ba hàm ngay trong hàm đăng ký.",
      "Gom ba việc vào một hàm lớn rồi gọi hàm đó trong hàm đăng ký.",
      "Cho hàm đăng ký phát một sự kiện, và để từng bộ phận tự đăng ký lắng nghe sự kiện đó.",
      "Chạy một job định kỳ mỗi giờ để quét bảng người dùng mới.",
    ],
    answer: 2,
    why: "Danh sách phản ứng thay đổi theo thời gian và phần đăng ký không cần biết ai đang nghe, nên Observer là lựa chọn hợp nhất. Gọi thẳng hay gom vào một hàm lớn đều buộc bạn sửa phần đăng ký mỗi lần thêm hoặc bớt một việc.",
  },
  {
    q: "Điểm thưởng được cộng 1 điểm cho mỗi 10.000 ₫. Ở bước cuối, sau khi Email đã huỷ đăng ký, đơn #1003 trị giá 2.400.000 ₫ được đặt. Những listener nào phản ứng, và Điểm cộng bao nhiêu?",
    options: [
      "Kho, Điểm và Thống kê phản ứng, Điểm cộng 240 điểm.",
      "Cả bốn listener phản ứng, Điểm cộng 240 điểm.",
      "Kho, Điểm và Thống kê phản ứng, Điểm cộng 24 điểm.",
      "Chỉ Kho và Điểm phản ứng, Điểm cộng 240 điểm.",
    ],
    answer: 0,
    why: "Trạm Email đã nhấc chốt khỏi thanh nên không còn nhận đơn #1003, còn ba trạm kia vẫn cắm chốt. Lấy 2.400.000 ₫ chia cho 10.000 ₫ thì được 240 điểm.",
  },
  {
    q: "Trong hình, bộ phận nào ứng với phương thức <code>subscribe</code>?",
    options: [
      "Nút đặt hàng trên chiếc hộp bên trái.",
      "Lá cờ bật lên khỏi khe trên mỗi trạm.",
      "Lò xo kéo thanh truyền trở về chỗ cũ.",
      "Một trạm trượt vào và cắm chốt xuống một lỗ trên thanh truyền.",
    ],
    answer: 3,
    why: "Cắm chốt vào thanh nghĩa là đăng ký, nên từ lúc đó trạm sẽ chuyển động mỗi khi thanh bị đẩy. Nút đặt hàng ứng với lời gọi <code>notify</code>, còn lá cờ bật lên là phản ứng của từng listener.",
  },
  {
    q: "Kho bắt buộc phải giữ hàng thành công thì mới được gửi email xác nhận. Bạn nên làm thế nào?",
    options: [
      "Đăng ký listener Kho trước listener Email để Kho luôn chạy trước.",
      "Viết việc giữ hàng rồi gửi email thành một luồng tường minh, vì đây là một quy trình chứ không phải hai listener độc lập.",
      "Cho listener Email đọc một biến toàn cục mà listener Kho bật lên khi giữ hàng xong.",
    ],
    answer: 1,
    why: "Observer không hứa hẹn gì về thứ tự gọi, nên dựa vào thứ tự đăng ký là một cái bẫy. Khi bước sau phụ thuộc vào kết quả của bước trước, hãy viết chúng thành một quy trình rõ ràng.",
  },
  {
    q: "Vì sao chỉ nên gọi <code>notify</code> sau khi đơn hàng đã được lưu thành công?",
    options: [
      "Vì nếu giao dịch bị huỷ sau khi sự kiện đã phát, khách sẽ nhận email cho một đơn không hề tồn tại.",
      "Vì listener không thể đọc dữ liệu khi giao dịch còn đang mở.",
      "Vì <code>notify</code> chỉ chạy được khi đơn hàng đã có mã.",
      "Vì gọi sớm sẽ khiến các listener chạy theo thứ tự ngược lại.",
    ],
    answer: 0,
    why: "Listener có thể gây ra những việc bên ngoài như gửi email, và những việc đó không rút lại được. Phát sự kiện sau khi lưu xong bảo đảm mọi phản ứng đều ứng với một đơn có thật.",
  },
  {
    q: "Observer và Chain of Responsibility khác nhau ở điểm nào?",
    options: [
      "Observer chỉ dùng được trong một tiến trình, còn Chain of Responsibility chạy được giữa nhiều service.",
      "Observer cần một message broker, còn Chain of Responsibility thì không.",
      "Observer gửi sự kiện tới mọi listener, còn Chain of Responsibility chuyền yêu cầu đi cho tới khi có một mắt xích xử lý xong thì dừng.",
    ],
    answer: 2,
    why: "Với Observer, mọi bên đã đăng ký đều được báo và không bên nào chặn bên nào. Chain of Responsibility thì ngược lại, mỗi mắt xích có thể giữ yêu cầu lại để những mắt phía sau không bao giờ thấy nó.",
  },
];
