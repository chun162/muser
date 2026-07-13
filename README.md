# 珑点智算 · Muse 复刻项目

> 对标产品：**TopenMuse 词元妙思**（`http://topenrouter.com/muse`）
> 当前阶段：**产品讨论 + 立项设计**（尚未进入编码）
> 仓库用途：沉淀调研、设计决策与待办，作为后续开发的唯一事实来源

## 一句话定位

做一个"本地优先、零后端"的多入口 AI 创作平台：**图片生成 · 视频生成 · 无限画布 · 画风库** 一站式智能创作。

## 当前阶段在做什么

- 复刻进行中，按 [`docs/功能大纲.md`](docs/功能大纲.md) 的 P1→P4 分阶段推进。
- P1(MVP) ✅ 完成；P2(视频生成) ✅ 完成；P3(画布/工具箱)、P4(账户/VIP) 进行中。
- 详细进度见下方「当前进度」。

## 目录说明

```
.
├── CODEBUDDY.md            # 项目 Agent 宪法（自动读取，含逐条大白话）
├── .gitignore              # 已屏蔽密钥/本地配置/大资源，初始化前即就位
├── README.md               # 本文件
├── server/                 # 后端骨架（Node+TS+Express+Pino）：见 server/README.md
└── docs/
    ├── 01-产品调研拆解.md   # 对标产品拆解
    ├── 02-立项设计.md       # 立项设计书（目标/范围/架构/里程碑）
    ├── 03-待决策问题.md     # 决策记录（已对齐）
    ├── 功能大纲.md           # 复刻项目功能总纲（模块/阶段/执行纪律）
    └── specs/              # 实施真源文档（编码依据）
        ├── README.md               # 真源索引（本批=P1/MVP）
        ├── 00-范围与验收基线.md
        ├── 01-图片生成模块.md
        ├── 02-画风库模块.md
        ├── 03-本地优先存储.md
        ├── 04-统一模型注册(BYOK).md
        ├── 05-信息架构与路由.md
        ├── 06-数据模型与接口契约.md
        └── 07-数据库设计.md
```

## 决策状态（已对齐）

- **品牌视觉**：高度还原对标视觉，但使用自有品牌名（不复制受保护资产）。
- **目标范围**：全量对齐四入口；MVP 先图片闭环，分阶段交付。
- **后端/商业模式**：MVP 纯 BYOK（零后端），P4 引入 VIP 托管算力。

> 详见 [`docs/03-待决策问题.md`](docs/03-待决策问题.md) 的"决策记录"。

## 当前进度

- ✅ **前端骨架已搭（最小可运行）**：React 19 + Vite 6 + TypeScript + Tailwind CSS v4 + React Router v7。
  - 路由（`/`、`/image`、`/styles`、`/settings`、`/works`）按 [`docs/specs/05`](docs/specs/05-信息架构与路由.md)；类型契约按 [`docs/specs/06`](docs/specs/06-数据模型与接口契约.md)。
  - 含本地优先存储骨架（`src/lib/db.ts`，IndexedDB `ciyuan-muse`）与 BYOK 密钥掩码工具（`src/lib/modelRegistry.ts`）。
  - 页面为占位（未写全部页面），`npm run dev` 可启动、`npm run build` 已验证通过。
- ✅ **MVP 页面已实现（mock 跑通流程，未接后端）**：`npm run build` 通过、无头渲染验证挂载成功。
  - `图片生成`：prompt/参考图/参数/画风选择 → Mock 生成占位图 → 保存到作品。
  - `画风库`：内置 23 风格（2D/3D/写实，自有沉淀）+ 分类 Tab + 自定义风格 CRUD（持久化 IndexedDB）+ 一键应用。
  - `设置·模型注册(BYOK)`：Provider 配置增删改，密钥仅存本地、掩码展示（Mock 阶段不发起真实请求）。
  - `我的作品`：本地作品列表（IndexedDB）、查看、删除。
  - 数据层：`src/lib/db.ts`(IndexedDB CRUD) / `seedStyles.ts`(内置画风) / `mockGenerate.ts`(canvas 占位图) / `store/AppContext.tsx`(全局状态)。
- ✅ **后端骨架 + MVP/P2 接口**：Node+TS+Express+Pino；统一返回信封/错误处理/结构化日志(含 requestId)；`GET /health`、`GET /api/styles`、`POST /api/generate`、`POST /api/video`（BYOK 代理，密钥仅转发不存储）。
- ✅ **P2 视频生成**：前端 `/video`（文生/图生/首尾帧，mock）+ 后端 `POST /api/video` 代理；首页入口已启用。
- ✅ **P3 无限画布 + AI 工具箱**：`/canvas`（可拖拽节点、从作品加图、本地持久化）、`/tools`（扩图/重绘/超分 mock）。
- ✅ **P4 账户·VIP（Mock）**：`/account` 本地 mock 登录/VIP；真实账户计费为 P4 服务端阶段。
- 🎉 **全量复刻完成（可运行成品）**：首页四入口全部启用；`npm run dev` 起前端、`cd server && npm start` 起后端。真实模型经 BYOK 代理（`POST /api/generate`、`POST /api/video`），其余 mock 跑通。

## 下一步

1. 补首屏截图以锁定视觉规范（配色/字体/组件）。
2. 决策已对齐，后续按 P1–P4 里程碑进入技术选型与编码（另开 Sprint，本阶段未写代码）。
