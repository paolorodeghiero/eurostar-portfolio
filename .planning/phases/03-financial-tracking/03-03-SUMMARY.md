---
phase: 03-financial-tracking
plan: 03
subsystem: api
tags: [fastify, drizzle-orm, postgresql, budget, allocations, transactions]

# Dependency graph
requires:
  - phase: 03-01
    provides: Financial tracking schema with budget allocations table
provides:
  - Project budget API with OPEX/CAPEX management
  - Budget line allocation API with concurrent validation
  - Cost T-shirt auto-derivation from total budget
affects: [frontend-budget-ui, financial-reporting, power-bi-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SERIALIZABLE transactions with SELECT FOR UPDATE for row locking
    - Cost T-shirt auto-derivation on budget updates

key-files:
  created:
    - backend/src/lib/cost-tshirt.ts
    - backend/src/routes/projects/project-budget.ts
  modified:
    - backend/src/routes/projects/index.ts

key-decisions:
  - "Use SERIALIZABLE isolation level for allocation transactions to prevent race conditions"
  - "Validate allocations against available budget line amount in locked transaction"
  - "Auto-derive cost T-shirt on budget updates using deriveCostTshirt utility"
  - "Return allocationMatch flag to indicate if total allocations match declared budget"

patterns-established:
  - "Transaction-based validation with SELECT FOR UPDATE for concurrent allocation safety"
  - "Cost T-shirt derivation queries thresholds by currency and finds matching size"

# Metrics
duration: 10min
completed: 2026-02-05
---

# Phase 3 Plan 3: Project Budget API Summary

**REST API for project OPEX/CAPEX budgets with validated budget line allocations and auto-derived cost T-shirts**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-05T10:16:45Z
- **Completed:** 2026-02-05T10:27:05Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Cost T-shirt derivation utility queries thresholds by currency and returns appropriate size
- Project budget API with GET/PUT for OPEX/CAPEX management and cost T-shirt auto-derivation
- Budget allocation endpoints with transaction-based validation preventing over-allocation
- Allocation match status alerts when total allocations don't match declared budget

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cost T-shirt derivation utility** - `a8ea919` (feat)
2. **Task 2: Create project budget API routes** - `e2ab354` (feat)

## Files Created/Modified
- `backend/src/lib/cost-tshirt.ts` - Derives cost T-shirt size from total budget and currency by querying thresholds table
- `backend/src/routes/projects/project-budget.ts` - Project budget API with 6 endpoints for budget and allocation management
- `backend/src/routes/projects/index.ts` - Registered projectBudgetRoutes in projects router

## Decisions Made

**Cost T-shirt derivation**
- Query cost_tshirt_thresholds ordered by maxAmount ascending
- Find first threshold where totalBudget <= maxAmount
- Return null if no thresholds exist for currency, XXL if exceeds all thresholds
- Use parseFloat for comparison to avoid Number precision issues while maintaining string storage

**Allocation validation**
- Use SERIALIZABLE transaction isolation level for concurrent safety
- Lock budget line row with SELECT FOR UPDATE before validation
- Calculate current allocated amount excluding current allocation (for updates)
- Return 400 with detailed error (available, requested, line amount) when exceeds
- Allow deletion without validation (always safe to free up budget)

**Budget match status**
- Calculate totalBudget = opexBudget + capexBudget
- Calculate totalAllocated = sum of all allocation amounts
- Return allocationMatch boolean for BUDG-04 alert UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript type compatibility**
- Initial NodePgDatabase type parameter caused incompatibility with fastify.db
- Fixed by using `any` type for db parameter in deriveCostTshirt function
- No runtime impact, maintains type safety at usage sites

**SQL execute result handling**
- tx.execute returns QueryResult with rows property, not array
- Added .rows[0] access pattern for raw SQL query results
- Linter added null safety checks (.rows?.length, .rows?.[0])

## Next Phase Readiness

**Ready for:**
- Frontend budget UI (03-05) can now call these endpoints
- Budget line import (03-06) for populating available lines
- Actuals tracking (03-07, 03-08) can reference allocated budget

**Blockers:**
- Database migration 0002 may need to be applied before endpoints work in runtime
- Can be applied with: `docker compose up -d && cd backend && npx drizzle-kit push`

**Testing verification pending:**
- Endpoints compile successfully but runtime testing requires database
- Once migration applied, verify:
  - GET /api/projects/:id/budget returns budget with allocations
  - PUT /api/projects/:id/budget updates cost T-shirt correctly
  - POST allocations rejects over-allocation with 400
  - Concurrent allocation attempts handled by SERIALIZABLE transaction

---
*Phase: 03-financial-tracking*
*Completed: 2026-02-05*
