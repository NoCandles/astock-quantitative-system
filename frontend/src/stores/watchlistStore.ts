import { create } from 'zustand';
import type { WatchlistItem } from '../types';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/api';

interface WatchlistStore {
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
  fetchWatchlist: () => Promise<void>;
  addStock: (symbol: string, name: string, market: string) => Promise<void>;
  removeStock: (id: number) => Promise<void>;
  refreshQuotes: () => Promise<void>;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchWatchlist: async () => {
    set({ loading: true, error: null });
    try {
      const items = await getWatchlist();
      set({ items, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '获取自选股失败', 
        loading: false 
      });
    }
  },

  addStock: async (symbol: string, name: string, market: string) => {
    try {
      await addToWatchlist(symbol, name, market);
      await get().fetchWatchlist();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '添加自选股失败' 
      });
    }
  },

  removeStock: async (id: number) => {
    try {
      await removeFromWatchlist(id);
      set(state => ({
        items: state.items.filter(item => item.id !== id)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '删除自选股失败' 
      });
    }
  },

  refreshQuotes: async () => {
    // 重新获取自选股以刷新行情
    await get().fetchWatchlist();
  }
}));
