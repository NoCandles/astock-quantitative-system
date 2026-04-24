import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Modal, ColorPicker, Space, Divider, message, Segmented } from 'antd';
import { LineChartOutlined, SearchOutlined, RobotOutlined, ExperimentOutlined, ThunderboltOutlined, AimOutlined, SettingOutlined } from '@ant-design/icons';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useThemeStore, PRESET_THEMES, ThemeMode } from '../stores/themeStore';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, fetchWatchlist } = useWatchlistStore();
  const { mode, colors, setMode, setTheme, setCustomColors } = useThemeStore();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [customRise, setCustomRise] = useState(colors.riseColor);
  const [customFall, setCustomFall] = useState(colors.fallColor);
  const isDark = mode === 'dark';

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const features = [
    {
      title: '自选管理',
      description: '快速添加和管理关注的股票，实时追踪行情变化',
      icon: <SearchOutlined className="text-3xl" />,
      gradient: 'from-violet-500 to-purple-600',
      path: '/watchlist',
      tag: '核心'
    },
    {
      title: 'K线图表',
      description: '专业的K线图表，支持多周期切换和技术指标',
      icon: <LineChartOutlined className="text-3xl" />,
      gradient: 'from-blue-500 to-cyan-500',
      path: '/watchlist',
      tag: '热门'
    },
    {
      title: 'AI诊断',
      description: '基于AI智能分析，提供股票技术面深度解读',
      icon: <RobotOutlined className="text-3xl" />,
      gradient: 'from-pink-500 to-rose-500',
      path: '/watchlist',
      tag: 'NEW'
    },
    {
      title: '策略回测',
      description: '多维度量化策略回测，验证策略有效性',
      icon: <ExperimentOutlined className="text-3xl" />,
      gradient: 'from-emerald-500 to-teal-500',
      path: '/backtest',
      tag: '专业'
    }
  ];

  const stockCount = items.length;
  const avgChange = items.length > 0
    ? items.reduce((sum, item) => sum + item.changePercent, 0) / items.length
    : 0;
  const risingCount = items.filter(item => item.changePercent > 0).length;
  const winRate = stockCount > 0 ? (risingCount / stockCount * 100) : 0;

  const stats = [
    { label: '自选股票', value: String(stockCount), suffix: '只', trend: stockCount > 0 ? 'up' : 'neutral' as 'up' | 'down' | 'neutral' },
    { label: '今日收益', value: (avgChange >= 0 ? '+' : '') + avgChange.toFixed(2), suffix: '%', trend: avgChange >= 0 ? 'up' : 'down' as 'up' | 'down' | 'neutral' },
    { label: '上涨比例', value: winRate.toFixed(0), suffix: '%', trend: winRate >= 50 ? 'up' : 'down' as 'up' | 'down' | 'neutral' },
  ];

  return (
    <div className="p-6 min-h-screen">
      {/* Hero Section - 更年轻化的设计 */}
      <div className="relative overflow-hidden rounded-3xl mb-8 px-8 py-16" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(236, 72, 153, 0.1) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* 动态背景装饰 */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-500/20 to-rose-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">
          {/* 右上角设置按钮 */}
          <Button
            type="text"
            icon={<SettingOutlined style={{ color: isDark ? '#a1a1aa' : '#4a4a6a', fontSize: 20 }} />}
            onClick={() => setSettingsVisible(true)}
            className="absolute top-0 right-0"
          />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-10 rounded-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
            <h1 className="text-5xl font-bold text-white tracking-tight">
              欢迎使用 <span className="gradient-text">QuantX</span>
            </h1>
          </div>
          <p className="text-xl text-[#a1a1aa] mb-8 max-w-xl leading-relaxed">
            专业、智能的A股量化分析平台，让投资更简单
          </p>
          
          <div className="flex gap-4 mb-8">
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/watchlist')}
              icon={<ThunderboltOutlined />}
              className="h-14 px-8 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
            >
              开始使用
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/backtest')}
              icon={<AimOutlined />}
              className="h-14 px-8 rounded-xl bg-white/10 border-white/20 hover:bg-white/20 transition-all"
            >
              策略回测
            </Button>
          </div>
        </div>

        {/* 统计卡片 - 更现代的设计 */}
        <div className="grid grid-cols-3 gap-6 mt-12">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-card ${stat.trend} group cursor-pointer`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#71717a]">{stat.label}</span>
                {stat.trend === 'up' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    ↑ 上升
                  </span>
                )}
              </div>
              <div className="text-4xl font-bold text-white group-hover:scale-105 transition-transform">
                {stat.value}<span className="text-lg text-[#6366f1]">{stat.suffix}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 功能模块 - 更年轻化的卡片设计 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
          核心功能
          <span className="text-sm text-[#71717a] font-normal ml-2">探索更多可能</span>
        </h2>
        <Row gutter={[20, 20]}>
          {features.map((feature, index) => (
            <Col key={index} xs={24} sm={12} lg={6}>
              <Card
                hoverable
                onClick={() => navigate(feature.path)}
                className="h-full text-center group relative overflow-hidden"
                styles={{ body: { padding: '40px 24px' } }}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* 悬停时的光效 */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${feature.gradient.includes('violet') ? 'rgba(139, 92, 246, 0.1)' : feature.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.1)' : feature.gradient.includes('pink') ? 'rgba(236, 72, 153, 0.1)' : 'rgba(16, 185, 129, 0.1)'} 0%, transparent 100%)`
                  }}
                />
                
                {/* 标签 */}
                <div className="absolute top-4 right-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    feature.tag === 'NEW' ? 'bg-pink-500/20 text-pink-400' :
                    feature.tag === '热门' ? 'bg-orange-500/20 text-orange-400' :
                    feature.tag === '核心' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {feature.tag}
                  </span>
                </div>

                <div 
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500 relative z-10`}
                  style={{ boxShadow: `0 8px 32px ${feature.gradient.includes('violet') ? 'rgba(139, 92, 246, 0.3)' : feature.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.3)' : feature.gradient.includes('pink') ? 'rgba(236, 72, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}
                >
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                <p className="text-sm text-[#71717a] leading-relaxed relative z-10">{feature.description}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 快捷入口 - 现代化设计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:border-indigo-500 transition-all duration-300 group"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <SearchOutlined className="text-2xl" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-1">搜索添加股票</h3>
              <p className="text-sm text-[#71717a]">输入代码或名称快速查找</p>
            </div>
          </div>
        </Card>
        
        <Card 
          className="cursor-pointer hover:border-blue-500 transition-all duration-300 group"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <LineChartOutlined className="text-2xl" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-1">查看K线详情</h3>
              <p className="text-sm text-[#71717a]">多周期图表深度分析</p>
            </div>
          </div>
        </Card>
        
        <Card 
          className="cursor-pointer hover:border-pink-500 transition-all duration-300 group"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <RobotOutlined className="text-2xl" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-1">AI智能诊断</h3>
              <p className="text-sm text-[#71717a]">大数据技术面分析</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 风险提示 - 更醒目的设计 */}
      <div className="mt-8 p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div>
            <h3 className="font-bold text-amber-400 mb-2 text-lg">风险提示</h3>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              本系统仅供学习和研究使用，不构成任何投资建议。股市有风险，投资需谨慎！
            </p>
          </div>
        </div>
      </div>

      {/* 涨跌颜色设置 Modal */}
      <Modal
        title={<span style={{ color: isDark ? '#fff' : '#1a1a2e' }}>颜色设置</span>}
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        styles={{ body: { background: isDark ? 'rgba(15, 15, 35, 0.98)' : 'rgba(255, 255, 255, 0.98)', padding: 24 } }}
      >
        <div>
          <div className="text-sm mb-3" style={{ color: isDark ? '#a1a1aa' : '#4a4a6a' }}>主题模式</div>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as ThemeMode)}
            options={[
              { label: '深色', value: 'dark' },
              { label: '浅色', value: 'light' },
            ]}
            className="mb-6 w-full"
          />

          <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

          <div className="text-sm mb-3" style={{ color: isDark ? '#a1a1aa' : '#4a4a6a' }}>涨跌颜色</div>
          <div className="text-sm mb-4" style={{ color: isDark ? '#a1a1aa' : '#4a4a6a' }}>选择配色方案</div>
          <Row gutter={[12, 12]} className="mb-6">
            {PRESET_THEMES.map((theme) => (
              <Col span={12} key={theme.label}>
                <div
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    colors.riseColor === theme.riseColor && colors.fallColor === theme.fallColor
                      ? 'border-2 border-indigo-500'
                      : 'border hover:border-indigo-500/50'
                  }`}
                  style={{ 
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: colors.riseColor === theme.riseColor && colors.fallColor === theme.fallColor
                      ? '#6366f1'
                      : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                  }}
                  onClick={() => {
                    setTheme(theme);
                    setCustomRise(theme.riseColor);
                    setCustomFall(theme.fallColor);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded" style={{ background: theme.riseColor }} />
                        <span className="text-xs" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>涨</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded" style={{ background: theme.fallColor }} />
                        <span className="text-xs" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>跌</span>
                      </div>
                    </div>
                    <span className="text-sm" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>{theme.label}</span>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

          <div className="text-sm mb-3" style={{ color: isDark ? '#a1a1aa' : '#4a4a6a' }}>自定义颜色</div>
          <Space direction="vertical" size={12} className="w-full">
            <div className="flex items-center gap-3">
              <span className="text-sm w-12" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>涨色</span>
              <ColorPicker
                value={customRise}
                onChange={(c) => setCustomRise(c.toHexString())}
                size="middle"
              />
              <span className="text-xs" style={{ color: isDark ? '#71717a' : '#6b6b8b' }}>{customRise}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm w-12" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>跌色</span>
              <ColorPicker
                value={customFall}
                onChange={(c) => setCustomFall(c.toHexString())}
                size="middle"
              />
              <span className="text-xs" style={{ color: isDark ? '#71717a' : '#6b6b8b' }}>{customFall}</span>
            </div>
            <Button
              type="primary"
              onClick={() => {
                setCustomColors(customRise, customFall, '#999999');
                message.success('配色已应用');
                setSettingsVisible(false);
              }}
              className="mt-2"
            >
              应用自定义配色
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;