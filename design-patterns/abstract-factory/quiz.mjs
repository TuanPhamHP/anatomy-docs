// "Kiểm tra nhanh" at the end of the Abstract Factory lesson. `answer` is the index
// of the right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Ứng dụng có giao diện sáng và giao diện tối. Mỗi giao diện có nút bấm, ô nhập và hộp thoại riêng, và đặt một nút của giao diện sáng vào hộp thoại tối trông rất lỗi. Pattern nào hợp nhất để tạo các thành phần này?",
    options: ["Singleton", "Abstract Factory", "Observer", "Decorator"],
    answer: 1,
    why: "Đây là một họ đối tượng phải đi cùng nhau, nên một factory cho giao diện sáng và một factory cho giao diện tối sẽ bảo đảm mọi thành phần cùng một kiểu. Singleton chỉ giới hạn số thể hiện, còn Decorator thêm hành vi chứ không lo chuyện các thành phần có hợp nhau hay không.",
  },
  {
    q: "Trong ví dụ thanh toán, lớp nào là một Concrete Factory?",
    options: ["<code>PaymentKitFactory</code>", "<code>Checkout</code>", "<code>ProviderBFactory</code>", "<code>VerifierB</code>"],
    answer: 2,
    why: "<code>ProviderBFactory</code> tạo ra đúng ba thành phần của nhà cung cấp B, nên nó là một Concrete Factory. <code>PaymentKitFactory</code> là interface chung, <code>Checkout</code> là Client, còn <code>VerifierB</code> là một sản phẩm do factory tạo ra.",
  },
  {
    q: "Bản code cũ đọc cấu hình <code>payment: A</code>, <code>refund: A</code> và <code>webhook: B</code>. Khi chạy, chuyện gì xảy ra?",
    options: [
      "Tiền được thu qua A, nhưng webhook <code>a1:9e2d13c1</code> bị bộ kiểm của B từ chối.",
      "Chương trình báo lỗi ngay lúc khởi động vì cấu hình không hợp lệ.",
      "Mọi thứ đều chạy đúng vì cả thu tiền lẫn hoàn tiền đều qua A.",
      "Tiền được thu qua B vì dòng cấu hình cuối cùng là B.",
    ],
    answer: 0,
    why: "Không có gì trong code cũ kiểm tra ba dòng cấu hình có cùng một nhà cung cấp hay không, nên nó vẫn chạy và chỉ hỏng ở bước kiểm webhook. Chữ ký kiểu <code>a1:</code> của A không bao giờ khớp với bộ kiểm của B, nên khách đã trả tiền mà đơn hàng không được xác nhận.",
  },
  {
    q: "Trong hình, khi kéo thanh chọn bộ từ A sang B thì điều gì xảy ra?",
    options: [
      "Chỉ giá ống đầu tiên đổi sang B, hai giá còn lại phải chỉnh bằng tay.",
      "Máy dừng lại và chờ người thay ba ống mới.",
      "Các chi tiết A đang nằm trên khay ép tự đổi thành chi tiết B.",
      "Cả ba giá ống cùng đổi sang ống của B trong một lần kéo.",
    ],
    answer: 3,
    why: "Thanh chọn bộ cắm chốt qua cả ba giá, nên chọn một lần là đổi trọn cả họ, giống như truyền một factory khác vào <code>Checkout</code>. Chỉ khi nhấc thanh ra, như ở bước bộ lẫn, các giá mới có thể lệch nhau.",
  },
  {
    q: "Điểm khác nhau chính giữa Abstract Factory và Factory Method là gì?",
    options: [
      "Abstract Factory tạo đối tượng một cách lười, còn Factory Method tạo ngay khi gọi.",
      "Factory Method để lớp con quyết định tạo một sản phẩm, còn Abstract Factory là một đối tượng tạo cả một họ sản phẩm đi cùng nhau.",
      "Factory Method dùng cho nhiều họ sản phẩm, còn Abstract Factory chỉ tạo một sản phẩm.",
      "Hai pattern giống hệt nhau, chỉ khác tên gọi.",
    ],
    answer: 1,
    why: "Factory Method xoay quanh một phương thức tạo được lớp con ghi đè. Abstract Factory gom nhiều phương thức tạo vào một đối tượng để các sản phẩm luôn cùng họ, và mỗi phương thức trong đó thường chính là một factory method.",
  },
  {
    q: "Bạn muốn mọi nhà cung cấp có thêm dịch vụ đối soát. Với Abstract Factory, bạn phải sửa những gì?",
    options: [
      "Chỉ cần viết thêm hai lớp <code>ReconcilerA</code> và <code>ReconcilerB</code>.",
      "Chỉ cần sửa <code>Checkout</code>.",
      "Thêm <code>create_reconciler</code> vào interface factory, rồi viết phương thức đó trong mọi factory cụ thể.",
      "Không phải sửa gì, vì factory tự biết tạo sản phẩm mới.",
    ],
    answer: 2,
    why: "Thêm một loại sản phẩm nghĩa là interface factory có thêm một phương thức, và factory cụ thể nào cũng phải viết nó. Đây là cái giá của pattern này, nên nó hợp nhất khi các loại sản phẩm đã ổn định và chỉ có họ mới được thêm vào.",
  },
];
