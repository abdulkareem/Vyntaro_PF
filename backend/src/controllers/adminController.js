import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { comparePin, hashPin } from '../utils/security.js'

export const adminLoginSchema = z.object({
  mobile: z.string().min(8),
  pin: z.string().regex(/^\d{4}$/)
})

export async function adminLogin(req, res, next) {
  try {
    const { mobile, pin } = req.body
    const admin = await prisma.user.findUnique({ where: { mobile } })

    if (!admin || admin.role !== 'superadmin' || !admin.pinHash) {
      throw new HttpError(401, 'Invalid admin credentials')
    }

    const valid = await comparePin(pin, admin.pinHash)
    if (!valid) throw new HttpError(401, 'Invalid admin credentials')

    const token = jwt.sign({ sub: admin.id, role: admin.role }, env.adminJwtSecret, { expiresIn: '12h' })
    return res.json({ ok: true, data: { token } })
  } catch (error) {
    return next(error)
  }
}

export async function listUsers(_req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, mobile: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true }
    })
    return res.json({ ok: true, data: users })
  } catch (error) {
    return next(error)
  }
}

export async function updateUser(req, res, next) {
  try {
    const schema = z.object({ email: z.string().email().optional(), name: z.string().min(2).optional(), isActive: z.boolean().optional() })
    const payload = schema.parse(req.body)
    const user = await prisma.user.update({ where: { id: req.params.userId }, data: payload, select: { id: true, email: true, mobile: true, name: true, role: true, isActive: true } })
    return res.json({ ok: true, data: user })
  } catch (error) {
    return next(error)
  }
}

export async function resetUserPin(req, res, next) {
  try {
    const { pin } = z.object({ pin: z.string().regex(/^\d{4}$/) }).parse(req.body)
    await prisma.user.update({ where: { id: req.params.userId }, data: { pinHash: await hashPin(pin) } })
    return res.json({ ok: true, data: { message: 'User PIN reset successfully' } })
  } catch (error) {
    return next(error)
  }
}

export async function deleteUser(req, res, next) {
  try {
    await prisma.user.delete({ where: { id: req.params.userId } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

export async function listTables(_req, res, next) {
  try {
    const [users, tokens, settings] = await Promise.all([
      prisma.user.findMany(),
      prisma.pinResetToken.findMany(),
      prisma.appSetting.findMany()
    ])
    return res.json({ ok: true, data: { users, pinResetTokens: tokens, appSettings: settings } })
  } catch (error) {
    return next(error)
  }
}

export async function upsertSetting(req, res, next) {
  try {
    const { key, value } = z.object({ key: z.string().min(1), value: z.any() }).parse(req.body)
    const setting = await prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
    return res.json({ ok: true, data: setting })
  } catch (error) {
    return next(error)
  }
}
