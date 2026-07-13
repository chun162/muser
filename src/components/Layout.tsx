import { NavLink, Outlet } from 'react-router-dom'

// 词元智算全局导航：左品牌 + 中导航 + 右设置
// 对标 TopenMuse 风格 + 本地优先标识

const NAV_LINKS = [
  { to: '/', label: '首页' },
  { to: '/image', label: '图片' },
  { to: '/video', label: '视频' },
  { to: '/styles', label: '画风' },
  { to: '/canvas', label: '画布' },
  { to: '/tools', label: '工具箱' },
  { to: '/works', label: '作品' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-30 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* 左：品牌 */}
          <NavLink to="/" className="flex items-center gap-2 text-base font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-sm text-neutral-950">
              🧠
            </span>
            <span className="hidden sm:inline">词元智算</span>
          </NavLink>

          {/* 中：导航链接 */}
          <nav className="flex items-center gap-1 text-sm">
            {NAV_LINKS.slice(0, 5).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* 右：本地标识 + 设置 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 text-xs text-emerald-400 sm:inline">
              本地优先
            </span>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 transition-colors ${
                  isActive ? 'bg-emerald-500/15 text-emerald-300' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`
              }
            >
              设置
            </NavLink>
          </div>
        </div>

        {/* 第二行导航（次要入口） */}
        <div className="border-t border-neutral-800/40 md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-1.5 text-sm">
            {NAV_LINKS.slice(5).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1 transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <span className="ml-auto rounded-full border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              本地优先
            </span>
          </div>
        </div>
      </header>

      {/* 主体 */}
      <main className="mx-auto max-w-6xl p-3 sm:p-4">
        <Outlet />
      </main>
    </div>
  )
}
