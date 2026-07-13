import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import { mockGenerate } from '../lib/mockGenerate'
import type { GenParams } from '../types'

const OPS = [
  { value: 'outpaint' as const, label: '扩图 (Outpaint)', icon: '↔️' },
  { value: 'inpaint' as const, label: '局部重绘 (Inpaint)', icon: '🖌️' },
  { value: 'upscale' as const, label: '超分 (Upscale)', icon: '🔍' },
]
const DEFAULT_PARAMS: GenParams = { resolution: '1024x1024', steps: 30, sampler: 'dpmpp_2m', negativePrompt: '', batch: 1 }

export default function Tools() {
  const { generations, addGeneration } = useApp()
  const [sel, setSel] = useState('')
  const [op, setOp] = useState<(typeof OPS)[number]['value']>('outpaint')
  const [loading, setLoading] = useState(false)
  const [out, setOut] = useState<{ blob: Blob; url: string } | null>(null)

  const selected = generations.find((g) => g.id === sel) ?? null

  async function run() {
    if (!selected || loading) return
    setLoading(true)
    const { images } = await mockGenerate({ prompt: `${op} of ${selected.prompt}`, params: DEFAULT_PARAMS })
    setOut({ blob: images[0], url: URL.createObjectURL(images[0]) })
    setLoading(false)
  }
  function save() {
    if (!out) return
    addGeneration({
      id: crypto.randomUUID(),
      prompt: `[${op}] ${selected?.prompt ?? ''}`,
      params: DEFAULT_PARAMS,
      resultBlob: out.blob,
      createdAt: Date.now(),
    })
  }

  const opObj = OPS.find((o) => o.value === op)!

  return (
    <section className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold">AI 工具箱</h1>
        <p className="mt-1 text-sm text-neutral-500">扩图 · 局部重绘 · 超分 — 对已有作品进行后处理</p>
      </div>

      {/* 选择来源 */}
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-4">
        <div className="mb-4 space-y-3 text-sm">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-neutral-300">来源作品</span>
            <select
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-200 transition-colors focus:border-emerald-500/40"
              value={sel}
              onChange={(e) => {
                setSel(e.target.value)
                setOut(null)
              }}
            >
              <option value="">请选择一张作品</option>
              {generations.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.prompt.slice(0, 36)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-neutral-300">操作类型</span>
            <div className="flex flex-wrap gap-2">
              {OPS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setOp(o.value)
                    setOut(null)
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    op === o.value
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-base">{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </label>
        </div>

        <button
          className="btn-glow rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:opacity-40"
          onClick={run}
          disabled={!selected || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
              处理中…
            </span>
          ) : (
            `执行 ${opObj.label.split('(')[0].trim()}`
          )}
        </button>
      </div>

      {/* 对比区域 */}
      <div className="animate-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-4">
          <h2 className="mb-3 text-sm font-medium text-neutral-300">原图</h2>
          {selected ? (
            <GenImg gen={selected} />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-neutral-800 text-xs text-neutral-600">
              选择作品
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-300">
              结果
              <span className="ml-1.5 text-xs text-neutral-500">(Mock)</span>
            </h2>
            {out && (
              <button
                className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25"
                onClick={save}
              >
                保存到作品
              </button>
            )}
          </div>
          {out ? (
            <div className="space-y-2">
              <img
                src={out.url}
                alt="结果"
                className="aspect-square w-full rounded-lg object-cover transition-transform hover:scale-[1.01]"
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-neutral-800 text-xs text-neutral-600">
              执行后显示
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function GenImg({ gen }: { gen: { resultBlob: Blob } }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const u = URL.createObjectURL(gen.resultBlob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [gen])
  return url ? (
    <img src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
  ) : (
    <div className="aspect-square w-full animate-pulse rounded-lg bg-neutral-800" />
  )
}
