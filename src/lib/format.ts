import type { StyleCategory } from '../types'

export function catLabel(c: StyleCategory): string {
  return { '2d': '2D动漫', '3d': '3D动漫', realistic: '写实风格', custom: '自定义风格' }[c]
}
