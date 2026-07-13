// 集中配置 — 所有环境变量在此收敛，带合理默认值
export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  LOG_LEVEL:
    process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  // 账户/JWT
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  DB_PATH: process.env.DB_PATH ?? './data/app.db',
}
