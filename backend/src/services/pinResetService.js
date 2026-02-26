import { z } from 'zod'
import { HttpError } from '../utils/httpError.js'

const optionalTrimmed = (schema) => z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}, schema.optional())

const phoneSchema = optionalTrimmed(z.string().min(8, 'Phone must be at least 8 digits.'))
const emailSchema = optionalTrimmed(z.string().email('Enter a valid email address.'))

export const forgotPinSchema = z
  .object({
    email: emailSchema,
    phone: phoneSchema,
    mobile: phoneSchema
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone && !value.mobile) {
      const message = 'Provide either email or phone to reset your PIN.'
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message })
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message })
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mobile'], message })
    }
  })

export async function findUserForPinReset({ email, phone, mobile, findByEmail, findByPhone }) {
  const normalizedPhone = phone || mobile

  const [emailUser, phoneUser] = await Promise.all([
    email ? findByEmail(email) : Promise.resolve(null),
    normalizedPhone ? findByPhone(normalizedPhone) : Promise.resolve(null)
  ])

  if (email && normalizedPhone) {
    if (!emailUser || !phoneUser) {
      throw new HttpError(404, 'No account found for the provided email/phone combination.')
    }

    if (emailUser.id !== phoneUser.id) {
      throw new HttpError(409, 'Email and phone belong to different accounts. Use only one identifier.')
    }

    return emailUser
  }

  return emailUser || phoneUser
}
