// 数据模型与接口契约 — 严格遵循 docs/specs/06-数据模型与接口契约.md
// 本文件是全局共享类型/契约的唯一真源；编码以此为准。

export type StyleCategory = '2d' | '3d' | 'realistic' | 'custom'

export interface GenParams {
  resolution: string // 如 "1024x1024"
  steps: number // 默认 30
  sampler?: string // 如 dpmpp_2m
  negativePrompt?: string
  batch: number // 默认 1
  // Seedream / OpenAI 兼容参数
  quality?: string // "standard" | "hd"
  style?: string // "vivid" | "natural"
}

export interface Style {
  id: string
  name: string
  category: StyleCategory
  promptTemplate: string // 可含 {prompt}
  params: GenParams
  modelHint?: string // 推荐模型(可选)
  preview?: string // 自有资源 URL/Blob，禁止对标版权图
  builtin: boolean // true=内置(只读)
}

export interface Generation {
  id: string
  prompt: string
  refImage?: Blob // 图生图参考(可选,不强制落库)
  params: GenParams
  styleId?: string
  resultBlob: Blob // 结果图
  createdAt: number
}

// 项目草稿（P1 占位，P3 画布启用）
export interface Project {
  id: string
  name: string
  nodes: unknown[]
  updatedAt: number
}

export type ProviderType = 'openai-compatible' | 'stability' | 'replicate' | 'custom'

// 统一模型注册（BYOK）— apiKey 仅存本地，见 CODEBUDDY.md §3
export interface ModelProvider {
  id: string
  provider: ProviderType
  name: string
  baseUrl: string
  apiKey: string // 仅本地，绝不出库/日志
  defaultModel: string
  enabled: boolean
}

export interface Settings {
  theme?: string
  lastRoute?: string
  providers: ModelProvider[]
}

// 归一化模型响应（04 负责映射到该结构，01 只认它）
export interface ModelResult {
  images: Blob[] | string[]
}

export type AppErrorCode = 'AUTH_INVALID' | 'RATE_LIMIT' | 'TIMEOUT' | 'CORS' | 'UNKNOWN'
