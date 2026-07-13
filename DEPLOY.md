# 部署上线（Vercel + Render）

> 前端（Vite SPA）部署到 **Vercel**；后端（Express + SQLite）部署到 **Render**。
> Vercel 通过 `vercel.json` 的 rewrite 把 `/api/*` 代理到后端，避免跨域。

## 1. 后端 → Render

1. 在 Render 用本仓库新建 **Web Service**，或用 `render.yaml`（Blueprint）一键创建：
   - Root: `server/`
   - Build: `npm install`
   - Start: `npm start`
   - Health: `/health`
2. 环境变量（`render.yaml` 已含，可改）：
   - `JWT_SECRET`：建议用 Render 自动生成（`generateValue: true`）
   - `DB_PATH`：`/data/app.db`（已挂载 1GB 持久盘 `/data`，保证 SQLite 数据不丢）
   - `NODE_ENV`：`production`
3. 部署完成后拿到后端地址，如 `https://ciyuan-muse-server.onrender.com`。

> 注意：Render 免费层会休眠；首请求可能冷启动延迟。生产建议升级。

## 2. 前端 → Vercel

1. 在 Vercel 导入本仓库，框架自动识别为 Vite。
2. 设置环境变量：
   - `BACKEND_URL` = 上一步后端地址（如 `https://ciyuan-muse-server.onrender.com`），**不带末尾斜杠**。
3. `vercel.json` 已配置：
   - Build: `npm run build`，输出 `dist`
   - Rewrite: `/api/(.*)` → `${BACKEND_URL}/api/$1`（代理，免跨域）
   - Rewrite: 其余路径 → `/index.html`（SPA 路由回退）
4. 部署后即可访问。首页四入口、账户注册登录、BYOK 生成（填 Key）均可用。

## 3. 真实出图（BYOK）

- 进入「设置」配置一个 `openai-compatible` 模型：baseUrl + API Key + 模型名，启用。
- 回到「图片生成」输入提示词 → 生成（真实模型）。视频同理。
- 密钥仅存浏览器本地、经后端代理转发到你的模型端点，**不存储、不写日志**。

## 4. 备选：前端也部署到 Render（Static Site）

- 用 `public/_redirects`（`/* /index.html 200`）做 SPA 回退。
- 设置环境变量 `VITE_API_BASE` = 后端地址（构建期注入），前端将直连后端（需后端开 CORS）。

## 环境变量速查

| 变量 | 位置 | 说明 |
|------|------|------|
| `BACKEND_URL` | Vercel（前端） | /api 代理目标 |
| `VITE_API_BASE` | 前端（仅 Render Static 直连时） | 后端基址 |
| `JWT_SECRET` | Render（后端） | JWT 签名密钥 |
| `DB_PATH` | Render（后端） | SQLite 路径（持久盘） |
| `PORT` | Render（后端） | 监听端口 |
