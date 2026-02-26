import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { prisma } from '../config/prisma.js'

const ADMIN_ROLES = new Set(['admin', 'superadmin'])

function readBearerToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  return header.slice(7)
}

export async function requireAdmin(req, _res, next) {
  const token = readBearerToken(req)
  if (!token) return next(new HttpError(401, 'Missing admin token'))

  try {
    const payload = jwt.verify(token, env.adminJwtSecret)
    const admin = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, isActive: true, pinSet: true } })
    if (!admin || !admin.isActive) throw new HttpError(401, 'Invalid admin token')
    if (!ADMIN_ROLES.has(admin.role)) throw new HttpError(403, 'Forbidden')
    if (!admin.pinSet) throw new HttpError(403, 'PIN setup required')
    req.admin = { sub: admin.id, role: admin.role, pinSet: admin.pinSet }
    return next()
  } catch (error) {
    return next(error instanceof HttpError ? error : new HttpError(401, 'Invalid admin token'))
  }
}

export async function requireUser(req, _res, next) {
  const token = readBearerToken(req)
  if (!token) return next(new HttpError(401, 'Missing user token'))

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, isActive: true, pinSet: true } })
    if (!user || !user.isActive) throw new HttpError(401, 'Invalid user token')
    req.user = { sub: user.id, role: user.role, pinSet: user.pinSet }
    return next()
  } catch (error) {
    return next(error instanceof HttpError ? error : new HttpError(401, 'Invalid user token'))
  }
}

export function requirePinSet(req, _res, next) {
  if (!req.user?.pinSet) return next(new HttpError(403, 'PIN setup required'))
  return next()
}
