/**
 * 判断当前是否为 A 股交易时段
 * 上午: 09:30 - 11:30
 * 下午: 13:00 - 15:00
 * 周一至周五（排除周末）
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const day = beijing.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hours = beijing.getUTCHours();
  const minutes = beijing.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  const morningStart = 1 * 60 + 30;
  const morningEnd = 11 * 60 + 30;
  const afternoonStart = 5 * 60 + 0;
  const afternoonEnd = 15 * 60 + 0;
  return (totalMinutes >= morningStart && totalMinutes <= morningEnd) ||
    (totalMinutes >= afternoonStart && totalMinutes <= afternoonEnd);
}

// 涨跌颜色从 themeStore 动态读取
import { useThemeStore } from '../stores/themeStore';

function getColors() {
  const { colors } = useThemeStore.getState();
  return colors;
}

// 格式化数字
export function formatNumber(num: number | undefined | null, decimals: number = 2): string {
  if (num == null) return '-';
  return num.toFixed(decimals);
}

// 格式化交易量
export function formatVolume(volume: number | undefined | null): string {
  if (volume == null) return '-';
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿';
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万';
  } else {
    return volume.toString();
  }
}

// 格式化金额
export function formatAmount(amount: number | undefined | null): string {
  if (amount == null) return '-';
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿';
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  } else {
    return amount.toFixed(2);
  }
}

// 获取涨跌颜色（从主题配置读取）
export function getChangeColor(change: number | undefined | null): string {
  if (change == null) return '#999999';
  if (change > 0) return getColors().riseColor;
  if (change < 0) return getColors().fallColor;
  return '#999999';
}

// 获取涨跌文本
export function getChangeText(change: number | undefined | null): string {
  if (change == null) return '平';
  if (change > 0) return '涨';
  if (change < 0) return '跌';
  return '平';
}

// 格式化涨跌幅
export function formatChangePercent(percent: number | undefined | null): string {
  if (percent == null) return '-';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

// 格式化日期
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
