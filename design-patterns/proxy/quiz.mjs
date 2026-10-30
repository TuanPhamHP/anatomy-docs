// "Kiểm tra nhanh" at the end of the Proxy lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Trang chi tiết sản phẩm có một mô hình 3D rất nặng, nhưng phần lớn khách không bao giờ bấm xem. Kiểu proxy nào phù hợp nhất?",
    options: [
      "Remote proxy, vì mô hình nằm trên máy chủ.",
      "Protection proxy, vì cần kiểm tra ai được xem.",
      "Virtual proxy, chỉ tải mô hình thật khi khách bấm xem lần đầu.",
      "Caching proxy, tải sẵn mô hình cho mọi khách.",
    ],
    answer: 2,
    why: "Virtual proxy hoãn việc tạo đối tượng tốn kém cho tới khi thật sự cần, nên khách không bấm xem thì mô hình không bao giờ được tải. Tải sẵn cho mọi khách lại chính là điều ta muốn tránh.",
  },
  {
    q: "Với <code>ReportProxy</code>, ba lượt đọc gồm khách, kế toán và kế toán đọc lại tốn tổng cộng bao nhiêu thời gian tải?",
    options: [
      "2,4 giây, vì báo cáo chỉ được tải một lần ở lượt đọc hợp lệ đầu tiên.",
      "7,2 giây, vì lượt đọc nào cũng tải lại báo cáo.",
      "4,8 giây, vì khách bị chặn nhưng hai lượt của kế toán đều tải.",
      "0 giây, vì proxy đã tải sẵn báo cáo từ trước.",
    ],
    answer: 0,
    why: "Proxy chặn khách trước khi tạo báo cáo, tải báo cáo đúng một lần ở lượt đầu của kế toán, rồi trả lại bản đang giữ ở lượt sau. Con số 7,2 giây là của cách làm cũ, khi lượt nào cũng tải lại.",
  },
  {
    q: "Trong ví dụ, lớp nào là RealSubject?",
    options: ["<code>Report</code>", "<code>ReportProxy</code>", "<code>show()</code>", "<code>AnnualReport</code>"],
    answer: 3,
    why: "<code>AnnualReport</code> là báo cáo thật, nơi việc tải 1.240 trang thực sự diễn ra. <code>Report</code> là interface chung, <code>ReportProxy</code> đứng thay cho báo cáo thật, còn <code>show()</code> là Client.",
  },
  {
    q: "Trong bản chưa có Proxy, vì sao lượt đọc của khách vẫn tốn 2,4 giây dù bị từ chối?",
    options: [
      "Vì bước kiểm tra quyền chạy rất chậm.",
      "Vì báo cáo được tạo trước, sau đó mới kiểm tra quyền.",
      "Vì khách vẫn đọc được một phần báo cáo.",
      "Vì kho lưu trữ luôn mở mỗi khi có người hỏi.",
    ],
    answer: 1,
    why: "Cách làm cũ tạo báo cáo ngay khi có lượt đọc, nên chi phí tải đã phải trả trước khi biết người đọc có quyền hay không. Proxy đảo lại thứ tự này, kiểm quyền trước rồi mới tạo báo cáo.",
  },
  {
    q: "Khi nào không nên thêm một proxy để kiểm quyền?",
    options: [
      "Khi API gateway đã kiểm quyền cho mọi đường đi vào đối tượng đó.",
      "Khi đối tượng thật tốn kém và có nhiều vai trò cùng dùng.",
      "Khi nhiều màn hình và job cùng đọc một báo cáo nhạy cảm.",
    ],
    answer: 0,
    why: "Nếu mọi đường vào đều đã đi qua một tầng kiểm quyền chung, kiểm thêm ở proxy chỉ là lặp lại. Hai trường hợp còn lại lại chính là lúc một proxy kiểm quyền có ích nhất.",
  },
  {
    q: "Proxy và Decorator đều giữ nguyên interface. Điều gì cho thấy <code>ReportProxy</code> là một proxy chứ không phải decorator?",
    options: [
      "Nó có phương thức <code>read(user)</code> giống báo cáo thật.",
      "Nó được client tự lắp chồng nhiều lớp lên nhau.",
      "Nó tự quyết định khi nào tạo báo cáo thật và có cho lời gọi đi tiếp hay không.",
      "Nó đổi kết quả trả về sang một kiểu dữ liệu khác.",
    ],
    answer: 2,
    why: "Proxy kiểm soát việc truy cập và thường tự quản lý vòng đời của đối tượng thật, như <code>ReportProxy</code> tự tạo báo cáo ở lượt hợp lệ đầu tiên. Decorator thì do client lắp từ bên ngoài để cộng thêm hành vi, còn đổi kiểu dữ liệu là việc của Adapter.",
  },
];
