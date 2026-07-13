import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../services/authService'
import { UnauthorizedError } from '../common/errors'

// 鉴权中间件：校验 Bearer JWT，通过则把 userId 挂到 req。
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const h = req.headers.authorization
  const token = h?.startsWith('Bearer ') ? h.slice(7) : undefined
  const sub = token ? verifyToken(token) : null
  if (!sub) throw new UnauthorizedError('未认证或登录已过期')
  req.userId = sub
  next()
}
