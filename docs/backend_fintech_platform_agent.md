# BACKEND FINTECH PLATFORM AGENT

Build a production-grade backend for the Vyntaro personal finance frontend.

## 1) Auth & Roles
- JWT bearer auth, short-lived access token + refresh token rotation.
- Roles: `user`, `admin`.
- Every `/api/dashboard/*`, `/api/ledger/*`, `/api/transactions/*`, `/api/analytics/*`, `/api/categories/*`, `/api/profile/*` endpoint requires authenticated user unless noted.
- Admin endpoints require `admin` role.

## 2) Core Models
### User
- `id`, `name`, `email`, `mobile`, `avatarUrl`, `currency`, `timezone`, `createdAt`, `updatedAt`.

### Category
- `id`, `userId`, `name`, `type` (`income|expense|bill|ledger`), `showOnDashboard`, `color`, `icon`, `isArchived`, timestamps.

### LedgerEntry / Transaction
- `id`, `userId`, `categoryId`, `type` (`income|expense`), `amount` (decimal), `item`, `merchant`, `notes`, `date`, `dueDate?`, `status`, `counterparty?`, timestamps.

### Budget
- `id`, `userId`, `categoryId`, `period` (`monthly|yearly`), `limitAmount`, `alertThresholdPct`, timestamps.

### LendingRecord
- `id`, `userId`, `person`, `kind` (`lent|loan`), `amount`, `issuedAt`, `dueDate`, `status`, `repaidAt?`, timestamps.

## 3) Required Endpoints

### Dashboard Summary
- `GET /api/dashboard/summary`
  - Query: `month`, `year` optional.
  - Response: complete `DashboardData` payload used by frontend hub (balances, metrics, todaySummary, jobs/shortcuts/activity, bills, transactions, budgets, analytics, insights, ledgerCategoriesState).

### Dashboard Insight Endpoints
- `GET /api/dashboard/financial-health?month=MM&year=YYYY`
  - Response: `{ score: number, label: 'Good'|'Average'|'Risky', factors: { expenseIncomeRatio, savingsRate, lendingRatio, budgetUsage } }`
- `GET /api/dashboard/net-worth?month=MM&year=YYYY`
  - Response: `{ netWorth: number, savingsThisMonth: number, assets?: number, liabilities?: number }`
- `GET /api/dashboard/expense-breakdown?month=MM&year=YYYY`
  - Response: `[{ category: string, amount: number }]`
- `GET /api/dashboard/alerts?month=MM&year=YYYY`
  - Response: `[{ type: 'warning'|'info'|'success', message: string, code: string, createdAt: string }]`
- `GET /api/dashboard/prediction?month=MM&year=YYYY`
  - Response: `{ projectedBalance: number, confidencePct: number, drivers: string[] }`
- `GET /api/dashboard/lending-summary?month=MM&year=YYYY`
  - Response: `{ totalLent, totalLoan, breakdown: [{person, amount, kind, overdue, dueDate}], agingBuckets: [{bucket, count, amount}] }`

### Ledger & Transactions
- `GET /api/ledger/categories?type=expense|income|bill|ledger`
- `POST /api/ledger/categories`
- `PATCH /api/ledger/categories/:id`
- `GET /api/ledger/entries` (filters: date range, categoryId, type, search, pagination)
- `POST /api/ledger/entries`
- `PATCH /api/ledger/entries/:id`
- `DELETE /api/ledger/entries/:id`

### Budgets
- `GET /api/budgets`
- `POST /api/budgets`
- `PATCH /api/budgets/:id`
- `DELETE /api/budgets/:id`

### Profile
- `GET /api/profile/me`
- `PATCH /api/profile/me`
- `POST /api/profile/otp/request`
- `POST /api/profile/otp/verify`

## 4) Request / Response Schema Rules
- Monetary fields are decimals serialized as numbers with max 2 fractional digits.
- All responses include `requestId` and ISO timestamps.
- Validation errors return `422` with field-level messages.
- Unauthorized `401`, forbidden `403`, not found `404`, rate limited `429`, server errors `5xx`.

## 5) Analytics & Aggregations
- Pre-aggregate monthly totals per category for fast dashboard load.
- Financial health formula should match frontend assumptions:
  - weighted expense ratio, savings rate, lending exposure, budget utilization.
- Provide trend series for monthly income vs expense (`analytics[]`).
- Prediction endpoint should support simple linear forecast now; pluggable ML later.

## 6) Performance & Security
- P95 for dashboard summary under 300ms (excluding network).
- Add indexes on `userId`, `date`, `categoryId`, `type`.
- Use row-level security by `userId` across all finance entities.
- Encrypt sensitive PII at rest.
- Implement idempotency keys for POST transaction/ledger create endpoints.
- Add audit logs for profile changes, budget edits, and ledger updates.

## 7) Non-Functional Requirements
- OpenAPI spec for all endpoints.
- Migration-safe schema versioning.
- Seed data script for local development.
- Comprehensive unit/integration tests for aggregation logic and auth.
