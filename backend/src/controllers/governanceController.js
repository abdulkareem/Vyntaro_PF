import { prisma } from '../config/prisma.js'

export async function revenueAnalytics(_req, res, next) {
  try {
    const [activeUsers, trialUsers, gstCollected, totalRevenue] = await Promise.all([
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'trial' } }),
      prisma.payment.aggregate({ _sum: { gstAmountMinor: true }, where: { status: 'succeeded' } }),
      prisma.payment.aggregate({ _sum: { totalAmountMinor: true }, where: { status: 'succeeded' } })
    ])

    return res.json({
      ok: true,
      data: {
        mrrMinor: totalRevenue._sum.totalAmountMinor || 0,
        arrMinor: Number(totalRevenue._sum.totalAmountMinor || 0) * 12,
        churnRate: 0,
        activeUsers,
        trialUsers,
        gstCollectedMinor: gstCollected._sum.gstAmountMinor || 0
      }
    })
  } catch (error) {
    return next(error)
  }
}

export async function listFraudFlags(_req, res, next) {
  try {
    const flags = await prisma.fraudFlag.findMany({ where: { isResolved: false }, orderBy: { createdAt: 'desc' } })
    return res.json({ ok: true, data: flags })
  } catch (error) {
    return next(error)
  }
}

export async function overrideFeature(req, res, next) {
  try {
    const { userId, featureId, isPaid, reason } = req.body
    const override = await prisma.userFeatureOverride.upsert({
      where: { userId_featureId: { userId, featureId } },
      update: { isPaid, reason, createdById: req.admin.sub },
      create: { userId, featureId, isPaid, reason, createdById: req.admin.sub }
    })

    await prisma.adminAuditLog.create({
      data: {
        actorId: req.admin.sub,
        action: 'feature.override',
        targetType: 'user_feature_override',
        targetId: override.id,
        metadata: { userId, featureId, isPaid, reason }
      }
    })

    return res.json({ ok: true, data: override })
  } catch (error) {
    return next(error)
  }
}
