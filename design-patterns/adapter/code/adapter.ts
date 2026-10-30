// Adapter: đưa giao dịch của nhiều ngân hàng về một interface chung.
// Chạy: node adapter.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

// Target: dạng dữ liệu và interface mà hệ thống đối soát chờ đợi.
interface Transaction {
  amount: number; // VND, số nguyên
  reference: string;
  bookedAt: string; // ISO 8601, giờ Việt Nam
}

interface TransactionSource {
  transactions(): Transaction[];
}

// Adaptee: client của từng ngân hàng. Mình không sửa được code này.
class BankAClient {
  fetch() {
    return [{ amount: 1250000, desc: "TT HD 1023", time: "2026-10-30 09:12:05" }];
  }
}

class BankBClient {
  getStatement() {
    return [{ creditAmount: "860.000", remark: "TT HD 1024", postingDate: "30/10/2026 10:40" }];
  }
}

class BankCClient {
  listTxns() {
    return [{ txnAmt: "2400000.00", narrative: "TT HD 1025", valueDate: 1793333100000 }];
  }
}

const pad = (n: number) => String(n).padStart(2, "0");

// Epoch ms -> ISO giờ Việt Nam (UTC+7), không phụ thuộc múi giờ của máy chạy.
function isoVN(ms: number): string {
  const t = new Date(ms + 7 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}+07:00`;
}

// Adapter: mỗi ngân hàng một lớp. Lớp nào cũng chỉ làm một việc là chuyển đổi.
class BankAAdapter implements TransactionSource {
  private readonly client: BankAClient;

  constructor(client: BankAClient) {
    this.client = client;
  }

  transactions(): Transaction[] {
    return this.client.fetch().map((row) => ({
      amount: row.amount,
      reference: row.desc,
      bookedAt: `${row.time.replace(" ", "T")}+07:00`,
    }));
  }
}

class BankBAdapter implements TransactionSource {
  private readonly client: BankBClient;

  constructor(client: BankBClient) {
    this.client = client;
  }

  transactions(): Transaction[] {
    return this.client.getStatement().map((row) => {
      const [day, month, rest] = row.postingDate.split("/");
      const [year, clock] = rest.split(" ");
      return {
        amount: Number(row.creditAmount.replaceAll(".", "")), // "860.000" -> 860000
        reference: row.remark,
        bookedAt: `${year}-${month}-${day}T${clock}:00+07:00`,
      };
    });
  }
}

class BankCAdapter implements TransactionSource {
  private readonly client: BankCClient;

  constructor(client: BankCClient) {
    this.client = client;
  }

  transactions(): Transaction[] {
    return this.client.listTxns().map((row) => ({
      amount: Math.round(Number(row.txnAmt)), // "2400000.00" -> 2400000
      reference: row.narrative,
      bookedAt: isoVN(row.valueDate),
    }));
  }
}

// Client: hệ thống đối soát. Nó chỉ biết TransactionSource, không biết ngân hàng nào.
class Reconciler {
  private readonly sources: TransactionSource[];

  constructor(sources: TransactionSource[]) {
    this.sources = sources;
  }

  all(): Transaction[] {
    return this.sources.flatMap((source) => source.transactions());
  }

  total(): number {
    return this.all().reduce((sum, t) => sum + t.amount, 0);
  }
}

const vnd = (n: number) => n.toLocaleString("vi-VN");

const reconciler = new Reconciler([
  new BankAAdapter(new BankAClient()),
  new BankBAdapter(new BankBClient()),
  new BankCAdapter(new BankCClient()),
]);
for (const t of reconciler.all()) {
  console.log(`${vnd(t.amount).padStart(9)} ₫  ${t.reference}  ${t.bookedAt}`);
}
console.log(`Tổng: ${vnd(reconciler.total())} ₫`);
