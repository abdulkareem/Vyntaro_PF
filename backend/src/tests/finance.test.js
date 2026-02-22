import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateProration } from '../services/subscriptionService.js'
import { computeGstBreakup } from '../services/billingService.js'

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
