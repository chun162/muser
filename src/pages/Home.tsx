import { Link } from 'react-router-dom'

// 词元智算首页 · 对齐 TopenMuse
// Aurora 背景 + 四入口 + 品牌 CTA

const ENTRIES = [
  {
    title: '图片生成',
    desc: '文生图 / 图生图 / 多画风',
    icon: '🎨',
    to: '/image',
    gradient: 'linear-gradient(120deg, #0f1a2e 0%, #1a1a3e 50%, #2d1b4e 100%)',
  },
  {
    title: '视频生成',
    desc: '文生视频 / 图生视频',
    icon: '🎬',
    to: '/video',
    gradient: 'linear-gradient(120deg, #0b1f3a 0%, #1b2a6b 45%, #3b1d6e 100%)',
  },
  {
    title: '无限画布',
    desc: 'tldraw 绘图 / 标注 / 白板',
    icon: '✏️',
    to: '/canvas',
    gradient: 'linear-gradient(120deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  },
  {
    title: 'AI 工具箱',
    desc: '消除字幕 / AI 配音 / 扩图',
    icon: '🔧',
    to: '/tools',
    gradient: 'linear-gradient(120deg, #1a0a2e 0%, #2d1b4e 50%, #1a1a3e 100%)',
  },
]

export default function Home() {
  return (
    <div className="relative">
      {/* Aurora 背景 */}
      <div className="aurora-stage">
        <div className="aurora-blob b1" />
        <div className="aurora-blob b2" />
        <div className="aurora-blob b3" />
        <div className="aurora-blob b4" />
        <div className="aurora-stars" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl px-6 pb-14 pt-14 sm:px-10 sm:pb-18 sm:pt-20">
          {/* 发光球 */}
          <div className="hero-glow-orb" style={{ width: 400, height: 400, top: -120, left: '50%', transform: 'translateX(-50%)' }} />

          <div className="relative text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-card-border)', boxShadow: '0 8px 32px rgba(129,140,248,0.55), 0 0 60px rgba(167,139,250,0.45)' }}>
              <span className="text-xl font-bold" style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>M</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
              词元智算
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-tertiary)' }}>
              多入口 AI 创作平台 · 图片 / 视频 / 画布 / 工具箱
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs" style={{ color: 'var(--text-muted)' }}>
              本地优先 · 零后端 · BYOK 自持密钥
            </p>

            <div className="mt-7 flex items-center justify-center gap-3 text-sm">
              <Link
                to="/image"
                className="btn-brand"
              >
                开始创作
              </Link>
              <Link
                to="/settings"
                className="btn-ghost"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--surface-card-bg)', color: 'var(--text-secondary)',
                  border: '1px solid var(--surface-card-border)',
                  borderRadius: 'var(--radius-md)', padding: '0.625rem 1rem',
                  fontSize: '0.8125rem', fontWeight: 500,
                }}
              >
                配置密钥
              </Link>
            </div>
          </div>
        </section>

        {/* 入口卡片网格 */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ENTRIES.map((e, i) => (
            <Link
              key={e.title}
              to={e.to}
              className="group relative overflow-hidden rounded-xl p-5 transition-all"
              style={{
                background: e.gradient,
                border: '1px solid var(--surface-card-border)',
              }}
            >
              {/* Hover 高光 */}
              <div
                className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(129,140,248,0.05) 100%)',
                }}
              />

              <div className="relative z-10">
                <div className="mb-2 text-2xl">{e.icon}</div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {e.title}
                </h3>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {e.desc}
                </p>
                <div
                  className="mt-3 flex items-center gap-1 text-xs opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                  style={{ color: 'var(--accent-text)' }}
                >
                  进入 <span className="text-sm">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
