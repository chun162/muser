import { logger } from '../common/logger'
import { AppError, ErrorCode } from '../common/errors'
import type { VideoInput } from '../validate/video'

// 视频生成代理服务（BYOK）— 与 generate 同构，仅端点/字段不同。
// 红线（CODEBUDDY.md §3）：apiKey 仅转发到用户指定 baseUrl，绝不存储/日志。

export interface VideoResult {
  videos: string[] // 视频 URL 或 data URL
}

const PROVIDER_TIMEOUT_MS = 120_000

export async function generateVideo(input: VideoInput): Promise<VideoResult> {
  const url = buildUrl(input)
  const body = buildBody(input)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!resp.ok) await mapProviderError(resp.status)

    const data = (await resp.json()) as unknown
    const videos = extractVideos(data)
    if (videos.length === 0) throw new AppError(ErrorCode.INTERNAL, '模型服务返回为空', 502)
    return { videos }
  } catch (err) {
    if (err instanceof AppError) throw err
    if ((err as { name?: string })?.name === 'AbortError') {
      throw new AppError(ErrorCode.TIMEOUT, '模型服务超时', 504)
    }
    logger.error({ error: String(err) }, 'video.proxy.failed')
    throw new AppError(ErrorCode.INTERNAL, '调用模型服务失败', 502)
  } finally {
    clearTimeout(timer)
  }
}

function buildUrl(input: VideoInput): string {
  if (input.provider !== 'openai-compatible') {
    throw new AppError(ErrorCode.BAD_REQUEST, `暂仅支持 openai-compatible（当前: ${input.provider}）`, 400)
  }
  const base = input.baseUrl.replace(/\/+$/, '')
  return `${base}/videos/generations`
}

function buildBody(input: VideoInput): Record<string, unknown> {
  const { model, prompt, mode, params } = input
  return {
    model,
    prompt,
    mode, // text2video / image2video / firstlast
    n: params.batch,
    duration: params.duration,
    fps: params.fps,
    size: params.resolution,
    motion: params.motion,
  }
}

function extractVideos(data: unknown): string[] {
  const arr = (data as { data?: Array<{ url?: string; b64_json?: string }> })?.data
  if (!Array.isArray(arr)) return []
  return arr
    .map((it) => (it.b64_json ? `data:video/mp4;base64,${it.b64_json}` : it.url))
    .filter((s): s is string => typeof s === 'string')
}

async function mapProviderError(status: number): Promise<never> {
  if (status === 401) throw new AppError(ErrorCode.UNAUTHORIZED, '模型服务鉴权失败（请检查 API Key）', 401)
  if (status === 429) throw new AppError(ErrorCode.RATE_LIMIT, '模型服务限流，请稍后重试', 429)
  throw new AppError(ErrorCode.INTERNAL, `模型服务错误（${status}）`, 502)
}
