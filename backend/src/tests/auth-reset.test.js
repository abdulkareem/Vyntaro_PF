import test from 'node:test'
import assert from 'node:assert/strict'
import { forgotPinSchema, findUserForPinReset } from '../services/pinResetService.js'

test('forgot pin accepts email-only payload', () => {
  const result = forgotPinSchema.safeParse({ email: 'user@example.com' })
  assert.equal(result.success, true)
})

test('forgot pin accepts phone-only payload', () => {
  const result = forgotPinSchema.safeParse({ phone: '+15551234567' })
  assert.equal(result.success, true)
})


test('forgot pin accepts mobile-only payload alias', () => {
  const result = forgotPinSchema.safeParse({ mobile: '+15551234567' })
  assert.equal(result.success, true)
})

test('forgot pin treats blank strings as missing values', () => {
  const result = forgotPinSchema.safeParse({ email: '   ', phone: '' })
  assert.equal(result.success, false)
})

test('forgot pin rejects when both email and phone are missing', () => {
  const result = forgotPinSchema.safeParse({})
  assert.equal(result.success, false)
  assert.equal(result.error.flatten().fieldErrors.email?.[0], 'Provide either email or phone to reset your PIN.')
  assert.equal(result.error.flatten().fieldErrors.phone?.[0], 'Provide either email or phone to reset your PIN.')
})

test('findUserForPinReset resolves by email', async () => {
  const user = { id: 'u1' }
  const out = await findUserForPinReset({
    email: 'user@example.com',
    findByEmail: async () => user,
    findByPhone: async () => null
  })

  assert.deepEqual(out, user)
})

test('findUserForPinReset resolves by phone', async () => {
  const user = { id: 'u2' }
  const out = await findUserForPinReset({
    phone: '+15551234567',
    findByEmail: async () => null,
    findByPhone: async () => user
  })

  assert.deepEqual(out, user)
})


test('findUserForPinReset resolves by mobile alias', async () => {
  const user = { id: 'u3' }
  const out = await findUserForPinReset({
    mobile: '+15550001111',
    findByEmail: async () => null,
    findByPhone: async () => user
  })

  assert.deepEqual(out, user)
})

test('findUserForPinReset rejects ambiguous user identifiers', async () => {
  await assert.rejects(
    findUserForPinReset({
      email: 'a@example.com',
      phone: '+15551234567',
      findByEmail: async () => ({ id: 'u1' }),
      findByPhone: async () => ({ id: 'u2' })
    }),
    /different accounts/
  )
})


