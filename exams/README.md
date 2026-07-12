# Bộ dữ liệu CBAP Practice Questions — Đã chuẩn hóa

> **[CẬP NHẬT v3 — 07/2026]** Dữ liệu đã được thay bằng bản fix trong `../CBAP Case Study Fixes/` (chi tiết: `FIX_REPORT_v3.md`). Khác biệt so với mô tả bên dưới:
> - **Định dạng TSV mới**: mỗi record đúng 1 dòng vật lý, KHÔNG dùng quoting CSV; ký tự đặc biệt trong ô được escape `\n` / `\t` / `\\` (app tự unescape khi load).
> - **Bỏ cột** `source_row_index`.
> - **Cờ `data_quality` mới**: `missing_subquestion` (6 câu — mất câu hỏi con, question_text rỗng), `subquestion_recovered` (8 câu — đã khôi phục từ đề khác, dùng bình thường); cờ có thể ghép bằng `+` (vd `missing_all_answers+missing_subquestion`) → luôn kiểm tra bằng `includes()`. Cờ `missing_image` không còn.
> - **14 câu** sửa `is_case_study` false→true; số cụm case study 271→273; có case study `group_size=1`.
> - `quality_report.tsv` giờ có 65 dòng + cột `note`.
> - **Ảnh sơ đồ**: bộ v3 tham chiếu **17 ảnh** (tên = 16 ký tự đầu SHA-256 nội dung). 11 ảnh không có sẵn đã được trích xuất lại từ dump nguồn `Post from Tung Nguyen.txt` (script tự động, đã kiểm chứng hash khớp 100%). Cột `image_files` đã được vá cho 5 câu có placeholder trong context nhóm nhưng thiếu tên file.

## 1. Tổng quan

Nguồn: `post.tsv` (2.389 dòng, 4 cột: ID, Question order, Question content, Metadata)
Kết quả: 3 file TSV chuẩn hóa theo mô hình quan hệ (2NF) + thư mục ảnh trích xuất.

| File | Nội dung | Số dòng |
|---|---|---|
| `questions.tsv` | 1 dòng = 1 câu hỏi | 2.389 |
| `answers.tsv` | 1 dòng = 1 đáp án (FK: question_id) | 9.357 |
| `quality_report.tsv` | Danh sách các câu có vấn đề dữ liệu, kèm lý do | 56 |
| `images/` | Ảnh sơ đồ (PNG) trích xuất từ base64, đặt tên theo hash nội dung | 17 file |

Dữ liệu bao trùm **21 đề thi**, mỗi đề chuẩn 120 câu, được đánh số lại theo cột `exam_number` (dựa vào việc `question_order` reset về 1).

## 2. Cấu trúc bảng

### `questions.tsv`
| Cột | Ý nghĩa |
|---|---|
| `question_id` | ID gốc, khóa chính |
| `exam_number` | Số thứ tự đề (1–21) |
| `question_order` | Vị trí câu trong đề (1–120) |
| `group_id` | ID câu đầu tiên của cụm case-study (nếu câu đứng riêng thì group_id = question_id) |
| `group_position` / `group_size` | Vị trí và tổng số câu trong cụm case-study |
| `is_case_study` | true nếu câu này thuộc một case study nhiều câu hỏi con |
| `context` | Đoạn tình huống/case study dùng chung (chỉ có khi `is_case_study=true`) |
| `question_text` | Nội dung câu hỏi thực sự cần trả lời |
| `image_files` | Tên file ảnh liên quan (trong `images/`), cách nhau bởi `;` nếu có |
| `answer_count` | Số đáp án thực có trong dữ liệu (chuẩn là 4) |
| `correct_answer_letter` | Chữ cái đáp án đúng (a/b/c/d), rỗng nếu không xác định được |
| `data_quality` | `ok` hoặc cờ vấn đề (xem mục 3) |
| `source_row_index` | Vị trí dòng gốc trong `post.tsv` (để truy vết) |

### `answers.tsv`
| Cột | Ý nghĩa |
|---|---|
| `question_id` | FK tới `questions.question_id` |
| `letter` | a / b / c / d |
| `content` | Nội dung đáp án |
| `is_correct` | true/false |
| `feedback` | Giải thích riêng cho đáp án đó (BABOK reference nếu có) |

**Vì sao tách 2 bảng thay vì 1 bảng rộng (answer_a, answer_b...)?** Vì có một số câu chỉ còn 1–3 đáp án (dữ liệu gốc bị thiếu — xem mục 3), tách bảng giúp không tạo cột rỗng giả và dễ mở rộng khi nạp vào SQLite/Postgres cho app ôn tập.

## 3. Các lỗi dữ liệu gốc đã phát hiện và cách xử lý

