// Prototype: tạo hợp đồng mới bằng cách sao chép một gói mẫu đã cấu hình sẵn.

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

  // Chép sâu, để bản sao có danh sách hạng mục và điều khoản của riêng nó.
  // structuredClone trả về đối tượng thường nên ta dựng lại lớp quanh dữ liệu đã chép.
  clone(): ServicePackage {
    return new ServicePackage(this.name, this.customer, structuredClone(this.items), structuredClone(this.terms));
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

// Kho mẫu: mỗi loại gói có một bản mẫu đã cấu hình sẵn.
const PROTOTYPES: Record<string, ServicePackage> = { "tieu-chuan": loadStandard() };

function newContract(kind: string, customer: string): ServicePackage {
  const contract = PROTOTYPES[kind].clone();
  contract.customer = customer;
  return contract;
}

// Giống copy.copy của Python: chép các trường, còn danh sách thì vẫn dùng chung.
const shallowCopy = (pkg: ServicePackage): ServicePackage => Object.assign(Object.create(ServicePackage.prototype), pkg);

function show(label: string, pkg: ServicePackage): void {
  console.log(`  ${label}: khách ${pkg.customer || "chưa có"}, ${pkg.items.length} hạng mục, ${vnd(pkg.total())}`);
}

const standard = PROTOTYPES["tieu-chuan"];
console.log(`Gói mẫu ${standard.name}: ${standard.items.length} hạng mục, ${vnd(standard.total())}`);

const anPhat = newContract("tieu-chuan", "An Phát");
anPhat.items.push({ name: "Hỗ trợ ngoài giờ", price: 1_500_000 });
console.log("Sao chép sâu, rồi tuỳ chỉnh cho An Phát:");
show("Bản sao", anPhat);
show("Gói mẫu", standard);

// Cùng việc ấy với một bản sao nông, làm trên một gói mẫu khác để kho mẫu không hỏng.
const trap = loadStandard();
const shallow = shallowCopy(trap);
shallow.customer = "An Phát";
shallow.items.push({ name: "Hỗ trợ ngoài giờ", price: 1_500_000 });
console.log("Nếu chỉ sao chép nông:");
show("Bản sao", shallow);
show("Gói mẫu", trap);
