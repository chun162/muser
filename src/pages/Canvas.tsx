import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store/AppContext'
import { idb } from '../lib/db'

interface CanvasNode {
  id: string
  type: 'text' | 'image'
  content: string
  x: number
  y: number
}

const PROJECT_ID = 'canvas-default'

export default function Canvas() {
  const { generations } = useApp()
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [pickImg, setPickImg] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)

  useEffect(() => {
    idb.getAll<{ id: string; nodes: CanvasNode[] }>('projects').then((list) => {
      const p = list.find((x) => x.id === PROJECT_ID)
      if (p?.nodes) setNodes(p.nodes)
    })
  }, [])

  useEffect(() => {
    idb.put('projects', { id: PROJECT_ID, name: '我的画布', nodes, updatedAt: Date.now() })
  }, [nodes])

  function addText() {
    const t = prompt('输入文本')
    if (!t) return
    setNodes((n) => [...n, { id: crypto.randomUUID(), type: 'text', content: t, x: 120 + Math.random() * 300, y: 80 + Math.random() * 200 }])
  }
  function addImage(genId: string) {
    setNodes((n) => [...n, { id: crypto.randomUUID(), type: 'image', content: `gen:${genId}`, x: 120 + Math.random() * 300, y: 80 + Math.random() * 200 }])
    setPickImg(false)
  }
  function remove(id: string) {
    setNodes((n) => n.filter((nd) => nd.id !== id))
  }

  const nodeCount = nodes.length

  return (
    <section className="space-y-4">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold">无限画布</h1>
        <p className="mt-1 text-sm text-neutral-500">拖拽移动 · 增删节点 · 自动本地持久化</p>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-2.5 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={addText}
            className="rounded-lg bg-emerald-500/15 px-3 py-1.5 font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25"
          >
            + 文本
          </button>
          <button
            onClick={() => setPickImg((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 transition-colors ${
              pickImg
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            + 从作品加图
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>{nodeCount} 个节点</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">轻量画布 · P3 升级为完整 tldraw</span>
        </div>
      </div>

      {/* 作品选择器 */}
      {pickImg && (
        <div className="animate-fade-up rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">选择一张作品添加到画布</span>
            <button
              onClick={() => setPickImg(false)}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              关闭 ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {generations.length === 0 && (
              <span className="text-sm text-neutral-500">暂无作品图，先去图片生成出图</span>
            )}
            {generations.map((g) => (
              <button
                key={g.id}
                onClick={() => addImage(g.id)}
                className="rounded-lg border border-neutral-700 bg-neutral-800/60 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-emerald-500/40 hover:bg-neutral-800"
              >
                {g.prompt.slice(0, 20)}…
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 画布区域 */}
      <div
        ref={boardRef}
        onPointerMove={(e) => {
          if (!drag.current || !boardRef.current) return
          const rect = boardRef.current.getBoundingClientRect()
          const { id, dx, dy } = drag.current
          setNodes((ns) =>
            ns.map((nd) => (nd.id === id ? { ...nd, x: e.clientX - rect.left - dx, y: e.clientY - rect.top - dy } : nd)),
          )
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        className="relative h-[65vh] w-full touch-none overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-900/60"
      >
        {/* 格子背景 */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ opacity: 0.04 }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm text-neutral-600">
            <span className="text-2xl">✏️</span>
            <p>点击工具栏添加节点</p>
            <p className="text-xs">拖拽移动 · 点击 x 删除</p>
          </div>
        )}

        {/* 节点 */}
        {nodes.map((n) => (
          <div
            key={n.id}
            onPointerDown={(e) => {
              const rect = boardRef.current!.getBoundingClientRect()
              drag.current = {
                id: n.id,
                dx: e.clientX - rect.left - n.x,
                dy: e.clientY - rect.top - n.y,
              }
              ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            }}
            className="absolute cursor-move select-none overflow-hidden rounded-xl border border-neutral-700/60 bg-neutral-800/70 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-emerald-500/10 hover:shadow-xl"
            style={{ left: n.x, top: n.y }}
          >
            {n.type === 'text' ? (
              <div className="max-w-[220px] px-3 py-2 text-sm text-neutral-200">{n.content}</div>
            ) : (
              <CanvasImage genId={n.content.replace('gen:', '')} />
            )}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => remove(n.id)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-[10px] text-neutral-400 opacity-0 transition-opacity hover:bg-red-500/60 hover:text-white group-hover:opacity-100"
              title="删除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function CanvasImage({ genId }: { genId: string }) {
  const { generations } = useApp()
  const [url, setUrl] = useState('')
  const g = generations.find((x) => x.id === genId)
  useEffect(() => {
    if (!g) return
    const u = URL.createObjectURL(g.resultBlob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [g])
  if (!g) return <div className="px-3 py-2 text-xs text-neutral-500">图已删除</div>
  return url ? <img src={url} alt="" className="h-28 w-28 object-cover" /> : null
}
