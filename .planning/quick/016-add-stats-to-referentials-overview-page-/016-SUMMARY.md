---
phase: quick-016
plan: 01
subsystem: admin
tags: [fastify, react, drizzle-orm, admin-ui]

# Dependency graph
requires:
  - phase: 06-05
    provides: Admin referentials overview page with card grid
provides:
  - Item count stats on all 9 referential cards
  - Single efficient /api/admin/stats endpoint
  - Frontend stats key mapping for kebab-case to camelCase conversion
affects: [admin-ui, referentials]

# Tech tracking
tech-stack:
  added: []
  patterns: [Single batch stats endpoint with Promise.all for parallel queries]

key-files:
  created: []
  modified:
    - backend/src/routes/admin/referentials.ts
    - frontend/src/pages/admin/ReferentialList.tsx

key-decisions:
  - "Use single /stats endpoint with Promise.all for efficiency instead of 9 separate calls"
  - "Map frontend kebab-case IDs to backend camelCase keys (cost-centers -> costCenters)"
  - "Show counts only when loaded, cards remain functional if stats fail"

patterns-established:
  - "Stats endpoint pattern: Promise.all with count() for parallel batch queries"
  - "Frontend stats key mapping for ID format differences"
  - "Graceful degradation: cards render immediately, counts fade in when loaded"

# Metrics
duration: 9min
completed: 2026-02-15
---

# Quick Task 016: Add Stats to Referentials Overview Page

**Item counts displayed on all 9 referential cards via single efficient /api/admin/stats endpoint**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-15T14:28:08Z
- **Completed:** 2026-02-15T14:37:30Z
- **Tasks:** 3 (2 commits - Task 3 handled in Task 2)
- **Files modified:** 2

## Accomplishments
- Added /api/admin/stats endpoint returning counts for all 10 referential types
- Display counts like "3 items" below each card description
- Single API call on mount with graceful loading and error handling
- Frontend ID mapping handles kebab-case to camelCase conversion

## Task Commits

Each task was committed atomically:

1. **Task 1: Add stats endpoint to backend** - `57a8393c` (feat)
2. **Task 2: Display counts on overview cards** - `a9f65819` (feat)
3. **Task 3: Handle loading and error states** - (included in Task 2)

## Files Created/Modified
- `backend/src/routes/admin/referentials.ts` - Added GET /stats endpoint with Promise.all parallel count queries for all 10 referential tables
- `frontend/src/pages/admin/ReferentialList.tsx` - Added stats fetching on mount with loading state, ID mapping, and count display

## Decisions Made

**Use single batch stats endpoint:**
- Promise.all with 10 parallel count queries more efficient than individual calls
- Reduces frontend network overhead from 9 requests to 1

**Frontend ID mapping:**
- Backend uses camelCase (costCenters), frontend uses kebab-case (cost-centers)
- Created statsKeyMap to translate between formats

**Graceful degradation:**
- Cards render immediately without waiting for stats
- Counts fade in when loaded
- If stats fail, cards remain clickable (no crash or broken UI)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward implementation using existing patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Admin referentials overview now provides quick visibility into data volumes. No blockers for future work.

## Self-Check: PASSED

**Files:**
- FOUND: backend/src/routes/admin/referentials.ts
- FOUND: frontend/src/pages/admin/ReferentialList.tsx

**Commits:**
- FOUND: 57a8393c (Task 1: Add stats endpoint to backend)
- FOUND: a9f65819 (Task 2: Display counts on overview cards)

---
*Phase: quick-016*
*Completed: 2026-02-15*
