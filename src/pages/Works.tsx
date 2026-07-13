import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { Generation } from '../types'

export default function Works() {
  const { generations, deleteGeneration, styles } = useApp()

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">我的作品</h1>
      {generations.length === 0 ? (
        <p className="text-sm text-neutral-500">还没有作品。去「图片生成」出图后点「保存到作品」即可本地留存。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {generations.map((g) => (
            <GenCard key={g.id} g={g} styleName={styles.find((s) => s.id === g.styleId)?.name} onDelete={() => deleteGeneration(g.id)} />
          ))}
        </div>
      )}
    </section>
  )
}

function GenCard({ g, styleName, onDelete }: { g: Generation; styleName?: string; onDelete: () => void }) {
  const [url, setUrl] = useState<string>('')
  useEffect(() => {
    const u = URL.createObjectURL(g.resultBlob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [g.resultBlob])

  return (
    <div className="space-y-2 rounded-lg border border-neutral-800 p-2">
      {url && <img src={url} alt={g.prompt} className="aspect-square w-full rounded object-cover" />}
      <p className="line-clamp-2 text-xs text-neutral-300">{g.prompt}</p>
      <p className="text-xs text-neutral-500">
        {styleName ? `${styleName} · ` : ''}
        {new Date(g.createdAt).toLocaleString()}
      </p>
      <button className="w-full rounded bg-neutral-800 py-1 text-xs hover:bg-neutral-700" onClick={onDelete}>
        删除
      </button>
    </div>
  )
}
