---
phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar
plan: 03
subsystem: ui
tags: [react, tanstack-table, expandable-cells, t-shirt-sizing, lucide-react]

# Dependency graph
requires:
  - phase: 07-02
    provides: Mini-visualization components for table cells
provides:
  - Expandable Effort and Impact cells with aggregate T-shirt badges
  - Team effort breakdown expansion component
  - Impact team breakdown expansion component
  - T-shirt aggregation utilities using MAX algorithm
affects: [07-04, 07-05, portfolio-table-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Expandable table cells with inline sub-rows"
    - "MAX algorithm for T-shirt size aggregation"
    - "Click-to-expand pattern with chevron indicator"
    - "React.memo for table cell performance"

key-files:
  created:
    - frontend/src/lib/effort-utils.ts
    - frontend/src/components/portfolio/columns/EffortExpandedRow.tsx
    - frontend/src/components/portfolio/columns/ImpactExpandedRow.tsx
    - frontend/src/components/portfolio/columns/ImpactCell.tsx
  modified:
    - frontend/src/components/portfolio/columns/EffortCell.tsx
    - frontend/src/components/portfolio/columns/portfolioColumns.tsx

key-decisions:
  - "MAX algorithm for T-shirt aggregation (represents peak team effort)"
  - "Click-to-expand inline instead of hover tooltip for better mobile support"
  - "React.memo wrapping for performance during table scrolling"
  - "Keyboard accessibility with Enter/Space handling"

patterns-established:
  - "Expandable cell pattern: aggregate view + expand chevron + inline breakdown row"
  - "T-shirt color mapping: XS=gray, S=blue, M=green, L=yellow, XL=orange, XXL=red"
  - "Team effort shows lead indicator in expanded view"

# Metrics
duration: 12min
completed: 2026-02-09
---

# Phase 7 Plan 3: Expandable Effort and Impact Cells Summary

**Aggregate T-shirt cells with click-to-expand team breakdown using MAX algorithm and inline sub-rows**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-09T14:44:07Z
- **Completed:** 2026-02-09T14:56:41Z
- **Tasks:** 3
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments
- Created T-shirt aggregation utilities with MAX algorithm for deriving global effort/impact sizes
- Implemented expandable EffortCell showing aggregate T-shirt badge with team count and expand chevron
- Built EffortExpandedRow with team breakdown showing individual T-shirts and lead indicator
- Implemented expandable ImpactCell matching EffortCell pattern for change impact teams
- Built ImpactExpandedRow displaying impact team breakdown with individual T-shirt sizes
- All components optimized with React.memo and keyboard accessible

## Task Commits

Each task was committed atomically:

1. **Task 1: Create effort utility functions** - `f3f8c1d9` (feat)
2. **Task 2: Create EffortCell and EffortExpandedRow components** - `c16eef35` (feat)
3. **Task 3: Create ImpactCell and ImpactExpandedRow components** - `75b5ae2e` (feat)

**Deviation fix:** `d4cfd967` (fix: remove obsolete leadTeamId prop)

## Files Created/Modified
- `frontend/src/lib/effort-utils.ts` - T-shirt aggregation functions (deriveGlobalEffort, deriveGlobalImpact) and color mapping
- `frontend/src/components/portfolio/columns/EffortCell.tsx` - Expandable cell showing aggregate T-shirt with expand chevron
- `frontend/src/components/portfolio/columns/EffortExpandedRow.tsx` - Inline sub-row displaying team effort breakdown with lead indicators
- `frontend/src/components/portfolio/columns/ImpactCell.tsx` - Expandable cell showing aggregate impact T-shirt
- `frontend/src/components/portfolio/columns/ImpactExpandedRow.tsx` - Inline sub-row displaying impact team breakdown
- `frontend/src/components/portfolio/columns/portfolioColumns.tsx` - Updated EffortCell usage to remove obsolete prop

## Decisions Made
- **MAX algorithm for aggregation:** Chose maximum T-shirt size across teams as global effort/impact representation, as it represents the peak commitment level
- **Click-to-expand instead of hover:** Better for mobile and explicit user intent
- **Inline sub-row pattern:** Matches Notion's toggle row UX - keeps context without leaving table
- **Team count badge:** Shows number of teams in parentheses for quick overview before expanding

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed obsolete leadTeamId prop from EffortCell usage**
- **Found during:** Task 2 verification (TypeScript compilation)
- **Issue:** portfolioColumns.tsx was passing leadTeamId prop to EffortCell, but the new expandable implementation doesn't need it since isLead is already in the teams array
- **Fix:** Removed leadTeamId prop from EffortCell instantiation in portfolioColumns.tsx
- **Files modified:** frontend/src/components/portfolio/columns/portfolioColumns.tsx
- **Verification:** TypeScript compilation passed with no errors
- **Committed in:** d4cfd967 (separate fix commit)

---

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** Auto-fix necessary to resolve TypeScript compilation error. No scope creep - removed obsolete code that was incompatible with new component API.

## Issues Encountered
None - plan executed smoothly with one compilation fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Expandable Effort and Impact cells ready for integration into portfolio table
- Components accept isExpanded and onToggleExpand props for parent table to manage expansion state
- Next steps: Integrate expansion state management in portfolio table (likely needs row expansion tracking)
- Ready for 07-04: Enhanced budget and committee cells
- Pattern established for other expandable cell types

## Self-Check: PASSED

All claimed files verified:
- FOUND: frontend/src/lib/effort-utils.ts
- FOUND: frontend/src/components/portfolio/columns/EffortExpandedRow.tsx
- FOUND: frontend/src/components/portfolio/columns/ImpactCell.tsx
- FOUND: frontend/src/components/portfolio/columns/ImpactExpandedRow.tsx

All claimed commits verified:
- FOUND: f3f8c1d9 (Task 1)
- FOUND: c16eef35 (Task 2)
- FOUND: 75b5ae2e (Task 3)
- FOUND: d4cfd967 (Deviation fix)

---
*Phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar*
*Completed: 2026-02-09*
