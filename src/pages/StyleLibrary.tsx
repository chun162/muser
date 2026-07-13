import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { catLabel } from '../lib/format'
import type { Style, StyleCategory } from '../types'

const TABS: { key: StyleCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '2d', label: '2D动漫' },
  { key: '3d', label: '3D动漫' },
  { key: 'realistic', label: '写实风格' },
  { key: 'custom', label: '自定义风格' },
]

export default function StyleLibrary() {
  const { styles, customStyles, addCustomStyle, updateCustomStyle, deleteCustomStyle, setSelectedStyleId } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<StyleCategory | 'all'>('all')
  const [editing, setEditing] = useState<Style | null>(null)

  const list =
    tab === 'all'
      ? styles
      : tab === 'custom'
        ? customStyles
        : styles.filter((s) => s.category === tab)

  function applyStyle(id: string) {
    setSelectedStyleId(id)
    navigate('/image')
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">画风库</h1>
        <button
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-neutral-950"
          onClick={() =>
            setEditing({
              id: 'custom-' + crypto.randomUUID(),
              name: '',
              category: 'custom',
              promptTemplate: '{prompt}',
              params: { resolution: '1024x1024', steps: 30, sampler: 'dpmpp_2m', negativePrompt: '', batch: 1 },
              builtin: false,
            })
          }
        >
          + 新建风格
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`rounded-full px-3 py-1 ${
              tab === t.key ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((s) => (
          <div key={s.id} className="rounded-lg border border-neutral-800 p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{s.name}</h3>
              <span className="text-xs text-neutral-500">{catLabel(s.category)}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{s.promptTemplate}</p>
            <div className="mt-3 flex gap-2 text-xs">
              <button className="text-emerald-300 hover:underline" onClick={() => applyStyle(s.id)}>
                应用
              </button>
              {!s.builtin && (
                <>
                  <button className="text-neutral-300 hover:underline" onClick={() => setEditing(s)}>
                    编辑
                  </button>
                  <button
                    className="text-red-400 hover:underline"
                    onClick={() => deleteCustomStyle(s.id)}
                  >
                    删除
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <StyleForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={async (s) => {
            if (s.builtin) {
              // 不会发生（builtin 不可编辑）
            } else if (customStyles.some((c) => c.id === s.id)) {
              await updateCustomStyle(s)
            } else {
              await addCustomStyle(s)
            }
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function StyleForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Style
  onCancel: () => void
  onSave: (s: Style) => void | Promise<void>
}) {
  const [name, setName] = useState(initial.name)
  const [promptTemplate, setPromptTemplate] = useState(initial.promptTemplate)
  const [steps, setSteps] = useState(initial.params.steps)
  const [resolution, setResolution] = useState(initial.params.resolution)

  return (
    <div className="space-y-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-sm">
      <h2 className="font-semibold">{initial.builtin ? '编辑' : '新建'}自定义风格</h2>
      <label className="block space-y-1">
        <span className="text-neutral-400">名称</span>
        <input className="w-full rounded border border-neutral-800 bg-neutral-950 p-1.5" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-neutral-400">提示词模板（用 {'{prompt}'} 占位用户输入）</span>
        <textarea
          className="w-full rounded border border-neutral-800 bg-neutral-950 p-1.5"
          rows={2}
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
        />
      </label>
      <div className="flex gap-3">
        <label className="space-y-1">
          <span className="text-neutral-400">分辨率</span>
          <input className="w-28 rounded border border-neutral-800 bg-neutral-950 p-1.5" value={resolution} onChange={(e) => setResolution(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-neutral-400">步数</span>
          <input type="number" className="w-20 rounded border border-neutral-800 bg-neutral-950 p-1.5" value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          className="rounded bg-emerald-500 px-3 py-1.5 font-semibold text-neutral-950 disabled:opacity-50"
          disabled={!name.trim()}
          onClick={() =>
            onSave({ ...initial, name, promptTemplate, params: { ...initial.params, resolution, steps } })
          }
        >
          保存
        </button>
        <button className="rounded bg-neutral-800 px-3 py-1.5" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  )
}
