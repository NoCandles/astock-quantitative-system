import express from 'express';
import { getStockQuote, getKlineData } from '../services/stockService.js';
import { searchStocks } from '../services/stockService.js';
import { analyzeStockWithMinimax } from '../ai/minimaxService.js';
import { analyzeStock } from '../ai/claudeService.js';
import { analyzeStockWithDeepSeek } from '../ai/deepseekOpenaiService.js';

const router = express.Router();

// AI股票诊断 — 支持股票代码或名称
router.post('/analyze', async (req, res) => {
  try {
    let { stockInput, symbol, apiKey, provider } = req.body;

    // 如果只传了 stockInput，通过名称搜索找到股票代码
    if (stockInput && !symbol) {
      const results = await searchStocks(stockInput);
      if (results.length === 0) {
        return res.status(404).json({ success: false, error: `未找到股票：${stockInput}` });
      }
      // 取搜索结果的第一个
      symbol = results[0].symbol;
    }

    if (!symbol) {
      return res.status(400).json({ success: false, error: '请提供股票代码或名称' });
    }

    // 获取股票信息和K线数据
    const [quote, klineDaily] = await Promise.all([
      getStockQuote(symbol),
      getKlineData(symbol, 'daily', 30),
    ]);

    if (!quote) {
      return res.status(404).json({ success: false, error: '股票未找到' });
    }

    // 计算技术指标
    const technicalIndicators = calculateTechnicalIndicators(klineDaily?.data || []);

    // 根据请求参数或环境变量选择 AI Provider
    // 优先级：1. 请求参数 provider  2. 环境变量 AI_PROVIDER  3. 默认 minimax
    const aiProviderFromRequest = provider;
    const aiProviderFromEnv = process.env.AI_PROVIDER;
    const aiProvider = aiProviderFromRequest || aiProviderFromEnv || 'minimax';
    
    // 修复：如果环境变量是 URL，提取 provider 名称
    let finalProvider = aiProvider;
    if (aiProvider.includes('deepseek')) {
      finalProvider = 'deepseek';
    } else if (aiProvider.includes('anthropic') || aiProvider.includes('claude')) {
      finalProvider = 'claude';
    } else if (aiProvider.includes('minimax')) {
      finalProvider = 'minimax';
    }

    console.log('='.repeat(60));
    console.log('AI Provider 选择逻辑:');
    console.log('- 请求参数 provider:', aiProviderFromRequest || '(未指定)');
    console.log('- 环境变量 AI_PROVIDER:', aiProviderFromEnv || '(未配置)');
    console.log('- 最终选择的 Provider:', finalProvider);
    console.log('='.repeat(60));

    let analysis;
    if (finalProvider === 'claude') {
      console.log('→ 使用 Claude AI 服务');
      analysis = await analyzeStock({
        symbol: quote.symbol,
        name: quote.name,
        quote: quote,
        klineDaily: klineDaily?.data || [],
        technicalIndicators,
      }, apiKey);
    } else if (finalProvider === 'deepseek') {
      console.log('→ 使用 DeepSeek AI 服务');
      analysis = await analyzeStockWithDeepSeek({
        symbol: quote.symbol,
        name: quote.name,
        quote: quote,
        klineDaily: klineDaily?.data || [],
        technicalIndicators,
      }, apiKey);
    } else {
      console.log('→ 使用 MiniMax AI 服务 (默认)');
      analysis = await analyzeStockWithMinimax({
        symbol: quote.symbol,
        name: quote.name,
        quote: quote,
        klineDaily: klineDaily?.data || [],
        technicalIndicators,
      }, apiKey);
    }

    res.json({
      success: true,
      data: {
        symbol: quote.symbol,
        name: quote.name,
        quote: quote,
        technicalIndicators,
        analysis,
        timestamp: new Date().toISOString(),
        provider: finalProvider,
      },
    });
  } catch (error) {
    console.error('AI诊断失败:', error);
    res.status(500).json({
      success: false,
      error: 'AI诊断失败',
      message: error.message,
    });
  }
});

