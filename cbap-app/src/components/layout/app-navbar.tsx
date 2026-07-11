// ============================================================
// AppNavbar — Sticky top navigation bar
// Shows on all pages except ExamRoom (has its own ExamHeader)
// ============================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  {
    key: '/',
    label: 'Dashboard',
    icon: <AppstoreOutlined />,
  },
  {
    key: '/analytics',
    label: 'Thống kê',
    icon: <BarChartOutlined />,
  },
  {
    key: '/flashcard',
    label: 'Flashcard',
    icon: <ExperimentOutlined />,
  },
  {
    key: '/data-quality',
    label: 'Dữ liệu lỗi',
    icon: <WarningOutlined />,
  },
];

export default function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Match active key: exact for '/', prefix for others
  const activeKey =
    NAV_ITEMS.find((item) =>
      item.key === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.key)
    )?.key ?? '/';

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        background: '#1d3557',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        height: 56,
      }}
    >
      {/* ── Logo / Brand ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginRight: 32,
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => navigate('/')}
        id="navbar-logo"
      >
        <span style={{ fontSize: 20 }}>📚</span>
        <Text
          style={{
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
          }}
        >
          CBAP Simulator
        </Text>
      </div>

      {/* ── Navigation Menu ── */}
      <Menu
        mode="horizontal"
        selectedKeys={[activeKey]}
        onClick={({ key }) => navigate(key)}
        items={NAV_ITEMS}
        style={{
          background: 'transparent',
          border: 'none',
          flex: 1,
          minWidth: 0,
          // Override Ant Design default colors for dark background
          color: 'rgba(255,255,255,0.75)',
        }}
        theme="dark"
        id="app-navbar-menu"
      />
    </Header>
  );
}
