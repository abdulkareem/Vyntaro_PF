import { Router } from 'express'
import {
  createLedgerEntry,
  createOrder,
  createStatement,
  createTripBooking,
  getSubscription,
  ledgerSchema,
  listInsights,
  paymentWebhook,
  paymentWebhookSchema,
  shopOrderSchema,
  tripSchema
} from '../controllers/financeController.js'
import { requireUser } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.use(requireUser)
router.post('/ledger/entries', validate(ledgerSchema), createLedgerEntry)
router.post('/shop/orders', validate(shopOrderSchema), createOrder)
router.post('/trips', validate(tripSchema), createTripBooking)
router.get('/subscriptions/current', getSubscription)
router.post('/payments/webhook', validate(paymentWebhookSchema), paymentWebhook)
router.post('/statements/generate', createStatement)
router.get('/insights', listInsights)

export default router
