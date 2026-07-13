import { Router } from 'express'
import { ok } from '../common/response'
import { validateVideoInput } from '../validate/video'
import { generateVideo } from '../services/videoService'

// POST /api/video — 视频生成（BYOK 代理）
export const videoRouter = Router()

videoRouter.post('/', async (req, res, next) => {
  try {
    const input = validateVideoInput(req.body)
    const result = await generateVideo(input)
    res.json(ok(result))
  } catch (err) {
    next(err)
  }
})
