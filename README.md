# RPA 工单数据可视化看板

基于 React + Node.js + MySQL 构建的全栈工单数据可视化平台，支持实时数据统计、预警分析和数据导入同步。

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: MySQL
- **样式**: TailwindCSS 3
- **部署**: Docker + Docker Compose + Nginx

## 前置条件

- Node.js >= 18.x
- MySQL >= 5.7 / 8.0
- Docker & Docker Compose（可选，用于容器化部署）

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd order_sum_visualization
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

#### 方式一：使用 .env 文件（推荐）

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置 MySQL 连接信息：

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=yingdao_gy
MYSQL_TABLE=gy_workorder_summary
```

#### 方式二：使用环境变量

直接设置环境变量（适用于生产环境）：

```bash
export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=yingdao_gy
export MYSQL_TABLE=gy_workorder_summary
```

### 4. 运行项目

#### 开发模式

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动。

#### 生产构建

```bash
npm run build
npm run start
```

## Docker 部署

### 本地开发环境

```bash
docker-compose up -d
```

服务将在 `http://localhost:80` 启动，Nginx 反向代理到前端和后端。

### 生产环境

```bash
docker-compose -f docker-compose.yml up -d
```

## 数据库表结构

项目使用 `gy_workorder_summary` 表，字段如下：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键 |
| enterprise_name | VARCHAR | 企业名称 |
| csm | VARCHAR | CSM负责人 |
| rpa_coach | VARCHAR | RPA教练 |
| total_count | INT | 进线总频次 |
| manual_count | INT | 人工介入次数 |
| resolved_count | INT | 有效解决数 |
| ccusers_name | VARCHAR | 干系联系人 |
| analysis | TEXT | 异常日志及分析摘要 |
| start_time | DATE | 统计开始时间 |
| end_time | DATE | 统计结束时间 |

## 功能特性

### 📊 数据总览
- 进线企业数统计
- 进线总次数统计
- 工程师处理次数统计
- 高频预警企业统计

### 📈 趋势分析
- 按 CSM/RPA 教练分组统计
- 工单运行与进线趋势分析

### 🔔 预警管理
- 低频（0-9次）、中频（10-24次）、高频（≥25次）三级预警
- 高频预警企业列表

### 📁 数据管理
- 工单数据 CRUD 操作
- Excel/CSV 文件导入同步
- 标准模板下载

## 项目结构

```
order_sum_visualization/
├── src/
│   ├── components/          # React 组件
│   │   ├── DashboardOverview.tsx  # 数据总览
│   │   ├── CompanyDetails.tsx     # 企业详情
│   │   └── DataManagement.tsx     # 数据管理
│   ├── config/              # 配置文件
│   │   └── db.ts            # 数据库连接配置
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 入口文件
├── server.ts                # 后端服务器
├── .env.example             # 环境变量示例
├── docker-compose.yml       # Docker Compose 配置
├── nginx.conf               # Nginx 配置
├── Dockerfile               # Docker 构建文件
└── package.json             # 项目依赖
```

## 预警等级定义

- **低频**: 进线次数 < 10 次
- **中频**: 10 ≤ 进线次数 < 25 次
- **高频**: 进线次数 ≥ 25 次

## License

MIT License
