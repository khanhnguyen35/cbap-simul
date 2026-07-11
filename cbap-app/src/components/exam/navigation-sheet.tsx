// ============================================================
// NavigationSheet — Question grid navigation (1-120)
// Color-coded: unanswered / answered / current / bookmarked
// Memoized to avoid unnecessary re-renders
// ============================================================

import React, { memo } from 'react';
import { Affix, Typography } from 'antd';
import { BookFilled } from '@ant-design/icons';

const { Text } = Typography;

interface NavigationSheetProps {
  questionIds: string[];           // Ordered list of question IDs
  currentIndex: number;            // 0-based current question index
  userAnswers: Record<string, string>;
  bookmarks: Set<string>;
  onNavigate: (index: number) => void;
}

const NavigationSheet = memo(function NavigationSheet({
  questionIds,
  currentIndex,
  userAnswers,
  bookmarks,
  onNavigate,
}: NavigationSheetProps) {
  const answeredCount = Object.keys(userAnswers).length;
  const bookmarkedCount = bookmarks.size;

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
        {/* Stats */}
        <div style={{ marginBottom: 12, display: 'flex', gap: 16, fontSize: 13 }}>
          <Text style={{ color: '#1d3557', fontWeight: 600 }}>
            ✅ {answeredCount}/{questionIds.length}
          </Text>
          {bookmarkedCount > 0 && (
            <Text style={{ color: '#d4a017' }}>
              <BookFilled /> {bookmarkedCount}
            </Text>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, fontSize: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#1d3557', borderRadius: 2, display: 'inline-block' }} />
            Đã trả lời
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#e9c46a', borderRadius: 2, display: 'inline-block' }} />
            Đánh dấu
          </span>
        </div>

        {/* Question grid */}
        <div className="nav-sheet-grid" id="nav-sheet-grid">
          {questionIds.map((qId, idx) => {
            const isAnswered = qId in userAnswers;
            const isBookmarked = bookmarks.has(qId);
            const isCurrent = idx === currentIndex;

            let cellClass = 'nav-cell';
            if (isCurrent) cellClass += ' current';
            else if (isBookmarked) cellClass += ' bookmarked';
            else if (isAnswered) cellClass += ' answered';

            return (
              <div
                key={qId}
                className={cellClass}
                onClick={() => onNavigate(idx)}
                title={`Câu ${idx + 1}`}
                id={`nav-cell-${idx + 1}`}
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
});

export default NavigationSheet;
