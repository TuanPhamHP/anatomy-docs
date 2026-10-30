// "Kiểm tra nhanh" at the end of the Strategy lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Một ứng dụng đặt xe tính cước theo nhiều cách, tuỳ giờ cao điểm, loại xe hay chương trình khuyến mãi đang chạy, và cách tính được chọn ngay lúc đặt. Cách tổ chức code nào hợp nhất?",
    options: [
      "Viết một hàm lớn với chuỗi <code>if</code>/<code>elif</code> theo tên cách tính.",
      "Mỗi cách tính là một lớp riêng dùng chung một interface, còn nơi tính cước chỉ giữ một đối tượng trong số đó.",
      "Sao chép hàm tính cước thành nhiều bản, mỗi loại xe một bản.",
      "Lưu công thức thành chuỗi trong cơ sở dữ liệu rồi dịch ra code khi chạy.",
    ],
    answer: 1,
    why: "Đây đúng là tình huống của Strategy, vì có nhiều cách làm cùng một việc và cách nào được dùng thì chọn lúc chạy. Chuỗi <code>if</code>/<code>elif</code> chạy được lúc đầu, nhưng mỗi cách tính mới lại phải sửa hàm lõi và các nhánh dễ làm hỏng nhau.",
  },
  {
    q: "Trong ví dụ phí giao hàng, lớp nào đóng vai Context?",
    options: ["<code>ShippingStrategy</code>", "<code>WeightFee</code>", "<code>Checkout</code>", "<code>Order</code>"],
    answer: 2,
    why: "<code>Checkout</code> giữ một strategy, gọi <code>quote</code> qua interface và cho phép thay strategy bằng <code>set_strategy</code>, nên nó là Context. <code>ShippingStrategy</code> là interface chung, <code>WeightFee</code> là một Concrete Strategy, còn <code>Order</code> chỉ là dữ liệu được truyền vào.",
  },
  {
    q: "Đơn mẫu nặng 3,5 kg. Theo quy tắc của <code>WeightFee</code>, kg đầu 15.000 ₫, mỗi kg sau thêm 5.000 ₫ và phần lẻ làm tròn lên. Phí giao hàng là bao nhiêu?",
    options: ["30.000 ₫", "27.500 ₫", "32.500 ₫", "25.000 ₫"],
    answer: 0,
    why: "Sau kg đầu còn 2,5 kg, làm tròn lên thành 3 kg, nên phí là 15.000 ₫ cộng 15.000 ₫, tức 30.000 ₫. Con số 27.500 ₫ là kết quả khi quên làm tròn phần lẻ, còn 25.000 ₫ là phí theo khoảng cách.",
  },
  {
    q: "Trong hình, khi đổi từ cam tính theo cân nặng sang cam tính theo khoảng cách, phần nào của máy thay đổi?",
    options: [
      "Cả trục, cần đọc và đồng hồ đều được thay bằng một bộ mới.",
      "Cần đọc được chỉnh lại độ cao cho hợp với cam mới.",
      "Chỉ có cam trên trục được thay, còn trục có then, cần đọc và đồng hồ vẫn giữ nguyên.",
    ],
    answer: 2,
    why: "Cam là strategy, còn trục, cần đọc và đồng hồ là Context. Cam nào cũng có cùng lỗ trục và rãnh then, nên lắp cam nào máy cũng đọc được mà không phải chỉnh gì, cũng như <code>Checkout</code> không đổi khi ta thay strategy.",
  },
  {
    q: "Trường hợp nào không nên tạo thêm một lớp strategy mới?",
    options: [
      "Cửa hàng có thêm chương trình miễn phí giao hàng cho thành viên.",
      "Cần tính thêm phí theo thể tích kiện hàng.",
      "Muốn tách riêng quy tắc theo khoảng cách để test ở mốc 15 km.",
      "Phí đồng giá cho đơn dưới ngưỡng đổi từ 20.000 ₫ thành 25.000 ₫.",
    ],
    answer: 3,
    why: "Khi chỉ một con số thay đổi, hãy đưa con số đó vào cấu hình hoặc tham số của strategy đang có. Một lớp mới chỉ đáng viết khi cách tính thật sự khác, như tính theo thể tích hay theo hạng thành viên.",
  },
  {
    q: "Strategy và State có cấu trúc gần giống nhau. Điểm khác nhau chính là gì?",
    options: [
      "Strategy do bên ngoài chọn và các strategy không biết nhau, còn các state tự chuyển sang state kế tiếp khi có sự kiện.",
      "Strategy dùng kế thừa, còn State dùng interface.",
      "Strategy chỉ được có một phương thức, còn State phải có nhiều phương thức.",
    ],
    answer: 0,
    why: "Cả hai đều để một đối tượng giữ một đối tượng khác và gọi qua interface. Khác biệt nằm ở chỗ ai đổi nó: với Strategy là code bên ngoài, còn với State là chính trạng thái hiện tại quyết định trạng thái tiếp theo.",
  },
];
