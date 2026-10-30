// Khi chưa có Strategy: mọi cách tính phí giao hàng nằm chung trong hàm thanh toán.
type Order = { weightKg: number; distanceKm: number; subtotal: number };

function shippingFee(rule: string, order: Order): number {
  switch (rule) {
    case "weight":
      return 15000 + Math.max(0, Math.ceil(order.weightKg - 1)) * 5000;
    case "distance":
      return order.distanceKm <= 5 ? 15000 : order.distanceKm <= 15 ? 25000 : 35000;
    case "free_over_300k":
      return order.subtotal >= 300000 ? 0 : 20000;
    default:
      throw new Error(`Chưa hỗ trợ cách tính ${rule}`); // thêm cách tính = sửa hàm này
  }
}

function checkoutTotal(rule: string, order: Order): number {
  return order.subtotal + shippingFee(rule, order);
}

const order = { weightKg: 3.5, distanceKm: 12, subtotal: 450000 };
for (const rule of ["weight", "distance", "free_over_300k"]) {
  console.log(rule, shippingFee(rule, order), checkoutTotal(rule, order));
}
