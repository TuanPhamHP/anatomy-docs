// "Kiểm tra nhanh" at the end of the Bridge lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Một hệ thống xuất ba loại báo cáo là doanh thu, tồn kho và công nợ, và loại nào cũng xuất được ra PDF, Excel hay CSV. Thiết kế nào giữ số lớp ít nhất khi sau này có thêm định dạng mới?",
    options: [
      "Mỗi tổ hợp báo cáo và định dạng là một lớp con, tổng cộng chín lớp.",
      "Một lớp báo cáo duy nhất với một khối if/else rẽ theo định dạng.",
      "Tách báo cáo và định dạng thành hai cây lớp, mỗi báo cáo giữ một tham chiếu tới định dạng.",
      "Viết ba adapter để đổi từng định dạng về một định dạng chung.",
    ],
    answer: 2,
    why: "Báo cáo và định dạng là hai hướng thay đổi độc lập, nên tách chúng thành hai cây lớp nối qua một interface chính là việc của Bridge. Khi đó thêm một định dạng chỉ là thêm một lớp, còn khối if/else thì phình ra mỗi lần có định dạng mới.",
  },
  {
    q: "Ứng dụng đang có ba loại tin và bốn kênh. Nếu thêm loại tin thứ tư, cách viết mỗi tổ hợp một lớp và cách dùng Bridge lần lượt cần bao nhiêu lớp?",
    options: ["16 lớp và 8 lớp.", "16 lớp và 7 lớp.", "12 lớp và 8 lớp.", "13 lớp và 8 lớp."],
    answer: 0,
    why: "Viết theo tổ hợp thì số lớp là tích, bốn loại nhân bốn kênh thành 16. Với Bridge thì số lớp là tổng, bốn loại cộng bốn kênh thành 8. Con số 7 là của lúc mới có ba loại tin.",
  },
  {
    q: "Trong ví dụ, đâu là cây cầu nối phía loại tin với phía kênh gửi?",
    options: [
      "Lớp <code>Alert</code>.",
      "Phương thức <code>text()</code> của <code>Promotion</code>.",
      "Danh sách các kênh được tạo trong phần chạy thử.",
      "Tham chiếu <code>self.channel</code> mà <code>Notification</code> giữ, cùng phương thức <code>deliver(title, text)</code>.",
    ],
    answer: 3,
    why: "<code>Notification</code> không biết kênh cụ thể nào, nó chỉ giữ một <code>Channel</code> và gọi <code>deliver</code>. Chính tham chiếu đó, cùng interface mà lời gọi đi qua, nối hai phía lại với nhau.",
  },
  {
    q: "Ở bước cuối của hình, khối Chat được trượt vào chỗ trống trên bàn phía trước. Thứ gì không phải thay đổi?",
    options: [
      "Con số trên bộ đếm của cách dùng Bridge.",
      "Ba đầu tin trên bàn phía sau, tức ba lớp <code>Alert</code>, <code>Reminder</code> và <code>Promotion</code>.",
      "Số khối đang nằm trên bàn trượt phía trước.",
    ],
    answer: 1,
    why: "Thêm một kênh chỉ thêm một khối ở phía kênh, còn ba đầu tin giữ nguyên nên không lớp loại tin nào phải sửa. Trong lúc đó bộ đếm Bridge tăng từ 6 lên 7.",
  },
  {
    q: "Trường hợp nào Bridge chỉ làm code phức tạp thêm?",
    options: [
      "Có nhiều loại báo cáo và nhiều định dạng xuất.",
      "Bạn muốn đổi kênh gửi ngay lúc chạy khi kênh chính bị lỗi.",
      "Chỉ có một loại tin và một kênh, và không có kế hoạch thêm.",
      "Hai nhóm khác nhau phát triển nội dung tin và hạ tầng gửi tin.",
    ],
    answer: 2,
    why: "Bridge đáng giá khi có hai hướng thay đổi thật sự. Với một loại tin và một kênh cố định, interface ở giữa chỉ là một tầng gián tiếp không mang lại lợi ích gì.",
  },
  {
    q: "Bridge khác Adapter ở điểm nào?",
    options: [
      "Bridge được thiết kế từ đầu để hai phía phát triển độc lập, còn Adapter thường được thêm vào sau để nối hai thứ có sẵn nhưng không khớp nhau.",
      "Bridge chỉ dùng được với kế thừa, còn Adapter chỉ dùng được với composition.",
      "Adapter tách một lớp thành hai cây lớp, còn Bridge đổi interface của một lớp có sẵn.",
    ],
    answer: 0,
    why: "Cả hai đều đặt một interface ở giữa, nhưng mục đích khác nhau. Adapter chữa chỗ không khớp giữa hai thứ đã tồn tại, còn Bridge là quyết định thiết kế ngay từ đầu để hai phía tự lớn lên.",
  },
];
