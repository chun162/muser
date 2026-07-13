import type { ApiResponse } from '../types/api'

// 统一返回信封构造
export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data }
}

export function fail(message: string, code: number, traceId?: string): ApiResponse<null> {
  return { code, message, data: null, ...(traceId ? { traceId } : {}) }
}
