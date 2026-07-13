import type { Request, Response, NextFunction } from 'express'
import { logger } from '../common/logger'
import { fail } from '../common/response'
import { AppError, ErrorCode } from '../common/errors'

// 统一错误处理（必须注册在路由与 notFound 之后）。
// - AppError：按携带的 httpStatus + code 返回信封，记 warn。
// - 未知错误：一律 500，绝不向外泄露内部细节；记 error 并返回 traceId 供排查。
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const rid = req.requestId
  if (err instanceof AppError) {
    logger.warn({ requestId: rid, code: err.code, httpStatus: err.httpStatus, message: err.message }, 'app.error')
    res.status(err.httpStatus).json(fail(err.message, err.code, rid))
    return
  }
  logger.error({ requestId: rid, error: String(err) }, 'unhandled.error')
  res.status(500).json(fail('服务器内部错误', ErrorCode.INTERNAL, rid))
}
