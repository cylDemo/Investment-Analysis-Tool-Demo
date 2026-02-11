# 投资分析工具

## 项目简介

投资分析工具是一个全栈Web应用，用于分析股票、基金和金属价格数据，提供详细的财务信息、投资建议和市场资讯。

## 在线演示

🌐 **GitHub仓库**: https://github.com/cylDemo/Investment-Analysis-Tool-Demo

## 技术栈

### 前端
- React 18
- Chart.js / react-chartjs-2
- CSS3 (Flexbox, Grid)
- Vite
- Axios

### 后端
- Node.js
- Express.js
- CORS middleware

## 项目结构

```
Investment_Analysis_Tool_Demo/
├── backend/                          # 后端服务
│   ├── index.js                      # 主入口文件，Express服务器配置
│   ├── package.json                  # 后端依赖配置
│   └── package-lock.json             # 依赖锁定文件
│
├── frontend/                         # 前端应用
│   ├── public/                       # 静态资源目录
│   │   └── vite.svg                  # Vite logo
│   │
│   ├── src/                          # 源代码目录
│   │   ├── assets/                   # 资源文件
│   │   │   ├── 20260206152810_4.png  # 应用截图/图片
│   │   │   ├── Logo_2.png            # 应用Logo
│   │   │   └── react.svg             # React logo
│   │   │
│   │   ├── components/               # React组件
│   │   │   ├── MarketNews/           # 市场资讯模块
│   │   │   │   ├── index.jsx         # 市场资讯主组件
│   │   │   │   ├── MarketNews.css    # 市场资讯样式
│   │   │   │   ├── NewsCard.jsx      # 资讯卡片组件
│   │   │   │   ├── NewsHeader.jsx    # 资讯头部组件（筛选、搜索）
│   │   │   │   ├── NewsTimeline.jsx  # 时间轴组件
│   │   │   │   └── NewsEmpty.jsx     # 空状态组件
│   │   │   │
│   │   │   ├── FundDetail.jsx        # 基金详情页
│   │   │   ├── MetalDetail.jsx       # 金属详情页
│   │   │   ├── StockDetail.jsx       # 股票详情页
│   │   │   ├── Portfolio.jsx         # 投资组合页
│   │   │   ├── Settings.jsx          # 设置页面
│   │   │   ├── Settings.css          # 设置页面样式
│   │   │   ├── Login.jsx             # 登录页面
│   │   │   └── Login.css             # 登录页面样式
│   │   │
│   │   ├── services/                 # API服务层
│   │   │   └── newsApi.js            # 市场资讯API接口
│   │   │
│   │   ├── types/                    # TypeScript类型定义
│   │   │   └── news.ts               # 资讯相关类型
│   │   │
│   │   ├── App.css                   # 主应用样式
│   │   ├── App.jsx                   # 主应用组件
│   │   ├── index.css                 # 全局样式
│   │   └── main.jsx                  # 应用入口
│   │
│   ├── .gitignore                    # 前端Git忽略配置
│   ├── index.html                    # HTML模板
│   ├── package.json                  # 前端依赖配置
│   ├── package-lock.json             # 依赖锁定文件
│   ├── README.md                     # 前端说明文档
│   ├── eslint.config.js              # ESLint配置
│   └── vite.config.js                # Vite构建配置
│
├── .gitignore                        # 全局Git忽略配置
├── README.md                         # 项目说明文档
├── create_repo.json                  # GitHub仓库创建配置（临时文件）
└── generate_ssh_key.bat              # SSH密钥生成脚本（临时文件）
```

### 目录说明

| 目录/文件 | 说明 |
|---------|------|
| `backend/` | Node.js + Express 后端服务 |
| `frontend/` | React + Vite 前端应用 |
| `frontend/src/components/` | 页面组件和业务组件 |
| `frontend/src/services/` | API 请求封装 |
| `frontend/src/types/` | TypeScript 类型定义 |
| `frontend/src/assets/` | 图片、图标等静态资源 |

## 核心功能

### 1. 股票分析 📈
- 股票基本信息（所属行业、主营业务、主要产品）
- 估值指标（PE、PB、ROE、股息率、盈利收益率）
- 财务报表（资产负债表、利润表、现金流表）
- 公司简介
- 历史股价走势（支持年份切换）
- 投资建议

### 2. 基金分析 💰
- 基金基本信息
- 历史净值走势（支持年份切换）
- 投资建议

### 3. 金属价格分析 🥇
- 黄金、白银、铜的实时价格
- 历史价格走势（支持年份和月份切换）
- 金属简介

### 4. 市场资讯 📰
- **实时市场资讯展示**
- **时间轴布局**：按时间倒序展示资讯
- **分类筛选**：股票、基金、宏观、行业等分类
- **日期筛选**：日历选择器，支持选择特定日期
- **搜索功能**：支持关键词搜索资讯
- **深色模式**：支持亮色/深色主题切换
- **响应式设计**：适配不同屏幕尺寸

### 5. 用户功能 👤
- **登录/登出**：支持昵称登录
- **设置页面**：
  - 深色/亮色模式切换
  - 语言设置
  - 模块显示/隐藏配置
  - 登出功能

### 6. 投资组合 📊
- 投资组合总览
- 资产配置分析

## API设计

### 1. 股票API
- `GET /api/stock/:code` - 获取股票数据

### 2. 基金API
- `GET /api/fund/:code` - 获取基金数据

### 3. 金属API
- `GET /api/metal/:code` - 获取金属价格数据

### 4. 投资建议API
- `POST /api/advice` - 生成投资建议

### 5. 市场资讯API
- `GET /api/news` - 获取市场资讯列表
- `GET /api/news?category=:category` - 按分类筛选
- `GET /api/news?date=:date` - 按日期筛选
- `GET /api/news?search=:keyword` - 搜索资讯

## API响应格式

所有API返回统一的响应格式：

### 成功响应
```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 快速开始

### 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 启动开发服务器

```bash
# 后端（端口3001）
cd backend
npm start

# 前端（端口5173）
cd frontend
npm run dev
```

### 访问应用

打开浏览器访问：http://localhost:5173

## 功能截图

### 首页搜索
- 支持股票、基金、金属代码搜索
- 实时获取数据

### 详情页面
- 股票详情：基本信息、财务指标、历史走势
- 基金详情：净值走势、投资建议
- 金属详情：价格走势、市场分析

### 市场资讯
- 时间轴展示
- 分类筛选
- 日历选择器
- 深色模式

### 设置页面
- 主题切换
- 模块配置
- 用户管理

## 开发计划

- [x] 股票分析功能
- [x] 基金分析功能
- [x] 金属价格分析
- [x] 市场资讯模块
- [x] 深色模式支持
- [x] 用户登录/设置
- [ ] 数据持久化
- [ ] 用户注册系统
- [ ] 实时数据推送
- [ ] 移动端APP

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 作者

- GitHub: [@cylDemo](https://github.com/cylDemo)
- Email: yl18318350969@163.com

---

⭐ 如果这个项目对您有帮助，请给个 Star 支持一下！
