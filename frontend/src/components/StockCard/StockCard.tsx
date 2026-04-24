import React from 'react';
import { Card, Button, Tooltip, Tag } from 'antd';
import { DeleteOutlined, LineChartOutlined, RiseOutlined, FallOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { formatNumber, formatVolume, formatAmount, getChangeColor, formatChangePercent } from '../../utils/format';
import { useThemeStore } from '../../stores/themeStore';
import type { WatchlistItem } from '../../types';

interface StockCardProps {
  stock: WatchlistItem;
  onRemove: (id: number) => void;
  onClick?: () => void;
  onBuy?: (stock: WatchlistItem) => void;
}

const StockCard: React.FC<StockCardProps> = ({ stock, onRemove, onClick, onBuy }) => {
  const changeColor = getChangeColor(stock.change);
  const isRising = stock.changePercent >= 0;
  const { colors } = useThemeStore();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 group"
      onClick={onClick}
      styles={{ body: { padding: '20px' } }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-semibold text-white">{stock.name}</span>
            <Tag className="m-0 text-xs" color={stock.market === 'SH' ? 'blue' : 'purple'}>
              {stock.market === 'SH' ? '沪' : '深'}
            </Tag>
          </div>
          
          <div className="flex items-baseline gap-3 mb-4">
            <span 
              className="text-3xl font-bold"
              style={{ color: changeColor }}
            >
              {formatNumber(stock.price)}
            </span>
            <span
              className="text-lg font-medium flex items-center gap-1"
              style={{ color: isRising ? colors.riseColor : colors.fallColor }}
            >
              {isRising ? <RiseOutlined /> : <FallOutlined />}
              {formatChangePercent(stock.changePercent)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-[#71717a]">
              <span className="text-xs text-[#52525b]">开盘</span>
              <div className="text-white font-medium">{formatNumber(stock.open)}</div>
            </div>
            <div className="text-[#71717a]">
              <span className="text-xs text-[#52525b]">最高</span>
              <div className="text-white font-medium">{formatNumber(stock.high)}</div>
            </div>
            <div className="text-[#71717a]">
              <span className="text-xs text-[#52525b]">最低</span>
              <div className="text-white font-medium">{formatNumber(stock.low)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div className="text-[#71717a]">
              <span className="text-xs text-[#52525b]">成交量</span>
              <div className="text-white font-medium">{formatVolume(stock.volume)}</div>
            </div>
            <div className="text-[#71717a]">
              <span className="text-xs text-[#52525b]">成交额</span>
              <div className="text-white font-medium">{formatAmount(stock.amount)}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Tooltip title="买入">
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onBuy?.(stock);
              }}
              className="rounded-lg bg-emerald-500 border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600"
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              icon={<LineChartOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className="rounded-lg"
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(stock.id);
              }}
              className="rounded-lg"
            />
          </Tooltip>
        </div>
      </div>
    </Card>
  );
};

export default StockCard;