# Deployment readiness notes

## Migration strategy
1. Backup production Postgres.
2. Run `npx prisma validate`.
3. Generate SQL diff from empty baseline for review:
   - `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0001_bank_grade_init.sql`
4. Apply reviewed SQL in staging, then production with a maintenance window.
5. Run `npx prisma generate` and restart pods.

## Idempotency and accounting integrity
- Payment webhook processing uses `upsert` on `gatewayReference` for idempotency.
- Ledger posting creates immutable `LedgerEntry` records only (no update/delete service paths).

## Performance indexes
- Added indexes for user IDs, order/trip dates, subscription status, payment status, fraud monitoring, and statement periods in Prisma schema.

## Known limitations
- PDF rendering and email dispatch are represented by statement `pdfUrl` stubs and should be wired to a real document/email provider before production.
- Fraud scoring thresholds are rule-based; no ML model is included in this patch.
