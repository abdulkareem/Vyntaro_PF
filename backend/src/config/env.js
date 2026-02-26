export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change-me-admin',
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES || 15),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  superAdminEmail: process.env.SUPERADMIN_EMAIL || 'admin@vyntaro.com',
  superAdminMobile: process.env.SUPERADMIN_MOBILE || '+10000000000',
  superAdminPin: process.env.SUPERADMIN_PIN || '1234',
  allowAdminBootstrap: process.env.ALLOW_ADMIN_BOOTSTRAP === 'true',
  adminBootstrapSecret: process.env.ADMIN_BOOTSTRAP_SECRET || ''
}
