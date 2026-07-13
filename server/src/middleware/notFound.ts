import type { Request, Response } from 'express'
import { fail } from '../common/response'
import { ErrorCode } from '../common/errors'

// 404 处理：未匹配任何路由时返回统一信封（而非 Express 默认 HTML）。
export function notFound(_req: Request, res: Response): void {
  res.status(404).json(fail('接口不存在', ErrorCode.NOT_FOUND))
}
