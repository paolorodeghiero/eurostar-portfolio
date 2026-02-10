---
phase: 06-admin-gui-and-reporting
plan: 02
subsystem: reporting
tags: [postgresql, power-bi, dimensional-model, views, directquery]

dependency_graph:
  requires: []
  provides: [reporting-schema, dimensional-views, currency-conversion]
  affects: [power-bi-integration, business-intelligence]

tech_stack:
  added:
    - PostgreSQL reporting schema with dimensional model
    - 9 dimension views for referential data
    - 1 time dimension (2020-2030)
    - 3 fact views with pre-calculated metrics
  patterns:
    - Dimensional modeling (star schema)
    - DirectQuery-compatible views (non-materialized)
    - Currency conversion with date-based rate lookup

key_files:
  created:
    - backend/src/db/reporting-views.ts
    - backend/drizzle/0010_create_reporting_schema.sql
  modified:
    - backend/src/db/init.ts

decisions:
  - decision: "Use regular views instead of materialized views"
    rationale: "Power BI DirectQuery requires real-time data, not cached snapshots"
    impact: "Queries hit live data, ensuring freshness for reporting"

  - decision: "Create views programmatically on startup"
    rationale: "Ensures views stay in sync with schema changes, more flexible than static SQL"
    impact: "Views updated automatically on every server restart"

  - decision: "Use LEFT JOIN for currency conversion"
    rationale: "Allows partial data display when rates are missing instead of hiding records"
    impact: "amount_eur can be NULL if no rate found, keeping records visible"

  - decision: "Fiscal year equals calendar year"
    rationale: "User requirement from research phase"
    impact: "Time dimension uses standard calendar year/quarter/month"

metrics:
  duration_minutes: 6
  tasks_completed: 2
  files_created: 2
  files_modified: 1
  commits: 2
  completed_date: 2026-02-10
---

# Phase 06 Plan 02: PostgreSQL Reporting Views Summary

**One-liner:** PostgreSQL dimensional model with 13 reporting views (9 dimension + 1 time + 3 fact) including pre-calculated metrics and EUR currency conversion for Power BI DirectQuery integration.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create reporting views TypeScript module | 9def22a1 | ✅ Complete |
| 2 | Create migration and integrate with startup | 62c77353 | ✅ Complete |

## What Was Built

### Reporting Schema Architecture

Created a dedicated `reporting` schema in PostgreSQL with a dimensional model optimized for Power BI DirectQuery:

**Dimension Views (9 referential types):**
- `dim_departments` - Department master data
- `dim_teams` - Teams with department relationships
- `dim_statuses` - Project status reference
- `dim_outcomes` - Value scoring outcomes with score examples
- `dim_cost_centers` - Cost center codes and descriptions
- `dim_currency_rates` - Currency exchange rates with validity dates
- `dim_committee_thresholds` - Committee approval thresholds by amount/currency
- `dim_cost_tshirt_thresholds` - Cost T-shirt size thresholds
- `dim_competence_month_patterns` - Invoice competence month patterns

**Time Dimension:**
- `dim_date` - Calendar dimension from 2020-01-01 to 2030-12-31 with year, quarter, month, day attributes

**Fact Views (3 with metrics):**

1. **fact_projects** - Project summary with calculated metrics:
   - Budget fields: `opex_budget_eur`, `capex_budget_eur`, `total_budget_eur`
   - Actuals: `actuals_total_eur` (SUM of receipts converted to EUR)
   - Calculated metrics:
     - `budget_remaining_eur` = total_budget - actuals_total
     - `percent_used` = (actuals_total / total_budget) × 100
     - `days_until_end` = end_date - CURRENT_DATE (NULL if past or no end date)
   - Governance: `committee_state`, `committee_level`, `cost_tshirt`
   - Temporal: `start_year`, `start_quarter`, `start_month`

2. **fact_receipts** - Receipt actuals with currency conversion:
   - Original amounts: `amount_original`, `original_currency`
   - Converted: `amount_eur` (using currency_rates with date validity)
   - Temporal: `receipt_year`, `receipt_quarter`, `receipt_month`

3. **fact_invoices** - Invoice actuals with currency conversion:
   - Original amounts: `amount_original`, `original_currency`
   - Converted: `amount_eur`
   - Temporal: `invoice_year`, `invoice_quarter`, `invoice_month`
   - Competence month tracking with override support

