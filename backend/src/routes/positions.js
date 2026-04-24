import express from 'express';
import db from '../db/database.js';
import { getStockQuote } from '../services/stockService.js';

const router = express.Router();

// 获取所有持仓
router.get('/positions', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM positions ORDER BY created_at DESC');
    const positions = stmt.all();

    // 合并实时行情
    const quotes = await Promise.all(
      positions.map(stock => getStockQuote(stock.symbol))
    );

    const result = positions.map((position, index) => {
      const quote = quotes[index];
      const currentPrice = quote?.price || 0;
      // 盈利 = (当前价 - 买入价) * 股数 (shares是手数，1手=100股)
      const profit = (currentPrice - position.buyPrice) * position.shares * 100;
      const profitPercent = position.buyPrice > 0
        ? ((currentPrice - position.buyPrice) / position.buyPrice) * 100
        : 0;

      return {
        ...position,
        currentPrice,
        change: quote?.change || 0,
        changePercent: quote?.changePercent || 0,
        high: quote?.high || 0,
        low: quote?.low || 0,
        profit,
        profitPercent
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取持仓失败:', error);
    res.status(500).json({
      success: false,
      error: '获取持仓失败',
      message: error.message
    });
  }
});

// 添加/更新持仓
router.post('/positions', async (req, res) => {
  try {
    const { symbol, name, market, buyPrice, shares } = req.body;

    if (!symbol || !name || !market || !buyPrice || !shares) {
      return res.status(400).json({
        success: false,
        error: '所有字段都不能为空'
      });
    }

    if (buyPrice <= 0 || shares <= 0) {
      return res.status(400).json({
        success: false,
        error: '买入价和数量必须大于0'
      });
    }

    // 使用 UPSERT：如果已存在则更新，否则插入
    const stmt = db.prepare(`
      INSERT INTO positions (symbol, name, market, buyPrice, shares)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(symbol) DO UPDATE SET
        buyPrice = excluded.buyPrice,
        shares = excluded.shares
    `);
    stmt.run(symbol, name, market, buyPrice, shares);

    res.json({ success: true, message: '持仓已保存' });
  } catch (error) {
    console.error('保存持仓失败:', error);
    res.status(500).json({
      success: false,
      error: '保存失败',
      message: error.message
    });
  }
});

// 修改持仓
router.put('/positions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { buyPrice, shares } = req.body;

    if (!buyPrice || !shares || buyPrice <= 0 || shares <= 0) {
      return res.status(400).json({
        success: false,
        error: '买入价和数量必须大于0'
      });
    }

    const stmt = db.prepare(`
      UPDATE positions SET buyPrice = ?, shares = ? WHERE id = ?
    `);
    const result = stmt.run(buyPrice, shares, id);

    if (result.changes > 0) {
      res.json({ success: true, message: '持仓已更新' });
    } else {
      res.status(404).json({ success: false, error: '持仓未找到' });
    }
  } catch (error) {
    console.error('修改持仓失败:', error);
    res.status(500).json({
      success: false,
      error: '修改失败',
      message: error.message
    });
  }
});

// 删除持仓
router.delete('/positions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM positions WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes > 0) {
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(404).json({ success: false, error: '持仓未找到' });
    }
  } catch (error) {
    console.error('删除持仓失败:', error);
    res.status(500).json({
      success: false,
      error: '删除失败',
      message: error.message
    });
  }
});

export default router;