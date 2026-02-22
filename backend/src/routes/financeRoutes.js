import { Router } from 'express'
import {
  createLedgerEntry,
  createStatement,
  getSubscription,
  ledgerSchema,
  listInsights,
  paymentWebhook,
  paymentWebhookSchema
} from '../controllers/financeController.js'
import { requireUser } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.use(requireUser)
router.post('/ledger/entries', validate(ledgerSchema), createLedgerEntry)
router.get('/subscriptions/current', getSubscription)
router.post('/payments/webhook', validate(paymentWebhookSchema), paymentWebhook)
router.post('/statements/generate', createStatement)
router.get('/insights', listInsights)

export default router
