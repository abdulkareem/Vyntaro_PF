import { prisma } from '../config/prisma.js'
import { generateAIInsights } from './insightService.js'

export async function generateStatement({ userId, period, periodStart, periodEnd }) {
  const [entries, payments, orders, trips, referrals] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { userId, transactionDate: { gte: periodStart, lte: periodEnd } } }),
    prisma.payment.findMany({ where: { userId, paidAt: { gte: periodStart, lte: periodEnd }, status: 'succeeded' } }),
    prisma.shopOrder.findMany({ where: { userId, orderDate: { gte: periodStart, lte: periodEnd } } }),
    prisma.trip.findMany({ where: { userId, tripDate: { gte: periodStart, lte: periodEnd } } }),
    prisma.referral.findMany({ where: { referrerUserId: userId, successfulPaidAt: { gte: periodStart, lte: periodEnd } } })
  ])

  const movement = entries.reduce((sum, e) => sum + BigInt(e.amountMinor), 0n)
  const tax = payments.reduce((sum, p) => sum + BigInt(p.gstAmountMinor), 0n)
  const charges = payments.reduce((sum, p) => sum + BigInt(p.baseAmountMinor), 0n)
  const shopPurchases = orders.reduce((sum, o) => sum + BigInt(o.totalAmountMinor), 0n)
  const travel = trips.reduce((sum, t) => sum + BigInt(t.actualFareMinor ?? 0), 0n)
  const referralBenefitMinor = BigInt(referrals.length) * 100n

  const ai = await generateAIInsights(userId)

  return prisma.statement.create({
    data: {
      userId,
      period,
      periodStart,
      periodEnd,
      openingBalanceMinor: 0n,
      closingBalanceMinor: movement,
      categorySummary: { transactionCount: entries.length, shopPurchasesMinor: shopPurchases.toString(), travelExpensesMinor: travel.toString() },
      featureUsageSummary: { financialManagement: true },
      subscriptionChargesMinor: charges,
      taxMinor: tax,
      referralBenefitMinor,
      aiSummary: ai.summary,
      pdfUrl: `/secure/statements/${userId}-${periodStart.toISOString()}.pdf`
    }
  })
}
