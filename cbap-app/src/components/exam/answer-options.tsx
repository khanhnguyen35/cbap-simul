// ============================================================
// AnswerOptions — Styled answer choices with feedback
// Modes: simulation (no reveal) | practice (immediate reveal)
// ============================================================

import React, { memo } from 'react';
import { Alert, Space, Tag } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { Answer } from '@/types/exam';
import type { ExamMode } from '@/types/exam';

interface AnswerOptionsProps {
  answers: Answer[];
  correctLetter: string;
  selectedLetter: string | undefined;
  onSelect: (letter: string) => void;
  mode: ExamMode;
  disabled?: boolean;          // true khi đã nộp bài
  forceShowFeedback?: boolean; // true trong review mode — luôn hiện feedback
}

const AnswerOptions = memo(function AnswerOptions({
  answers,
  correctLetter,
  selectedLetter,
  onSelect,
  mode,
  disabled = false,
  forceShowFeedback = false,
}: AnswerOptionsProps) {
  const showFeedback =
    forceShowFeedback || (mode === 'practice' && selectedLetter !== undefined);

  return (
    <div>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {answers.map((answer) => {
          const isSelected = selectedLetter === answer.letter;
          const isCorrectAnswer = answer.letter === correctLetter;

          // Determine visual state
          let cardClass = 'answer-option-card';
          if (showFeedback || disabled) {
            if (isCorrectAnswer) cardClass += ' correct';
            else if (isSelected && !isCorrectAnswer) cardClass += ' incorrect';
          } else if (isSelected) {
            cardClass += ' selected';
          }

          return (
            <div
              key={answer.letter}
              className={cardClass}
              onClick={() => !disabled && !showFeedback && onSelect(answer.letter)}
              id={`answer-option-${answer.letter}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!disabled && !showFeedback) onSelect(answer.letter);
                }
              }}
            >
              <span className="answer-letter">{answer.letter.toUpperCase()}.</span>
              <span className="answer-text">
                {answer.content}
                {showFeedback && isCorrectAnswer && (
                  <CheckCircleFilled style={{ color: '#2a9d8f', marginLeft: 8 }} />
                )}
                {showFeedback && isSelected && !isCorrectAnswer && (
                  <CloseCircleFilled style={{ color: '#e76f51', marginLeft: 8 }} />
                )}
              </span>
              {showFeedback && answer.feedback && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#495057', lineHeight: 1.5, background: 'rgba(0,0,0,0.03)', padding: '8px 12px', borderRadius: 6 }}>
                  <strong>Giải thích:</strong> {answer.feedback}
                </div>
              )}
            </div>
          );
        })}
      </Space>

      {/* Feedback panel — hiển thị ngay sau khi chọn trong Practice mode */}
      {showFeedback && (() => {
        const isCorrect = selectedLetter === correctLetter;

        return (
          <div className={`feedback-panel ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div style={{ fontWeight: 600 }}>
              {isCorrect ? (
                <><CheckCircleFilled style={{ color: '#2a9d8f', marginRight: 8 }} />Chính xác!</>
              ) : (
                <>
                  <CloseCircleFilled style={{ color: '#e76f51', marginRight: 8 }} />
                  Chưa đúng — Đáp án đúng:{' '}
                  <Tag color="success">{correctLetter.toUpperCase()}</Tag>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Missing distractors warning */}
      {answers.length < 4 && answers.length > 0 && (
        <Alert
          type="warning"
          message={`Câu hỏi này chỉ có ${answers.length} đáp án (thiếu đáp án nhiễu từ nguồn gốc).`}
          style={{ marginTop: 8, fontSize: 13 }}
          showIcon
        />
      )}
    </div>
  );
});

export default AnswerOptions;
