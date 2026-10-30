# Văn phong cho các bài design pattern

Người đọc là lập trình viên Việt Nam. Viết như một người đi trước đang giải thích cho đồng nghiệp: câu trọn vẹn, nối với nhau bằng liên từ, đọc lên nghe tự nhiên. Không viết kiểu ghi chú hay gạch đầu dòng nhồi chữ.

## Quy tắc

1. **Câu trọn vẹn, có mạch.** Nối ý bằng *vì, nên, nhưng, khi, thì, để, nhờ vậy, thay vì, trong khi*. Đoạn sau tiếp ý đoạn trước. Không có câu cụt như "Một cửa hàng online."; hãy viết "Hãy hình dung một cửa hàng online."
2. **Ít dấu hai chấm và chấm phẩy.** Mỗi đoạn văn tối đa một dấu hai chấm. Không xâu chuỗi "X: Y; Z". Muốn tách ý thì chấm câu rồi viết câu mới.
3. **Không chú thích trong ngoặc giữa câu.** Giới thiệu thuật ngữ tiếng Anh một lần, lồng vào câu: "đối tượng phát sự kiện, thường gọi là subject", thay vì "đối tượng (subject)".
4. **Không dùng ký hiệu trong văn xuôi.** Các ký hiệu →, ·, ×, + chỉ dùng trong readout, bảng và code, không dùng trong câu hay caption.
5. **Thuật ngữ thống nhất:**
   - Dùng *lớp* (class), *đối tượng* (object), *phương thức* (method), *interface*.
   - Giữ nguyên các từ quen thuộc với dân lập trình: cache, log, retry, queue, middleware, listener, request, API.
   - Còn lại viết tiếng Việt.
   - Số đếm nhỏ trong câu viết bằng chữ ("ba ngân hàng"). Tiền, khối lượng và số liệu viết bằng số kèm đơn vị.
6. **Dùng câu chủ động.** Tránh "được … bởi", "việc", "thực hiện", "tiến hành", "một cách", "đối với".
7. **In đậm tiết chế.** Mỗi đoạn tối đa một chỗ in đậm. Trong caption chỉ in đậm con số kết quả.
8. **Gạch đầu dòng là một ý trọn vẹn.**
   - Nếu mở bằng một câu in đậm thì câu đó phải là câu hoàn chỉnh, tiếp theo là một câu giải thích.
   - Không dùng kiểu "**Nhãn.** cụm từ".
9. **Bảng có thể viết gọn.** Riêng ô "Trong hình" nên tả bằng lời thường.
10. **Đọc thầm lại từng đoạn.** Chỗ nào người Việt đọc thấy vấp hoặc nghe như dịch máy thì viết lại.

## Từng phần

- **Lead (1–2 câu):** pattern làm gì, và vì sao cần nó. Không định nghĩa kiểu từ điển.
- **Caption dưới hình (2–3 câu):** kể cỗ máy làm gì, phần nào chuyển động, và điều đó nói gì về pattern.
- **Caption từng bước (1–2 câu, tối đa khoảng 200 ký tự):**
  - Kể chuyện gì xảy ra ở bước này và vì sao.
  - Có tối đa một định danh code trong backtick, chỉ khi nó giúp người đọc nối với code.
  - Con số kết quả có thể in đậm.
  - Không mở đầu bằng code rồi dấu hai chấm.
- **Gợi ý tương tác (hint) và readout:** được phép ngắn gọn kiểu nhãn máy.
- **Bình luận trong code ví dụ:** tiếng Việt tự nhiên, ngắn. Output in ra không được thay đổi.

## Ví dụ

Trước:
> `proxy.read(khach)`: Khách không có vai trò được xem, nên Proxy từ chối ngay ở quầy. Kho không mở, báo cáo chưa được tải: **0 lần tải**, 0 s.

Sau:
> Khách không có quyền xem báo cáo, nên Proxy từ chối ngay tại quầy. Két vẫn đóng, báo cáo chưa hề được tải: **0 lần tải**.

Trước:
> Observer cho một đối tượng (subject) báo một sự kiện tới mọi đối tượng đã đăng ký nghe nó (observer, hay listener), mà không cần biết đó là ai hay chúng làm gì.

Sau:
> Observer cho phép một đối tượng báo tin cho tất cả những ai đã đăng ký lắng nghe nó, mà không cần biết họ là ai hay sẽ làm gì với tin đó.

Trước:
> Bọc một interface lạ thành interface hệ thống đang chờ: nhiều ngân hàng, một chuẩn giao dịch.

Sau:
> Khi dữ liệu từ bên ngoài không khớp với interface hệ thống đang dùng, Adapter đứng giữa để chuyển đổi, giống một cục chuyển đổi phích cắm.

## Quiz "Kiểm tra nhanh"

Mỗi bài có file `quiz.mjs` xuất `QUIZ`, được truyền vào `patternPage({ quiz: QUIZ })`. Mẫu tham khảo là `adapter/quiz.mjs`.

- **Số câu:** 4–7 câu, nên là 5–6. Mỗi câu có 3–4 lựa chọn và đúng một đáp án (`answer` là chỉ số).
- **Phân bố đáp án:** vị trí đáp án đúng phải rải đều. Bản build sẽ báo lỗi nếu quá nửa số câu có đáp án ở cùng một vị trí.
- **Trộn các loại câu hỏi:**
  1. Tình huống thực tế: nên dùng pattern này hay cách khác.
  2. Vai trò: lớp nào trong code hoặc bộ phận nào trong hình đóng vai gì.
  3. Chuyện gì xảy ra ở một bước của hình hoặc khi chạy code. Con số phải khớp đúng với model và output.
  4. Khi nào không nên dùng, hoặc cái bẫy hay gặp.
  5. Phân biệt với pattern ở mục "Dễ nhầm với".
  6. Một chi tiết khi triển khai.
- **Lựa chọn sai phải hợp lý:** đó là những hiểu lầm có thật. Các lựa chọn dài gần bằng nhau. Không dùng "tất cả đều đúng" hay "không có đáp án nào".
- **Lời giải thích `why`:** 1–3 câu, nói vì sao đáp án đúng và vì sao lựa chọn dễ nhầm nhất lại sai.
- **Văn phong:** theo đúng các quy tắc ở trên. Định danh code đặt trong `<code>`.
