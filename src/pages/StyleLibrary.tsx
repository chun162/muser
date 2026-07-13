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

/** 根据风格名称生成一致的 HSL 色相 */
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
    <section className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">画风库</h1>
          <p className="mt-1 text-sm text-neutral-500">浏览和应用风格预设，也可自定义你的专属画风。</p>
        </div>
        <button
          className="rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
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

      {/* 分类 Tabs */}
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`rounded-full px-3.5 py-1.5 transition-colors ${
              tab === t.key
                ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                : 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key !== 'all' && t.key !== 'custom' && (
              <span className="ml-1.5 text-xs opacity-50">
                {styles.filter((s) => s.category === t.key).length}
              </span>
            )}
            {t.key === 'custom' && (
              <span className="ml-1.5 text-xs opacity-50">{customStyles.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* 卡片网格 */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 py-16 text-sm text-neutral-500">
          {tab === 'custom' ? (
            <>
              <span className="text-2xl">🎨</span>
              <p className="mt-3">还没有自定义风格</p>
              <p className="mt-1">点击「+ 新建风格」创建你的专属画风</p>
            </>
          ) : (
            <>
              <span className="text-2xl">🔍</span>
              <p className="mt-3">该分类暂无内置风格</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((s, i) => (
            <StyleCard
              key={s.id}
              style={s}
              index={i}
              onApply={() => applyStyle(s.id)}
              onEdit={() => setEditing(s)}
              onDelete={() => deleteCustomStyle(s.id)}
            />
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      {editing && (
        <StyleForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={async (s) => {
            if (!s.builtin && customStyles.some((c) => c.id === s.id)) {
              await updateCustomStyle(s)
            } else if (!s.builtin) {
              await addCustomStyle(s)
            }
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

// ===== 单张风格卡片 =====

function StyleCard({
  style,
  index,
  onApply,
  onEdit,
  onDelete,
}: {
  style: Style
  index: number
  onApply: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const hue = styleHue(style.name)
  const catColor = style.category === '2d'
    ? 'from-pink-500/30'
    : style.category === '3d'
      ? 'from-blue-500/30'
      : style.category === 'realistic'
        ? 'from-amber-500/30'
        : 'from-emerald-500/30'

  return (
    <div
      className="animate-fade-up group relative overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-4 transition-all hover:border-neutral-700 hover:bg-neutral-900/60"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* 色块预览 */}
      <div
        className={`mb-3 h-20 w-full rounded-lg bg-gradient-to-br ${catColor} to-neutral-900`}
        style={{
          boxShadow: `inset 0 0 0 1px hsla(${hue}, 50%, 50%, 0.15)`,
        }}
      >
        <div className="flex h-full items-center justify-center">
          <span
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: `hsl(${hue}, 60%, 65%)` }}
          >
            {style.name.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* 信息 */}
      <div className="flex items-start justify-between gap-1">
        <h3 className="text-sm font-semibold text-neutral-200">{style.name}</h3>
        <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
          {catLabel(style.category)}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{style.promptTemplate}</p>

      {/* 操作按钮 */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button
          className="rounded-md bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25"
          onClick={onApply}
        >
          应用
        </button>
        {!style.builtin && (
          <>
            <button
              className="text-neutral-400 transition-colors hover:text-neutral-200"
              onClick={onEdit}
            >
              编辑
            </button>
            <button
              className="text-red-400/70 transition-colors hover:text-red-300"
              onClick={onDelete}
            >
              删除
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ===== 编辑/新建表单 =====

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
    <div className="animate-fade-up space-y-4 rounded-xl border border-neutral-700/60 bg-neutral-900/60 p-5 text-sm backdrop-blur-sm">
      <h2 className="text-base font-semibold text-neutral-200">
        {initial.builtin ? '编辑' : '新建'}自定义风格
      </h2>

      <label className="block space-y-1.5">
        <span className="text-neutral-400">名称</span>
        <input
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-200 placeholder-neutral-600 transition-colors focus:border-emerald-500/40"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="我的水彩风格"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-neutral-400">提示词模板</span>
        <p className="text-xs text-neutral-600">用 <code className="rounded bg-neutral-800 px-1 text-emerald-400">{'{prompt}'}</code> 占位用户输入</p>
        <textarea
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-sm text-neutral-200 placeholder-neutral-600 transition-colors focus:border-emerald-500/40"
          rows={3}
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          placeholder="水彩风格，柔和的色彩渐变，{prompt}，湿画法效果"
        />
      </label>

      <div className="flex gap-4">
        <label className="flex-1 space-y-1.5">
          <span className="text-neutral-400">分辨率</span>
          <input
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-200 transition-colors focus:border-emerald-500/40"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
        </label>
        <label className="w-24 space-y-1.5">
          <span className="text-neutral-400">步数</span>
          <input
            type="number"
            min={1}
            max={100}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-neutral-200 transition-colors focus:border-emerald-500/40"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:opacity-40"
          disabled={!name.trim()}
          onClick={() =>
            onSave({ ...initial, name, promptTemplate, params: { ...initial.params, resolution, steps } })
          }
        >
          保存
        </button>
        <button
          className="rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 transition-colors hover:bg-neutral-800"
          onClick={onCancel}
        >
          取消
        </button>
      </div>
    </div>
  )
}
