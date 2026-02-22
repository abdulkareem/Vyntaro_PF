import { z } from 'zod'
import { postDoubleEntry } from '../services/accountingService.js'
import { ensureUserSubscription } from '../services/subscriptionService.js'
import { verifyWebhookAndCapture } from '../services/billingService.js'
import { generateStatement } from '../services/statementService.js'
import { generateAIInsights } from '../services/insightService.js'

export const ledgerSchema = z.object({
  debitAccountId: z.string(),
  creditAccountId: z.string(),
  amountMinor: z.string(),
  currency: z.string().length(3),
  referenceId: z.string(),
  referenceType: z.string(),
  description: z.string().optional()
})

export async function createLedgerEntry(req, res, next) {
  try {
    const entry = await postDoubleEntry({ userId: req.user.sub, ...req.body })
    return res.status(201).json({ ok: true, data: entry })
  } catch (error) {
    return next(error)
  }
}

export async function getSubscription(req, res, next) {
  try {
    const sub = await ensureUserSubscription(req.user.sub)
    return res.json({ ok: true, data: sub })
  } catch (error) {
    return next(error)
  }
}

export const paymentWebhookSchema = z.object({
  gatewayReference: z.string(),
  subscriptionId: z.string().optional(),
  baseAmountMinor: z.string(),
  country: z.string(),
  currency: z.string().length(3)
})

export async function paymentWebhook(req, res, next) {
  try {
    const payment = await verifyWebhookAndCapture({ userId: req.user.sub, ...req.body })
    return res.json({ ok: true, data: payment })
  } catch (error) {
    return next(error)
  }
}

export async function createStatement(req, res, next) {
  try {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const statement = await generateStatement({ userId: req.user.sub, period: 'monthly', periodStart: start, periodEnd: now })
    return res.status(201).json({ ok: true, data: statement })
  } catch (error) {
    return next(error)
  }
}

export async function listInsights(req, res, next) {
  try {
    const insight = await generateAIInsights(req.user.sub)
    return res.json({ ok: true, data: [insight] })
  } catch (error) {
    return next(error)
  }
}
