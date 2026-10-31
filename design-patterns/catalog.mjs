// The design-patterns module: every GoF pattern, its group, how often it shows
// up in backend code (1-3), and its status. `ready` patterns have a page at
// ./<slug>/index.html; `wave: 1` is the current batch, `wave: 2` comes later.

export const GROUPS = [
  {
    id: "creational",
    name: "Creational",
    title: "Tạo đối tượng",
    blurb: "Nhóm này lo chuyện tạo đối tượng. Thay vì rải lệnh tạo đối tượng khắp nơi, ta gom việc đó về một chỗ, để sau này đổi cách tạo mà không phải sửa những đoạn code đang dùng nó.",
  },
  {
    id: "structural",
    name: "Structural",
    title: "Ghép đối tượng",
    blurb: "Nhóm này bàn về cách ghép các lớp và đối tượng thành một cấu trúc lớn hơn, sao cho từng phần vẫn đơn giản và dễ thay thế.",
  },
  {
    id: "behavioral",
    name: "Behavioral",
    title: "Phối hợp giữa các đối tượng",
    blurb: "Nhóm này trả lời câu hỏi ai làm việc gì và các đối tượng trao đổi với nhau ra sao, để thêm được hành vi mới mà không phải động vào phần đang chạy ổn.",
  },
];

export const PATTERNS = [
  { slug: "factory-method", name: "Factory Method", group: "creational", stars: 3, wave: 1, ready: true, summary: "Để lớp con quyết định tạo đối tượng nào, còn phần xử lý chung chỉ cần biết interface của nó." },
  { slug: "builder", name: "Builder", group: "creational", stars: 3, wave: 1, ready: true, summary: "Lắp một đối tượng phức tạp qua từng bước rõ ràng, giống cách dựng câu truy vấn bằng query builder." },
  { slug: "singleton", name: "Singleton", group: "creational", stars: 2, wave: 1, ready: true, summary: "Bảo đảm cả chương trình chỉ có đúng một thể hiện. Pattern này dễ bị dùng sai, nên ngày nay thường để DI container lo." },
  { slug: "abstract-factory", name: "Abstract Factory", group: "creational", stars: 2, wave: 2, ready: true, summary: "Tạo cả một bộ đối tượng luôn đi cùng nhau, để chúng không bao giờ bị lắp lẫn bộ." },
  { slug: "prototype", name: "Prototype", group: "creational", stars: 1, wave: 2, ready: true, summary: "Tạo đối tượng mới bằng cách sao chép một mẫu có sẵn thay vì dựng lại từ đầu." },

  { slug: "adapter", name: "Adapter", group: "structural", stars: 3, wave: 1, ready: true, summary: "Khi dữ liệu bên ngoài không khớp với interface của hệ thống, Adapter đứng giữa để chuyển đổi, như một cục chuyển đổi phích cắm." },
  { slug: "decorator", name: "Decorator", group: "structural", stars: 3, wave: 1, ready: true, summary: "Bọc thêm cache, log hay retry quanh một đối tượng mà không phải sửa lớp gốc." },
  { slug: "facade", name: "Facade", group: "structural", stars: 3, wave: 1, ready: true, summary: "Gom cả một chuỗi thao tác rắc rối về sau một cửa duy nhất, để bên gọi chỉ cần một lệnh." },
  { slug: "proxy", name: "Proxy", group: "structural", stars: 2, wave: 1, ready: true, summary: "Đứng thay đối tượng thật để kiểm tra quyền, chỉ tải khi thật sự cần, hoặc giữ sẵn kết quả." },
  { slug: "composite", name: "Composite", group: "structural", stars: 2, wave: 1, ready: true, summary: "Xử lý một món hàng lẻ và cả một thùng hàng nhiều tầng theo cùng một cách." },
  { slug: "bridge", name: "Bridge", group: "structural", stars: 1, wave: 2, ready: true, summary: "Tách hai hướng thay đổi độc lập, chẳng hạn kênh gửi và loại thông báo, để số lớp không nhân lên theo cấp số." },
  { slug: "flyweight", name: "Flyweight", group: "structural", stars: 1, wave: 2, ready: true, summary: "Dùng chung phần dữ liệu không đổi giữa rất nhiều đối tượng để tiết kiệm bộ nhớ." },

  { slug: "strategy", name: "Strategy", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Đổi cách tính ngay lúc chạy, chẳng hạn chọn công thức tính phí giao hàng, mà không phải sửa chỗ gọi." },
  { slug: "observer", name: "Observer", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Một nơi phát sự kiện, nhiều nơi lắng nghe, và không bên nào cần biết bên kia là ai." },
  { slug: "chain-of-responsibility", name: "Chain of Responsibility", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Chuyển yêu cầu qua một chuỗi người xử lý, ai lo được thì giữ lại, giống middleware hay luồng duyệt chi." },
  { slug: "command", name: "Command", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Đóng gói mỗi yêu cầu thành một đối tượng để xếp hàng, chạy lại hoặc hoàn tác, như job trong queue." },
  { slug: "state", name: "State", group: "behavioral", stars: 3, wave: 1, ready: true, summary: "Để hành vi tự đổi theo trạng thái hiện tại, như luồng duyệt hồ sơ hay vòng đời một đơn hàng." },
  { slug: "template-method", name: "Template Method", group: "behavioral", stars: 2, wave: 1, ready: true, summary: "Giữ cố định trình tự các bước và chỉ cho lớp con thay vài bước bên trong." },
  { slug: "iterator", name: "Iterator", group: "behavioral", stars: 2, wave: 2, ready: true, summary: "Duyệt qua một tập hợp mà không cần biết bên trong nó được lưu ra sao." },
  { slug: "mediator", name: "Mediator", group: "behavioral", stars: 1, wave: 2, ready: true, summary: "Cho các bên trao đổi qua một trung gian thay vì gọi thẳng vào nhau." },
  { slug: "memento", name: "Memento", group: "behavioral", stars: 1, wave: 2, ready: true, summary: "Chụp lại trạng thái của một đối tượng để có thể khôi phục về sau." },
  { slug: "interpreter", name: "Interpreter", group: "behavioral", stars: 1, wave: 2, ready: true, summary: "Đánh giá một ngôn ngữ biểu thức nhỏ, chẳng hạn các điều kiện phân quyền." },
  { slug: "visitor", name: "Visitor", group: "behavioral", stars: 1, wave: 2, ready: true, summary: "Thêm thao tác mới lên một cây đối tượng mà không phải sửa từng lớp trong cây." },
];

// Finished pages in the order the module page lists them: group by group, then
// catalog order. Pattern pages use it for their previous and next links.
export const READING_ORDER = GROUPS.flatMap((group) => PATTERNS.filter((p) => p.group === group.id && p.ready));
