// "Kiểm tra nhanh" at the end of the Adapter lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Hệ thống của bạn đang gửi email qua một nhà cung cấp. Công ty muốn chuyển sang nhà cung cấp khác, nhưng thư viện của họ có tên hàm và kiểu dữ liệu khác hẳn. Cách nào giúp phần nghiệp vụ không phải sửa gì?",
    options: [
      "Sửa mọi chỗ gọi hàm gửi email cho khớp với thư viện mới.",
      "Viết một adapter bọc thư viện mới và trả về đúng interface mà hệ thống đang dùng.",
      "Kế thừa lớp của thư viện mới rồi ghi đè toàn bộ phương thức của nó.",
      "Thêm một cờ cấu hình và rẽ nhánh if/else ở mọi chỗ gửi email.",
    ],
    answer: 1,
    why: "Adapter đứng giữa hệ thống và thư viện mới, nên phần nghiệp vụ vẫn gọi đúng interface cũ. Kế thừa lớp của bên ngoài tưởng nhanh nhưng buộc chặt bạn vào lớp của họ, còn rẽ nhánh if/else thì rải logic chuyển đổi ra khắp nơi.",
  },
  {
    q: "Trong ví dụ đối soát, lớp nào đóng vai Adaptee?",
    options: ["<code>TransactionSource</code>", "<code>BankAAdapter</code>", "<code>BankBClient</code>", "<code>Reconciler</code>"],
    answer: 2,
    why: "Adaptee là thứ có sẵn nhưng interface không khớp, ở đây là client của từng ngân hàng như <code>BankBClient</code> với hàm <code>get_statement()</code>. <code>TransactionSource</code> là Target, <code>BankAAdapter</code> là Adapter, còn <code>Reconciler</code> là Client dùng tất cả chúng.",
  },
  {
    q: "Ngân hàng B gửi số tiền dưới dạng chuỗi <code>\"860.000\"</code>. Adapter của B phải làm gì để máy đối soát nhận đúng số tiền?",
    options: [
      "Bỏ dấu chấm ngăn cách hàng nghìn rồi đổi chuỗi sang số 860000.",
      "Đổi thẳng chuỗi sang số thực, được 860.0.",
      "Giữ nguyên chuỗi để máy đối soát tự xử lý.",
      "Nhân với 1000 vì phần sau dấu chấm là phần thập phân.",
    ],
    answer: 0,
    why: "Với ngân hàng B, dấu chấm ngăn cách hàng nghìn chứ không phải dấu thập phân. Nếu đọc thẳng thành số thực, bạn sẽ được 860 đồng thay vì 860.000 đồng, và đó là loại lỗi rất khó phát hiện.",
  },
  {
    q: "Trường hợp nào không cần đến Adapter?",
    options: [
      "Bạn dùng SDK của bên thứ ba và không sửa được mã của nó.",
      "Có ba cổng thanh toán, mỗi cổng trả dữ liệu theo một kiểu.",
      "Bạn muốn thay nhà cung cấp SMS bằng một bản giả khi chạy test.",
      "Chỉ có một nguồn dữ liệu, và bạn sở hữu cả hai phía nên có thể sửa thẳng cho khớp.",
    ],
    answer: 3,
    why: "Khi bạn kiểm soát được cả hai phía, sửa trực tiếp cho khớp thường đơn giản hơn. Thêm Adapter lúc đó chỉ tạo thêm một lớp gián tiếp mà không giải quyết thêm vấn đề nào.",
  },
  {
    q: "Điểm khác nhau chính giữa Adapter và Decorator là gì?",
    options: [
      "Adapter chỉ dùng với thư viện bên thứ ba, còn Decorator chỉ dùng với lớp của chính mình.",
      "Adapter đổi interface cho khớp với bên gọi, còn Decorator giữ nguyên interface và thêm hành vi.",
      "Decorator bọc một đối tượng, còn Adapter bắt buộc phải kế thừa đối tượng đó.",
    ],
    answer: 1,
    why: "Cả hai đều bọc một đối tượng khác. Adapter làm vậy để đổi interface, còn Decorator giữ nguyên interface nên có thể bọc chồng nhiều lớp như cache, log hay retry.",
  },
  {
    q: "Bạn muốn bỏ qua các giao dịch dưới 10.000 ₫ khi đối soát. Quy tắc này nên nằm ở đâu?",
    options: [
      "Trong từng adapter, vì adapter là nơi đầu tiên nhận dữ liệu.",
      "Trong client của từng ngân hàng.",
      "Trong hệ thống đối soát, sau khi đã nhận các giao dịch chuẩn từ adapter.",
      "Trong interface <code>TransactionSource</code>.",
    ],
    answer: 2,
    why: "Adapter nên mỏng, chỉ đổi tên hàm và hình dạng dữ liệu. Nếu đặt quy tắc nghiệp vụ trong adapter, nó sẽ bị lặp lại ở mọi ngân hàng và dễ lệch nhau theo thời gian, nên chỗ của nó là hệ thống đối soát.",
  },
];
