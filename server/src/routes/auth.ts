import { Router } from 'express'
import { ok } from '../common/response'
import { register, login, getUserById, setSubscription, getSubscription } from '../services/authService'
import { requireAuth } from '../middleware/auth'
import { UnauthorizedError } from '../common/errors'

// /api/auth — 账户与订阅
export const authRouter = Router()

authRouter.post('/register', (req, res, next) => {
  try {
    const b = (req.body ?? {}) as { email?: string; password?: string }
    const r = register(b.email ?? '', b.password ?? '')
    res.json(ok(r))
  } catch (e) {
    next(e)
  }
})

authRouter.post('/login', (req, res, next) => {
  try {
    const b = (req.body ?? {}) as { email?: string; password?: string }
    const r = login(b.email ?? '', b.password ?? '')
    res.json(ok(r))
  } catch (e) {
    next(e)
  }
})

authRouter.get('/me', requireAuth, (req, res, next) => {
  try {
    const u = getUserById(req.userId!)
    if (!u) throw new UnauthorizedError('用户不存在')
    const sub = getSubscription(u.id)
    res.json(ok({ user: u, subscription: sub }))
  } catch (e) {
    next(e)
  }
})

authRouter.post('/subscribe', requireAuth, (req, res, next) => {
  try {
    const b = (req.body ?? {}) as { plan?: string }
    const sub = setSubscription(req.userId!, b.plan || 'vip')
    res.json(ok(sub))
  } catch (e) {
    next(e)
  }
})
