# CBAP Practice Exam Simulator

Ứng dụng web (SPA) hỗ trợ ôn tập và luyện thi chứng chỉ CBAP (Certified Business Analysis Professional) cá nhân. Hệ thống hoạt động hoàn toàn ở client, tự động tải và xử lý bộ dữ liệu đề thi từ các file TSV chuẩn hóa.

---

## 1. Cấu trúc Dự án

```plaintext
/
├── .agent/                    # Cấu hình vai trò và kỹ năng cho AI Coding Agent
├── docs/                      # Tài liệu thiết kế hệ thống
│   ├── project-overview-pdr.md # Yêu cầu phát triển sản phẩm (PDR)
│   ├── codebase-summary.md     # Tóm tắt cấu trúc mã nguồn và tệp tin
│   ├── code-standards.md      # Quy chuẩn viết mã và sử dụng Ant Design
│   ├── system-architecture.md  # Thiết kế kiến trúc và luồng dữ liệu
│   ├── project-roadmap.md     # Tiến độ và danh sách tác vụ (Roadmap)
│   └── design-system/
│       └── design-principles.md # Hướng dẫn thiết kế giao diện & Theme Ant Design
├── exams/                     # Bộ dữ liệu đề thi CBAP chuẩn hóa
│   ├── images/                # Các sơ đồ PNG trích xuất từ dữ liệu gốc
│   ├── README.md              # Tài liệu mô tả định dạng TSV
│   ├── questions.tsv          # Bảng câu hỏi chính (2.389 câu hỏi)
│   ├── answers.tsv            # Bảng đáp án (9.357 câu trả lời)
│   └── quality_report.tsv     # Danh sách các câu hỏi bị lỗi dữ liệu gốc
├── AGENTS.md                  # Hướng dẫn quy trình hoạt động của Agent
└── README.md                  # File hướng dẫn này
```

---

## 2. Thông tin Dữ liệu Đề thi (`exams/`)

Dữ liệu đề thi bao trùm **21 đề thi (mỗi đề 120 câu)**, đã được phân tích và chuẩn hóa:
- **Questions (`questions.tsv`)**: Chứa 2.389 câu hỏi. Các câu hỏi tình huống phức tạp được gom nhóm theo `group_id` và đánh dấu `is_case_study = true` kèm đoạn tình huống `context` dùng chung.
- **Answers (`answers.tsv`)**: Chứa 9.357 dòng đáp án, liên kết ngoại tới câu hỏi qua `question_id` (mỗi câu chuẩn có 4 đáp án a/b/c/d, một số câu đặc biệt có ít hơn).
- **Hình ảnh sơ đồ (`exams/images/`)**: Gồm 6 ảnh sơ đồ PNG được trích xuất tự động và gắn liên kết vào các câu hỏi qua trường `image_files`.

*Chi tiết về cách xử lý các lỗi dữ liệu gốc (như câu hỏi thiếu đáp án, lỗi encode) vui lòng tham khảo [exams/README.md](file:///Users/khanhnguyen/Documents/CBAP%20simul/exams/README.md).*

---

## 3. Công nghệ Phát triển Đề xuất

- **Frontend Core**: React 18+ & TypeScript.
- **Build Tool**: Vite.
- **UI Component Library**: Ant Design (`antd`) và `@ant-design/icons`.
- **State Management**: React Context (`ExamContext`) lưu trữ trạng thái thi hiện tại, đồng bộ `localStorage`.
- **TSV Parser**: `PapaParse` để đọc tệp TSV nhanh chóng tại client.

---

## 4. Hướng dẫn ôn tập qua tài liệu

Để hiểu sâu hơn về thiết kế và lộ trình triển khai của hệ thống, vui lòng tham khảo các tài liệu chi tiết trong thư mục `docs/`:

1. **Yêu cầu & Tính năng**: Xem [Tài liệu PDR](file:///Users/khanhnguyen/Documents/CBAP%20simul/docs/project-overview-pdr.md).
2. **Kiến trúc & Luồng dữ liệu**: Xem [Kiến trúc hệ thống](file:///Users/khanhnguyen/Documents/CBAP%20simul/docs/system-architecture.md).
3. **Quy chuẩn mã nguồn**: Xem [Tiêu chuẩn mã nguồn](file:///Users/khanhnguyen/Documents/CBAP%20simul/docs/code-standards.md).
4. **Hướng dẫn UI/UX**: Xem [Nguyên tắc thiết kế Ant Design](file:///Users/khanhnguyen/Documents/CBAP%20simul/docs/design-system/design-principles.md).
5. **Tiến độ triển khai**: Xem [Lộ trình phát triển](file:///Users/khanhnguyen/Documents/CBAP%20simul/docs/project-roadmap.md).
