// "Kiểm tra nhanh" at the end of the Iterator lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Ứng dụng của bạn cần xử lý một file log 20 GB, mỗi dòng là một sự kiện, trên một máy chỉ có 2 GB RAM. Cách nào hợp lý nhất?",
    options: [
      "Đọc cả file vào một list rồi duyệt list đó.",
      "Chia file thành mười phần bằng tay rồi chạy lần lượt từng phần.",
      "Dùng một iterator đọc từng dòng khi cần, nên trong bộ nhớ chỉ có dòng đang xử lý.",
      "Nâng RAM của máy cho đủ chứa cả file.",
    ],
    answer: 2,
    why: "Iterator chỉ lấy phần tử kế tiếp khi vòng lặp cần, nên bộ nhớ dùng không phụ thuộc vào kích thước file. Đọc hết vào một list thì cần ít nhất 20 GB, còn chia tay hay nâng RAM chỉ là chữa cháy.",
  },
  {
    q: "Ở bước “Sang trang 2”, khi trả về DH-005 thì iterator đã gọi API bao nhiêu lần?",
    options: [
      "Hai lần, vì trang 2 chỉ được lấy khi bốn đơn của trang 1 đã dùng hết.",
      "Một lần, vì API trả hết mười đơn ngay từ lần gọi đầu.",
      "Ba lần, vì iterator tải sẵn mọi trang khi vòng lặp bắt đầu.",
      "Năm lần, vì mỗi lần gọi <code>next()</code> là một lần gọi API.",
    ],
    answer: 0,
    why: "Iterator gọi API một lần cho trang 1, rồi chỉ gọi lần thứ hai khi đơn thứ năm được xin, lúc ấy trang 3 vẫn chưa được tải. Nó cũng không gọi API ở mỗi lần <code>next()</code>, vì bốn đơn của một trang được trả từ chính trang đang cầm.",
  },
  {
    q: "Trong code ví dụ, lớp nào đóng vai Aggregate?",
    options: ["<code>OrderIterator</code>", "<code>Order</code>", "<code>OrderApi</code>", "<code>OrderList</code>"],
    answer: 3,
    why: "<code>OrderList</code> là tập đơn hàng mà vòng lặp duyệt qua, và mỗi lần <code>__iter__</code> được gọi nó tạo một <code>OrderIterator</code> mới. <code>OrderIterator</code> là Iterator, <code>Order</code> là phần tử, còn <code>OrderApi</code> chỉ là nguồn dữ liệu nằm phía sau.",
  },
  {
    q: "Bạn sửa <code>OrderList</code> để <code>__iter__</code> luôn trả về cùng một iterator, tạo sẵn trong constructor. Chuyện gì sẽ xảy ra khi duyệt nó hai lần?",
    options: [
      "Không có gì khác, vì Python luôn tự tạo iterator mới cho mỗi vòng for.",
      "Vòng lặp thứ hai đi tiếp từ chỗ vòng đầu dừng, hoặc không nhận được đơn nào nếu vòng đầu đã đọc hết.",
      "Chương trình báo lỗi ngay khi tạo <code>OrderList</code>.",
      "API bị gọi gấp đôi số lần so với trước.",
    ],
    answer: 1,
    why: "Iterator giữ vị trí hiện tại. Nếu mọi vòng lặp dùng chung một iterator, vòng sau sẽ đi tiếp từ chỗ vòng trước bỏ dở, và một iterator đã cạn thì không trả thêm gì nữa. Python chỉ gọi <code>__iter__</code>, còn tạo mới hay không là do bạn viết.",
  },
  {
    q: "Iterator khác Visitor ở điểm nào?",
    options: [
      "Iterator chỉ dùng được cho list, còn Visitor dùng cho cây.",
      "Visitor chạy nhanh hơn vì không phải gọi <code>next()</code>.",
      "Iterator chỉ đưa từng phần tử cho chỗ gọi, còn Visitor mang theo một thao tác để làm trên từng loại phần tử.",
    ],
    answer: 2,
    why: "Iterator lo thứ tự đi qua tập hợp và để chỗ gọi tự quyết làm gì với mỗi phần tử. Visitor thì gói sẵn thao tác, chẳng hạn tính thuế cho từng loại sản phẩm. Iterator cũng không chỉ dành cho list, vì cây hay API phân trang đều duyệt được bằng nó.",
  },
  {
    q: "Vòng lặp tìm đơn trên 2.000.000 ₫ gặp <code>break</code> ở DH-006. Nếu iterator đang giữ một kết nối tới cơ sở dữ liệu thay vì gọi API, bạn cần lưu ý điều gì?",
    options: [
      "Đóng kết nối khi vòng lặp dừng sớm, chẳng hạn bằng <code>try/finally</code> trong generator.",
      "Không cần làm gì, vì <code>break</code> tự đóng mọi kết nối mà iterator đã mở.",
      "Đọc nốt các đơn còn lại để iterator tự kết thúc như bình thường.",
      "Mở một kết nối mới ở mỗi lần gọi <code>next()</code>.",
    ],
    answer: 0,
    why: "Khi gặp <code>break</code>, iterator chỉ đơn giản là không được gọi tiếp, nên kết nối nó giữ vẫn mở nếu bạn không dọn. Generator chạy khối <code>finally</code> khi bị đóng, còn TypeScript gọi phương thức <code>return()</code> của iterator. Đọc nốt chỉ để kết thúc thì phí công, giống như tải trang thứ ba mà không ai cần.",
  },
];
