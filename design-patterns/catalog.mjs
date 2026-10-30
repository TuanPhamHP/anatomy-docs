// The design-patterns module: every GoF pattern, its group, how often it shows
// up in backend code (1-3), and its status. `ready` patterns have a page at
// ./<slug>/index.html; `wave: 1` is the current batch, `wave: 2` comes later.

export const GROUPS = [
  {
    id: "creational",
    name: "Creational",
    title: "Tạo object",
    blurb: "Tách việc tạo object ra khỏi chỗ dùng nó, để đổi cách tạo mà không sửa code gọi.",
  },
  {
    id: "structural",
    name: "Structural",
    title: "Ghép object",
    blurb: "Ghép các lớp và object thành cấu trúc lớn hơn mà vẫn giữ từng phần đơn giản.",
  },
  {
    id: "behavioral",
    name: "Behavioral",
    title: "Phối hợp giữa các object",
    blurb: "Chia trách nhiệm và cách các object gọi nhau, để thêm hành vi mà không sửa phần đang chạy.",
  },
];

export const PATTERNS = [
  { slug: "factory-method", name: "Factory Method", group: "creational", stars: 3, wave: 1, summary: "Giao việc tạo object cho một hàm hoặc lớp con; code gọi chỉ biết interface." },
  { slug: "builder", name: "Builder", group: "creational", stars: 3, wave: 1, summary: "Lắp một object phức tạp từng bước, như một query builder." },
  { slug: "singleton", name: "Singleton", group: "creational", stars: 2, wave: 1, summary: "Chỉ một instance cho cả hệ thống; ngày nay thường để DI container lo, và dễ thành anti-pattern." },
  { slug: "abstract-factory", name: "Abstract Factory", group: "creational", stars: 2, wave: 2, summary: "Tạo cả một họ object luôn đi cùng nhau." },
  { slug: "prototype", name: "Prototype", group: "creational", stars: 1, wave: 2, summary: "Tạo object mới bằng cách clone một mẫu có sẵn." },

  { slug: "adapter", name: "Adapter", group: "structural", stars: 3, wave: 1, ready: true, summary: "Bọc một interface lạ thành interface hệ thống đang chờ: nhiều ngân hàng, một chuẩn giao dịch." },
  { slug: "decorator", name: "Decorator", group: "structural", stars: 3, wave: 1, summary: "Bọc thêm hành vi (cache, log, retry) mà không sửa lớp gốc." },
  { slug: "facade", name: "Facade", group: "structural", stars: 3, wave: 1, summary: "Một cửa đơn giản che cả một hệ con phức tạp." },
  { slug: "proxy", name: "Proxy", group: "structural", stars: 2, wave: 1, summary: "Đứng thay object thật để tải lười, cache hoặc kiểm quyền." },
  { slug: "composite", name: "Composite", group: "structural", stars: 2, wave: 1, summary: "Cây bộ phận và tổng thể được xử lý như nhau: task, phase, project." },
  { slug: "bridge", name: "Bridge", group: "structural", stars: 1, wave: 2, summary: "Tách hai chiều biến đổi độc lập, như kênh gửi và loại thông báo." },
  { slug: "flyweight", name: "Flyweight", group: "structural", stars: 1, wave: 2, summary: "Dùng chung phần dữ liệu bất biến để tiết kiệm bộ nhớ." },

  { slug: "strategy", name: "Strategy", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Đổi thuật toán lúc chạy: cách tính phí, cách xử lý từng loại sự kiện." },
  { slug: "observer", name: "Observer", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Một bên phát sự kiện, nhiều bên nghe mà không cần biết nhau." },
  { slug: "chain-of-responsibility", name: "Chain of Responsibility", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Chuỗi mắt xử lý; mỗi mắt quyết định cho đi tiếp hay dừng, như middleware." },
  { slug: "command", name: "Command", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Gói yêu cầu thành object để xếp hàng, retry hoặc hoàn tác, như job trong queue." },
  { slug: "state", name: "State", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Hành vi đổi theo trạng thái hiện tại: luồng phê duyệt, vòng đời đơn hàng." },
  { slug: "template-method", name: "Template Method", group: "behavioral", stars: 2, wave: 1, ready: true, summary: "Khung thuật toán cố định, chỉ vài bước được thay." },
  { slug: "iterator", name: "Iterator", group: "behavioral", stars: 2, wave: 2, summary: "Duyệt một tập hợp mà không lộ cấu trúc bên trong." },
  { slug: "mediator", name: "Mediator", group: "behavioral", stars: 1, wave: 2, summary: "Các bên không gọi nhau trực tiếp mà qua một trung gian." },
  { slug: "memento", name: "Memento", group: "behavioral", stars: 1, wave: 2, summary: "Chụp lại trạng thái để khôi phục sau." },
  { slug: "interpreter", name: "Interpreter", group: "behavioral", stars: 1, wave: 2, summary: "Đánh giá một ngôn ngữ biểu thức nhỏ, như điều kiện phân quyền." },
  { slug: "visitor", name: "Visitor", group: "behavioral", stars: 1, wave: 2, summary: "Thêm thao tác lên một cây object mà không sửa các lớp." },
];
