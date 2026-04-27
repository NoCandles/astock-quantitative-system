import React, { useState } from 'react';
import { Row, Col, Card, Button, Input, Slider, Table, Tag, message, Spin, Divider, Tooltip } from 'antd';
import { PlayCircleOutlined, TrophyOutlined, FallOutlined, RiseOutlined, ExperimentOutlined, ThunderboltOutlined, AimOutlined, HistoryOutlined, FundViewOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { runBacktest } from '../services/api';
import { useThemeStore } from '../stores/themeStore';

// 策略参数类型
type StrategyType = 'macd' | 'bollinger' | 'rsi' | 'ma_cross' | 'volume' | '';

interface StrategyParams {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  stopLoss: number;
  takeProfit: number;
  strategyType: StrategyType;
  // MACD参数
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  // 布林带参数
  period: number;
  stdDev: number;
  // RSI参数
  rsiBuy: number;
  rsiSell: number;
  // 均线参数
  maShort: number;
  maLong: number;
  // 成交量参数
  volMaPeriod: number;
  volMultiplier: number;
}

// 策略说明
const strategyInfo = {
  macd: {
    name: 'MACD策略',
    desc: '基于MACD指标的金叉死叉信号进行交易，适合短线趋势跟踪',
    color: '#6366f1'
  },
  bollinger: {
    name: '布林带策略',
    desc: '价格突破布林带上轨时买入，适合震荡行情',
    color: '#8b5cf6'
  },
  rsi: {
    name: 'RSI策略',
    desc: 'RSI超卖时买入，超买时卖出，适合反转行情',
    color: '#ec4899'
  },
  ma_cross: {
    name: '均线金叉策略',
    desc: 'MA短期上穿长期时买入，适合趋势行情',
    color: '#f59e0b'
  },
  volume: {
    name: '量能突破策略',
    desc: '成交量放大突破时买入，适合短线爆发行情',
    color: '#22c55e'
  }
};

const BacktestPage: React.FC = () => {
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<StrategyParams>({
    symbol: '600519',
    startDate: '2024-01-01',
    endDate: '2024-12-01',
    initialCapital: 100000,
    stopLoss: 3,
    takeProfit: 6,
    strategyType: 'macd',
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    period: 20,
    stdDev: 2,
    rsiBuy: 30,
    rsiSell: 70,
    maShort: 5,
    maLong: 20,
    volMaPeriod: 5,
    volMultiplier: 2,
  });
  const [results, setResults] = useState<any>(null);

  const handleRunBacktest = async () => {
    if (!params.symbol) {
      message.warning('请输入股票代码');
      return;
    }
    setLoading(true);
    try {
      const strategyParams: any = {
        initialCapital: params.initialCapital,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
      };

      switch (params.strategyType) {
        case 'macd':
          strategyParams.fastPeriod = params.fastPeriod;
          strategyParams.slowPeriod = params.slowPeriod;
          strategyParams.signalPeriod = params.signalPeriod;
          break;
        case 'bollinger':
          strategyParams.period = params.period;
          strategyParams.stdDev = params.stdDev;
          break;
        case 'rsi':
          strategyParams.period = params.period;
          strategyParams.rsiBuy = params.rsiBuy;
          strategyParams.rsiSell = params.rsiSell;
          break;
        case 'ma_cross':
          strategyParams.maShort = params.maShort;
          strategyParams.maLong = params.maLong;
          break;
        case 'volume':
          strategyParams.volMaPeriod = params.volMaPeriod;
          strategyParams.volMultiplier = params.volMultiplier;
          break;
      }

      const result = await runBacktest({
        symbol: params.symbol,
        startDate: params.startDate,
        endDate: params.endDate,
        strategy: params.strategyType || 'macd',
        params: strategyParams,
      });

      if (result) {
        setResults(result);
        message.success('回测完成');
      }
    } catch (error) {
      message.error('回测失败，请稍后重试');
      console.error('回测失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 资金曲线配置
  const equityChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 15, 35, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: results?.equityCurve?.map((e: any) => e.date) || [],
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
    },
    series: [{
      name: '资金曲线',
      type: 'line',
      data: results?.equityCurve?.map((e: any) => e.value) || [],
      smooth: true,
      lineStyle: { width: 3, color: strategyInfo[params.strategyType as keyof typeof strategyInfo]?.color || '#6366f1' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${strategyInfo[params.strategyType as keyof typeof strategyInfo]?.color || '#6366f1'}40` },
            { offset: 1, color: `${strategyInfo[params.strategyType as keyof typeof strategyInfo]?.color || '#6366f1'}00` },
          ],
        },
      },
      symbol: 'circle',
      symbolSize: 6,
    }],
  };

  // 交易记录表格列
  const tradeColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'buy' ? 'error' : 'success'} className="font-semibold">
          {type === 'buy' ? '买入' : '卖出'}
        </Tag>
      ),
    },
    { title: '价格', dataIndex: 'price', key: 'price', width: 100, render: (v: number) => v?.toFixed(2) },
    { title: '数量', dataIndex: 'shares', key: 'shares', width: 80 },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: (v: number) => v?.toFixed(2) },
    {
      title: '盈亏',
      dataIndex: 'pnl',
      key: 'pnl',
      width: 100,
      render: (v: number) => v !== undefined ? (
        <span className="font-bold" style={{ color: v >= 0 ? colors.riseColor : colors.fallColor }}>
          {v >= 0 ? '+' : ''}{v.toFixed(2)}
        </span>
      ) : '-',
    },
    { title: '原因', dataIndex: 'reason', key: 'reason', render: (v: string) => (
      <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-[#a1a1aa]">{v || '-'}</span>
    )},
  ];

  // 渲染策略参数
  const renderStrategyParams = () => {
    switch (params.strategyType) {
      case 'macd':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">快线周期 (DIF)</label>
              <Slider value={params.fastPeriod} onChange={v => setParams({ ...params, fastPeriod: v })} min={5} max={20} marks={{ 5: '5', 12: '12', 20: '20' }} />
            </div>
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">慢线周期 (DEA)</label>
              <Slider value={params.slowPeriod} onChange={v => setParams({ ...params, slowPeriod: v })} min={20} max={40} marks={{ 20: '20', 26: '26', 40: '40' }} />
            </div>
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">信号线周期 (SIGNAL)</label>
              <Slider value={params.signalPeriod} onChange={v => setParams({ ...params, signalPeriod: v })} min={5} max={15} marks={{ 5: '5', 9: '9', 15: '15' }} />
            </div>
          </div>
        );
      case 'bollinger':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">周期 (Period)</label>
              <Slider value={params.period} onChange={v => setParams({ ...params, period: v })} min={10} max={30} marks={{ 10: '10', 20: '20', 30: '30' }} />
            </div>
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">标准差倍数 (StdDev)</label>
              <Slider value={params.stdDev} onChange={v => setParams({ ...params, stdDev: v })} min={1} max={3} step={0.5} marks={{ 1: '1', 2: '2', 3: '3' }} />
            </div>
          </div>
        );
      case 'rsi':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">RSI周期</label>
              <Slider value={params.period} onChange={v => setParams({ ...params, period: v })} min={7} max={21} marks={{ 7: '7', 14: '14', 21: '21' }} />
            </div>
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">超卖线 (买入信号)</label>
              <Slider value={params.rsiBuy} onChange={v => setParams({ ...params, rsiBuy: v })} min={20} max={40} marks={{ 20: '20', 30: '30', 40: '40' }} />
            </div>
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">超买线 (卖出信号)</label>
              <Slider value={params.rsiSell} onChange={v => setParams({ ...params, rsiSell: v })} min={60} max={80} marks={{ 60: '60', 70: '70', 80: '80' }} />
            </div>
          </div>
        );
      case 'ma_cross':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">短期均线周期</label>
              <Slider value={params.maShort} onChange={v => setParams({ ...params, maShort: v })} min={3} max={15} marks={{ 3: '3', 5: '5', 10: '10', 15: '15' }} />
            </div>
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">长期均线周期</label>
              <Slider value={params.maLong} onChange={v => setParams({ ...params, maLong: v })} min={15} max={60} marks={{ 15: '15', 20: '20', 30: '30', 60: '60' }} />
            </div>
          </div>
        );
      case 'volume':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">成交量均线周期</label>
              <Slider value={params.volMaPeriod} onChange={v => setParams({ ...params, volMaPeriod: v })} min={3} max={10} marks={{ 3: '3', 5: '5', 10: '10' }} />
            </div>
            <div>
              <label className="text-sm text-[#a1a1aa] mb-2 block">量能倍数 (突破阈值)</label>
              <Slider value={params.volMultiplier} onChange={v => setParams({ ...params, volMultiplier: v })} min={1.5} max={4} step={0.5} marks={{ 1.5: '1.5x', 2: '2x', 3: '3x', 4: '4x' }} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
          <h1 className="text-3xl font-bold text-white">策略回测</h1>
        </div>
        <p className="text-[#71717a]">验证您的交易策略在过去市场中的表现</p>
      </div>

      <Row gutter={[24, 24]}>
        {/* 策略参数 - 左侧 */}
        <Col xs={24} lg={8}>
          <Card className="h-full" styles={{ body: { padding: '24px' } }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                <FundViewOutlined className="text-xl text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white m-0">策略参数</h3>
                <p className="text-xs text-[#71717a] m-0">配置回测选项</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* 股票代码 */}
              <div>
                <label className="text-sm text-[#a1a1aa] mb-2 flex items-center gap-2">
                  股票代码
                  <Tooltip title="输入股票代码，如 600519">
                    <span className="text-xs cursor-help">?</span>
                  </Tooltip>
                </label>
                <Input
                  value={params.symbol}
                  onChange={e => setParams({ ...params, symbol: e.target.value })}
                  placeholder="如: 600519"
                  size="large"
                  className="rounded-lg"
                />
              </div>

              {/* 日期范围 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#a1a1aa] mb-2 block">开始日期</label>
                  <Input type="date" value={params.startDate} onChange={e => setParams({ ...params, startDate: e.target.value })} className="rounded-lg" />
                </div>
                <div>
                  <label className="text-sm text-[#a1a1aa] mb-2 block">结束日期</label>
                  <Input type="date" value={params.endDate} onChange={e => setParams({ ...params, endDate: e.target.value })} className="rounded-lg" />
                </div>
              </div>

              {/* 初始资金 */}
              <div>
                <label className="text-sm text-[#a1a1aa] mb-2 block">初始资金 (元)</label>
                <Input type="number" value={params.initialCapital} onChange={e => setParams({ ...params, initialCapital: Number(e.target.value) })} className="rounded-lg" />
              </div>

              <Divider className="border-white/10 my-4" />

              {/* 策略类型 */}
              <div>
                <label className="text-sm text-[#a1a1aa] mb-3 block">策略类型</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(strategyInfo).map(([key, info]) => (
                    <div
                      key={key}
                      onClick={() => setParams({ ...params, strategyType: key as any })}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        params.strategyType === key
                          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${params.strategyType === key ? 'text-white' : 'text-[#a1a1aa]'}`}>
                          {info.name}
                        </span>
                        {params.strategyType === key && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">选中</span>
                        )}
                      </div>
                      <p className="text-xs text-[#71717a] mt-1 mb-0">{info.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Divider className="border-white/10 my-4" />

              {/* 策略特定参数 */}
              {renderStrategyParams()}

              <Divider className="border-white/10 my-4" />

              {/* 止损止盈 */}
              <div>
                <label className="text-sm text-[#a1a1aa] mb-2 block">止损比例 (%)</label>
                <Slider value={params.stopLoss} onChange={v => setParams({ ...params, stopLoss: v })} min={1} max={10} marks={{ 1: '1%', 3: '3%', 5: '5%', 10: '10%' }} />
              </div>

              <div>
                <label className="text-sm text-[#a1a1aa] mb-2 block">止盈比例 (%)</label>
                <Slider value={params.takeProfit} onChange={v => setParams({ ...params, takeProfit: v })} min={3} max={20} marks={{ 3: '3%', 6: '6%', 10: '10%', 20: '20%' }} />
              </div>

              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleRunBacktest}
                loading={loading}
                className="w-full h-12 rounded-xl mt-4 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                开始回测
              </Button>
            </div>
          </Card>
        </Col>

        {/* 回测结果 - 右侧 */}
        <Col xs={24} lg={16}>
          {loading ? (
            <Card className="flex flex-col items-center justify-center" style={{ minHeight: 600 }}>
              <Spin size="large" />
              <div className="ml-4 text-[#a1a1aa] mt-4">回测运行中，请稍候...</div>
            </Card>
          ) : results ? (
            <>
              {/* 统计概览 */}
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={12} sm={8}>
                  <Card styles={{ body: { padding: '20px' } }} className="text-center">
                    <div className="text-xs text-[#71717a] mb-1">总交易次数</div>
                    <div className="text-3xl font-bold text-white">{results.totalTrades}</div>
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card styles={{ body: { padding: '20px' } }} className="text-center">
                    <div className="text-xs text-[#71717a] mb-1">胜率</div>
                    <div className="text-3xl font-bold flex items-center justify-center gap-2" style={{ color: results.winRate > 0.5 ? colors.riseColor : colors.fallColor }}>
                      {results.winRate > 0.5 ? <RiseOutlined /> : <FallOutlined />}
                      {Number(results.winRate * 100)?.toFixed(1) ?? '-'}%
                    </div>
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card styles={{ body: { padding: '20px' } }} className="text-center">
                    <div className="text-xs text-[#71717a] mb-1">总收益率</div>
                    <div className="text-3xl font-bold flex items-center justify-center gap-2" style={{ color: results.totalReturn > 0 ? colors.riseColor : colors.fallColor }}>
                      {results.totalReturn > 0 ? <RiseOutlined /> : <FallOutlined />}
                      {results.totalReturn > 0 ? '+' : ''}{Number(results.totalReturn)?.toFixed(2) ?? '0'}%
                    </div>
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card styles={{ body: { padding: '20px' } }} className="text-center">
                    <div className="text-xs text-[#71717a] mb-1">最大回撤</div>
                    <div className="text-3xl font-bold" style={{ color: colors.fallColor }}>{Number(results.maxDrawdown)?.toFixed(2) ?? '0'}%</div>
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card styles={{ body: { padding: '20px' } }} className="text-center">
                    <div className="text-xs text-[#71717a] mb-1">夏普比率</div>
                    <div className="text-3xl font-bold text-white">{Number(results.sharpeRatio)?.toFixed(2) ?? '0'}</div>
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card styles={{ body: { padding: '20px' } }} className="text-center">
                    <div className="text-xs text-[#71717a] mb-1">平均持仓天数</div>
                    <div className="text-3xl font-bold text-white">{results.avgHoldingDays || '-'} 天</div>
                  </Card>
                </Col>
              </Row>

              {/* 资金曲线 */}
              <Card className="mb-6" styles={{ body: { padding: '24px' } }}>
                <div className="flex items-center gap-3 mb-4">
                  <TrophyOutlined className="text-xl text-amber-400" />
                  <h3 className="text-lg font-bold text-white m-0">资金曲线</h3>
                  <span className="text-xs text-[#71717a]">净值变化</span>
                </div>
                <ReactECharts
                  option={equityChartOption}
                  style={{ height: '300px', width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              </Card>

              {/* 交易记录 */}
              <Card styles={{ body: { padding: '24px' } }}>
                <div className="flex items-center gap-3 mb-4">
                  <HistoryOutlined className="text-xl text-indigo-400" />
                  <h3 className="text-lg font-bold text-white m-0">交易记录</h3>
                  <span className="text-xs text-[#71717a]">共 {results.trades?.length || 0} 条</span>
                </div>
                <Table
                  dataSource={results.trades}
                  columns={tradeColumns}
                  rowKey={(record: any, index?: number) => `${record.date}-${index}` as any}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center" style={{ minHeight: 600 }}>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                  <ExperimentOutlined className="text-5xl text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">开始您的策略回测</h3>
                <p className="text-[#71717a] mb-6 max-w-md">选择策略类型，配置参数，点击开始回测，查看策略表现</p>
                <div className="flex items-center justify-center gap-4 text-sm text-[#71717a]">
                  <div className="flex items-center gap-2">
                    <AimOutlined className="text-indigo-400" />
                    <span>精确的参数调整</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThunderboltOutlined className="text-amber-400" />
                    <span>快速回测分析</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default BacktestPage;