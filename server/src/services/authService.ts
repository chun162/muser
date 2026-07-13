import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { db } from '../db/sqlite'
import { env } from '../config/env'
import { BadRequestError, UnauthorizedError } from '../common/errors'

export interface AuthUser {
  id: string
  email: string
}

function hashPassword(pw: string): string {
  const salt = randomUUID()
  const hash = scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const h = scryptSync(pw, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), h)
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): string | null {
  try {
    const p = jwt.verify(token, env.JWT_SECRET) as { sub: string }
    return p.sub
  } catch {
    return null
  }
}

export function register(email: string, password: string): { token: string; user: AuthUser } {
  if (!email || !password) throw new BadRequestError('邮箱与密码必填')
  if (password.length < 6) throw new BadRequestError('密码至少 6 位')
  const existing = db().prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) throw new BadRequestError('该邮箱已注册')
  const id = randomUUID()
  db()
    .prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(id, email, hashPassword(password), Date.now())
  return { token: signToken(id), user: { id, email } }
}

export function login(email: string, password: string): { token: string; user: AuthUser } {
  const row = db()
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email) as { id: string; email: string; password_hash: string } | undefined
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new UnauthorizedError('邮箱或密码错误')
  }
  return { token: signToken(row.id), user: { id: row.id, email: row.email } }
}

export function getUserById(id: string): AuthUser | null {
  const row = db().prepare('SELECT id, email FROM users WHERE id = ?').get(id) as AuthUser | undefined
  return row ?? null
}

export function setSubscription(userId: string, plan: string): { plan: string; status: string } {
  const status = 'active'
  db()
    .prepare(
      `INSERT INTO subscriptions (user_id, plan, status, started_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, status = excluded.status, started_at = excluded.started_at`,
    )
    .run(userId, plan, status, Date.now())
  return { plan, status }
}

export function getSubscription(userId: string): { plan: string; status: string } | null {
  const row = db()
    .prepare('SELECT plan, status FROM subscriptions WHERE user_id = ?')
    .get(userId) as { plan: string; status: string } | undefined
  return row ?? null
}
