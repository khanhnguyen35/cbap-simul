// ============================================================
// ExamHeader — Sticky top bar: exam title, timer, actions
// Timer turns amber at <20min and red at <10min
// ============================================================

import React from 'react';
import { Affix, Button, Space, Typography, Popconfirm, Tooltip } from 'antd';
import { LogoutOutlined, BookOutlined, BookFilled } from '@ant-design/icons';
import { formatTime } from '@/utils/tsv-helper';
import type { ExamMode } from '@/types/exam';

const { Text } = Typography;

interface ExamHeaderProps {
  examNumber: number;
  mode: ExamMode;
  remainingSeconds: number;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onSubmit: () => void;
  answeredCount: number;
  totalCount: number;
}

const MODE_LABEL: Record<ExamMode, string> = {
  simulation: 'Thi mô phỏng',
  practice: 'Luyện tập',
  flashcard: 'Flashcard',
};

export default function ExamHeader({
  examNumber,
  mode,
  remainingSeconds,
  isBookmarked,
  onToggleBookmark,
  onSubmit,
  answeredCount,
  totalCount,
}: ExamHeaderProps) {
  const isCritical = remainingSeconds < 600;   // < 10 phút
  const isWarning = remainingSeconds < 1200;   // < 20 phút

  const timerClass = isCritical
    ? 'exam-timer critical'
    : isWarning
    ? 'exam-timer warning'
    : 'exam-timer';

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
        }}
        id="exam-header"
      >
        {/* Left: Title */}
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            {MODE_LABEL[mode]}
          </Text>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>
            Đề {examNumber}
          </div>
        </div>

        {/* Center: Timer (only for simulation) */}
        {mode === 'simulation' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 2 }}>
              Thời gian còn lại
            </div>
            <span className={timerClass} id="exam-countdown-timer">
              {formatTime(remainingSeconds)}
            </span>
          </div>
        )}

        {/* Right: Actions + Progress */}
        <Space size={12}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            {answeredCount}/{totalCount} câu
          </Text>

          <Tooltip title={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu câu này'}>
            <Button
              type="text"
              id="btn-bookmark-current"
              icon={isBookmarked ? <BookFilled style={{ color: '#e9c46a' }} /> : <BookOutlined style={{ color: 'white' }} />}
              onClick={onToggleBookmark}
              style={{ color: 'white' }}
            />
          </Tooltip>

          <Popconfirm
            title="Xác nhận nộp bài"
            description={`Bạn đã trả lời ${answeredCount}/${totalCount} câu. Nộp bài ngay?`}
            onConfirm={onSubmit}
            okText="Nộp bài"
            cancelText="Tiếp tục làm"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              type="primary"
              icon={<LogoutOutlined />}
              id="btn-submit-exam"
            >
              Nộp bài
            </Button>
          </Popconfirm>
        </Space>
      </div>
    </Affix>
  );
}
