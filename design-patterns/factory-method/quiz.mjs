// "Kiểm tra nhanh" at the end of the Factory Method lesson. `answer` is the index of
// the right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Trong ví dụ, phương thức nào là factory method?",
    options: ["<code>notify()</code>", "<code>create_sender()</code>", "<code>send()</code>", "<code>sender_for()</code>"],
    answer: 1,
    why: "<code>create_sender()</code> là bước tạo đối tượng mà lớp cha khai báo và lớp con ghi đè. <code>notify()</code> là quy trình chung dùng kết quả của nó, còn <code>sender_for()</code> là hàm factory tra bảng, một biến thể không cần lớp con.",
  },
  {
    q: "Công ty muốn thêm kênh Zalo. Với Factory Method, bạn cần làm gì?",
    options: [
      "Thêm một nhánh <code>elif</code> mới vào <code>notify()</code> của lớp cha.",
      "Sửa interface <code>Sender</code> để thêm một phương thức gửi Zalo.",
      "Đổi tên các kênh thành hằng số để tránh gõ nhầm.",
      "Viết <code>ZaloSender</code> và một lớp con <code>ZaloNotifier</code> ghi đè <code>create_sender()</code>, còn lớp cha giữ nguyên.",
    ],
    answer: 3,
    why: "Kênh mới chỉ cần một product mới và một lớp con tạo ra nó. Quy trình trong <code>notify()</code> của lớp cha không phải sửa, nên các kênh cũ cũng không cần test lại.",
  },
  {
    q: "Trong ví dụ, kênh SMS gửi nội dung ra sao và mất phí bao nhiêu?",
    options: [
      "Nội dung được bỏ dấu, nằm gọn trong 1 tin, phí 500 ₫.",
      "Nội dung giữ nguyên dấu, nằm gọn trong 1 tin, phí 20 ₫.",
      "Nội dung được rút gọn còn 28 ký tự, phí 0 ₫.",
      "Nội dung có thêm tiêu đề, chia thành 2 tin, phí 1.000 ₫.",
    ],
    answer: 0,
    why: "<code>SmsSender</code> bỏ dấu cho vừa tin nhắn, và nội dung đủ ngắn để nằm trong một tin 160 ký tự, nên phí là 500 ₫. Rút gọn còn 28 ký tự là cách của kênh Push, còn thêm tiêu đề là cách của Email.",
  },
  {
    q: "Khi nào một hàm factory dùng bảng tra như <code>sender_for</code> hợp lý hơn cả một cây lớp con?",
    options: [
      "Khi quy trình gửi có nhiều bước phức tạp cần giữ chung ở lớp cha.",
      "Khi mỗi kênh còn phải ghi đè thêm vài bước khác ngoài bước tạo.",
      "Khi không có quy trình chung nào đáng giữ ở lớp cha, và việc chọn lớp chỉ dựa vào tên kênh.",
    ],
    answer: 2,
    why: "Nếu lớp cha không có quy trình nào để dùng lại, các lớp con chỉ tồn tại để chọn constructor, và một bảng tra làm việc đó gọn hơn nhiều. Factory Method thật sự đáng dùng khi có một quy trình chung cần giữ nguyên.",
  },
  {
    q: "Factory Method khác Strategy ở điểm nào?",
    options: [
      "Strategy chỉ dùng để tạo đối tượng, còn Factory Method dùng để đổi thuật toán.",
      "Với Factory Method, lớp con tự tạo đối tượng bên trong, còn với Strategy, đối tượng được truyền vào từ bên ngoài và đổi được ngay lúc chạy.",
      "Hai pattern giống hệt nhau, chỉ khác tên gọi.",
      "Factory Method cần interface, còn Strategy thì không.",
    ],
    answer: 1,
    why: "Cả hai đều đổi hành vi bằng cách đổi đối tượng. Điểm khác là ai chọn và chọn lúc nào, vì Strategy để bên ngoài truyền vào lúc chạy, còn Factory Method để lớp con quyết định ngay khi viết code.",
  },
  {
    q: "Lớp cha <code>Notifier</code> phải kiểm tra <code>isinstance</code> trên đối tượng mà <code>create_sender()</code> trả về. Điều đó cho thấy gì?",
    options: [
      "Interface <code>Sender</code> đang thiếu một thứ lớp cha cần, nên lớp cha phải dò xem mình đang cầm lớp cụ thể nào.",
      "Đó là cách dùng đúng, vì lớp cha cần biết lớp cụ thể mới gửi được.",
      "Lớp con đã quên ghi đè <code>create_sender()</code>.",
    ],
    answer: 0,
    why: "Factory method nên trả về interface, và lớp cha chỉ nên dùng những gì interface ấy hứa. Khi phải kiểm tra lớp cụ thể, đó là dấu hiệu nên bổ sung phương thức còn thiếu vào <code>Sender</code>.",
  },
];
