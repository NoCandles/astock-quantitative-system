import { create } from 'zustand';
import type { Position } from '../types';
import { getPositions, addPosition, removePosition, updatePosition as updatePositionApi } from '../services/api';

interface PositionsStore {
  items: Position[];
  loading: boolean;
  error: string | null;
  fetchPositions: () => Promise<void>;
  addStock: (symbol: string, name: string, market: string, buyPrice: number, shares: number) => Promise<void>;
  removeStock: (id: number) => Promise<void>;
  updatePosition: (id: number, buyPrice: number, shares: number) => Promise<void>;
}

export const usePositionsStore = create<PositionsStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchPositions: async () => {
    set({ loading: true, error: null });
    try {
      const items = await getPositions();
      set({ items, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取持仓失败',
        loading: false
      });
    }
  },

  addStock: async (symbol: string, name: string, market: string, buyPrice: number, shares: number) => {
    try {
      await addPosition(symbol, name, market, buyPrice, shares);
      await get().fetchPositions();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加持仓失败'
      });
    }
  },

  removeStock: async (id: number) => {
    try {
      await removePosition(id);
      set(state => ({
        items: state.items.filter(item => item.id !== id)
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除持仓失败'
      });
    }
  },

  updatePosition: async (id: number, buyPrice: number, shares: number) => {
    try {
      await updatePositionApi(id, buyPrice, shares);
      await get().fetchPositions();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '修改持仓失败'
      });
    }
  }
}));