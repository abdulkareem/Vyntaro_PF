import { prisma } from '../config/prisma.js'

export async function generateAIInsights(userId) {
  const since = new Date()
  since.setMonth(since.getMonth() - 2)

  const entries = await prisma.ledgerEntry.findMany({ where: { userId, transactionDate: { gte: since } } })
  const total = entries.reduce((sum, e) => sum + BigInt(e.amountMinor), 0n)
  const avgMonthly = total / 2n

  const insight = await prisma.aiInsight.create({
    data: {
      userId,
      insightType: 'cash_flow_prediction',
      title: 'Projected next month outflow',
      summary: `Projected outflow is ${(Number(avgMonthly) / 100).toFixed(2)} based on last 2 months trend.`,
      confidence: 0.67,
      payload: { avgMonthlyMinor: avgMonthly.toString(), sampleSize: entries.length }
    }
  })

  return insight
}
