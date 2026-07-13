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

// 快速预设：常用服务的默认配置
const PRESETS: { label: string; name: string; baseUrl: string; defaultModel: string }[] = [
  { label: 'Seedream (TopenRouter)', name: 'Seedream', baseUrl: 'https://api.topenrouter.com/v1', defaultModel: 'seedream-v3.0' },
  { label: 'SiliconFlow', name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3' },
  { label: '火山引擎 Ark', name: '火山引擎 Ark', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'ep-xxx' },
  { label: 'OpenAI', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'dall-e-3' },
]

export default function Settings() {
  const { providers, addProvider, updateProvider, deleteProvider } = useApp()
  const [editing, setEditing] = useState<ModelProvider | null>(null)

  function applyPreset(preset: (typeof PRESETS)[number]) {
    const p: ModelProvider = {
      id: 'prov-' + crypto.randomUUID(),
      provider: 'openai-compatible',
      name: preset.name,
      baseUrl: preset.baseUrl,
      apiKey: '',
      defaultModel: preset.defaultModel,
      enabled: true,
    }
    addProvider(p)
  }

  return (
    <section className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="mt-1 text-sm text-neutral-500">
          配置你的模型密钥（BYOK）。密钥仅存本机 IndexedDB，直连 API，不上传服务器。
        </p>
      </div>

      {/* 快速添加预设 */}
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-300">快速添加</h2>
        <p className="mb-3 text-xs text-neutral-500">选择一个服务商，会自动填入默认配置，你只需填入 API Key 即可。</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-left text-sm transition-colors hover:border-emerald-500/40 hover:bg-neutral-800"
            >
              <div className="text-sm font-medium text-neutral-200">{preset.label.split('(')[0].trim()}</div>
              <div className="mt-0.5 text-xs text-neutral-500">{preset.defaultModel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 已配置的模型列表 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-300">已配置的模型 {providers.length > 0 && `（${providers.length}）`}</h2>
          <button
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
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
            + 手动添加
          </button>
        </div>

        {providers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-800 p-6 text-center text-sm text-neutral-500">
            尚未配置任何模型。点击上方「快速添加」选择一个服务商，或「手动添加」自定义。
          </div>
        ) : (
          <ul className="space-y-2">
            {providers.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-sm transition-colors hover:border-neutral-700"
              >
                <div>
                  <div className="font-semibold text-neutral-200">
                    {p.name || '(未命名)'}
                    <span
                      className={`ml-2 inline-block h-2 w-2 rounded-full ${p.enabled ? 'bg-emerald-400' : 'bg-neutral-600'}`}
                    />
                  </div>
                  <div className="mt-0.5 text-neutral-500">
                    {p.defaultModel || '—'} · Key: {p.apiKey ? maskKey(p.apiKey) : '未填'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-neutral-300 hover:text-emerald-300 transition-colors" onClick={() => setEditing(p)}>
                    编辑
                  </button>
                  <button className="text-red-400 hover:text-red-300 transition-colors" onClick={() => deleteProvider(p.id)}>
                    删除
                  </button>
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
