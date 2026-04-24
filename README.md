# A股量化系统

基于 Web 的 A股量化交易辅助系统，提供股票搜索、实时行情、K线分析和 AI 智能诊断功能。

## 功能特性

- 📈 **股票搜索与自选** - 支持按代码、名称搜索，添加/删除自选股
- 💹 **实时行情** - 显示实时价格、涨跌幅、成交量等
- 📊 **K线图表** - 支持多种周期（实时、日线、周线、月线、年线）
- 🤖 **AI 智能诊断** - 基于技术指标，AI 智能分析股票走势
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

#### 1. 启动后端

```bash
cd backend
npm install
npm start
```

#### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

#### 3. 访问系统

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
- Claude API / OpenAI API (AI分析)

## 项目结构

```
astock-quantitative-system/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/     # React 组件
│   │   │   ├── KLineChart/ # K线图组件
│   │   │   ├── StockCard/  # 股票卡片组件
│   │   │   ├── StockSearch/ # 股票搜索组件
│   │   │   └── StockAnalysis/ # AI分析组件
│   │   ├── pages/         # 页面组件
│   │   │   ├── DashboardPage.tsx  # 首页
│   │   │   ├── WatchlistPage.tsx  # 自选股页面
│   │   │   ├── StockDetailPage.tsx # 股票详情页
│   │   │   └── BacktestPage.tsx   # 回测页面
│   │   ├── stores/         # Zustand 状态管理
│   │   ├── services/       # API 服务
│   │   ├── types/          # TypeScript 类型定义
│   │   └── utils/          # 工具函数
│   └── package.json
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   │   ├── stock.js    # 股票搜索和行情API
│   │   │   ├── kline.js    # K线数据API
│   │   │   ├── watchlist.js # 自选股管理API
│   │   │   └── analyze.js  # AI分析API
│   │   ├── services/       # 业务逻辑
│   │   │   └── stockService.js # 股票数据服务
│   │   └── db/             # 数据库
│   │       ├── database.js  # 数据库初始化
│   │       └── init.sql     # 数据库表结构
│   └── server.js            # Express 服务器入口
│
├── start.bat                 # Windows 启动脚本
└── README.md
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

### 5. 主题设置

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
GET /api/quote/:symbol
```

### K线数据
```
GET /api/kline/:symbol?period={period}&limit={limit}
```
- `period`: realtime, daily, weekly, monthly, yearly
- `limit`: 数据条数限制

### 自选股管理
```
GET    /api/watchlist          # 获取自选股列表
POST   /api/watchlist         # 添加自选股
DELETE /api/watchlist/:id      # 删除自选股
```

### AI 分析
```
POST /api/analyze
Body: { symbol, period }
```

## 数据来源

- **股票数据**：东方财富网 API
- **AI 分析**：Claude API / OpenAI API

## 注意事项

⚠️ **风险提示**
- 本系统仅供学习研究使用
- 股票数据仅供参考，不构成投资建议
- 请根据自身风险承受能力理性投资

## 技术支持

如遇到问题，请检查：

1. 后端服务是否正常运行（http://localhost:5000）
2. 前端服务是否正常运行（http://localhost:3000）
3. 数据库文件是否存在（backend/data/stocks.db）
4. Node.js 版本是否 >= 18

## License

MIT License

## 上传到 GitHub

项目已配置 `.gitignore` 文件，会自动排除敏感信息和构建产物。

### 快速上传

1. **双击运行 `GITHUB_UPLOAD.bat`** - 自动初始化 Git 仓库
2. **在 GitHub 创建新仓库**
3. **运行以下命令**：

```bash
# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/astock-quantitative-system.git

# 推送到 GitHub
git push -u origin main
```

详细说明请查看 [GITHUB_SETUP.md](GITHUB_SETUP.md)
