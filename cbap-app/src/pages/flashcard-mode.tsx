// ============================================================
// FlashcardMode — Flip-card practice for missing_distractors questions
// Shows question → flip → correct answer + explanation
// Tracks remembered/not-remembered progress per session
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { Button, Space, Typography, Progress, Result, Tag } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useExamContext } from '@/context/exam-context';

const { Title, Text, Paragraph } = Typography;

export default function FlashcardMode() {
  const { state } = useExamContext();
  const navigate = useNavigate();

  // flashcardOnly = questions with missing_distractors
  const cards = state.buckets.flashcardOnly;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [remembered, setRemembered] = useState<Set<number>>(new Set());
  const [notRemembered, setNotRemembered] = useState<Set<number>>(new Set());

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const doneCount = remembered.size + notRemembered.size;

  const correctAnswer = useMemo(
    () => currentCard?.answers.find((a) => a.isCorrect),
    [currentCard]
  );

  const handleFlip = useCallback(() => setIsFlipped((f) => !f), []);

  const handleNext = useCallback(
    (wasRemembered: boolean) => {
      if (wasRemembered) {
        setRemembered((prev) => new Set(prev).add(currentIndex));
      } else {
        setNotRemembered((prev) => new Set(prev).add(currentIndex));
      }
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, totalCards - 1)), 300);
    },
    [currentIndex, totalCards]
  );

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRemembered(new Set());
    setNotRemembered(new Set());
  }, []);

  if (totalCards === 0) {
    return (
      <Result
        status="info"
        title="Không có câu hỏi flashcard"
        subTitle="Tất cả câu hỏi đều có đủ 4 đáp án."
        extra={<Button onClick={() => navigate('/')}>Về Dashboard</Button>}
      />
    );
  }

  const isComplete = currentIndex >= totalCards - 1 && doneCount === totalCards;

  if (isComplete) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: 24, textAlign: 'center' }}>
        <Result
          status="success"
          title={`Hoàn thành! ${remembered.size}/${totalCards} thẻ đã nhớ`}
          subTitle={`${notRemembered.size} thẻ cần ôn lại.`}
          extra={[
            <Button key="restart" icon={<ReloadOutlined />} onClick={handleRestart}>
              Ôn lại từ đầu
            </Button>,
            <Button key="home" icon={<HomeOutlined />} onClick={() => navigate('/')}>
              Về Dashboard
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ color: '#1d3557', margin: 0 }}>
          🃏 Flashcard Mode
        </Title>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/')} id="btn-flashcard-home">
          Về Dashboard
        </Button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 13, color: '#6c757d' }}>
            Thẻ {currentIndex + 1} / {totalCards}
          </Text>
          <Space>
            <Tag color="success">✅ {remembered.size} đã nhớ</Tag>
            <Tag color="error">❌ {notRemembered.size} chưa nhớ</Tag>
          </Space>
        </div>
        <Progress
          percent={Math.round((doneCount / totalCards) * 100)}
          strokeColor={{ '0%': '#457b9d', '100%': '#2a9d8f' }}
          size="small"
        />
      </div>

      {/* Flashcard */}
      <div className="flashcard-scene" onClick={handleFlip} id="flashcard-scene">
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
          {/* Front: Question */}
          <div className="flashcard-face">
            <Text style={{ fontSize: 12, color: '#6c757d', marginBottom: 16 }}>
              {!isFlipped ? 'Nhấn để xem đáp án →' : ''}
            </Text>
            <Paragraph
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: '#212529',
                textAlign: 'center',
                margin: 0,
              }}
            >
              {currentCard?.questionText}
            </Paragraph>
            {!isFlipped && (
              <Text style={{ color: '#6c757d', fontSize: 13, marginTop: 20 }}>
                🤔 Tự suy nghĩ trước, rồi nhấn để lật thẻ
              </Text>
            )}
          </div>

          {/* Back: Answer + Feedback */}
          <div className="flashcard-face flashcard-back">
            <Text style={{ fontSize: 12, color: '#2a9d8f', marginBottom: 12, fontWeight: 600 }}>
              ✅ Đáp án đúng:
            </Text>
            <Paragraph
              style={{ fontSize: 17, fontWeight: 600, color: '#1d3557', textAlign: 'center', marginBottom: 12 }}
            >
              {correctAnswer?.letter?.toUpperCase()}. {correctAnswer?.content}
            </Paragraph>
            {correctAnswer?.feedback && (
              <Paragraph
                style={{ fontSize: 14, color: '#495057', textAlign: 'center', lineHeight: 1.6 }}
              >
                {correctAnswer.feedback}
              </Paragraph>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons (show only when flipped) */}
      {isFlipped && (
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="large"
            danger
            onClick={() => handleNext(false)}
            id="btn-not-remembered"
            style={{ minWidth: 140 }}
          >
            ❌ Chưa nhớ
          </Button>
          <Button
            size="large"
            type="primary"
            style={{ background: '#2a9d8f', borderColor: '#2a9d8f', minWidth: 140 }}
            onClick={() => handleNext(true)}
            id="btn-remembered"
          >
            ✅ Đã nhớ
          </Button>
        </div>
      )}

      {/* Keyboard hint */}
      <Text
        style={{ display: 'block', textAlign: 'center', color: '#adb5bd', fontSize: 12, marginTop: 16 }}
      >
        Nhấn vào thẻ để lật · Chọn Đã nhớ / Chưa nhớ để chuyển thẻ
      </Text>
    </div>
  );
}
