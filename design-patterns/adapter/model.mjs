// The Adapter figure's model: what each bank sends, and what its adapter turns
// that into. build.mjs inlines this file into the page, so the readout and the
// machine's display show exactly these conversions. The Python and TypeScript
// examples under code/ use the same three records and print the same numbers.

export const BANKS = [
  {
    id: "A",
    plug: "round",
    field: "amount",
    sent: "vốn đã là số nguyên VND",
    how: "để nguyên con số này",
    raw: { amount: 1250000, desc: "TT HD 1023", time: "2026-10-30 09:12:05" },
  },
  {
    id: "B",
    plug: "square",
    field: "creditAmount",
    sent: "tức là một chuỗi có dấu chấm ngăn cách hàng nghìn",
    how: "bỏ dấu chấm rồi đổi chuỗi sang số",
    raw: { creditAmount: "860.000", remark: "TT HD 1024", postingDate: "30/10/2026 10:40" },
  },
  {
    id: "C",
    plug: "hex",
    field: "txnAmt",
    sent: "tức là một chuỗi số thập phân",
    how: "đọc con số rồi làm tròn về đồng",
    raw: { txnAmt: "2400000.00", narrative: "TT HD 1025", valueDate: 1793333100000 },
  },
];

const pad = (n) => String(n).padStart(2, "0");

// Epoch milliseconds to an ISO time in Vietnam (UTC+7), without relying on the host's zone.
function isoVN(ms) {
  const t = new Date(ms + 7 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}+07:00`;
}

// One adapter per bank: each knows only its own bank's shape, and all return the same one.
export const ADAPT = {
  A: (row) => ({ amount: row.amount, reference: row.desc, bookedAt: `${row.time.replace(" ", "T")}+07:00` }),
  B: (row) => {
    const [day, month, rest] = row.postingDate.split("/");
    const [year, clock] = rest.split(" ");
    return { amount: Number(row.creditAmount.replaceAll(".", "")), reference: row.remark, bookedAt: `${year}-${month}-${day}T${clock}:00+07:00` };
  },
  C: (row) => ({ amount: Math.round(Number(row.txnAmt)), reference: row.narrative, bookedAt: isoVN(row.valueDate) }),
};

// 1250000 -> "1.250.000", the way the reconciliation display groups digits.
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// The raw amount exactly as the bank sends it, for the readout.
export const rawAmount = (bank) => JSON.stringify(bank.raw[bank.field]);
