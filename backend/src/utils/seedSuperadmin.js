import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { hashPin } from './security.js'

async function run() {
  const existing = await prisma.user.findFirst({ where: { role: 'superadmin' } })
  if (existing) {
    console.log('SuperAdmin already exists:', existing.id)
    return
  }

  const admin = await prisma.user.create({
    data: {
      email: env.superAdminEmail,
      mobile: env.superAdminMobile,
      name: 'System SuperAdmin',
      role: 'superadmin',
      pinHash: await hashPin(env.superAdminPin),
      pinSet: true,
      isActive: true
    }
  })

  console.log('Created SuperAdmin:', admin.id)
}

run().finally(() => prisma.$disconnect())
