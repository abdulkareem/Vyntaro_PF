import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

function readBearerToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  return header.slice(7)
}

export function requireAdmin(req, _res, next) {
  const token = readBearerToken(req)
  if (!token) return next(new HttpError(401, 'Missing admin token'))

  try {
    const payload = jwt.verify(token, env.adminJwtSecret)
    if (payload.role !== 'superadmin') throw new HttpError(403, 'Forbidden')
    req.admin = payload
    return next()
  } catch (error) {
    return next(error instanceof HttpError ? error : new HttpError(401, 'Invalid admin token'))
  }
}

export function requireUser(req, _res, next) {
  const token = readBearerToken(req)
  if (!token) return next(new HttpError(401, 'Missing user token'))

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    req.user = payload
    return next()
  } catch (error) {
    return next(new HttpError(401, 'Invalid user token'))
  }
}
