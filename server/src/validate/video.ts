import { BadRequestError } from '../common/errors'

// POST /api/video 入参校验（与 generate 同构，params 含视频字段）
const PROVIDERS = ['openai-compatible', 'stability', 'replicate', 'custom'] as const
const RESOLUTIONS = ['1024x576', '1280x720', '1920x1080'] as const
const MOTIONS = ['low', 'medium', 'high'] as const
const MODES = ['text2video', 'image2video', 'firstlast'] as const
const MAX_PROMPT = 2000

export interface VideoParams {
  resolution: string
  duration: number
  fps: number
  motion: string
  batch: number
}

export interface VideoInput {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
  prompt: string
  mode: string
  refImage?: string
  params: VideoParams
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

export function validateVideoInput(body: unknown): VideoInput {
  if (!body || typeof body !== 'object') throw new BadRequestError('请求体格式错误')
  const b = body as Record<string, unknown>
  const { provider, baseUrl, apiKey, model, prompt, mode, params, refImage } = b

  if (typeof provider !== 'string' || !PROVIDERS.includes(provider as never)) {
    throw new BadRequestError('provider 不支持')
  }
  if (typeof baseUrl !== 'string' || !/^https?:\/\//i.test(baseUrl)) {
    throw new BadRequestError('baseUrl 必须为 http(s) 地址')
  }
  if (typeof apiKey !== 'string' || apiKey.length === 0) throw new BadRequestError('apiKey 必填（用户自备模型密钥）')
  if (typeof model !== 'string' || !model) throw new BadRequestError('model 必填')
  if (typeof prompt !== 'string' || !prompt.trim()) throw new BadRequestError('prompt 必填')
  if (prompt.length > MAX_PROMPT) throw new BadRequestError('prompt 过长（≤2000）')
  if (typeof mode !== 'string' || !MODES.includes(mode as never)) throw new BadRequestError('mode 不支持')

  if (!params || typeof params !== 'object') throw new BadRequestError('params 必填')
  const p = params as Record<string, unknown>
  const resolution = typeof p.resolution === 'string' && RESOLUTIONS.includes(p.resolution as never) ? (p.resolution as string) : '1024x576'
  const motion = typeof p.motion === 'string' && MOTIONS.includes(p.motion as never) ? p.motion : 'medium'

  return {
    provider,
    baseUrl,
    apiKey,
    model,
    prompt: prompt.trim(),
    mode,
    refImage: typeof refImage === 'string' ? refImage : undefined,
    params: {
      resolution,
      duration: clampInt(p.duration, 1, 16, 4),
      fps: clampInt(p.fps, 1, 60, 24),
      motion,
      batch: clampInt(p.batch, 1, 4, 1),
    },
  }
}
