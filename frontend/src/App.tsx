import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Typography, Badge } from 'antd';
import { HomeOutlined, StockOutlined, ExperimentOutlined, DotChartOutlined } from '@ant-design/icons';
import DashboardPage from './pages/DashboardPage';
import WatchlistPage from './pages/WatchlistPage';
import StockDetailPage from './pages/StockDetailPage';
import BacktestPage from './pages/BacktestPage';
import { useThemeStore } from './stores/themeStore';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const location = useLocation();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.style.setProperty('--bg-primary', '#0f0f23');
      root.style.setProperty('--bg-secondary', 'rgba(255, 255, 255, 0.03)');
      root.style.setProperty('--bg-hover', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--text-primary', '#fff');
      root.style.setProperty('--text-secondary', '#a1a1aa');
      root.style.setProperty('--text-tertiary', '#71717a');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--border-hover', 'rgba(99, 102, 241, 0.3)');
      root.style.setProperty('--card-shadow', '0 20px 40px rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--text-white', '#ffffffff');
    } else {
      root.setAttribute('data-theme', 'light');
      root.style.setProperty('--bg-primary', '#f5f5f5');
      root.style.setProperty('--bg-secondary', 'rgba(0, 0, 0, 0.02)');
      root.style.setProperty('--bg-hover', 'rgba(0, 0, 0, 0.04)');
      root.style.setProperty('--text-primary', '#1a1a2e');
      root.style.setProperty('--text-secondary', '#4a4a6a');
      root.style.setProperty('--text-tertiary', '#6b6b8b');
      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--border-hover', 'rgba(99, 102, 241, 0.3)');
      root.style.setProperty('--card-shadow', '0 20px 40px rgba(0, 0, 0, 0.1)');
      // text-white
      root.style.setProperty('--text-white', 'rgba(0, 0, 0, 0.7)');
    
    }
  }, [isDark]);

  const navItems = [
    { path: '/', label: '首页', icon: <HomeOutlined /> },
    { path: '/watchlist', label: '自选', icon: <StockOutlined /> },
    { path: '/backtest', label: '回测', icon: <ExperimentOutlined /> },
  ];

  const bgColor = isDark ? '#0f0f23' : '#f5f5f5';
  const headerBg = isDark
    ? 'linear-gradient(180deg, rgba(15, 15, 35, 0.98) 0%, rgba(15, 15, 35, 0.95) 100%)'
    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)';
  const textColor = isDark ? '#fff' : '#000';
  const subTextColor = isDark ? '#a1a1aa' : '#666';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <Layout className="min-h-screen" style={{ background: bgColor }}>
      {/* 现代化导航栏 */}
      <Header className="fixed w-full z-50 flex items-center px-6" style={{
        background: headerBg,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${borderColor}`,
        height: '64px'
      }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg">
            <DotChartOutlined style={{ fontSize: '20px', color: '#fff' }} />
          </div>
          <div>
            <Title level={4} className="m-0 font-bold tracking-tight" style={{ color: textColor }}>
              Quant<span style={{ color: '#6366f1' }}>X</span>
            </Title>
          </div>
        </div>

        <nav className="flex gap-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`no-underline flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                location.pathname === item.path
                  ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                  : 'hover:bg-black/5'
              }`}
              style={{ fontSize: '14px', fontWeight: 500, color: location.pathname === item.path ? '#fff' : subTextColor }}
            >
              <Badge dot={location.pathname === item.path} status="processing" color="#6366f1">
                {item.icon}
              </Badge>
              {item.label}
            </Link>
          ))}
        </nav>
      </Header>

      <Content className="mt-16 pb-12">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/stock/:symbol" element={<StockDetailPage />} />
          <Route path="/backtest" element={<BacktestPage />} />
        </Routes>
      </Content>

      {/* 现代化Footer */}
      <Footer className="text-center" style={{
        background: bgColor,
        borderTop: `1px solid ${borderColor}`,
        color: subTextColor
      }}>
        <div className="text-sm">
          <span className="font-mono">QuantX</span> © {new Date().getFullYear()} - 仅供学习研究，不构成投资建议
        </div>
      </Footer>
    </Layout>
  );
};

export default App;