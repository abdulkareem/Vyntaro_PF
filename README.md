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
# production example
# VITE_API_BASE_URL=https://vyntaropfback-production.up.railway.app
```

If omitted, the frontend will use same-origin relative API routes (recommended when frontend and backend are reverse-proxied under one domain).
If you provide only a host (without `http://` or `https://`), the app now defaults to `https://` automatically.

Current API-backed flows
- Register start: `POST /api/auth/register/start`
- Verify registration: `POST /api/auth/register/verify`
- Set PIN: `POST /api/auth/pin/set`
- Login: `POST /api/auth/login`

Notes
- In development, the backend may return `devOtp` or OTP codes in responses for testing.
- Added frontend wiring for identity checks, PIN reset (mobile/email), profile updates via OTP verification, and change PIN endpoint.