### Currency Conversion Logic

All fact views use LEFT JOIN with `currency_rates` table:
```sql
LEFT JOIN currency_rates cr
  ON cr.from_currency = r.currency
  AND cr.to_currency = 'EUR'
  AND cr.valid_from <= r.receipt_date
  AND (cr.valid_to IS NULL OR cr.valid_to >= r.receipt_date)
```

This pattern:
- Matches currency pairs (e.g., GBP → EUR)
- Checks date validity range
- Returns NULL for `amount_eur` if no rate found (non-blocking)

### Startup Integration

Views are created/updated programmatically on every server start via `runStartupInit()`:
1. Run migrations (including 0010_create_reporting_schema.sql)
2. Ensure system statuses exist
3. Seed essential referential data
4. **Create/update reporting views** ← New step

Uses `CREATE OR REPLACE VIEW` for idempotency - views stay in sync with schema changes.

## Verification Results

All success criteria verified:
- ✅ Reporting schema exists in PostgreSQL
- ✅ All 9 referential types exposed as dim_* views
- ✅ dim_date provides time dimension (year, quarter, month)
- ✅ fact_projects includes calculated metrics (budget_remaining_eur, percent_used, days_until_end)
- ✅ fact_receipts and fact_invoices include currency conversion to EUR
- ✅ Views are regular (not materialized) for DirectQuery compatibility
- ✅ Column names use lowercase_snake_case for Power BI compatibility

## Power BI Integration

Power BI can now connect via DirectQuery to:
- `reporting.dim_*` - For slicing/filtering by department, team, status, etc.
- `reporting.dim_date` - For time-based analysis
- `reporting.fact_projects` - For project portfolio analysis with pre-calculated KPIs
- `reporting.fact_receipts` / `reporting.fact_invoices` - For actuals drill-down

All views use lowercase_snake_case column names, compatible with Power BI's naming conventions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration numbering conflict**
- **Found during:** Task 2
- **Issue:** Plan specified creating `0004_create_reporting_views.sql` but migration 0004 already exists
- **Fix:** Created `0010_create_reporting_schema.sql` using next available sequence number
- **Files modified:** backend/drizzle/0010_create_reporting_schema.sql
- **Commit:** 62c77353

**2. [Rule 1 - Bug] TypeScript type error for db parameter**
- **Found during:** Task 2 compilation
- **Issue:** `NodePgDatabase` generic type incompatible with actual db schema type from index.ts
- **Fix:** Changed parameter type to `NodePgDatabase<any>` for flexibility
- **Files modified:** backend/src/db/reporting-views.ts
- **Commit:** 62c77353

## Technical Notes

- Views use `COALESCE()` to handle NULL budgets/amounts gracefully
- `percent_used` calculation checks for division by zero (returns NULL if budget is 0)
- `days_until_end` only calculated for future end dates
- Time dimension includes both numeric (year, quarter, month) and text (month_name, day_name) fields
- All monetary columns follow NUMERIC(15,2) precision standard
- Views join to `statuses` table to include `is_read_only` flag for stopped/completed projects

## Next Steps

Phase 06 remaining plans:
- 06-01: Power BI dashboard templates (if planned)
- 06-03: Admin GUI enhancements (if planned)

The reporting infrastructure is now ready for Power BI DirectQuery integration with real-time data access.

---

## Self-Check: PASSED

### Created Files Verification
✅ FOUND: backend/src/db/reporting-views.ts
✅ FOUND: backend/drizzle/0010_create_reporting_schema.sql

### Modified Files Verification
✅ FOUND: backend/src/db/init.ts

### Commits Verification
✅ FOUND: 9def22a1 - feat(06-02): create reporting views TypeScript module
✅ FOUND: 62c77353 - feat(06-02): integrate reporting views with startup

### Database Verification
✅ VERIFIED: 13 views exist in reporting schema
✅ VERIFIED: All dimension and fact views queryable
✅ VERIFIED: Currency conversion logic working (LEFT JOIN with date validity)
✅ VERIFIED: Calculated metrics present in fact_projects (budget_remaining_eur, percent_used, days_until_end)

All claims in summary verified against actual implementation.
