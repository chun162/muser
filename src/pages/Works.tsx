import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { Generation } from '../types'

export default function Works() {
  const { generations, deleteGeneration, styles } = useApp()
  const [selectedImage, setSelectedImage] = useState<{ url: string; prompt: string } | null>(null)

  return (
    <section className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold">我的作品</h1>
        <p className="mt-1 text-sm text-neutral-500">
          保存在本机的作品。数据存于浏览器 IndexedDB，不离开本机。
        </p>
      </div>

      {generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 py-20 text-sm text-neutral-500">
          <span className="text-3xl">🖼️</span>
          <p className="mt-3">还没有作品</p>
          <p className="mt-1">去「图片生成」出图后点「保存到作品」即可本地留存</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {generations.map((g, i) => (
            <GenCard
              key={g.id}
              g={g}
              index={i}
              styleName={styles.find((s) => s.id === g.styleId)?.name}
              onDelete={() => deleteGeneration(g.id)}
              onView={(url, prompt) => setSelectedImage({ url, prompt })}
            />
          ))}
        </div>
      )}

      {/* 筛选器提示 */}
      {generations.length > 0 && (
        <p className="text-center text-xs text-neutral-600">
          共 {generations.length} 件作品 · 点击图片放大查看
        </p>
      )}

      {/* 大图预览 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden border border-neutral-700/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.prompt}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
              <p className="text-sm text-neutral-200">{selectedImage.prompt}</p>
            </div>
            <button
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-lg text-neutral-300 transition-colors hover:bg-black/70 hover:text-white"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// ===== 单张作品卡片 =====

function GenCard({
  g,
  index,
  styleName,
  onDelete,
  onView,
}: {
  g: Generation
  index: number
  styleName?: string
  onDelete: () => void
  onView: (url: string, prompt: string) => void
}) {
  const [url, setUrl] = useState<string>('')
  useEffect(() => {
    const u = URL.createObjectURL(g.resultBlob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [g.resultBlob])

  if (!url) return null

  return (
    <div
      className="animate-fade-up group relative overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-900/40 transition-all hover:border-neutral-700"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* 图片 */}
      <div className="relative cursor-pointer" onClick={() => onView(url, g.prompt)}>
        <img
          src={url}
          alt={g.prompt}
          className="aspect-square w-full rounded-t-xl object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {/* 悬停信息覆盖层 */}
        <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="line-clamp-3 text-xs leading-relaxed text-neutral-100">
            {g.prompt}
          </p>
        </div>
      </div>

      {/* 底部信息栏 */}
      <div className="space-y-2 p-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">
            {styleName ? (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
                {styleName}
              </span>
            ) : (
              '默认'
            )}
          </span>
          <span className="text-neutral-500">
            {new Date(g.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <button
          className="w-full rounded-lg bg-neutral-800 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
          onClick={onDelete}
        >
          删除
        </button>
      </div>
    </div>
  )
}
