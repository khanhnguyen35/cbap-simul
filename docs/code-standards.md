# Tiêu chuẩn Mã nguồn (Code Standards) - CBAP Practice Exam Simulator

Tài liệu quy định các quy chuẩn viết mã nguồn, thiết kế cấu trúc component, và sử dụng thư viện UI Ant Design trong dự án này.

---

## 1. Nguyên tắc Chung
- **KISS (Keep It Simple, Stupid)**: Ưu tiên triển khai đơn giản, dễ hiểu, tránh kỹ thuật phức tạp không cần thiết.
- **YAGNI (You Aren't Gonna Need It)**: Chỉ phát triển các tính năng và helper thực sự cần thiết theo yêu cầu.
- **DRY (Don't Repeat Yourself)**: Gom nhóm các hàm parse TSV, định dạng thời gian, lọc dữ liệu vào thư mục `src/utils/`.

---

## 2. Tiêu chuẩn Đặt tên & Tổ chức File
- **Đặt tên file**: Sử dụng chữ thường phân tách bằng dấu gạch ngang (**kebab-case**). Tên file phải mang tính mô tả rõ ràng mục đích (ví dụ: `use-exam-timer.ts`, `question-card.tsx`).
- **Giới hạn số dòng**: Mỗi file code phải **dưới 200 dòng** để tối ưu hóa việc quản lý mã nguồn và context của AI Agent.
  - Nếu component hoặc hook vượt quá 200 dòng, bắt buộc phải tách nhỏ (modularize) thành các component con hoặc chia sẻ logic sang các helper file.
- **Quy tắc đặt tên code**:
  - React Component: **PascalCase** (ví dụ: `ExamRoomLayout`).
  - React Hooks: Tiền tố `use` + **camelCase** (ví dụ: `useTsvParser`).
  - Types / Interfaces: **PascalCase** (ví dụ: `QuestionRecord`).
  - Functions / Variables: **camelCase** (ví dụ: `parseTsvLine`).

---

## 3. Tiêu chuẩn TypeScript & React
- **Khai báo kiểu dữ liệu (Strict Typing)**: Tránh sử dụng kiểu `any`. Mọi thực thể dữ liệu từ TSV (Question, Answer, QualityReport) đều phải được định nghĩa rõ ràng trong `src/types/exam.ts`.
- **Functional Components**: Chỉ sử dụng React Functional Components kèm theo React Hooks. Không sử dụng Class Components.
- **State Management**:
  - Trạng thái cục bộ (nhập liệu, ẩn/hiển thị modal, trạng thái lật thẻ flashcard): Sử dụng `useState`.
  - Trạng thái toàn cục (dữ liệu câu hỏi/đáp án đã parse, bộ đếm thời gian, lịch sử làm bài, cấu hình chế độ thi): Sử dụng **React Context** (`ExamContext`).

---

## 4. Quy chuẩn Sử dụng Thư viện Ant Design (antd)
- **Cấu hình Theme**:
  - Sử dụng `<ConfigProvider>` của Ant Design tại file `src/App.tsx` để tùy biến giao diện đồng bộ (màu sắc primary, font-family, border-radius).
  - Tông màu chủ đạo khuyên dùng: Màu xanh dương sẫm chuyên nghiệp (ví dụ: `#1890ff` hoặc một tone đậm hơn như `#1d3557` để tăng tính học thuật và tập trung).
- **Sử dụng Component có sẵn**:
  - Không tự viết lại các UI phức tạp. Tận dụng tối đa bộ UI của Ant Design:
    - Bố cục chính: `Layout`, `Header`, `Content`, `Sider`, `Space`.
    - Danh sách đề và thống kê: `Card`, `List`, `Progress`, `Statistic`, `Tag`, `Badge`.
    - Làm bài thi: `Radio.Group` cho đáp án trắc nghiệm, `Button` để điều hướng, `Affix` để cố định panel thời gian/danh sách câu hỏi.
    - Xem ảnh sơ đồ: `Image` (có tính năng zoom tích hợp sẵn của Ant Design) hoặc `Modal`.
- **CSS Tùy biến**:
  - Chỉ viết css tùy chỉnh trong `index.css` thông qua CSS Variables để override các class của Ant Design hoặc định dạng các chi tiết bố cục phức tạp (như căn chỉnh chia đôi màn hình Split-Screen). Tránh lạm dụng inline-style trong các component React.

---

## 5. Tiêu chuẩn Xử lý Dữ liệu TSV
Do dữ liệu TSV chứa các ký tự xuống dòng trong câu hỏi tình huống (`context`) hoặc định dạng đặc thù, việc đọc dòng phải lưu ý:
- Phải xử lý đúng các ký tự thoát (`\t` cho cột, xuống dòng thực sự trong văn bản).
- Khuyến khích sử dụng thư viện `PapaParse` với cấu hình `{ delimiter: "\t", header: true }` để đảm bảo độ tin cậy và tự động chuyển đổi định dạng.
- Phải kiểm tra giá trị của trường `data_quality` trước khi nạp dữ liệu vào chế độ thi.
