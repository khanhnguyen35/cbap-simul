// ============================================================
// DataQualityInspector — Lists broken questions (missing_all_answers)
// Searchable table with CSV export
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Table,
  Input,
  Button,
  Typography,
  Space,
  Tag,
  Alert,
} from 'antd';
import { SearchOutlined, DownloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useExamContext } from '@/context/exam-context';
import type { ColumnsType } from 'antd/es/table';
import type { Question } from '@/types/exam';

const { Title, Text } = Typography;

export default function DataQualityInspector() {
  const { state } = useExamContext();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  const brokenQuestions = state.buckets.broken;

  const filtered = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return brokenQuestions;
    return brokenQuestions.filter(
      (q) =>
        q.questionText.toLowerCase().includes(term) ||
        String(q.examNumber).includes(term)
    );
  }, [brokenQuestions, searchText]);

  const handleExportCsv = () => {
    const rows = [
      ['Đề số', 'Câu số', 'ID', 'Nội dung câu hỏi'].join(','),
      ...brokenQuestions.map((q) =>
        [
          q.examNumber,
          q.questionOrder,
          q.id,
          `"${q.questionText.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cbap-missing-questions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<Question> = [
    {
      title: 'Đề số',
      dataIndex: 'examNumber',
      key: 'examNumber',
      width: 80,
      sorter: (a, b) => a.examNumber - b.examNumber,
      render: (v: number) => <Tag color="red">Đề {v}</Tag>,
    },
    {
      title: 'Câu',
      dataIndex: 'questionOrder',
      key: 'questionOrder',
      width: 70,
      sorter: (a, b) => a.questionOrder - b.questionOrder,
    },
    {
      title: 'Nội dung câu hỏi',
      dataIndex: 'questionText',
      key: 'questionText',
      render: (text: string) => (
        <Text style={{ fontSize: 14, lineHeight: 1.5 }}>
          {text.length > 200 ? text.slice(0, 200) + '...' : text}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'quality',
      width: 160,
      render: () => (
        <Tag color="error">Thiếu toàn bộ đáp án</Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ color: '#1d3557', marginBottom: 4 }}>
            ⚠️ Quản lý Chất lượng Dữ liệu
          </Title>
          <Text type="secondary">
            Các câu hỏi không có đáp án từ dữ liệu nguồn — cần tra cứu thủ công theo tài liệu BABOK.
          </Text>
        </div>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/')} id="btn-inspector-home">
          Về Dashboard
        </Button>
      </div>

      <Alert
        type="warning"
        showIcon
        message="Lưu ý về dữ liệu lỗi"
        description={
          <>
            Các câu hỏi dưới đây bị thiếu toàn bộ đáp án từ nguồn gốc (chủ yếu ở Đề 20 và Đề 21).
            Chúng đã được <strong>loại khỏi chế độ thi và luyện tập</strong>.
            Bạn có thể tra cứu đáp án từ sách BABOK v3 hoặc tài liệu luyện thi gốc.
          </>
        }
        style={{ marginBottom: 20 }}
      />

      {/* Toolbar */}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input
          placeholder="Tìm kiếm theo nội dung hoặc số đề..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 380 }}
          id="input-search-broken"
          allowClear
        />
        <Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {filtered.length} / {brokenQuestions.length} câu hỏi
          </Text>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCsv}
            id="btn-export-csv"
          >
            Xuất CSV
          </Button>
        </Space>
      </Space>

      {/* Table */}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20, showSizeChanger: true }}
        bordered
        size="middle"
        scroll={{ x: 800 }}
      />
    </div>
  );
}
