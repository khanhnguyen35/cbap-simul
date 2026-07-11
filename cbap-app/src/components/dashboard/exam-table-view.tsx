// ============================================================
// ExamTableView — Table view of all exam summaries for Dashboard
// Columns: Đề, Câu khả dụng, Trạng thái, Tiến độ, Điểm cao, Lần thi, Hành động
// ============================================================

import React from 'react';
import { Table, Tag, Progress, Button, Space, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlayCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ExamSummary } from '@/types/exam';

const { Text } = Typography;

interface ExamTableViewProps {
  summaries: ExamSummary[];
}

// Determine quality status for display
function getQualityTag(summary: ExamSummary) {
  if (summary.hasWarning) {
    return (
      <Tooltip title={summary.warningMessage}>
        <Tag icon={<WarningOutlined />} color="error">Lỗi nặng</Tag>
      </Tooltip>
    );
  }
  if (summary.totalQuestions !== summary.totalUsable) {
    return (
      <Tooltip title={`${summary.totalQuestions - summary.totalUsable} câu bị lỗi`}>
        <Tag icon={<ExclamationCircleOutlined />} color="warning">Lỗi nhẹ</Tag>
      </Tooltip>
    );
  }
  return <Tag icon={<CheckCircleOutlined />} color="success">Chuẩn</Tag>;
}

export default function ExamTableView({ summaries }: ExamTableViewProps) {
  const navigate = useNavigate();

  const columns: ColumnsType<ExamSummary> = [
    {
      title: 'Đề',
      dataIndex: 'examNumber',
      key: 'examNumber',
      width: 72,
      sorter: (a, b) => a.examNumber - b.examNumber,
      render: (num: number) => (
        <Text strong style={{ color: '#1d3557', fontSize: 15 }}>
          #{num}
        </Text>
      ),
    },
    {
      title: 'Câu khả dụng',
      dataIndex: 'totalUsable',
      key: 'totalUsable',
      width: 140,
      sorter: (a, b) => a.totalUsable - b.totalUsable,
      render: (usable: number, record) => (
        <Space size={4}>
          <Text>{usable}</Text>
          {record.totalQuestions !== usable && (
            <Text type="danger" style={{ fontSize: 12 }}>
              ({record.totalQuestions - usable} lỗi)
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Chuẩn', value: 'clean' },
        { text: 'Lỗi nhẹ', value: 'minor' },
        { text: 'Lỗi nặng', value: 'broken' },
      ],
      onFilter: (value, record) => {
        if (value === 'broken') return record.hasWarning;
        if (value === 'minor') return !record.hasWarning && record.totalQuestions !== record.totalUsable;
        return !record.hasWarning && record.totalQuestions === record.totalUsable;
      },
      render: (_: unknown, record) => getQualityTag(record),
    },
    {
      title: 'Tiến độ',
      dataIndex: 'completedPercent',
      key: 'completedPercent',
      width: 160,
      sorter: (a, b) => a.completedPercent - b.completedPercent,
      render: (pct: number) => (
        <Progress
          percent={pct}
          size="small"
          strokeColor={{ '0%': '#457b9d', '100%': '#1d3557' }}
          style={{ margin: 0, minWidth: 100 }}
        />
      ),
    },
    {
      title: 'Điểm cao nhất',
      dataIndex: 'bestScore',
      key: 'bestScore',
      width: 130,
      sorter: (a, b) => (a.bestScore ?? -1) - (b.bestScore ?? -1),
      render: (score: number | null) => {
        if (score === null) return <Text type="secondary">—</Text>;
        const color = score >= 75 ? 'success' : score >= 60 ? 'warning' : 'error';
        return (
          <Tag icon={<TrophyOutlined />} color={color} style={{ fontSize: 13 }}>
            {score}%
          </Tag>
        );
      },
    },
    {
      title: 'Lần thi',
      dataIndex: 'attemptCount',
      key: 'attemptCount',
      width: 90,
      sorter: (a, b) => a.attemptCount - b.attemptCount,
      render: (count: number) =>
        count > 0 ? (
          <Text style={{ color: '#1d3557', fontWeight: 500 }}>{count}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      render: (_: unknown, record) => (
        <Space size={8}>
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => navigate(`/exam/${record.examNumber}?mode=simulation`)}
            disabled={record.totalUsable === 0}
            id={`btn-simulate-${record.examNumber}`}
          >
            Thi
          </Button>
          <Button
            size="small"
            icon={<BookOutlined />}
            onClick={() => navigate(`/exam/${record.examNumber}?mode=practice`)}
            disabled={record.totalUsable === 0}
            id={`tbl-btn-practice-${record.examNumber}`}
          >
            Luyện
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table<ExamSummary>
      columns={columns}
      dataSource={summaries}
      rowKey="examNumber"
      size="middle"
      pagination={false}
      scroll={{ x: 800 }}
      rowClassName={(record) => (record.hasWarning ? 'exam-row-warning' : '')}
      style={{ borderRadius: 10, overflow: 'hidden' }}
    />
  );
}
