import type { GenParams, Style } from '../types'

// Mock 生成 — 遵循 docs/specs/04 / 06，但「先不要接后端」：
// 不发起任何真实网络请求，本地用 canvas 生成占位图（Blob），仅用于跑通前端流程。

export interface MockGenInput {
  prompt: string
  params: GenParams
  style?: Style
  refImage?: File | null
}

function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return Math.abs(h)
}

function makePlaceholder(prompt: string, label: string, hue: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('canvas unavailable'))
  const g = ctx.createLinearGradient(0, 0, 512, 512)
  g.addColorStop(0, `hsl(${hue}, 68%, 46%)`)
  g.addColorStop(1, `hsl(${(hue + 45) % 360}, 68%, 30%)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText(label, 24, 58)
  ctx.font = '18px sans-serif'
  const text = prompt.length > 56 ? prompt.slice(0, 56) + '…' : prompt
  ctx.fillText(text, 24, 108)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '14px sans-serif'
  ctx.fillText('珑点智算 · Muse · Mock 占位图', 24, 488)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
}

export function mockGenerate(input: MockGenInput): Promise<{ images: Blob[] }> {
  const count = Math.max(1, Math.min(input.params.batch || 1, 4))
  const baseHue = input.style ? hashHue(input.style.id) : 205
  const delay = 600 + Math.random() * 700
  return new Promise((resolve) => {
    setTimeout(() => {
      const images: Blob[] = []
      let done = 0
      for (let i = 0; i < count; i++) {
        const hue = (baseHue + i * 26) % 360
        const label = input.style?.name ?? '默认画风'
        makePlaceholder(input.prompt, label, hue).then((blob) => {
          images.push(blob)
          done++
          if (done === count) resolve({ images })
        })
      }
    }, delay)
  })
}
