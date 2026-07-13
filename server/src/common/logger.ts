import pino from 'pino'
import { env } from '../config/env'

// 结构化日志（pino）。生产环境输出 JSON，便于后续接入日志收集。
// 红线：任何密钥 / token / 用户隐私字段都不得传入 logger（见 server/README.md 日志规则）。
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'ciyuan-muse-server' },
})
