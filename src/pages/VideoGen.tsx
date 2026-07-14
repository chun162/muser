import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { mockGenerate } from '../lib/mockGenerate'
import { generateVideoDirect, urlToBlob } from '../lib/api'

type Mode = 'text2video' | 'image2video'

interface Result { url: string; blob?: Blob }

const RESOLUTIONS = ['1024x576', '1280x720', '1920x1080']

export default function VideoGen() {
  const { addGeneration, providers } = useApp()
  const [mode, setMode] = useState<Mode>('text2video')
  const [prompt, setPrompt] = useState('')
  const [refFile, setRefFile] = useState<File | null>(null)
  const [refUrl, setRefUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [error, setError] = useState<string | null>(null)

  const activeProvider = providers.find((p) => p.enabled && p.defaultModel.toLowerCase().includes('seedance')) ?? null

  function pickRef(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setRefFile(f); setRefUrl(f ? URL.createObjectURL(f) : null)
  }

  async function onGenerate() {
    if (!prompt.trim() || loading) return
    setLoading(true); setError(null)
    try {
      const blob = await generateVideoDirect(activeProvider!, prompt, refFile!)
      setResults([{ blob, url: URL.createObjectURL(blob) }])
    } catch (e) {
      // Mock fallback
      try {
        const { images } = await mockGenerate({ prompt, params: { resolution: '1024x576', steps: 20, sampler: 'euler', negativePrompt: '', batch: 1 } })
        setResults([{ blob: images[0], url: URL.createObjectURL(images[0]) }])
      } catch { setError(String(e)) }
    } finally { setLoading(false) }
  }

  async function saveOne(r: Result) {
    const blob = r.blob ?? (await urlToBlob(r.url))
    if (!blob) return
    addGeneration({ id: crypto.randomUUID(), prompt, refImage: refFile ?? undefined, params: { resolution: '1024x576', steps: 20, sampler: 'euler', negativePrompt: '', batch: 1 }, resultBlob: blob, createdAt: Date.now() })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>视频生成</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>文生视频 / 图生视频 / Seedance 驱动</p>
      </div>

      {!activeProvider && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}>
          ⚠ 未配置 Seedance API Key。
          前往 <Link to="/settings" className="underline">设置</Link> 添加。
        </div>
      )}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>{error}</div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-2 text-sm">
        {[
          { key: 'text2video' as Mode, label: '文生视频', icon: '📝' },
          { key: 'image2video' as Mode, label: '图生视频', icon: '🖼️' },
        ].map((m) => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className="rounded-lg px-4 py-2 font-medium transition-colors"
            style={{
              backgroundColor: mode === m.key ? 'var(--accent-bg)' : 'var(--bg-surface)',
              color: mode === m.key ? 'var(--accent-text)' : 'var(--text-tertiary)',
              border: `1px solid ${mode === m.key ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* 提示词 */}
      <textarea className="w-full rounded-xl border p-3 text-sm" rows={3}
        placeholder="描述你想要的视频画面…"
        value={prompt} onChange={(e) => setPrompt(e.target.value)}
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />

      {/* 图生视频 */}
      {mode === 'image2video' && (
        <div className="flex items-center gap-3 text-sm">
          <span style={{ color: 'var(--text-tertiary)' }}>起始图</span>
          <label className="cursor-pointer rounded-lg border px-3 py-1.5 transition-colors"
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
            {refFile ? refFile.name.slice(0, 16) : '上传图片'}
            <input type="file" accept="image/*" onChange={pickRef} className="hidden" />
          </label>
          {refUrl && <img src={refUrl} alt="" className="h-10 w-10 rounded border object-cover" style={{ borderColor: 'var(--border-primary)' }} />}
        </div>
      )}

      <button className="btn-brand" onClick={onGenerate} disabled={!prompt.trim() || loading}>
        {loading ? '生成中…' : '生成视频'}
      </button>

      {results.length > 0 && (
        <div className="fade-in-up space-y-3">
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>结果</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {results.map((r, i) => (
              <div key={i} className="surface-card overflow-hidden" style={{ padding: 0 }}>
                <video src={r.url} controls className="w-full aspect-video object-cover" />
                <div className="p-2">
                  <button className="w-full rounded-lg py-1.5 text-xs transition-colors"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
                    onClick={() => saveOne(r)}>保存</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
