// Command: gói mỗi thao tác kho thành một đối tượng để xếp hàng, ghi lịch sử và hoàn tác.
// Chạy: node command.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

// Receiver: kho hàng. Nó chỉ biết cộng và trừ tồn kho, không biết gì về lệnh.
class Inventory {
  stock: number;

  constructor(stock: number) {
    this.stock = stock;
  }

  add(qty: number): void {
    this.stock += qty;
  }

  remove(qty: number): void {
    if (qty > this.stock) throw new Error(`Không đủ hàng: còn ${this.stock}, cần ${qty}`);
    this.stock -= qty;
  }
}

// Command: mỗi lệnh biết cách chạy và cách đảo ngược chính nó.
interface Command {
  readonly name: string;
  execute(): void;
  undo(): void;
}

class ReceiveStock implements Command {
  readonly name: string;
  private readonly inventory: Inventory;
  private readonly qty: number;

  constructor(inventory: Inventory, qty: number) {
    this.inventory = inventory;
    this.qty = qty;
    this.name = `Nhập ${qty}`;
  }

  execute(): void {
    this.inventory.add(this.qty);
  }

  undo(): void {
    this.inventory.remove(this.qty);
  }
}

class ShipStock implements Command {
  readonly name: string;
  private readonly inventory: Inventory;
  private readonly qty: number;

  constructor(inventory: Inventory, qty: number) {
    this.inventory = inventory;
    this.qty = qty;
    this.name = `Xuất ${qty}`;
  }

  execute(): void {
    this.inventory.remove(this.qty);
  }

  undo(): void {
    this.inventory.add(this.qty);
  }
}

// Invoker: chạy lệnh theo hàng đợi và giữ lịch sử. Nó không biết bên trong lệnh làm gì.
class CommandRunner {
  readonly queue: Command[] = [];
  readonly history: Command[] = [];

  submit(command: Command): void {
    this.queue.push(command);
  }

  runNext(): Command {
    const command = this.queue.shift()!;
    command.execute();
    this.history.push(command); // chỉ ghi vào lịch sử khi đã chạy xong
    return command;
  }

  undo(): Command {
    const command = this.history.pop()!; // lệnh chạy sau cùng được hoàn tác trước
    command.undo();
    return command;
  }
}

const inventory = new Inventory(100);
const runner = new CommandRunner();

// Client: tạo lệnh và xếp vào hàng đợi. Lúc này chưa có gì chạy.
for (const command of [
  new ReceiveStock(inventory, 50),
  new ShipStock(inventory, 20),
  new ShipStock(inventory, 15),
]) {
  runner.submit(command);
}
console.log(`Đang chờ ${runner.queue.length} lệnh, tồn kho ${inventory.stock}`);

while (runner.queue.length > 0) {
  const before = inventory.stock;
  const command = runner.runNext();
  console.log(`Chạy      ${command.name}: ${before} → ${inventory.stock}`);
}

const before = inventory.stock;
const undone = runner.undo();
console.log(`Hoàn tác  ${undone.name}: ${before} → ${inventory.stock}`);
console.log("Lịch sử:", runner.history.map((c) => c.name).join(", "));
