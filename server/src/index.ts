import { createApp } from './app'
import { env } from './config/env'
import { logger } from './common/logger'

// 入口：创建 app 并监听端口
const app = createApp()

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'server.started')
})
