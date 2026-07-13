// API 基址：开发期走 Vite 代理(/api)；生产期可用 VITE_API_BASE 指向后端地址，或经 Vercel rewrite 代理。
export const API_BASE = import.meta.env.VITE_API_BASE
  ? `${String(import.meta.env.VITE_API_BASE).replace(/\/+$/, '')}/api`
  : '/api'
