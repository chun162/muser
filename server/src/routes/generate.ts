import { Router } from 'express'
import { ok } from '../common/response'
import { validateGenerateInput } from '../validate/generate'
import { generate as generateService } from '../services/generateService'

// POST /api/generate — 图片生成（BYOK 代理）
export const generateRouter = Router()

generateRouter.post('/', async (req, res, next) => {
  try {
    const input = validateGenerateInput(req.body)
    const result = await generateService(input)
    res.json(ok(result))
  } catch (err) {
    next(err) // 交 errorHandler 统一转信封
  }
})
