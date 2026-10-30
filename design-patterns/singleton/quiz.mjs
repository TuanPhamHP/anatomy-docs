// "Kiểm tra nhanh" at the end of the Singleton lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.
// The port and pool sizes come from the model, so the numbers match the figure.
import { DB_PORTS, POOL_SIZE } from "./model.mjs";

export const QUIZ = [
  {
    q: `Khi chưa có Singleton, mỗi service tự tạo một pool ${POOL_SIZE} kết nối, còn cơ sở dữ liệu chỉ cho phép ${DB_PORTS}. Chuyện gì xảy ra với service khởi động thứ ba?`,
    options: [
      "Nó tự động dùng chung pool của service đầu tiên.",
      `Nó vẫn tạo được pool, chỉ là với ${POOL_SIZE / 2} kết nối.`,
      `Nó không mở được kết nối nào, vì hai pool đầu đã chiếm hết ${DB_PORTS}/${DB_PORTS} cổng.`,
      `Cơ sở dữ liệu tự nâng giới hạn lên ${3 * POOL_SIZE}.`,
    ],
    answer: 2,
    why: `Hai pool đầu đã giữ đủ ${DB_PORTS} kết nối, nên pool thứ ba cần thêm ${POOL_SIZE} thì không còn cổng nào. Lỗi chỉ hiện ra ở service khởi động sau cùng, nên rất dễ tưởng nhầm là lỗi của riêng service đó.`,
  },
  {
    q: "Sau khi có <code>get_pool()</code>, ba service lần lượt gọi nó. Bộ đếm sẽ hiện bao nhiêu pool và bao nhiêu cổng đang dùng?",
    options: [
      `1 pool, ${POOL_SIZE}/${DB_PORTS} cổng`,
      `3 pool, ${3 * POOL_SIZE}/${DB_PORTS} cổng`,
      `1 pool, ${3 * POOL_SIZE}/${DB_PORTS} cổng`,
      `3 pool, ${POOL_SIZE}/${DB_PORTS} cổng`,
    ],
    answer: 0,
    why: `Lần gọi đầu tạo pool #1 và mở ${POOL_SIZE} kết nối. Hai lần sau nhận lại đúng đối tượng ấy, nên không có pool mới nào được tạo và số cổng vẫn đứng ở ${POOL_SIZE}/${DB_PORTS}.`,
  },
  {
    q: "Vì sao người ta thường tạo pool một lần ở composition root rồi truyền vào constructor, thay vì để service tự gọi <code>get_pool()</code>?",
    options: [
      "Vì cách đó tạo ra nhiều pool hơn nên chạy nhanh hơn.",
      "Vì phụ thuộc hiện rõ trên constructor, và test có thể truyền một pool giả vào.",
      "Vì Python không hỗ trợ biến cấp module.",
      "Vì DI container luôn tạo một pool mới cho mỗi request.",
    ],
    answer: 1,
    why: "Hệ thống vẫn chỉ có một pool, nhưng service không còn tự đi lấy nó nữa. Nhờ vậy nhìn constructor là biết service cần gì, và test thay được pool thật bằng pool giả, như ví dụ đọc 2 dòng mà không mở kết nối nào.",
  },
  {
    q: "Hàm <code>get_pool()</code> tạo pool một cách lười, trong một server chạy nhiều thread. Nếu không có khoá, điều gì có thể xảy ra?",
    options: [
      "Không có gì, vì biến cấp module luôn an toàn với thread.",
      "Pool sẽ bị đóng lại sau mỗi request.",
      "Hàm <code>get_pool()</code> chạy chậm hơn nhưng kết quả vẫn đúng.",
      "Hai thread cùng thấy chưa có pool, và mỗi thread tạo ra một pool riêng.",
    ],
    answer: 3,
    why: "Kiểm tra rồi mới tạo là hai bước tách rời, nên hai thread có thể cùng lọt qua bước kiểm tra. Một chiếc khoá, hoặc tạo sẵn pool ngay khi nạp module, bảo đảm chỉ có một thread được tạo.",
  },
  {
    q: `Ứng dụng chạy bốn worker process, mỗi process dùng Singleton cho một pool ${POOL_SIZE} kết nối. Tổng cộng có bao nhiêu kết nối tới cơ sở dữ liệu?`,
    options: [
      `${4 * POOL_SIZE}, vì mỗi process có Singleton của riêng nó.`,
      `${POOL_SIZE}, vì Singleton được dùng chung cho cả hệ thống.`,
      `${DB_PORTS}, vì cơ sở dữ liệu tự chia đều giữa các process.`,
    ],
    answer: 0,
    why: `Singleton chỉ là duy nhất trong một process. Bốn worker là bốn process, nên có bốn pool với tổng cộng ${4 * POOL_SIZE} kết nối, vượt xa giới hạn ${DB_PORTS} nếu bạn không tính trước.`,
  },
  {
    q: "Thứ nào dưới đây không nên đặt trong một Singleton?",
    options: [
      "Pool kết nối dùng chung cho cả process.",
      "Giỏ hàng của người dùng đang đăng nhập.",
      "Client gọi một dịch vụ bên ngoài có giới hạn số kết nối.",
    ],
    answer: 1,
    why: "Singleton là một đối tượng dùng chung cho mọi request, nên giỏ hàng đặt trong đó sẽ bị mọi người dùng chung và dữ liệu của người này lẫn sang người khác. Pool kết nối và client dùng chung thì đúng là những thứ chỉ nên có một bản.",
  },
];
