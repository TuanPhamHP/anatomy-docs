// "Kiểm tra nhanh" at the end of the Mediator lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Màn hình đặt vé có bốn ô là nơi đi, nơi đến, ngày bay và hạng ghế. Đổi nơi đi thì danh sách nơi đến phải lọc lại, đổi ngày thì số ghế còn trống phải tính lại, và những quy tắc kiểu này còn tăng thêm. Cách tổ chức nào gọn nhất?",
    options: [
      "Cho mỗi ô giữ tham chiếu tới các ô khác và tự cập nhật chúng.",
      "Cho các ô báo thay đổi cho một đối tượng màn hình, và đối tượng ấy quyết định cập nhật ô nào.",
      "Gộp cả bốn ô vào một lớp lớn duy nhất.",
      "Cho mỗi ô kế thừa từ ô đứng trước nó.",
    ],
    answer: 1,
    why: "Đối tượng màn hình đóng vai mediator và giữ mọi quy tắc phối hợp, còn từng ô chỉ báo rằng mình vừa đổi. Nếu để các ô tự gọi nhau, mỗi quy tắc mới lại thêm một sợi dây nối thẳng giữa hai ô.",
  },
  {
    q: "Bốn bộ phận nối thẳng với nhau cần sáu dây. Thêm bộ phận thứ năm thì nối thẳng cần bao nhiêu dây, còn qua tổng đài cần bao nhiêu?",
    options: [
      "7 dây nếu nối thẳng, 5 dây qua tổng đài.",
      "8 dây nếu nối thẳng, 4 dây qua tổng đài.",
      "10 dây nếu nối thẳng, 6 dây qua tổng đài.",
      "10 dây nếu nối thẳng, 5 dây qua tổng đài.",
    ],
    answer: 3,
    why: "Nối thẳng thì mỗi cặp bộ phận cần một dây, và năm bộ phận tạo thành mười cặp. Qua tổng đài, mỗi bộ phận chỉ cần một dây của riêng nó, nên tổng cộng là năm dây.",
  },
  {
    q: "Ở bước Thanh toán lỗi, vì sao Giao hàng không bị gọi?",
    options: [
      "Vì quy tắc trong mediator chỉ gọi Kho và CSKH khi thẻ bị từ chối, do đơn chưa có chuyến giao nào.",
      "Vì Thanh toán không giữ tham chiếu tới Giao hàng.",
      "Vì Giao hàng chưa đăng ký nghe sự kiện thanh toán.",
      "Vì tổng đài chỉ gọi được tối đa hai bộ phận một lúc.",
    ],
    answer: 0,
    why: "Ai được gọi là do quy tắc trong <code>OrderMediator</code> quyết định, không phụ thuộc vào việc Thanh toán biết những ai. Đơn DH-3108 chưa có chuyến giao nào nên quy tắc không gọi Giao hàng, còn ý đăng ký nghe sự kiện là cách nghĩ của Observer.",
  },
  {
    q: "Trong bản code dùng Mediator, lớp <code>Inventory</code> giữ tham chiếu tới những ai?",
    options: [
      "Tới <code>Payments</code>, <code>Shipping</code> và <code>CustomerCare</code>.",
      "Không tới ai cả, nó dùng biến toàn cục.",
      "Chỉ tới <code>OrderMediator</code>.",
      "Tới mọi bộ phận đã đăng ký với mediator.",
    ],
    answer: 2,
    why: "Sau khi có Mediator, mỗi bộ phận chỉ giữ đúng một tham chiếu, tới mediator, và gọi <code>notify</code> khi có chuyện. Lựa chọn đầu tiên mô tả bản code trước khi có Mediator.",
  },
  {
    q: "Dấu hiệu nào cho thấy mediator đang bị dùng sai?",
    options: [
      "Mỗi bộ phận chỉ giữ một tham chiếu tới mediator.",
      "Mediator tự tính số tiền hoàn, tự trừ tồn kho và tự soạn nội dung email.",
      "Mediator có một phương thức <code>notify</code> nhận tên sự kiện.",
      "Thêm một bộ phận mới chỉ cần sửa quy tắc trong mediator.",
    ],
    answer: 1,
    why: "Mediator chỉ nên điều phối, nghĩa là quyết định ai làm gì và theo thứ tự nào. Khi nó ôm luôn việc cụ thể của từng bộ phận, nó phình thành một god object mà mọi thay đổi đều phải đi qua.",
  },
  {
    q: "Điểm khác nhau chính giữa Mediator và Observer là gì?",
    options: [
      "Mediator giữ quy tắc ai phải phản ứng với tin nào, còn với Observer người phát tin không biết và không quyết định ai nghe.",
      "Observer chỉ dùng trong giao diện, còn Mediator chỉ dùng ở backend.",
      "Mediator luôn chạy bất đồng bộ, còn Observer luôn chạy đồng bộ.",
    ],
    answer: 0,
    why: "Cả hai đều giảm việc các đối tượng gọi thẳng vào nhau. Khác biệt nằm ở chỗ đặt logic điều phối, vì Mediator gom nó về một chỗ, còn Observer để mỗi listener tự quyết phản ứng của mình.",
  },
];
