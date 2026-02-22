import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { comparePin, generateResetToken, hashPin, hashResetToken } from '../utils/security.js'

const pinSchema = z.string().regex(/^\d{4}$/)

export const registerSchema = z.object({
  email: z.string().email(),
  mobile: z.string().min(8),
  name: z.string().min(2).max(100).optional(),
  pin: pinSchema
})

export async function register(req, res, next) {
  try {
    const { email, mobile, name, pin } = req.body

    const [emailUser, mobileUser] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { mobile } })
    ])

    if (emailUser) {
      throw new HttpError(409, 'Email already registered', { code: 'EMAIL_EXISTS', showLoginInstead: true })
    }

    if (mobileUser) {
      throw new HttpError(409, 'Mobile number already registered', { code: 'MOBILE_EXISTS' })
    }

    const user = await prisma.user.create({
      data: { email, mobile, name, pinHash: await hashPin(pin), role: 'user' },
      select: { id: true, email: true, mobile: true, name: true, role: true, isActive: true, createdAt: true }
    })

    return res.status(201).json({ ok: true, data: { user } })
  } catch (error) {
    return next(error)
  }
}

export const loginSchema = z.object({
  mobile: z.string().min(8),
  pin: pinSchema
})

export async function login(req, res, next) {
  try {
    const { mobile, pin } = req.body
    const user = await prisma.user.findUnique({ where: { mobile } })

    if (!user || !user.pinHash || !user.isActive) {
      throw new HttpError(401, 'Invalid mobile number or PIN')
    }

    const isValidPin = await comparePin(pin, user.pinHash)
    if (!isValidPin) throw new HttpError(401, 'Invalid mobile number or PIN')

    const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: '7d' })
    return res.json({
      ok: true,
      data: {
        token,
        user: { id: user.id, email: user.email, mobile: user.mobile, name: user.name, role: user.role, isActive: user.isActive }
      }
    })
  } catch (error) {
    return next(error)
  }
}

export const forgotPinSchema = z.object({
  email: z.string().email()
})

export async function startPinReset(req, res, next) {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new HttpError(404, 'User not found for provided email')

    const token = generateResetToken()
    const expiresAt = new Date(Date.now() + env.resetTokenTtlMinutes * 60 * 1000)

    await prisma.pinResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt
      }
    })

    return res.json({
      ok: true,
      data: {
        message: 'Reset token generated successfully',
        expiresAt,
        resetToken: process.env.NODE_ENV === 'production' ? undefined : token
      }
    })
  } catch (error) {
    return next(error)
  }
}
