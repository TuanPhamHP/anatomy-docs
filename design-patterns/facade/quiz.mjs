// "Kiểm tra nhanh" at the end of the Facade lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Trang web, app di động và API cho đối tác đều cần đăng ký tài khoản mới theo cùng các bước: tạo user, gán quyền mặc định rồi gửi email chào. Cách nào giữ cho ba nơi luôn chạy giống nhau?",
    options: [
      "Chép các bước vào cả ba nơi và nhắc mọi người sửa cùng lúc.",
      "Gom các bước vào một facade có phương thức <code>register()</code> để cả ba nơi cùng gọi.",
      "Cho lớp tạo user tự gọi lớp gán quyền và lớp gửi email.",
      "Viết một adapter riêng cho từng nơi gọi.",
    ],
    answer: 1,
    why: "Facade gom quy trình về một chỗ, nên ba client chạy chung một đường và chỉ cần sửa một lần. Để lớp tạo user tự gọi các lớp khác thì các hệ con bị buộc chặt vào nhau, còn Adapter dùng để đổi interface chứ không để điều phối nhiều bước.",
  },
  {
    q: "Đơn DH-2042 đặt 3 sản phẩm SP-17 khi kho còn 10, nhưng thẻ bị từ chối. Sau khi <code>place_order()</code> chạy xong, tồn kho SP-17 là bao nhiêu?",
    options: [
      "7, vì số hàng đã giữ cho đơn vẫn bị trừ.",
      "13, vì facade cộng thêm số hàng của đơn bị huỷ.",
      "0, vì đơn lỗi làm khoá cả kho.",
      "10, vì facade trả lại 3 sản phẩm đã giữ khi thanh toán lỗi.",
    ],
    answer: 3,
    why: "Facade giữ 3 sản phẩm nên tồn kho xuống 7, rồi khi thẻ bị từ chối nó trả lại đúng 3 sản phẩm đó và tồn kho quay về 10. Con số 7 chính là lỗi của bản chưa có facade, khi app di động quên bước trả hàng.",
  },
  {
    q: "Trong ví dụ, <code>Inventory</code>, <code>Payments</code>, <code>Shipping</code>, <code>Invoices</code> và <code>Notifier</code> đóng vai gì?",
    options: [
      "Subsystem, tức các lớp làm việc thật mà facade điều phối.",
      "Client, tức những nơi gọi vào facade.",
      "Facade, mỗi lớp là một cửa vào riêng.",
      "Adapter, đổi interface cho <code>CheckoutFacade</code>.",
    ],
    answer: 0,
    why: "Năm lớp đó là các hệ con làm việc thật, và chúng không hề biết đến facade. Client là trang web, app và công cụ admin, còn facade chỉ có một là <code>CheckoutFacade</code>.",
  },
  {
    q: "Dấu hiệu nào cho thấy một facade đang bị dùng sai?",
    options: [
      "Facade gọi năm hệ con theo một thứ tự cố định.",
      "Facade nhận các hệ con qua constructor.",
      "Facade bắt đầu tự tính giá, kiểm tra tồn kho và quyết định chính sách hoàn tiền.",
      "Vài trường hợp đặc biệt vẫn gọi thẳng vào hệ con.",
    ],
    answer: 2,
    why: "Facade chỉ nên điều phối thứ tự gọi và bù trừ khi lỗi, còn quy tắc nghiệp vụ thuộc về từng hệ con. Khi facade ôm luôn các quy tắc đó, nó đang dần thành một god object vừa khó sửa vừa khó test.",
  },
  {
    q: "Facade khác Mediator ở điểm nào?",
    options: [
      "Facade chỉ dùng cho thư viện bên ngoài, còn Mediator dùng cho lớp nội bộ.",
      "Hệ con không biết facade tồn tại, còn các lớp dùng mediator thì gọi nhau qua nó.",
      "Mediator luôn có cùng interface với từng hệ con, còn Facade thì không.",
      "Facade chỉ được gọi một hệ con, còn Mediator gọi được nhiều hệ con.",
    ],
    answer: 1,
    why: "Mediator là trung tâm liên lạc mà mọi bên đều biết và gửi tin qua đó. Facade chỉ là một lối tắt đặt phía trước, và các hệ con hoàn toàn không hay biết gì về nó.",
  },
  {
    q: "Vì sao nên truyền các hệ con vào <code>CheckoutFacade</code> qua constructor thay vì để facade tự tạo chúng?",
    options: [
      "Để facade chạy nhanh hơn.",
      "Để hệ con không gọi ngược lại được facade.",
      "Để mỗi lần gọi <code>place_order()</code> lại có một bộ hệ con mới.",
      "Để khi test có thể thay bằng bản giả và kiểm tra thứ tự gọi.",
    ],
    answer: 3,
    why: "Khi hệ con được truyền vào, bài test chỉ cần đưa vào các bản giả rồi xem facade có gọi đúng thứ tự và bù trừ đúng khi lỗi hay không. Cách truyền này không làm code chạy nhanh hơn chút nào.",
  },
];
