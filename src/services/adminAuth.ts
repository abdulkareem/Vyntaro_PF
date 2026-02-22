const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_PROFILE_KEY = 'admin_profile'

export type AdminProfile = {
  name: string
  role: 'superadmin'
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

export function isAdminAuthenticated() {
  return Boolean(getAdminToken())
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
