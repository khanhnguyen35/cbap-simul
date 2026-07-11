// ============================================================
// ExamReview — Read-only review of a completed exam session
// Layout mirrors ExamRoom but all answers are locked/revealed
// Route: /review/:historyId
// ============================================================

import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Result,
  Row,
  Col,
  Card,
  Space,
  Tag,
  Typography,
  Alert,
  Affix,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';

import { useExamContext } from '@/context/exam-context';
import QuestionCard from '@/components/exam/question-card';
import AnswerOptions from '@/components/exam/answer-options';
import CaseStudyLayout from '@/components/exam/case-study-layout';
import { formatDateTime, formatDuration } from '@/utils/tsv-helper';
import type { Question } from '@/types/exam';

const { Text } = Typography;
const PASSING_SCORE = 75;

// ── Extended question with review metadata ───────────────────

interface ReviewQuestion extends Question {
  userAnswer: string | undefined;
  isCorrect: boolean;
  isSkipped: boolean;
}

// ── Review Header ────────────────────────────────────────────

interface ReviewHeaderProps {
  examNumber: number;
  score: number;
  correctCount: number;
  totalCount: number;
  timestamp: number;
  duration: number;
  onBack: () => void;
}

function ReviewHeader({
  examNumber,
  score,
  correctCount,
  totalCount,
  timestamp,
  duration,
  onBack,
}: ReviewHeaderProps) {
  const isPassed = score >= PASSING_SCORE;

  return (
    <Affix offsetTop={0}>
      <div
        style={{
          background: '#1d3557',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          flexWrap: 'wrap',
          gap: 12,
        }}
        id="review-header"
      >
        {/* Left: title */}
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            Xem lại kết quả
          </Text>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>
            Đề {examNumber}
          </div>
        </div>

        {/* Center: score info */}
        <Space size={16} wrap>
          <Tag
            color={isPassed ? 'success' : 'error'}
            style={{ fontSize: 14, padding: '2px 12px', fontWeight: 600 }}
          >
            {score}%
          </Tag>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            {correctCount}/{totalCount} câu đúng
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            {formatDateTime(timestamp)} · {formatDuration(duration)}
          </Text>
        </Space>

        {/* Right: back button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          id="btn-review-back"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'transparent' }}
        >
          Về Thống kê
        </Button>
      </div>
    </Affix>
  );
}

// ── Review NavigationSheet (color-coded by result) ───────────

interface ReviewNavSheetProps {
  reviewQuestions: ReviewQuestion[];
  currentIndex: number;
  onNavigate: (idx: number) => void;
}

function ReviewNavSheet({ reviewQuestions, currentIndex, onNavigate }: ReviewNavSheetProps) {
  const correctCount = reviewQuestions.filter((q) => q.isCorrect).length;
  const incorrectCount = reviewQuestions.filter((q) => !q.isCorrect && !q.isSkipped).length;
  const skippedCount = reviewQuestions.filter((q) => q.isSkipped).length;

  return (
    <Affix offsetTop={80}>
      <div
        style={{
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: 8,
          padding: 16,
          width: 280,
        }}
      >
        {/* Summary */}
        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13 }}>
          <Text style={{ color: '#52c41a', fontWeight: 600 }}>
            <CheckCircleOutlined /> {correctCount}
          </Text>
          <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
            <CloseCircleOutlined /> {incorrectCount}
          </Text>
          {skippedCount > 0 && (
            <Text style={{ color: '#adb5bd', fontWeight: 600 }}>
              <MinusCircleOutlined /> {skippedCount} bỏ qua
            </Text>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, fontSize: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#52c41a', borderRadius: 2, display: 'inline-block' }} />
            Đúng
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#ff4d4f', borderRadius: 2, display: 'inline-block' }} />
            Sai
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#dee2e6', borderRadius: 2, display: 'inline-block' }} />
            Bỏ qua
          </span>
        </div>

        {/* Question grid */}
        <div className="nav-sheet-grid" id="review-nav-sheet-grid">
          {reviewQuestions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            let cellClass = 'nav-cell';

            if (q.isSkipped) {
              cellClass += ' review-skipped';
            } else if (q.isCorrect) {
              cellClass += ' review-correct';
            } else {
              cellClass += ' review-incorrect';
            }

            if (isCurrent) {
              cellClass += ' current';
            }

            return (
              <div
                key={q.id}
                className={cellClass}
                onClick={() => onNavigate(idx)}
                title={`Câu ${idx + 1}: ${q.isSkipped ? 'Bỏ qua' : q.isCorrect ? 'Đúng' : 'Sai'}`}
                id={`review-nav-cell-${idx + 1}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onNavigate(idx);
                }}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>
    </Affix>
  );
}

// ── Main ExamReview Page ─────────────────────────────────────

export default function ExamReview() {
  const { historyId } = useParams<{ historyId: string }>();
  const navigate = useNavigate();
  const { state } = useExamContext();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find history record
  const history = useMemo(
    () => state.examHistory.find((h) => h.id === historyId) ?? null,
    [state.examHistory, historyId]
  );

  // Build ordered review question list (preserving original questionIds order if possible)
  const reviewQuestions = useMemo((): ReviewQuestion[] => {
    if (!history) return [];

    // Get all questions belonging to this exam
    const examQuestions = state.allQuestions.filter((q) => q.examNumber === history.examNumber);

    return examQuestions
      .map((q) => {
        const userAnswer = history.userAnswers[q.id];
        return {
          ...q,
          userAnswer,
          isCorrect: !!userAnswer && userAnswer === q.correctAnswerLetter,
          isSkipped: !userAnswer,
        };
      })
      .sort((a, b) => a.questionOrder - b.questionOrder);
  }, [history, state.allQuestions]);

  const goTo = useCallback(
    (idx: number) => {
      setCurrentIndex(Math.max(0, Math.min(idx, reviewQuestions.length - 1)));
    },
    [reviewQuestions.length]
  );

  // ── Guards ────────────────────────────────────────────────

  if (!state.isDataLoaded) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6c757d' }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!history) {
    return (
      <Result
        status="404"
        title="Không tìm thấy bài thi"
        subTitle="Bản ghi lịch sử này không tồn tại hoặc đã bị xóa."
        extra={
          <Button type="primary" onClick={() => navigate('/analytics')}>
            Về Thống kê
          </Button>
        }
      />
    );
  }

  if (reviewQuestions.length === 0) {
    return (
      <Result
        status="warning"
        title="Không có câu hỏi để hiển thị"
        subTitle="Dữ liệu câu hỏi không khớp với bài thi này."
        extra={<Button onClick={() => navigate('/analytics')}>Về Thống kê</Button>}
      />
    );
  }

  const currentQuestion = reviewQuestions[currentIndex];

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* ── Review Header ── */}
      <ReviewHeader
        examNumber={history.examNumber}
        score={history.scorePercentage}
        correctCount={history.correctAnswersCount}
        totalCount={history.totalQuestions}
        timestamp={history.timestamp}
        duration={history.durationUsed}
        onBack={() => navigate('/analytics')}
      />

      <Row style={{ padding: '24px 24px 24px 24px', gap: 0 }} wrap={false}>
        {/* ── Main Content ── */}
        <Col flex="1" style={{ minWidth: 0, paddingRight: 24 }}>
          <Card
            bordered={false}
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderRadius: 10 }}
            styles={{ body: { padding: currentQuestion.isCaseStudy ? 0 : 28 } }}
          >
            <div style={{ padding: currentQuestion.isCaseStudy ? '28px 28px 0 28px' : 0 }}>
              {/* Skipped question banner */}
              {currentQuestion.isSkipped && (
                <Alert
                  type="warning"
                  message="Bạn đã bỏ qua câu này (không chọn đáp án)"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* Result badge for current question */}
              {!currentQuestion.isSkipped && (
                <div style={{ marginBottom: 12 }}>
                  {currentQuestion.isCorrect ? (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 13 }}>
                      Trả lời đúng
                    </Tag>
                  ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 13 }}>
                      Trả lời sai
                    </Tag>
                  )}
                </div>
              )}
            </div>

            {currentQuestion.isCaseStudy ? (
              <CaseStudyLayout
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalInExam={reviewQuestions.length}
                selectedLetter={currentQuestion.userAnswer}
                onSelect={() => {}}
                mode="practice"
                disabled={true}
                forceShowFeedback={true}
              />
            ) : (
              <div>
                {/* Question text */}
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  totalInExam={reviewQuestions.length}
                />

                {/* Answer options — always show feedback, always disabled */}
                <AnswerOptions
                  answers={currentQuestion.answers}
                  correctLetter={currentQuestion.correctAnswerLetter}
                  selectedLetter={currentQuestion.userAnswer}
                  onSelect={() => {}} // no-op: read-only
                  mode="practice"
                  disabled={true}
                  forceShowFeedback={true}
                />
              </div>
            )}
          </Card>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button
              icon={<LeftOutlined />}
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              id="btn-review-prev"
            >
              Câu trước
            </Button>
            <Button
              type="primary"
              iconPosition="end"
              icon={<RightOutlined />}
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === reviewQuestions.length - 1}
              id="btn-review-next"
            >
              Câu tiếp
            </Button>
          </div>
        </Col>

        {/* ── Review Navigation Sidebar ── */}
        <Col flex="none">
          <ReviewNavSheet
            reviewQuestions={reviewQuestions}
            currentIndex={currentIndex}
            onNavigate={goTo}
          />
        </Col>
      </Row>
    </div>
  );
}
