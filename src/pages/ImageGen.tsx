import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useEffect, useState, type ChangeEvent } from 'react'
import { generateImage, urlToBlob } from '../lib/api'
import { mockGenerate } from '../lib/mockGenerate'
import type { GenParams } from '../types'

interface Result { url: string; blob?: Blob }

const RESOLUTIONS = ['1024x1024', '1024x768', '768x1024', '512x512']
const SAMPLERS = ['dpmpp_2m', 'dpmpp_2m_karras', 'euler', 'euler_a', 'ddim']

export default function ImageGen() {
  const { styles, selectedStyleId, setSelectedStyleId, addGeneration, providers } = useApp()
  const [prompt, setPrompt] = useState('')
  const [refFile, setRefFile] = useState<File | null>(null)
  const [refUrl, setRefUrl] = useState<string | null>(null)
  const [params, setParams] = useState<GenParams>({ resolution: '1024x1024', steps: 30, sampler: 'dpmpp_2m', negativePrompt: '', batch: 1 })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [error, setError] = useState<string | null>(null)

  const selectedStyle = styles.find((s) => s.id === selectedStyleId) ?? null
  const activeProvider = providers.find((p) => p.enabled) ?? null

  useEffect(() => {
    const urls = [...results.map((r) => r.url), refUrl].filter(Boolean) as string[]
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [results, refUrl])

  function pickRef(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setRefFile(f)
    setRefUrl(f ? URL.createObjectURL(f) : null)
  }

  function finalPrompt(): string {
    return selectedStyle ? selectedStyle.promptTemplate.replace('{prompt}', prompt) : prompt
  }

  async function onGenerate() {
    if (!prompt.trim() || loading) return
    setLoading(true); setError(null)
    try {
      if (activeProvider) {
        const res = await generateImage({ provider: activeProvider, model: activeProvider.defaultModel, prompt: finalPrompt(), params })
        setResults(res.images.map((url) => ({ url })))
      } else {
        const { images } = await mockGenerate({ prompt: finalPrompt(), params, style: selectedStyle ?? undefined, refImage: refFile })
        setResults(images.map((b) => ({ blob: b, url: URL.createObjectURL(b) })))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally { setLoading(false) }
  }

  async function saveOne(r: Result) {
    const blob = r.blob ?? (await urlToBlob(r.url))
    if (!blob) { setError('保存失败：无法获取图片'); return }
    addGeneration({ id: crypto.randomUUID(), prompt, refImage: refFile ?? undefined, params, styleId: selectedStyle?.id, resultBlob: blob, createdAt: Date.now() })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>图片生成</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>文生图 / 图生图 / 多画风 / 批量出图</p>
      </div>

      {!activeProvider && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}>
          ⚠ Mock 模式，未配置 API Key。
          前往 <Link to="/settings" className="underline hover:opacity-80">设置</Link> 配置。
        </div>
      )}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>
          {error}
        </div>
      )}

      {/* 提示词 */}
      <div className="space-y-2">
        <textarea
          className="w-full rounded-xl border p-3 text-sm transition-colors"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要的画面…"
          style={{
            backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-4" style={{ color: 'var(--text-tertiary)' }}>
        <div className="flex items-center gap-2 text-sm">
          <span>画风</span>
          <select
            className="rounded-lg border p-1.5 text-sm"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            value={selectedStyleId ?? ''}
            onChange={(e) => setSelectedStyleId(e.target.value || null)}
          >
            <option value="">默认</option>
            {styles.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          <Link to="/styles" style={{ color: 'var(--accent-text)' }}>画风库</Link>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span>参考图</span>
          <label className="cursor-pointer rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-surface)' }}>
            {refFile ? refFile.name.slice(0, 12) : '上传'}
            <input type="file" accept="image/*" onChange={pickRef} className="hidden" />
          </label>
          {refUrl && <img src={refUrl} alt="" className="h-8 w-8 rounded border object-cover" style={{ borderColor: 'var(--border-primary)' }} />}
          {refUrl && <button onClick={() => { setRefFile(null); setRefUrl(null) }} style={{ color: 'var(--error)' }}>✕</button>}
        </div>
      </div>

      {/* 参数 */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mb-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>参数</div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <label className="space-y-1">
            <span style={{ color: 'var(--text-muted)' }}>尺寸</span>
            <select className="w-full rounded-lg border p-1.5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              value={params.resolution} onChange={(e) => setParams({ ...params, resolution: e.target.value })}>
              {RESOLUTIONS.map((r) => (<option key={r}>{r}</option>))}
            </select>
          </label>
          <label className="space-y-1">
            <span style={{ color: 'var(--text-muted)' }}>步数</span>
            <input type="number" min={1} max={100} className="w-full rounded-lg border p-1.5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              value={params.steps} onChange={(e) => setParams({ ...params, steps: Number(e.target.value) })} />
          </label>
          <label className="space-y-1">
            <span style={{ color: 'var(--text-muted)' }}>采样器</span>
            <select className="w-full rounded-lg border p-1.5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              value={params.sampler} onChange={(e) => setParams({ ...params, sampler: e.target.value })}>
              {SAMPLERS.map((s) => (<option key={s}>{s}</option>))}
            </select>
          </label>
          <label className="space-y-1">
            <span style={{ color: 'var(--text-muted)' }}>批数</span>
            <input type="number" min={1} max={4} className="w-full rounded-lg border p-1.5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              value={params.batch} onChange={(e) => setParams({ ...params, batch: Number(e.target.value) })} />
          </label>
        </div>
        <div className="mt-3 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>负面提示词</span>
          <input className="mt-1 w-full rounded-lg border p-1.5" placeholder="不想看到的…"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            value={params.negativePrompt} onChange={(e) => setParams({ ...params, negativePrompt: e.target.value })} />
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        className="btn-brand w-full justify-center sm:w-auto sm:px-10"
        onClick={onGenerate}
        disabled={!prompt.trim() || loading}
      >
        {loading ? '生成中…' : activeProvider ? '生成图片' : 'Mock 生成'}
      </button>

      {/* 结果 */}
      {results.length > 0 && (
        <div className="fade-in-up space-y-3">
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>结果</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((r, i) => (
              <div key={i} className="surface-card overflow-hidden" style={{ padding: 0 }}>
                <img src={r.url} alt="" className="aspect-square w-full object-cover" />
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
