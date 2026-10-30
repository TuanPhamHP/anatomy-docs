"""Khi chưa có Decorator: log, thử lại, cache viết thẳng vào client gọi API, bật tắt bằng cờ."""


class RateClient:
    def __init__(self, log: bool = False, retries: int = 1, cache: bool = False, fails: int = 0) -> None:
        self.log = log
        self.retries = retries
        self.cache = cache
        self.calls = 0
        self._fails = fails  # giả lập: API lỗi vài lần đầu
        self._saved: dict[str, int] = {}

    def get_rate(self, pair: str) -> int:
        if self.cache and pair in self._saved:
            return self._saved[pair]
        for attempt in range(1, self.retries + 1):
            try:
                self.calls += 1  # gọi API thật
                if self.calls <= self._fails:
                    raise TimeoutError("hết thời gian chờ")
                rate = 25380
                if self.log:
                    print(f"[log] get_rate({pair}) -> {rate}")
                if self.cache:
                    self._saved[pair] = rate
                return rate
            except TimeoutError as error:
                if self.log:
                    print(f"[log] get_rate({pair}) -> lỗi: {error}")
                if attempt == self.retries:
                    raise
        raise AssertionError("không tới được đây")


if __name__ == "__main__":
    client = RateClient(log=True, retries=3, cache=True)
    client.get_rate("USD/VND")
    print(client.get_rate("USD/VND"), "| gọi API:", client.calls)
