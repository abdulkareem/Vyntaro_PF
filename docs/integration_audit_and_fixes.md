# LIVE Integration Audit & Repair Plan

## Root Cause Summary

1. **Frontend can silently send API calls to wrong origin in production.**
   - `src/services/api/authApi.ts` previously attempted `API_BASE_URL` and then `''` fallback.
   - On Cloudflare Pages this causes calls to hit frontend origin instead of Railway backend, matching symptom: no backend logs.
2. **Missing hard failure when backend base URL is absent.**
   - No explicit guard for `VITE_API_BASE_URL` in production.
   - Registration/login appears to fail generically without clear config error.
3. **Route fallback complexity can hide backend route-prefix mistakes.**
   - Multiple path fallbacks can still be useful, but without request logging in backend it becomes difficult to identify which route is actually live.
4. **Backend repository not present in this workspace.**
   - Backend fixes below are patch-ready templates to apply in `Vyntaro_PFBack`.

---

## Frontend Fixes (Vyntaro_PF)

### 1) Enforce explicit API base URL in production

**File:** `src/services/api/baseUrl.ts`

**Broken:** Production could proceed without `VITE_API_BASE_URL`, causing requests to default to same-origin and never reach Railway.

**Patch (applied):**
```diff
+const IS_DEV = import.meta.env.DEV
+const SAME_ORIGIN_FALLBACK_ENABLED =
+  String(import.meta.env.VITE_API_ALLOW_SAME_ORIGIN_FALLBACK || '').toLowerCase() === 'true'
+
 export const API_BASE_URL = normalizeBase(RAW_API_BASE)
+
+export function canUseSameOriginFallback() {
+  return IS_DEV || SAME_ORIGIN_FALLBACK_ENABLED
+}
+
+export function assertApiBaseConfigured() {
+  if (API_BASE_URL || canUseSameOriginFallback()) return
+
+  throw new Error(
+    'VITE_API_BASE_URL is not configured. Set it to your Railway backend URL (for example: https://vyntaropfback-production.up.railway.app).'
+  )
+}
```

**Why required:** Prevents silent misrouting in production and immediately surfaces environment misconfiguration.

### 2) Restrict same-origin fallback to dev (or explicit opt-in)

**File:** `src/services/api/authApi.ts`

**Broken:** API client always tried same-origin after base URL failure.

**Patch (applied):**
```diff
-import { API_BASE_URL } from './baseUrl'
+import { API_BASE_URL, assertApiBaseConfigured, canUseSameOriginFallback } from './baseUrl'
@@
 function getApiBaseCandidates() {
-  const candidates = [API_BASE_URL, '']
+  assertApiBaseConfigured()
+
+  const candidates = [API_BASE_URL]
+
+  if (canUseSameOriginFallback()) {
+    candidates.push('')
+  }
+
   return Array.from(new Set(candidates.map(base => base.replace(/\/$/, ''))))
 }
```

**Why required:** Ensures Cloudflare Pages frontend targets Railway backend reliably.

### 3) Deployment guidance update

**File:** `README.md`

**Broken:** No strict production rule for `VITE_API_BASE_URL` and no mention of fallback toggle.

**Patch (applied):** Added explicit production env requirements and warning about same-origin fallback behavior.

**Why required:** Reduces deployment drift and recurring misconfiguration.

---

## Backend Fixes (Vyntaro_PFBack) — patch-ready templates

> Backend repository is not present in this workspace; apply the following in `Vyntaro_PFBack`.

### A) CORS + preflight + origin diagnostics

**File:** `src/server.ts` (or `index.js` where express app is created)

```ts
import cors from 'cors'

const rawOrigins = process.env.CORS_ORIGINS || ''
const allowedOrigins = rawOrigins
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, cb) {
    // allow server-to-server / curl / health checks
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    console.warn('[CORS_BLOCKED]', { origin, allowedOrigins })
    return cb(new Error(`Origin not allowed: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204
}))

app.options('*', cors())
```

**Why:** If Cloudflare Pages origin is missing, browser drops requests preflight-side and backend sees nothing.

### B) Request logging + JSON parsing + health endpoint

**File:** `src/server.ts`

```ts
app.use(express.json({ limit: '1mb' }))
app.use((req, _res, next) => {
  const start = Date.now()
  console.log('[REQ]', { method: req.method, path: req.originalUrl, origin: req.headers.origin })
  res.on('finish', () => {
    console.log('[RES]', { method: req.method, path: req.originalUrl, status: res.statusCode, ms: Date.now() - start })
  })
  next()
})

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'Vyntaro_PFBack', ts: new Date().toISOString() })
})
```

**Why:** Confirms whether frontend hits backend and removes blind spots in production logs.

### C) Route prefix alignment

**File:** route registration file (e.g. `src/server.ts`)

```ts
import authRouter from './routes/auth'

