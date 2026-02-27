import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { comparePin, generateResetToken, hashPin, hashResetToken } from '../utils/security.js'
import { ensureUserSubscription } from '../services/subscriptionService.js'
import { findUserForPinReset, forgotPinSchema } from '../services/pinResetService.js'

const pinSchema = z.string().regex(/^\d{4}$/)

export const registerSchema = z.object({
  email: z.string().email().optional(),
  mobile: z.string().min(8),
  name: z.string().min(2).max(100).optional(),
  pin: pinSchema.optional(),
  country: z.string().default('US'),
  referralCode: z.string().optional()
})

export async function register(req, res, next) {
  try {
    const { email, mobile, name, pin, country, referralCode } = req.body

    const [emailUser, mobileUser, referrer] = await Promise.all([
      email ? prisma.user.findUnique({ where: { email } }) : Promise.resolve(null),
      prisma.user.findUnique({ where: { mobile } }),
      referralCode ? prisma.user.findUnique({ where: { referralCode } }) : Promise.resolve(null)
    ])

    if (email && emailUser) {
      throw new HttpError(409, 'Email already registered', { code: 'EMAIL_EXISTS', showLoginInstead: true })
    }

    if (mobileUser) {
      if (!mobileUser.isActive) {
        throw new HttpError(403, 'Account is inactive. Please contact support.', { code: 'ACCOUNT_INACTIVE' })
      }

      if (!mobileUser.pinSet || !mobileUser.pinHash) {
        const setupToken = jwt.sign({ sub: mobileUser.id, role: mobileUser.role, pinSet: false }, env.jwtSecret, { expiresIn: '30m' })

        return res.status(200).json({
          ok: true,
          data: {
            user: {
              id: mobileUser.id,
              email: mobileUser.email,
              mobile: mobileUser.mobile,
              name: mobileUser.name,
              role: mobileUser.role,
              isActive: mobileUser.isActive,
              createdAt: mobileUser.createdAt,
              referralCode: mobileUser.referralCode
            },
            pinSet: false,
            nextStep: 'set-pin',
            setupToken
          }
        })
      }

      throw new HttpError(409, 'Mobile number already registered', { code: 'MOBILE_EXISTS' })
    }

    const pinHash = pin ? await hashPin(pin) : null

    const user = await prisma.user.create({
      data: { email, mobile, name, pinHash, pinSet: Boolean(pinHash), role: 'user', country, referredByUserId: referrer?.id },
      select: { id: true, email: true, mobile: true, name: true, role: true, isActive: true, createdAt: true, referralCode: true }
    })

    await ensureUserSubscription(user.id, country)

    if (referrer) {
      await prisma.referral.create({ data: { referrerUserId: referrer.id, referredUserId: user.id, referredCode: referralCode } })
    }

    const setupToken = jwt.sign({ sub: user.id, role: user.role, pinSet: Boolean(pinHash) }, env.jwtSecret, { expiresIn: '30m' })

    return res.status(201).json({
      ok: true,
      data: {
        user,
        pinSet: Boolean(pinHash),
        nextStep: pinHash ? 'dashboard' : 'set-pin',
        setupToken
      }
    })
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

    if (!user || !user.isActive) {
      throw new HttpError(401, 'Invalid mobile number or PIN')
    }

    if (!user.pinSet || !user.pinHash) {
      throw new HttpError(403, 'PIN setup required before login')
    }

    const isValidPin = await comparePin(pin, user.pinHash)
    if (!isValidPin) throw new HttpError(401, 'Invalid mobile number or PIN')

    const token = jwt.sign({ sub: user.id, role: user.role, pinSet: user.pinSet }, env.jwtSecret, { expiresIn: '7d' })
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




export const setPinSchema = z.object({
  pin: pinSchema
})

export async function setPin(req, res, next) {
  try {
    const { pin } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { id: true, pinSet: true, isActive: true } })
    if (!user || !user.isActive) throw new HttpError(401, 'Unauthorized')
    if (user.pinSet) throw new HttpError(409, 'PIN already set')

    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash: await hashPin(pin), pinSet: true }
    })

    return res.json({ ok: true, data: { message: 'PIN set successfully', pinSet: true } })
  } catch (error) {
    return next(error)
  }
}

export async function startPinReset(req, res, next) {
  try {
    const { email, phone, mobile } = req.body
    const user = await findUserForPinReset({
      email,
      phone,
      mobile,
      findByEmail: (lookupEmail) => prisma.user.findUnique({ where: { email: lookupEmail } }),
      findByPhone: (lookupPhone) => prisma.user.findUnique({ where: { mobile: lookupPhone } })
    })
    if (!user) throw new HttpError(404, 'No account found for the provided email or phone.')

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
