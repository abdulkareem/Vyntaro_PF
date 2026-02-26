import { Router } from 'express'
import { forgotPinSchema, login, loginSchema, register, registerSchema, setPin, setPinSchema, startPinReset } from '../controllers/authController.js'
import { requireUser } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/set-pin', requireUser, validate(setPinSchema), setPin)
router.post('/reset-pin/start', validate(forgotPinSchema), startPinReset)

export default router
