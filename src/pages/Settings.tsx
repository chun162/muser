import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { maskKey } from '../lib/modelRegistry'
import type { ModelProvider, ProviderType } from '../types'

const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: 'openai-compatible', label: 'OpenAI 兼容（如 SD 后端）' },
  { value: 'stability', label: 'Stability' },
  { value: 'replicate', label: 'Replicate' },
  { value: 'custom', label: '自定义' },
]

export default function Settings() {
  const { providers, addProvider, updateProvider, deleteProvider } = useApp()
  const [editing, setEditing] = useState<ModelProvider | null>(null)

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
        Mock 阶段：下方配置的密钥仅存于本机（IndexedDB），当前生成走 Mock，未发起真实请求。
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">设置 · 模型注册（BYOK）</h1>
        <button
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-neutral-950"
          onClick={() =>
            setEditing({
              id: 'prov-' + crypto.randomUUID(),
              provider: 'openai-compatible',
              name: '',
              baseUrl: '',
              apiKey: '',
              defaultModel: '',
              enabled: true,
            })
          }
        >
          + 新增模型
        </button>
      </div>

      <ul className="space-y-2">
        {providers.length === 0 && <li className="text-sm text-neutral-500">尚未配置任何模型。配置后图片生成即可自带密钥直连。</li>}
        {providers.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-800 p-3 text-sm">
            <div>
              <div className="font-semibold">{p.name || '(未命名)'}</div>
              <div className="text-neutral-500">
                {p.provider} · {p.defaultModel || '—'} · Key: {p.apiKey ? maskKey(p.apiKey) : '未填'} ·{' '}
                {p.enabled ? '已启用' : '已停用'}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="text-neutral-300 hover:underline" onClick={() => setEditing(p)}>
                编辑
              </button>
              <button className="text-red-400 hover:underline" onClick={() => deleteProvider(p.id)}>
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <ProviderForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(p) => {
            if (providers.some((x) => x.id === p.id)) updateProvider(p)
            else addProvider(p)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function ProviderForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: ModelProvider
  onCancel: () => void
  onSave: (p: ModelProvider) => void | Promise<void>
}) {
  const [provider, setProvider] = useState<ProviderType>(initial.provider)
  const [name, setName] = useState(initial.name)
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl)
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [defaultModel, setDefaultModel] = useState(initial.defaultModel)
  const [enabled, setEnabled] = useState(initial.enabled)

  return (
    <div className="space-y-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-sm">
      <h2 className="font-semibold">编辑模型</h2>
      <label className="block space-y-1">
        <span className="text-neutral-400">类型</span>
        <select className="w-full rounded border border-neutral-800 bg-neutral-950 p-1.5" value={provider} onChange={(e) => setProvider(e.target.value as ProviderType)}>
          {PROVIDER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-neutral-400">名称</span>
        <input className="w-full rounded border border-neutral-800 bg-neutral-950 p-1.5" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-neutral-400">API 基址（baseUrl）</span>
        <input className="w-full rounded border border-neutral-800 bg-neutral-950 p-1.5" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://…" />
      </label>
      <label className="block space-y-1">
        <span className="text-neutral-400">API Key（仅存本机）</span>
        <input type="password" className="w-full rounded border border-neutral-800 bg-neutral-950 p-1.5" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="YOUR_API_KEY" />
      </label>
      <label className="block space-y-1">
        <span className="text-neutral-400">默认模型</span>
        <input className="w-full rounded border border-neutral-800 bg-neutral-950 p-1.5" value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} placeholder="如 sd-xl" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span className="text-neutral-400">启用</span>
      </label>
      <div className="flex gap-2">
        <button
          className="rounded bg-emerald-500 px-3 py-1.5 font-semibold text-neutral-950 disabled:opacity-50"
          disabled={!name.trim()}
          onClick={() => onSave({ ...initial, provider, name, baseUrl, apiKey, defaultModel, enabled })}
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
