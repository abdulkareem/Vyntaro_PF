import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { hashPin } from '../utils/security.js'
import { HttpError } from '../utils/httpError.js'

function assertNonProduction() {
  if (process.env.NODE_ENV === 'production') {
    throw new HttpError(404, 'Not found')
  }
}

function assertBootstrapAccess(req) {
  if (!env.allowAdminBootstrap) {
    throw new HttpError(403, 'Bootstrap is disabled')
  }

  const secret = req.headers['x-bootstrap-secret']
  if (!env.adminBootstrapSecret || secret !== env.adminBootstrapSecret) {
    throw new HttpError(401, 'Invalid bootstrap secret')
  }
}

export async function provisionSuperAdmin(_req, res, next) {
  try {
    assertNonProduction()
    assertBootstrapAccess(_req)

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

const promoteAdminSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  mobile: z.string().min(8).optional(),
  role: z.enum(['admin', 'superadmin']).default('admin')
}).superRefine((value, ctx) => {
  if (!value.userId && !value.email && !value.mobile) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['userId'], message: 'Provide userId, email, or mobile.' })
  }
})

export async function promoteAdminForDev(req, res, next) {
  try {
    assertNonProduction()
    assertBootstrapAccess(req)
    const payload = promoteAdminSchema.parse(req.body)

    const where = payload.userId
      ? { id: payload.userId }
      : payload.email
        ? { email: payload.email }
        : { mobile: payload.mobile }

    const admin = await prisma.user.update({
      where,
      data: { role: payload.role, isActive: true },
      select: { id: true, email: true, mobile: true, role: true, isActive: true }
    })

    return res.json({ ok: true, data: { admin } })
  } catch (error) {
    return next(error)
  }
}
