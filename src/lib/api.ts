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

// ===== Seedance 直连（BYOK，类似 generateImageDirect） =====
// 通过 acedata.cloud 网关调用字节跳动 Seedance 2.0
// 文档: POST https://api.acedata.cloud/seedance/videos

interface SeedanceContentItem {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string; detail?: 'auto' | 'low' | 'high' }
  role?: 'first_frame' | 'last_frame'
}

interface SeedanceJob {
  success: boolean
  task_id: string
  trace_id: string
  data: {
    task_id: string
    status: 'processing' | 'succeeded' | 'failed'
    video_url?: string
    model: string
  }
}

/**
 * 直连 Seedance 文生视频 / 图生视频（同步返回 / 轮询）
 * 支持 acedata.cloud 和 topenrouter.com 两种网关
 * prompt 内可接参数指令: --rs 720p --rt 16:9 --dur 5 --fps 24 --wm false
 */
export async function generateVideoDirect(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  mode: 'text2video' | 'image2video' | 'firstlast',
  params: { resolution: string; duration: number; fps: number; motion: string },
  refImage?: File | null,
): Promise<{ videos: string[] }> {
  const promptWithArgs = prompt + ` --dur ${params.duration} --fps ${params.fps}`
  const base = baseUrl.replace(/\/+$/, '')

  // TopenRouter → OpenAI 兼容 /v1/video/generations
  if (base.includes('topenrouter')) {
    return generateVideoOpenAI(base, apiKey, model, promptWithArgs)
  }

  // Seedance acedata → /seedance/videos
  return generateVideoAcedata(base, apiKey, model, promptWithArgs, mode, refImage)
}

async function generateVideoOpenAI(
  base: string,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ videos: string[] }> {
  const resp = await fetch(`${base}/video/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, n: 1 }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: { message: resp.statusText } }))
    throw new Error(err.error?.message || `Video API 错误 (${resp.status})`)
  }
  const json = (await resp.json()) as { data: { url?: string; b64_json?: string }[] }
  const videos: string[] = []
  for (const item of json.data) {
    if (item.url) videos.push(item.url)
    else if (item.b64_json) videos.push(`data:video/mp4;base64,${item.b64_json}`)
  }
  if (videos.length === 0) throw new Error('视频生成未返回有效数据')
  return { videos }
}

async function generateVideoAcedata(
  base: string,
  apiKey: string,
  model: string,
  prompt: string,
  mode: 'text2video' | 'image2video' | 'firstlast',
  refImage?: File | null,
): Promise<{ videos: string[] }> {
  const content: SeedanceContentItem[] = [{ type: 'text', text: prompt }]

  if (mode === 'image2video' && refImage) {
    const b64 = await fileToBase64(refImage)
    content.unshift({
      type: 'image_url',
      image_url: { url: b64, detail: 'auto' },
    })
  }

  const url = `${base}/seedance/videos`
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ content, model }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: { message: resp.statusText } }))
    throw new Error(err.error?.message || `Seedance API 错误 (${resp.status})`)
  }

  const json = (await resp.json()) as SeedanceJob
  if (!json.success || !json.data) throw new Error('Seedance 请求失败')
  if (json.data.status === 'failed') throw new Error('Seedance 视频生成失败')
  if (json.data.video_url) return { videos: [json.data.video_url] }

  return pollSeedanceTask(base, apiKey, json.data.task_id, 30, 180)
}

async function pollSeedanceTask(
  base: string,
  apiKey: string,
  taskId: string,
  intervalSec: number,
  maxSec: number,
): Promise<{ videos: string[] }> {
  const queryUrl = `${base}/seedance/videos/result?taskId=${encodeURIComponent(taskId)}`
  const deadline = Date.now() + maxSec * 1000

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalSec * 1000))
    const resp = await fetch(queryUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!resp.ok) continue
    const json = (await resp.json()) as SeedanceJob
    if (!json.success || !json.data) continue
    if (json.data.status === 'succeeded' && json.data.video_url) {
      return { videos: [json.data.video_url] }
    }
    if (json.data.status === 'failed') {
      throw new Error('Seedance 视频生成失败')
    }
  }

  throw new Error('Seedance 视频生成超时')
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

// ===== 工具函数 =====

export async function urlToBlob(url: string): Promise<Blob> {
  const r = await fetch(url)
  return r.blob()
}
