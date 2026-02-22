import { prisma } from '../config/prisma.js'

export function shouldFlagDuplicateTrip(existingCount) {
  return existingCount > 0
}

export async function detectFraudSignals({ userId, referralCode, ipAddress, deviceId, paymentFingerprint, tripFingerprint, shopOrderExternalId, ledgerMutationAttempt = false }) {
  const flags = []

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.referralCode === referralCode) flags.push({ type: 'self_referral', details: { referralCode } })

  if (ipAddress) {
    const count = await prisma.adminAuditLog.count({ where: { action: 'auth.login', metadata: { path: ['ipAddress'], equals: ipAddress } } })
    if (count > 3) flags.push({ type: 'shared_ip', details: { ipAddress, count } })
  }

  if (deviceId) {
    const count = await prisma.adminAuditLog.count({ where: { action: 'auth.login', metadata: { path: ['deviceId'], equals: deviceId } } })
    if (count > 3) flags.push({ type: 'shared_device', details: { deviceId, count } })
  }

  if (paymentFingerprint) {
    const count = await prisma.payment.count({ where: { paymentSourceFingerprint: paymentFingerprint } })
    if (count > 2) flags.push({ type: 'shared_payment_source', details: { paymentFingerprint, count } })
  }

  if (tripFingerprint) {
    const count = await prisma.trip.count({ where: { userId, pickupLocationText: tripFingerprint.pickup, dropLocationText: tripFingerprint.drop, tripDate: tripFingerprint.tripDate } })
    if (shouldFlagDuplicateTrip(count)) flags.push({ type: 'duplicate_trip', details: tripFingerprint })
  }

  if (shopOrderExternalId) {
    const count = await prisma.shopOrder.count({ where: { userId, orderExternalId: shopOrderExternalId } })
    if (count > 0) flags.push({ type: 'fake_shop_order', details: { shopOrderExternalId } })
  }

  if (ledgerMutationAttempt) flags.push({ type: 'ledger_manipulation', details: { reason: 'immutable-ledger-violation' } })

  if (!flags.length) return []

  return prisma.$transaction(flags.map((flag) => prisma.fraudFlag.create({
    data: { userId, type: flag.type, details: flag.details }
  })))
}
