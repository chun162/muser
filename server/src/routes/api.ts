import { Router } from 'express'
import { generateRouter } from './generate'
import { videoRouter } from './video'
import { stylesRouter } from './styles'
import { authRouter } from './auth'

// /api 聚合路由
export const apiRouter = Router()
apiRouter.use('/generate', generateRouter)
apiRouter.use('/video', videoRouter)
apiRouter.use('/styles', stylesRouter)
apiRouter.use('/auth', authRouter)
