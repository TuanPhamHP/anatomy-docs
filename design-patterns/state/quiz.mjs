// "Kiểm tra nhanh" at the end of the State lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Đơn hàng của bạn đi qua các trạng thái mới tạo, đã thanh toán, đang giao, đã giao và đã huỷ. Các hàm huỷ đơn, hoàn tiền và giao hàng đều mở đầu bằng một chuỗi if/elif dài hỏi đơn đang ở đâu. Pattern nào giúp gom luật của từng trạng thái về một chỗ?",
    options: ["Strategy", "State", "Observer", "Singleton"],
    answer: 1,
    why: "State biến mỗi trạng thái thành một lớp giữ trọn luật của nó, nên muốn biết đơn đang giao làm được gì, bạn chỉ cần đọc một lớp. Strategy có cấu trúc giống vậy nhưng dùng khi code bên ngoài chọn cách làm, chứ không phải khi đối tượng tự đi qua từng chặng.",
  },
  {
    q: "Trong ví dụ, lớp nào đóng vai Context?",
    options: ["<code>State</code>", "<code>Pending</code>", "<code>ActionRefused</code>", "<code>PurchaseRequest</code>"],
    answer: 3,
    why: "<code>PurchaseRequest</code> giữ đối tượng trạng thái hiện tại và chuyển mọi thao tác cho nó. <code>State</code> là interface chung, còn <code>Pending</code> là một trạng thái cụ thể.",
  },
  {
    q: "Hồ sơ đang ở trạng thái Đã duyệt, và người dùng bấm gửi duyệt thêm một lần nữa. Chuyện gì xảy ra?",
    options: [
      "Lớp <code>Approved</code> chặn thao tác với lý do hồ sơ đã duyệt, không đổi được nữa, và trạng thái vẫn là Đã duyệt.",
      "Hồ sơ quay về Chờ duyệt để được duyệt lại.",
      "Hồ sơ chuyển sang Bị từ chối.",
      "<code>PurchaseRequest</code> tự kiểm tra bằng một câu if rồi lặng lẽ bỏ qua thao tác.",
    ],
    answer: 0,
    why: "<code>Approved</code> không viết lại thao tác nào, nên mọi thao tác rơi vào hành vi mặc định là chặn kèm lý do của trạng thái này. Trong hình, phím chạm vào mặt trống của trống và trống không quay, còn Context không hề có câu if nào.",
  },
  {
    q: "Bạn cần thêm trạng thái Đã huỷ, cho phép huỷ khi hồ sơ đang là Nháp hoặc Chờ duyệt. Với cách viết theo State, bạn phải làm gì?",
    options: [
      "Thêm một nhánh mới vào từng phương thức của <code>PurchaseRequest</code>.",
      "Chỉ cần thêm một giá trị vào cột trạng thái trong cơ sở dữ liệu.",
      "Thêm lớp <code>Cancelled</code>, thêm thao tác huỷ vào interface với mặc định là chặn, rồi viết lại thao tác đó trong <code>Draft</code> và <code>Pending</code>.",
      "Viết lại cả bốn lớp trạng thái đang có.",
    ],
    answer: 2,
    why: "Thêm trạng thái mới chỉ chạm tới đúng những trạng thái liên quan. Các trạng thái còn lại tự động chặn thao tác huỷ nhờ hành vi mặc định trong interface, và <code>PurchaseRequest</code> chỉ cần thêm một phương thức chuyển thao tác đi.",
  },
  {
    q: "State và Strategy có cấu trúc gần như giống nhau. Điểm khác chính giữa hai pattern là gì?",
    options: [
      "State chỉ dùng được khi có cơ sở dữ liệu, còn Strategy thì không cần.",
      "Với State, chính trạng thái hiện tại quyết định chuyển sang trạng thái kế, còn với Strategy, code bên ngoài chọn cách làm.",
      "Strategy giữ nhiều đối tượng cùng lúc, còn State chỉ giữ một.",
    ],
    answer: 1,
    why: "Trong ví dụ, <code>Pending.approve()</code> tự gán <code>request.state = Approved()</code>, nên đối tượng tự chuyển chặng. Với Strategy, người dùng hay trang thanh toán mới là bên chọn cách tính, và cách tính không tự đổi sang cách khác.",
  },
  {
    q: "Khi nào một cột enum đơn giản là đủ, không cần đến State?",
    options: [
      "Khi các trạng thái chỉ khác nhau ở cái nhãn và không có hành vi riêng.",
      "Khi mỗi trạng thái có luật kiểm tra quyền riêng.",
      "Khi nhiều hàm cùng rẽ nhánh theo trạng thái và các nhánh ngày càng dài.",
      "Khi đối tượng có vòng đời rõ ràng qua nhiều chặng.",
    ],
    answer: 0,
    why: "Nếu trạng thái không kéo theo hành vi khác nhau thì đó chỉ là dữ liệu, và tạo một lớp cho mỗi nhãn chỉ làm code dài thêm. Ba trường hợp còn lại chính là lúc State phát huy tác dụng.",
  },
];
