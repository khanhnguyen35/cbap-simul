# Kiến trúc Hệ thống (System Architecture) - CBAP Practice Exam Simulator

Tài liệu này mô tả kiến trúc tầng ứng dụng, luồng dữ liệu, cách tổ chức UI và tích hợp bộ dữ liệu TSV của CBAP simulator.

---

## 1. Tổng quan Kiến trúc

Hệ thống được thiết kế dưới dạng ứng dụng Client-Side Single Page Application (SPA) thuần túy. Toàn bộ logic tải dữ liệu, phân tích cú pháp, quản lý trạng thái thi, tính điểm, và lưu lịch sử đều được thực hiện hoàn toàn ở Client.

```mermaid
graph TD
    subgraph Data Layer
        TSV_Q[questions.tsv] -->|Fetch dynamic| Parser[TSV Parser / PapaParse]
        TSV_A[answers.tsv] -->|Fetch dynamic| Parser
        Parser -->|Parsed Objects| State[React ExamContext]
    end

    subgraph Logic & State Layer
        State -->|Local Persistence| LS[(LocalStorage)]
        State -->|Provides Questions & Session State| Hooks[Custom Hooks: useExamTimer, etc.]
    end

    subgraph UI Presentation Layer (Ant Design)
        Hooks --> View_Dash[Dashboard: Exam Selection]
        Hooks --> View_Exam[Exam Room: Split-Screen & Case Study]
        Hooks --> View_Flash[Flashcard Mode]
        Hooks --> View_Anal[Analytics & History Board]
        Hooks --> View_Quality[Data Quality Inspector]
    end
end
```

---

## 2. Chi tiết các Phân tầng Kiến trúc

### 2.1. Tầng Dữ liệu (Data Layer)
- **Tải tệp tĩnh (Static Fetching)**: Khi ứng dụng được mở lần đầu, React sẽ gửi yêu cầu fetch không đồng bộ để tải hai tệp `questions.tsv` và `answers.tsv` từ thư mục `public/exams/`.
- **Phân tích TSV (TSV Parser)**: 
  - Một Custom Hook `useTsvParser` sẽ chịu trách nhiệm tải dữ liệu.
  - Parser sẽ xử lý việc nối bảng: ánh xạ danh sách các bản ghi `answers` vào đúng câu hỏi `question` thông qua `question_id`.
  - Phân loại chất lượng dữ liệu: Phân chia và đánh dấu câu hỏi dựa trên trạng thái `data_quality`. Các câu hỏi tốt (`ok`) và câu hỏi thiếu đáp án nhiễu (`missing_distractors`) sẽ được nạp vào kho câu hỏi thực hành của chế độ thi thử và luyện tập. Các câu hỏi thiếu toàn bộ đáp án (`missing_all_answers`) sẽ bị loại bỏ khỏi luồng thi chính và chỉ giữ cho danh sách quản lý dữ liệu lỗi.

### 2.2. Tầng Quản lý Trạng thái (State Management Layer)
Toàn bộ dữ liệu sau khi parse và trạng thái học tập sẽ được quản lý bởi `ExamContext`:
- **Questions Store**: Danh sách tất cả câu hỏi đã được làm giàu thông tin đáp án và trạng thái case study.
- **Current Session State**:
  - Đề thi đang chọn (`exam_number`).
  - Danh sách câu hỏi đang hiển thị, câu hỏi hiện tại đang đứng.
  - Danh sách câu trả lời của người dùng (dưới dạng Map `[question_id]: selected_letter`).
  - Trạng thái đếm ngược (được đồng bộ từ `useExamTimer`).
  - Danh sách bookmark (`question_id[]`).
- **History & Progress Store**: Lưu trữ lịch sử tất cả lượt thi thử trước đó và đồng bộ liên tục với `localStorage`.

### 2.3. Tầng Giao diện (Presentation Layer - Ant Design)
Giao diện ứng dụng được chia thành các phân vùng trực quan chính:
- **Dashboard**: Màn hình chính nơi hiển thị 21 đề thi. Sử dụng `Card` và `Progress` của Ant Design để biểu diễn phần trăm đề thi đã hoàn thành và số điểm cao nhất.
- **Phòng thi (Exam Room)**:
  - **Thiết kế Chia đôi màn hình (Split-Screen)**: Đối với câu hỏi Case Study (`is_case_study = true`), giao diện sử dụng `Row` và `Col` của Ant Design để chia màn hình thành 2 nửa bằng nhau:
    - Nửa bên trái: Panel hiển thị đoạn văn cảnh (`context`) có thể cuộn độc lập.
    - Nửa bên phải: Panel hiển thị câu hỏi hiện tại, các tùy chọn đáp án (`Radio.Group`), các nút điều hướng (Trước, Tiếp theo, Đánh dấu, Nộp bài).
  - **Panel danh sách câu hỏi (Navigation Sheet)**: Hiển thị danh sách 120 câu hỏi dạng lưới nhỏ (Grid), cho phép người dùng click nhanh để nhảy đến câu hỏi mong muốn. Các ô lưới đổi màu dựa theo trạng thái: Chưa làm (xám), Đã chọn đáp án (xanh dương), Đã đánh dấu (vàng).
- **Chế độ Flashcard**: Hiển thị dạng thẻ lật 3D hoặc tương tác đơn giản của Ant Design giúp ôn tập các câu thiếu đáp án nhiễu.
- **Thống kê (Analytics)**: Hiển thị tiến trình tích lũy, các biểu đồ phân tích kiến thức cần cải thiện.

---

## 3. Quy trình Lưu trữ cục bộ (Data Persistence)
- Trình duyệt sẽ tự động lưu lại các khóa sau vào `localStorage`:
  - `cbap_exam_history`: Mảng chứa thông tin lịch sử làm bài (thời gian, điểm số, danh sách câu sai).
  - `cbap_bookmarked_questions`: Mảng chứa danh sách ID các câu hỏi được đánh dấu yêu thích/cần lưu ý.
  - `cbap_ongoing_session`: Lưu trữ phiên thi hiện tại phòng trường hợp người dùng lỡ tay tải lại trang (refresh) không bị mất bài đang làm.
- Cấu trúc lịch sử làm bài (`ExamHistory`):
```typescript
interface ExamHistory {
  id: string; // ID ngẫu nhiên của phiên làm bài
  examNumber: number; // Đề số mấy (1-21)
  timestamp: number; // Thời gian nộp bài
  durationUsed: number; // Thời gian hoàn thành (giây)
  totalQuestions: number; // Tổng số câu làm được (không tính câu missing_all_answers)
  correctAnswersCount: number; // Số câu trả lời đúng
  scorePercentage: number; // Điểm số phần trăm
  userAnswers: { [questionId: string]: string }; // Đáp án người dùng chọn
}
```
