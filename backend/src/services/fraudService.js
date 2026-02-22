import { prisma } from '../config/prisma.js'

export async function detectFraudSignals({ userId, referralCode, ipAddress, deviceId, paymentFingerprint }) {
  const flags = []

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.referralCode === referralCode) {
    flags.push({ type: 'self_referral', details: { referralCode } })
  }

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

  if (!flags.length) return []

  return prisma.$transaction(flags.map((flag) => prisma.fraudFlag.create({
    data: { userId, type: flag.type, details: flag.details }
  })))
}
