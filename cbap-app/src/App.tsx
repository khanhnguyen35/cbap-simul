// ============================================================
// App.tsx — Root component: Ant Design Theme + Router setup
// ============================================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Skeleton, Layout } from 'antd';
import { ExamProvider } from '@/context/exam-context';
import { AuthProvider } from '@/context/auth-context';
import { useTsvParser } from '@/hooks/use-tsv-parser';
import { useExamContext } from '@/context/exam-context';
import AppNavbar from '@/components/layout/app-navbar';
import './index.css';

// ── Ant Design CBAP Theme ────────────────────────────────────
const CBAPTheme = {
  token: {
    colorPrimary: '#1d3557',
    colorSuccess: '#2a9d8f',
    colorWarning: '#e9c46a',
    colorError: '#e76f51',
    colorLink: '#457b9d',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: 6,
    borderRadiusLG: 10,
  },
  components: {
    Button: {
      colorPrimaryHover: '#457b9d',
    },
    Card: {
      headerBg: '#f8f9fa',
    },
    Table: {
      headerBg: '#f1f3f5',
    },
  },
};

// ── Lazy-loaded pages ────────────────────────────────────────────
const Dashboard = lazy(() => import('@/pages/dashboard'));
const ExamRoom = lazy(() => import('@/pages/exam-room'));
const ExamReview = lazy(() => import('@/pages/exam-review'));
const FlashcardMode = lazy(() => import('@/pages/flashcard-mode'));
const Analytics = lazy(() => import('@/pages/analytics'));
const DataQualityInspector = lazy(() => import('@/pages/data-quality-inspector'));
const BabokIOReview = lazy(() => import('@/pages/babok-io-review'));
const BabokElementsReview = lazy(() => import('@/pages/babok-elements-review'));

// ── AppLayout: conditional navbar + page content ───────────────────────────────────
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // ExamRoom and ExamReview have their own sticky header — hide navbar there
  const hideNavbar =
    location.pathname.startsWith('/exam/') ||
    location.pathname.startsWith('/review/');

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {!hideNavbar && <AppNavbar />}
      <Layout.Content>{children}</Layout.Content>
    </Layout>
  );
}

// ── DataLoader: Loads TSV data and injects into context ────────────────────────
function DataLoader({ children }: { children: React.ReactNode }) {
  const { allQuestions, buckets, isLoading, error } = useTsvParser();
  const { state, setData } = useExamContext();

  // Inject parsed data into context once loaded
  React.useEffect(() => {
    if (!isLoading && allQuestions.length > 0 && !state.isDataLoaded) {
      setData(allQuestions, buckets);
    }
  }, [isLoading, allQuestions, buckets, state.isDataLoaded, setData]);

  if (isLoading) {
    return (
      <div style={{ padding: '60px 40px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <div style={{ color: '#1d3557', fontWeight: 600, fontSize: 16 }}>
            Đang tải dữ liệu đề thi...
          </div>
          <div style={{ color: '#6c757d', fontSize: 13, marginTop: 4 }}>
            Đang parse 2.389 câu hỏi và 9.357 đáp án
          </div>
        </div>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: '#e76f51', fontWeight: 600, marginBottom: 8 }}>
          Lỗi khi tải dữ liệu
        </div>
        <div style={{ color: '#6c757d' }}>{error}</div>
        <div style={{ marginTop: 16, color: '#6c757d', fontSize: 13 }}>
          Hãy đảm bảo file <code>public/exams/questions.tsv</code> và{' '}
          <code>public/exams/answers.tsv</code> tồn tại.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ── App Root ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ConfigProvider theme={CBAPTheme}>
      <AntApp>
        <AuthProvider>
          <ExamProvider>
            <BrowserRouter>
              <DataLoader>
                <AppLayout>
                  <Suspense
                    fallback={
                      <div style={{ padding: 40 }}>
                        <Skeleton active />
                      </div>
                    }
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/exam/:number" element={<ExamRoom />} />
                      <Route path="/review/:historyId" element={<ExamReview />} />
                      <Route path="/flashcard" element={<FlashcardMode />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/data-quality" element={<DataQualityInspector />} />
                      <Route path="/babok-io" element={<BabokIOReview />} />
                      <Route path="/babok-elements" element={<BabokElementsReview />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </AppLayout>
              </DataLoader>
            </BrowserRouter>
          </ExamProvider>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
