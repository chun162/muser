import { BadRequestError } from '../common/errors'

// POST /api/generate 入参校验
// 严格校验，失败时抛 BadRequestError（由 errorHandler 统一转信封）。

const PROVIDERS = ['openai-compatible', 'stability', 'replicate', 'custom'] as const
const RESOLUTIONS = ['512x512', '1024x1024', '1024x768', '768x1024'] as const
const MAX_PROMPT = 2000

export interface GenerateParams {
  resolution: string
  steps: number
  sampler?: string
  negativePrompt?: string
  batch: number
}

export interface GenerateInput {
  provider: string
  baseUrl: string
  apiKey: string // 用户自备，随请求传入，服务端不存储/不日志
  model: string
  prompt: string
  refImage?: string
  params: GenerateParams
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

export function validateGenerateInput(body: unknown): GenerateInput {
  if (!body || typeof body !== 'object') throw new BadRequestError('请求体格式错误')

  const b = body as Record<string, unknown>
  const { provider, baseUrl, apiKey, model, prompt, params, refImage } = b

  if (typeof provider !== 'string' || !PROVIDERS.includes(provider as never)) {
    throw new BadRequestError('provider 不支持（应为 openai-compatible/stability/replicate/custom）')
  }
  // SSRF 基础防护：仅允许 http(s)；生产环境应进一步屏蔽内网/元数据地址
  if (typeof baseUrl !== 'string' || !/^https?:\/\//i.test(baseUrl)) {
    throw new BadRequestError('baseUrl 必须为 http(s) 地址')
  }
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    throw new BadRequestError('apiKey 必填（用户自备模型密钥）')
  }
  if (typeof model !== 'string' || !model) throw new BadRequestError('model 必填')
  if (typeof prompt !== 'string' || !prompt.trim()) throw new BadRequestError('prompt 必填')
  if (prompt.length > MAX_PROMPT) throw new BadRequestError('prompt 过长（≤2000）')
  if (refImage !== undefined && typeof refImage !== 'string') {
    throw new BadRequestError('refImage 格式错误')
  }

  if (!params || typeof params !== 'object') throw new BadRequestError('params 必填')
  const p = params as Record<string, unknown>
  const resolution = typeof p.resolution === 'string' && RESOLUTIONS.includes(p.resolution as never)
    ? (p.resolution as string)
    : '1024x1024'
  const sampler = typeof p.sampler === 'string' ? p.sampler : undefined
  const negativePrompt = typeof p.negativePrompt === 'string' ? p.negativePrompt : undefined

  return {
    provider,
    baseUrl,
    apiKey,
    model,
    prompt: prompt.trim(),
    refImage: typeof refImage === 'string' ? refImage : undefined,
    params: {
      resolution,
      steps: clampInt(p.steps, 1, 100, 30),
      sampler,
      negativePrompt,
      batch: clampInt(p.batch, 1, 4, 1),
    },
  }
}
