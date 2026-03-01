const technicalMessageMatchers = [
  'network/cors error',
  'request failed',
  'request timed out',
  'cannot',
  'syntaxerror',
  'typeerror',
  'failed to fetch'
]

export function toUserFacingError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback

  const message = error.message?.trim()
  if (!message) return fallback

  const normalized = message.toLowerCase()
  if (technicalMessageMatchers.some(item => normalized.includes(item))) {
    return fallback
  }

  return message
}
