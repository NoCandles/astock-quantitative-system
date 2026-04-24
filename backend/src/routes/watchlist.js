import express from 'express';
import db from '../db/database.js';
import { getStockQuote } from '../services/stockService.js';

const router = express.Router();

// 获取自选股列表
router.get('/watchlist', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC');
    const watchlist = stmt.all();

    // 获取实时行情
    const quotes = await Promise.all(
      watchlist.map(stock => getStockQuote(stock.symbol))
    );

    const result = watchlist.map((stock, index) => {
      const quote = quotes[index];
      // 如果获取行情失败，保留原数据库数据但价格字段置空
      if (!quote) {
        return {
          ...stock,
          price: null,
          change: null,
          changePercent: null,
          open: null,
          high: null,
          low: null,
          volume: null,
          amount: null
        };
      }
      return { ...stock, ...quote };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取自选股失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取自选股失败', 
      message: error.message 
    });
  }
});

// 添加自选股
router.post('/watchlist', async (req, res) => {
  try {
    const { symbol, name, market } = req.body;

    if (!symbol || !name || !market) {
      return res.status(400).json({ 
        success: false, 
        error: '股票代码、名称和市场不能为空' 
      });
    }

    const stmt = db.prepare(
      'INSERT OR IGNORE INTO watchlist (symbol, name, market) VALUES (?, ?, ?)'
    );
    const result = stmt.run(symbol, name, market);

    if (result.changes > 0) {
      res.json({ success: true, message: '添加成功' });
    } else {
      res.status(409).json({ success: false, error: '股票已在自选列表中' });
    }
  } catch (error) {
    console.error('添加自选股失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '添加失败', 
      message: error.message 
    });
  }
});

// 删除自选股
router.delete('/watchlist/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM watchlist WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes > 0) {
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(404).json({ success: false, error: '股票未找到' });
    }
  } catch (error) {
    console.error('删除自选股失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '删除失败', 
      message: error.message 
    });
  }
});

export default router;
