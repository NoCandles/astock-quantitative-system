import express from 'express';
import { getStockQuote, searchStocks, getBatchQuotes } from '../services/stockService.js';

const router = express.Router();

// 搜索股票
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: false, error: '搜索关键词不能为空' });
    }

    const results = await searchStocks(q);
    res.json({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    console.error('搜索股票失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '搜索失败', 
      message: error.message 
    });
  }
});

// 获取单个股票行情
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await getStockQuote(symbol);
    
    if (quote) {
      res.json({ success: true, data: quote });
    } else {
      res.status(404).json({ success: false, error: '股票未找到' });
    }
  } catch (error) {
    console.error('获取行情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取行情失败', 
      message: error.message 
    });
  }
});

// 批量获取股票行情
router.get('/quotes/batch', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.json({ success: false, error: '股票代码不能为空' });
    }

    const symbolList = symbols.split(',');
    const quotes = await getBatchQuotes(symbolList);
    res.json({ success: true, data: quotes });
  } catch (error) {
    console.error('批量获取行情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '批量获取行情失败', 
      message: error.message 
    });
  }
});

export default router;
