// ============================================================
// Analytics — Learning history, score trends, drill-down
// Charts: Line (score trend) + Bar (exam comparison)
// ============================================================

import React, { useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Typography,
  Tag,
  Button,
  Empty,
  Statistic,
  Space,
  Popconfirm,
} from 'antd';
import {
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useExamContext } from '@/context/exam-context';
import { formatDateTime, formatDuration } from '@/utils/tsv-helper';
import type { ExamHistory } from '@/types/exam';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// CBAP passing score is typically 75%
const PASSING_SCORE = 75;

export default function Analytics() {
  const { state, deleteHistory } = useExamContext();
  const navigate = useNavigate();

  const history = state.examHistory;

  // ── Chart data: score trend over attempts ────────────────
  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .map((h, idx) => ({
          attempt: `Lần ${idx + 1}`,
          score: h.scorePercentage,
          exam: `Đề ${h.examNumber}`,
          label: `Đề ${h.examNumber} - ${formatDateTime(h.timestamp)}`,
        })),
    [history]
  );

  // ── Summary stats ────────────────────────────────────────
  const avgScore = history.length
    ? Math.round(history.reduce((sum, h) => sum + h.scorePercentage, 0) / history.length)
    : 0;
  const bestScore = history.length ? Math.max(...history.map((h) => h.scorePercentage)) : 0;
  const passCount = history.filter((h) => h.scorePercentage >= PASSING_SCORE).length;

  // ── History table columns ────────────────────────────────
  const columns: ColumnsType<ExamHistory> = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (v: number) => <Text style={{ fontSize: 13 }}>{formatDateTime(v)}</Text>,
      sorter: (a, b) => b.timestamp - a.timestamp,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Đề số',
      dataIndex: 'examNumber',
      key: 'examNumber',
      render: (v: number) => <Tag color="blue">Đề {v}</Tag>,
      width: 90,
    },
    {
      title: 'Chế độ',
      dataIndex: 'mode',
      key: 'mode',
      width: 110,
      render: (v: string) => (
        <Tag>{v === 'simulation' ? 'Thi thử' : 'Luyện tập'}</Tag>
      ),
    },
    {
      title: 'Điểm',
      dataIndex: 'scorePercentage',
      key: 'score',
      width: 90,
      sorter: (a, b) => a.scorePercentage - b.scorePercentage,
      render: (v: number) => (
        <Tag color={v >= PASSING_SCORE ? 'success' : v >= 60 ? 'warning' : 'error'}>
          {v}%
        </Tag>
      ),
    },
    {
      title: 'Đúng / Tổng',
      key: 'correct',
      width: 110,
      render: (_: unknown, r: ExamHistory) => (
        <Text style={{ fontSize: 13 }}>
          {r.correctAnswersCount}/{r.totalQuestions}
        </Text>
      ),
    },
    {
      title: 'Thời gian làm',
      dataIndex: 'durationUsed',
      key: 'duration',
      width: 120,
      render: (v: number) => (
        <Text style={{ fontSize: 13 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {formatDuration(v)}
        </Text>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 140,
      render: (_: unknown, record: ExamHistory) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/review/${record.id}`)}
            id={`btn-view-history-${record.id}`}
          >
            Xem lại
          </Button>
          <Popconfirm
            title="Xóa bản ghi này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => deleteHistory(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              id={`btn-delete-history-${record.id}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];


  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ color: '#1d3557', margin: 0 }}>
          📊 Thống kê học tập
        </Title>
      </div>

      {history.length === 0 ? (
        <Empty description="Chưa có lịch sử làm bài. Hãy làm thử 1 đề thi!" />
      ) : (
        <>
          {/* ── Summary Stats ── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
            <Col>
              <Card style={{ borderRadius: 10, minWidth: 150 }}>
                <Statistic
                  title="Lượt thi đã thực hiện"
                  value={history.length}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#1d3557' }}
                />
              </Card>
            </Col>
            <Col>
              <Card style={{ borderRadius: 10, minWidth: 150 }}>
                <Statistic
                  title="Điểm trung bình"
                  value={avgScore}
                  suffix="%"
                  valueStyle={{ color: avgScore >= PASSING_SCORE ? '#2a9d8f' : '#e76f51' }}
                />
              </Card>
            </Col>
            <Col>
              <Card style={{ borderRadius: 10, minWidth: 150 }}>
                <Statistic
                  title="Điểm cao nhất"
                  value={bestScore}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#e9c46a' }}
                />
              </Card>
            </Col>
            <Col>
              <Card style={{ borderRadius: 10, minWidth: 150 }}>
                <Statistic
                  title="Lần đạt chuẩn (≥75%)"
                  value={passCount}
                  suffix={`/ ${history.length}`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#2a9d8f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* ── Score Trend Chart ── */}
          {chartData.length > 0 && (
            <Card
              title="📈 Xu hướng điểm số"
              style={{ borderRadius: 10, marginBottom: 24 }}
              id="score-trend-chart"
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 30, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="attempt" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Điểm']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.label ?? label}
                  />
                  <Legend />
                  <ReferenceLine
                    y={PASSING_SCORE}
                    stroke="#e76f51"
                    strokeDasharray="6 3"
                    label={{ value: 'Chuẩn CBAP (75%)', fill: '#e76f51', fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Điểm"
                    stroke="#1d3557"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#1d3557' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* ── History Table ── */}
          <Card title="📋 Lịch sử làm bài" style={{ borderRadius: 10 }}>
            <Table
              dataSource={history}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="middle"
              scroll={{ x: 700 }}
            />
          </Card>
        </>
      )}

    </div>
  );
}
