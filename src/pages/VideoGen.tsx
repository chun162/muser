import { useEffect, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { mockGenerate } from '../lib/mockGenerate'
import { generateVideo, urlToBlob } from '../lib/api'
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
    <section className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold">视频生成</h1>
        <p className="mt-1 text-sm text-neutral-500">文生视频 · 图生视频 · 首尾帧</p>
      </div>

      {!activeProvider && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span className="font-semibold">Mock 模式</span> — 未配置启用的模型，生成走本地占位。
          前往 <Link to="/settings" className="underline hover:text-amber-100">设置</Link> 配置 BYOK 后即出真视频。
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* 模式 tabs */}
      <div className="flex flex-wrap gap-2 text-sm">
        {(['text2video', 'image2video', 'firstlast'] as Mode[]).map((m) => (
          <button
            key={m}
            className={`rounded-full px-3.5 py-1.5 transition-colors ${
              mode === m
                ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                : 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
            }`}
            onClick={() => setMode(m)}
          >
            {m === 'text2video' ? '文生视频' : m === 'image2video' ? '图生视频' : '首尾帧'}
          </button>
        ))}
      </div>

      {/* 提示词 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-300">提示词</label>
        <textarea
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-sm placeholder-neutral-600 transition-colors focus:border-emerald-500/40 focus:bg-neutral-900"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要的视频画面…"
        />
      </div>

      {/* 画风 + 参考图 */}
      <div className="flex flex-wrap items-start gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">画风</span>
          <select
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200"
            value={selectedStyleId ?? ''}
            onChange={(e) => setSelectedStyleId(e.target.value || null)}
          >
            <option value="">默认</option>
            {styles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Link to="/styles" className="text-emerald-400 hover:underline">
            浏览画风库
          </Link>
        </div>
        {mode !== 'text2video' && (
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">{mode === 'firstlast' ? '首帧/尾帧' : '参考图'}</span>
            <label className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 transition-colors">
              {refFile ? refFile.name.slice(0, 12) : '选择图片'}
              <input type="file" accept="image/*" onChange={pickRef} className="hidden" />
            </label>
            {refUrl && (
              <img src={refUrl} alt="参考" className="h-8 w-8 rounded border border-neutral-700 object-cover" />
            )}
            {refUrl && (
              <button onClick={() => { setRefFile(null); setRefUrl(null) }} className="text-xs text-red-400 hover:underline">
                取消
              </button>
            )}
          </div>
        )}
      </div>

      {/* 参数卡片 */}
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-300">参数设置</span>
          {!activeProvider && (
            <span className="text-xs text-emerald-400">仅 Mock 模式下可用</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <label className="space-y-1">
            <span className="text-neutral-500">分辨率</span>
            <select
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200"
              value={params.resolution}
              onChange={(e) => setParams({ ...params, resolution: e.target.value })}
            >
              {RESOLUTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-neutral-500">时长（秒）</span>
            <input
              type="number"
              min={1}
              max={16}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200"
              value={params.duration}
              onChange={(e) => setParams({ ...params, duration: Number(e.target.value) })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-neutral-500">帧率</span>
            <input
              type="number"
              min={1}
              max={60}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200"
              value={params.fps}
              onChange={(e) => setParams({ ...params, fps: Number(e.target.value) })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-neutral-500">运动强度</span>
            <select
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200"
              value={params.motion}
              onChange={(e) => setParams({ ...params, motion: e.target.value })}
            >
              {MOTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        className="btn-glow w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:opacity-40 sm:w-auto sm:px-8"
        onClick={onGenerate}
        disabled={!prompt.trim() || loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
            生成中…
          </span>
        ) : activeProvider ? (
          `生成视频${activeProvider.defaultModel ? `（${activeProvider.defaultModel}）` : ''}`
        ) : (
          '生成（Mock）'
        )}
      </button>

      {/* 结果 */}
      {results.length > 0 && (
        <div className="animate-fade-up space-y-3">
          <h2 className="text-sm font-medium text-neutral-300">生成结果</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((r, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-900/40">
                {r.blob ? (
                  <img
                    src={r.url}
                    alt={`视频占位 ${i + 1}`}
                    className="aspect-video w-full rounded-t-xl object-cover transition-transform group-hover:scale-[1.02]"
                  />
                ) : (
                  <video
                    src={r.url}
                    controls
                    className="aspect-video w-full rounded-t-xl object-cover"
                  />
                )}
                <div className="p-2">
                  <button
                    className="w-full rounded-lg bg-neutral-800 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-emerald-500 hover:text-neutral-950 hover:font-semibold"
                    onClick={() => saveOne(r)}
                  >
                    保存到作品
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
