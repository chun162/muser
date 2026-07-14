import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { Style, StyleCategory } from '../types'

const TABS: { key: StyleCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '2d', label: '2D动漫' },
  { key: '3d', label: '3D动漫' },
  { key: 'realistic', label: '写实风格' },
  { key: 'custom', label: '自定义' },
]

function styleHue(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return Math.abs(h)
}

export default function StyleLibrary() {
  const { styles, customStyles, addCustomStyle, updateCustomStyle, deleteCustomStyle, setSelectedStyleId } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<StyleCategory | 'all'>('all')
  const [editing, setEditing] = useState<Style | null>(null)

  const list = tab === 'all' ? styles : tab === 'custom' ? customStyles : styles.filter((s) => s.category === tab)

  function useStyle(s: Style) {
    setSelectedStyleId(s.id)
    navigate('/image')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>画风库</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>{styles.length} 种风格 · 点击即可应用于图片生成</p>
      </div>

      {/* 分类 Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm"
            style={{
              backgroundColor: tab === t.key ? 'var(--accent-bg)' : 'var(--bg-surface)',
              color: tab === t.key ? 'var(--accent-text)' : 'var(--text-tertiary)',
              border: tab === t.key ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
            }}>
            {t.label} {t.key === 'all' ? `(${styles.length})` : t.key === 'custom' ? `(${customStyles.length})` : `(${styles.filter((s) => s.category === t.key).length})`}
          </button>
        ))}
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((s) => (
          <div key={s.id} className="surface-card overflow-hidden cursor-pointer group"
            style={{ padding: 0 }} onClick={() => useStyle(s)}>
            {/* 缩略图占位 */}
            <div className="aspect-[4/3] flex items-center justify-center text-3xl"
              style={{ backgroundColor: `hsl(${styleHue(s.name)}, 30%, 12%)` }}>
              {['2d', '3d', 'realistic'].includes(s.category) ? '' : '🎨'}
            </div>
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  {s.category}
                </span>
              </div>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{s.description}</p>
              {s.category === 'custom' && (
                <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button className="text-xs transition-colors" style={{ color: 'var(--accent-text)' }}
                    onClick={() => setEditing(s)}>编辑</button>
                  <button className="text-xs" style={{ color: 'var(--error)' }}
                    onClick={() => deleteCustomStyle(s.id)}>删除</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 添加自定义风格 */}
      <button className="btn-brand w-full justify-center sm:w-auto"
        onClick={() => setEditing({ id: '', name: '', category: 'custom', description: '', promptTemplate: '' })}>
        + 自定义风格
      </button>

      {/* 编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--overlay-heavy, rgba(0,0,0,0.62))' }}>
          <div className="w-full max-w-md rounded-xl border p-5 space-y-4"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editing.id ? '编辑风格' : '新建风格'}
            </h3>
            <input className="field-input" placeholder="风格名称" value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <textarea className="field-input" rows={2} placeholder="描述" value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <textarea className="field-input" rows={3} placeholder="提示词模板（用 {prompt} 占位）" value={editing.promptTemplate}
              onChange={(e) => setEditing({ ...editing, promptTemplate: e.target.value })} />
            <div className="flex gap-2">
              <button className="btn-brand text-xs" onClick={async () => {
                if (!editing.name.trim()) return
                const payload = { ...editing, id: editing.id || crypto.randomUUID() }
                if (editing.id) await updateCustomStyle(payload); else await addCustomStyle(payload)
                setEditing(null)
              }}>保存</button>
              <button className="rounded-lg px-3 py-1.5 text-xs"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
                onClick={() => setEditing(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
