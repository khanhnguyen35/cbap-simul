// ============================================================
// babok-io-review.tsx — BABOK Input/Output Review Page
// Users select a KA, then try to recall inputs/outputs for
// each task in that KA. Order-insensitive fuzzy matching.
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Typography, Select, Tag, Input, Button, Progress, Alert, Space, Tooltip,
  Card, Badge, Divider, Empty, Spin
} from 'antd';
import {
  CheckCircleFilled, CloseCircleFilled, DeleteOutlined, PlusOutlined,
  ReloadOutlined, TrophyFilled, BookOutlined, ArrowLeftOutlined
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

// Result tracking per task
interface TaskResult {
  taskId: string;
  inputEntries: string[];
  outputEntries: string[];
  checked: boolean;
  inputMatches: boolean[];
  outputMatches: boolean[];
  inputMissed: string[];
  outputMissed: string[];
}

// ─── Fuzzy match helper ───────────────────────────────────────
// Case-insensitive, trims whitespace, strips trailing parentheses content for flexible matching
function normalizeItem(s: string) {
  return s
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '') // remove parenthetical like "(external)"
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyMatch(userEntry: string, correctItems: string[]): boolean {
  const userNorm = normalizeItem(userEntry);
  if (!userNorm) return false;
  return correctItems.some(item => {
    const itemNorm = normalizeItem(item);
    // full contains check (both ways)
    return itemNorm.includes(userNorm) || userNorm.includes(itemNorm);
  });
}

function computeMatches(entries: string[], correct: string[]): boolean[] {
  return entries.map(e => fuzzyMatch(e, correct));
}

function findMissed(entries: string[], correct: string[]): string[] {
  return correct.filter(c => {
    const cNorm = normalizeItem(c);
    return !entries.some(e => {
      const eNorm = normalizeItem(e);
      return cNorm.includes(eNorm) || eNorm.includes(cNorm);
    });
  });
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

const KA_BG: Record<string, string> = {
  BAPM: '#e8edf5',
  EC: '#e3eef6',
  RLCM: '#e0f4f1',
  SA: '#fdf8e7',
  RADD: '#fef4ec',
  SE: '#feede9',
};

// ─── EntryList sub-component ─────────────────────────────────
interface EntryListProps {
  label: string;
  color: string;
  entries: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  matches?: boolean[];
  missed?: string[];
  checked: boolean;
  placeholder: string;
}

function EntryList({ label, color, entries, onAdd, onRemove, matches, missed, checked, placeholder }: EntryListProps) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<any>(null);

  const handleAdd = () => {
    const v = inputVal.trim();
    if (v) { onAdd(v); setInputVal(''); }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0
        }} />
        <Text strong style={{ fontSize: 13, color: '#374151' }}>{label}</Text>
        <Badge
          count={entries.length}
          style={{ backgroundColor: color, fontSize: 10, minWidth: 16, height: 16, lineHeight: '16px' }}
        />
      </div>

      {/* Existing entries */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, minHeight: 32 }}>
        {entries.map((e, i) => {
          const isMatch = matches ? matches[i] : undefined;
          return (
            <Tag
              key={i}
              closable={!checked}
              onClose={() => onRemove(i)}
              color={
                checked ? (isMatch ? '#52c41a' : '#ff4d4f') : color
              }
              icon={checked ? (isMatch ? <CheckCircleFilled /> : <CloseCircleFilled />) : undefined}
              style={{
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 12,
                cursor: 'default',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {e}
            </Tag>
          );
        })}
        {entries.length === 0 && (
          <Text style={{ color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>
            Chưa có mục nào...
          </Text>
        )}
      </div>

      {/* Missed items */}
      {checked && missed && missed.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 11, color: '#e76f51', fontWeight: 500 }}>Còn thiếu:</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {missed.map((m, i) => (
              <Tag key={i} style={{
                background: '#fef2f2', border: '1px dashed #e76f51',
                color: '#e76f51', borderRadius: 20, fontSize: 11, padding: '1px 8px'
              }}>
                {m}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Input field */}
      {!checked && (
        <Input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onPressEnter={handleAdd}
          placeholder={placeholder}
          size="small"
          suffix={
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size="small"
              style={{ padding: 0 }}
            />
          }
          style={{ borderRadius: 20, fontSize: 12 }}
        />
      )}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────
export default function BabokIOReview() {
  const navigate = useNavigate();
  const [data, setData] = useState<BabokData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKA, setSelectedKA] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TaskResult>>({});

  // Load JSON
  useEffect(() => {
    fetch('/babok/babok-tasks.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const ka = data?.knowledge_areas.find(k => k.id === selectedKA);

  // Init results when KA changes
  useEffect(() => {
    if (!ka) return;
    const init: Record<string, TaskResult> = {};
    ka.tasks.forEach(t => {
      init[t.id] = {
        taskId: t.id,
        inputEntries: [],
        outputEntries: [],
        checked: false,
        inputMatches: [],
        outputMatches: [],
        inputMissed: [],
        outputMissed: [],
      };
    });
    setResults(init);
  }, [selectedKA]);

  // ── Handlers ──
  const addEntry = (taskId: string, type: 'input' | 'output', value: string) => {
    setResults(prev => {
      const r = { ...prev[taskId] };
      if (type === 'input') r.inputEntries = [...r.inputEntries, value];
      else r.outputEntries = [...r.outputEntries, value];
      return { ...prev, [taskId]: r };
    });
  };

  const removeEntry = (taskId: string, type: 'input' | 'output', index: number) => {
    setResults(prev => {
      const r = { ...prev[taskId] };
      if (type === 'input') r.inputEntries = r.inputEntries.filter((_, i) => i !== index);
      else r.outputEntries = r.outputEntries.filter((_, i) => i !== index);
      return { ...prev, [taskId]: r };
    });
  };

  const checkTask = (task: BabokTask) => {
    setResults(prev => {
      const r = { ...prev[task.id] };
      r.checked = true;
      r.inputMatches = computeMatches(r.inputEntries, task.inputs);
      r.outputMatches = computeMatches(r.outputEntries, task.outputs);
      r.inputMissed = findMissed(r.inputEntries, task.inputs);
      r.outputMissed = findMissed(r.outputEntries, task.outputs);
      return { ...prev, [task.id]: r };
    });
  };

  const resetTask = (task: BabokTask) => {
    setResults(prev => ({
      ...prev,
      [task.id]: {
        taskId: task.id,
        inputEntries: [],
        outputEntries: [],
        checked: false,
        inputMatches: [],
        outputMatches: [],
        inputMissed: [],
        outputMissed: [],
      }
    }));
  };

  const resetAll = () => {
    if (!ka) return;
    const init: Record<string, TaskResult> = {};
    ka.tasks.forEach(t => {
      init[t.id] = {
        taskId: t.id,
        inputEntries: [],
        outputEntries: [],
        checked: false,
        inputMatches: [],
        outputMatches: [],
        inputMissed: [],
        outputMissed: [],
      };
    });
    setResults(init);
  };

  // Progress
  const checkedTasks = ka ? ka.tasks.filter(t => results[t.id]?.checked) : [];
  const correctTasks = checkedTasks.filter(t => {
    const r = results[t.id];
    return r && r.inputMissed.length === 0 && r.outputMissed.length === 0;
  });
  const progress = ka ? Math.round((checkedTasks.length / ka.tasks.length) * 100) : 0;
  const kaColor = selectedKA ? KA_COLORS[selectedKA] || '#1d3557' : '#1d3557';
  const kaBg = selectedKA ? KA_BG[selectedKA] || '#f8f9fa' : '#f8f9fa';

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${kaColor} 0%, ${kaColor}cc 100%)`,
        padding: '24px 32px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        transition: 'background 0.3s',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
              size="small"
            />
            <BookOutlined style={{ fontSize: 20, color: '#fff' }} />
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              Ôn tập Input / Output — BABOK v3
            </Title>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginBottom: 6 }}>
                Chọn Knowledge Area để ôn tập:
              </Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn Knowledge Area..."
                size="large"
                value={selectedKA}
                onChange={v => setSelectedKA(v)}
                loading={loading}
                options={data?.knowledge_areas.map(ka => ({
                  value: ka.id,
                  label: `KA ${ka.chapter}: ${ka.name} (${ka.short_name})`,
                }))}
              />
            </div>
            {selectedKA && (
              <Button
                icon={<ReloadOutlined />}
                onClick={resetAll}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
              >
                Reset tất cả
              </Button>
            )}
          </div>

          {/* Progress bar */}
          {ka && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  Đã kiểm tra: {checkedTasks.length}/{ka.tasks.length} task
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  ✅ Đúng hoàn toàn: {correctTasks.length}/{checkedTasks.length}
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
            <div style={{ color: '#6b7280', marginTop: 16 }}>Đang tải dữ liệu...</div>
          </div>
        )}

        {!loading && !selectedKA && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
            <Title level={4} style={{ color: '#374151', fontWeight: 600 }}>
              Chọn một Knowledge Area để bắt đầu
            </Title>
            <Text style={{ color: '#9ca3af' }}>
              Bạn sẽ nhập các input và output của từng task, hệ thống sẽ kiểm tra độ chính xác.
            </Text>
          </div>
        )}

        {!loading && ka && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {ka.tasks.map(task => {
              const r = results[task.id];
              if (!r) return null;
              const taskDone = r.checked && r.inputMissed.length === 0 && r.outputMissed.length === 0;
              const taskFail = r.checked && (r.inputMissed.length > 0 || r.outputMissed.length > 0);

              return (
                <Card
                  key={task.id}
                  size="small"
                  style={{
                    borderRadius: 12,
                    border: taskDone ? '2px solid #2a9d8f' : taskFail ? '2px solid #e76f51' : '1px solid #e5e7eb',
                    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s',
                    overflow: 'hidden',
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
                      {r.checked && (
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={() => resetTask(task)}
                          style={{ borderRadius: 20 }}
                        >
                          Thử lại
                        </Button>
                      )}
                      {!r.checked && (
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => checkTask(task)}
                          style={{ borderRadius: 20, background: kaColor, border: 'none' }}
                          disabled={r.inputEntries.length === 0 && r.outputEntries.length === 0}
                        >
                          Kiểm tra
                        </Button>
                      )}
                    </Space>
                  }
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    padding: '4px 0',
                  }}>
                    {/* Inputs */}
                    <div style={{
                      background: '#f0f7ff', borderRadius: 8, padding: '12px 14px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <EntryList
                        label="Inputs"
                        color="#3b82f6"
                        entries={r.inputEntries}
                        onAdd={v => addEntry(task.id, 'input', v)}
                        onRemove={i => removeEntry(task.id, 'input', i)}
                        matches={r.inputMatches}
                        missed={r.inputMissed}
                        checked={r.checked}
                        placeholder="Nhập input rồi Enter..."
                      />
                      {r.checked && (
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          Đáp án: {task.inputs.length} input(s)
                        </div>
                      )}
                    </div>

                    {/* Outputs */}
                    <div style={{
                      background: '#f0fdf4', borderRadius: 8, padding: '12px 14px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <EntryList
                        label="Outputs"
                        color="#22c55e"
                        entries={r.outputEntries}
                        onAdd={v => addEntry(task.id, 'output', v)}
                        onRemove={i => removeEntry(task.id, 'output', i)}
                        matches={r.outputMatches}
                        missed={r.outputMissed}
                        checked={r.checked}
                        placeholder="Nhập output rồi Enter..."
                      />
                      {r.checked && (
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          Đáp án: {task.outputs.length} output(s)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Result summary */}
                  {r.checked && (
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8,
                      background: taskDone ? '#dcfce7' : '#fef2f2',
                      border: taskDone ? '1px solid #bbf7d0' : '1px solid #fecaca'
                    }}>
                      {taskDone ? (
                        <Text style={{ color: '#166534', fontSize: 12 }}>
                          ✅ Xuất sắc! Bạn đã nhớ đúng tất cả inputs và outputs.
                        </Text>
                      ) : (
                        <Text style={{ color: '#991b1b', fontSize: 12 }}>
                          ❌ Còn thiếu {r.inputMissed.length} input(s) và {r.outputMissed.length} output(s). Xem các mục bị bỏ sót ở trên.
                        </Text>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </Space>
        )}
      </div>
    </div>
  );
}
