// 错误码表 + 业务错误类
// 约定：code 为业务码（0=成功），httpStatus 为对应 HTTP 状态。
export const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  NOT_FOUND: 40400,
  RATE_LIMIT: 42900,
  TIMEOUT: 50400,
  INTERNAL: 50000,
} as const

export class AppError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly httpStatus: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class BadRequestError extends AppError {
  constructor(message = '请求参数错误') {
    super(ErrorCode.BAD_REQUEST, message, 400)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '未认证') {
    super(ErrorCode.UNAUTHORIZED, message, 401)
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(ErrorCode.NOT_FOUND, message, 404)
  }
}
