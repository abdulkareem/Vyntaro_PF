# Frontend Data Contracts (Fintech Dashboard Expansion)

## Dashboard Hub (`/dashboard`)
- **Data**: user profile, balances, income/expense totals, category metrics, insights summary, shortcuts, activity, bills, recent transactions.
- **Widgets**: financial health score, expense bars, smart alerts, predictive balance, lending snapshot, daily snapshot, budget overview.
- **Actions**: navigate to detail screens for each card, refresh dashboard, retry failed segments.

## Balance Overview (`/dashboard/balance`)
- **Data**: `balance`, `income`, `expense`, `budgetSummary.monthly`.
- **Charts/Tables**: KPI tiles (current implementation), optional historical balance line.
- **Actions**: add income/expense entries, open budget management.

## Income Analytics (`/dashboard/analytics/income`)
- **Data**: total income + income transaction list.
- **Charts**: source-wise split (backend aggregation planned).
- **Filters**: date range, source/category.
- **Actions**: add income entry.

## Expense Breakdown (`/dashboard/analytics/expenses`)
- **Data**: `insights.expenseBreakdown[]`.
- **Charts**: category bars, spend distribution.
- **Filters**: date range, merchant/category.
- **Actions**: open category drill-down.

## Category Drill-down (`/dashboard/categories/:categoryName`)
- **Data**: category transaction list, totals, trend points.
- **Tables**: per-transaction list.
- **Filters**: month, payment method, tags.
- **Actions**: edit category tagging, add new expense.

## Financial Health (`/dashboard/insights/health`)
- **Data**: `insights.financialHealth` + scoring factors.
- **Charts**: score history trend.
- **Actions**: contextual recommendations.

## Alerts Center (`/dashboard/insights/alerts`)
- **Data**: `insights.alerts[]`.
- **Tables**: alert list with severity.
- **Actions**: dismiss/snooze/create rule.

## Prediction (`/dashboard/insights/prediction`)
- **Data**: projected balance, confidence, driver metrics.
- **Charts**: projected trajectory vs actual.
- **Actions**: run what-if scenarios.

## Lending Intelligence (`/dashboard/lending`)
- **Data**: `insights.lendingSummary` (totals, breakdown, aging).
- **Tables**: counterparty ledger and overdue flags.
- **Actions**: record repayment, mark settled, send reminders.

## Daily Snapshot (`/dashboard/snapshot`)
- **Data**: `todaySummary` income/expense and category totals.
- **Charts**: intraday spend timeline.
- **Filters**: day selector.
- **Actions**: quick add transaction.

## Budget Overview (`/dashboard/budgets`)
- **Data**: `budgets[]`, monthly/yearly limits, utilization.
- **Charts**: budget utilization bars.
- **Actions**: create/update budget rules, add expense linked to budget.
