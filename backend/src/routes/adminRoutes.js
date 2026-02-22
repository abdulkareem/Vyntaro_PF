import { Router } from 'express'
import {
  adminLogin,
  adminLoginSchema,
  deleteUser,
  listTables,
  listUsers,
  resetUserPin,
  updateUser,
  upsertSetting
} from '../controllers/adminController.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.post('/login', validate(adminLoginSchema), adminLogin)
router.use(requireAdmin)
router.get('/users', listUsers)
router.patch('/users/:userId', updateUser)
router.patch('/users/:userId/reset-pin', resetUserPin)
router.delete('/users/:userId', deleteUser)
router.get('/tables', listTables)
router.put('/settings', upsertSetting)

export default router
