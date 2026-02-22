import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { hashPin } from '../utils/security.js'

export async function provisionSuperAdmin(_req, res, next) {
  try {
    const exists = await prisma.user.findFirst({ where: { role: 'superadmin' } })
    if (exists) {
      return res.status(200).json({ ok: true, data: { message: 'SuperAdmin already exists', id: exists.id } })
    }

    const admin = await prisma.user.create({
      data: {
        email: env.superAdminEmail,
        mobile: env.superAdminMobile,
        pinHash: await hashPin(env.superAdminPin),
        role: 'superadmin',
        isActive: true,
        name: 'System SuperAdmin'
      },
      select: { id: true, email: true, mobile: true, role: true, isActive: true }
    })

    return res.status(201).json({ ok: true, data: { admin } })
  } catch (error) {
    return next(error)
  }
}
