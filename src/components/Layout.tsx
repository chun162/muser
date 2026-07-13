import { Link, Outlet } from 'react-router-dom'

// 全局元素遵循 docs/specs/05-信息架构与路由.md：
// 品牌 + 设置入口 + 常驻「本地优先 · 零后端」徽标
export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <Link to="/" className="font-semibold tracking-wide">
          珑点智算 · Muse
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
            本地优先 · 零后端
          </span>
          <Link to="/settings" className="text-neutral-300 hover:text-emerald-300">
            设置
          </Link>
          <Link to="/account" className="text-neutral-300 hover:text-emerald-300">
            账户
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
