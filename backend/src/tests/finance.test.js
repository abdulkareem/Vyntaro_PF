import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateProration, evaluateReferralEligibility } from '../services/subscriptionService.js'
import { computeGstBreakup } from '../services/billingService.js'
import { validateLedgerIntegrity } from '../services/accountingService.js'
import { shouldFlagDuplicateTrip } from '../services/fraudService.js'

test('ledger balancing is always symmetric for double-entry rows', () => {
  const out = validateLedgerIntegrity([{ amountMinor: 1000n }, { amountMinor: 2500n }])
  assert.equal(out.debits, 3500n)
  assert.equal(out.credits, 3500n)
  assert.equal(out.balanced, true)
})

test('proration computes unused credit and adjusted amount', () => {
  const out = calculateProration({ currentAmountMinor: 29900n, daysInCycle: 365, remainingDays: 180, targetAmountMinor: 199n })
  assert.equal(out.unusedCreditMinor > 0n, true)
  assert.equal(out.adjustedAmountMinor >= 0n, true)
})

test('india gst split', () => {
  const out = computeGstBreakup({ country: 'IN', baseAmountMinor: 2900n })
  assert.equal(out.gstAmountMinor, 522n)
  assert.equal(out.totalAmountMinor, 3422n)
})

test('referral caps enforce monthly limits', () => {
  const blocked = evaluateReferralEligibility({ successfulReferrals: 6, referralFreeMonthsAwarded: 3, currentTotalFreeMonths: 4 })
  assert.equal(blocked.eligible, false)

  const allowed = evaluateReferralEligibility({ successfulReferrals: 3, referralFreeMonthsAwarded: 1, currentTotalFreeMonths: 2 })
  assert.equal(allowed.eligible, true)
})

test('duplicate trip detector flags repeated lifecycle payload', () => {
  assert.equal(shouldFlagDuplicateTrip(0), false)
  assert.equal(shouldFlagDuplicateTrip(1), true)
})
