// Khi chưa có Adapter: logic chuyển đổi của mọi ngân hàng nằm ngay trong hệ thống đối soát.
type Row = Record<string, any>;

function importRows(bank: string, rows: Row[]) {
  return rows.map((row) => {
    switch (bank) {
      case "A":
        return { amount: row.amount, reference: row.desc, bookedAt: `${row.time.replace(" ", "T")}+07:00` };
      case "B": {
        const [day, month, rest] = row.postingDate.split("/");
        const [year, clock] = rest.split(" ");
        return { amount: Number(row.creditAmount.replaceAll(".", "")), reference: row.remark, bookedAt: `${year}-${month}-${day}T${clock}:00+07:00` };
      }
      case "C":
        return { amount: Math.round(Number(row.txnAmt)), reference: row.narrative, bookedAt: new Date(row.valueDate).toISOString() };
      default:
        throw new Error(`Chưa hỗ trợ ngân hàng ${bank}`); // thêm ngân hàng = sửa hàm này
    }
  });
}

function reconcile(statements: Record<string, Row[]>): number {
  let total = 0;
  for (const [bank, rows] of Object.entries(statements)) {
    for (const item of importRows(bank, rows)) total += item.amount;
  }
  return total;
}

console.log(reconcile({
  A: [{ amount: 1250000, desc: "TT HD 1023", time: "2026-10-30 09:12:05" }],
  B: [{ creditAmount: "860.000", remark: "TT HD 1024", postingDate: "30/10/2026 10:40" }],
  C: [{ txnAmt: "2400000.00", narrative: "TT HD 1025", valueDate: 1793333100000 }],
}));
