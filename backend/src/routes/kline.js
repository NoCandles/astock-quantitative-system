import express from 'express';
import { getKlineData } from '../services/stockService.js';

const router = express.Router();

// 获取K线数据
router.get('/kline/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'daily', limit = '100' } = req.query;

    const klineData = await getKlineData(symbol, period, parseInt(limit));

    if (klineData) {
      res.json({ success: true, data: klineData });
    } else {
      res.status(404).json({ success: false, error: 'K线数据未找到' });
    }
  } catch (error) {
    console.error('获取K线数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取K线数据失败', 
      message: error.message 
    });
  }
});

export default router;
