Vyntaro PF

Overview
- React + Vite + TypeScript web app with PWA install support.
- Fintech-style onboarding: registration with geolocation + OTP (phone/email), PIN setup, login with mobile+PIN, new-device verification with OTP, trusted devices, dashboard.
- OTP throttling and input masking for mobile.

Local Development
- Install dependencies: npm install
- Start dev server: npm run dev (http://localhost:5173)
- Type check: npm run typecheck
- Build: npm run build
- Preview production build: npm run preview

Key Screens
- Register → Verify → Set PIN → Login → Dashboard
- Forgot PIN flow: request OTP, verify, set new PIN
- Change PIN inside Dashboard

PWA
- Manifest and service worker configured.
- Install on HTTPS or localhost; use npm run build and npm run preview to test.

Notes
- OTPs are displayed in development for testing only.
- Replace placeholder icons in public/manifest.webmanifest for production branding.
