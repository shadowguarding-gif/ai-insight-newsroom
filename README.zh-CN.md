# AI Insight 中文说明

## 这是什么

这是一个面向全球读者的 AI 资讯网站原型，重点不是把所有信息堆满，而是让用户更快完成三件事：

- 先扫今天最重要的 AI 变化
- 再决定要不要看原文、公司专栏或视频
- 用搜索、Radar、Briefing 和账号同步把信息流变成自己的工作台

当前项目已经包含：

- 同源新闻接口：`/api/news`
- 同源摘要接口：`/api/summarize`
- 同源账号接口：`/api/account`
- 中英双语前端
- 公司专栏、视频入口、Radar、My Briefing
- 免费本地摘要 + 可选 OpenAI / DeepSeek / 开源兼容接口
- 本地 Node 服务入口：`server.mjs`
- Vercel 风格的 `api/` 路由

## 本地怎么运行

1. 安装 Node.js 18 或更高版本
2. 打开项目目录
3. 运行 `node server.mjs`
4. 打开 `http://127.0.0.1:3000`

默认就能使用免费本地摘要，所以即使没有外部 API Key，站点也能工作。

如果你想接入更强的摘要能力，可以再配置：

- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`

如果你想让 GitHub / 工具雷达在高频刷新下更稳定，可以额外配置：

- `GITHUB_TOKEN`

## 这个项目现在怎么工作

当前前端在 `http://` 或 `https://` 环境下，会自动请求：

- `/api/news`
- `/api/summarize`
- `/api/account`

如果你只是直接双击 HTML 文件打开，页面会自动回退到站内种子内容，不会调用这些 live 接口。

当前内容结构包括：

- 深度简报
- 实时快讯
- 工具与开源 Radar
- 公司专栏
- 视频入口
- 专业来源 / 期刊页

## 账号和同步

账号页在 `account.html`。

登录后会同步：

- 收藏文章
- 收藏专业来源
- Radar 主题
- 语言和界面模式
- 摘要提供商 / 模型偏好
- 每日 Briefing 设置

`/api/account` 现在支持两种存储方式：

- 文件模式
  适合本地开发或演示
- Supabase 模式
  更适合线上，因为部署后数据不会丢

如果想接 Supabase，请配置：

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY`

然后在 Supabase SQL Editor 运行：

- [supabase/schema.sql](./supabase/schema.sql)

## 部署方式

当前支持两种常见方式：

- 本地服务：`server.mjs`
- Vercel 部署：`api/news.js`、`api/summarize.js`、`api/account.js`

Vercel 部署说明见：

- [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)

## 最快的公网部署步骤

1. 把项目推到 GitHub
2. 在 Vercel 导入仓库
3. 如果只想先跑站点，可以先不填任何付费摘要 key
4. 如果想要更强摘要，再补：
   - `OPENAI_API_KEY`
   - `DEEPSEEK_API_KEY`
5. 如果想让工具雷达更稳，再补：
   - `GITHUB_TOKEN`

如果要让账号真正持久化，再补：

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY`

## 可编辑的内容源

如果你想调整 live 内容源，而不去改聚合逻辑本身，优先改这里：

- [data/live-source-registry.json](./data/live-source-registry.json)

后端会自动读取它。

## 核心逻辑文件

- 新闻聚合：
  [backend-examples/live-ingest.example.js](./backend-examples/live-ingest.example.js)
- 摘要代理：
  [backend-examples/summary-proxy.example.js](./backend-examples/summary-proxy.example.js)
- 账号服务：
  [backend-examples/account-service.example.js](./backend-examples/account-service.example.js)

## 当前产品思路

这个项目的核心不是炫技，而是服务：

- 首页先帮用户判断“今天先看什么”
- 详情页先给快读，再给原文和视频
- 视频页只保留真实存在的视频入口
- 公司专栏把大公司的连续动态和每日信息流分开
- 专业版把期刊和研究入口收进更适合深读的工作台
