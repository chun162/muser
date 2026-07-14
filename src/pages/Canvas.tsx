import { useEffect, useState, useRef, useCallback } from 'react'
import { Tldraw, exportAs, type TLEditorSnapshot } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useApp } from '../store/AppContext'
import { idb } from '../lib/db'

const PROJECT_ID = 'canvas-default'

export default function Canvas() {
  const { generations } = useApp()
  const [snapshot, setSnapshot] = useState<TLEditorSnapshot | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [pickImg, setPickImg] = useState(false)
  const editorRef = useRef<any>(null)

  // 加载持久化的画布数据
  useEffect(() => {
    idb
      .getAll<{ id: string; snapshot?: TLEditorSnapshot }>('projects')
      .then((list) => {
        const p = list.find((x) => x.id === PROJECT_ID)
        if (p?.snapshot) setSnapshot(p.snapshot)
      })
      .finally(() => setLoading(false))
  }, [])

  // tldraw 挂载
  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor

    // 首次打开且无 snapshot：创建引导节点
    if (!snapshot) {
      const centre = { x: 400, y: 200 }
      editor.createShapes([
        {
          id: 'shape:welcome',
          type: 'text',
          x: centre.x - 120,
          y: centre.y,
          props: {
            color: 'white',
            size: 'xl',
            text: '欢迎使用无限画布 🎨',
            font: 'draw',
            w: 400,
          },
        },
        {
          id: 'shape:tip1',
          type: 'text',
          x: centre.x - 120,
          y: centre.y + 60,
          props: {
            color: 'grey',
            size: 'm',
            text: '• 左侧工具栏选择绘图工具\n• 右侧可调整样式（颜色/粗细/填充）\n• 按 S 切换到选择工具\n• 从作品列表中拖入图片到画布',
            font: 'sans',
            w: 500,
          },
        },
        {
          id: 'shape:tip2',
          type: 'arrow',
          x: centre.x + 280,
          y: centre.y + 120,
          props: { color: 'grey', dash: 'draw', arrowheadStart: 'none', arrowheadEnd: 'arrow' },
        },
      ])
    }

    // 监听变化，防抖保存到 IndexedDB
    editor.store.listen(
      () => {
        clearTimeout(editor.__saveTimer)
        editor.__saveTimer = setTimeout(async () => {
          const snap = editor.getSnapshot()
          await idb.put('projects', {
            id: PROJECT_ID,
            name: '无限画布',
            snapshot: snap,
            updatedAt: Date.now(),
          })
        }, 2000)
      },
      { source: 'user', scope: 'document' },
    )
  }, [])

  // 从作品加图到画布
  function handleAddImage(genId: string) {
    const g = generations.find((x) => x.id === genId)
    const editor = editorRef.current
    if (!g || !editor) return
    const url = URL.createObjectURL(g.resultBlob)
    // tldraw v5: putExternalContent 插入图片
    editor.putExternalContent({
      type: 'embed',
      url,
    })
    setPickImg(false)
  }

  // 导出 PNG
  function handleExport() {
    const editor = editorRef.current
    if (!editor) return
    const ids = [...editor.getCurrentPageShapeIds()]
    exportAs(editor, ids, { format: 'png', background: true })
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">无限画布</h1>
          <p className="mt-1 text-sm text-neutral-500">由 tldraw 驱动 · 白板 / 绘图 / 标注 · 自动本地保存</p>
        </div>
        <div className="flex h-[65vh] items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-900/60">
          <div className="flex flex-col items-center gap-2 text-sm text-neutral-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
            <span>加载画布中…</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold">无限画布</h1>
        <p className="mt-1 text-sm text-neutral-500">
          由 tldraw 驱动 · 白板 / 绘图 / 标注 · 自动本地保存 · 导出 PNG / SVG
        </p>
      </div>

      {/* 自定义工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-2.5 text-sm">
        <div className="flex items-center gap-2">
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
          <button
            onClick={handleExport}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-400 transition-colors hover:bg-neutral-800"
          >
            导出 PNG
          </button>
        </div>
      </div>

      {/* 作品选择器浮层 */}
      {pickImg && (
        <div className="animate-fade-up rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">选择一张作品添加到画布</span>
            <button onClick={() => setPickImg(false)} className="text-xs text-neutral-500 hover:text-neutral-300">
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
                onClick={() => handleAddImage(g.id)}
                className="rounded-lg border border-neutral-700 bg-neutral-800/60 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-emerald-500/40 hover:bg-neutral-800"
              >
                {g.prompt.slice(0, 20)}…
              </button>
            ))}
          </div>
        </div>
      )}

      {/* tldraw 完整画布 */}
      <div className="h-[70vh] overflow-hidden rounded-xl border border-neutral-800/60">
        <Tldraw snapshot={snapshot} onMount={handleMount} colorScheme="dark" />
      </div>
    </section>
  )
}
