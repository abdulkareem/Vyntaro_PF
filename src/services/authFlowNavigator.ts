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
      return next.startsWith('/') ? next : fallback
  }
}
