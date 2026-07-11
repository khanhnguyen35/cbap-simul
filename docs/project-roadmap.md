# Lộ trình Phát triển Dự án (Project Roadmap) - CBAP Practice Exam Simulator

Tài liệu này theo dõi các giai đoạn phát triển, mốc quan trọng (milestones), và trạng thái hoàn thành của từng tác vụ trong dự án xây dựng ứng dụng ôn tập CBAP.

---

## Tổng quan các Giai đoạn (Phases Overview)

| Giai đoạn | Nội dung chính | Trạng thái |
|---|---|---|
| **Phase 1** | Khởi tạo Dự án & Phân tích Dữ liệu | `[x] Hoàn thành` |
| **Phase 2** | Thiết lập Môi trường & Thiết kế Cấu trúc Mã nguồn | `[/] Đang thực hiện` |
| **Phase 3** | Xây dựng Tầng Xử lý Dữ liệu TSV & State Management | `[ ] Chưa bắt đầu` |
| **Phase 4** | Xây dựng Giao diện Phòng thi & Bố cục Split-Screen | `[ ] Chưa bắt đầu` |
| **Phase 5** | Xây dựng Dashboard & Các Chế độ Ôn tập Hỗ trợ | `[ ] Chưa bắt đầu` |
| **Phase 6** | Tích hợp Thống kê & Hoàn thiện UI/UX | `[ ] Chưa bắt đầu` |

---

## Chi tiết các Giai đoạn & Tác vụ (Task Checklist)

### Phase 1: Khởi tạo Dự án & Phân tích Dữ liệu
- [x] Khảo sát dữ liệu TSV gốc và phân tích cấu trúc trong thư mục `exams/`.
- [x] Nhận diện và phân loại chất lượng dữ liệu: câu hỏi tốt, câu hỏi thiếu đáp án, câu hỏi thiếu đáp án nhiễu, ảnh sơ đồ.
- [x] Khởi tạo hệ thống tài liệu hướng dẫn (`docs/`) bao gồm PDR, Code Standards, System Architecture, và Roadmap này.

### Phase 2: Thiết lập Môi trường & Thiết kế Cấu trúc Mã nguồn
- [/] Khởi tạo mã nguồn React + TypeScript bằng Vite tại thư mục gốc.
- [ ] Cài đặt các thư viện thiết yếu: Ant Design (`antd`), `@ant-design/icons`, `papaparse` (parse TSV), và thư viện vẽ biểu đồ nếu cần (`recharts` hoặc `ant-design-charts` phục vụ trang Analytics).
- [ ] Thiết lập cấu hình TypeScript và cấu trúc thư mục chuẩn theo thiết kế.
- [ ] Cài đặt và cấu hình `<ConfigProvider>` của Ant Design để thiết lập màu sắc chủ đạo (Primary Theme Color) và kiểu chữ.

### Phase 3: Xây dựng Tầng Xử lý Dữ liệu TSV & State Management
- [ ] Sao chép các tệp dữ liệu từ thư mục `/exams` vào thư mục `/public/exams/` của ứng dụng React.
- [ ] Viết các helper xử lý chuỗi và parsing TSV (`tsv-helper.ts`).
- [ ] Viết Custom Hook `useTsvParser` để tải động dữ liệu và ráp nối `questions.tsv` với `answers.tsv` tại runtime.
- [ ] Thiết lập `ExamContext` để quản lý toàn bộ trạng thái làm bài, lưu trữ lịch sử và bookmark.
- [ ] Đồng bộ hóa dữ liệu lịch sử làm bài và các câu hỏi lưu dấu (bookmark) với `localStorage`.

### Phase 4: Xây dựng Giao diện Phòng thi & Bố cục Split-Screen
- [ ] Thiết kế giao diện phòng thi tổng quát sử dụng Layout của Ant Design.
- [ ] Xây dựng bộ điều hướng câu hỏi bên phải (Grid Navigation Sheet) hỗ trợ chuyển câu nhanh và đổi màu theo trạng thái làm bài.
- [ ] Xây dựng Custom Hook `useExamTimer` quản lý thời gian đếm ngược (3.5 giờ) và tự động nộp bài khi hết giờ.
- [ ] Xây dựng Layout chia đôi màn hình (Split-Screen) dành cho câu hỏi Case Study:
  - Panel trái hiển thị `context` của Case Study (cố định cuộn).
  - Panel phải hiển thị câu hỏi và 4 lựa chọn đáp án trắc nghiệm (`Radio.Group`).
- [ ] Tích hợp tính năng hiển thị và zoom ảnh sơ đồ (`image_files`) bằng Ant Design Image.

### Phase 5: Xây dựng Dashboard & Các Chế độ Ôn tập Hỗ trợ
- [ ] Thiết kế trang chủ Dashboard hiển thị 21 đề thi. Tích hợp thanh tiến trình (`Progress`) cho từng đề.
- [ ] Tích hợp bộ lọc nhanh đề thi theo chất lượng dữ liệu để người dùng chủ động tránh các đề thi bị lỗi nặng từ nguồn gốc (như Đề 7, Đề 20, Đề 21).
- [ ] Phát triển chế độ **Luyện tập (Practice Mode)**: Chọn đề, làm bài, hiển thị kết quả và giải thích (feedback) lập tức sau khi nhấn chọn.
- [ ] Phát triển chế độ **Flashcard**: Dành riêng cho ôn tập các câu bị thiếu đáp án nhiễu.

### Phase 6: Tích hợp Thống kê & Hoàn thiện UI/UX
- [ ] Xây dựng trang báo cáo thống kê lịch sử làm bài (Analytics) trực quan, hiển thị các biểu đồ tiến trình điểm số và tỷ lệ đúng/sai.
- [ ] Phát triển màn hình "Quản lý Chất lượng Dữ liệu": Liệt kê các câu hỏi thuộc nhóm `missing_all_answers` để người học tra cứu thủ công.
- [ ] Tối ưu hóa UI/UX: Hiệu ứng chuyển động mượt mà (Transitions/Micro-animations) của Ant Design, tối ưu hóa giao diện trên các kích thước màn hình máy tính thông dụng.
- [ ] Chạy thử nghiệm toàn bộ hệ thống để đảm bảo hiệu năng tải và parse dữ liệu mượt mà, không giật lag.
