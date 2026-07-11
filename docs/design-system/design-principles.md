# Nguyên tắc Thiết kế & Hệ thống Design System (Design Principles) - CBAP Practice Exam Simulator

Tài liệu hướng dẫn thiết lập Theme cho Ant Design, định nghĩa bảng màu, kiểu chữ và các thành phần giao diện chính đảm bảo tính nhất quán thẩm mỹ cao.

---

## 1. Ý tưởng Thiết kế Chủ đạo
Hệ thống ôn luyện thi chứng chỉ CBAP cần một giao diện **chuyên nghiệp, tập trung và đáng tin cậy**, giúp người học duy trì sự tập trung cao độ trong thời gian dài (làm bài thi thử 3.5 giờ). 
- **Thiết kế Minimalist & Premium**: Tránh màu sắc lòe loẹt, sử dụng khoảng trắng (whitespace) hợp lý.
- **Tính tương tác cao**: Sử dụng các hiệu ứng chuyển đổi mượt mà (micro-interactions) từ bộ thư viện Ant Design để làm nổi bật các trạng thái hành động (hover chuột vào đáp án, lật thẻ flashcard, đếm ngược thời gian).

---

## 2. Bảng màu Chủ đạo (Color Palette)

Ứng dụng sử dụng bảng màu dịu mắt, tập trung, phối hợp giữa màu xanh học thuật và các sắc độ xám sang trọng. Cấu hình này sẽ được nạp trực tiếp qua `<ConfigProvider>` của Ant Design.

| Ý nghĩa màu | Mã HEX | Biểu diễn thị giác | Mô tả |
|---|---|---|---|
| **Primary Color** | `#1d3557` | Deep Academic Navy | Màu thương hiệu, dùng cho Header, nút chính, trạng thái tích cực |
| **Secondary Color** | `#457b9d` | Soft Steel Blue | Màu phụ, dùng cho các nút điều hướng phụ, Badge, liên kết |
| **Success Color** | `#2a9d8f` | Emerald Green | Dành cho đáp án đúng, điểm cao |
| **Warning Color** | `#e9c46a` | Amber Gold | Dành cho câu hỏi được Bookmark, cảnh báo thời gian |
| **Error Color** | `#e76f51` | Coral Red | Dành cho câu trả lời sai, nút Reset, lỗi hệ thống |
| **Background (Light)**| `#f8f9fa` | Off-White | Nền ứng dụng chính |
| **Card Background** | `#ffffff` | Pure White | Nền của các Panel câu hỏi, Dashboard Card |

---

## 3. Kiểu chữ (Typography)

Sử dụng bộ font **Inter** hoặc **Roboto** thông qua import từ Google Fonts để mang lại cảm giác hiện đại và dễ đọc đối với các đoạn văn bản dài của đề thi CBAP:
- **Font-family**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`
- **Tỷ lệ kích thước chữ**:
  - Tiêu đề chính (Dashboard): `24px` (bold)
  - Tiêu đề cụm Case Study: `18px` (semibold)
  - Nội dung câu hỏi (`question_text`): `16px` (regular, line-height `1.6`)
  - Các đáp án lựa chọn: `15px` (regular, line-height `1.5`)
  - Chữ giải thích (Feedback/References): `14px` (regular, màu chữ phụ `#6c757d` để phân biệt rõ)

---

## 4. Thiết kế Layout & Component

### 4.1. Bố cục Split-Screen (Chia đôi màn hình)
Bố cục này vô cùng quan trọng đối với các câu hỏi Case Study (`is_case_study = true`):
- Sử dụng thẻ `Row` và `Col` của Ant Design với tỷ lệ chia màn hình `12:12` (ở màn hình lớn Desktop) hoặc `24:24` (tự động chuyển thành cuộn dọc ở thiết bị di động/màn hình nhỏ).
- Panel trái chứa đoạn Văn cảnh (`context`) có thuộc tính css `overflow-y: auto` và chiều cao cố định `calc(100vh - 120px)` giúp cuộn độc lập mà không ảnh hưởng tới Panel làm bài bên phải.

### 4.2. Trạng thái Thẻ đáp án (Answer Options)
- Các lựa chọn đáp án A, B, C, D được bọc trong các thẻ `Radio` của Ant Design, được styled dạng block rộng 100% kèm padding lớn để người dùng dễ click.
- Hover effect: Thay đổi màu nền nhẹ (`background: #f1f5f9`) và bo góc nhẹ (`border-radius: 6px`) khi di chuột qua.
- Khi người dùng đã chọn: Đổi màu viền và màu nền tương ứng với màu Primary (`#1d3557` ở chế độ thi) hoặc kết quả Đúng/Sai (`#2a9d8f` / `#e76f51` ở chế độ luyện tập).

### 4.3. Bảng điều hướng câu hỏi (Navigation Sheet)
- Sử dụng các ô lưới nhỏ bằng `Button` có kích thước nhỏ (`size="small"`, hình vuông, bo góc `4px`).
- Hiển thị số thứ tự câu hỏi (1 đến 120).
- Trạng thái màu sắc:
  - Chưa trả lời: Viền xám, nền trắng.
  - Đã trả lời: Nền xanh primary, chữ trắng.
  - Đang xem câu hiện tại: Viền đậm, nền xám nhẹ.
  - Đã bookmark: Icon bookmark vàng nhỏ ở góc hoặc đổi nền sang màu Amber Gold `#e9c46a`.

---

## 5. Cấu hình ConfigProvider Ant Design
Mẫu cấu hình theme token cho ứng dụng trong React:

```typescript
import { ConfigProvider } from 'antd';

const CBAPTheme = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#1d3557',
        colorSuccess: '#2a9d8f',
        colorWarning: '#e9c46a',
        colorError: '#e76f51',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        borderRadius: 6,
      },
      components: {
        Button: {
          colorPrimaryHover: '#457b9d',
        },
        Card: {
          headerBg: '#f8f9fa',
        },
      },
    }}
  >
    {children}
  </ConfigProvider>
);
```
