import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/httpError.js'

const PRICING = {
  IN: {
    monthly: { amountMinor: 2900n, currency: 'INR' },
    yearly: { amountMinor: 29900n, currency: 'INR' }
  },
  GLOBAL: {
    monthly: { amountMinor: 199n, currency: 'USD' },
    yearly: { amountMinor: 1999n, currency: 'USD' }
  }
}

export function resolvePrice(country, plan) {
  const bucket = country === 'IN' ? PRICING.IN : PRICING.GLOBAL
  return bucket[plan]
}

export async function ensureUserSubscription(userId, country = 'US') {
  const existing = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
  if (existing) return existing

  const initial = resolvePrice(country, 'monthly')
  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 1)

  return prisma.subscription.create({
    data: {
      userId,
      plan: 'monthly',
      status: 'trial',
      startDate: now,
      endDate,
      nextBillingDate: endDate,
      freeMonthsRemaining: 1,
      paidMonths: 0,
      country,
      currency: initial.currency,
      unitAmountMinor: initial.amountMinor
    }
  })
}

export function calculateProration({ currentAmountMinor, daysInCycle, remainingDays, targetAmountMinor }) {
  const unusedCredit = (BigInt(currentAmountMinor) * BigInt(remainingDays)) / BigInt(daysInCycle)
  const adjustedAmount = BigInt(targetAmountMinor) - unusedCredit
  return { unusedCreditMinor: unusedCredit, adjustedAmountMinor: adjustedAmount > 0n ? adjustedAmount : 0n }
}

export function evaluateReferralEligibility({ successfulReferrals, referralFreeMonthsAwarded, currentTotalFreeMonths }) {
  if (successfulReferrals < 3) return { eligible: false, reason: 'Insufficient successful referrals' }
  if (referralFreeMonthsAwarded >= 3) return { eligible: false, reason: 'Referral cap reached' }
  if (currentTotalFreeMonths >= 4) return { eligible: false, reason: 'Total free-month cap reached' }
  return { eligible: true }
}

export async function applyReferralReward(referrerUserId) {
  const successful = await prisma.referral.count({
    where: {
      referrerUserId,
      successfulPaidAt: { not: null },
      rewardApplied: false
    }
  })

  const sub = await prisma.subscription.findFirst({ where: { userId: referrerUserId }, orderBy: { createdAt: 'desc' } })
  if (!sub) throw new HttpError(404, 'Subscription not found')

  const referralFreeMonthsAwarded = Math.max(0, sub.freeMonthsRemaining - 1)
  const decision = evaluateReferralEligibility({
    successfulReferrals: successful,
    referralFreeMonthsAwarded,
    currentTotalFreeMonths: sub.freeMonthsRemaining
  })
  if (!decision.eligible) return { applied: false, reason: decision.reason }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: { freeMonthsRemaining: { increment: 1 } }
    }),
    prisma.referral.updateMany({
      where: {
        referrerUserId,
        successfulPaidAt: { not: null },
        rewardApplied: false
      },
      data: { rewardApplied: true }
    })
  ])

  return { applied: true }
}
