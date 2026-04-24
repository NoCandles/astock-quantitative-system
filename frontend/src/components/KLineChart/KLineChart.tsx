import React, { useRef, useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Spin } from 'antd';
import type { KLineData } from '../../types';
import { useThemeStore } from '../../stores/themeStore';

interface KLineChartProps {
  data: KLineData[];
  loading?: boolean;
  period?: string;
}

function calculateMA(klineData: KLineData[], period: number): (string | number)[] {
  const result: (string | number)[] = [];
  for (let i = 0; i < klineData.length; i++) {
    if (i < period - 1) {
      result.push('-');
    } else {
      const sum = klineData
        .slice(i - period + 1, i + 1)
        .reduce((acc, cur) => acc + cur.close, 0);
      result.push(parseFloat((sum / period).toFixed(2)));
    }
  }
  return result;
}

function generateFullTimeline(): string[] {
  const slots: string[] = [];
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  for (let h = 9, m = 30; h < 16 || (h === 15 && m === 0); ) {
    slots.push(`${dateStr} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 5;
    if (h === 11 && m > 30) { h = 13; m = 0; }
    else if (m >= 60) { h++; m = 0; }
    if (h > 15 || (h === 15 && m > 0)) break;
  }
  return slots;
}

function mergeWithTimeline(
  fullTimeline: string[],
  actualData: KLineData[]
): (KLineData | null)[] {
  const map = new Map<string, KLineData>();
  for (const d of actualData) {
    map.set(d.date, d);
  }
  return fullTimeline.map((t) => map.get(t) ?? null);
}

const KLineChart: React.FC<KLineChartProps> = ({ data, loading, period = 'daily' }) => {
  const chartRef = useRef<any>(null);
  const riseColor = useThemeStore((s) => s.colors.riseColor);
  const fallColor = useThemeStore((s) => s.colors.fallColor);
  const mode = useThemeStore((s) => s.mode);
  const isRealtime = period === 'realtime';
  const isDark = mode === 'dark';

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        dates: [],
        candles: [],
        ma5: [],
        ma10: [],
        ma20: [],
        volumes: [],
        lastMa5: null,
        lastMa10: null,
        lastMa20: null,
        lastClose: null,
        closePrices: [],
      };
    }

    if (isRealtime) {
      const fullTimeline = generateFullTimeline();
      const merged = mergeWithTimeline(fullTimeline, data);
      const hasData = merged.filter((d): d is KLineData => d !== null);
      const ma5 = calculateMA(hasData, 5);
      const ma10 = calculateMA(hasData, 10);
      const ma20 = calculateMA(hasData, 20);
      const lastMa5Val = typeof ma5[ma5.length - 1] === 'number' ? ma5[ma5.length - 1] : null;
      const lastMa10Val = typeof ma10[ma10.length - 1] === 'number' ? ma10[ma10.length - 1] : null;
      const lastMa20Val = typeof ma20[ma20.length - 1] === 'number' ? ma20[ma20.length - 1] : null;

      const closePrices: (number | null)[] = merged.map((d) => d?.close ?? null);
      const lastClose = hasData.length > 0 ? hasData[hasData.length - 1].close : null;

      const ma5Full: (string | number)[] = [];
      const ma10Full: (string | number)[] = [];
      const ma20Full: (string | number)[] = [];
      for (let i = 0; i < merged.length; i++) {
        const d = merged[i];
        if (d === null) {
          ma5Full.push('-');
          ma10Full.push('-');
          ma20Full.push('-');
        } else {
          const idx = hasData.indexOf(d);
          ma5Full.push(ma5[idx]);
          ma10Full.push(ma10[idx]);
          ma20Full.push(ma20[idx]);
        }
      }

      return {
        dates: fullTimeline.map((t) => t.slice(11, 16)),
        candles: [],
        ma5: ma5Full,
        ma10: ma10Full,
        ma20: ma20Full,
        volumes: [],
        lastMa5: lastMa5Val,
        lastMa10: lastMa10Val,
        lastMa20: lastMa20Val,
        lastClose,
        closePrices,
      };
    }

    const ma5 = calculateMA(data, 5);
    const ma10 = calculateMA(data, 10);
    const ma20 = calculateMA(data, 20);
    const last = data[data.length - 1];
    const lastMa5Val = typeof ma5[ma5.length - 1] === 'number' ? ma5[ma5.length - 1] : null;
    const lastMa10Val = typeof ma10[ma10.length - 1] === 'number' ? ma10[ma10.length - 1] : null;
    const lastMa20Val = typeof ma20[ma20.length - 1] === 'number' ? ma20[ma20.length - 1] : null;
    return {
      dates: data.map((d) => d.date),
      candles: data.map((d) => [d.open, d.close, d.low, d.high]),
      ma5,
      ma10,
      ma20,
      volumes: data.map((d) => ({
        value: d.volume,
        itemStyle: { color: d.close >= d.open ? riseColor : fallColor },
      })),
      lastMa5: lastMa5Val,
      lastMa10: lastMa10Val,
      lastMa20: lastMa20Val,
      lastClose: last.close,
      closePrices: data.map((d) => d.close),
    };
  }, [data, riseColor, fallColor, isRealtime]);

  const option = useMemo(() => {
    const baseTooltip = {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'cross' as const,
        lineStyle: { color: 'rgba(99, 102, 241, 0.5)' },
        crossStyle: { color: 'rgba(99, 102, 241, 0.5)' },
      },
      backgroundColor: isDark ? 'rgba(15, 15, 35, 0.95)' : 'rgba(255, 255, 255, 0.98)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)',
      borderWidth: 1,
      textStyle: { color: isDark ? '#fff' : '#1a1a2e', fontSize: 12 },
    };

    if (isRealtime) {
      const themeTextColor = isDark ? '#fff' : '#1a1a2e';
      const themeSecondaryText = isDark ? '#a1a1aa' : '#4a4a6a';
      const themeAxisLineColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      const themeSplitLineColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      const themeSplitAreaColor = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
      const themeBgColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
      const tooltipBg = isDark ? 'rgba(30, 30, 50, 0.98)' : 'rgba(255, 255, 255, 0.98)';
      const tooltipBorder = isDark ? riseColor : '#6366f1';
      
      return {
        backgroundColor: 'transparent',
        tooltip: { 
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            lineStyle: { color: riseColor, width: 2, type: 'solid' },
            animation: true,
          },
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: { color: themeTextColor, fontSize: 12 },
          extraCssText: `box-shadow: 0 4px 20px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}; backdrop-filter: blur(10px);`,
          formatter: (params: any) => {
            if (!params || params.length === 0) return '';
            const dataIndex = params[0]?.dataIndex;
            if (dataIndex === undefined) return '';
            
            const price = params.find((p: any) => p.seriesName === '收盘价')?.value;
            const ma5 = params.find((p: any) => p.seriesName === 'MA5')?.value;
            const ma10 = params.find((p: any) => p.seriesName === 'MA10')?.value;
            const ma20 = params.find((p: any) => p.seriesName === 'MA20')?.value;
            const time = chartData.dates[dataIndex];
            
            if (!time || price === undefined || price === null || price === '-') return '';
            
            return `
              <div style="padding: 4px 0;">
                <div style="font-weight: 600; margin-bottom: 10px; color: ${themeTextColor}; font-size: 14px;">⏰ ${time}</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: ${themeSecondaryText};">💰 当前价</span>
                    <span style="color: ${riseColor}; font-weight: 700; font-size: 16px;">${price}</span>
                  </div>
                  ${ma5 && ma5 !== '-' ? `
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #f59e0b;">📈 MA5</span>
                    <span style="color: ${themeTextColor};">${ma5}</span>
                  </div>
                  ` : ''}
                  ${ma10 && ma10 !== '-' ? `
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #3b82f6;">📈 MA10</span>
                    <span style="color: ${themeTextColor};">${ma10}</span>
                  </div>
                  ` : ''}
                  ${ma20 && ma20 !== '-' ? `
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #8b5cf6;">📈 MA20</span>
                    <span style="color: ${themeTextColor};">${ma20}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
            `;
          },
        },
        legend: {
          data: ['收盘价', 'MA5', 'MA10', 'MA20'],
          top: 10,
          textStyle: { color: themeTextColor },
          inactiveColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
        },
        grid: [
          { left: '10%', right: '8%', top: '15%', height: '70%' },
        ],
        xAxis: [
          {
            type: 'category',
            data: chartData.dates,
            gridIndex: 0,
            boundaryGap: false,
            axisLabel: {
              show: true,
              fontSize: 10,
              color: themeTextColor,
              interval: 'auto',
              formatter: (value: string) => {
                const time = value.slice(11, 16);
                const [h, m] = time.split(':').map(Number);
                if (m === 30 && (h === 10 || h === 11 || h === 13 || h === 14)) {
                  return time;
                }
                return m === 0 ? time : '';
              },
            },
            axisLine: { lineStyle: { color: themeAxisLineColor } },
            splitLine: { show: false },
            axisTick: { show: true, lineStyle: { color: themeAxisLineColor } },
          },
        ],
        yAxis: [
          {
            type: 'value',
            gridIndex: 0,
            scale: true,
            splitArea: {
              show: true,
              areaStyle: { color: [themeSplitAreaColor, 'transparent'] },
            },
            axisLabel: { 
              fontSize: 10, 
              color: themeTextColor,
              formatter: (value: number) => value.toFixed(2),
            },
            axisLine: { lineStyle: { color: themeAxisLineColor } },
            splitLine: { lineStyle: { color: themeSplitLineColor } },
          },
        ],
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: [0],
            start: 70,
            end: 100,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
          },
          {
            type: 'slider',
            xAxisIndex: [0],
            start: 70,
            end: 100,
            height: 20,
            bottom: 10,
            borderColor: 'transparent',
            backgroundColor: themeBgColor,
            dataBackground: {
              lineStyle: { color: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.5)' },
              areaStyle: { color: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)' },
            },
            selectedDataBackground: {
              lineStyle: { color: '#6366f1' },
              areaStyle: { color: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)' },
            },
            fillerColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)',
            handleStyle: { color: '#6366f1', borderColor: '#6366f1' },
            textStyle: { color: themeTextColor },
          },
        ],
        series: [
          {
            name: '收盘价',
            type: 'line',
            data: chartData.closePrices,
            xAxisIndex: 0,
            yAxisIndex: 0,
            smooth: 0.3,
            connectNulls: false,
            lineStyle: { width: 2.5, color: riseColor },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
                  { offset: 0.5, color: 'rgba(99, 102, 241, 0.1)' },
                  { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
                ],
              },
            },
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { 
              color: riseColor, 
              borderColor: isDark ? '#fff' : '#fff', 
              borderWidth: 1.5,
              shadowBlur: 3,
              shadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'
            },
            showSymbol: false,
            emphasis: {
              scale: true,
              focus: 'series',
              itemStyle: { 
                color: riseColor, 
                borderColor: isDark ? '#fff' : '#fff', 
                borderWidth: 2, 
                shadowBlur: 8,
                shadowColor: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)'
              },
            },
          },
          {
            name: 'MA5',
            type: 'line',
            data: chartData.ma5,
            xAxisIndex: 0,
            yAxisIndex: 0,
            smooth: 0.3,
            connectNulls: false,
            lineStyle: { width: 1.5, color: '#f59e0b', type: 'solid' },
            symbol: 'none',
            emphasis: { lineStyle: { width: 2 } },
          },
          {
            name: 'MA10',
            type: 'line',
            data: chartData.ma10,
            xAxisIndex: 0,
            yAxisIndex: 0,
            smooth: 0.3,
            connectNulls: false,
            lineStyle: { width: 1.5, color: '#3b82f6', type: 'solid' },
            symbol: 'none',
            emphasis: { lineStyle: { width: 2 } },
          },
          {
            name: 'MA20',
            type: 'line',
            data: chartData.ma20,
            xAxisIndex: 0,
            yAxisIndex: 0,
            smooth: 0.3,
            connectNulls: false,
            lineStyle: { width: 1.5, color: '#8b5cf6', type: 'solid' },
            symbol: 'none',
            emphasis: { lineStyle: { width: 2 } },
          },
        ],
      };
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        ...baseTooltip,
        formatter: (params: any) => {
          const candle = params.find((p: any) => p.seriesName === 'K线');
          if (!candle || !candle.data) return '';
          
          let open, close, low, high;
          if (Array.isArray(candle.data)) {
            [open, close, low, high] = candle.data;
          } else if (typeof candle.data === 'object') {
            open = candle.data.open;
            close = candle.data.close;
            low = candle.data.low;
            high = candle.data.high;
          } else {
            return '';
          }
          
          if (open === undefined || close === undefined || low === undefined || high === undefined) {
            return '';
          }
          
          const date = candle.axisValue;
          const change = open !== 0 ? ((close - open) / open * 100).toFixed(2) : '0.00';
          const isUp = close >= open;
          const changeColor = isUp ? riseColor : fallColor;
          const themeTextColor = isDark ? '#fff' : '#1a1a2e';
          const themeSecondaryText = isDark ? '#a1a1aa' : '#4a4a6a';
          const ma5v = params.find((p: any) => p.seriesName === 'MA5')?.value ?? '-';
          const ma10v = params.find((p: any) => p.seriesName === 'MA10')?.value ?? '-';
          const ma20v = params.find((p: any) => p.seriesName === 'MA20')?.value ?? '-';
          return `
            <div style="padding: 8px 12px; min-width: 180px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${themeTextColor};">${date}</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; font-size: 12px;">
                <span style="color: ${themeSecondaryText};">收盘</span><span style="color: ${changeColor};">${close.toFixed(2)}</span>
                <span style="color: ${themeSecondaryText};">最高</span><span style="color: ${themeTextColor};">${high.toFixed(2)}</span>
                <span style="color: ${themeSecondaryText};">最低</span><span style="color: ${themeTextColor};">${low.toFixed(2)}</span>
                <span style="color: ${themeSecondaryText};">涨跌</span><span style="color: ${changeColor};">${change}%</span>
                <span style="color: ${themeSecondaryText};"></span><span style="color: ${themeSecondaryText};"></span>
                <span style="color: #f59e0b;">MA5</span><span style="color: ${themeTextColor};">${typeof ma5v === 'number' ? ma5v.toFixed(2) : ma5v}</span>
                <span style="color: #3b82f6;">MA10</span><span style="color: ${themeTextColor};">${typeof ma10v === 'number' ? ma10v.toFixed(2) : ma10v}</span>
                <span style="color: #8b5cf6;">MA20</span><span style="color: ${themeTextColor};">${typeof ma20v === 'number' ? ma20v.toFixed(2) : ma20v}</span>
              </div>
            </div>
          `;
        },
      },
      legend: {
        data: ['K线', 'MA5', 'MA10', 'MA20'],
        top: 10,
        textStyle: { color: isDark ? '#fff' : '#1a1a2e' },
        inactiveColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
      },
      grid: [
        { left: '10%', right: '8%', top: '15%', height: '55%' },
        { left: '10%', right: '8%', top: '75%', height: '15%' },
      ],
      xAxis: [
        {
          type: 'category',
          data: chartData.dates,
          gridIndex: 0,
          boundaryGap: false,
          axisLabel: {
            show: true,
            fontSize: 10,
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
            interval: 0,
            formatter: (value: string) => value.slice(11, 16),
          },
          axisLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' } },
          splitLine: { show: false },
        },
        {
          type: 'category',
          data: chartData.dates,
          gridIndex: 1,
          boundaryGap: false,
          axisLabel: {
            fontSize: 10,
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
            interval: 0,
            formatter: (value: string) => value.slice(11, 16),
          },
          axisLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' } },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          type: 'value',
          gridIndex: 0,
          scale: true,
          splitArea: {
            show: true,
            areaStyle: { color: [isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', 'transparent'] },
          },
          axisLabel: { fontSize: 10, color: isDark ? '#fff' : '#1a1a2e' },
          axisLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' } },
          splitLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' } },
        },
        {
          type: 'value',
          gridIndex: 1,
          scale: true,
          axisLabel: { fontSize: 10, color: isDark ? '#fff' : '#1a1a2e' },
          axisLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' } },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
        },
        {
          type: 'slider',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100,
          height: 20,
          bottom: 10,
          borderColor: 'transparent',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          dataBackground: {
            lineStyle: { color: 'rgba(99, 102, 241, 0.3)' },
            areaStyle: { color: 'rgba(99, 102, 241, 0.1)' },
          },
          selectedDataBackground: {
            lineStyle: { color: '#6366f1' },
            areaStyle: { color: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)' },
          },
          fillerColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)',
          handleStyle: { color: '#6366f1', borderColor: '#6366f1' },
          textStyle: { color: isDark ? '#fff' : '#1a1a2e' },
        },
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: chartData.candles,
          xAxisIndex: 0,
          yAxisIndex: 0,
          barWidth: '60%',
          itemStyle: {
            color: riseColor,
            color0: fallColor,
            borderColor: riseColor,
            borderColor0: fallColor,
          },
        },
        {
          name: 'MA5',
          type: 'line',
          data: chartData.ma5,
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { width: 1.5, color: '#f59e0b' },
          symbol: 'none',
        },
        {
          name: 'MA10',
          type: 'line',
          data: chartData.ma10,
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { width: 1.5, color: '#3b82f6' },
          symbol: 'none',
        },
        {
          name: 'MA20',
          type: 'line',
          data: chartData.ma20,
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { width: 1.5, color: '#8b5cf6' },
          symbol: 'none',
        },
        {
          name: '成交量',
          type: 'bar',
          data: chartData.volumes,
          xAxisIndex: 1,
          yAxisIndex: 1,
          barWidth: '60%',
        },
      ],
    };
  }, [chartData, riseColor, fallColor, isRealtime, isDark]);

  // When chart is ready, set the full option
  const handleChartReady = (chart: any) => {
    chart.setOption(option, { notMerge: false, lazyUpdate: true });
  };

  // Update chart when option changes (data or period changes)
  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;
    chart.setOption(option, { notMerge: false, lazyUpdate: true });
  }, [option]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full border rounded-2xl h-96" style={{
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
      }}>
        <Spin />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full border rounded-2xl h-96" style={{
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
      }}>
        <div className="text-sm" style={{ color: isDark ? '#a1a1aa' : '#4a4a6a' }}>暂无数据</div>
      </div>
    );
  }

  return (
    <div className="kline-container">
      {chartData.lastClose != null && (
        <div className="flex items-center gap-6 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: isDark ? '#a1a1aa' : '#4a4a6a' }}>收盘</span>
            <span className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>{chartData.lastClose.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f59e0b22', color: '#f59e0b' }}>MA5</span>
            <span className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>{chartData.lastMa5 != null ? (chartData.lastMa5 as number).toFixed(2) : '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#3b82f622', color: '#3b82f6' }}>MA10</span>
            <span className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>{chartData.lastMa10 != null ? (chartData.lastMa10 as number).toFixed(2) : '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#8b5cf622', color: '#8b5cf6' }}>MA20</span>
            <span className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#1a1a2e' }}>{chartData.lastMa20 != null ? (chartData.lastMa20 as number).toFixed(2) : '-'}</span>
          </div>
        </div>
      )}
      <ReactECharts
        ref={chartRef}
        option={{}}
        style={{ height: 500, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        onChartReady={handleChartReady}
        lazyUpdate={true}
        onEvents={{}}
      />
    </div>
  );
};

export default KLineChart;