// 兼容旧版路径 /analyze/:symbol
router.post('/analyze/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { apiKey, provider } = req.body;

    const [quote, klineDaily] = await Promise.all([
      getStockQuote(symbol),
      getKlineData(symbol, 'daily', 30),
    ]);

    if (!quote) {
      return res.status(404).json({ success: false, error: '股票未找到' });
    }

    const technicalIndicators = calculateTechnicalIndicators(klineDaily?.data || []);
    const aiProviderFromRequest = provider;
    const aiProviderFromEnv = process.env.AI_PROVIDER;
    const aiProvider = aiProviderFromRequest || aiProviderFromEnv || 'minimax';
    
    let finalProvider = aiProvider;
    if (aiProvider.includes('deepseek')) {
      finalProvider = 'deepseek';
    } else if (aiProvider.includes('anthropic') || aiProvider.includes('claude')) {
      finalProvider = 'claude';
    } else if (aiProvider.includes('minimax')) {
      finalProvider = 'minimax';
    }

    console.log('='.repeat(60));
    console.log('AI Provider 选择逻辑 (旧版路由):');
    console.log('- 请求参数 provider:', aiProviderFromRequest || '(未指定)');
    console.log('- 环境变量 AI_PROVIDER:', aiProviderFromEnv || '(未配置)');
    console.log('- 最终选择的 Provider:', finalProvider);
    console.log('='.repeat(60));

    let analysis;
    if (finalProvider === 'claude') {
      console.log('→ 使用 Claude AI 服务');
      analysis = await analyzeStock({
        symbol: quote.symbol,
        name: quote.name,
        quote: quote,
        klineDaily: klineDaily?.data || [],
        technicalIndicators,
      }, apiKey);
    } else if (finalProvider === 'deepseek') {
      console.log('→ 使用 DeepSeek AI 服务');
      analysis = await analyzeStockWithDeepSeek({
        symbol: quote.symbol,
        name: quote.name,
        quote: quote,
        klineDaily: klineDaily?.data || [],
        technicalIndicators,
      }, apiKey);
    } else {
      console.log('→ 使用 MiniMax AI 服务 (默认)');
      analysis = await analyzeStockWithMinimax({
        symbol: quote.symbol,
        name: quote.name,
        quote: quote,
        klineDaily: klineDaily?.data || [],
        technicalIndicators,
      }, apiKey);
    }

    res.json({
      success: true,
      data: {
        symbol: quote.symbol,
        name: quote.name,
        quote: quote,
        technicalIndicators,
        analysis,
        timestamp: new Date().toISOString(),
        provider: finalProvider,
      },
    });
  } catch (error) {
    console.error('AI诊断失败:', error);
    res.status(500).json({
      success: false,
      error: 'AI诊断失败',
      message: error.message,
    });
  }
});

function calculateTechnicalIndicators(klineData) {
  if (!klineData || klineData.length === 0) {
    return null;
  }

  const closes = klineData.map((k) => k.close);

  const ma = (period) => {
    if (closes.length < period) return null;
    const sum = closes.slice(-period).reduce((a, b) => a + b, 0);
    return (sum / period).toFixed(2);
  };

  const calculateRSI = (period = 14) => {
    if (closes.length < period + 1) return null;
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return (100 - 100 / (1 + rs)).toFixed(2);
  };

  const latest = klineData[klineData.length - 1];
  const prevClose = klineData.length > 1 ? klineData[klineData.length - 2].close : latest.close;

  return {
    ma5: ma(5),
    ma10: ma(10),
    ma20: ma(20),
    ma60: ma(60),
    rsi: calculateRSI(14),
    latestPrice: latest.close,
    priceChange: ((latest.close - prevClose) / prevClose * 100).toFixed(2),
    high20: Math.max(...klineData.slice(-20).map((k) => k.high)),
    low20: Math.min(...klineData.slice(-20).map((k) => k.low)),
    volume20Avg: (klineData.slice(-20).reduce((sum, k) => sum + k.volume, 0) / 20).toFixed(0),
  };
}

export default router;
