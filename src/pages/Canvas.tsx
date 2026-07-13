import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store/AppContext'
import { idb } from '../lib/db'

interface CanvasNode {
  id: string
  type: 'text' | 'image'
  content: string // text 内容；或 'gen:<id>' 引用作品
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
    setNodes((n) => [...n, { id: crypto.randomUUID(), type: 'text', content: t, x: 40 + Math.random() * 200, y: 40 + Math.random() * 120 }])
  }
  function addImage(genId: string) {
    setNodes((n) => [...n, { id: crypto.randomUUID(), type: 'image', content: `gen:${genId}`, x: 60 + Math.random() * 160, y: 60 + Math.random() * 100 }])
    setPickImg(false)
  }
  function remove(id: string) {
    setNodes((n) => n.filter((nd) => nd.id !== id))
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">无限画布</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={addText} className="rounded bg-emerald-500 px-3 py-1.5 font-semibold text-neutral-950">+ 文本</button>
          <button onClick={() => setPickImg((v) => !v)} className="rounded bg-neutral-800 px-3 py-1.5">+ 从作品加图</button>
        </div>
      </div>
      <p className="text-sm text-neutral-500">轻量画布（Mock）：拖拽移动、增删；自动持久化到本地。完整 tldraw 画布为 P3 进阶。</p>

      {pickImg && (
        <div className="flex flex-wrap gap-2">
          {generations.length === 0 && <span className="text-sm text-neutral-500">暂无作品图，先去图片生成出图</span>}
          {generations.map((g) => (
            <button key={g.id} onClick={() => addImage(g.id)} className="rounded border border-neutral-700 px-2 py-1 text-xs">
              使用 {g.prompt.slice(0, 12)}
            </button>
          ))}
        </div>
      )}

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
        onPointerUp={() => { drag.current = null }}
        className="relative h-[60vh] w-full touch-none overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
      >
        {nodes.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-600">点击右上「+ 文本 / + 从作品加图」开始</div>}
        {nodes.map((n) => (
          <div
            key={n.id}
            onPointerDown={(e) => {
              const rect = boardRef.current!.getBoundingClientRect()
              drag.current = { id: n.id, dx: e.clientX - rect.left - n.x, dy: e.clientY - rect.top - n.y }
              ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            }}
            className="absolute select-none cursor-move rounded border border-neutral-700 bg-neutral-800 p-1"
            style={{ left: n.x, top: n.y }}
          >
            {n.type === 'text' ? (
              <div className="max-w-[220px] px-2 py-1 text-sm">{n.content}</div>
            ) : (
              <CanvasImage genId={n.content.replace('gen:', '')} />
            )}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => remove(n.id)}
              className="mt-1 block text-xs text-red-400 hover:underline"
            >
              删除
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
  if (!g) return <div className="text-xs text-neutral-500">图已删除</div>
  return url ? <img src={url} alt="" className="h-24 w-24 object-cover" /> : null
}
