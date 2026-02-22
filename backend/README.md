# Vyntaro PF Backend Patch

This backend patch introduces:
- `POST /api/auth/reset-pin/start` returning JSON only.
- Mobile + PIN login verification with bcrypt hash compare.
- Registration duplicate checks for email and mobile.
- RBAC with `user` + `superadmin` roles.
- Separate admin auth and dashboard operations.
- Centralized JSON error handling.

## Run
```bash
cd backend
npm install
npx prisma migrate dev --name auth_rbac_patch
npm run seed:superadmin
npm run dev
```

## API examples

### Forgot PIN start
`POST /api/auth/reset-pin/start`

Request:
```json
{ "email": "user@demo.com" }
```
Response:
```json
{
  "ok": true,
  "data": {
    "message": "Reset token generated successfully",
    "expiresAt": "2026-01-01T12:00:00.000Z",
    "resetToken": "dev-only-token"
  }
}
```

### Register duplicate email
Response:
```json
{
  "ok": false,
  "error": {
    "message": "Email already registered",
    "details": {
      "code": "EMAIL_EXISTS",
      "showLoginInstead": true
    }
  }
}
```

### Login success
`POST /api/auth/login`
```json
{
  "ok": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "...",
      "email": "user@demo.com",
      "mobile": "+1234567890",
      "name": "Demo User",
      "role": "user",
      "isActive": true
    }
  }
}
```

### Admin login
`POST /api/admin/login`
```json
{
  "ok": true,
  "data": {
    "token": "admin-jwt"
  }
}
```

### Frontend integration notes
- Use `error.details.showLoginInstead` to render “Login instead” CTA.
- Call `/api/admin/*` with `Authorization: Bearer <admin-jwt>`.
- Do not expect HTML responses; all errors are JSON.
