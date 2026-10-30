// "Kiểm tra nhanh" at the end of the Decorator lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Một lớp gửi SMS đang chạy ổn. Giờ bạn cần ghi log và giới hạn số tin gửi mỗi phút, nhưng chỉ khi chạy trên production. Cách nào hợp lý nhất?",
    options: [
      "Thêm hai cờ bật tắt vào chính lớp gửi SMS.",
      "Tạo lớp con <code>LoggedRateLimitedSmsSender</code> kế thừa lớp gửi SMS.",
      "Viết hai decorator cùng interface với lớp gửi SMS, rồi bọc chúng quanh nó khi khởi tạo trên production.",
      "Chép lớp gửi SMS thành một bản riêng dành cho production.",
    ],
    answer: 2,
    why: "Decorator cho phép mỗi việc thêm vào là một lớp bọc riêng, chỉ lắp vào ở nơi cần, nên lớp gốc không phải sửa. Thêm cờ hay tạo lớp con đều làm lớp gốc phình ra, và số lớp con sẽ tăng theo mọi tổ hợp tính năng.",
  },
  {
    q: "Trong ví dụ tỷ giá, lớp nào đóng vai Concrete component?",
    options: ["<code>HttpRateSource</code>", "<code>RateSource</code>", "<code>CachingSource</code>", "<code>LoggingSource</code>"],
    answer: 0,
    why: "<code>HttpRateSource</code> là phần lõi thật, chỉ làm đúng một việc là gọi API tỷ giá. <code>RateSource</code> là interface chung, còn <code>CachingSource</code> và <code>LoggingSource</code> là các decorator bọc bên ngoài.",
  },
  {
    q: "Ở bước 4, <code>CachingSource</code> bọc ngoài cùng và ta gọi <code>get_rate(\"USD/VND\")</code> hai lần. API thật bị gọi bao nhiêu lần?",
    options: [
      "Hai lần, mỗi lời gọi một lần.",
      "Ba lần, vì RETRY luôn thử thêm một lần.",
      "Không lần nào, vì cache đã có sẵn từ bước trước.",
      "Một lần, vì lời gọi thứ hai được <code>CachingSource</code> trả lời ngay.",
    ],
    answer: 3,
    why: "Lời gọi đầu đi xuống tới API, và <code>CachingSource</code> nhớ lại kết quả 25.380 ₫. Lời gọi thứ hai dừng ngay ở lớp cache ngoài cùng, nên bộ đếm API vẫn là 1 và LOG cũng chỉ có một dòng.",
  },
  {
    q: "Ở bước 3, API lỗi ở lần đầu rồi thành công ở lần thử thứ hai. Vì sao LOG ghi hai dòng chứ không phải một?",
    options: [
      "Vì <code>LoggingSource</code> luôn ghi hai dòng cho mỗi lời gọi.",
      "Vì <code>LoggingSource</code> nằm bên trong <code>RetrySource</code>, nên lần thử nào cũng đi qua nó.",
      "Vì <code>HttpRateSource</code> tự ghi thêm một dòng khi gặp lỗi.",
      "Vì <code>RetrySource</code> ghi log thay cho <code>LoggingSource</code>.",
    ],
    answer: 1,
    why: "Chồng lớp ở bước này là <code>RetrySource</code> bọc ngoài <code>LoggingSource</code>, nên mỗi lần RETRY gọi xuống là một lần đi qua LOG, được một dòng lỗi và một dòng thành công. Nếu đặt LOG ở ngoài RETRY, cả lời gọi chỉ có một dòng.",
  },
  {
    q: "Trường hợp nào Decorator dễ gây rắc rối hơn là giúp ích?",
    options: [
      "Khi cần thêm cache cho một client gọi API bên ngoài.",
      "Khi muốn bật tắt log tuỳ theo môi trường chạy.",
      "Khi code gọi dùng <code>isinstance</code> để kiểm tra lớp cụ thể của đối tượng.",
      "Khi lớp gốc nằm trong một thư viện mà bạn không sửa được.",
    ],
    answer: 2,
    why: "Bọc một đối tượng vào decorator là mất kiểu gốc của nó, nên code dựa vào <code>isinstance</code> hay ép kiểu sẽ chạy sai. Ba trường hợp còn lại lại chính là chỗ Decorator phát huy tác dụng.",
  },
  {
    q: "Decorator và Proxy đều giữ nguyên interface. Khác biệt chính giữa chúng là gì?",
    options: [
      "Proxy kiểm soát việc truy cập và thường tự quản lý đối tượng thật, còn decorator được lắp chồng từ bên ngoài để thêm hành vi.",
      "Proxy đổi interface của đối tượng thật, còn Decorator thì giữ nguyên.",
      "Decorator chỉ dùng được cho hàm, còn Proxy chỉ dùng được cho lớp.",
    ],
    answer: 0,
    why: "Cả hai đều đứng trước một đối tượng có cùng interface. Proxy lo chuyện ai được dùng và dùng lúc nào, như tải lười hay kiểm quyền, còn decorator xếp chồng thêm hành vi. Đổi interface là việc của Adapter.",
  },
];
