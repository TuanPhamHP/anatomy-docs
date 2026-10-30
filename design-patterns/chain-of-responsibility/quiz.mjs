// "Kiểm tra nhanh" at the end of the Chain of Responsibility lesson. `answer` is the
// index of the right option; `why` shows after the reader picks. Prose follows
// ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Bộ phận hỗ trợ khách hàng phân loại ticket theo tuyến. Bot tự trả lời câu hỏi đơn giản, nhân viên tuyến một xử lý lỗi thường gặp, còn kỹ sư nhận phần còn lại. Số tuyến và thứ tự của chúng thay đổi theo từng sản phẩm. Pattern nào hợp nhất?",
    options: [
      "Observer, để mọi tuyến cùng nhận ticket một lúc.",
      "Chain of Responsibility, để ticket đi qua từng tuyến cho tới khi có tuyến nhận xử lý.",
      "Strategy, để chọn sẵn một tuyến cho mọi ticket.",
      "Singleton, để chỉ có đúng một nơi xử lý ticket.",
    ],
    answer: 1,
    why: "Mỗi tuyến tự quyết định nhận hay chuyển tiếp, và chuỗi có thể ghép lại riêng cho từng sản phẩm. Observer sẽ khiến mọi tuyến cùng xử lý một ticket, còn Strategy đòi hỏi biết trước tuyến nào sẽ nhận.",
  },
  {
    q: "Đề nghị CP-102 xin 20.000.000 ₫. Đồng xu của nó đi qua máng như thế nào?",
    options: [
      "Lọt ngay lỗ đầu tiên, và trưởng nhóm duyệt.",
      "Trượt qua cả ba lỗ rồi rơi vào thùng từ chối.",
      "Lọt lỗ thứ ba, và giám đốc duyệt.",
      "Trượt qua lỗ đầu vì vượt hạn mức 5.000.000 ₫, rồi lọt lỗ thứ hai, và trưởng phòng duyệt.",
    ],
    answer: 3,
    why: "20.000.000 ₫ lớn hơn hạn mức 5.000.000 ₫ của trưởng nhóm nhưng vẫn nằm trong hạn mức 50.000.000 ₫ của trưởng phòng. Đồng xu lọt ở lỗ đầu tiên đủ lớn với nó, nên chuỗi dừng ở trưởng phòng và giám đốc không bao giờ thấy đề nghị này.",
  },
  {
    q: "Giả sử chuỗi được ghép ngược lại, giám đốc đứng đầu rồi mới tới trưởng phòng và trưởng nhóm. Đề nghị 3.000.000 ₫ sẽ được xử lý ra sao?",
    options: [
      "Giám đốc duyệt luôn, vì 3.000.000 ₫ nằm trong hạn mức của giám đốc và chuỗi dừng ngay ở mắt đầu tiên.",
      "Trưởng nhóm vẫn duyệt, vì chuỗi luôn tìm người có hạn mức nhỏ nhất.",
      "Đề nghị bị từ chối vì chuỗi được ghép sai thứ tự.",
    ],
    answer: 0,
    why: "Mỗi mắt chỉ hỏi mình có duyệt được không, chứ không so sánh với các mắt khác. Vì vậy thứ tự cũng là một phần của logic, và mắt có hạn mức nhỏ phải đứng trước.",
  },
  {
    q: "Trong hình, thùng từ chối ở cuối máng ứng với phần nào trong code?",
    options: [
      "Lớp <code>Expense</code>.",
      "Phương thức <code>set_next</code>.",
      "Nhánh <code>self._next is None</code> trong <code>handle</code>, khi phía sau không còn mắt nào.",
      "Hàm <code>build_chain()</code>.",
    ],
    answer: 2,
    why: "Khi một mắt không duyệt được và cũng không còn mắt kế tiếp, yêu cầu đã đi hết chuỗi. Code trả về kết quả bị từ chối ở đúng nhánh đó, giống như đồng xu quá to trượt khỏi cuối máng.",
  },
  {
    q: "Khi thiết kế một chuỗi xử lý, điều gì cần được quyết định rõ ngay từ đầu?",
    options: [
      "Mỗi mắt phải biết hết các mắt khác trong chuỗi.",
      "Chuyện gì xảy ra khi yêu cầu đi hết chuỗi mà không mắt nào nhận, để nó không lặng lẽ biến mất.",
      "Chuỗi phải có đúng ba mắt, không hơn không kém.",
      "Mọi mắt đều phải chạy với mọi yêu cầu.",
    ],
    answer: 1,
    why: "Chuỗi không bảo đảm sẽ có người nhận, nên ở cuối phải có một kết cục rõ ràng như từ chối, ném lỗi hay chuyển cho một mắt mặc định. Trong bài, đề nghị 900.000.000 ₫ đi hết chuỗi và được trả về là bị từ chối.",
  },
  {
    q: "Decorator cũng xếp các đối tượng thành một chuỗi. Điểm khác chính so với Chain of Responsibility là gì?",
    options: [
      "Với Decorator, mọi lớp đều chạy và cùng góp vào kết quả, còn trong Chain of Responsibility một mắt có thể dừng chuỗi lại.",
      "Decorator chỉ dùng cho giao diện người dùng, còn Chain of Responsibility dùng cho backend.",
      "Chain of Responsibility không cho phép đổi thứ tự các mắt sau khi đã ghép.",
    ],
    answer: 0,
    why: "Một lời gọi qua chồng decorator luôn đi xuyên qua mọi lớp, mỗi lớp thêm một chút hành vi. Ở Chain of Responsibility, mắt nào nhận việc thì các mắt phía sau không chạy nữa.",
  },
];
