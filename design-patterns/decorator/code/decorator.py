"""Decorator: thêm log, thử lại, cache quanh một nguồn tỷ giá mà không sửa nó.

Chạy: python3 decorator.py
"""
from typing import Protocol


# Component: interface chung. Lõi và mọi lớp bọc đều có đúng hàm này.
class RateSource(Protocol):
    def get_rate(self, pair: str) -> int: ...


# Concrete component: gọi API tỷ giá thật (ở đây giả lập: lỗi `fails` lần đầu).
class HttpRateSource:
    def __init__(self, fails: int = 0) -> None:
        self.calls = 0
        self._fails = fails

    def get_rate(self, pair: str) -> int:
        self.calls += 1
        if self.calls <= self._fails:
            raise TimeoutError("hết thời gian chờ")
        return 25380


# Decorator: giữ một RateSource bên trong, và chính nó cũng là một RateSource.
class LoggingSource:
    def __init__(self, inner: RateSource) -> None:
        self._inner = inner
        self.lines = 0

    def get_rate(self, pair: str) -> int:
        try:
            rate = self._inner.get_rate(pair)
        except TimeoutError as error:
            self._log(f"get_rate({pair}) -> lỗi: {error}")
            raise
        self._log(f"get_rate({pair}) -> {vnd(rate)}")
        return rate

    def _log(self, text: str) -> None:
        self.lines += 1
        print(f"   [log] {text}")


class RetrySource:
    def __init__(self, inner: RateSource, tries: int = 3) -> None:
        self._inner = inner
        self._tries = tries
        self.last_tries = 0

    def get_rate(self, pair: str) -> int:
        for attempt in range(1, self._tries + 1):
            self.last_tries = attempt
            try:
                return self._inner.get_rate(pair)
            except TimeoutError:
                if attempt == self._tries:
                    raise
                print(f"   [retry] thử lại, lần {attempt + 1}/{self._tries}")
        raise AssertionError("không tới được đây")


class CachingSource:
    def __init__(self, inner: RateSource) -> None:
        self._inner = inner
        self._saved: dict[str, int] = {}
        self.hits = 0

    def get_rate(self, pair: str) -> int:
        if pair in self._saved:
            self.hits += 1
            print(f"   [cache] trúng: {pair}")
            return self._saved[pair]
        rate = self._inner.get_rate(pair)
        self._saved[pair] = rate
        return rate


def vnd(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def name_of(source: RateSource) -> str:
    inner = getattr(source, "_inner", None)
    return type(source).__name__ + (f"({name_of(inner)})" if inner else "")


# Client: chỉ biết RateSource, không biết bên dưới có mấy lớp bọc.
def show(n: int, source: RateSource, api: HttpRateSource, calls: int = 1, note: str = "", **probes) -> None:
    print(f"{n}. {name_of(source)}{note}")
    for _ in range(calls):
        rate = source.get_rate("USD/VND")
    parts = [f"USD/VND = {vnd(rate)} ₫" + (f" (x{calls})" if calls > 1 else "")]
    if "cache" in probes:
        parts.append(f"cache trúng: {probes['cache'].hits}")
    if "retry" in probes:
        parts.append(f"lần thử: {probes['retry'].last_tries}")
    if "log" in probes:
        parts.append(f"log: {probes['log'].lines}")
    parts.append(f"gọi API: {api.calls}")
    print("   " + " | ".join(parts))


if __name__ == "__main__":
    # 1. Lõi trần.
    api = HttpRateSource()
    show(1, api, api)

    # 2. Bọc log quanh lõi.
    api = HttpRateSource()
    log = LoggingSource(api)
    show(2, log, api, log=log)

    # 3. Bọc thêm thử lại; API lỗi lần đầu.
    api = HttpRateSource(fails=1)
    log = LoggingSource(api)
    retry = RetrySource(log)
    show(3, retry, api, note=", API lỗi lần đầu", log=log, retry=retry)

    # 4. Bọc thêm cache ngoài cùng; gọi hai lần cùng một cặp tiền.
    api = HttpRateSource()
    log = LoggingSource(api)
    retry = RetrySource(log)
    cache = CachingSource(retry)
    show(4, cache, api, calls=2, note=", gọi 2 lần", log=log, retry=retry, cache=cache)
