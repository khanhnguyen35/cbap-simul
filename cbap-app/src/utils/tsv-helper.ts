// ============================================================
// TSV Helper Utilities — parse, join, classify
// Uses PapaParse for robust TSV parsing
// ============================================================

import Papa from 'papaparse';
import type {
  QuestionRecord,
  AnswerRecord,
  Question,
  Answer,
  QuestionBuckets,
} from '@/types/exam';

// ── Parse raw TSV text → typed records ──────────────────────

// Định dạng TSV mới (v3): mỗi record đúng 1 dòng vật lý, KHÔNG dùng quoting;
// ký tự đặc biệt trong ô được escape: "\n" (xuống dòng), "\t" (tab), "\\" (backslash).
// Giải mã 1 lượt duy nhất để "\\n" không bị nhầm thành newline.
function unescapeCell(value: string): string {
  if (!value.includes('\\')) return value;
  return value.replace(/\\(n|t|\\)/g, (_, c: string) =>
    c === 'n' ? '\n' : c === 't' ? '\t' : '\\'
  );
}

export function parseTsvText<T>(tsvText: string): T[] {
  const result = Papa.parse<Record<string, string>>(tsvText, {
    delimiter: '\t',
    header: true,
    skipEmptyLines: true,
    // Dữ liệu không dùng quoting; nội dung có thể bắt đầu bằng dấu " thật.
    // Dùng ký tự NUL (không bao giờ xuất hiện) để vô hiệu hoá xử lý ngoặc kép của PapaParse.
    quoteChar: '\u0000',
  });

  // Giải mã escape trên mọi ô văn bản
  for (const row of result.data) {
    for (const key of Object.keys(row)) {
      const value = row[key];
      if (typeof value === 'string') row[key] = unescapeCell(value);
    }
  }

  return result.data as T[];
}

// ── Join questions + answers into enriched Question[] ───────

export function joinQuestionsAndAnswers(
  rawQuestions: QuestionRecord[],
  rawAnswers: AnswerRecord[]
): Question[] {
  // Build answer map O(n) — key: question_id → Answer[]
  const answerMap = new Map<string, Answer[]>();
  for (const raw of rawAnswers) {
    const answer: Answer = {
      questionId: raw.question_id,
      letter: raw.letter,
      content: raw.content,
      isCorrect: raw.is_correct === 'true',
      feedback: raw.feedback ?? '',
    };
    const existing = answerMap.get(raw.question_id);
    if (existing) {
      existing.push(answer);
    } else {
      answerMap.set(raw.question_id, [answer]);
    }
  }

  // Enrich each question with its answers
  return rawQuestions.map((raw): Question => ({
    id: raw.question_id,
    examNumber: parseInt(raw.exam_number, 10),
    questionOrder: parseInt(raw.question_order, 10),
    groupId: raw.group_id,
    groupPosition: parseInt(raw.group_position, 10) || 1,
    groupSize: parseInt(raw.group_size, 10) || 1,
    isCaseStudy: raw.is_case_study === 'true',
    context: raw.context ?? '',
    questionText: raw.question_text ?? '',
    imageFiles: raw.image_files
      ? raw.image_files.split(';').map((f) => f.trim()).filter(Boolean)
      : [],
    correctAnswerLetter: raw.correct_answer_letter ?? '',
    dataQuality: raw.data_quality,
    answers: answerMap.get(raw.question_id) ?? [],
  }));
}

// ── Classify questions into buckets ─────────────────────────

// data_quality (v3) có thể là cờ ghép, vd "missing_all_answers+missing_subquestion"
// → luôn kiểm tra bằng includes(), không so sánh bằng.
export function isBrokenQuestion(q: Question): boolean {
  // Không có đáp án, hoặc không còn câu hỏi con (question_text rỗng
  // — gồm cờ missing_subquestion và cả record lỗi nguồn chưa gắn cờ)
  return (
    q.dataQuality.includes('missing_all_answers') ||
    q.dataQuality.includes('missing_subquestion') ||
    q.questionText.trim() === ''
  );
}

export function classifyQuestions(questions: Question[]): QuestionBuckets {
  const usable: Question[] = [];
  const flashcardOnly: Question[] = [];
  const broken: Question[] = [];

  for (const q of questions) {
    if (isBrokenQuestion(q)) {
      broken.push(q);
    } else if (q.dataQuality.includes('missing_distractors')) {
      usable.push(q);       // Vẫn dùng được cho thi mô phỏng và luyện tập
      flashcardOnly.push(q); // Đồng thời ưu tiên cho flashcard
    } else {
      // 'ok', 'subquestion_recovered' — dùng bình thường
      usable.push(q);
    }
  }

  return { usable, flashcardOnly, broken };
}

// ── Format thời gian đếm ngược ───────────────────────────────

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Format ngày giờ hiển thị ────────────────────────────────

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Format thời gian làm bài ────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}g ${m}p`;
  return `${m} phút`;
}
