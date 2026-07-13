import { useEffect, useState } from 'react'
import { authApi, getToken, setToken } from '../lib/auth'

// P4 账户·VIP（真实后端：SQLite + JWT）
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
    setError(null)
    setLoading(true)
    try {
      const r = mode === 'login' ? await authApi.login(email, password) : await authApi.register(email, password)
      setToken(r.token)
      const m = await authApi.me()
      setMe(m)
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  async function subscribe() {
    setLoading(true)
    try {
      await authApi.subscribe('vip')
      const m = await authApi.me()
      setMe(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : '订阅失败')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setToken(null)
    setMe(null)
    setEmail('')
  }

  if (me) {
    const isVip = me.subscription?.plan === 'vip' && me.subscription?.status === 'active'
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-bold">账户 · VIP</h1>
        <div className="rounded-lg border border-neutral-800 p-3 text-sm">
          <div>已登录：<span className="text-emerald-300">{me.user.email}</span></div>
          <div className="mt-1">
            会员状态：<span className={isVip ? 'text-amber-300' : 'text-neutral-400'}>{isVip ? 'VIP（不排队 · 超清）' : '免费用户'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {!isVip && (
            <button onClick={subscribe} disabled={loading} className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-neutral-950 disabled:opacity-50">
              {loading ? '处理中…' : '升级 VIP'}
            </button>
          )}
          <button onClick={logout} className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm">退出</button>
        </div>
        {error && <div className="text-sm text-red-300">{error}</div>}
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">账户 · VIP</h1>
      <div className="flex gap-2 text-sm">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-full px-3 py-1 ${mode === m ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'}`}>
            {m === 'login' ? '登录' : '注册'}
          </button>
        ))}
      </div>
      <input className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" />
      <input type="password" className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码（≥6位）" />
      <button onClick={submit} disabled={loading || !email || !password} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-50">
        {loading ? '处理中…' : mode === 'login' ? '登录' : '注册并登录'}
      </button>
      {error && <div className="text-sm text-red-300">{error}</div>}
    </section>
  )
}
