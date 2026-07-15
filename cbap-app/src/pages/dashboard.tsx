// ============================================================
// Dashboard — Main landing page: exam cards (số đề lấy động từ dữ liệu)
// Shows progress, best score, data quality warnings
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Button,
  Select,
  Typography,
  Space,
  Statistic,
  Skeleton,
  Tooltip,
  Segmented,
} from 'antd';
import {
  PlayCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useExamContext } from '@/context/exam-context';
import { buildExamSummary, getExamNumbers } from '@/utils/data-filter';
import ExamTableView from '@/components/dashboard/exam-table-view';

const { Title, Text } = Typography;

type FilterType = 'all' | 'clean' | 'minor' | 'broken';

const FILTER_OPTIONS = [
  { label: 'Tất cả đề thi', value: 'all' },
  { label: 'Đề chuẩn (đủ 120 câu)', value: 'clean' },
  { label: 'Có lỗi nhẹ', value: 'minor' },
  { label: 'Có lỗi nặng (cảnh báo)', value: 'broken' },
];

export default function Dashboard() {
  const { state } = useExamContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const examNumbers = useMemo(
    () => getExamNumbers(state.allQuestions),
    [state.allQuestions]
  );

  const summaries = useMemo(
    () => examNumbers.map((n) => buildExamSummary(state.allQuestions, state.examHistory, n)),
    [examNumbers, state.allQuestions, state.examHistory]
  );

  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => {
      if (filter === 'all') return true;
      if (filter === 'clean') return s.totalUsable >= 115 && !s.hasWarning;
      if (filter === 'minor') return s.totalUsable < 115 && s.totalUsable > 50;
      if (filter === 'broken') return s.hasWarning || s.totalUsable <= 50;
      return true;
    });
  }, [summaries, filter]);

  // Overall stats
  const totalAnswered = useMemo(() => {
    const ids = new Set<string>();
    state.examHistory.forEach((h) => Object.keys(h.userAnswers).forEach((id) => ids.add(id)));
    return ids.size;
  }, [state.examHistory]);

  const totalUsable = state.buckets.usable.length;

  // Average score across all exam attempts
  const averageScore = useMemo(() => {
    if (state.examHistory.length === 0) return null;
    const sum = state.examHistory.reduce((acc, h) => acc + h.scorePercentage, 0);
    return Math.round(sum / state.examHistory.length);
  }, [state.examHistory]);

  if (!state.isDataLoaded) {
    return (
      <div style={{ padding: '32px 40px' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col key={i} xs={24} sm={12} md={8} lg={6}>
              <Card><Skeleton active /></Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: '#1d3557', marginBottom: 4 }}>
          📚 CBAP Practice Exam Simulator
        </Title>
        <Text type="secondary">
          {examNumbers.length} đề thi · {totalUsable.toLocaleString()} câu hỏi khả dụng · BABOK v3
        </Text>
      </div>

      {/* ── Overall Progress Stats ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        <Col>
          <Card style={{ borderRadius: 10, minWidth: 160 }}>
            <Statistic
              title="Câu đã làm"
              value={totalAnswered}
              suffix={`/ ${totalUsable}`}
              valueStyle={{ color: '#1d3557', fontSize: 22 }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col>
          <Card style={{ borderRadius: 10, minWidth: 160 }}>
            <Statistic
              title="Lượt thi đã thực hiện"
              value={state.examHistory.length}
              valueStyle={{ color: '#457b9d', fontSize: 22 }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col>
          <Card style={{ borderRadius: 10, minWidth: 180 }}>
            <Statistic
              title="Điểm thi trung bình"
              value={averageScore !== null ? averageScore : '—'}
              suffix={averageScore !== null ? '%' : ''}
              valueStyle={{
                color:
                  averageScore === null
                    ? '#6c757d'
                    : averageScore >= 75
                    ? '#52c41a'
                    : averageScore >= 60
                    ? '#faad14'
                    : '#ff4d4f',
                fontSize: 22,
              }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Filter Bar ── */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Text style={{ fontWeight: 500 }}>Lọc đề:</Text>
        <Select
          value={filter}
          onChange={(v) => setFilter(v as FilterType)}
          options={FILTER_OPTIONS}
          style={{ width: 220 }}
          id="exam-filter-select"
        />
        <Text type="secondary" style={{ fontSize: 13 }}>
          Hiển thị {filteredSummaries.length}/{summaries.length} đề
        </Text>
        <div style={{ marginLeft: 'auto' }}>
          <Segmented
            id="view-mode-toggle"
            value={viewMode}
            onChange={(v) => setViewMode(v as 'grid' | 'table')}
            options={[
              { label: 'Lưới', value: 'grid', icon: <AppstoreOutlined /> },
              { label: 'Bảng', value: 'table', icon: <BarsOutlined /> },
            ]}
          />
        </div>
      </div>

      {/* ── Exam List: Grid or Table ── */}
      {viewMode === 'grid' ? (
        <Row gutter={[16, 16]}>
          {filteredSummaries.map((summary) => (
            <Col key={summary.examNumber} xs={24} sm={12} md={8} lg={6}>
              <div className="exam-card-wrapper">
                <Card
                  bordered
                  hoverable
                  style={{ borderRadius: 10, height: '100%' }}
                  id={`exam-card-${summary.examNumber}`}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Title level={5} style={{ color: '#1d3557', margin: 0 }}>
                      Đề {summary.examNumber}
                    </Title>
                    {summary.bestScore !== null && (
                      <Tooltip title="Điểm cao nhất">
                        <Tag
                          color={summary.bestScore >= 75 ? 'success' : summary.bestScore >= 60 ? 'warning' : 'error'}
                          icon={<TrophyOutlined />}
                        >
                          {summary.bestScore}%
                        </Tag>
                      </Tooltip>
                    )}
                  </div>

                  {/* Stats */}
                  <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, color: '#6c757d' }}>
                      {summary.totalUsable} câu khả dụng
                    </Text>
                    {summary.attemptCount > 0 && (
                      <Text style={{ fontSize: 12, color: '#6c757d' }}>
                        {summary.attemptCount} lần thực hiện
                      </Text>
                    )}
                  </Space>

                  {/* Actions */}
                  <Space style={{ width: '100%' }} direction="vertical" size={8}>
                    <Button
                      type="primary"
                      block
                      icon={<PlayCircleOutlined />}
                      onClick={() => navigate(`/exam/${summary.examNumber}?mode=simulation`)}
                      disabled={summary.totalUsable === 0}
                      id={`btn-simulate-${summary.examNumber}`}
                    >
                      Thi mô phỏng
                    </Button>
                    <Button
                      block
                      icon={<BookOutlined />}
                      onClick={() => navigate(`/exam/${summary.examNumber}?mode=practice`)}
                      disabled={summary.totalUsable === 0}
                      id={`btn-practice-${summary.examNumber}`}
                    >
                      Luyện tập
                    </Button>
                  </Space>
                </Card>
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <ExamTableView summaries={filteredSummaries} />
      )}

    </div>
  );
}
