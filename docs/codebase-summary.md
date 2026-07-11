# Codebase Summary - CBAP Practice Exam Simulator

Tài liệu tóm tắt cấu trúc thư mục hiện tại của dự án và đề xuất cấu trúc mã nguồn cho ứng dụng React + Ant Design.

---

## 1. Cấu trúc Thư mục Hiện tại (Current Directory Structure)

Hiện tại dự án mới chỉ chứa bộ dữ liệu đề thi đã chuẩn hóa và các file cấu hình Agent:

```plaintext
/
├── .agent/                    # Thư mục cấu hình cho Coding Agent
│   ├── ARCHITECTURE.md        # Kiến trúc Agentic Development Framework
│   ├── agents/                # Cấu hình vai trò các Agent
│   ├── rules/                 # Các quy tắc phát triển phần mềm
│   ├── skills/                # Các kỹ năng xử lý tự động của Agent
│   └── workflows/             # Quy trình chạy lệnh tắt
├── exams/                     # Bộ dữ liệu đề thi CBAP
│   ├── images/                # Thư mục chứa 6 ảnh sơ đồ dạng PNG trích xuất từ dữ liệu gốc
│   │   ├── 0a28f6...png
│   │   └── ...
│   ├── README.md              # Tài liệu mô tả cấu trúc dữ liệu và chất lượng dữ liệu TSV
│   ├── answers.tsv            # Bảng đáp án liên kết khóa ngoại với câu hỏi (9.357 dòng)
│   ├── questions.tsv          # Bảng câu hỏi chính (2.389 dòng)
│   └── quality_report.tsv     # Báo cáo các câu hỏi có vấn đề về cấu trúc/dữ liệu (56 dòng)
├── AGENTS.md                  # Hướng dẫn chính dành cho AI Agent hoạt động trong repository này
└── docs/                      # Thư mục tài liệu thiết kế hệ thống (Mới khởi tạo)
    ├── project-overview-pdr.md # Tài liệu mô tả yêu cầu sản phẩm
    └── codebase-summary.md     # File này
```

---

## 2. Đề xuất Cấu trúc Mã nguồn (Proposed Application Structure)

Ứng dụng sẽ được khởi tạo bằng công cụ **Vite** với stack **React + TypeScript** và thư viện UI **Ant Design (antd)**.

```plaintext
/
├── public/                    # Thư mục chứa các tài nguyên tĩnh
│   └── exams/                 # Thư mục dữ liệu và hình ảnh phục vụ việc load runtime
│       ├── images/            # Sao chép các ảnh sơ đồ từ exams/images gốc sang đây
│       ├── questions.tsv
│       ├── answers.tsv
│       └── quality_report.tsv
├── src/                       # Thư mục chứa mã nguồn ứng dụng
│   ├── main.tsx               # Điểm khởi đầu ứng dụng
│   ├── App.tsx                # Component gốc cấu hình Theme Ant Design và định tuyến
│   ├── index.css              # CSS tùy chỉnh toàn cục (sử dụng CSS Variables)
│   ├── components/            # Các component dùng chung
│   │   ├── common/            # Component cơ bản (Layout, Header, Custom Card)
│   │   ├── exam/              # Component liên quan đến phòng thi (QuestionCard, AnswerOptions, CaseStudyContext)
│   │   ├── dashboard/         # Component màn hình danh sách đề (ExamList, ProgressCard)
│   │   └── analytics/         # Component thống kê lịch sử làm bài (ScoreChart, HistoryList)
│   ├── context/               # Quản lý State toàn cục bằng React Context
│   │   └── ExamContext.tsx    # State lưu trữ danh sách câu hỏi/đáp án đã load, tiến độ và lịch sử
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useTsvParser.ts    # Hook tải và parse dữ liệu TSV bất đồng bộ
│   │   └── useExamTimer.ts    # Hook quản lý thời gian đếm ngược làm bài
│   ├── utils/                 # Các hàm tiện ích bổ trợ
│   │   ├── tsv-helper.ts      # Hàm parse chuỗi TSV sang Object
│   │   └── data-filter.ts     # Hàm lọc câu hỏi theo data_quality và phân loại đề thi
│   └── types/                 # Định nghĩa kiểu dữ liệu TypeScript
│       └── exam.ts            # Kiểu dữ liệu Question, Answer, ExamHistory, ExamState
└── vite.config.ts             # File cấu hình Vite
```

---

## 3. Quản lý Dữ liệu tại Runtime (Runtime Data Management)
- **Tải dữ liệu**: Dữ liệu TSV rất nhẹ (questions.tsv ~1.9MB, answers.tsv ~2.2MB). Thay vì thiết lập API backend phức tạp, ứng dụng có thể tải trực tiếp các file TSV này từ thư mục `public/exams/` ở thời điểm khởi chạy app bằng `fetch` và lưu vào bộ nhớ cache của Client (React State/Context).
- **Phân tích cú pháp (Parsing)**: Sử dụng các hàm xử lý chuỗi đơn giản hoặc thư viện nhẹ (như `PapaParse`) để parse dữ liệu TSV ngay trên trình duyệt trong chưa đầy 100ms.
- **Lưu trữ trạng thái làm bài**: Sử dụng `localStorage` của trình duyệt để lưu tiến độ ôn thi, bookmark và lịch sử làm bài thi thử của người dùng. Điều này đảm bảo ứng dụng hoạt động độc lập, không cần server dữ liệu bên thứ ba.
