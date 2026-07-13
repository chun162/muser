import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite 官方配置：React 插件 + Tailwind CSS v4 Vite 插件（零配置，无需 tailwind.config.js）
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages：仓库名为 muser，base 设为 /muser/
  base: '/muser/',
  server: {
    // 开发期把 /api 代理到后端（Express，默认 3000），避免跨域
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
