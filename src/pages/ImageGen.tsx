import { useEffect, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { mockGenerate } from '../lib/mockGenerate'
import { generateImage, urlToBlob } from '../lib/api'
import type { GenParams } from '../types'

interface Result {
  url: string
  blob?: Blob
}

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
    <section className="space-y-6">
      {/* 页头标题 */}
      <div>
        <h1 className="text-2xl font-bold">图片生成</h1>
        <p className="mt-1 text-sm text-neutral-500">文生图 · 图生图 · 多画风 · 批量出图</p>
      </div>

      {!activeProvider && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span className="font-semibold">Mock 模式</span> — 未配置启用的模型，生成走本地占位图。
          前往 <Link to="/settings" className="underline hover:text-amber-100">设置</Link> 配置 BYOK 后即出真图。
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* 提示词输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-300">提示词</label>
        <textarea
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-sm placeholder-neutral-600 transition-colors focus:border-emerald-500/40 focus:bg-neutral-900"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入一句话，描述你想要的画面…"
        />
      </div>

      {/* 画风选择 + 图生图 */}
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
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">参考图</span>
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
      </div>

      {/* 参数设置 */}
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-300">参数设置</span>
          {!activeProvider && (
            <span className="text-xs text-emerald-400">仅 Mock 模式下可用</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <label className="space-y-1">
            <span className="text-neutral-500">出图尺寸</span>
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
            <span className="text-neutral-500">生成步数</span>
            <input
              type="number"
              min={1}
              max={100}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200"
              value={params.steps}
              onChange={(e) => setParams({ ...params, steps: Number(e.target.value) })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-neutral-500">采样器</span>
            <select
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200"
              value={params.sampler}
              onChange={(e) => setParams({ ...params, sampler: e.target.value })}
            >
              {SAMPLERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-neutral-500">批量张数</span>
            <input
              type="number"
              min={1}
              max={4}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200"
              value={params.batch}
              onChange={(e) => setParams({ ...params, batch: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <span className="text-neutral-500">负面提示词（可选）</span>
          <input
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-200 placeholder-neutral-600"
            value={params.negativePrompt}
            onChange={(e) => setParams({ ...params, negativePrompt: e.target.value })}
            placeholder="不想出现在画面中的内容…"
          />
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        className="btn-glow w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:opacity-40 disabled:btn-glow-none sm:w-auto sm:px-8"
        onClick={onGenerate}
        disabled={!prompt.trim() || loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
            生成中…
          </span>
        ) : activeProvider ? (
          `生成图片${activeProvider.defaultModel ? `（${activeProvider.defaultModel}）` : ''}`
        ) : (
          '生成（Mock）'
        )}
      </button>

      {/* 结果展示 */}
      {results.length > 0 && (
        <div className="animate-fade-up space-y-3">
          <h2 className="text-sm font-medium text-neutral-300">生成结果</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((r, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-900/40">
                <img
                  src={r.url}
                  alt={`生成结果 ${i + 1}`}
                  className="aspect-square w-full rounded-t-xl object-cover transition-transform group-hover:scale-[1.02]"
                />
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
