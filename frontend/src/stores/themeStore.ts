import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  riseColor: string;
  fallColor: string;
  flatColor: string;
  label: string;
}

export const PRESET_THEMES: ThemeColors[] = [
  { label: '经典红绿', riseColor: '#F5455C', fallColor: '#1BB934', flatColor: '#999999' },
  { label: '绿涨红跌', riseColor: '#1BB934', fallColor: '#F5455C', flatColor: '#999999' },
  { label: '紫橙配色', riseColor: '#8b5cf6', fallColor: '#f97316', flatColor: '#999999' },
  { label: '蓝粉配色', riseColor: '#3b82f6', fallColor: '#ec4899', flatColor: '#999999' },
];

interface ThemeStore {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  setTheme: (colors: ThemeColors) => void;
  setCustomColors: (riseColor: string, fallColor: string, flatColor: string) => void;
  getRiseColor: () => string;
  getFallColor: () => string;
  getFlatColor: () => string;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      colors: PRESET_THEMES[0],

      setMode: (mode) => set({ mode }),

      setTheme: (colors) => set({ colors }),

      setCustomColors: (riseColor, fallColor, flatColor) =>
        set({ colors: { riseColor, fallColor, flatColor, label: '自定义' } }),

      getRiseColor: () => get().colors.riseColor,
      getFallColor: () => get().colors.fallColor,
      getFlatColor: () => get().colors.flatColor,
    }),
    {
      name: 'astock-theme',
    }
  )
);
