// The Memento figure's model: a shipping-fee configuration with three fields,
// two saved versions, one bad bulk change and two restores. build.mjs inlines this
// file, so the faders, the displays, the readout and the captions all come from
// it; transcript() prints the same table as code/memento.py, and the build checks
// that the two agree.

export const SAMPLE = { value: 250000, km: 5 };

// Each field sits on one motorised fader with a log scale, the way a mixing desk
// spreads its range: equal steps along the slot are equal ratios of the value.
export const FIELDS = [
  { key: "base", label: "PHÍ GỐC", min: 5000, max: 500000 },
  { key: "perKm", label: "MỖI KM", min: 1000, max: 100000 },
  { key: "freeFrom", label: "MIỄN PHÍ TỪ", min: 100000, max: 10000000 },
];

export const V1 = { base: 15000, perKm: 4000, freeFrom: 300000 };
export const V2 = { base: 20000, perKm: 2500, freeFrom: 500000 };
// Someone passed 10 meaning "raise by 10%", and the bulk update multiplied every field by 10.
export const BULK_FACTOR = 10;
export const BAD = { base: V2.base * BULK_FACTOR, perKm: V2.perKm * BULK_FACTOR, freeFrom: V2.freeFrom * BULK_FACTOR };

export const fee = (config, order = SAMPLE) => (order.value >= config.freeFrom ? 0 : config.base + order.km * config.perKm);

export const STEPS = [
  { action: "save", label: "Lưu v1", short: "Lưu v1", version: "v1", slot: 0, config: V1, row: "lưu v1" },
  { action: "save", label: "Lưu v2", short: "Lưu v2", version: "v2", slot: 1, config: V2, row: "lưu v2" },
  { action: "bulk", label: "Sửa hàng loạt", short: "Sửa sai", config: BAD, row: "sửa hàng loạt" },
  { action: "restore", label: "Khôi phục v2", short: "Về v2", version: "v2", slot: 1, config: V2, row: "khôi phục v2" },
  { action: "restore", label: "Khôi phục v1", short: "Về v1", version: "v1", slot: 0, config: V1, row: "khôi phục v1" },
];

// Where a value sits along its fader (0 at the bottom, 1 at the top), and back.
export const position = (field, value) => Math.log(value / field.min) / Math.log(field.max / field.min);
export function valueAt(field, p) {
  const raw = field.min * (field.max / field.min) ** p;
  const step = 10 ** (Math.floor(Math.log10(raw)) - 2);
  return Math.round(raw / step) * step;
}

// 1250000 -> "1.250.000", the way the displays and the examples group digits.
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// The table code/memento.py prints, rebuilt from the steps above.
export function transcript() {
  const pad = (text, width) => String(text).padStart(width);
  const lines = ["Bước".padEnd(15) + pad("Phí gốc", 9) + pad("Mỗi km", 9) + pad("Miễn phí từ", 13) + pad("Đơn mẫu", 12)];
  for (const step of STEPS) {
    const c = step.config;
    lines.push(step.row.padEnd(15) + pad(groupVND(c.base), 9) + pad(groupVND(c.perKm), 9) + pad(groupVND(c.freeFrom), 13) + pad(groupVND(fee(c)), 10) + " ₫");
  }
  return lines.join("\n");
}
