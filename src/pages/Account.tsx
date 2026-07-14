import { useEffect, useState } from 'react'
import { authApi, getToken, setToken } from '../lib/auth'

export default function Account() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [me, setMe] = useState<{ user: { id: string; email: string }; subscription: { plan: string; status: string } | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!getToken()) return
    authApi.me().then(setMe).catch(() => setToken(null))
  }, [])

  async function submit() {
    setError(null); setLoading(true)
    try {
      const r = mode === 'login' ? await authApi.login(email, password) : await authApi.register(email, password)
      setToken(r.token)
      const m = await authApi.me()
      setMe(m); setPassword('')
    } catch (e) { setError(e instanceof Error ? e.message : '操作失败') }
    finally { setLoading(false) }
  }

  if (me) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>账户</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>VIP 订阅与账户管理</p>
        </div>
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: 'var(--brand-gradient)', color: '#fff' }}>
              {me.user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{me.user.email}</p>
              {me.subscription && (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {me.subscription.plan} · <span style={{ color: me.subscription.status === 'active' ? 'var(--success)' : 'var(--warning)' }}>
                    {me.subscription.status === 'active' ? '有效' : me.subscription.status}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button className="rounded-lg px-3 py-1.5 text-xs transition-colors"
            style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)' }}
            onClick={() => { setToken(null); setMe(null) }}>退出登录</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>账户</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>{mode === 'login' ? '登录' : '注册'} · VIP 订阅打通云端算力</p>
      </div>

      {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>{error}</div>}

      <div className="surface-card p-5 space-y-4">
        <input className="field-input" placeholder="邮箱" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <input className="field-input" placeholder="密码" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />

        <button className="btn-brand w-full justify-center" onClick={submit} disabled={loading || !email || !password}>
          {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
        </button>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? '没有账户？' : '已有账户？'}
          <button className="ml-1 underline" style={{ color: 'var(--accent-text)' }}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}>
            {mode === 'login' ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  )
}
