// Khi chưa có Observer: dịch vụ đặt hàng tự gọi từng bên cần biết về đơn hàng.
interface Order {
  code: string;
  items: number;
  total: number; // VND
}

class EmailSender {
  sendConfirmation(order: Order) {
    console.log(`  Email: gửi xác nhận đơn ${order.code}`);
  }
}

class Inventory {
  reserve(order: Order) {
    console.log(`  Kho: giữ ${order.items} sản phẩm`);
  }
}

class Loyalty {
  addPoints(order: Order) {
    console.log(`  Điểm: cộng ${Math.floor(order.total / 10_000)} điểm`);
  }
}

class OrderService {
  private readonly email: EmailSender;
  private readonly inventory: Inventory;
  private readonly loyalty: Loyalty;

  constructor(email: EmailSender, inventory: Inventory, loyalty: Loyalty) {
    this.email = email;
    this.inventory = inventory;
    this.loyalty = loyalty;
  }

  place(order: Order) {
    console.log(`Đơn ${order.code}`);
    // ... lưu đơn hàng ...
    this.email.sendConfirmation(order);
    this.inventory.reserve(order);
    this.loyalty.addPoints(order);
    // Thêm thống kê? Phải sửa hàm này, constructor và mọi chỗ tạo OrderService.
  }
}

const service = new OrderService(new EmailSender(), new Inventory(), new Loyalty());
service.place({ code: "#1001", items: 2, total: 1_250_000 });
service.place({ code: "#1002", items: 3, total: 860_000 });
