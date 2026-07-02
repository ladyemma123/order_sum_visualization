# 工单数据可视化看板

基于 React + Node.js + MySQL 构建的全栈工单数据可视化平台，支持实时数据统计、预警分析和数据导入同步。

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: MySQL
- **样式**: TailwindCSS 3

## 前置条件

- Node.js >= 18.x
- MySQL >= 5.7 / 8.0

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

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置 MySQL 连接信息和服务端口：

```env
MYSQL_HOST=数据库IP或地址
MYSQL_PORT=数据库端口号
MYSQL_USER=用户名
MYSQL_PASSWORD=密码
MYSQL_DATABASE=数据库名
MYSQL_TABLE=数据表名
MYSQL_USE_SSL=false

# 服务端口配置，默认3000
PORT=3000
```

### 4. 配置 Vite 允许外部访问（可选）

如果需要从其他设备访问，在 `vite.config.ts` 文件中修改或添加：

```javascript
server: {
    port: 3000,
    allowedHosts: true
}
```

### 5. 运行项目

```bash
npm run dev
```

项目将在 `http://localhost:PORT` 启动（PORT 为 `.env` 中配置的值，默认 3000）。

## 部署教程

### 本地部署

按照上述"快速开始"步骤即可在本地启动服务。

### 公网访问（内网穿透）

使用 Cloudflare Tunnel 实现内网穿透，让公网用户访问本地服务。

#### 1. 下载 Cloudflared

访问 [Cloudflared Releases](https://github.com/cloudflare/cloudflared/releases)，选择最新版本的 `cloudflared-windows-amd64.exe`。

#### 2. 安装 Cloudflared

- 创建目录 `D:\Cloudflared\bin`，将下载的 `.exe` 文件放入并更名为 `cloudflared.exe`
- 双击运行，会自动创建配置文件

#### 3. 创建 Cloudflare Tunnel

- 打开 [Cloudflare Dashboard](https://www.cloudflare.com)
- 左侧导航栏选择 **Networking** → **Tunnels**
- 点击 **Create Tunnels**，创建完成后会获得安装命令和 token

#### 4. 安装 Windows 服务

管理员身份打开 PowerShell，执行：

```bash
.\cloudflared.exe service install your-token-value
```

安装成功后会显示：

```bash
INF Installing cloudflared Windows service
INF Windows service Cloudflared successfully installed
```

#### 5. 配置域名

- 购买域名（如通过 [宝塔](https://www.bt.cn/new/index.html)）
- 在 Cloudflare 控制台点击 **Domains** → **Overview** → **Add domain**
- 输入域名后，按提示修改 DNS 服务器配置
- 在宝塔域名管理界面，将 DNS 服务器修改为 Cloudflare 提供的服务器

#### 6. 配置隧道路由

- 在 Cloudflare Tunnel 配置页面，点击 **Configure** → **Add route**
- **Subdomain**（选填）：如 `dashboard`
- **Domain**（必填）：如 `yourdomain.cn`
- **URL**（必填）：本地访问地址，如 `localhost:3000`

配置完成后，公网访问地址为 `http://dashboard.yourdomain.cn`。

## 数据库表结构

项目使用配置的数据表，字段如下：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键 |
| enterprise_name | VARCHAR | 企业名称 |
| csm | VARCHAR | CSM负责人 |
| rpa_coach | VARCHAR | RPA教练 |
| total_count | INT | 进线总频次 |
| manual_count | INT | 工程师处理次数 |
| resolved_count | INT | 有效解决数 |
| ccusers_name | VARCHAR | 进线名称 |
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
├── package.json             # 项目依赖
└── vite.config.ts           # Vite 配置
```

## 预警等级定义

- **低频**: 进线次数 < 10 次
- **中频**: 10 ≤ 进线次数 < 25 次
- **高频**: 进线次数 ≥ 25 次

## License

MIT License
