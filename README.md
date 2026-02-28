Vyntaro PF

Overview
- React + Vite + TypeScript web app with PWA install support.
- Personal-finance onboarding flow integrated with backend APIs:
  - Register (phone + email)
  - Verify registration OTP (phone + email)
  - Set PIN
  - Login

Local Development
- Install dependencies: `npm install`
- Start dev server: `npm run dev` (http://localhost:5173)
- Type check: `npm run typecheck`
- Build: `npm run build`
- Preview production build: `npm run preview`

Backend Connection
- Backend repository: https://github.com/abdulkareem/Vyntaro_PFBack
- The backend is maintained in that separate repository and is no longer vendored inside this frontend repo.
- Clone and run the backend separately when developing locally.
- This frontend calls backend auth APIs from `src/services/api/authApi.ts`.
- Configure API base URL using Vite env variable:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:4000

# Cloudflare Pages / production
VITE_API_BASE_URL=https://vyntaropfback-production.up.railway.app
# IMPORTANT: do not append :8080 for public Railway URL in browser clients
# (Railway edge serves HTTPS on 443 and forwards internally)

# optional: allow same-origin relative fallback in production
# default is false (strict mode)
VITE_API_ALLOW_SAME_ORIGIN_FALLBACK=false
# optional: disable service worker during connectivity troubleshooting
VITE_ENABLE_SW=true
```

Important runtime behavior
- In production, `VITE_API_BASE_URL` is required unless `VITE_API_ALLOW_SAME_ORIGIN_FALLBACK=true` is explicitly set.
- Requests use `VITE_API_BASE_URL` by default. A same-origin retry (`/api/...`) is attempted only when fallback is explicitly enabled (`VITE_API_ALLOW_SAME_ORIGIN_FALLBACK=true`) or when running in development.
- Keeping production fallback opt-in prevents accidental duplicate mutation retries during CORS/network failures.
- In development, same-origin fallback remains enabled for convenience.

Current API-backed flows
- Register start: `POST /api/auth/register/start`
- Verify registration: `POST /api/auth/register/verify`
- Set PIN: `POST /api/auth/pin/set`
- Login: `POST /api/auth/login`

Notes
- In development, the backend may return `devOtp` or OTP codes in responses for testing.
- Added frontend wiring for identity checks, PIN reset (mobile/email), profile updates via OTP verification, and change PIN endpoint.
- Email OTP delivery also depends on backend mailer configuration (`SMTP_*`/provider credentials) in `Vyntaro_PFBack`; if mobile OTP arrives but email OTP does not, verify backend mail transport env vars and provider logs.


Quick production diagnostics
- In browser devtools console, verify startup log: `[api] resolved base url` contains the Railway host.
- Registration/login errors now include the exact target URL if a network/CORS/timeout failure occurs.
- If your backend shows no requests, confirm Railway `CORS_ORIGINS` includes your exact Cloudflare Pages domain and custom domain (if used).


Service worker note
- If users still run stale frontend code after deploy, set `VITE_ENABLE_SW=false` temporarily in Cloudflare Pages to force unregistration and ensure fresh API client code loads.