### 3.1 Lỗi encode JSON (đã sửa, không mất dữ liệu)
~44% các dòng (1.064/2.389) có metadata bị escape kép (`\\"` thay vì `\"`) khiến JSON không parse được trực tiếp — thường xảy ra khi nội dung câu hỏi/đáp án chứa dấu ngoặc kép hoặc câu hỏi phụ (sub) chứa HTML. Đã viết lại thuật toán sửa escape và **parse thành công 100% (2.389/2.389)** — không có dòng nào bị bỏ qua vì lỗi này.

### 3.2 Câu hỏi có case study dùng chung (sub-question)
797 câu (thuộc 271 cụm case study, từ 2–5 câu/cụm) chia sẻ chung một đoạn tình huống (`context`) nhưng có câu hỏi cụ thể khác nhau (`sub`). Đã tách riêng `context` và `question_text` để tránh lặp dữ liệu và giúp hiển thị đúng trong app (hiện case study 1 lần, các câu hỏi con bên dưới).

### 3.3 Câu hỏi thiếu đáp án (43 câu — `missing_all_answers`)
Các câu này còn nguyên đề bài nhưng phần `answers` trong dữ liệu gốc trống hoàn toàn (không có 4 đáp án, không có đáp án đúng, không có giải thích). **Không thể suy luận lại đáp án đúng** nên không tự bịa — các câu này được giữ nguyên trong `questions.tsv` với `data_quality=missing_all_answers` và `answer_count=0`, không có dòng nào trong `answers.tsv`.

Phân bố: chủ yếu rơi vào **Đề 20 (13 câu)** và **Đề 21 (18 câu)** — hai đề thi có vẻ bị lỗi export nặng nhất. Đề 7 chỉ có 5 câu (thay vì 120) — nhiều khả năng exam này bị cắt cụt hoàn toàn ngay từ nguồn.

Đề xuất xử lý trong app: lọc các câu này ra khỏi chế độ "làm bài trắc nghiệm", nhưng vẫn hiện trong danh sách "câu cần bổ sung dữ liệu" để bạn tra cứu lại đáp án đúng theo tài liệu BABOK gốc sau.

### 3.4 Câu hỏi thiếu bớt đáp án nhiễu (10 câu — `missing_distractors`)
Các câu này chỉ còn 1–2 trong 4 đáp án, nhưng **đáp án đúng + giải thích vẫn còn đầy đủ**. Có thể dùng ở chế độ "flashcard" (xem câu hỏi → xem đáp án đúng & giải thích) dù không đủ để làm trắc nghiệm 4 lựa chọn.

### 3.5 Ảnh sơ đồ (diagram) nhúng base64
47 câu hỏi có nhúng ảnh sơ đồ (Use Case Diagram, Value Stream Map...) dưới dạng base64 trong HTML. Đã:
- Giải mã và lưu thành **6 file PNG thật** trong `images/` (nhiều câu dùng chung 1 ảnh do lặp lại giữa các đề — đã gộp theo hash nội dung để tránh trùng lặp).
- Gắn tên file vào cột `image_files` của câu hỏi tương ứng, thay thế thẻ `<img>` trong text bằng placeholder `[HÌNH ẢNH: tên_file.png]`.
- **3 câu** có dữ liệu ảnh bị cắt cụt ngay tại nguồn (base64 không đầy đủ, không thể giải mã) → gắn cờ `missing_image`, giữ nguyên câu hỏi text nhưng không có ảnh. Các câu này cần bạn tìm lại sơ đồ gốc để bổ sung thủ công.

Đã kiểm tra bằng PIL: cả 6 ảnh trích xuất đều mở được và hiển thị đúng nội dung (đã xem trực tiếp 1 ảnh mẫu để xác nhận).

## 4. Kiểm tra tính toàn vẹn (đã thực hiện)
- ✅ 2.389/2.389 `question_id` duy nhất, không trùng lặp.
- ✅ 100% dòng trong `answers.tsv` tham chiếu đúng `question_id` tồn tại trong `questions.tsv`.
- ✅ 100% `correct_answer_letter` (khi có) khớp với đáp án được đánh dấu đúng trong `answers.tsv`.
- ✅ Không còn thẻ HTML sót lại trong text (đã strip toàn bộ, giữ lại nội dung + xuống dòng hợp lý).
- ✅ Không còn ký tự escape thừa (`\'`, `\"`) trong nội dung.

## 5. Gợi ý dùng cho app ôn tập
- Bảng `questions` + `answers` nạp thẳng vào SQLite là dùng được ngay (question_id làm khóa chính/khóa ngoại).
- Lọc theo `data_quality = 'ok'` nếu muốn chỉ giữ câu hỏi hoàn chỉnh 100% cho chế độ thi thử.
- Dùng `exam_number` + `question_order` để tái tạo lại đúng 21 đề gốc, hoặc bỏ qua và trộn ngẫu nhiên theo knowledge area sau này (khi bạn gắn thêm nhãn KA).
- Với case study nhiều câu (`is_case_study=true`), nên hiển thị `context` một lần rồi liệt kê các câu con theo `group_position` để giữ đúng trải nghiệm đề thi gốc.
