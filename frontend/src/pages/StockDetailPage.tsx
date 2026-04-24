import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Tabs, Tag, Spin, message, Segmented } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, ReloadOutlined, StockOutlined } from '@ant-design/icons';
import KLineChart from '../components/KLineChart/KLineChart';
import StockAnalysis from '../components/StockAnalysis/StockAnalysis';
import { useStockStore } from '../stores/stockStore';
import { formatNumber, formatVolume, formatAmount, getChangeColor, formatChangePercent, isMarketOpen } from '../utils/format';
import { useThemeStore } from '../stores/themeStore';

type KPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const StockDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { currentStock, klineData, loading, error, klineError, stockLoading, fetchStockDetail, fetchKlineData } = useStockStore();
  const { colors } = useThemeStore();
  const [kPeriod, setKPeriod] = useState<KPeriod>('daily');
  const [isRealtimeView, setIsRealtimeView] = useState(false);
  const errorShownRef = useRef(false);

  const handlePeriodChange = (period: string) => {
    if (period === 'realtime') {
      setIsRealtimeView(true);
      if (symbol) {
        fetchKlineData(symbol, 'realtime', 100);
      }
    } else {
      setIsRealtimeView(false);
      setKPeriod(period as KPeriod);
      if (symbol) {
        fetchKlineData(symbol, period, 100);
      }
    }
  };

  useEffect(() => {
    errorShownRef.current = false;
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchStockDetail(symbol);
      fetchKlineData(symbol, 'daily', 100);
    }
  }, [symbol]);

  useEffect(() => {
    if (!symbol || !isMarketOpen()) return;

    const interval = setInterval(() => {
      fetchStockDetail(symbol);
      if (isRealtimeView) {
        fetchKlineData(symbol, 'realtime', 100);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [symbol, isRealtimeView]);

  useEffect(() => {
    if (!currentStock && !stockLoading && error && !errorShownRef.current) {
      errorShownRef.current = true;
      message.error(error || '股票不存在');
      const timer = setTimeout(() => {
        navigate('/watchlist');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStock, stockLoading, error, navigate]);

  if (stockLoading && !currentStock) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!currentStock && !stockLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (klineError && currentStock) {
    console.warn('K线数据加载失败:', klineError);
  }

  if (!currentStock) return null;

  const changeColor = getChangeColor(currentStock.change);

  const tabItems = [
    {
      key: 'kline',
      label: 'K线图表',
      children: (
        <Card className="border border-white/10" styles={{ body: { padding: 16 } }}>
          <div className="flex items-center justify-between mb-4">
            <Segmented
              value={isRealtimeView ? 'realtime' : kPeriod}
              onChange={(v) => handlePeriodChange(v as string)}
              options={[
                { label: '实时', value: 'realtime' },
                { label: '日K', value: 'daily' },
                { label: '周K', value: 'weekly' },
                { label: '月K', value: 'monthly' },
                { label: '年K', value: 'yearly' },
              ]}
              className="kline-period-selector"
            />
          </div>
          <KLineChart data={isRealtimeView ? klineData : klineData} loading={loading} period={isRealtimeView ? 'realtime' : kPeriod} />
        </Card>
      ),
    },
    {
      key: 'analysis',
      label: 'AI诊断',
      children: (
        <Card className="border border-white/10">
          <StockAnalysis symbol={symbol!} />
        </Card>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-screen">
      {/* 返回按钮和标题 */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="rounded-lg"
        >
          返回
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white m-0">{currentStock.name}</h1>
            <Tag className="m-0 text-sm" color={currentStock.market === 'SH' ? 'blue' : 'purple'}>
              {currentStock.symbol}
            </Tag>
          </div>
          <p className="text-[#71717a] text-sm mt-1">
            <StockOutlined className="mr-1" />
            {currentStock.market === 'SH' ? '上海证券交易所' : '深圳证券交易所'}
          </p>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => {
            if (symbol) {
              fetchStockDetail(symbol);
              fetchKlineData(symbol, 'daily', 100);
            }
          }}
          loading={loading}
          className="rounded-lg"
        >
          刷新
        </Button>
      </div>

      {/* 行情卡片 */}
      <Card className="mb-6" styles={{ body: { padding: '24px' } }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8}>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: changeColor }}>
                {formatNumber(currentStock.price)}
              </div>
              <div className="text-xl font-medium flex items-center justify-center gap-2" style={{ color: currentStock.change >= 0 ? colors.riseColor : colors.fallColor }}>
                {currentStock.change >= 0 ? '▲' : '▼'} {formatChangePercent(currentStock.changePercent)}
              </div>
              <div className="text-[#71717a] mt-2">
                {currentStock.change >= 0 ? '涨' : '跌'} {formatNumber(Math.abs(currentStock.change))} 元
              </div>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-[#71717a] mb-1">今开</div>
                  <div className="text-lg font-semibold text-white">{formatNumber(currentStock.open)}</div>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-[#71717a] mb-1">最高</div>
                  <div className="text-lg font-semibold text-white">{formatNumber(currentStock.high)}</div>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-[#71717a] mb-1">最低</div>
                  <div className="text-lg font-semibold text-white">{formatNumber(currentStock.low)}</div>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-[#71717a] mb-1">成交量</div>
                  <div className="text-lg font-semibold text-white">{formatVolume(currentStock.volume)}</div>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-[#71717a] mb-1">成交额</div>
                  <div className="text-lg font-semibold text-white">{formatAmount(currentStock.amount)}</div>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-[#71717a] mb-1">昨收</div>
                  <div className="text-lg font-semibold text-white">{formatNumber(currentStock.close)}</div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 标签页 */}
      <Tabs 
        items={tabItems}
        className="stock-detail-tabs"
      />
    </div>
  );
};

export default StockDetailPage;