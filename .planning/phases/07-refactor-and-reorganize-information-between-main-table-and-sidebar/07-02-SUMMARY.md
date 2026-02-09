---
phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar
plan: 02
subsystem: frontend-portfolio-table
status: complete
completed: 2026-02-09
duration: 14
tags: [visualization, table-cells, recharts, date-fns, ui-components]
dependency_graph:
  requires: [recharts, date-fns]
  provides: [ValueScoreCell-radar, LastActivityCell, DateRangeCell, CostTshirtCell]
  affects: [portfolioColumns]
tech_stack:
  added: [recharts@3.7.0, date-fns@4.1.0]
  patterns: [memoized-components, mini-visualizations]
key_files:
  created:
    - frontend/src/components/portfolio/columns/LastActivityCell.tsx
    - frontend/src/components/portfolio/columns/DateRangeCell.tsx
    - frontend/src/components/portfolio/columns/CostTshirtCell.tsx
  modified:
    - frontend/package.json
    - frontend/src/components/portfolio/columns/ValueScoreCell.tsx
    - frontend/src/components/portfolio/columns/portfolioColumns.tsx
    - frontend/src/pages/portfolio/PortfolioPage.tsx
decisions:
  - Use recharts 3.7.0 for radar chart visualization (SVG-based, React-native, declarative API)
  - Use date-fns 4.1.0 for relative time formatting (tree-shakeable, formatDistanceToNow)
  - Mini radar chart sized at 40x40px for compact table cell display
  - React.memo wrapper on all cell components for table scroll performance
  - Truncate outcome names to 3 characters for radar chart dimension labels
  - Color-coded T-shirt badges match existing color scheme from BudgetTab
metrics:
  tasks_completed: 3
  files_created: 3
  files_modified: 4
  commits: 4
  duration_minutes: 14
---

# Phase 07 Plan 02: Install visualization libraries and create cell components

**One-liner:** Mini radar chart for value scores, relative time for last activity, combined date range, and colored T-shirt badges using recharts and date-fns.

## Summary

Successfully installed recharts and date-fns libraries and created four new cell components for the portfolio table:

1. **ValueScoreCell**: Replaced 5-dot indicator with mini radar chart showing all 5 outcome dimensions
2. **LastActivityCell**: Displays relative time (e.g., "2 hours ago") using date-fns formatDistanceToNow
3. **DateRangeCell**: Combines start/end dates into single "MMM yyyy - MMM yyyy" format
4. **CostTshirtCell**: Shows colored T-shirt size badge with color mapping

All components are memoized for optimal table scroll performance and handle null/undefined values gracefully.

## Tasks Completed

### Task 1: Install recharts and date-fns
**Status:** ✅ Complete
**Commit:** `63a54161`

Installed required dependencies:
- recharts ^3.7.0 - SVG-based charting library for mini radar visualization
- date-fns ^4.1.0 - Tree-shakeable date utility library for relative time formatting

**Files modified:**
- `frontend/package.json`
- `frontend/package-lock.json`

### Task 2: Create ValueScoreCell with mini radar chart
**Status:** ✅ Complete
**Commit:** `2b332322`

Replaced the existing 5-dot value indicator with a mini radar chart that visualizes all 5 outcome dimensions simultaneously.

**Implementation details:**
- 40x40px compact display suitable for table cells
- Uses recharts RadarChart with PolarGrid
- Dimension labels truncated to 3 characters (e.g., "Cus" for "Customer")
- Primary color theme with 50% fill opacity
- React.memo wrapper for scroll performance
- Graceful handling of null scores (defaults to 0) and empty values arrays

**Files modified:**
- `frontend/src/components/portfolio/columns/ValueScoreCell.tsx`

### Task 3: Create LastActivityCell, DateRangeCell, and CostTshirtCell
**Status:** ✅ Complete
**Commit:** `48c00cc6`

Created three additional cell components:

**LastActivityCell:**
- Uses `formatDistanceToNow` from date-fns for relative time display
- Shows human-readable time like "2 hours ago", "yesterday", "3 months ago"
- Full timestamp shown in title attribute on hover
- Null-safe with "—" placeholder

**DateRangeCell:**
- Combines startDate and endDate into single column
- Format: "MMM yyyy - MMM yyyy" (e.g., "Jan 2026 - Jun 2026")
- Handles null dates with "TBD" placeholder
- Shows "—" when both dates are null
- Error handling for invalid date strings

**CostTshirtCell:**
- Displays T-shirt size as colored badge
- Color mapping: XS=gray, S=blue, M=green, L=yellow, XL=orange, XXL=red
- Uses existing Badge component from shadcn/ui
- Matches color scheme from BudgetTab for consistency

