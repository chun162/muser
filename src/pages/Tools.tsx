import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import { mockGenerate } from '../lib/mockGenerate'
import type { GenParams } from '../types'

const OPS = ['扩图(outpaint)', '局部重绘(inpaint)', '超分(upscale)'] as const
const DEFAULT_PARAMS: GenParams = { resolution: '1024x1024', steps: 30, sampler: 'dpmpp_2m', negativePrompt: '', batch: 1 }

export default function Tools() {
  const { generations, addGeneration } = useApp()
  const [sel, setSel] = useState('')
  const [op, setOp] = useState<(typeof OPS)[number]>(OPS[0])
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

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">AI 工具箱</h1>
      <p className="text-sm text-neutral-400">选择一张作品图，执行后处理（Mock 占位）。真实接入复用 `POST /api/generate`。</p>

      <div className="space-y-2 text-sm">
        <label className="block space-y-1">
          <span className="text-neutral-400">来源作品</span>
          <select className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">请选择</option>
            {generations.map((g) => (
              <option key={g.id} value={g.id}>{g.prompt.slice(0, 24)}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-neutral-400">操作</span>
          <select className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-1.5" value={op} onChange={(e) => setOp(e.target.value as (typeof OPS)[number])}>
            {OPS.map((o) => (<option key={o} value={o}>{o}</option>))}
          </select>
        </label>
      </div>

      <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-50" onClick={run} disabled={!selected || loading}>
        {loading ? '处理中…' : '执行'}
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="mb-2 text-sm text-neutral-400">原图</h2>
          {selected ? <GenImg gen={selected} /> : <div className="aspect-square w-full rounded border border-neutral-800" />}
        </div>
        <div>
          <h2 className="mb-2 text-sm text-neutral-400">结果（Mock）</h2>
          {out ? (
            <div className="space-y-2">
              <img src={out.url} alt="结果" className="aspect-square w-full rounded object-cover" />
              <button className="w-full rounded bg-neutral-800 py-1 text-xs hover:bg-neutral-700" onClick={save}>保存到作品</button>
            </div>
          ) : (
            <div className="aspect-square w-full rounded border border-neutral-800" />
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
  return url ? <img src={url} alt="" className="aspect-square w-full rounded object-cover" /> : <div className="aspect-square w-full rounded border border-neutral-800" />
}
