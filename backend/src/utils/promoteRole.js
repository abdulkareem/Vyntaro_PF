import { prisma } from '../config/prisma.js'

function parseArgs() {
  const args = process.argv.slice(2)
  const map = {}

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index]
    if (!current.startsWith('--')) continue
    const key = current.slice(2)
    const value = args[index + 1]
    map[key] = value
    index += 1
  }

  return map
}

function assertBootstrapAllowed(secret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Role bootstrap is disabled in production.')
  }

  if (process.env.ALLOW_ADMIN_BOOTSTRAP !== 'true') {
    throw new Error('Set ALLOW_ADMIN_BOOTSTRAP=true to run this command.')
  }

  if (!process.env.ADMIN_BOOTSTRAP_SECRET) {
    throw new Error('ADMIN_BOOTSTRAP_SECRET must be configured.')
  }

  if (secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    throw new Error('Invalid bootstrap secret.')
  }
}

async function run() {
  const args = parseArgs()
  const role = args.role || 'admin'
  const secret = args.secret

  if (!['user', 'admin', 'superadmin'].includes(role)) {
    throw new Error('Invalid role. Use one of: user, admin, superadmin.')
  }

  assertBootstrapAllowed(secret)

  const where = args.userId
    ? { id: args.userId }
    : args.email
      ? { email: args.email }
      : args.mobile
        ? { mobile: args.mobile }
        : null

  if (!where) {
    throw new Error('Provide one selector: --userId, --email, or --mobile.')
  }

  const user = await prisma.user.findUnique({ where, select: { id: true, role: true, email: true, mobile: true } })
  if (!user) {
    throw new Error('User not found for provided selector.')
  }

  if (user.role === role) {
    console.log(`No-op: user ${user.id} already has role ${role}.`)
    return
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role, isActive: true },
    select: { id: true, email: true, mobile: true, role: true, isActive: true }
  })

  console.log(JSON.stringify({
    action: 'role-bootstrap',
    userId: updated.id,
    previousRole: user.role,
    nextRole: updated.role,
    at: new Date().toISOString()
  }))
}

run()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
