import express from 'express'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import financeRoutes from './routes/financeRoutes.js'
import governanceRoutes from './routes/governanceRoutes.js'
import { provisionSuperAdmin } from './controllers/superAdminController.js'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.post('/api/system/provision-superadmin', provisionSuperAdmin)
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/superadmin', governanceRoutes)
app.use(notFound)
app.use(errorHandler)

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on ${env.port}`)
})
