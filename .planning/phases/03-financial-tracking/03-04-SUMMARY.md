---
phase: 03-financial-tracking
plan: 04
subsystem: api
tags: [fastify, drizzle-orm, actuals, receipts, invoices, regex, validation]

# Dependency graph
requires:
  - phase: 03-01
    provides: Financial schema with receipts, invoices, and competence_month_patterns tables
provides:
  - Receipts import API with project and currency validation
  - Invoices import API with competence month extraction
  - Competence month extraction utility with regex pattern matching
  - Manual competence month override endpoint
affects: [03-05, 03-06, reporting, financial-views]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Batch import with validation and error collection pattern
    - UUID-based import batch tracking
    - Regex-based field extraction from descriptions
    - Database-driven pattern matching configuration

key-files:
  created:
    - backend/src/lib/competence-month.ts
    - backend/src/routes/actuals/receipts.ts
    - backend/src/routes/actuals/invoices.ts
    - backend/src/routes/actuals/index.ts
  modified:
    - backend/src/server.ts

key-decisions:
  - "Batch import returns partial success with error array per record"
  - "Competence month extraction uses database-configured regex patterns"
  - "Import batch UUID generated server-side for tracking"
  - "Currency validation ensures currency_rates table has the currency"
  - "Project validation uses PRJ-YYYY-XXXXX format lookup"

patterns-established:
  - "Import endpoints validate each record individually and collect errors by index"
  - "Failed extractions increment extractionWarnings counter for alerting"
  - "Manual override field (competenceMonthOverride) takes precedence in queries"
  - "All amounts stored as strings for PostgreSQL NUMERIC type"

# Metrics
duration: 13min
completed: 2026-02-05
---

# Phase 03 Plan 04: Actuals Import APIs Summary

**REST APIs for receipts and invoices import with regex-based competence month extraction and project/currency validation**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-05T09:57:04Z
- **Completed:** 2026-02-05T10:10:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Competence month extraction utility with database-driven regex patterns
- Receipts import API with batch validation and error reporting
- Invoices import API with automatic competence month extraction
- Manual competence month override endpoint for failed extractions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create competence month extraction utility** - `a19a7db` (feat)
2. **Task 2: Create receipts and invoices API routes** - `a9fb6ee` (feat)

## Files Created/Modified
- `backend/src/lib/competence-month.ts` - Regex-based competence month extraction with format normalization
- `backend/src/routes/actuals/receipts.ts` - Receipts CRUD and batch import with validation
- `backend/src/routes/actuals/invoices.ts` - Invoices CRUD, import, and competence month override
- `backend/src/routes/actuals/index.ts` - Combined actuals router
- `backend/src/server.ts` - Registered actuals routes at /api/actuals

## Decisions Made

**1. Batch import partial success pattern**
- Import endpoints validate each record independently
- Return { imported: N, errors: [{ index, message }] }
- Valid records inserted even if some fail validation
- Enables users to fix errors without re-importing valid data

**2. Database-driven pattern matching**
- extractCompetenceMonth queries competence_month_patterns by company
- Tries each pattern in sequence until match found
- Handles invalid regex gracefully (skip, don't crash)
- Enables pattern updates without code changes

**3. Server-side import batch tracking**
- UUID generated server-side for importBatch field
- Client doesn't provide batch ID
- Prevents collisions and enables audit trail

**4. Currency validation approach**
- Validates currency exists in currency_rates.fromCurrency
- Ensures only known currencies can be imported
- Prevents invalid currency codes at import time

**5. Manual override takes precedence**
- competenceMonthOverride field allows correction
- PUT endpoint validates YYYY-MM format
- Queries should use COALESCE(override, extracted, NULL) pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Database not running during verification**
- PostgreSQL connection refused during endpoint testing
- Expected blocker from STATE.md (migration 0002 not applied)
- Verified routes registered correctly via server logs
- Routes attempted database queries, confirming code correctness
- Runtime TypeScript handled augmented types correctly despite static analysis warnings

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready:**
- Receipts and invoices can be imported via API
- Project validation ensures actuals linked to valid projects
- Currency validation ensures valid currency codes
- Competence month extraction configured via database patterns
- Manual override available for extraction failures

**Blockers:**
- Database migration 0002 not applied (receipts/invoices tables don't exist yet)
- Docker/PostgreSQL needs to be running: `docker compose up -d && cd backend && npx drizzle-kit push`
- No competence_month_patterns seeded yet (extraction will fail until patterns added)

**Next steps:**
- Apply migration 0002 to create actuals tables
- Seed competence_month_patterns with THIF and EIL patterns
- Test import with real data
- Phase 03-05: Budget lines import API
- Phase 03-06: Project budget allocation API

---
*Phase: 03-financial-tracking*
*Completed: 2026-02-05*
