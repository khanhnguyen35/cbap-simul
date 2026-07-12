// ============================================================
// ExamRoom — Main exam page: orchestrates all exam components
// Routes: /exam/:number (simulation) and /practice/:number
// ============================================================

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Result, Row, Col, Skeleton, Card } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

import { useExamContext } from '@/context/exam-context';
import { useExamTimer } from '@/hooks/use-exam-timer';
import { filterByExam } from '@/utils/data-filter';
import ExamHeader from '@/components/exam/exam-header';
import NavigationSheet from '@/components/exam/navigation-sheet';
import QuestionCard from '@/components/exam/question-card';
import AnswerOptions from '@/components/exam/answer-options';
import CaseStudyLayout from '@/components/exam/case-study-layout';
import type { ExamMode } from '@/types/exam';

export default function ExamRoom() {
  const { number } = useParams<{ number: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, startSession, submitAnswer, toggleBookmark, updateTimer, submitSession } =
    useExamContext();

  const examNumber = parseInt(number ?? '1', 10);
  const mode = (searchParams.get('mode') as ExamMode) ?? 'simulation';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // ── Prepare question list ─────────────────────────────────
  // buckets.usable đã loại sẵn câu hỏng (thiếu đáp án / thiếu câu hỏi con)
  const examQuestions = useMemo(
    () => filterByExam(state.buckets.usable, examNumber),
    [state.buckets.usable, examNumber]
  );

  const questionIds = useMemo(() => examQuestions.map((q) => q.id), [examQuestions]);
  const currentQuestion = examQuestions[currentIndex];
  const session = state.ongoingSession;

  // ── Start/Restore session ─────────────────────────────────
  useEffect(() => {
    if (!state.isDataLoaded || examQuestions.length === 0) return;

    const existingSession = state.ongoingSession;
    if (existingSession && existingSession.examNumber === examNumber) {
      // Restore existing session
      const savedIndex = existingSession.questionIds.indexOf(
        Object.keys(existingSession.userAnswers).pop() ?? existingSession.questionIds[0]
      );
      setCurrentIndex(Math.max(0, savedIndex));
    } else {
      // Start new session
      startSession(examNumber, mode, questionIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isDataLoaded, examNumber]);

  // ── Timer ─────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (!submitted) {
      setSubmitted(true);
      submitSession();
    }
  }, [submitted, submitSession]);

  const { remainingSeconds, start, pause } = useExamTimer({
    initialSeconds: session?.remainingSeconds ?? 210 * 60,
    onTimeUp: handleTimeUp,
    onTick: updateTimer,
  });

  useEffect(() => {
    if (mode === 'simulation' && session && !submitted) {
      start();
    }
    return () => pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.examNumber]);

  // ── Navigation ────────────────────────────────────────────
  const goTo = useCallback((idx: number) => {
    setCurrentIndex(Math.max(0, Math.min(idx, examQuestions.length - 1)));
  }, [examQuestions.length]);

  const handleSelect = useCallback((letter: string) => {
    if (!currentQuestion || submitted) return;
    submitAnswer(currentQuestion.id, letter);
    // Auto-advance in practice mode
    if (mode === 'practice' && currentIndex < examQuestions.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 800);
    }
  }, [currentQuestion, submitted, mode, currentIndex, examQuestions.length, submitAnswer]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    pause();
    submitSession();
    navigate('/analytics');
  }, [pause, submitSession, navigate]);

  // ── Loading state ─────────────────────────────────────────
  if (!state.isDataLoaded) {
    return (
      <div style={{ padding: 32 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (examQuestions.length === 0) {
    return (
      <Result
        status="warning"
        title="Không có câu hỏi hợp lệ"
        subTitle={`Đề ${examNumber} không có câu hỏi khả dụng.`}
        extra={<Button onClick={() => navigate('/')}>Về Dashboard</Button>}
      />
    );
  }

  if (!currentQuestion) return null;

  const userAnswers = session?.userAnswers ?? {};
  const bookmarks = new Set(session?.bookmarks ?? []);
  const selectedLetter = userAnswers[currentQuestion.id];

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* ── Header ── */}
      <ExamHeader
        examNumber={examNumber}
        mode={mode}
        remainingSeconds={remainingSeconds}
        isBookmarked={bookmarks.has(currentQuestion.id)}
        onToggleBookmark={() => toggleBookmark(currentQuestion.id)}
        onSubmit={handleSubmit}
        answeredCount={Object.keys(userAnswers).length}
        totalCount={examQuestions.length}
      />

      <Row style={{ padding: '24px 24px 24px 24px', gap: 0 }} wrap={false}>
        {/* ── Main Content ── */}
        <Col flex="1" style={{ minWidth: 0, paddingRight: 24 }}>
          <Card
            bordered={false}
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderRadius: 10 }}
            styles={{ body: { padding: currentQuestion.isCaseStudy ? 0 : 28 } }}
          >
            {currentQuestion.isCaseStudy ? (
              <CaseStudyLayout
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalInExam={examQuestions.length}
                selectedLetter={selectedLetter}
                onSelect={handleSelect}
                mode={mode}
                disabled={submitted}
              />
            ) : (
              <div>
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  totalInExam={examQuestions.length}
                />
                <AnswerOptions
                  answers={currentQuestion.answers}
                  correctLetter={currentQuestion.correctAnswerLetter}
                  selectedLetter={selectedLetter}
                  onSelect={handleSelect}
                  mode={mode}
                  disabled={submitted}
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
              id="btn-prev-question"
            >
              Câu trước
            </Button>
            <Button
              type="primary"
              iconPosition="end"
              icon={<RightOutlined />}
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === examQuestions.length - 1}
              id="btn-next-question"
            >
              Câu tiếp
            </Button>
          </div>
        </Col>

        {/* ── Navigation Sheet sidebar ── */}
        <Col flex="none">
          <NavigationSheet
            questionIds={questionIds}
            currentIndex={currentIndex}
            userAnswers={userAnswers}
            bookmarks={bookmarks}
            onNavigate={goTo}
          />
        </Col>
      </Row>
    </div>
  );
}
