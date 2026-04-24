# A股量化系统

基于 Web 的 A股量化交易辅助系统，提供股票搜索、实时行情、K线分析、AI 智能诊断、回测和持仓管理功能。

## 功能特性

- 📈 **股票搜索与自选** - 支持按代码、名称搜索，添加/删除自选股
- 💹 **实时行情** - 显示实时价格、涨跌幅、成交量、成交额等
- 📊 **K线图表** - 支持多种周期（实时、日线、周线、月线、年线），显示MA5/MA10/MA20均线
- 🤖 **AI 智能诊断** - 基于技术指标，AI 智能分析股票走势和风险提示
- 📉 **回测功能** - 支持多种策略回测，评估交易策略效果
- 💼 **持仓管理** - 管理模拟持仓，计算盈亏情况
- 🎨 **现代化界面** - React + Ant Design，支持深色/浅色主题
- 🔧 **自定义配色** - 支持自定义涨跌颜色主题

## 快速开始

### Windows 用户（推荐）

双击运行 `start.bat` 文件，系统会自动：
1. 安装后端依赖
2. 安装前端依赖
3. 启动后端服务（http://localhost:5000）
4. 启动前端服务（http://localhost:3000）
5. 自动打开浏览器访问

### 手动启动

#### 1. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key
```

#### 2. 启动后端

```bash
npm install
npm start
```

#### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

#### 4. 访问系统

打开浏览器访问：http://localhost:3000

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- React Router v6
- Zustand (状态管理)
- ECharts 5 (图表)
- Ant Design 5
- Tailwind CSS

### 后端
- Node.js + Express
- SQLite3 (better-sqlite3)
- 东方财富 API (数据源)
- AI API (DeepSeek / MiniMax / Claude)

## 项目结构

```
astock-quantitative-system/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── components/          # React 组件
│   │   │   ├── KLineChart/      # K线图组件
│   │   │   ├── StockCard/       # 股票卡片组件
│   │   │   ├── StockSearch/     # 股票搜索组件
│   │   │   └── StockAnalysis/   # AI分析组件
│   │   ├── pages/               # 页面组件
│   │   │   ├── DashboardPage.tsx     # 首页/仪表盘
│   │   │   ├── WatchlistPage.tsx     # 自选股页面
│   │   │   ├── StockDetailPage.tsx   # 股票详情页
│   │   │   └── BacktestPage.tsx      # 回测页面
│   │   ├── stores/              # Zustand 状态管理
│   │   │   ├── themeStore.ts    # 主题状态
│   │   │   ├── stockStore.ts    # 股票数据状态
│   │   │   ├── watchlistStore.ts # 自选股状态
│   │   │   └── positionsStore.ts # 持仓状态
│   │   ├── services/            # API 服务
│   │   ├── types/               # TypeScript 类型
│   │   └── utils/               # 工具函数
│   └── package.json
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── routes/              # API 路由
│   │   │   ├── stock.js         # 股票搜索和行情API
│   │   │   ├── kline.js         # K线数据API
│   │   │   ├── watchlist.js     # 自选股管理API
│   │   │   ├── analyze.js       # AI分析API
│   │   │   ├── backtest.js      # 回测API
│   │   │   └── positions.js    # 持仓管理API
│   │   ├── services/            # 业务逻辑
│   │   │   └── stockService.js  # 股票数据服务
│   │   ├── ai/                  # AI 服务
│   │   │   ├── claudeService.js
│   │   │   ├── deepseekService.js
│   │   │   └── minimaxService.js
│   │   └── db/                  # 数据库
│   │       ├── database.js      # 数据库初始化
│   │       └── init.sql         # 数据库表结构
│   ├── .env.example             # 环境变量模板
│   └── server.js                # Express 服务器入口
│
├── start.bat                    # Windows 启动脚本
└── README.md
```

## 环境配置

后端使用 `.env.example` 文件管理配置，首次使用需复制为 `.env` 并填入 API Key：

```env
# 服务器端口
PORT=5000

# AI 提供商 (deepseek / minimax / claude)
AI_PROVIDER=deepseek

# DeepSeek API（推荐）
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro

# MiniMax API
MINIMAX_API_KEY=your_api_key
MINIMAX_BASE_URL=https://platform.minimaxi.com

# Claude API
CLAUDE_API_KEY=your_api_key
CLAUDE_MODEL=claude-sonnet-4-20250514

# AI 通用配置
AI_MAX_TOKENS=2048
AI_TIMEOUT=60000
```

## 使用指南

### 1. 添加自选股票

1. 点击顶部菜单的"自选股"
2. 在搜索框中输入股票代码或名称（如：600519 或 贵州茅台）
3. 从下拉列表中选择股票
4. 点击"添加"按钮

### 2. 查看股票详情

1. 在自选列表中点击股票卡片
2. 查看实时行情、K线图表
3. 使用不同周期的K线（实时、日线、周线、月线等）

### 3. K线图功能

- **实时模式**：显示当天分时K线，每5分钟一个数据点
- **日线/周线/月线/年线**：查看不同周期的历史K线
- **移动平均线**：显示MA5、MA10、MA20指标
- **数据缩放**：支持鼠标滚轮缩放和拖动查看

### 4. AI 智能诊断

1. 在股票详情页点击"AI诊断"标签
2. 系统会自动分析股票的技术指标
3. 查看AI给出的诊断建议和风险提示

### 5. 回测功能

1. 点击导航栏"回测"进入回测页面
2. 选择股票和时间周期
3. 配置策略参数（如均线交叉策略）
4. 点击"开始回测"运行回测
5. 查看回测结果，包括收益率、最大回撤等指标

### 6. 持仓管理

1. 在股票详情页点击"买入"添加持仓
2. 设置买入数量和价格
3. 在持仓页面查看当前持仓和盈亏情况
4. 支持卖出操作和平仓

### 7. 主题设置

1. 点击首页右上角设置图标
2. 选择深色/浅色主题模式
3. 自定义涨跌颜色配色方案

## API 接口

系统提供以下 RESTful API 接口：

### 股票搜索
```
GET /api/search?q={keyword}
```

### 股票行情
```
GET /api/quote/:symbol           # 单只股票行情
GET /api/quotes/batch?symbols=   # 批量获取行情
```

### K线数据
```
GET /api/kline/:symbol?period={period}&limit={limit}
```
- `period`: realtime, daily, weekly, monthly, yearly
- `limit`: 数据条数限制（默认100）

### 自选股管理
```
GET    /api/watchlist           # 获取自选股列表
POST   /api/watchlist           # 添加自选股 { symbol, name, market }
DELETE /api/watchlist/:id       # 删除自选股
```

### AI 分析
```
POST /api/analyze
Body: { symbol: string, period: string }
```

### 回测功能
```
POST /api/backtest
Body: { symbol, startDate, endDate, strategy }
```

### 持仓管理
```
GET    /api/positions           # 获取持仓列表
POST   /api/positions            # 添加持仓 { symbol, shares, price }
DELETE /api/positions/:id        # 卖出持仓
```

### 健康检查
```
GET /health
```

## 数据来源

- **股票数据**：东方财富网 API
- **AI 分析**：DeepSeek / MiniMax / Claude API

## 注意事项

⚠️ **风险提示**
- 本系统仅供学习研究使用
- 股票数据仅供参考，不构成投资建议
- 请根据自身风险承受能力理性投资

## 技术支持

如遇到问题，请检查：

1. 后端服务是否正常运行（http://localhost:5000）
2. 前端服务是否正常运行（http://localhost:3000）
3. `.env` 文件是否正确配置
4. Node.js 版本是否 >= 18

## License

MIT License