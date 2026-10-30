// Khi chưa có Command: mỗi request sửa thẳng tồn kho ngay lúc nó tới.
const inventory = { stock: 100 };

// Handler của API: nhận request là làm luôn, không để lại dấu vết gì.
function handleReceive(qty: number): void {
  inventory.stock += qty;
}

function handleShip(qty: number): void {
  if (qty > inventory.stock) throw new Error("Không đủ hàng");
  inventory.stock -= qty;
}

handleReceive(50);
handleShip(20);
handleShip(15);
console.log(inventory.stock);
// Lần xuất cuối bị nhập nhầm? Không có gì ghi lại
// lần cuối là thao tác nào, với bao nhiêu hàng.
