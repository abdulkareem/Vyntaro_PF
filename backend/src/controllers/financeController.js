import { z } from 'zod'
import { postDoubleEntry } from '../services/accountingService.js'
import { ensureUserSubscription } from '../services/subscriptionService.js'
import { verifyWebhookAndCapture } from '../services/billingService.js'
import { generateStatement } from '../services/statementService.js'
import { generateAIInsights } from '../services/insightService.js'
import { createShopOrder, createTrip } from '../services/commerceService.js'

export const ledgerSchema = z.object({
  debitAccountId: z.string(),
  creditAccountId: z.string(),
  amountMinor: z.string(),
  currency: z.string().length(3),
  referenceId: z.string(),
  referenceType: z.string(),
  description: z.string().optional()
})

export const shopOrderSchema = z.object({
  shopId: z.string(),
  shopName: z.string(),
  shopLocation: z.string().optional(),
  orderId: z.string(),
  orderDate: z.coerce.date(),
  orderStatus: z.enum(['pending', 'confirmed', 'packed', 'delivered', 'cancelled']),
  totalAmount: z.string(),
  paymentReference: z.string().optional(),
  currency: z.string().length(3),
  items: z.array(z.object({
    itemName: z.string(),
    category: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.string(),
    totalPrice: z.string()
  })).min(1)
})

export const tripSchema = z.object({
  pickupLocationText: z.string(),
  pickupLatitude: z.number(),
  pickupLongitude: z.number(),
  dropLocationText: z.string(),
  dropLatitude: z.number(),
  dropLongitude: z.number(),
  distanceEstimate: z.number().optional(),
  fareEstimate: z.string().optional(),
  actualFare: z.string().optional(),
  tripStatus: z.enum(['requested', 'accepted', 'in_progress', 'completed', 'cancelled']),
  tripDate: z.coerce.date(),
  vehicleType: z.enum(['auto', 'car']).optional(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverId: z.string().optional()
})

export async function createLedgerEntry(req, res, next) {
  try {
    const entry = await postDoubleEntry({ userId: req.user.sub, ...req.body })
    return res.status(201).json({ ok: true, data: entry })
  } catch (error) {
    return next(error)
  }
}

export async function createOrder(req, res, next) {
  try {
    const order = await createShopOrder(req.user.sub, req.body)
    return res.status(201).json({ ok: true, data: order })
  } catch (error) {
    return next(error)
  }
}

export async function createTripBooking(req, res, next) {
  try {
    const trip = await createTrip(req.user.sub, req.body)
    return res.status(201).json({ ok: true, data: trip })
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
