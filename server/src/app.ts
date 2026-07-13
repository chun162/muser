import express from 'express'
import { requestId } from './middleware/requestId'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { healthRouter } from './routes/health'
import { apiRouter } from './routes/api'

// 装配 Express：中间件顺序即请求处理顺序。
export function createApp() {
  const app = express()

  app.use(express.json())
  app.use(requestId)
  app.use(requestLogger)

  app.use('/health', healthRouter)
  app.use('/api', apiRouter)

  app.use(notFound) // 未匹配路由 → 404 信封
  app.use(errorHandler) // 统一错误 → 信封 + traceId（须最后）

  return app
}
