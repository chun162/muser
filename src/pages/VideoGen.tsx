import { useEffect, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { mockGenerate } from '../lib/mockGenerate'
import { generateVideo, urlToBlob } from '../lib/api'
import { catLabel } from '../lib/format'
import type { GenParams } from '../types'

type Mode = 'text2video' | 'image2video' | 'firstlast'

interface Result {
  url: string
  blob?: Blob
}

const RESOLUTIONS = ['1024x576', '1280x720', '1920x1080']
const MOTIONS = ['low', 'medium', 'high']

export default function VideoGen() {
  const { styles, selectedStyleId, setSelectedStyleId, addGeneration, providers } = useApp()
  const [mode, setMode] = useState<Mode>('text2video')
  const [prompt, setPrompt] = useState('')
  const [refFile, setRefFile] = useState<File | null>(null)
  const [refUrl, setRefUrl] = useState<string | null>(null)
  const [params, setParams] = useState({ resolution: '1024x576', duration: 4, fps: 24, motion: 'medium' as string, batch: 1 })
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
        const res = await generateVideo({
          provider: activeProvider,
          model: activeProvider.defaultModel,
          prompt: finalPrompt(),
          mode,
          params,
        })
        setResults(res.videos.map((url) => ({ url })))
      } else {
        const genParams: GenParams = { resolution: params.resolution, steps: 30, sampler: 'dpmpp_2m', negativePrompt: '', batch: params.batch }
        const { images } = await mockGenerate({ prompt: finalPrompt(), params: genParams, style: selectedStyle ?? undefined, refImage: refFile })
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
        prompt: `[${mode}] ${prompt}`,
        refImage: refFile ?? undefined,
        params: { resolution: params.resolution, steps: 30, sampler: 'dpmpp_2m', negativePrompt: '', batch: params.batch },
        styleId: selectedStyle?.id,
        resultBlob: blob,
        createdAt: Date.now(),
      })
    } catch {
      setError('保存失败：无法获取视频（可能是跨域限制）')
    }
  }

  return (
    <section className="space-y-4">
      {!activeProvider && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Mock 模式：未配置启用的模型，视频用本地占位。前往「设置」配置 BYOK 后即出真视频。
        </div>
      )}
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <h1 className="text-xl font-bold">视频生成</h1>

      <div className="flex flex-wrap gap-2 text-sm">
        {(['text2video', 'image2video', 'firstlast'] as Mode[]).map((m) => (
          <button key={m} className={`rounded-full px-3 py-1 ${mode === m ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'}`} onClick={() => setMode(m)}>
            {m === 'text2video' ? '文生视频' : m === 'image2video' ? '图生视频' : '首尾帧'}
          </button>
        ))}
      </div>

      <textarea className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="一句话描述你想要的画面…" />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-neutral-400">画风：</span>
        <select className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={selectedStyleId ?? ''} onChange={(e) => setSelectedStyleId(e.target.value || null)}>
          <option value="">无（原画风）</option>
          {styles.map((s) => (<option key={s.id} value={s.id}>{s.name}（{catLabel(s.category)}）</option>))}
        </select>
        <Link to="/styles" className="text-emerald-300 hover:underline">从画风库选择 →</Link>
      </div>

      {mode !== 'text2video' && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-neutral-400">{mode === 'firstlast' ? '首帧/尾帧' : '参考图'}：</span>
          <input type="file" accept="image/*" onChange={pickRef} className="text-neutral-400" />
          {refUrl && <img src={refUrl} alt="参考" className="h-12 w-12 rounded border border-neutral-700 object-cover" />}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <label className="space-y-1">
          <span className="text-neutral-400">分辨率</span>
          <select className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.resolution} onChange={(e) => setParams({ ...params, resolution: e.target.value })}>
            {RESOLUTIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-neutral-400">时长(秒)</span>
          <input type="number" min={1} max={16} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.duration} onChange={(e) => setParams({ ...params, duration: Number(e.target.value) })} />
        </label>
        <label className="space-y-1">
          <span className="text-neutral-400">帧率</span>
          <input type="number" min={1} max={60} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.fps} onChange={(e) => setParams({ ...params, fps: Number(e.target.value) })} />
        </label>
        <label className="space-y-1">
          <span className="text-neutral-400">运动强度</span>
          <select className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={params.motion} onChange={(e) => setParams({ ...params, motion: e.target.value })}>
            {MOTIONS.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </label>
      </div>

      <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-50" onClick={onGenerate} disabled={!prompt.trim() || loading}>
        {loading ? '生成中…' : activeProvider ? '生成（真实模型）' : '生成（Mock）'}
      </button>

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((r, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-neutral-800 p-2">
              {r.blob ? (
                <img src={r.url} alt={`视频占位${i + 1}`} className="aspect-video w-full rounded object-cover" />
              ) : (
                <video src={r.url} controls className="aspect-video w-full rounded object-cover" />
              )}
              <button className="w-full rounded bg-neutral-800 py-1 text-xs hover:bg-neutral-700" onClick={() => saveOne(r)}>保存到作品</button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
