import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { mockGenerate } from '../lib/mockGenerate'
import type { GenParams } from '../types'

const DEFAULT_PARAMS: GenParams = { resolution: '1024x1024', steps: 30, sampler: 'dpmpp_2m', negativePrompt: '', batch: 1 }

export default function Tools() {
  const { generations, addGeneration } = useApp()
  const [sel, setSel] = useState('')
  const [op, setOp] = useState<string>('outpaint')
  const [loading, setLoading] = useState(false)
  const [out, setOut] = useState<{ blob: Blob; url: string } | null>(null)

  const selected = generations.find((g) => g.id === sel)

  async function run() {
    if (!selected || loading) return
    setLoading(true)
    const { images } = await mockGenerate({ prompt: `${op} of ${selected.prompt}`, params: DEFAULT_PARAMS })
    setOut({ blob: images[0], url: URL.createObjectURL(images[0]) })
    setLoading(false)
  }
  function save() {
    if (!out) return
    addGeneration({ id: crypto.randomUUID(), prompt: `${op} → ${selected?.prompt || ''}`, params: DEFAULT_PARAMS, resultBlob: out.blob, createdAt: Date.now() })
    setOut(null)
  }

  const OPS = [
    { value: 'outpaint', label: '扩图', icon: '↔️' },
    { value: 'inpaint', label: '局部重绘', icon: '🖌️' },
    { value: 'upscale', label: '超分', icon: '🔍' },
    { value: 'remove-subtitle', label: '消除字幕', icon: '🔇' },
    { value: 'ai-voice', label: 'AI 配音', icon: '🎙️' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI 工具箱</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>扩图 / 局部重绘 / 超分 / 消除字幕 / AI 配音</p>
      </div>

      {/* 工具选择 */}
      <div className="grid grid-cols-5 gap-2">
        {OPS.map((o) => (
          <button key={o.value} onClick={() => setOp(o.value)}
            className="surface-card flex flex-col items-center gap-1 py-3 text-xs"
            style={{
              borderColor: op === o.value ? 'var(--accent-border)' : undefined,
              backgroundColor: op === o.value ? 'var(--accent-bg)' : undefined,
            }}>
            <span className="text-lg">{o.icon}</span>
            <span style={{ color: op === o.value ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>{o.label}</span>
          </button>
        ))}
      </div>

      {/* 选择作品 */}
      {generations.length === 0 ? (
        <div className="rounded-xl py-10 text-center" style={{ color: 'var(--text-muted)' }}>
          <p>暂无作品，先去「图片生成」出图</p>
        </div>
      ) : (
        <select className="w-full rounded-lg border p-2 text-sm"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
          value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">选择一张作品</option>
          {generations.map((g) => (
            <option key={g.id} value={g.id}>{g.prompt.slice(0, 40)}</option>
          ))}
        </select>
      )}

      {selected && (
        <div className="flex items-center gap-3">
          <img src={URL.createObjectURL(selected.resultBlob)} alt="" className="h-16 w-16 rounded-lg border object-cover"
            style={{ borderColor: 'var(--border-primary)' }} />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{selected.prompt}</span>
        </div>
      )}

      <button className="btn-brand" onClick={run} disabled={!sel || loading}>
        {loading ? '处理中…' : `执行 ${OPS.find((o) => o.value === op)?.label || op}`}
      </button>

      {out && (
        <div className="fade-in-up space-y-3">
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>结果</h2>
          <div className="surface-card overflow-hidden inline-block" style={{ padding: 0 }}>
            <img src={out.url} alt="" className="max-w-[400px] w-full object-contain" />
            <div className="p-2">
              <button className="btn-brand text-xs" onClick={save}>保存到作品</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
