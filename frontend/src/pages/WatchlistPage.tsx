import React, { useEffect, useState } from 'react';
import { Row, Col, Button, message, Modal, InputNumber, Tag } from 'antd';
import { ReloadOutlined, PlusOutlined, DeleteOutlined, WalletOutlined, EditOutlined } from '@ant-design/icons';
import { useThemeStore } from '../stores/themeStore';
import StockSearch from '../components/StockSearch';
import StockCard from '../components/StockCard';
import { useWatchlistStore } from '../stores/watchlistStore';
import { usePositionsStore } from '../stores/positionsStore';
import { useNavigate } from 'react-router-dom';
import { formatNumber, isMarketOpen } from '../utils/format';
import type { WatchlistItem, Position } from '../types';

const WatchlistPage: React.FC = () => {
  const { items, loading, error, fetchWatchlist, removeStock } = useWatchlistStore();
  const { items: positions, loading: positionsLoading, fetchPositions, removeStock: removePosition } = usePositionsStore();
  const { colors } = useThemeStore();
  const navigate = useNavigate();

  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<WatchlistItem | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [buyShares, setBuyShares] = useState<number>(1);

  // 智能刷新：开市时每3秒轮询，非开市时只加载一次
  useEffect(() => {
    fetchWatchlist();
    fetchPositions();

    if (isMarketOpen()) {
      const interval = setInterval(() => {
        fetchWatchlist();
        fetchPositions();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchWatchlist, fetchPositions]);

  const handleRemove = async (id: number) => {
    await removeStock(id);
    message.success('已从自选删除');
  };

  const handleRefresh = () => {
    fetchWatchlist();
    fetchPositions();
  };

  const handleAddSuccess = () => {
    fetchWatchlist();
  };

  const handleOpenBuyModal = (stock: WatchlistItem) => {
    setEditingPosition(null);
    setSelectedStock(stock);
    setBuyPrice(stock.price || 0);
    setBuyShares(1);
    setBuyModalVisible(true);
  };

  const handleOpenEditModal = (position: Position) => {
    setEditingPosition(position);
    setSelectedStock(null);
    setBuyPrice(position.buyPrice);
    setBuyShares(position.shares);
    setBuyModalVisible(true);
  };

  const handleConfirmBuy = async () => {
    if (buyPrice <= 0 || buyShares <= 0) {
      message.error('请输入有效的买入价和数量');
      return;
    }

    // 编辑已有持仓
    if (editingPosition) {
      await usePositionsStore.getState().updatePosition(editingPosition.id, buyPrice, buyShares);
      message.success('持仓已更新');
    } else if (selectedStock) {
      // 新增持仓
      await usePositionsStore.getState().addStock(
        selectedStock.symbol,
        selectedStock.name,
        selectedStock.market,
        buyPrice,
        buyShares
      );
      message.success('买入成功');
    }

    setBuyModalVisible(false);
    setSelectedStock(null);
    setEditingPosition(null);
  };

  const handleRemovePosition = async (id: number) => {
    await removePosition(id);
    message.success('已平仓');
  };

  if (error) {
    message.error(error);
  }

  // 计算今日统计
  const todayStats = items.length > 0 ? {
    totalChange: items.reduce((sum, item) => sum + item.changePercent, 0) / items.length,
    risingCount: items.filter(item => item.changePercent > 0).length,
    fallingCount: items.filter(item => item.changePercent < 0).length,
  } : null;

  // 计算持仓总收益 (shares是手数，1手=100股)
  const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.buyPrice * p.shares * 100, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.currentPrice * p.shares * 100, 0);

  return (
    <div className="p-6 min-h-screen">
      {/* 持仓区域 */}
      <div className="mb-8 p-6 rounded-2xl relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)',
        border: '2px solid rgba(16, 185, 129, 0.5)',
        boxShadow: '0 0 30px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* 顶部装饰角标 */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 80, height: 80,
          background: 'linear-gradient(135deg, transparent 50%, rgba(16,185,129,0.15) 50%)',
          borderBottomLeftRadius: 16,
        }} />

        {/* 空状态提示 */}
        {positions.length === 0 && !positionsLoading && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <WalletOutlined className="text-2xl" style={{ color: colors.riseColor + '99' }} />
            </div>
            <p className="text-[#71717a] text-sm mb-1">暂无持仓</p>
            <p className="text-[#52525b] text-xs">在下方自选股卡片点击"买入"添加您的第一笔持仓</p>
          </div>
        )}

        {/* 有持仓时显示内容 */}
        {positions.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: colors.riseColor + '33' }}>
                  <WalletOutlined className="text-2xl" style={{ color: colors.riseColor }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">我的持仓</h2>
                  <p className="text-sm text-[#71717a]">{positions.length} 只股票</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#71717a]">总收益</div>
                <div className="text-3xl font-bold" style={{ color: totalProfit >= 0 ? colors.riseColor : colors.fallColor }}>
                  {totalProfit >= 0 ? '+' : ''}{formatNumber(totalProfit)} 元
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="stat-card">
                <div className="text-xs text-[#71717a] mb-1">持仓成本</div>
                <div className="text-2xl font-bold text-white">{formatNumber(totalCost)}</div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-[#71717a] mb-1">持仓市值</div>
                <div className="text-2xl font-bold text-white">{formatNumber(totalValue)}</div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-[#71717a] mb-1">浮盈金额</div>
                <div className="text-2xl font-bold" style={{ color: totalProfit >= 0 ? colors.riseColor : colors.fallColor }}>
                  {totalProfit >= 0 ? '+' : ''}{formatNumber(totalProfit)}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-[#71717a] mb-1">收益率</div>
                <div className="text-2xl font-bold" style={{ color: totalProfit >= 0 ? colors.riseColor : colors.fallColor }}>
                  {totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(2) : '0.00'}%
                </div>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              {positions.map(position => {
                const isProfit = position.profit >= 0;
                const profitPercent = position.profitPercent;

                return (
                  <Col key={position.id} xs={24} sm={12} lg={6}>
                    <div
                      className="p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderColor: isProfit ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">{position.name}</span>
                            <Tag className="m-0 text-xs" color={position.market === 'SH' ? 'blue' : 'purple'}>
                              {position.market === 'SH' ? '沪' : '深'}
                            </Tag>
                          </div>
                          <div className="text-sm text-[#71717a]">{position.symbol}</div>
                        </div>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleOpenEditModal(position)}
                          className="rounded-lg mr-2"
                        >
                          修改
                        </Button>
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemovePosition(position.id)}
                          className="rounded-lg"
                        >
                          平仓
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <div className="text-xs text-[#71717a]">买入价</div>
                          <div className="text-white font-medium">{formatNumber(position.buyPrice)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#71717a]">当前价</div>
                          <div className="text-white font-medium">{formatNumber(position.currentPrice)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#71717a]">持股数量</div>
                          <div className="text-white font-medium">{position.shares} 手</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#71717a]">盈亏</div>
                          <div className="font-medium" style={{ color: isProfit ? colors.riseColor : colors.fallColor }}>
                            {isProfit ? '+' : ''}{formatNumber(position.profit)} 元
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-3 rounded-lg text-center"
                        style={{
                          background: isProfit ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid'
                        }}
                      >
                        <div className="text-xs text-[#71717a] mb-1">涨跌</div>
                        <div className="text-2xl font-bold" style={{ color: isProfit ? colors.riseColor : colors.fallColor }}>
                          {isProfit ? '+' : ''}{profitPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </>
        )}
      </div>

      {/* 页面标题和搜索 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">自选股票</h1>
            <p className="text-[#71717a] text-sm">追踪您关注的股票</p>
          </div>
          <Button
            icon={<ReloadOutlined spin={loading || positionsLoading} />}
            onClick={handleRefresh}
            loading={loading || positionsLoading}
            className="rounded-lg"
          >
            刷新
          </Button>
        </div>

        {/* 搜索区域 */}
        <div className="mb-6">
          <StockSearch onAddSuccess={handleAddSuccess} />
        </div>
      </div>

      {/* 今日概况 */}
      {todayStats && items.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="text-2xl font-bold text-white">{items.length}</div>
            <div className="text-sm text-[#71717a]">自选股票</div>
          </div>
          <div className="stat-card">
            <div className={`text-2xl font-bold ${todayStats.risingCount > todayStats.fallingCount ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {todayStats.risingCount}
            </div>
            <div className="text-sm text-[#71717a]">上涨</div>
          </div>
          <div className="stat-card" >
            <div className="text-2xl font-bold text-[#ef4444]" style={{ color:  colors.fallColor }}>{todayStats.fallingCount}</div>
            <div className="text-sm" style={{ color:  colors.fallColor }} >下跌</div>
          </div>
          <div className="stat-card">
            <div className={`text-2xl font-bold`} style={{ color: totalProfit >= 0 ? colors.riseColor : colors.fallColor }}>
              {todayStats.totalChange >= 0 ? '+' : ''}{todayStats.totalChange.toFixed(2)}%
            </div>
            <div className="text-sm" style={{ color: totalProfit >= 0 ? colors.riseColor : colors.fallColor }}>平均涨跌</div>
          </div>
        </div>
      )}

      {items.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-[#6366f1]/10 flex items-center justify-center mb-6">
            <PlusOutlined className="text-4xl text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">添加您的自选股票</h3>
          <p className="text-[#71717a] mb-6">使用上方搜索框搜索并添加关注的股票</p>
          <StockSearch onAddSuccess={handleAddSuccess} />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {items.map(stock => (
            <Col key={stock.id} xs={24} sm={12} lg={8} xl={6}>
              <StockCard
                stock={stock}
                onRemove={handleRemove}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                onBuy={handleOpenBuyModal}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* 买入 / 修改 持仓 Modal */}
      <Modal
        title={
          <span className="text-white">
            {editingPosition
              ? `修改持仓 - ${editingPosition.name} (${editingPosition.symbol})`
              : `买入 ${selectedStock?.name} (${selectedStock?.symbol})`
            }
          </span>
        }
        open={buyModalVisible}
        onOk={handleConfirmBuy}
        onCancel={() => {
          setBuyModalVisible(false);
          setSelectedStock(null);
          setEditingPosition(null);
        }}
        okText={editingPosition ? '保存修改' : '确认买入'}
        okButtonProps={{ className: 'rounded-lg' }}
        cancelButtonProps={{ className: 'rounded-lg' }}
      >
        <div className="py-4">
          {!editingPosition && selectedStock?.price && (
            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="text-xs text-[#71717a] mb-1">当前市价（参考）</div>
              <div className="text-xl font-bold text-white">{formatNumber(selectedStock.price)} 元/股</div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-[#71717a] mb-2">买入价 <span className="text-[#52525b] text-xs">（每股价格）</span></label>
            <InputNumber
              value={buyPrice}
              onChange={(value) => setBuyPrice(value || 0)}
              min={0.01}
              step={0.01}
              precision={2}
              className="w-full"
              size="large"
              prefix="¥"
              suffix="元/股"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-[#71717a] mb-2">买入数量 <span className="text-[#52525b] text-xs">（手数）</span></label>
            <InputNumber
              value={buyShares}
              onChange={(value) => setBuyShares(value || 0)}
              min={1}
              step={1}
              className="w-full"
              size="large"
              suffix="手"
            />
            <div className="text-xs text-[#52525b] mt-1">每手 = 100股，总计 <span className="text-white">{buyShares * 100}</span> 股</div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#71717a]">每股价格</span>
              <span className="text-white">{formatNumber(buyPrice)} 元</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#71717a]">持股数量</span>
              <span className="text-white">{buyShares * 100} 股</span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="text-[#71717a]">{'总计金额'}</span>
              <span className="text-white font-bold">{formatNumber(buyPrice * buyShares * 100)} 元</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WatchlistPage;