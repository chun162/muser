// 统一接口返回 / 错误类型

export type ErrorCode = number

export interface ApiResponse<T = unknown> {
  code: number // 0 = 成功
  message: string
  data: T | null
  traceId?: string // 错误时返回，用于关联日志排查
}
