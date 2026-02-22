# Vyntaro PF Enterprise Backend Blueprint

## Updated schema highlights
- True double-entry core (`LedgerAccount`, `LedgerEntry`) with immutable inserts only.
- Subscription/billing domain (`Subscription`, `SubscriptionProrationLog`, `Payment`, `Invoice`).
- Monetization and control (`FeatureFlag`, `UserFeatureOverride`).
- Governance (`FraudFlag`, `AdminAuditLog`, `Statement`, `AIInsight`, `Referral`).

## Accounting logic
- `postDoubleEntry` enforces distinct debit/credit accounts and positive amount.
- `getTrialBalance` verifies total debits equals total credits for any period.
- Ledger entries are append-only; no update/delete route is exposed.

## Business rules implemented
- Country pricing: IN ₹29/₹299, global $1.99/$19.99.
- First month free via `freeMonthsRemaining = 1` on subscription bootstrap.
- Referral reward after 3 successful paid referrals; capped by free-month policy.
- Feature override per user with admin audit event.

## Statement generation
- Monthly statement creation with opening/closing balance, tax and charge aggregation.
- AI summary included from `generateAIInsights`.
- Placeholder `pdfUrl` included for secure storage pipeline.

## Fraud detection
- Self-referral, shared IP/device and shared payment fingerprint checks in `detectFraudSignals`.
- Fraud flags are persisted for superadmin review and override workflow.

## QA test matrix
| Area | Case | Expected |
|---|---|---|
| Double-entry | debit=credit enforced | entry accepted only with positive amount and distinct accounts |
| Subscription lifecycle | trial -> active -> cancelled | state transitions persisted with next billing date |
| Proration | mid-cycle upgrade | unused credit + adjusted amount logged |
| Referral cap | >3 rewards | free months not increased past cap |
| GST | India payment | CGST/SGST split and total persisted |
| Statement | monthly generation | balances, taxes, AI summary present |
| Fraud | self referral | fraud flag created |
| Admin override | feature override | override row + audit log |
| Delivery | statement invoice metadata | pdf/email timestamps persisted |

## Performance notes
- Indexed all required dimensions: `user_id`, `account_id`, `transaction_date`, `subscription_status`, `payment_status`, `referral_code`.
- Ledger/statement queries designed for time-range filtering and aggregate computation.
- Keep amounts in minor units (`BigInt`) to avoid precision drift.

## Sample API
### Create ledger entry
`POST /api/finance/ledger/entries`
```json
{
  "debitAccountId": "acc_cash",
  "creditAccountId": "acc_income",
  "amountMinor": "2900",
  "currency": "INR",
  "referenceId": "sub_123",
  "referenceType": "subscription_charge"
}
```

### Response
```json
{
  "ok": true,
  "data": {
    "id": "led_1"
  }
}
```

## Frontend integration guidance
- Gate each menu/card against `/api/finance/subscriptions/current` + feature override API.
- Use `/api/finance/statements/generate` for on-demand statement generation.
- Render `aiSummary` and `/api/finance/insights` in dashboard analytics panel.
- Show invoice and statement downloads from secure signed URLs.
