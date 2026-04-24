import { create } from 'zustand';
import { getStockQuote, getKlineData } from '../services/api';
import type { StockQuote, KLineData } from '../types';

interface StockState {
  currentStock: StockQuote | null;
  klineData: KLineData[];
  loading: boolean;
  error: string | null;
  klineError: string | null;
  stockLoading: boolean;
  fetchStockDetail: (symbol: string) => Promise<void>;
  fetchKlineData: (symbol: string, period: string, limit: number) => Promise<void>;
  clearCurrentStock: () => void;
}

export const useStockStore = create<StockState>((set) => ({
  currentStock: null,
  klineData: [],
  loading: false,
  error: null,
  klineError: null,
  stockLoading: false,

  fetchStockDetail: async (symbol: string) => {
    set({ stockLoading: true, error: null });
    try {
      const data = await getStockQuote(symbol);
      if (data) {
        set({ currentStock: data, stockLoading: false, error: null });
      } else {
        set({ error: '股票不存在', stockLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || '获取股票信息失败', stockLoading: false });
    }
  },

  fetchKlineData: async (symbol: string, period: string, limit: number) => {
    set({ klineError: null });
    try {
      const response = await getKlineData(symbol, period, limit);
      if (response && response.data) {
        set({ klineData: response.data });
      } else {
        set({ klineData: [] });
      }
    } catch (error: any) {
      set({ klineError: error.message || '获取K线数据失败' });
    }
  },

  clearCurrentStock: () => {
    set({ currentStock: null, klineData: [], error: null, klineError: null, stockLoading: false });
  },
}));