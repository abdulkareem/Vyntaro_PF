import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { env } from '../config/env.js'

export const hashPin = (pin) => bcrypt.hash(pin, env.bcryptRounds)
export const comparePin = (pin, pinHash) => bcrypt.compare(pin, pinHash)

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
