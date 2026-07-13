# 词元智算 · Muse 复刻 — 后端骨架

> 服务端最小可运行骨架。**不含业务代码**（仅 `GET /health` 演示规则）。
> 定位：为 P4（VIP 托管算力 / 账户 / 可选 CORS 代理）预留的服务端基础；MVP 前端仍是"零后端 BYOK"。

## 技术栈

| 项 | 选择 | 理由 |
|----|------|------|
| 运行时 | Node.js (LTS) | 与前端同生态 |
| 语言 | TypeScript（strict） | 前后端统一，未来可共享类型 |
| Web 框架 | Express 4 | 最小认知负担、生态成熟 |
| 日志 | pino | 结构化 JSON，便于后续接入收集 |
| 运行 | tsx 直接跑 TS | 免构建即可验证 |

## 目录结构

```
src/
├── index.ts            入口：createApp + 监听 + 启动日志
├── app.ts              装配：中间件顺序 + 路由挂载
├── config/env.ts       集中配置（PORT/NODE_ENV/LOG_LEVEL，带默认值）
├── common/             横切关注点
│   ├── logger.ts       pino 结构化日志
│   ├── response.ts     统一返回信封 ok()/fail()
│   └── errors.ts       错误码表 + AppError 系列
├── middleware/         请求级规则
│   ├── requestId.ts    x-request-id 链路追踪
│   ├── requestLogger.ts 出入请求日志（方法/路径/状态/耗时）
│   ├── errorHandler.ts 统一错误处理（错误→状态+信封+traceId）
│   └── notFound.ts     404 → 信封
├── routes/            接口（业务代码后续放这里 + services/）
│   └── health.ts       GET /health（演示用，非业务）
└── types/             api.ts 信封类型；express.d.ts Request 增强
```

## 接口返回规则

统一信封：

```jsonc
// 成功
{ "code": 0, "message": "ok", "data": { ... } }

// 失败
{ "code": 40400, "message": "接口不存在", "data": null, "traceId": "uuid" }
```

- `code: 0` 表示成功；非 0 为业务错误码。
- HTTP 状态与业务码并行：`AppError` 携带 `httpStatus`（如 400/401/404/500）。
- 错误响应附 `traceId`（= 请求 ID），用于关联日志排查。

## 错误规则

- 业务错误抛 `AppError`（或 `BadRequestError` / `UnauthorizedError` / `NotFoundError`），由 `errorHandler` 统一转换。
- **未知错误一律 500，且绝不向外泄露内部堆栈/细节**；仅记日志并返回 `traceId`。
- 错误码表见 `common/errors.ts`，后续按域扩展（如 `100xxx` 模型相关）。

## 日志规则

- pino 结构化 JSON；`dev` 默认 `debug`、`prod` 默认 `info`（由 `LOG_LEVEL` / `NODE_ENV` 控制）。
- 每条日志带 `requestId`（响应头 `x-request-id`），错误日志与响应 `traceId` 一致。
- **红线：任何密钥 / token / 用户隐私字段不得传入 logger**（pino 不主动打印请求体；切勿手动记录 `req.body` 中的敏感字段）。
- 启动、请求进出、业务错误、未处理错误均应有对应日志。

## 接口（P1–P2，已实现）

> 架构定位：按 `CODEBUDDY.md` 与 `specs/`，MVP 为"零后端"——图片/视频生成、画风库、本地作品、BYOK 配置主要由前端 IndexedDB 承载。
> 后端接口仅覆盖"服务端可承接"部分：BYOK 代理（`POST /api/generate`、`POST /api/video`，specs/04 §7 允许的「可选轻量代理」）与只读画风目录。其余能力无后端接口。

### POST /api/generate — 图片生成（BYOK 代理）
- **参数校验**：`provider`∈白名单；`baseUrl` 须为 http(s)（SSRF 基础防护）；`apiKey` 必填；`model` 必填；`prompt` 必填且 ≤2000；`params.resolution`∈白名单、`batch`∈[1,4]、`steps`∈[1,100]，越界回落默认；`refImage` 可选（字符串）。
- **权限**：携带**用户自备**模型 API Key（随请求传入，服务端**不存储、不写日志、仅转发到用户指定 baseUrl**）；无账户体系。上游 401→本服务 401；429→429；其它→502；超时→504。
- **涉及表**：**无**（无状态代理；不落密钥/结果；仅写 `traceId` 日志，不含密钥）。

### GET /api/styles — 内置画风目录（只读）
- **参数校验**：无。
- **权限**：公开。
- **涉及表**：**无**（内置画风来自代码种子 `src/data/builtinStyles.ts`，不入库，符合 `specs/07` §6-C）。

### POST /api/video — 视频生成（BYOK 代理）
- **参数校验**：与 generate 同构；额外校验 `mode`∈{text2video,image2video,firstlast}；`params` 含 `duration`∈[1,16]、`fps`∈[1,60]、`resolution`∈白名单、`motion`∈{low,medium,high}。
- **权限**：同 generate，携带用户自备 Key（仅转发不存储/日志）；无账户。
- **涉及表**：**无**（无状态代理）。
- 转发端点：`{baseUrl}/videos/generations`（openai-compatible）；错误映射同 generate。

### GET /health
- **参数校验**：无。**权限**：公开。**涉及表**：无。

## 运行

```bash
cd server
npm install
npm run dev        # tsx watch，热重载
# 或 npm start      # 单次运行
```

健康检查：

```bash
curl -i http://localhost:3000/health
# → { "code": 0, "message": "ok", "data": { "status": "up", "uptime": 0.12 } }
```

> 真实密钥走环境变量（`.env`，已被根 .gitignore 忽略），切勿提交。
