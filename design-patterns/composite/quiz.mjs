// "Kiểm tra nhanh" at the end of the Composite lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Trường hợp nào dưới đây hợp với Composite nhất?",
    options: [
      "Một trang cấu hình có đúng mười ô nhập, không ô nào lồng trong ô nào.",
      "Gửi cùng một thông báo tới nhiều kênh khi đơn hàng được đặt.",
      "Bộ lọc tìm kiếm cho phép lồng các nhóm điều kiện AND, OR vào nhau nhiều tầng.",
      "Đổi dữ liệu từ một API bên ngoài cho khớp với interface của hệ thống.",
    ],
    answer: 2,
    why: "Bộ lọc lồng nhau là một cây mà người dùng tự quyết độ sâu, và mỗi nhóm hay mỗi điều kiện lẻ đều cần được đánh giá theo cùng một cách. Gửi tới nhiều kênh là việc của Observer, còn đổi dữ liệu cho khớp interface là việc của Adapter.",
  },
  {
    q: "Hộp nhỏ gồm vỏ hộp 0,3 kg, bình giữ nhiệt 0,6 kg và hộp trà 0,5 kg. Gọi <code>weight()</code> trên hộp này sẽ trả về bao nhiêu?",
    options: [
      "1,4 kg, vì hộp cộng vỏ của chính nó với <code>weight()</code> của từng món bên trong.",
      "1,1 kg, vì vỏ hộp không được tính vào.",
      "0,3 kg, vì hộp chỉ biết khối lượng của chính nó.",
    ],
    answer: 0,
    why: "Hộp là Composite nên nó góp phần vỏ 0,3 kg của mình, rồi cộng thêm 0,6 kg và 0,5 kg của hai món con. Tổng là 1,4 kg, đúng như con số cân hiện trên hình.",
  },
  {
    q: "Trong bản code trước khi có Composite, vì sao thùng lớn chỉ cân ra 3,6 kg thay vì 5,0 kg?",
    options: [
      "Vì hàm cân làm tròn khối lượng xuống.",
      "Vì cuốn sách trong thùng bị đếm thiếu.",
      "Vì vỏ thùng không được cộng vào tổng.",
      "Vì hộp nhỏ bên trong không có trường <code>grams</code> nên bị cộng như 0, mà không có lỗi nào được báo.",
    ],
    answer: 3,
    why: "Hàm cũ được viết từ hồi hộp chỉ đựng món hàng, nên nó đọc trường <code>grams</code> của mọi thứ bên trong. Hộp nhỏ không có trường đó và bị tính là 0, làm thùng hụt đúng 1,4 kg trong khi chương trình vẫn chạy bình thường.",
  },
  {
    q: "Trong code của bài, lớp nào đóng vai Composite?",
    options: ["<code>Item</code>", "<code>Box</code>", "<code>Parcel</code>", "Hàm <code>weigh()</code>"],
    answer: 1,
    why: "<code>Box</code> giữ danh sách con và tự cộng kết quả của chúng, nên nó là Composite. <code>Parcel</code> là interface chung, tức Component, <code>Item</code> là lá, còn <code>weigh()</code> là Client chỉ việc gọi <code>weight()</code>.",
  },
  {
    q: "Vì sao phương thức <code>add()</code> chỉ nằm ở <code>Box</code> mà không được đưa lên interface chung <code>Parcel</code>?",
    options: [
      "Vì Python không cho khai báo <code>add()</code> trong một Protocol.",
      "Vì <code>add()</code> chạy chậm khi cây quá sâu.",
      "Vì thêm con chỉ có nghĩa với hộp, và nhờ vậy không ai vô tình thêm con vào một món hàng.",
    ],
    answer: 2,
    why: "Interface chung chỉ nên giữ những thao tác có nghĩa với cả lá lẫn nhóm, như <code>weight()</code> và <code>lines()</code>. Nếu đưa <code>add()</code> lên đó, món hàng sẽ phải có một phương thức chỉ để báo rằng nó không hỗ trợ.",
  },
  {
    q: "Composite khác Decorator ở điểm nào?",
    options: [
      "Composite chứa nhiều con và gộp kết quả của chúng, còn Decorator bọc đúng một đối tượng để thêm hành vi.",
      "Composite đổi interface của đối tượng, còn Decorator giữ nguyên interface.",
      "Decorator chỉ dùng được với cấu trúc cây, còn Composite dùng được với mọi đối tượng.",
    ],
    answer: 0,
    why: "Cả hai đều dùng chung interface với thứ chúng chứa, nên rất dễ nhầm. Composite gom nhiều con thành một cây và cộng kết quả lại, còn Decorator chỉ bọc một đối tượng để thêm việc như cache hay log.",
  },
];
