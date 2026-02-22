import { Router } from 'express'
import { forgotPinSchema, login, loginSchema, register, registerSchema, startPinReset } from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/reset-pin/start', validate(forgotPinSchema), startPinReset)

export default router
