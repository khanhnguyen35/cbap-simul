// ============================================================
// QuestionCard — Renders question text with image support
// Replaces [HÌNH ẢNH: xxx.png] placeholder with Ant Design Image
// ============================================================

import React, { memo } from 'react';
import { Image, Space } from 'antd';
import type { Question } from '@/types/exam';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;   // Vị trí trong đề (1-based)
  totalInExam: number;
}

export function renderTextWithImages(text: string, imageFiles: string[]): React.ReactNode {
  if (!text) return null;
  if (!text.includes('[HÌNH ẢNH:')) {
    return <>{text}</>;
  }

  // Split text quanh các placeholder ảnh
  const parts = text.split(/(\[HÌNH ẢNH:[^\]]+\])/g);
  return (
    <>
      {parts.map((part, idx) => {
        const match = part.match(/\[HÌNH ẢNH:\s*([^\]]+)\]/);
        if (match) {
          const filename = match[1].trim();
          return (
            <div key={idx} style={{ margin: '12px 0' }}>
              <Image
                src={`/exams/images/${filename}`}
                alt={`Sơ đồ: ${filename}`}
                style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid #dee2e6' }}
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Crect width='200' height='120' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%236c757d' font-size='13'%3EHình ảnh bị lỗi%3C/text%3E%3C/svg%3E"
              />
              <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4, textAlign: 'center' }}>
                {imageFiles.includes(filename)
                  ? `[Sơ đồ: ${filename}]`
                  : '⚠ Hình ảnh sơ đồ bị lỗi từ nguồn gốc'}
              </div>
            </div>
          );
        }
        return part ? <span key={idx}>{part}</span> : null;
      })}
    </>
  );
}

const QuestionCard = memo(function QuestionCard({
  question,
  questionNumber,
  totalInExam,
}: QuestionCardProps) {
  return (
    <div>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <div style={{ color: '#6c757d', fontSize: 13, fontWeight: 500 }}>
          Câu {questionNumber} / {totalInExam}
        </div>
        <div className="question-text">
          {renderTextWithImages(question.questionText, question.imageFiles)}
        </div>
      </Space>
    </div>
  );
});

export default QuestionCard;
