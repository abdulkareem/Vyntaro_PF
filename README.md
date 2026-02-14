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
- This frontend calls backend auth APIs from `src/services/api/authApi.ts`.
- Configure API base URL using Vite env variable:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:4000
```

If omitted, the frontend defaults to `http://localhost:4000`.

Current API-backed flows
- Register start: `POST /api/auth/register/start`
- Verify registration: `POST /api/auth/register/verify`
- Set PIN: `POST /api/auth/pin/set`
- Login: `POST /api/auth/login`

Notes
- In development, the backend may return `devOtp` in responses for testing.
- Forgot PIN / Change PIN screens remain present in UI, but require corresponding backend endpoints to be fully wired.
