// ============================================================
// Type Definitions — CBAP Practice Exam Simulator
// Maps 1:1 to columns in questions.tsv and answers.tsv
// ============================================================

// ── Raw TSV Records (after PapaParse) ──────────────────────

/**
 * Cờ chất lượng dữ liệu (v3). Các giá trị đơn:
 * 'ok' | 'missing_all_answers' | 'missing_distractors'
 * | 'missing_subquestion' | 'subquestion_recovered'
 * | 'ai_answered' (đề 22–25: nguồn dump không có đáp án,
 *   đáp án + giải thích do AI suy luận từ BABOK v3 — vẫn usable)
 * Có thể là cờ ghép nối bằng "+" (vd "missing_all_answers+missing_subquestion")
 * → luôn kiểm tra bằng .includes(), không so sánh bằng.
 */
export type DataQuality = string;

/** Ánh xạ trực tiếp từ 1 dòng trong questions.tsv */
export interface QuestionRecord {
  question_id: string;
  exam_number: string;       // "1"–"25" (22–25: đề dump, đáp án do AI suy luận)
  question_order: string;    // "1"–"120"
  group_id: string;
  group_position: string;
  group_size: string;
  is_case_study: string;     // "true" | "false"
  context: string;           // Đoạn tình huống, rỗng nếu không phải case study
  question_text: string;
  image_files: string;       // Tên file cách nhau bởi ";" hoặc rỗng
  answer_count: string;
  correct_answer_letter: string;
  data_quality: DataQuality;
}

/** Ánh xạ trực tiếp từ 1 dòng trong answers.tsv */
export interface AnswerRecord {
  question_id: string;
  letter: 'a' | 'b' | 'c' | 'd';
  content: string;
  is_correct: string;        // "true" | "false"
  feedback: string;          // BABOK reference / giải thích
}

// ── Enriched Domain Objects ─────────────────────────────────

/** Câu hỏi đã được làm giàu thêm danh sách đáp án */
export interface Question {
  id: string;
  examNumber: number;
  questionOrder: number;
  groupId: string;
  groupPosition: number;
  groupSize: number;
  isCaseStudy: boolean;
  context: string;
  questionText: string;
  imageFiles: string[];      // Tên file đã split từ ";"
  correctAnswerLetter: string;
  dataQuality: DataQuality;
  answers: Answer[];
}

/** Đáp án đã được normalize */
export interface Answer {
  questionId: string;
  letter: string;
  content: string;
  isCorrect: boolean;
  feedback: string;
}

// ── Exam Session State ──────────────────────────────────────

export type ExamMode = 'simulation' | 'practice' | 'flashcard';

/** Trạng thái phiên làm bài hiện tại */
export interface OngoingSession {
  examNumber: number;
  mode: ExamMode;
  questionIds: string[];                    // Thứ tự câu hỏi của phiên
  userAnswers: Record<string, string>;      // questionId → letter đã chọn
  bookmarks: string[];                      // questionId[]
  remainingSeconds: number;
  startedAt: number;                        // Unix timestamp ms
}

/** Lịch sử 1 lần làm bài (persist vào localStorage) */
export interface ExamHistory {
  id: string;
  examNumber: number;
  mode: ExamMode;
  timestamp: number;
  durationUsed: number;       // giây
  totalQuestions: number;
  correctAnswersCount: number;
  scorePercentage: number;
  userAnswers: Record<string, string>;
}

// ── Dashboard Summary ───────────────────────────────────────

/** Thông tin tổng hợp hiển thị trên Dashboard cho mỗi đề */
export interface ExamSummary {
  examNumber: number;
  totalUsable: number;          // Số câu hỏi usable (ok + missing_distractors)
  totalQuestions: number;       // Tổng số câu trong đề
  hasWarning: boolean;          // true nếu có nhiều câu missing_all_answers
  warningMessage: string;
  bestScore: number | null;     // % cao nhất đạt được, null nếu chưa làm
  attemptCount: number;
  completedPercent: number;     // % số câu đã làm ít nhất 1 lần
}

// ── Question Buckets ────────────────────────────────────────

/** Kết quả phân loại câu hỏi */
export interface QuestionBuckets {
  usable: Question[];           // ok + missing_distractors → dùng được cho thi/luyện tập
  flashcardOnly: Question[];    // missing_distractors → ưu tiên flashcard
  broken: Question[];           // missing_all_answers → chỉ hiển thị trong Data Quality Inspector
}
