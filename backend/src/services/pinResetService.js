import { z } from 'zod'
import { HttpError } from '../utils/httpError.js'

const phoneSchema = z.string().trim().min(8, 'Phone must be at least 8 digits.').optional()
const emailSchema = z.string().trim().email('Enter a valid email address.').optional()

export const forgotPinSchema = z
  .object({
    email: emailSchema,
    phone: phoneSchema
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      const message = 'Provide either email or phone to reset your PIN.'
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message })
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message })
    }
  })

export async function findUserForPinReset({ email, phone, findByEmail, findByPhone }) {
  const [emailUser, phoneUser] = await Promise.all([
    email ? findByEmail(email) : Promise.resolve(null),
    phone ? findByPhone(phone) : Promise.resolve(null)
  ])

  if (email && phone) {
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
