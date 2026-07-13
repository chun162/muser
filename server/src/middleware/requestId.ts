import type { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'node:crypto'

export const REQUEST_ID_HEADER = 'x-request-id'

// 请求 ID：优先复用上游传入的 x-request-id，否则生成；写入响应头与 req.requestId 供全链路关联。
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? randomUUID()
  res.setHeader(REQUEST_ID_HEADER, id)
  req.requestId = id
  next()
}
