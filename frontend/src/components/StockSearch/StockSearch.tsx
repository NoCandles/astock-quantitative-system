import React, { useState } from 'react';
import { AutoComplete, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchStocks, addToWatchlist } from '../../services/api';
import type { SearchResult } from '../../types';

interface StockSearchProps {
  onAddSuccess?: () => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onAddSuccess }) => {
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value: string) => {
    if (!value || value.length < 1) {
      setOptions([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchStocks(value);
      setOptions(results.slice(0, 10));
    } catch (error) {
      console.error('搜索失败:', error);
      setOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (_value: string, option: any) => {
    try {
      await addToWatchlist(option.symbol, option.name, option.market);
      message.success({
        content: (
          <span>
            已添加 <strong>{option.name}</strong> ({option.symbol}) 到自选
          </span>
        ),
      });
      onAddSuccess?.();
      setOptions([]);
    } catch (error) {
      message.error('添加失败，该股票可能已在自选中');
    }
  };

  const renderOption = (item: SearchResult) => ({
    value: `${item.symbol}-${item.name}`,
    label: (
      <div className="flex justify-between items-center py-2 px-1 hover:bg-white/5 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-medium text-white">{item.name}</span>
          <span className="text-sm text-[#71717a] font-mono">{item.symbol}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[#a1a1aa]">
          {item.market === 'SH' ? '沪市' : '深市'}
        </span>
      </div>
    ),
    symbol: item.symbol,
    name: item.name,
    market: item.market,
    type: item.type
  });

  return (
    <div className="max-w-xl">
      <AutoComplete
        className="w-full"
        value=""
        options={options.map(renderOption)}
        onSearch={handleSearch}
        onSelect={handleSelect}
        placeholder="输入股票代码或名称搜索..."
        notFoundContent={searching ? '搜索中...' : '未找到相关股票'}
        suffixIcon={<SearchOutlined className="text-[#71717a]" />}
      />
    </div>
  );
};

export default StockSearch;