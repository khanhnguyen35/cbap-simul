# Tài liệu Mô tả Yêu cầu Phát triển Sản phẩm (PDR) - CBAP Practice Exam Simulator

Hệ thống ôn tập thi chứng chỉ CBAP (Certified Business Analysis Professional) cá nhân, sử dụng dữ liệu đề thi đã chuẩn hóa từ thư mục `exams/` và xây dựng giao diện bằng thư viện Ant Design.

---

## 1. Mục tiêu dự án
Xây dựng một ứng dụng web (SPA) chạy local giúp cá nhân ôn luyện thi chứng chỉ CBAP một cách hiệu quả nhất. Ứng dụng tận dụng bộ dữ liệu gồm **21 đề thi (gần 2.400 câu hỏi)** để cung cấp các chế độ học tập khác nhau, giao diện trực quan và các công cụ hỗ trợ phân tích kết quả.

---

## 2. Đối tượng sử dụng
- **Cá nhân tự ôn thi CBAP**: Cần công cụ để mô phỏng thi thật (120 câu/3.5 giờ), làm bài theo đề, xem giải thích chi tiết dựa trên tài liệu BABOK v3.
- **Người ôn tập có nhu cầu sàng lọc dữ liệu**: Cần phân loại các câu hỏi lỗi, câu hỏi thiếu đáp án, hoặc câu hỏi tình huống (case study) để học tập riêng.

---

## 3. Các Tính năng Chính (Features)

### 3.1. Quản lý & Lựa chọn Đề thi (Exam Dashboard)
- Hiển thị danh sách 21 đề thi.
- Trình bày thông tin tổng quan của mỗi đề: số câu hỏi thực tế (ví dụ: đề chuẩn 120 câu, đề bị thiếu như Đề 7), trạng thái hoàn thành (chưa làm, đang làm dở, đã hoàn thành), và điểm số cao nhất đạt được.
- Phân loại nhanh các câu hỏi theo chất lượng (`data_quality`): câu hỏi OK, câu hỏi thiếu đáp án (`missing_all_answers`), câu hỏi thiếu đáp án nhiễu (`missing_distractors`).

### 3.2. Chế độ Ôn tập & Thi thử (Exam Modes)
Hỗ trợ 3 chế độ ôn luyện chính:
1. **Thi mô phỏng (Simulation Mode)**:
   - Thời gian làm bài ngược: 3.5 giờ (210 phút) cho 120 câu hỏi.
   - Giao diện mô phỏng phòng thi thật. Không hiển thị kết quả và giải thích ngay lập tức.
   - Hỗ trợ đánh dấu câu hỏi (Bookmark) để xem lại sau.
   - Tự động nộp bài khi hết giờ hoặc người dùng bấm Nộp bài.
   - **Lưu ý**: Các câu hỏi thiếu đáp án nhiễu (`missing_distractors`) vẫn được giữ lại để làm bài (người dùng chọn đáp án đúng từ các lựa chọn thực tế hiện có).
2. **Chế độ Luyện tập (Practice Mode)**:
   - Không giới hạn thời gian.
   - Cho phép chọn làm theo bộ câu hỏi hoặc đề cụ thể.
   - Hiển thị ngay đáp án đúng/sai kèm giải thích (feedback) chi tiết (BABOK references) ngay sau khi chọn đáp án.
3. **Chế độ Flashcard (Flashcard Mode)**:
   - Giúp ôn luyện nhanh nhóm câu hỏi thiếu đáp án nhiễu (`missing_distractors`) nhưng vẫn còn đáp án đúng và giải thích.
   - Hiển thị câu hỏi -> Người dùng tự suy nghĩ -> Bấm lật thẻ để xem đáp án đúng và phần giải thích chi tiết.

### 3.3. Hiển thị Câu hỏi Case Study (Split-Screen Layout)
- Đối với các câu hỏi thuộc cụm tình huống (`is_case_study = true`):
  - Sử dụng bố cục chia đôi màn hình (Split-Screen): bên trái hiển thị đoạn văn cảnh (`context`), bên phải hiển thị câu hỏi cụ thể (`question_text`) và các lựa chọn đáp án.
  - Đoạn văn cảnh bên trái được giữ cố định khi người dùng di chuyển qua các câu hỏi con cùng cụm (`group_id`) để không phải đọc lại nhiều lần.
  - Hiển thị tiến trình của cụm (ví dụ: "Câu 1/4 của Case Study này").

### 3.4. Xử lý Ảnh sơ đồ (Diagram Viewer)
- Tự động hiển thị các ảnh sơ đồ tương ứng từ thư mục `exams/images/` khi câu hỏi có trường `image_files`.
- Cho phép click vào ảnh để phóng to (Modal/Lightbox) để xem rõ các chi tiết kỹ thuật (Use Case, sơ đồ luồng dữ liệu...).

### 3.5. Báo cáo & Lịch sử học tập (Analytics & History)
- Ghi lại lịch sử làm bài thi: đề số mấy, ngày làm, thời gian làm, số câu đúng/sai/bỏ qua, danh sách chi tiết các câu đã trả lời sai.
- Biểu đồ thống kê tiến độ học tập (ví dụ: Tỷ lệ hoàn thành tổng số 2.389 câu, điểm số trung bình qua các đề thi).

---

## 4. Quản lý Chất lượng Dữ liệu (Data Quality Handling)
Dựa theo thống kê từ dữ liệu gốc:
- **Câu hỏi OK**: Dùng bình thường cho tất cả các chế độ.
- **Câu hỏi thiếu đáp án (`missing_all_answers`)**: Loại khỏi chế độ thi mô phỏng và luyện tập. Chỉ hiển thị trong danh sách "Dữ liệu lỗi cần bổ sung" kèm chức năng tìm kiếm, để người dùng tra cứu tài liệu BABOK bên ngoài và tự điền đáp án bổ sung (nếu muốn).
- **Câu hỏi thiếu đáp án nhiễu (`missing_distractors`)**: Vẫn được giữ lại trong chế độ thi mô phỏng và chế độ luyện tập (người dùng chọn đáp án đúng từ các lựa chọn thực tế hiện có), đồng thời hỗ trợ ôn tập nhanh bằng chế độ Flashcard.
- **Ảnh sơ đồ bị lỗi (`missing_image`)**: Hiển thị thông báo "Hình ảnh sơ đồ bị lỗi từ nguồn gốc" để người dùng biết và tham chiếu tài liệu bên ngoài.
