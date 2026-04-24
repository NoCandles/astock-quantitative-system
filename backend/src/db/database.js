import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/astock.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

export function initDatabase() {
  // Create watchlist table
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      market VARCHAR(10) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create kline cache table
  db.exec(`
    CREATE TABLE IF NOT EXISTS kline_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol VARCHAR(20) NOT NULL,
      period VARCHAR(20) NOT NULL,
      data TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(symbol, period)
    )
  `);

  // Create analysis cache table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol VARCHAR(20) UNIQUE NOT NULL,
      analysis TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create positions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      market VARCHAR(10) NOT NULL,
      buyPrice REAL NOT NULL,
      shares INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ 数据库初始化成功');
}

export default db;
