# 04 · 统一模型注册（BYOK）

> 实施真源 · P1 调用链底层。被 图片生成(01) 调用。安全红线见 CODEBUDDY.md §3。

## 1. 概念

用户自带模型 API Key（Bring Your Own Key），应用按注册信息**本地路由**请求，直连模型 Provider，无需平台后端中转用户数据。这是"零后端"成立的前提。

## 2. 用户配置项（ModelProvider）

| 字段 | 说明 |
|------|------|
| id | 配置标识 |
| provider | 类型：`openai-compatible` / `stability` / `replicate` / `custom` |
| name | 用户自命名（如"我的 SD"） |
| baseUrl | API 基址（openai-compatible 可自填） |
| apiKey | **仅存本地**（见 §5） |
| defaultModel | 模型名（如 `sd-xl`、`gpt-image-1`） |
| enabled | 是否启用 |

## 3. 路由逻辑

```
图片生成(01) 发起请求
  → 选启用 Provider（或用户指定）
  → 04 按 provider 构造请求体（见 06 契约）
  → 浏览器 fetch 直连 baseUrl（密钥随头发送，但仅此一次、仅本地持有）
  → 解析响应 → 返回图片（Blob/URL）给 01
```

## 4. Provider 支持矩阵（P1）

| Provider | 文生图 | 图生图 | 备注 |
|----------|--------|--------|------|
| openai-compatible（如 SD 后端） | ✅ | ✅ | 通用，baseUrl 可配 |
| stability | ✅ | ✅ | 官方 API |
| replicate | ✅ | ✅ | 按模型 |
| custom | ✅ | 视实现 | 用户自填契约 |

> P1 至少打通 **openai-compatible** 一类，保证"自带 Key 即出图"闭环。

## 5. 密钥安全红线（强制）

- apiKey **只存浏览器本地**（IndexedDB `settings` 或 localStorage），**绝不可**：写入代码、提交 Git、打印日志、经平台服务器中转。
- 仓库内仅允许占位符（`YOUR_API_KEY`）。
- 请求时密钥仅随用户本次直连发送，不落库、不缓存明文于其它位置。
- 设置页展示 Key 时默认掩码；提供"显示/清除"。

## 6. 错误处理

| 情况 | 处理 |
|------|------|
| 鉴权失败 401 | 提示"Key 无效/权限不足"，引导检查设置 |
| 跨域 CORS | 可选轻量代理（见 §7），密钥仍不出本地 |
| 限流 429 | 提示稍后重试 / 降批量 |
| 超时 | 可取消 + 重试 |

## 7. CORS 代理（可选）

若目标 Provider 不支持浏览器跨域，可启用一个极简代理仅做**转发**（不存 Key、不存结果）。代理非 P1 必须；优先选支持 CORS 的 Provider。

## 8. 验收标准

- [ ] 设置中可新增/启用/禁用/删除 Provider 配置。
- [ ] 配置 openai-compatible 的 Key 后，图片生成可真实出图。
- [ ] 密钥仅存本地；Git 仓/日志无真实密钥。
- [ ] 401/429/超时/CORS 均有明确提示。
- [ ] 掩码展示 Key，可清除。
