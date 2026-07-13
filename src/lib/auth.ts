// 前端账户客户端：调用后端 /api/auth/*（注册/登录/查询/订阅）。
// Token 存 localStorage（本地会话）；生产可换 httpOnly cookie。

import { API_BASE } from './config'

const TOKEN_KEY = 'ciyuan-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function authCall(path: string, body?: unknown, method: 'GET' | 'POST' = 'POST'): Promise<unknown> {
  const resp = await fetch(`${API_BASE}/auth${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await resp.json()) as { code: number; message: string; data: unknown }
  if (json.code !== 0) throw new Error(json.message || '请求失败')
  return json.data
}

export interface AuthResult {
  token: string
  user: { id: string; email: string }
}
export interface MeResult {
  user: { id: string; email: string }
  subscription: { plan: string; status: string } | null
}

export const authApi = {
  register: (email: string, password: string) => authCall('/register', { email, password }) as Promise<AuthResult>,
  login: (email: string, password: string) => authCall('/login', { email, password }) as Promise<AuthResult>,
  me: () => authCall('/me', undefined, 'GET') as Promise<MeResult>,
  subscribe: (plan = 'vip') => authCall('/subscribe', { plan }) as Promise<{ plan: string; status: string }>,
}
