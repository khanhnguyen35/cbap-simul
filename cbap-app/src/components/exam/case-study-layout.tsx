// ============================================================
// CaseStudyLayout — Split-Screen layout for case study questions
// Left: sticky context panel | Right: question + answers
// ============================================================

import React from 'react';
import { Typography } from 'antd';
import QuestionCard, { renderTextWithImages } from './question-card';
import AnswerOptions from './answer-options';
import type { Question } from '@/types/exam';
import type { ExamMode } from '@/types/exam';

const { Title, Paragraph } = Typography;

interface CaseStudyLayoutProps {
  question: Question;
  questionNumber: number;
  totalInExam: number;
  selectedLetter: string | undefined;
  onSelect: (letter: string) => void;
  mode: ExamMode;
  disabled?: boolean;
  forceShowFeedback?: boolean;
}

export default function CaseStudyLayout({
  question,
  questionNumber,
  totalInExam,
  selectedLetter,
  onSelect,
  mode,
  disabled,
  forceShowFeedback,
}: CaseStudyLayoutProps) {
  return (
    <div className="split-screen-container">
      {/* ── LEFT: Case Study Context (sticky scroll) ── */}
      <div className="split-screen-context-panel">
        <Title level={5} style={{ color: '#1d3557', marginBottom: 12 }}>
          📋 Tình huống (Case Study)
        </Title>
        <div
          className="case-study-progress"
          id={`case-study-progress-${question.groupId}`}
        >
          Câu {question.groupPosition}/{question.groupSize} trong Case Study này
        </div>
        <div
          className="ant-typography"
          style={{
            fontSize: 15,
            lineHeight: 1.75,
            color: '#343a40',
            whiteSpace: 'pre-wrap',
            marginBottom: '1em'
          }}
        >
          {renderTextWithImages(question.context || '', question.imageFiles)}
        </div>
      </div>

      {/* ── RIGHT: Question + Answer Options ── */}
      <div className="split-screen-question-panel">
        <QuestionCard
          question={question}
          questionNumber={questionNumber}
          totalInExam={totalInExam}
        />
        <AnswerOptions
          answers={question.answers}
          correctLetter={question.correctAnswerLetter}
          selectedLetter={selectedLetter}
          onSelect={onSelect}
          mode={mode}
          disabled={disabled}
          forceShowFeedback={forceShowFeedback}
        />
      </div>
    </div>
  );
}
