import {
	login,
	logout,
	me,
	oauthApple,
	oauthGoogle,
	register
} from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import { loginSchema, registerSchema } from '../validation/authValidation'

import { Router } from 'express'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)

router.post('/oauth/google', oauthGoogle)
router.post('/oauth/apple', oauthApple)

router.get('/me', authMiddleware, me)
router.post('/logout', authMiddleware, logout)

export default router
