import { Link } from 'react-router-dom'

// 首页四入口卡片 — 遵循 docs/specs/05-信息架构与路由.md
// 图片生成可用；视频/画布/工具箱置灰并标注「即将上线」（P2/P3）
const ENTRIES = [
  { title: '图片生成', desc: '文生图 / 图生图', enabled: true, to: '/image' },
  { title: '视频生成', desc: '文生视频 / 图生视频 / 首尾帧', enabled: true, to: '/video' },
  { title: '无限画布', desc: '节点式多步创作', enabled: true, to: '/canvas' },
  { title: 'AI 工具箱', desc: '扩图 / 局部重绘 / 超分', enabled: true, to: '/tools' },
] as const

export default function Home() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">多入口 AI 创作平台</h1>
      <p className="mb-6 text-neutral-400">作品与项目存于本机浏览器，不上云、不登录。</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ENTRIES.map((e) => (
          <div
            key={e.title}
            className={`rounded-xl border border-neutral-800 p-4 ${
              e.enabled ? '' : 'opacity-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{e.title}</h2>
              {!e.enabled && <span className="text-xs text-neutral-500">即将上线</span>}
            </div>
            <p className="mt-1 text-sm text-neutral-400">{e.desc}</p>
            <div className="mt-3 text-sm">
              {e.enabled ? (
                <Link to={e.to} className="text-emerald-300 hover:underline">
                  进入 →
                </Link>
              ) : (
                <span className="text-neutral-600">进入</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
