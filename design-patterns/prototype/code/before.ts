// Trước khi có Prototype: chép tay từng trường của gói mẫu sang hợp đồng mới.

type Item = { name: string; price: number };

class ServicePackage {
  name: string;
  customer: string;
  items: Item[];
  terms: Record<string, string>;

  constructor(name: string, customer: string, items: Item[], terms: Record<string, string> = {}) {
    this.name = name;
    this.customer = customer;
    this.items = items;
    this.terms = terms;
  }

  total(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}

const vnd = (amount: number): string => String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";

// Gói mẫu do phòng kinh doanh cấu hình, thường được đọc từ cơ sở dữ liệu.
function loadStandard(): ServicePackage {
  return new ServicePackage(
    "Bảo trì tiêu chuẩn",
    "",
    [
      { name: "Kiểm tra định kỳ", price: 2_400_000 },
      { name: "Vệ sinh thiết bị", price: 1_200_000 },
      { name: "Hỗ trợ từ xa", price: 1_800_000 },
    ],
    { "thanh toán": "30 ngày", "bảo hành": "12 tháng" },
  );
}

const standard = loadStandard();

// Mỗi hợp đồng mới lại chép tay từng trường. Trường terms được thêm vào sau nên
// chỗ này quên chép, còn items chỉ chép tham chiếu tới danh sách của gói mẫu.
const contract = new ServicePackage(standard.name, "An Phát", standard.items);
contract.items.push({ name: "Hỗ trợ ngoài giờ", price: 1_500_000 });

const terms = Object.keys(contract.terms).length ? JSON.stringify(contract.terms) : "thiếu";
console.log(`Hợp đồng ${contract.customer}: ${contract.items.length} hạng mục, ${vnd(contract.total())}, điều khoản: ${terms}`);
console.log(`Gói mẫu: ${standard.items.length} hạng mục, ${vnd(standard.total())}`);