All three components use React.memo for performance optimization.

**Files created:**
- `frontend/src/components/portfolio/columns/LastActivityCell.tsx`
- `frontend/src/components/portfolio/columns/DateRangeCell.tsx`
- `frontend/src/components/portfolio/columns/CostTshirtCell.tsx`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated portfolioColumns to pass values array**
- **Found during:** Task 2 verification (build step)
- **Issue:** portfolioColumns.tsx was passing `score` prop to ValueScoreCell, but new implementation expects `values` array. TypeScript build failed with type mismatch error.
- **Fix:**
  - Changed column accessor from `valueScoreAvg` to `values`
  - Updated cell renderer to pass values array to ValueScoreCell
  - Disabled sorting on values column (can't meaningfully sort arrays)
- **Files modified:** `frontend/src/components/portfolio/columns/portfolioColumns.tsx`
- **Commit:** `3e1eb2bb`

**2. [Rule 1 - Bug] Fixed PortfolioProject type inconsistency**
- **Found during:** Task 2 verification (build step)
- **Issue:** Two conflicting PortfolioProject interfaces existed - one in project-api.ts (with `valueScoreAvg: number | null`) and one in portfolioColumns.tsx (with `valueScoreAvg?: number`). This caused type assignment errors.
- **Fix:**
  - Removed duplicate interface definition from portfolioColumns.tsx
  - Imported PortfolioProject from project-api.ts as single source of truth
  - Re-exported type from portfolioColumns.tsx for backwards compatibility with existing imports
- **Files modified:** `frontend/src/components/portfolio/columns/portfolioColumns.tsx`
- **Commit:** `3e1eb2bb`

**3. [Rule 1 - Bug] Fixed unused parameter warning**
- **Found during:** Task 2 verification (build step)
- **Issue:** `columnId` parameter in globalFilterFn was declared but never used, causing TypeScript warning
- **Fix:** Prefixed with underscore: `_columnId` to indicate intentionally unused parameter
- **Files modified:** `frontend/src/pages/portfolio/PortfolioPage.tsx`
- **Commit:** `3e1eb2bb`

All three deviations were necessary to integrate the new radar chart component with the existing table infrastructure. These were auto-fixed per Rule 1 (bug fixes required for code to work).

## Verification Results

✅ All verification criteria met:
- `npm run build` completes successfully with no TypeScript errors
- All four cell components export properly
- ValueScoreCell uses RadarChart from recharts with memo wrapper
- LastActivityCell uses formatDistanceToNow from date-fns
- DateRangeCell handles null dates gracefully with "TBD" and "—" placeholders
- CostTshirtCell color scheme matches existing T-shirt colors from BudgetTab

## Success Criteria

✅ recharts and date-fns installed
✅ ValueScoreCell renders mini radar chart (40x40px)
✅ LastActivityCell shows "2 hours ago" style relative time
✅ DateRangeCell shows "Jan 2026 - Jun 2026" format
✅ CostTshirtCell shows colored T-shirt badge
✅ All components are memoized for performance

## Next Steps

These cell components are now ready for integration into portfolioColumns.tsx in the next plan. The components will need to be:
1. Imported into portfolioColumns.tsx
2. Added as column definitions
3. Connected to appropriate data fields from PortfolioProject interface

Note: The portfolioColumns.tsx already has the ValueScoreCell integrated (though it now expects the full values array from the backend). The remaining three components (LastActivityCell, DateRangeCell, CostTshirtCell) will be integrated when the corresponding columns are added to the table.

## Self-Check: PASSED

✅ Created files exist:
- FOUND: frontend/src/components/portfolio/columns/LastActivityCell.tsx
- FOUND: frontend/src/components/portfolio/columns/DateRangeCell.tsx
- FOUND: frontend/src/components/portfolio/columns/CostTshirtCell.tsx

✅ Modified files exist:
- FOUND: frontend/package.json
- FOUND: frontend/src/components/portfolio/columns/ValueScoreCell.tsx
- FOUND: frontend/src/components/portfolio/columns/portfolioColumns.tsx
- FOUND: frontend/src/pages/portfolio/PortfolioPage.tsx

✅ Commits exist:
- FOUND: 63a54161 (Task 1 - Install libraries)
- FOUND: 2b332322 (Task 2 - ValueScoreCell radar chart)
- FOUND: 48c00cc6 (Task 3 - Three new cell components)
- FOUND: 3e1eb2bb (Deviation fixes)

All files created, all commits verified. Plan execution complete.
