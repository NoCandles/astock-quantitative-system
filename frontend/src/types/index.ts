export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
  bid1: number;
  ask1: number;
  market: 'SH' | 'SZ';
}

export interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
}

export interface KLineResponse {
  symbol: string;
  name: string;
  period: string;
  data: KLineData[];
}

export interface WatchlistItem extends StockQuote {
  id: number;
  added_at: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  market: 'SH' | 'SZ';
  type: string;
}

export interface TechnicalIndicators {
  ma5: string;
  ma10: string;
  ma20: string;
  ma60: string;
  rsi: string;
  latestPrice: number;
  priceChange: string;
  high20: number;
  low20: number;
  volume20Avg: string;
}

export interface AnalysisResult {
  symbol: string;
  name: string;
  quote: StockQuote;
  technicalIndicators: TechnicalIndicators;
  analysis: string;
  timestamp: string;
}

// 回测相关类型
export interface BacktestTrade {
  date: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  shares: number;
  amount: number;
  pnl?: number;
  reason?: string;
}

export interface BacktestSignal {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  reason?: string;
}

export interface BacktestResult {
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  finalCapital: number;
  totalPnl?: number;
  avgHoldingDays?: number;
  trades: BacktestTrade[];
  signals: BacktestSignal[];
  equityCurve: { date: string; value: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 持仓相关类型
export interface Position {
  id: number;
  symbol: string;
  name: string;
  market: 'SH' | 'SZ';
  buyPrice: number;
  shares: number;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  profit: number;
  profitPercent: number;
  created_at: string;
}
