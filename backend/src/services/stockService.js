import axios from 'axios';
import iconv from 'iconv-lite';
import http from 'http';

const TENCENT_BASE_URL = 'http://qt.gtimg.cn/q';
const SEARCH_URL = 'http://searchapi.eastmoney.com/api/suggest/get';

// 获取股票实时行情（使用腾讯财经API）
export async function getStockQuote(symbol) {
  return new Promise((resolve, reject) => {
    // 6开头是上海(sh)，0开头是深圳(sz)
    const marketPrefix = symbol.startsWith('6') ? 'sh' : 'sz';
    const url = `${TENCENT_BASE_URL}=${marketPrefix}${symbol}`;
    console.log(`[stockService] 请求URL: ${url}`);

    http.get(url, {
      headers: {
        'Referer': 'http://gu.qq.com',
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const text = iconv.decode(buffer, 'gbk');

          const match = text.match(/="([^"]+)"/);
          if (!match || !match[1]) {
            console.error(`获取股票 ${symbol} 行情失败: 无法解析数据`);
            return resolve(null);
          }

          const parts = match[1].split('~');

          const price = parseFloat(parts[3]) || 0;
          const closeYesterday = parseFloat(parts[4]) || 0;
          const open = parseFloat(parts[5]) || 0;
          const volume = parseInt(parts[6]) || 0;
          const high = parseFloat(parts[33]) || 0;
          const low = parseFloat(parts[34]) || 0;
          const bid1 = parseFloat(parts[9]) || 0;
          const ask1 = parseFloat(parts[19]) || 0;
          const amount = parseFloat(parts[37]) || 0;

          const change = price - closeYesterday;
          const changePercent = closeYesterday ? (change / closeYesterday) * 100 : 0;

          resolve({
            symbol: symbol,
            name: parts[1],
            price,
            change,
            changePercent,
            open,
            high,
            low,
            close: price,
            volume,
            amount,
            bid1,
            ask1,
            market: symbol.startsWith('6') ? 'SH' : 'SZ'
          });
        } catch (error) {
          console.error(`获取股票 ${symbol} 行情失败:`, error.message);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.error(`获取股票 ${symbol} 行情失败:`, error.message);
      resolve(null);
    });
  });
}

// 批量获取股票行情
export async function getBatchQuotes(symbols) {
  const results = await Promise.all(
    symbols.map(symbol => getStockQuote(symbol))
  );
  return results.filter(Boolean);
}

// 搜索股票
export async function searchStocks(query) {
  try {
    const response = await axios.get(SEARCH_URL, {
      params: {
        input: query,
        type: '14',
        token: 'D43BF722C8E33BDC906FB84D85E326E8C',
        markettype: '',
        mystock: ''
      },
      timeout: 5000
    });

    if (response.data.QuotationCodeTable && response.data.QuotationCodeTable.Data) {
      return response.data.QuotationCodeTable.Data.map(item => ({
        symbol: item.Code,
        name: item.Name,
        market: item.Market === 1 ? 'SH' : 'SZ',
        type: item.Type
      })).filter(item => item.type === '14' || item.symbol.startsWith('6') || item.symbol.startsWith('0'));
    }
    return [];
  } catch (error) {
    console.error('搜索股票失败:', error.message);
    return [];
  }
}

// 获取K线数据
export async function getKlineData(symbol, period = 'daily', limit = 100) {
  try {
    const market = symbol.startsWith('6') ? 'sh' : 'sz';

    // realtime: 当天分时K线，从腾讯分时接口获取每分钟数据，聚合为5分钟K线
    if (period === 'realtime') {
      const url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?_var=min_data_${symbol}&code=${market}${symbol}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://gu.qq.com',
          'Accept': '*/*'
        },
        timeout: 8000
      });

      const text = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);
      const json = JSON.parse(text.replace(/^[^=]+=/, '').trim());

      const stockKey = `${market}${symbol}`;
      const stockData = json.data?.[stockKey]?.data?.data;

      if (!stockData || !Array.isArray(stockData)) return null;

      // 解析分时数据: "HHMM price volume amount"
      // 格式: 每分钟一条 ["0930 1408.00 515 72512000.00", ...]
      const today = new Date();
      const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const intervalMinutes = 5; // 5分钟K线
      const intervals = new Map();

      for (const line of stockData) {
        const parts = String(line).trim().split(/\s+/);
        if (parts.length < 2) continue;
        const timeStr = parts[0]; // "0930"
        const price = parseFloat(parts[1]);
        const volume = parseInt(parts[2]) || 0;

        const hour = parseInt(timeStr.slice(0, 2));
        const minute = parseInt(timeStr.slice(2, 4));
        const totalMins = hour * 60 + minute;
        // 计算5分钟区间起始
        const intervalKey = Math.floor(totalMins / intervalMinutes) * intervalMinutes;
        const ih = Math.floor(intervalKey / 60);
        const im = intervalKey % 60;
        const dateKey = `${todayDateStr} ${String(ih).padStart(2, '0')}:${String(im).padStart(2, '0')}`;

        if (!intervals.has(dateKey)) {
          intervals.set(dateKey, { open: price, high: price, low: price, close: price, volume: 0, count: 0 });
        }
        const iv = intervals.get(dateKey);
        iv.high = Math.max(iv.high, price);
        iv.low = Math.min(iv.low, price);
        iv.close = price;
        iv.volume += volume;
        iv.count++;
      }

      const klines = Array.from(intervals.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, iv]) => ({
          date,
          open: parseFloat(iv.open.toFixed(2)),
          close: parseFloat(iv.close.toFixed(2)),
          high: parseFloat(iv.high.toFixed(2)),
          low: parseFloat(iv.low.toFixed(2)),
          volume: iv.volume,
        }));

      return { symbol, name: symbol, period: 'realtime', data: klines };
    }

    // 周期映射
    const periodParam = {
      'daily': 'day',
      'weekly': 'week',
      'monthly': 'month',
      'yearly': 'year'
    };

    const periodKey = periodParam[period] || 'day';
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_${periodKey}qfq&param=${market}${symbol},${periodKey},,,${limit},qfq&r=0.${Date.now()}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://gu.qq.com',
        'Accept': '*/*'
      },
      timeout: 8000
    });

    // 解析返回的数据（去除变量赋值前缀）
    const text = typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data);
    
    const jsonStr = text.replace(/^[^=]+=/, '').trim();
    const data = JSON.parse(jsonStr);

    if (data.code === 0 && data.data && data.data[`${market}${symbol}`]) {
      const stockData = data.data[`${market}${symbol}`];
      
      // 获取前复权日K线数据
      const klines = (stockData.qfqday || stockData.day || []).map(line => {
        const [date, open, close, high, low, volume, ...rest] = line;
        return {
          date,
          open: parseFloat(open),
          close: parseFloat(close),
          high: parseFloat(high),
          low: parseFloat(low),
          volume: parseInt(volume),
          amount: rest[0] ? parseFloat(rest[0]) : 0
        };
      });

      // 从qt字段获取股票名称
      let stockName = symbol;
      if (stockData.qt && stockData.qt[`${market}${symbol}`]) {
        const qtData = stockData.qt[`${market}${symbol}`];
        stockName = qtData[1] || symbol; // qt数据格式: [index, name, code, ...]
      }

      return {
        symbol: symbol,
        name: stockName,
        period: period,
        data: klines
      };
    }
    
    return null;
  } catch (error) {
    console.error(`获取K线数据 ${symbol} 失败:`, error.message);
    return null;
  }
}
