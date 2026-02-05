---
phase: 03-financial-tracking
plan: 07
subsystem: ui
tags: [react, typescript, excel, actuals, financial-tracking, shadcn-ui, fastify-multipart]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Actuals database schema (receipts, invoices tables)"
  - phase: 03-02
    provides: "Excel parsing utilities and validation patterns"
  - phase: 03-03
    provides: "Actuals JSON import endpoints"
  - phase: 03-04
    provides: "Competence month extraction for invoices"
provides:
  - "Actuals summary component showing totals vs budget in project sidebar"
  - "Excel upload dialog for receipts and invoices with validation feedback"
  - "Backend endpoints for Excel file upload with parsing and validation"
  - "Actuals summary API endpoint calculating budget utilization"
affects: [03-08, financial-reporting, budget-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reuse excel-parser validation schemas for receipts and invoices"
    - "Upload dialogs use tabs for different entity types (receipts/invoices)"
    - "Summary components conditionally render based on data availability (budgetCurrency)"
    - "File upload uses FormData without auth token (multipart/form-data)"

key-files:
  created:
    - frontend/src/lib/actuals-api.ts
    - frontend/src/components/projects/ActualsSummary.tsx
    - frontend/src/components/ActualsUploadDialog.tsx
  modified:
    - frontend/src/components/projects/ProjectSidebar.tsx
    - frontend/src/pages/portfolio/PortfolioPage.tsx
    - frontend/src/lib/project-api.ts
    - backend/src/lib/excel-parser.ts
    - backend/src/routes/actuals/receipts.ts
    - backend/src/routes/actuals/invoices.ts
    - backend/src/routes/projects/projects.ts

key-decisions:
  - "Actuals summary only shown in sidebar if budgetCurrency is set"
  - "Upload button placed in portfolio page toolbar (global action)"
  - "Excel upload endpoints separate from JSON import endpoints"
  - "Summary endpoint calculates budget remaining and percentage used"

patterns-established:
  - "File upload endpoints use @fastify/multipart with 10MB limit"
  - "Excel validation happens in two phases: schema then referential integrity"
  - "Upload results show imported count, validation errors, and extraction warnings"
  - "Summary components fetch data independently with useEffect on mount"

# Metrics
duration: 16min
completed: 2026-02-05
---

# Phase 3 Plan 7: Actuals Summary & Upload Summary

**Actuals summary in project sidebar with Excel upload dialog for receipts and invoices, including budget comparison and extraction warnings**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-05T10:23:29Z
- **Completed:** 2026-02-05T10:39:33Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Created ActualsSummary component showing receipts, invoices, totals, budget, and remaining with color-coded alerts
- Created ActualsUploadDialog with tabs for receipts and invoices Excel uploads
- Added backend Excel upload endpoints for receipts and invoices with validation
- Added actuals summary API endpoint calculating budget utilization and extraction warnings
- Integrated components into ProjectSidebar and PortfolioPage

## Task Commits

Each task was committed atomically:

1. **Task 1: Create actuals API client** - `3f5b4b1` (feat)
2. **Task 2: Create actuals summary component and upload dialog** - `6ba4ddd` (feat)
3. **Task 3: Add actuals summary and Excel upload endpoints to backend** - `0ec4afb` (feat)

## Files Created/Modified

### Frontend
- `frontend/src/lib/actuals-api.ts` - API client for actuals summary and uploads
- `frontend/src/components/projects/ActualsSummary.tsx` - Read-only actuals summary with budget comparison
- `frontend/src/components/ActualsUploadDialog.tsx` - Excel upload dialog with tabs and validation feedback
- `frontend/src/components/projects/ProjectSidebar.tsx` - Added ActualsSummary below ProjectTabs
- `frontend/src/pages/portfolio/PortfolioPage.tsx` - Added Upload Actuals button
- `frontend/src/lib/project-api.ts` - Added budget fields to Project interface

### Backend
- `backend/src/lib/excel-parser.ts` - Added receipt and invoice validation schemas
- `backend/src/routes/actuals/receipts.ts` - Added Excel upload endpoint
- `backend/src/routes/actuals/invoices.ts` - Added Excel upload endpoint with extraction
- `backend/src/routes/projects/projects.ts` - Added actuals summary endpoint
- `frontend/src/components/projects/tabs/BudgetTab.tsx` - Fixed unused import blocking build

## Decisions Made

- **Actuals summary visibility:** Only show in sidebar if project.budgetCurrency is set (no budget = no actuals summary)
- **Upload location:** Upload Actuals button in portfolio page toolbar (not per-project) as it's a bulk operation
- **Endpoint separation:** Excel upload endpoints separate from JSON import endpoints for clearer API surface
- **Summary calculation:** Summary endpoint calculates derived fields (percentUsed, budgetRemaining) server-side to avoid client-side precision issues

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed unused import in BudgetTab blocking build**
- **Found during:** Task 2 (Frontend TypeScript compilation)
- **Issue:** BudgetAllocation type imported but not used, causing TypeScript build error
- **Fix:** Removed unused import from BudgetTab.tsx import statement
- **Files modified:** frontend/src/components/projects/tabs/BudgetTab.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 6ba4ddd (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** Build-blocking error required immediate fix. No scope creep.

## Issues Encountered

None - all tasks executed smoothly with expected dependencies in place.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Budget allocation UI (03-08) can now display actuals vs allocated
- Financial reporting can consume actuals summary data
- Invoice competence month review workflow can query invoices needing attention

**Notes:**
- Excel upload templates not provided in plan (optional enhancement)
- Frontend does not validate Excel format before upload (handled server-side)
- Sidebar refresh after upload uses close/reopen pattern (could be optimized with state update)

---
*Phase: 03-financial-tracking*
*Completed: 2026-02-05*
