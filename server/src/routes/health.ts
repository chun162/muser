import { Router } from 'express'
import { ok } from '../common/response'

// 健康检查（非业务接口，仅用于演示统一返回信封 + 日志规则）
export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.json(ok({ status: 'up', uptime: process.uptime() }))
})
