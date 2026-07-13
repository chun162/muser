// 统一模型注册(BYOK) — 遵循 docs/specs/04-统一模型注册(BYOK).md
// 密钥安全红线：apiKey 仅存本地，绝不出库/日志（见 CODEBUDDY.md §3）

// 设置页展示 Key 时默认掩码（spec 04 §5）
export function maskKey(key: string): string {
  if (key.length <= 4) return '••••'
  return key.slice(0, 2) + '•'.repeat(Math.max(0, key.length - 4)) + key.slice(-2)
}