app.use('/api/auth', authRouter)
```

**Why:** Frontend uses `/api/auth/*` first. Missing `/api` prefix causes systematic 404 and fallback confusion.

### D) DB connectivity fail-fast

**File:** DB bootstrap (`src/db.ts` + startup)

```ts
export async function assertDbReady() {
  try {
    await db.query('SELECT 1')
    console.log('[DB] connected')
  } catch (err) {
    console.error('[DB] connection failed', err)
    process.exit(1)
  }
}

// in startup
await assertDbReady()
```

**Why:** If DB is disconnected, user and OTP writes silently fail downstream.

### E) Registration transaction + OTP send handling

**File:** `src/routes/auth/register.ts`

```ts
router.post('/register/start', async (req, res) => {
  const { phone, email } = req.body
  if (!phone) return res.status(400).json({ message: 'phone is required' })

  const trx = await db.transaction()
  try {
    const user = await createOrUpdatePendingUser({ phone, email }, trx)
    const otp = await createOtp({ userId: user.id, purpose: 'register' }, trx)

    await trx.commit()

    try {
      await sendOtp({ phone, email, code: otp.code, purpose: 'register' })
      console.log('[OTP_SENT]', { userId: user.id, phone, email: !!email })
    } catch (mailErr) {
      console.error('[OTP_SEND_FAILED]', { userId: user.id, error: String(mailErr) })
      return res.status(502).json({ message: 'OTP delivery failed; try again.' })
    }

    return res.status(200).json({ userId: user.id })
  } catch (err) {
    await trx.rollback()
    console.error('[REGISTER_START_FAILED]', err)
    return res.status(500).json({ message: 'Registration failed' })
  }
})
```

**Why:** Guarantees persistence before delivery and explicit mail failure behavior.

### F) Email provider validation

**File:** mailer init (`src/services/mailer.ts`)

```ts
const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing mail env: ${key}`)
  }
}

await transporter.verify()
console.log('[MAIL] transporter verified')
```

**Why:** Prevents runtime OTP black-holes due to missing SMTP creds.

### G) PIN hash + pinSet + login verify enforcement

**File:** auth handlers (`set-pin`, `login`)

```ts
// set-pin
const pinHash = await bcrypt.hash(pin, 12)
await users.update(userId, { pinHash, pinSet: true, pinUpdatedAt: new Date() })

// login
if (!user.pinSet || !user.pinHash) {
  return res.status(409).json({ message: 'PIN not set', code: 'PIN_NOT_SET' })
}
const ok = await bcrypt.compare(pin, user.pinHash)
if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
```

**Why:** Resolves “PIN not saved / not verified” failure and secures auth flow.

---

## Environment Variable Checklist

### Cloudflare Pages (Frontend)
- `VITE_API_BASE_URL=https://vyntaropfback-production.up.railway.app`
- `VITE_API_ALLOW_SAME_ORIGIN_FALLBACK=false` (recommended)

### Railway (Backend)
- `PORT=8080`
- `NODE_ENV=production`
- `CORS_ORIGINS=https://<your-cloudflare-pages-domain>,https://<custom-domain-if-any>`
- DB vars (e.g. `DATABASE_URL`)
- JWT vars: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- Mail vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Optional OTP tuning: `OTP_EXPIRY_SECONDS`, `OTP_RESEND_COOLDOWN_SECONDS`

---

## Verification Steps (Manual)

1. **Backend reachability**
   - Open `https://vyntaropfback-production.up.railway.app/health`.
   - Expect `{ ok: true }` response.
2. **Frontend API target**
   - In browser devtools Network, submit registration.
   - Confirm request URL starts with Railway host, not Cloudflare Pages host.
3. **Registration persistence**
   - Submit new phone + email.
   - Verify backend logs show `/api/auth/register/start` and DB insert/update success.
4. **OTP delivery**
   - Verify backend logs show `[OTP_SENT]`.
   - Confirm inbox receives OTP email (or SMS provider log for phone OTP).
5. **OTP verify + set PIN**
   - Complete OTP verification, then set PIN.
   - Verify user row has `pinSet=true` and non-empty `pinHash`.
6. **Login path**
   - Login with phone+PIN.
   - Verify `/api/auth/login` request, successful response, and JWT tokens issued.
7. **Negative checks**
   - Wrong PIN must return 401.
   - Missing `VITE_API_BASE_URL` in production should now fail fast on frontend.
