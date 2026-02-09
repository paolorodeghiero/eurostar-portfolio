---
phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar
plan: 01
subsystem: database, api
tags: [postgresql, drizzle, fastify, currency-conversion, description-field]

# Dependency graph
requires:
  - phase: 03-budget-actuals
    provides: Currency conversion system and budget tracking
  - phase: 02-core-projects
    provides: Projects table and API structure
provides:
  - Description field in projects table for rich text storage
  - Currency model fix: all monetary values stored in EUR
  - API currency conversion at boundary (inputCurrency parameter)
  - Optimized projects list API with actualsTotal calculation
affects: [07-02, 07-03, frontend-refactor, portfolio-table, sidebar-tabs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All monetary values stored in EUR in database"
    - "Currency conversion at API boundary using reportCurrency query param"
    - "inputCurrency parameter for budget updates converts to EUR before storing"
    - "actualsTotal calculated from receipts table SUM in EUR"

key-files:
  created:
    - backend/drizzle/0009_add_description.sql
  modified:
    - backend/src/db/schema.ts
    - backend/src/lib/currency-converter.ts
    - backend/src/routes/projects/project-budget.ts
    - backend/src/routes/projects/projects.ts

key-decisions:
  - "EUR is the single source of truth for all monetary values in database"
  - "reportCurrency and inputCurrency are API-level concerns only"
  - "convertCurrency handles null amounts gracefully (returns null)"
  - "actualsTotal calculated from receipts only (invoices tracked separately)"

patterns-established:
  - "Pattern: Currency conversion helper returns null for null input amounts"
  - "Pattern: GET endpoints accept reportCurrency query param for display currency"
  - "Pattern: PUT endpoints accept inputCurrency body param for input currency"
  - "Pattern: Project startDate used as reference date for budget currency conversion"

# Metrics
duration: 15min
completed: 2026-02-09
---

# Phase 07 Plan 01: Database and API Foundation for Portfolio Refactor Summary

**Description field added to projects, all monetary values now stored in EUR with API-level currency conversion, actualsTotal calculated from receipts**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-09T14:22:23Z
- **Completed:** 2026-02-09T14:38:13Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added description TEXT column to projects table for rich text storage
- Fixed currency model: all monetary values (opex, capex, actuals) stored in EUR
- API converts to reportCurrency at boundary using convertCurrency helper
- Budget updates accept inputCurrency parameter and convert to EUR before storing
- Optimized projects list API to calculate actualsTotal from receipts table

## Task Commits

Each task was committed atomically:

1. **Task 1: Add description field to projects table** - `7e92253e` (feat)
   - Created migration 0009_add_description.sql
   - Updated schema.ts with description field after sponsor

2. **Task 2: Fix currency model and optimize projects list API** - `ce16a158` (feat)
   - Updated convertCurrency to handle null amounts
   - Added convertBatchCurrency helper for efficient batch conversion
   - Updated PUT /api/projects/:projectId/budget to accept inputCurrency
   - Updated GET /api/projects to include description, actualsTotal, reportCurrency
   - Calculate actualsTotal from receipts table (SUM in EUR)

## Files Created/Modified
- `backend/drizzle/0009_add_description.sql` - Migration to add description column
- `backend/src/db/schema.ts` - Added description: text('description') field
- `backend/src/lib/currency-converter.ts` - Updated to handle null amounts, added convertBatchCurrency
- `backend/src/routes/projects/project-budget.ts` - Updated PUT endpoint to accept inputCurrency and convert to EUR
- `backend/src/routes/projects/projects.ts` - Updated GET endpoints to include description and actualsTotal, support reportCurrency conversion

## Decisions Made
- **EUR as source of truth**: All monetary values stored in EUR in database. Currency conversion only happens at API boundary for display purposes.
- **Null amount handling**: convertCurrency returns null for null input amounts to maintain data integrity.
- **actualsTotal calculation**: Calculated from receipts table only (invoices tracked separately) as receipts are the primary actuals tracking mechanism.
- **Reference dates for conversion**: Project startDate used as reference date for budget conversions to ensure consistent historical rates.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly. TypeScript type checking caught null handling issues which were resolved during development.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Description field ready for rich text editor integration in frontend
- Currency conversion API ready for frontend integration
- actualsTotal field ready for portfolio table display
- All backend changes fully backward compatible with existing frontend

## Self-Check: PASSED

All deliverables verified:
- ✓ Migration file created: backend/drizzle/0009_add_description.sql
- ✓ Commit 7e92253e exists (Task 1)
- ✓ Commit ce16a158 exists (Task 2)
- ✓ Description column exists in database

---
*Phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar*
*Completed: 2026-02-09*
