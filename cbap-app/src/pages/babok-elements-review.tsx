// ============================================================
// babok-elements-review.tsx — BABOK Elements Review Page
// Users select a KA, then recall elements for each task.
// Two modes: Free-type OR Dropdown selection.
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Typography, Select, Tag, Input, Button, Progress, Space, Card, Badge,
  Spin, Segmented, Tooltip
} from 'antd';
import {
  CheckCircleFilled, CloseCircleFilled, PlusOutlined, ReloadOutlined,
  TrophyFilled, BookOutlined, ArrowLeftOutlined, OrderedListOutlined, EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// ─── Types ───────────────────────────────────────────────────
interface BabokTask {
  id: string;
  name: string;
  inputs: string[];
  outputs: string[];
  elements: string[];
}

interface KnowledgeArea {
  id: string;
  name: string;
  short_name: string;
  chapter: number;
  tasks: BabokTask[];
}

interface BabokData {
  knowledge_areas: KnowledgeArea[];
}

interface TaskResult {
  taskId: string;
  entries: string[];
  checked: boolean;
  matches: boolean[];
  missed: string[];
}

// ─── Fuzzy match ─────────────────────────────────────────────
function normalizeItem(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyMatch(userEntry: string, correctItems: string[]): boolean {
  const u = normalizeItem(userEntry);
  if (!u) return false;
  return correctItems.some(item => {
    const n = normalizeItem(item);
    return n.includes(u) || u.includes(n);
  });
}

function computeMatches(entries: string[], correct: string[]): boolean[] {
  return entries.map(e => fuzzyMatch(e, correct));
}

function findMissed(entries: string[], correct: string[]): string[] {
  return correct.filter(c => {
    const cn = normalizeItem(c);
    return !entries.some(e => {
      const en = normalizeItem(e);
      return cn.includes(en) || en.includes(cn);
    });
  });
}

// ─── All elements pool for dropdown (deduplicated across all tasks in KA) ────
function getAllElements(ka: KnowledgeArea): string[] {
  const set = new Set<string>();
  ka.tasks.forEach(t => t.elements.forEach(e => set.add(e)));
  return Array.from(set).sort();
}

// ─── KA color map ────────────────────────────────────────────
const KA_COLORS: Record<string, string> = {
  BAPM: '#1d3557',
  EC: '#457b9d',
  RLCM: '#2a9d8f',
  SA: '#e9c46a',
  RADD: '#f4a261',
  SE: '#e76f51',
};

// ─── Main Page ────────────────────────────────────────────────
export default function BabokElementsReview() {
  const navigate = useNavigate();
  const [data, setData] = useState<BabokData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKA, setSelectedKA] = useState<string | null>(null);
  const [mode, setMode] = useState<'type' | 'select'>('type');
  const [results, setResults] = useState<Record<string, TaskResult>>({});

  useEffect(() => {
    fetch('/babok/babok-tasks.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const ka = data?.knowledge_areas.find(k => k.id === selectedKA);
  const allElements = ka ? getAllElements(ka) : [];

  // Init results when KA changes
  useEffect(() => {
    if (!ka) return;
    const init: Record<string, TaskResult> = {};
    ka.tasks.forEach(t => {
      init[t.id] = { taskId: t.id, entries: [], checked: false, matches: [], missed: [] };
    });
    setResults(init);
  }, [selectedKA]);

  const addEntry = (taskId: string, value: string) => {
    if (!value.trim()) return;
    setResults(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], entries: [...prev[taskId].entries, value.trim()] }
    }));
  };

  const removeEntry = (taskId: string, index: number) => {
    setResults(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], entries: prev[taskId].entries.filter((_, i) => i !== index) }
    }));
  };

  const checkTask = (task: BabokTask) => {
    setResults(prev => {
      const r = { ...prev[task.id] };
      r.checked = true;
      r.matches = computeMatches(r.entries, task.elements);
      r.missed = findMissed(r.entries, task.elements);
      return { ...prev, [task.id]: r };
    });
  };

  const resetTask = (taskId: string) => {
    setResults(prev => ({
      ...prev,
      [taskId]: { taskId, entries: [], checked: false, matches: [], missed: [] }
    }));
  };

  const resetAll = () => {
    if (!ka) return;
    const init: Record<string, TaskResult> = {};
    ka.tasks.forEach(t => {
      init[t.id] = { taskId: t.id, entries: [], checked: false, matches: [], missed: [] };
    });
    setResults(init);
  };

  const checkedTasks = ka ? ka.tasks.filter(t => results[t.id]?.checked) : [];
  const correctTasks = checkedTasks.filter(t => results[t.id]?.missed.length === 0);
  const progress = ka ? Math.round((checkedTasks.length / ka.tasks.length) * 100) : 0;
  const kaColor = selectedKA ? KA_COLORS[selectedKA] || '#1d3557' : '#1d3557';

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${kaColor} 0%, ${kaColor}cc 100%)`,
        padding: '24px 32px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
              size="small"
            />
            <OrderedListOutlined style={{ fontSize: 20, color: '#fff' }} />
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              Ôn tập Elements — BABOK v3
            </Title>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginBottom: 6 }}>
                Chọn Knowledge Area:
              </Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn Knowledge Area..."
                size="large"
                value={selectedKA}
                onChange={v => setSelectedKA(v)}
                loading={loading}
                options={data?.knowledge_areas.map(k => ({
                  value: k.id,
                  label: `KA ${k.chapter}: ${k.name} (${k.short_name})`,
                }))}
              />
            </div>

            {/* Mode switch */}
            <div>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginBottom: 6 }}>
                Chế độ nhập:
              </Text>
              <Segmented
                value={mode}
                onChange={v => setMode(v as 'type' | 'select')}
                options={[
                  { label: '✏️ Tự nhập', value: 'type' },
                  { label: '📋 Chọn từ danh sách', value: 'select' },
                ]}
                style={{ background: 'rgba(255,255,255,0.15)' }}
              />
            </div>

            {selectedKA && (
              <Button
                icon={<ReloadOutlined />}
                onClick={resetAll}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
              >
                Reset
              </Button>
            )}
          </div>

          {ka && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  Đã kiểm tra: {checkedTasks.length}/{ka.tasks.length}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  ✅ Hoàn chỉnh: {correctTasks.length}/{checkedTasks.length}
                </Text>
              </div>
              <Progress
                percent={progress}
                strokeColor="#a8e6cf"
                trailColor="rgba(255,255,255,0.2)"
                showInfo={false}
                strokeWidth={6}
              />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 48px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
            <div style={{ color: '#6b7280', marginTop: 16 }}>Đang tải...</div>
          </div>
        )}

        {!loading && !selectedKA && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <Title level={4} style={{ color: '#374151', fontWeight: 600 }}>
              Chọn một Knowledge Area để bắt đầu
            </Title>
            <Text style={{ color: '#9ca3af' }}>
              Nhớ lại các elements của từng task — tự nhập hoặc chọn từ danh sách.
            </Text>
          </div>
        )}

        {!loading && ka && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {ka.tasks.map(task => {
              const r = results[task.id];
              if (!r) return null;
              const taskDone = r.checked && r.missed.length === 0;
              const taskFail = r.checked && r.missed.length > 0;

              return (
                <Card
                  key={task.id}
                  size="small"
                  style={{
                    borderRadius: 12,
                    border: taskDone
                      ? '2px solid #2a9d8f'
                      : taskFail
                      ? '2px solid #e76f51'
                      : '1px solid #e5e7eb',
                    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s',
                  }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Tag
                        color={kaColor}
                        style={{ borderRadius: 6, fontWeight: 700, fontSize: 12, margin: 0 }}
                      >
                        {task.id}
                      </Tag>
                      <Text strong style={{ fontSize: 13 }}>{task.name}</Text>
                      {taskDone && <TrophyFilled style={{ color: '#f59e0b', marginLeft: 'auto' }} />}
                    </div>
                  }
                  extra={
                    <Space size={8}>
                      <Badge
                        count={task.elements.length}
                        style={{ backgroundColor: '#6b7280', fontSize: 10 }}
                        title={`${task.elements.length} elements`}
                      />
                      {r.checked ? (
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={() => resetTask(task.id)}
                          style={{ borderRadius: 20 }}
                        >
                          Thử lại
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => checkTask(task)}
                          style={{ borderRadius: 20, background: kaColor, border: 'none' }}
                          disabled={r.entries.length === 0}
                        >
                          Kiểm tra
                        </Button>
                      )}
                    </Space>
                  }
                >
                  {/* Entry area */}
                  <div style={{ padding: '8px 4px' }}>
                    {/* Tags of entries */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, minHeight: 32 }}>
                      {r.entries.map((e, i) => {
                        const isMatch = r.checked ? r.matches[i] : undefined;
                        return (
                          <Tag
                            key={i}
                            closable={!r.checked}
                            onClose={() => removeEntry(task.id, i)}
                            color={r.checked ? (isMatch ? '#52c41a' : '#ff4d4f') : '#1d3557'}
                            icon={r.checked ? (isMatch ? <CheckCircleFilled /> : <CloseCircleFilled />) : undefined}
                            style={{
                              borderRadius: 20, padding: '3px 12px', fontSize: 12,
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                          >
                            {e}
                          </Tag>
                        );
                      })}
                      {r.entries.length === 0 && (
                        <Text style={{ color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>
                          Chưa có element nào được thêm...
                        </Text>
                      )}
                    </div>

                    {/* Missed items */}
                    {r.checked && r.missed.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <Text style={{ fontSize: 11, color: '#e76f51', fontWeight: 500 }}>
                          Còn thiếu:
                        </Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {r.missed.map((m, i) => (
                            <Tag key={i} style={{
                              background: '#fef2f2', border: '1px dashed #e76f51',
                              color: '#e76f51', borderRadius: 20, fontSize: 11, padding: '2px 10px'
                            }}>
                              {m}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input controls */}
                    {!r.checked && (
                      mode === 'type' ? (
                        <TypeInput
                          onAdd={v => addEntry(task.id, v)}
                          disabled={r.checked}
                          placeholder="Nhập tên element rồi Enter..."
                        />
                      ) : (
                        <SelectInput
                          options={allElements}
                          selected={r.entries}
                          onAdd={v => addEntry(task.id, v)}
                          disabled={r.checked}
                        />
                      )
                    )}

                    {/* Result summary */}
                    {r.checked && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        background: taskDone ? '#dcfce7' : '#fef2f2',
                        border: taskDone ? '1px solid #bbf7d0' : '1px solid #fecaca'
                      }}>
                        {taskDone ? (
                          <Text style={{ color: '#166534', fontSize: 12 }}>
                            ✅ Tuyệt vời! Bạn đã nhớ đúng tất cả {task.elements.length} elements.
                          </Text>
                        ) : (
                          <Text style={{ color: '#991b1b', fontSize: 12 }}>
                            ❌ Còn thiếu {r.missed.length}/{task.elements.length} elements. Bạn đã nhập đúng {r.matches.filter(Boolean).length} elements.
                          </Text>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </div>
    </div>
  );
}

// ─── TypeInput sub-component ──────────────────────────────────
function TypeInput({ onAdd, disabled, placeholder }: {
  onAdd: (v: string) => void;
  disabled: boolean;
  placeholder: string;
}) {
  const [val, setVal] = useState('');
  return (
    <Input
      value={val}
      onChange={e => setVal(e.target.value)}
      onPressEnter={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}
      placeholder={placeholder}
      disabled={disabled}
      size="small"
      suffix={
        <Button
          type="link" icon={<PlusOutlined />} size="small" style={{ padding: 0 }}
          onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}
        />
      }
      style={{ borderRadius: 20, fontSize: 12, maxWidth: 400 }}
      prefix={<EditOutlined style={{ color: '#9ca3af' }} />}
    />
  );
}

// ─── SelectInput sub-component ────────────────────────────────
function SelectInput({ options, selected, onAdd, disabled }: {
  options: string[];
  selected: string[];
  onAdd: (v: string) => void;
  disabled: boolean;
}) {
  const available = options.filter(o => !selected.includes(o));
  return (
    <Select
      showSearch
      placeholder="Chọn element từ danh sách..."
      style={{ width: '100%', maxWidth: 500 }}
      size="small"
      value={undefined}
      disabled={disabled}
      onChange={(v: unknown) => onAdd(String(v))}
      options={available.map(o => ({ value: o, label: o }))}
      filterOption={(input, option) =>
        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  );
}
