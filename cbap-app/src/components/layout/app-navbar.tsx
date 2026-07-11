// ============================================================
// AppNavbar — Sticky top navigation bar
// Shows on all pages except ExamRoom (has its own ExamHeader)
// ============================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Dropdown, Avatar } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  WarningOutlined,
  ReadOutlined,
  BranchesOutlined,
  OrderedListOutlined,
  UserOutlined,
  LogoutOutlined,
  GoogleOutlined
} from '@ant-design/icons';
import { useAuth } from '@/context/auth-context';

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
    key: 'babok-review',
    label: 'Ôn tập tổng quan',
    icon: <ReadOutlined />,
    children: [
      {
        key: '/babok-io',
        label: 'Input / Output',
        icon: <BranchesOutlined />,
      },
      {
        key: '/babok-elements',
        label: 'Elements',
        icon: <OrderedListOutlined />,
      },
    ],
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
  const { currentUser, loginWithGoogle, logout } = useAuth();

  // Flatten nav items to include children for key matching
  const allKeys: string[] = [];
  NAV_ITEMS.forEach(item => {
    allKeys.push(item.key);
    if ('children' in item && item.children) {
      item.children.forEach((c: { key: string }) => allKeys.push(c.key));
    }
  });

  // Match active key: exact for '/', prefix for others
  const activeKey =
    allKeys
      .filter(k => k !== 'babok-review')
      .find(k =>
        k === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(k)
      ) ?? '/';

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
      
      {/* ── User Auth Section ── */}
      <div style={{ marginLeft: 16, flexShrink: 0 }}>
        {currentUser ? (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Đăng xuất',
                  onClick: logout,
                  danger: true,
                },
              ],
            }}
            placement="bottomRight"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar src={currentUser.photoURL} icon={<UserOutlined />} size="small" />
              <Text style={{ color: '#fff', fontSize: 13, maxWidth: 120 }} ellipsis>
                {currentUser.displayName || 'User'}
              </Text>
            </div>
          </Dropdown>
        ) : (
          <Button 
            type="primary" 
            icon={<GoogleOutlined />} 
            onClick={loginWithGoogle}
            style={{ 
              background: '#ffffff', 
              color: '#1d3557', 
              fontWeight: 600,
              border: 'none'
            }}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </Header>
  );
}
