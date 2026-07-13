import { useEffect, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { mockGenerate } from '../lib/mockGenerate'
import { generateImage, urlToBlob } from '../lib/api'
import { catLabel } from '../lib/format'
import type { GenParams } from '../types'

interface Result {
  url: string
  blob?: Blob
}

const RESOLUTIONS = ['512x512', '1024x1024', '1024x768', '768x1024']
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
    setLoading(true)
    setError(null)
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
    } finally {
      setLoading(false)
    }
  }

  async function saveOne(r: Result) {
    try {
      const blob = r.blob ?? (await urlToBlob(r.url))
      addGeneration({
        id: crypto.randomUUID(),
        prompt,
        refImage: refFile ?? undefined,
        params,
        styleId: selectedStyle?.id,
        resultBlob: blob,
        createdAt: Date.now(),
      })
    } catch {
      setError('保存失败：无法获取图片（可能是跨域限制）')
    }
  }

  return (
    <section className="space-y-4">
      {!activeProvider && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Mock 模式：未配置启用的模型，生成走本地占位图。前往「设置」配置 BYOK 后即出真图。
        </div>
      )}
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <h1 className="text-xl font-bold">图片生成</h1>

      <textarea className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="一句话描述你想要的画面…" />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-neutral-400">画风：</span>
        <select className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={selectedStyleId ?? ''} onChange={(e) => setSelectedStyleId(e.target.value || null)}>
          <option value="">无（原图风）</option>
          {styles.map((s) => (<option key={s.id} value={s.id}>{s.name}（{catLabel(s.category)}）</option>))}
        </select>
        <Link to="/styles" className="text-emerald-300 hover:underline">从画风库选择 →</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-neutral-400">参考图（图生图）：</span>
        <input type="file" accept="image/*" onChange={pickRef} className="text-neutral-400" />
        {refUrl && <img src={refUrl} alt="参考" className="h-12 w-12 rounded border border-neutral-700 object-cover" />}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <label className="space-y-1">
          <span className="text-neutral-400">分辨率</span>
          <select className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.resolution} onChange={(e) => setParams({ ...params, resolution: e.target.value })}>
            {RESOLUTIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-neutral-400">步数</span>
          <input type="number" min={1} max={100} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.steps} onChange={(e) => setParams({ ...params, steps: Number(e.target.value) })} />
        </label>
        <label className="space-y-1">
          <span className="text-neutral-400">采样器</span>
          <select className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.sampler} onChange={(e) => setParams({ ...params, sampler: e.target.value })}>
            {SAMPLERS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-neutral-400">批量张数</span>
          <input type="number" min={1} max={4} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.batch} onChange={(e) => setParams({ ...params, batch: Number(e.target.value) })} />
        </label>
      </div>

      <div className="space-y-1 text-sm">
        <span className="text-neutral-400">负面提示词</span>
        <input className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.negativePrompt} onChange={(e) => setParams({ ...params, negativePrompt: e.target.value })} placeholder="可选" />
      </div>

      <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-50" onClick={onGenerate} disabled={!prompt.trim() || loading}>
        {loading ? '生成中…' : activeProvider ? '生成（真实模型）' : '生成（Mock）'}
      </button>

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((r, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-neutral-800 p-2">
              <img src={r.url} alt={`结果${i + 1}`} className="aspect-square w-full rounded object-cover" />
              <button className="w-full rounded bg-neutral-800 py-1 text-xs hover:bg-neutral-700" onClick={() => saveOne(r)}>保存到作品</button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
