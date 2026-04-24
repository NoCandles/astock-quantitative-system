import React, { useState } from 'react';
import { Button, Input, Spin, Alert, Select } from 'antd';
import { BulbOutlined, SettingOutlined } from '@ant-design/icons';
import { analyzeStock } from '../../services/api';
import type { AnalysisResult } from '../../types';

const { TextArea } = Input;

interface StockAnalysisProps {
  symbol: string;
}

const StockAnalysis: React.FC<StockAnalysisProps> = () => {
  const [stockInput, setStockInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'minimax' | 'deepseek' | 'claude'>('deepseek');
  const [showSettings, setShowSettings] = useState(false);

  const handleAnalyze = async () => {
    const input = stockInput.trim();
    if (!input) {
      setError('请输入股票名称或代码');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeStock(input, provider);
      if (data) {
        setResult(data);
        setStockInput('');
      } else {
        setError('未找到该股票，请检查输入');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BulbOutlined className="text-lg text-yellow-500" />
          <h3 className="m-0 text-lg font-medium">AI 智能诊断</h3>
        </div>
        <Button
          type={showSettings ? "primary" : "default"}
          icon={<SettingOutlined />}
          onClick={() => setShowSettings(!showSettings)}
          size="small"
        >
          {showSettings ? '收起设置' : 'AI设置'}
        </Button>
      </div>

      {showSettings && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="mb-3 text-sm font-medium text-gray-700">选择 AI 模型</div>
          <div className="flex items-center gap-3">
            <span className="w-16 text-sm text-gray-600 shrink-0">模型:</span>
            <Select
              value={provider}
              onChange={setProvider}
              options={[
                { label: 'DeepSeek (推荐)', value: 'deepseek' },
                { label: 'MiniMax', value: 'minimax' },
                { label: 'Claude', value: 'claude' },
              ]}
              className="flex-1"
              size="middle"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <TextArea
          value={stockInput}
          onChange={(e) => setStockInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入股票名称或代码，例如：贵州茅台、600519"
          autoSize={{ minRows: 1, maxRows: 2 }}
          className="flex-1"
        />
        <Button
          type="primary"
          icon={<BulbOutlined />}
          onClick={handleAnalyze}
          loading={loading}
          disabled={loading}
          className="shrink-0"
        >
          {result ? '重新分析' : '开始分析'}
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spin size="large" />
          <div className="mt-4 text-gray-500">AI 正在分析股票，请稍候...</div>
        </div>
      )}

      {error && (
        <Alert
          message="分析失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      {result && !loading && (
        <div className="p-6 color-white rounded-lg shadow">
          <div className="pb-4 mb-4 border-b">
            <h4 className="text-xl font-medium text-white">
              {result.name} ({result.symbol})
            </h4>
            <div className="mt-1 text-sm text-gray-500">
              分析时间: {new Date(result.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>

          <div
            className="leading-relaxed text-gray-300 whitespace-pre-wrap max-w-none"
          >
            {result.analysis}
          </div>

          {result.technicalIndicators && (
            <div className="pt-4 mt-6 border-t border-white/10">
              <h5 className="mb-3 font-medium text-gray-400">技术指标</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {result.technicalIndicators.ma5 && (
                  <div className="flex justify-between"><span className="text-gray-500">MA5</span><span className="text-white">{result.technicalIndicators.ma5}</span></div>
                )}
                {result.technicalIndicators.ma10 && (
                  <div className="flex justify-between"><span className="text-gray-500">MA10</span><span className="text-white">{result.technicalIndicators.ma10}</span></div>
                )}
                {result.technicalIndicators.ma20 && (
                  <div className="flex justify-between"><span className="text-gray-500">MA20</span><span className="text-white">{result.technicalIndicators.ma20}</span></div>
                )}
                {result.technicalIndicators.ma60 && (
                  <div className="flex justify-between"><span className="text-gray-500">MA60</span><span className="text-white">{result.technicalIndicators.ma60}</span></div>
                )}
                {result.technicalIndicators.rsi && (
                  <div className="flex justify-between"><span className="text-gray-500">RSI(14)</span><span className="text-white">{result.technicalIndicators.rsi}</span></div>
                )}
                {result.technicalIndicators.high20 && (
                  <div className="flex justify-between"><span className="text-gray-500">20日最高</span><span className="text-white">{result.technicalIndicators.high20}</span></div>
                )}
                {result.technicalIndicators.low20 && (
                  <div className="flex justify-between"><span className="text-gray-500">20日最低</span><span className="text-white">{result.technicalIndicators.low20}</span></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <Alert
          message="提示"
          description="输入股票名称（如贵州茅台）或代码（如600519），AI将基于K线数据和技术指标为您分析股票走势。"
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default StockAnalysis;
