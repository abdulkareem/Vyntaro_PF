import { prisma } from '../config/prisma.js'
import { generateAIInsights } from './insightService.js'

export async function generateStatement({ userId, period, periodStart, periodEnd }) {
  const [entries, payments] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { userId, transactionDate: { gte: periodStart, lte: periodEnd } } }),
    prisma.payment.findMany({ where: { userId, paidAt: { gte: periodStart, lte: periodEnd }, status: 'succeeded' } })
  ])

  const movement = entries.reduce((sum, e) => sum + BigInt(e.amountMinor), 0n)
  const tax = payments.reduce((sum, p) => sum + BigInt(p.gstAmountMinor), 0n)
  const charges = payments.reduce((sum, p) => sum + BigInt(p.baseAmountMinor), 0n)

  const ai = await generateAIInsights(userId)

  return prisma.statement.create({
    data: {
      userId,
      period,
      periodStart,
      periodEnd,
      openingBalanceMinor: 0n,
      closingBalanceMinor: movement,
      categorySummary: { transactionCount: entries.length },
      featureUsageSummary: { financialManagement: true },
      subscriptionChargesMinor: charges,
      taxMinor: tax,
      referralBenefitMinor: 0n,
      aiSummary: ai.summary,
      pdfUrl: `/secure/statements/${userId}-${periodStart.toISOString()}.pdf`
    }
  })
}
