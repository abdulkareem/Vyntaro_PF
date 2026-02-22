import { HttpError } from '../utils/httpError.js'

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return next(new HttpError(400, 'Validation failed', result.error.flatten()))
  }
  req.body = result.data
  return next()
}
