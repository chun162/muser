import { NavLink, Outlet, Link } from 'react-router-dom'

// 词元智算 · 全局导航（对齐 TopenMuse UI 风格）
// 品牌紫渐变：violet → indigo → cyan

const NAV_MAIN = [
  { to: '/', label: '首页', icon: '◆' },
  { to: '/image', label: '图片', icon: '■' },
  { to: '/video', label: '视频', icon: '▶' },
  { to: '/styles', label: '画风', icon: '✦' },
  { to: '/canvas', label: '画布', icon: '◇' },
  { to: '/tools', label: '工具箱', icon: '⚙' },
  { to: '/works', label: '作品', icon: '▣' },
]

export default function Layout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
      {/* 顶部导航栏 */}
      <header
        className="sticky top-0 z-30"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-base)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* 左：品牌 */}
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold"
              style={{ background: 'var(--brand-gradient)', color: '#fff' }}
            >
              M
            </span>
            <span className="hidden text-sm font-semibold sm:inline" style={{ color: 'var(--text-primary)' }}>
              词元智算
            </span>
          </Link>

          {/* 中：导航链接 */}
          <nav className="flex items-center gap-0.5 text-sm">
            {NAV_MAIN.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--accent-text)' : 'var(--text-tertiary)',
                  backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
                })}
              >
                <span className="hidden sm:inline">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* 右：设置 */}
          <div className="flex items-center gap-2 text-sm">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent-text)' : 'var(--text-tertiary)',
                backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
              })}
            >
              设置
            </NavLink>
          </div>
        </div>
      </header>

      {/* 主体 */}
      <main className="mx-auto max-w-6xl p-3 sm:p-4 sm:pt-6">
        <Outlet />
      </main>
    </div>
  )
}
