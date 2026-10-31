// "Kiểm tra nhanh" at the end of the Prototype lesson. `answer` is the index of the
// right option; `why` shows after the reader picks. Prose follows ../_shared/STYLE.md.

export const QUIZ = [
  {
    q: "Phòng marketing tự soạn các mẫu chiến dịch email trong trang quản trị, mỗi mẫu có tiêu đề, danh sách khối nội dung và lịch gửi. Mỗi chiến dịch mới chỉ khác mẫu vài chỗ. Cách nào hợp lý nhất?",
    options: [
      "Viết một lớp con cho mỗi mẫu chiến dịch.",
      "Chép tay từng trường của mẫu sang chiến dịch mới ở nơi tạo chiến dịch.",
      "Cho mẫu một phương thức <code>clone()</code> chép sâu, rồi chỉnh bản sao cho chiến dịch mới.",
      "Giữ mẫu trong một Singleton và cho mọi chiến dịch dùng chung đối tượng đó.",
    ],
    answer: 2,
    why: "Mẫu ở đây là dữ liệu do người dùng cấu hình lúc chạy, nên không thể viết sẵn một lớp con cho từng mẫu. Chép tay thì dễ sót trường, còn dùng chung một đối tượng nghĩa là sửa chiến dịch này sẽ làm hỏng luôn mẫu.",
  },
  {
    q: "Ở bước cuối của hình, vì sao màn hình của gói mẫu nhảy lên 6.900.000 ₫?",
    options: [
      "Vì bản sao nông dùng chung danh sách hạng mục với mẫu, nên hạng mục thêm cho An Phát cũng nằm trong mẫu.",
      "Vì máy đã cắt lại chìa gốc theo hình của bản sao.",
      "Vì đổi tên khách thành An Phát cũng đổi luôn tên của gói mẫu.",
      "Vì <code>clone()</code> cộng giá của bản sao vào gói mẫu.",
    ],
    answer: 0,
    why: "Bản sao nông chỉ chép các trường ở tầng ngoài, còn danh sách hạng mục vẫn là cùng một đối tượng, nên thêm vào bản sao cũng là thêm vào mẫu. Tên khách là một giá trị đơn nên không bị ảnh hưởng.",
  },
  {
    q: "Trong <code>before.py</code>, hợp đồng của An Phát in ra “điều khoản: thiếu”. Nguyên nhân là gì?",
    options: [
      "Gói mẫu vốn không có điều khoản nào.",
      "Phương thức <code>total()</code> xoá điều khoản khi tính tiền.",
      "Python không chép được từ điển.",
      "Chỗ chép tay không chép trường <code>terms</code>, vì trường này được thêm vào lớp sau.",
    ],
    answer: 3,
    why: "Gói mẫu có đủ điều khoản thanh toán 30 ngày và bảo hành 12 tháng. Lỗi nằm ở chỗ mỗi nơi tạo hợp đồng tự chép từng trường, nên trường mới thêm rất dễ bị bỏ sót. Với <code>clone()</code>, chính lớp lo việc chép nên không còn chỗ nào để quên.",
  },
  {
    q: "Trong ví dụ, ai đóng vai Client của Prototype?",
    options: [
      "Lớp <code>ServicePackage</code>.",
      "Hàm <code>new_contract()</code>, nơi lấy mẫu từ kho, gọi <code>clone()</code> rồi chỉnh bản sao.",
      "Danh sách <code>items</code> bên trong gói.",
      "Hàm <code>copy.deepcopy</code>.",
    ],
    answer: 1,
    why: "<code>new_contract()</code> chỉ biết tên mẫu và gọi <code>clone()</code>, nên nó là Client. <code>ServicePackage</code> với phương thức <code>clone()</code> là Prototype, còn <code>copy.deepcopy</code> chỉ là công cụ mà <code>clone()</code> dùng bên trong.",
  },
  {
    q: "Trong bản TypeScript, vì sao <code>clone()</code> không trả về thẳng <code>structuredClone(this)</code>?",
    options: [
      "Vì <code>structuredClone</code> chỉ chép nông.",
      "Vì <code>structuredClone</code> không chạy được trong Node.",
      "Vì <code>structuredClone</code> trả về một đối tượng thường, mất lớp và các phương thức như <code>total()</code>.",
    ],
    answer: 2,
    why: "<code>structuredClone</code> chép sâu dữ liệu nhưng không giữ lại lớp, nên bản sao không còn <code>total()</code> hay <code>clone()</code>. Ví dụ dùng nó cho phần dữ liệu rồi dựng lại <code>ServicePackage</code> quanh dữ liệu đã chép.",
  },
  {
    q: "Prototype khác Factory Method ở điểm nào?",
    options: [
      "Prototype chỉ dùng được trong những ngôn ngữ có sẵn hàm chép sâu.",
      "Factory Method dựng đối tượng mới từ đầu trong lớp con, còn Prototype sao chép một đối tượng đã có cùng toàn bộ dữ liệu của nó.",
      "Factory Method luôn chép sâu, còn Prototype luôn chép nông.",
      "Prototype cần một lớp con cho mỗi loại sản phẩm.",
    ],
    answer: 1,
    why: "Factory Method quyết định tạo lớp nào và dựng đối tượng từ đầu. Prototype không cần biết lớp, nó lấy một đối tượng đã được cấu hình và tạo ra một bản giống hệt, nên rất hợp khi cấu hình đến từ dữ liệu.",
  },
];
