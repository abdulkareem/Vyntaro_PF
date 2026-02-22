import { prisma } from '../config/prisma.js'
import { postDoubleEntry } from './accountingService.js'

export function computeGstBreakup({ country, baseAmountMinor }) {
  const base = BigInt(baseAmountMinor)
  if (country !== 'IN') {
    return { gstAmountMinor: 0n, cgstAmountMinor: 0n, sgstAmountMinor: 0n, igstAmountMinor: 0n, totalAmountMinor: base }
  }

  const gst = (base * 18n) / 100n
  const half = gst / 2n
  return {
    gstAmountMinor: gst,
    cgstAmountMinor: half,
    sgstAmountMinor: gst - half,
    igstAmountMinor: 0n,
    totalAmountMinor: base + gst
  }
}

export async function verifyWebhookAndCapture({ gatewayReference, userId, subscriptionId, baseAmountMinor, country, currency }) {
  const tax = computeGstBreakup({ country, baseAmountMinor })

  const payment = await prisma.payment.upsert({
    where: { gatewayReference },
    update: { status: 'succeeded', paidAt: new Date() },
    create: {
      userId,
      subscriptionId,
      gateway: 'mock_gateway',
      gatewayReference,
      status: 'succeeded',
      baseAmountMinor: BigInt(baseAmountMinor),
      ...tax,
      country,
      currency,
      totalAmountMinor: tax.totalAmountMinor,
      paidAt: new Date()
    }
  })

  await postDoubleEntry({
    userId,
    debitAccountId: process.env.CASH_ACCOUNT_ID,
    creditAccountId: process.env.REVENUE_ACCOUNT_ID,
    amountMinor: payment.baseAmountMinor,
    currency,
    referenceId: payment.id,
    referenceType: 'subscription_payment',
    description: 'Subscription charge'
  })

  return payment
}
