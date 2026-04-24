import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initDatabase } from './src/db/database.js';
import stockRoutes from './src/routes/stock.js';
import watchlistRoutes from './src/routes/watchlist.js';
import klineRoutes from './src/routes/kline.js';
import analyzeRoutes from './src/routes/analyze.js';
import backtestRoutes from './src/routes/backtest.js';
import positionsRoutes from './src/routes/positions.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api', stockRoutes);
app.use('/api', watchlistRoutes);
app.use('/api', klineRoutes);
app.use('/api', analyzeRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api', positionsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: '服务器内部错误',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 A股量化系统后端服务运行在 http://localhost:${PORT}`);
  console.log(`📊 API文档: http://localhost:${PORT}/health`);
});
