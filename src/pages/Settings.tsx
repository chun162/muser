import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { maskKey } from '../lib/modelRegistry'
import type { ModelProvider, ProviderType } from '../types'

const PRESETS = [
  { label: 'Seedream (TopenRouter)', name: 'Seedream', baseUrl: 'https://api.topenrouter.com/v1', defaultModel: 'seedream-v3.0' },
  { label: 'SiliconFlow', name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3' },
  { label: '火山引擎 Ark', name: '火山引擎 Ark', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'ep-xxx' },
  { label: 'Seedance (acedata)', name: 'Seedance', baseUrl: 'https://api.acedata.cloud', defaultModel: 'doubao-seedance-1-0-pro-250528' },
]

export default function Settings() {
  const { providers, addProvider, updateProvider, deleteProvider } = useApp()
  const [editing, setEditing] = useState<ModelProvider | null>(null)

  function applyPreset(preset: typeof PRESETS[number]) {
    addProvider({ id: 'prov-' + crypto.randomUUID(), provider: 'openai-compatible', name: preset.name, baseUrl: preset.baseUrl, apiKey: '', defaultModel: preset.defaultModel, enabled: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>设置</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>BYOK 自持密钥 · 仅存本机 IndexedDB</p>
      </div>

      {/* 快速添加 */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="mb-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>快速添加</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((preset) => (
            <button key={preset.label} onClick={() => applyPreset(preset)}
              className="rounded-lg border p-3 text-left text-sm transition-colors"
              style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-surface)' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{preset.name}</div>
              <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{preset.defaultModel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 已配置列表 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            已配置 {providers.length > 0 && `(${providers.length})`}
          </h2>
          <button
            className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
            style={{ background: 'var(--brand-gradient)', color: '#fff' }}
            onClick={() => setEditing({ id: 'prov-' + crypto.randomUUID(), provider: 'openai-compatible', name: '', baseUrl: '', apiKey: '', defaultModel: '', enabled: true })}>
            + 手动添加
          </button>
        </div>

        {providers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
            尚未配置模型密钥
          </div>
        ) : (
          <ul className="space-y-2">
            {providers.map((p) => (
              <li key={p.id}
                className="surface-card flex items-center justify-between p-3 text-sm"
                style={{ padding: '0.75rem 1rem' }}>
                <div>
                  <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {p.name || '(未命名)'}
                    <span className={`inline-block h-2 w-2 rounded-full ${p.enabled ? 'status-dot success' : 'status-dot idle'}`} />
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.defaultModel || '—'} · Key: {p.apiKey ? maskKey(p.apiKey) : '未填'}
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <button style={{ color: 'var(--accent-text)' }} onClick={() => setEditing(p)}>编辑</button>
                  <button style={{ color: 'var(--error)' }} onClick={() => deleteProvider(p.id)}>删除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <ProviderForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(p) => { providers.some((x) => x.id === p.id) ? updateProvider(p) : addProvider(p); setEditing(null) }}
        />
      )}
    </div>
  )
}

function ProviderForm({ initial, onCancel, onSave }: {
  initial: ModelProvider; onCancel: () => void; onSave: (p: ModelProvider) => void | Promise<void>
}) {
  const [provider, setProvider] = useState<ProviderType>(initial.provider)
  const [name, setName] = useState(initial.name)
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl)
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [defaultModel, setDefaultModel] = useState(initial.defaultModel)
  const [enabled, setEnabled] = useState(initial.enabled)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--overlay-heavy, rgba(0,0,0,0.62))' }}>
      <div className="w-full max-w-md rounded-xl border p-5 space-y-4"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>编辑模型</h3>

        <input className="field-input" placeholder="名称" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field-input" placeholder="API 基址 (baseUrl)" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        <input className="field-input" type="password" placeholder="API Key（本机存储）" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        <input className="field-input" placeholder="默认模型 (如 seedream-v3.0)" value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} />

        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          启用
        </label>

        <div className="flex gap-2">
          <button className="btn-brand text-xs" disabled={!name.trim()}
            onClick={() => onSave({ ...initial, provider, name, baseUrl, apiKey, defaultModel, enabled })}>保存</button>
          <button className="rounded-lg px-3 py-1.5 text-xs"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
            onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  )
}
