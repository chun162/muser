import { Router } from 'express'
import { ok } from '../common/response'
import { BUILTIN_STYLES } from '../data/builtinStyles'

// GET /api/styles — 内置画风目录（只读）
export const stylesRouter = Router()

stylesRouter.get('/', (_req, res) => {
  res.json(ok(BUILTIN_STYLES))
})
