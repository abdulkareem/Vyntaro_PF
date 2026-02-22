# SuperAdmin Dashboard Integration Notes

## API service layer
- `src/services/adminApi.ts` wraps all `/api/admin/*` requests and attaches `Authorization: Bearer <jwt>`.
- `src/services/adminAuth.ts` stores JWT in `sessionStorage` and exposes route-guard helpers.

## Sample request/response

### Admin Login
Request:
```http
POST /api/admin/login
Content-Type: application/json

{
  "mobile": "+15550001111",
  "pin": "1234"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "token": "admin-jwt-token"
  }
}
```

### Users list
Request:
```http
GET /api/admin/users
Authorization: Bearer admin-jwt-token
```

Response:
```json
{
  "ok": true,
  "data": [
    {
      "id": "usr_123",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "mobile": "+15550002222",
      "role": "user",
      "isActive": true,
      "createdAt": "2026-02-20T09:00:00.000Z",
      "updatedAt": "2026-02-20T09:00:00.000Z"
    }
  ]
}
```

## Deployment and scaling notes
- Set `VITE_API_BASE_URL` to backend origin.
- Serve frontend behind HTTPS and add strict CSP + secure headers.
- For scale, move activity/charts aggregations to dedicated backend analytics endpoints.
- Put admin endpoints behind IP allowlist/VPN when possible.
- Use short JWT expiry + refresh/session rotation policy.
