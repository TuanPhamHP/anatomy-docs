// The Decorator figure's model: one exchange-rate source, three wrappers that
// keep its interface, and the four steps of the scenario. simulate() runs the
// wrapped call exactly as the example code does and records where the call is
// at every moment (which ring, or the API itself) with every counter's value.
// The figure drives its press, its lit ring and every window from that trace,
// and transcript() rebuilds the example's printed output from it, so build.mjs
// can check the page against the real Python run.

export const PAIR = "USD/VND";
export const RATE = 25380; // đồng cho 1 USD
export const MAX_TRIES = 3;
export const TIMEOUT = "hết thời gian chờ";

// The rings, in the order they are screwed on (bottom to top). Each new ring
// wraps everything below it: the top ring is the object the client holds.
export const LAYERS = [
  { id: "log", cls: "LoggingSource", label: "LOG" },
  { id: "retry", cls: "RetrySource", label: "RETRY" },
  { id: "cache", cls: "CachingSource", label: "CACHE" },
];

// Each step builds a fresh stack with `rings` rings, makes `calls` identical
// calls, and lets the API time out on its first `fails` requests.
export const STEPS = [
  { rings: 0, calls: 1, fails: 0 },
  { rings: 1, calls: 1, fails: 0 },
  { rings: 2, calls: 1, fails: 1 },
  { rings: 3, calls: 2, fails: 0 },
];

// 25380 -> "25.380", the way the windows and the captions group digits.
export const groupVND = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// "CachingSource(RetrySource(LoggingSource(HttpRateSource)))" for a stack of n rings.
export const stackName = (n) => LAYERS.slice(0, n).reduce((inner, layer) => `${layer.cls}(${inner})`, "HttpRateSource");

// Run one step. Every mark says where the call is (`at`: "client", "api" or a
// ring id), what just happened there, and the counters at that moment.
export function simulate(index) {
  const step = STEPS[index];
  const state = { api: 0, log: 0, tries: 0, hits: 0, stored: null, screen: null };
  const marks = [];
  const lines = [];
  const mark = (at, what) => marks.push({ at, what, ...state });

  const api = {
    get(pair) {
      state.api += 1;
      if (state.api <= step.fails) {
        state.screen = "LỖI";
        mark("api", "error");
        throw new Error(TIMEOUT);
      }
      state.screen = RATE;
      mark("api", "ok");
      return RATE;
    },
  };
  const wrap = {
    log: (inner) => ({
      get(pair) {
        mark("log", "in");
        try {
          const rate = inner.get(pair);
          state.log += 1;
          lines.push(`   [log] get_rate(${pair}) -> ${groupVND(rate)}`);
          mark("log", "ok");
          return rate;
        } catch (error) {
          state.log += 1;
          lines.push(`   [log] get_rate(${pair}) -> lỗi: ${error.message}`);
          mark("log", "error");
          throw error;
        }
      },
    }),
    retry: (inner) => ({
      get(pair) {
        for (let attempt = 1; ; attempt++) {
          state.tries = attempt;
          mark("retry", attempt === 1 ? "in" : "again");
          try {
            const rate = inner.get(pair);
            mark("retry", "ok");
            return rate;
          } catch (error) {
            if (attempt === MAX_TRIES) throw error;
            lines.push(`   [retry] thử lại, lần ${attempt + 1}/${MAX_TRIES}`);
          }
        }
      },
    }),
    cache: (inner) => ({
      get(pair) {
        if (state.stored !== null) {
          state.hits += 1;
          lines.push(`   [cache] trúng: ${pair}`);
          mark("cache", "hit");
          return state.stored;
        }
        mark("cache", "miss");
        const rate = inner.get(pair);
        state.stored = rate;
        mark("cache", "store");
        return rate;
      },
    }),
  };

  let source = api;
  for (const layer of LAYERS.slice(0, step.rings)) source = wrap[layer.id](source);
  let rate = 0;
  for (let call = 0; call < step.calls; call++) {
    mark("client", "call");
    rate = source.get(PAIR);
    mark("client", "done");
  }
  return { marks, lines, rate, totals: { ...state } };
}

// The example's printed block for one step: the stack, what the rings printed, then the counters.
export function transcript(index) {
  const step = STEPS[index];
  const run = simulate(index);
  const t = run.totals;
  const note = step.fails ? ", API lỗi lần đầu" : step.calls > 1 ? `, gọi ${step.calls} lần` : "";
  const has = (id) => LAYERS.slice(0, step.rings).some((layer) => layer.id === id);
  const parts = [`${PAIR} = ${groupVND(run.rate)} ₫${step.calls > 1 ? ` (x${step.calls})` : ""}`];
  if (has("cache")) parts.push(`cache trúng: ${t.hits}`);
  if (has("retry")) parts.push(`lần thử: ${t.tries}`);
  if (has("log")) parts.push(`log: ${t.log}`);
  parts.push(`gọi API: ${t.api}`);
  return [`${index + 1}. ${stackName(step.rings)}${note}`, ...run.lines, `   ${parts.join(" | ")}`].join("\n");
}

export const fullTranscript = () => STEPS.map((_, index) => transcript(index)).join("\n");
