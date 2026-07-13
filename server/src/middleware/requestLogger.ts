import type { Request, Response, NextFunction } from 'express'
import { logger } from '../common/logger'

// 出入请求日志：进入记 start，响应完成记 end（含状态与耗时）。
// 每条均带 requestId，便于与错误日志关联。绝不记录请求体中的密钥/隐私。
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const rid = req.requestId
  const start = Date.now()
  logger.info({ requestId: rid, method: req.method, path: req.path }, 'request.start')
  res.on('finish', () => {
    logger.info(
      { requestId: rid, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - start },
      'request.end',
    )
  })
  next()
}
