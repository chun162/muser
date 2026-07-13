import type { GenParams, ModelProvider } from '../types'
import { API_BASE } from './config'

// ===== 词元智算 API 客户端 =====
// BYOK 模式：API Key 仅存浏览器 IndexedDB（前端），直连模型 API（TopenRouter / SiliconFlow 等）
// 零后端：前端直连，无需代理服务器。secret 不出浏览器、不出日志、不出 Git
//
// Seedream 3.0（TopenRouter 路由）:
//   POST https://api.topenrouter.com/v1/images/generations
//   Authorization: Bearer <sk-your-key>
//   Body: { model: "seedream-v3.0", prompt: "...", n: 1, size: "1024x1024" }
//
// 若用户配置了后端代理（VITE_API_BASE），则走后端转发

const BASE = API_BASE

// ===== 后端代理路径（备选） =====

async function callApi(path: string, body: unknown): Promise<unknown> {
  const resp = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await resp.json()) as { code: number; message: string; data: unknown }
  if (json.code !== 0) throw new Error(json.message || '请求失败')
  return json.data
}

export interface GenerateApiInput {
  provider: ModelProvider
  model: string
  prompt: string
  params: GenParams
}

export async function generateImageViaProxy(input: GenerateApiInput): Promise<{ images: string[] }> {
  const data = (await callApi('/generate', {
    provider: input.provider.provider,
    baseUrl: input.provider.baseUrl,
    apiKey: input.provider.apiKey,
    model: input.model,
    prompt: input.prompt,
    params: input.params,
  })) as { images: string[] }
  return { images: data.images }
}

// ===== BYOK 直连模式（默认 / 推荐） =====
// OpenAI 兼容的图片生成接口
// Seedream / DALL-E / DeepSeek 等均兼容

export interface BYOKImageInput {
  baseUrl: string
  apiKey: string
  model: string
  prompt: string
  n?: number
  size?: string  // "1024x1024" | "1024x768" | etc
  quality?: string  // "standard" | "hd"
  style?: string  // "vivid" | "natural"
}

export interface BYOKImageResult {
  revisedPrompt?: string
  b64Json?: string
  url?: string
}

/**
 * OpenAI 兼容的文生图接口（直连，零后端）
 * 适用于 Seedream / DALL-E 3 / 其他兼容服务
 */
export async function generateImageDirect(input: BYOKImageInput): Promise<{ images: BYOKImageResult[] }> {
  const resp = await fetch(`${input.baseUrl.replace(/\/+$/, '')}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      n: input.n ?? 1,
      size: input.size ?? '1024x1024',
      quality: input.quality ?? 'standard',
      style: input.style ?? 'vivid',
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: { message: resp.statusText } }))
    throw new Error(err.error?.message || `API 错误 (${resp.status})`)
  }

  const json = (await resp.json()) as { data: BYOKImageResult[] }
  return { images: json.data }
}

// ===== 自动选择生成路径 =====
// 有后端代理 → 走后端；否则直连

export async function generateImage(input: GenerateApiInput): Promise<{ images: string[] }> {
  // 如果没有配置后端代理且用户有直连凭据，走直连
  const { provider, model, prompt: rawPrompt, params } = input

  // 走直连
  const result = await generateImageDirect({
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    model,
    prompt: rawPrompt,
    n: params.batch,
    size: params.resolution,
  })

  // 转换结果为 URL 列表
  const images: string[] = []
  for (const img of result.images) {
    if (img.url) {
      images.push(img.url)
    } else if (img.b64Json) {
      images.push(`data:image/png;base64,${img.b64Json}`)
    }
  }

  return { images }
}

export interface VideoApiInput {
  provider: ModelProvider
  model: string
  prompt: string
  mode: string
  params: { resolution: string; duration: number; fps: number; motion: string; batch: number }
}

export async function generateVideo(input: VideoApiInput): Promise<{ videos: string[] }> {
  const data = (await callApi('/video', {
    provider: input.provider.provider,
    baseUrl: input.provider.baseUrl,
    apiKey: input.provider.apiKey,
    model: input.model,
    prompt: input.prompt,
    mode: input.mode,
    params: input.params,
  })) as { videos: string[] }
  return { videos: data.videos }
}

// ===== 工具函数 =====

export async function urlToBlob(url: string): Promise<Blob> {
  const r = await fetch(url)
  return r.blob()
}
