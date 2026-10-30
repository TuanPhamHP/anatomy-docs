// Khi chưa có Decorator: log, thử lại, cache viết thẳng vào client gọi API, bật tắt bằng cờ.

class RateClient {
  calls = 0;
  private readonly saved = new Map<string, number>();
  private readonly opts: { log?: boolean; retries?: number; cache?: boolean; fails?: number };

  constructor(opts: { log?: boolean; retries?: number; cache?: boolean; fails?: number } = {}) {
    this.opts = opts;
  }

  getRate(pair: string): number {
    const { log = false, retries = 1, cache = false, fails = 0 } = this.opts;
    const saved = this.saved.get(pair);
    if (cache && saved !== undefined) return saved;
    for (let attempt = 1; ; attempt++) {
      try {
        this.calls += 1; // gọi API thật
        if (this.calls <= fails) throw new Error("hết thời gian chờ"); // giả lập: API lỗi vài lần đầu
        const rate = 25380;
        if (log) console.log(`[log] get_rate(${pair}) -> ${rate}`);
        if (cache) this.saved.set(pair, rate);
        return rate;
      } catch (error) {
        if (log) console.log(`[log] get_rate(${pair}) -> lỗi: ${(error as Error).message}`);
        if (attempt === retries) throw error;
      }
    }
  }
}

const client = new RateClient({ log: true, retries: 3, cache: true });
client.getRate("USD/VND");
console.log(client.getRate("USD/VND"), "| gọi API:", client.calls);
