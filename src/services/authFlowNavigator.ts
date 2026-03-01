const SUPPORTED_ROUTES = new Set([
  '/verify',
  '/set-pin',
  '/login',
  '/dashboard',
  '/forgot-pin',
  '/register',
  '/reset-pin',
  '/change-pin'
])

export function resolveNextRoute(next: string | undefined, fallback: string) {
  if (!next) return fallback

  switch (next) {
    case 'otp_verify':
    case 'verify_otp':
      return '/verify'
    case 'set_pin':
    case 'pin_set':
      return '/set-pin'
    case 'login':
      return '/login'
    case 'dashboard':
      return '/dashboard'
    case 'pin_reset_start':
      return '/forgot-pin'
    default:
      if (!next.startsWith('/')) return fallback
      return SUPPORTED_ROUTES.has(next) ? next : fallback
  }
}
