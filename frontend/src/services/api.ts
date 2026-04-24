import axios from 'axios';
import type {
  StockQuote,
  KLineResponse,
  WatchlistItem,
  SearchResult,
  AnalysisResult,
  ApiResponse,
  BacktestResult,
  Position
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// 股票搜索
export async function searchStocks(query: string): Promise<SearchResult[]> {
  const response = await api.get<ApiResponse<SearchResult[]>>('/search', {
    params: { q: query }
  });
  return response.data.data || [];
}

// 获取股票行情
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const response = await api.get<ApiResponse<StockQuote>>(`/quote/${symbol}`);
  return response.data.data || null;
}

// 批量获取股票行情
export async function getBatchQuotes(symbols: string[]): Promise<StockQuote[]> {
  const response = await api.get<ApiResponse<StockQuote[]>>('/quotes/batch', {
    params: { symbols: symbols.join(',') }
  });
  return response.data.data || [];
}

// 获取K线数据
export async function getKlineData(
  symbol: string, 
  period: string = 'daily', 
  limit: number = 100
): Promise<KLineResponse | null> {
  const response = await api.get<ApiResponse<KLineResponse>>(`/kline/${symbol}`, {
    params: { period, limit }
  });
  return response.data.data || null;
}

// 自选股相关
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const response = await api.get<ApiResponse<WatchlistItem[]>>('/watchlist');
  return response.data.data || [];
}

export async function addToWatchlist(
  symbol: string, 
  name: string, 
  market: string
): Promise<boolean> {
  const response = await api.post<ApiResponse<null>>('/watchlist', {
    symbol, name, market
  });
  return response.data.success;
}

export async function removeFromWatchlist(id: number): Promise<boolean> {
  const response = await api.delete<ApiResponse<null>>(`/watchlist/${id}`);
  return response.data.success;
}

// AI分析 — 支持股票名称或代码
export async function analyzeStock(
  stockInput: string,
  provider?: 'minimax' | 'deepseek' | 'claude',
  apiKey?: string
): Promise<AnalysisResult | null> {
  const response = await api.post<ApiResponse<AnalysisResult>>('/analyze', {
    stockInput,
    provider,
    apiKey
  });
  return response.data.data || null;
}

// 回测相关
export async function runBacktest(params: {
  symbol: string;
  startDate: string;
  endDate: string;
  strategy?: 'macd' | 'ma_cross' | 'bollinger' | 'rsi' | 'volume' | undefined;
  params?: {
    initialCapital: number;
    stopLoss: number;
    takeProfit: number;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
    period?: number;
    stdDev?: number;
    rsiBuy?: number;
    rsiSell?: number;
    maShort?: number;
    maLong?: number;
    volMaPeriod?: number;
    volMultiplier?: number;
  };
}): Promise<BacktestResult | null> {
  const response = await api.post<ApiResponse<BacktestResult>>('/backtest/run', params);
  return response.data.data || null;
}

// 持仓相关
export async function getPositions(): Promise<Position[]> {
  const response = await api.get<ApiResponse<Position[]>>('/positions');
  return response.data.data || [];
}

export async function addPosition(
  symbol: string,
  name: string,
  market: string,
  buyPrice: number,
  shares: number
): Promise<boolean> {
  const response = await api.post<ApiResponse<null>>('/positions', {
    symbol, name, market, buyPrice, shares
  });
  return response.data.success;
}

export async function removePosition(id: number): Promise<boolean> {
  const response = await api.delete<ApiResponse<null>>(`/positions/${id}`);
  return response.data.success;
}

export async function updatePosition(
  id: number,
  buyPrice: number,
  shares: number
): Promise<boolean> {
  const response = await api.put<ApiResponse<null>>(`/positions/${id}`, {
    buyPrice,
    shares
  });
  return response.data.success;
}
