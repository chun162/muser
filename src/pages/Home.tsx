import { Link } from 'react-router-dom'

// 词元智算首页：Hro + 四入口卡片
// 对标 TopenMuse 品牌首页体验

const ENTRIES = [
  {
    title: '图片生成',
    desc: '文生图 / 图生图，支持多画风、批量出图',
    icon: '🎨',
    to: '/image',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  },
  {
    title: '视频生成',
    desc: '文生视频 / 图生视频 / 首尾帧',
    icon: '🎬',
    to: '/video',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
  },
  {
    title: '无限画布',
    desc: '节点式多步创作，拖拽编排',
    icon: '✏️',
    to: '/canvas',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
  },
  {
    title: 'AI 工具箱',
    desc: '扩图 / 局部重绘 / 超分',
    icon: '🔧',
    to: '/tools',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
  },
] as const

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="hero-gradient -mx-3 -mt-3 rounded-b-2xl px-3 pb-12 pt-12 text-center sm:-mx-4 sm:-mt-4 sm:px-4 sm:pt-20 sm:pb-16">
        <h1 className="animate-fade-up text-3xl font-bold tracking-tight sm:text-5xl">
          词元智算
        </h1>
        <p className="animate-fade-up animate-fade-up-d1 mx-auto mt-3 max-w-lg text-sm leading-relaxed text-neutral-400 sm:text-base">
          一站式 AI 创作平台。
          <br className="sm:hidden" />
          图片 · 视频 · 画布 · 工具箱
        </p>
        <p className="animate-fade-up animate-fade-up-d2 mx-auto mt-2 max-w-md text-xs text-neutral-600 sm:text-sm">
          本地优先 · 零后端 · BYOK 自持密钥
        </p>
        <div className="animate-fade-up animate-fade-up-d3 mt-6 flex items-center justify-center gap-3 text-sm">
          <Link
            to="/image"
            className="btn-glow rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
          >
            开始创作
          </Link>
          <Link
            to="/settings"
            className="rounded-lg border border-neutral-700 px-5 py-2 text-neutral-300 transition-colors hover:bg-neutral-800"
          >
            配置密钥
          </Link>
        </div>
      </section>

      {/* 入口卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ENTRIES.map((e, i) => (
          <Link
            key={e.title}
            to={e.to}
            className={`animate-fade-up group relative overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-5 transition-all hover:border-neutral-700 hover:bg-neutral-900/60`}
            style={{ animationDelay: `${(i + 1) * 0.1}s` }}
          >
            {/* 渐变底色 */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${e.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
            />

            <div className="relative z-10">
              <div className="mb-3 text-2xl">{e.icon}</div>
              <h2 className="text-lg font-semibold group-hover:text-emerald-300 transition-colors">
                {e.title}
              </h2>
              <p className="mt-1 text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors">
                {e.desc}
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm text-emerald-400 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
                进入
                <span className="text-base">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
