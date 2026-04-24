-- A股量化系统数据库初始化脚本

-- 删除旧数据库（如需重置）
-- DROP DATABASE IF EXISTS astock.db;

-- 创建自选股表
CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  market VARCHAR(10) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建K线缓存表（可选，用于减少API调用）
CREATE TABLE IF NOT EXISTS kline_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol VARCHAR(20) NOT NULL,
  period VARCHAR(20) NOT NULL,
  data TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, period)
);

-- 创建AI分析缓存表
CREATE TABLE IF NOT EXISTS analysis_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据（可选）
INSERT OR IGNORE INTO watchlist (symbol, name, market) VALUES 
  ('600519', '贵州茅台', 'SH'),
  ('000858', '五粮液', 'SZ'),
  ('000001', '平安银行', 'SZ');

-- 查询示例
SELECT * FROM watchlist;

-- 删除示例股票
DELETE FROM watchlist WHERE symbol = '000001';

-- 清空所有自选股
DELETE FROM watchlist;
