// Express Request 类型增强：注入 requestId（链路追踪）
import 'express'

declare global {
  namespace Express {
    interface Request {
      requestId?: string
      userId?: string
    }
  }
}
