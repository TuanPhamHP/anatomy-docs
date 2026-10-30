// Decorator: thêm log, thử lại, cache quanh một nguồn tỷ giá mà không sửa nó.
// Chạy: node decorator.ts   (Node 22.18 trở lên chạy thẳng TypeScript)

// Component: interface chung. Lõi và mọi lớp bọc đều có đúng hàm này.
interface RateSource {
  getRate(pair: string): number;
}

class TimeoutError extends Error {}

// Concrete component: gọi API tỷ giá thật (ở đây giả lập: lỗi `fails` lần đầu).
class HttpRateSource implements RateSource {
  calls = 0;
  private readonly fails: number;

  constructor(fails = 0) {
    this.fails = fails;
  }

  getRate(pair: string): number {
    this.calls += 1;
    if (this.calls <= this.fails) throw new TimeoutError("hết thời gian chờ");
    return 25380;
  }
}

const vnd = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Decorator: giữ một RateSource bên trong, và chính nó cũng là một RateSource.
class LoggingSource implements RateSource {
  readonly inner: RateSource;
  lines = 0;

  constructor(inner: RateSource) {
    this.inner = inner;
  }

  getRate(pair: string): number {
    let rate: number;
    try {
      rate = this.inner.getRate(pair);
    } catch (error) {
      this.log(`get_rate(${pair}) -> lỗi: ${(error as Error).message}`);
      throw error;
    }
    this.log(`get_rate(${pair}) -> ${vnd(rate)}`);
    return rate;
  }

  private log(text: string) {
    this.lines += 1;
    console.log(`   [log] ${text}`);
  }
}

class RetrySource implements RateSource {
  readonly inner: RateSource;
  private readonly tries: number;
  lastTries = 0;

  constructor(inner: RateSource, tries = 3) {
    this.inner = inner;
    this.tries = tries;
  }

  getRate(pair: string): number {
    for (let attempt = 1; ; attempt++) {
      this.lastTries = attempt;
      try {
        return this.inner.getRate(pair);
      } catch (error) {
        if (!(error instanceof TimeoutError) || attempt === this.tries) throw error;
        console.log(`   [retry] thử lại, lần ${attempt + 1}/${this.tries}`);
      }
    }
  }
}

class CachingSource implements RateSource {
  readonly inner: RateSource;
  private readonly saved = new Map<string, number>();
  hits = 0;

  constructor(inner: RateSource) {
    this.inner = inner;
  }

  getRate(pair: string): number {
    const saved = this.saved.get(pair);
    if (saved !== undefined) {
      this.hits += 1;
      console.log(`   [cache] trúng: ${pair}`);
      return saved;
    }
    const rate = this.inner.getRate(pair);
    this.saved.set(pair, rate);
    return rate;
  }
}

const nameOf = (source: RateSource): string => {
  const inner = (source as { inner?: RateSource }).inner;
  return source.constructor.name + (inner ? `(${nameOf(inner)})` : "");
};

// Client: chỉ biết RateSource, không biết bên dưới có mấy lớp bọc.
function show(n: number, source: RateSource, api: HttpRateSource, opts: { calls?: number; note?: string; log?: LoggingSource; retry?: RetrySource; cache?: CachingSource } = {}) {
  const calls = opts.calls ?? 1;
  console.log(`${n}. ${nameOf(source)}${opts.note ?? ""}`);
  let rate = 0;
  for (let i = 0; i < calls; i++) rate = source.getRate("USD/VND");
  const parts = [`USD/VND = ${vnd(rate)} ₫${calls > 1 ? ` (x${calls})` : ""}`];
  if (opts.cache) parts.push(`cache trúng: ${opts.cache.hits}`);
  if (opts.retry) parts.push(`lần thử: ${opts.retry.lastTries}`);
  if (opts.log) parts.push(`log: ${opts.log.lines}`);
  parts.push(`gọi API: ${api.calls}`);
  console.log(`   ${parts.join(" | ")}`);
}

// 1. Lõi trần.
{
  const api = new HttpRateSource();
  show(1, api, api);
}
// 2. Bọc log quanh lõi.
{
  const api = new HttpRateSource();
  const log = new LoggingSource(api);
  show(2, log, api, { log });
}
// 3. Bọc thêm thử lại; API lỗi lần đầu.
{
  const api = new HttpRateSource(1);
  const log = new LoggingSource(api);
  const retry = new RetrySource(log);
  show(3, retry, api, { note: ", API lỗi lần đầu", log, retry });
}
// 4. Bọc thêm cache ngoài cùng; gọi hai lần cùng một cặp tiền.
{
  const api = new HttpRateSource();
  const log = new LoggingSource(api);
  const retry = new RetrySource(log);
  const cache = new CachingSource(retry);
  show(4, cache, api, { calls: 2, note: ", gọi 2 lần", log, retry, cache });
}
