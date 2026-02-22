import { Router } from 'express'
import { listFraudFlags, overrideFeature, revenueAnalytics } from '../controllers/governanceController.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAdmin)
router.get('/analytics/revenue', revenueAnalytics)
router.get('/fraud-flags', listFraudFlags)
router.post('/feature-overrides', overrideFeature)

export default router
