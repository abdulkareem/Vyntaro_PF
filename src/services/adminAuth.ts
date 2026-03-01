const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_PROFILE_KEY = 'admin_profile'

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN'

export type AdminProfile = {
  name: string
  role: AdminRole
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminSession(token: string, profile: AdminProfile) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  sessionStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile))
  window.dispatchEvent(new Event('admin-auth-changed'))
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  sessionStorage.removeItem(ADMIN_PROFILE_KEY)
  window.dispatchEvent(new Event('admin-auth-changed'))
}

export function getAdminProfile(): AdminProfile | null {
  const raw = sessionStorage.getItem(ADMIN_PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminProfile
  } catch {
    return null
  }
}

export function hasAdminRole(profile: AdminProfile | null): profile is AdminProfile {
  return profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN'
}

export function isAdminAuthenticated() {
  const token = getAdminToken()
  const profile = getAdminProfile()
  return Boolean(token) && hasAdminRole(profile)
}
