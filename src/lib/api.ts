import type { GenParams, ModelProvider } from '../types'
import { API_BASE } from './config'

// 前端 API 客户端：调用后端 BYOK 代理（/api/generate、/api/video）。
// 开发期经 Vite 代理到 :3000；生产期同源或由部署网关转发（VITE_API_BASE 可配）。
// 密钥随请求传给后端代理，后端仅转发不存储（CODEBUDDY.md §3）。

const BASE = API_BASE

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

export async function generateImage(input: GenerateApiInput): Promise<{ images: string[] }> {
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

// 工具：把 URL/data-URL 转 Blob（保存到本地作品用）
export async function urlToBlob(url: string): Promise<Blob> {
  const r = await fetch(url)
  return r.blob()
}
