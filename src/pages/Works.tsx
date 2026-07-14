import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { Generation } from '../types'

export default function Works() {
  const { generations, deleteGeneration, styles } = useApp()
  const [selectedImage, setSelectedImage] = useState<{ url: string; prompt: string } | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>我的作品</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>本地素材库 · 数据存于 IndexedDB</p>
      </div>

      {generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-sm"
          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
          <span className="text-3xl">🖼️</span>
          <p className="mt-3" style={{ color: 'var(--text-tertiary)' }}>还没有作品</p>
          <p className="mt-1 text-xs">去「图片生成」出图后保存即可</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {generations.map((g, i) => (
            <GenCard
              key={g.id} g={g} index={i}
              styleName={styles.find((s) => s.id === g.styleId)?.name}
              onDelete={() => deleteGeneration(g.id)}
              onView={(url, prompt) => setSelectedImage({ url, prompt })}
            />
          ))}
        </div>
      )}

      {generations.length > 0 && (
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          共 {generations.length} 件作品
        </p>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'var(--overlay-heavy, rgba(0,0,0,0.62))' }}
          onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden border"
            style={{ borderColor: 'var(--overlay-border, rgba(255,255,255,0.1))' }}
            onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.url} alt={selectedImage.prompt}
              className="max-w-full max-h-[80vh] object-contain" />
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedImage.prompt}</p>
            </div>
            <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'var(--text-secondary)' }}
              onClick={() => setSelectedImage(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

function GenCard({ g, index, styleName, onDelete, onView }: {
  g: Generation; index: number; styleName?: string; onDelete: () => void; onView: (url: string, prompt: string) => void
}) {
  const [url, setUrl] = useState('')
  useEffect(() => { const u = URL.createObjectURL(g.resultBlob); setUrl(u); return () => URL.revokeObjectURL(u) }, [g.resultBlob])
  if (!url) return null

  return (
    <div className="surface-card cursor-pointer overflow-hidden" style={{ padding: 0 }} onClick={() => onView(url, g.prompt)}>
      <img src={url} alt={g.prompt} className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
      <div className="p-2.5 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          {styleName ? (
            <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>{styleName}</span>
          ) : <span style={{ color: 'var(--text-muted)' }}>默认</span>}
          <span style={{ color: 'var(--text-muted)' }}>
            {new Date(g.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="line-clamp-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{g.prompt}</p>
        <button className="w-full rounded-lg py-1.5 text-xs transition-colors"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
          onClick={(e) => { e.stopPropagation(); onDelete() }}>删除</button>
      </div>
    </div>
  )
}
