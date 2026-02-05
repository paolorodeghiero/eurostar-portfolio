---
phase: 03-financial-tracking
plan: 01
subsystem: database
tags: [postgresql, drizzle-orm, financial-schema, budget-tracking, actuals]

# Dependency graph
requires:
  - phase: 02-core-projects
    provides: projects table with core fields and related entities
provides:
  - Financial tracking schema with budget_lines, project_budget_allocations, receipts, and invoices tables
  - Project budget fields (opexBudget, capexBudget, budgetCurrency, costTshirt)
  - Multi-currency support with ISO 4217 currency codes
  - Migration file ready for database deployment
affects: [03-02, 03-03, 03-04, budget-apis, actuals-import, financial-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-currency storage pattern (amount + currency)"
    - "Financial NUMERIC(15,2) for all monetary values"
    - "Unique constraints to prevent duplicate imports"
    - "Cascade delete on project children, restrict on reference data"

key-files:
  created:
    - backend/drizzle/0002_thin_blade.sql
  modified:
    - backend/src/db/schema.ts

key-decisions:
  - "Store all monetary amounts as NUMERIC(15,2) never as JavaScript Number"
  - "Store currency alongside amounts using ISO 4217 codes"
  - "Competence month for invoices supports extraction flag and manual override"
  - "Unique constraints prevent duplicate budget line and actuals imports"

patterns-established:
  - "Financial tables use numeric(15,2) with precision 15, scale 2"
  - "Currency stored as varchar(3) following ISO 4217"
  - "Import tracking via importBatch field"
  - "Unique constraints on business keys to detect duplicates"

# Metrics
duration: 23min
completed: 2026-02-05
---

# Phase 03 Plan 01: Financial Tracking Schema Summary

**Complete financial tracking database schema with budget lines, allocations, receipts, and invoices using PostgreSQL NUMERIC for precision**

## Performance

- **Duration:** 23 min
- **Started:** 2026-02-05T09:29:25Z
- **Completed:** 2026-02-05T09:51:53Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Added 5 financial tracking tables to database schema
- Implemented multi-currency support with ISO 4217 currency codes
- Generated database migration file for all financial tables
- Added project budget fields with auto-derived cost T-shirt sizing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add budget_lines table to schema** - `3ae9172` (feat)
2. **Task 2: Add project budget and allocation tables** - `325ab4c` (feat)
3. **Task 3: Add receipts and invoices tables and generate migration** - `9244f53` (feat)

## Files Created/Modified
- `backend/src/db/schema.ts` - Added budgetLines, projectBudgetAllocations, receipts, invoices tables; added budget columns to projects table
- `backend/drizzle/0002_thin_blade.sql` - Migration file for all financial tables

## Decisions Made

**1. NUMERIC type for all currency amounts**
- Rationale: PostgreSQL NUMERIC provides exact decimal arithmetic, preventing floating-point rounding errors in financial calculations

**2. Currency stored alongside amounts**
- Rationale: Store original currency (ISO 4217 codes) with each amount, convert only at reporting layer to preserve data integrity

**3. Competence month with extraction flag**
- Rationale: Support regex-based extraction from invoice descriptions while flagging extraction failures and allowing manual override

**4. Unique constraints on business keys**
- Rationale: Prevent duplicate imports for budget lines (company/cost center/line/year) and actuals (project/invoice number/amount)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration not applied due to database unavailability**
- **Found during:** Task 3 (Apply migration step)
- **Issue:** PostgreSQL database not accessible at localhost:5432 - connection refused
- **Fix:** Migration file generated successfully (0002_thin_blade.sql), ready to apply when database is available
- **Files created:** backend/drizzle/0002_thin_blade.sql
- **Verification:** TypeScript compiles without errors, migration file contains all expected DDL statements
- **Committed in:** 9244f53 (Task 3 commit)
- **Next step:** User needs to start Docker (`docker compose up -d`) then run `npx drizzle-kit push` in backend directory

---

**Total deviations:** 1 (blocking - database unavailable)
**Impact on plan:** Schema code complete and migration file generated. Database deployment deferred until Docker environment is running.

## Issues Encountered

**PostgreSQL database not running**
- Docker container eurostar-portfolio-db not accessible
- All schema changes completed and migration generated
- Migration can be applied when database is started with: `cd backend && npx drizzle-kit push`

## User Setup Required

**Database startup required:**

Before the financial tracking API can be implemented in subsequent plans, the database migration must be applied:

1. Start PostgreSQL: `docker compose up -d` (from project root)
2. Wait for database health check (5-10 seconds)
3. Apply migration: `cd backend && npx drizzle-kit push`
4. Verify: Migration should complete without errors, creating all 5 financial tables

Expected result:
- Tables created: budget_lines, project_budget_allocations, receipts, invoices
- Projects table updated with: opex_budget, capex_budget, budget_currency, cost_tshirt columns

## Next Phase Readiness

**Ready for Phase 03 Plan 02 (Budget Lines API):**
- Schema complete with all required tables and constraints
- Foreign key relationships established
- Unique constraints prevent duplicate imports
- Migration file ready to apply

**Blockers:**
- Database migration must be applied before API development can proceed
- Requires Docker environment to be running

**No concerns:**
- Schema design follows financial best practices
- All constraints properly defined
- TypeScript types export correctly

---
*Phase: 03-financial-tracking*
*Completed: 2026-02-05*
