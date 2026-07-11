// ============================================================
// Data Filter Utilities — exam-level operations
// ============================================================

import type { Question, ExamHistory, ExamSummary } from '@/types/exam';

// Đề thi có chất lượng kém (dựa vào phân tích dữ liệu nguồn)
const WARNED_EXAMS: Record<number, string> = {
  7: 'Đề 7 chỉ có 5 câu hỏi (bị cắt cụt từ nguồn gốc)',
  20: 'Đề 20 có 13 câu thiếu đáp án hoàn toàn',
  21: 'Đề 21 có 18 câu thiếu đáp án hoàn toàn',
};

// ── Lấy danh sách câu hỏi của 1 đề ─────────────────────────

export function filterByExam(questions: Question[], examNumber: number): Question[] {
  return questions
    .filter((q) => q.examNumber === examNumber)
    .sort((a, b) => a.questionOrder - b.questionOrder);
}

// ── Tính toán thông tin tổng hợp cho Dashboard ──────────────

export function buildExamSummary(
  allQuestions: Question[],
  history: ExamHistory[],
  examNumber: number
): ExamSummary {
  const examQuestions = allQuestions.filter((q) => q.examNumber === examNumber);
  const usable = examQuestions.filter((q) => q.dataQuality !== 'missing_all_answers');
  const examHistory = history.filter((h) => h.examNumber === examNumber);

  // Tập hợp tất cả questionId đã từng được trả lời trong các lượt thi
  const answeredIds = new Set<string>();
  for (const h of examHistory) {
    Object.keys(h.userAnswers).forEach((id) => answeredIds.add(id));
  }

  const completedPercent =
    usable.length > 0
      ? Math.round((answeredIds.size / usable.length) * 100)
      : 0;

  const bestScore =
    examHistory.length > 0
      ? Math.max(...examHistory.map((h) => h.scorePercentage))
      : null;

  return {
    examNumber,
    totalUsable: usable.length,
    totalQuestions: examQuestions.length,
    hasWarning: examNumber in WARNED_EXAMS,
    warningMessage: WARNED_EXAMS[examNumber] ?? '',
    bestScore,
    attemptCount: examHistory.length,
    completedPercent,
  };
}

// ── Group câu hỏi case study theo group_id ──────────────────

export interface CaseStudyGroup {
  groupId: string;
  context: string;
  questions: Question[];  // Được sort theo group_position
}

export function groupCaseStudies(questions: Question[]): Map<string, CaseStudyGroup> {
  const map = new Map<string, CaseStudyGroup>();

  for (const q of questions) {
    if (!q.isCaseStudy) continue;
    const existing = map.get(q.groupId);
    if (existing) {
      existing.questions.push(q);
    } else {
      map.set(q.groupId, {
        groupId: q.groupId,
        context: q.context,
        questions: [q],
      });
    }
  }

  // Sort questions trong mỗi group theo group_position
  for (const group of map.values()) {
    group.questions.sort((a, b) => a.groupPosition - b.groupPosition);
  }

  return map;
}

// ── Get unique exam numbers có trong data ───────────────────

export function getExamNumbers(questions: Question[]): number[] {
  const nums = new Set(questions.map((q) => q.examNumber));
  return Array.from(nums).sort((a, b) => a - b);
}

// ── Tính điểm cho 1 phiên làm bài ───────────────────────────

export function calculateScore(
  questions: Question[],
  userAnswers: Record<string, string>
): { correct: number; total: number; percentage: number } {
  let correct = 0;
  const total = questions.length;

  for (const q of questions) {
    const selected = userAnswers[q.id];
    if (selected && selected === q.correctAnswerLetter) {
      correct++;
    }
  }

  return {
    correct,
    total,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

// ── LocalStorage keys ────────────────────────────────────────

export const LS_KEYS = {
  history: 'cbap_exam_history',
  bookmarks: 'cbap_bookmarked_questions',
  ongoingSession: 'cbap_ongoing_session',
} as const;
