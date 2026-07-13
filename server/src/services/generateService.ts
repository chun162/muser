import { logger } from '../common/logger'
import { AppError, ErrorCode } from '../common/errors'
import type { GenerateInput } from '../validate/generate'

// 图片生成代理服务（BYOK）
// 职责：按用户指定的 provider/baseUrl，携带用户自备 apiKey 直连模型服务并转发结果。
// 红线（CODEBUDDY.md §3）：apiKey 仅转发到用户指定的 baseUrl，绝不存储、绝不写日志、绝不发往平台服务端。

export interface GenerateResult {
  images: string[] // 图片 URL 或 data URL（见 specs/06 ModelResult.images: string[]）
}

const PROVIDER_TIMEOUT_MS = 60_000

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const url = buildUrl(input)
  const body = buildBody(input)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`, // 仅转发到用户指定端点
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!resp.ok) {
      await mapProviderError(resp.status)
    }

    const data = (await resp.json()) as unknown
    const images = extractImages(data)
    if (images.length === 0) {
      throw new AppError(ErrorCode.INTERNAL, '模型服务返回为空', 502)
    }
    return { images }
  } catch (err) {
    if (err instanceof AppError) throw err
    if (err instanceof TypeError || (err as { name?: string })?.name === 'AbortError') {
      throw new AppError(ErrorCode.TIMEOUT, '模型服务超时', 504)
    }
    logger.error({ error: String(err) }, 'generate.proxy.failed')
    throw new AppError(ErrorCode.INTERNAL, '调用模型服务失败', 502)
  } finally {
    clearTimeout(timer)
  }
}

function buildUrl(input: GenerateInput): string {
  if (input.provider !== 'openai-compatible') {
    // MVP 仅落地 openai-compatible；其余类型在 P4 扩展
    throw new AppError(ErrorCode.BAD_REQUEST, `暂仅支持 openai-compatible（当前: ${input.provider}）`, 400)
  }
  const base = input.baseUrl.replace(/\/+$/, '')
  return `${base}/images/generations`
}

function buildBody(input: GenerateInput): Record<string, unknown> {
  const { model, prompt, params } = input
  return {
    model,
    prompt,
    n: params.batch,
    size: params.resolution,
    ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
  }
}

function extractImages(data: unknown): string[] {
  // openai-compatible: { data: [ { url } | { b64_json } ] }
  const arr = (data as { data?: Array<{ url?: string; b64_json?: string }> })?.data
  if (!Array.isArray(arr)) return []
  return arr
    .map((it) => (it.b64_json ? `data:image/png;base64,${it.b64_json}` : it.url))
    .filter((s): s is string => typeof s === 'string')
}

async function mapProviderError(status: number): Promise<never> {
  if (status === 401) {
    throw new AppError(ErrorCode.UNAUTHORIZED, '模型服务鉴权失败（请检查 API Key）', 401)
  }
  if (status === 429) {
    throw new AppError(ErrorCode.RATE_LIMIT, '模型服务限流，请稍后重试', 429)
  }
  throw new AppError(ErrorCode.INTERNAL, `模型服务错误（${status}）`, 502)
}
