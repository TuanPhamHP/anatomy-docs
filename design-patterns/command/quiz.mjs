// "Kiểm tra nhanh" at the end of the Command lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Trang quản trị cho phép nhân viên đổi giá hàng loạt. Quản lý muốn có nút hoàn tác, kèm một nhật ký ghi lại ai đã làm gì. Cách nào hợp nhất?",
    options: [
      "Gọi thẳng hàm đổi giá trong handler, rồi in thêm một dòng log.",
      "Lưu một bản sao toàn bộ bảng giá trước mỗi lần đổi.",
      "Gói mỗi lần đổi giá thành một lệnh có <code>execute()</code> và <code>undo()</code>, rồi để một Invoker chạy lệnh và giữ lịch sử.",
      "Thêm một cờ cho mỗi sản phẩm để biết giá đã từng bị đổi.",
    ],
    answer: 2,
    why: "Khi mỗi lần đổi giá là một đối tượng lệnh, Invoker ghi lịch sử và hoàn tác theo cùng một cách cho mọi thao tác, và lịch sử đó cũng chính là nhật ký. Chụp lại cả bảng giá cũng hoàn tác được nhưng tốn bộ nhớ và không cho biết đã làm gì, đó là cách của Memento.",
  },
  {
    q: "Trong ví dụ kho hàng, lớp nào đóng vai Invoker?",
    options: ["<code>CommandRunner</code>", "<code>Inventory</code>", "<code>ShipStock</code>", "<code>Command</code>"],
    answer: 0,
    why: "<code>CommandRunner</code> giữ hàng đợi và lịch sử, lấy lệnh ra chạy và gọi <code>undo()</code> khi cần, nhưng không biết bên trong lệnh làm gì. <code>Inventory</code> là Receiver chịu tác động của lệnh, còn <code>ShipStock</code> là một lệnh cụ thể.",
  },
  {
    q: "Tồn kho ban đầu là 100. Máy lần lượt chạy Nhập 50, Xuất 20, Xuất 15, rồi bấm Hoàn tác một lần. Tồn kho cuối cùng là bao nhiêu, và lịch sử còn những lệnh nào?",
    options: [
      "115, lịch sử vẫn còn đủ ba lệnh.",
      "100, lịch sử trống.",
      "150, lịch sử chỉ còn Nhập 50.",
      "130, lịch sử còn Nhập 50 và Xuất 20.",
    ],
    answer: 3,
    why: "Sau ba lệnh, tồn kho là 115. Hoàn tác lấy lệnh trên cùng của lịch sử là Xuất 15 rồi gọi <code>undo()</code>, nên 15 hàng được nhập lại và tồn kho thành 130, còn Nhập 50 và Xuất 20 vẫn nằm trong lịch sử.",
  },
  {
    q: "Lệnh gửi email xác nhận cho khách đã chạy xong. Nên viết <code>undo()</code> cho lệnh này thế nào?",
    options: [
      "Cho <code>undo()</code> xoá email khỏi hộp thư của khách.",
      "Đừng giả vờ hoàn tác được. Nếu cần, hãy tạo một lệnh bù riêng, chẳng hạn gửi email đính chính.",
      "Để <code>undo()</code> trống và coi như đã hoàn tác.",
      "Cho <code>undo()</code> gọi lại <code>execute()</code> thêm một lần.",
    ],
    answer: 1,
    why: "Email đã gửi thì không lấy lại được, nên một <code>undo()</code> trống chỉ tạo cảm giác an toàn giả. Với thao tác không đảo ngược được, cách đúng là thiết kế một lệnh bù riêng và ghi nó vào lịch sử như mọi lệnh khác.",
  },
  {
    q: "Command và Memento đều giúp hoàn tác. Chúng khác nhau ở chỗ nào?",
    options: [
      "Memento chỉ dùng cho giao diện, còn Command chỉ dùng cho backend.",
      "Command phải lưu toàn bộ trạng thái trước mỗi lệnh, còn Memento thì không cần.",
      "Command hoàn tác bằng phép tính ngược, như xuất 15 thì nhập lại 15, còn Memento khôi phục một bản chụp trạng thái.",
    ],
    answer: 2,
    why: "Lệnh trong bài tự biết cách đảo ngược chính nó nên không cần chụp lại cả kho. Chỉ khi phép tính ngược khó viết, người ta mới kết hợp thêm Memento để chụp trạng thái trước khi chạy lệnh.",
  },
  {
    q: "Trong job queue, một job trừ kho bị chạy lại lần thứ hai vì worker khởi động lại. Điều gì giúp kho không bị trừ hai lần?",
    options: [
      "Cất lệnh vào lịch sử trước khi gọi <code>execute()</code>.",
      "Lưu mỗi lệnh kèm một id và bỏ qua lệnh có id đã chạy, tức là làm cho lệnh idempotent.",
      "Tăng số worker để job chạy xong nhanh hơn.",
      "Tự gọi <code>undo()</code> ngay sau mỗi lần <code>execute()</code>.",
    ],
    answer: 1,
    why: "Nhờ có id, worker biết lệnh nào đã chạy và bỏ qua lần thử lại, nên chạy bao nhiêu lần thì kết quả vẫn như chạy một lần. Cất lệnh vào lịch sử trước khi chạy còn gây hại thêm, vì lệnh lỗi cũng sẽ để lại dấu vết trong lịch sử.",
  },
];
