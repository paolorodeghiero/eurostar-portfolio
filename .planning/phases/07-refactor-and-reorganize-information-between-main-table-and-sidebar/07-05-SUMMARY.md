---
phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar
plan: 05
subsystem: frontend-portfolio-table
status: complete
completed: 2026-02-09
duration: 8
tags: [table-integration, column-pinning, expandable-rows, tanstack-table]
dependency_graph:
  requires: [07-02, 07-03, 07-04]
  provides: [complete-portfolio-table, column-pinning, inline-expansion]
  affects: [portfolio-page]
tech_stack:
  added: []
  patterns: [column-pinning, expandable-rows, sticky-positioning]
key_files:
  created: []
  modified:
    - frontend/src/lib/project-api.ts
    - frontend/src/components/portfolio/columns/portfolioColumns.tsx
    - frontend/src/components/portfolio/PortfolioTable.tsx
decisions:
  - First 3 columns pinned (checkbox, ID, name) for horizontal scroll navigation
  - Core 8 columns visible by default (ID, Name, Status, Lead, Dates, Value, Budget, Committee)
  - Expandable rows use _expandType field to track which cell (effort/impact) is expanded
  - Pinning styles use sticky positioning with z-index and shadow on last pinned column
  - Expanded row spans all visible columns with p-0 padding
  - Budget cell receives currency prop for proper formatting
metrics:
  tasks_completed: 3
  files_modified: 3
  commits: 3
  duration_minutes: 8
---

# Phase 07 Plan 05: Integrate Columns and Add Pinning/Expansion Summary

**One-liner:** Integrated all new cell components into portfolio table with first 3 columns pinned and inline expandable rows for effort/impact breakdowns.

## Summary

Successfully completed the portfolio table redesign integration by:
1. Updated PortfolioProject type with fields needed for expandable rows
2. Added all new columns to portfolioColumns with proper visibility defaults
3. Implemented column pinning for first 3 columns and expandable row functionality

The table now displays rich at-a-glance information with mini-visualizations, supports horizontal scrolling with frozen key columns, and allows inline expansion of effort and impact breakdowns.

## Tasks Completed

### Task 1: Update PortfolioProject type and project API
**Status:** ✅ Complete
**Commit:** `3781d960`

Updated the PortfolioProject interface in project-api.ts to include:
- `changeImpactTeams` array for impact cell (teams already existed for effort)
- `_expandType` field for tracking which cell type is currently expanded ('effort' or 'impact')

**Files modified:**
- `frontend/src/lib/project-api.ts`

### Task 2: Update portfolioColumns with all new columns
**Status:** ✅ Complete
**Commit:** `7fa023d4`

Comprehensive update to column definitions:

**Imports added:**
- ImpactCell, DateRangeCell, LastActivityCell, CostTshirtCell

**New columns added:**
- **Dates:** Combined start-end date range (130px width)
- **IS Owner:** Person field (100px width, hidden by default)
- **Sponsor:** Person field (100px width, hidden by default)
- **Impact:** Expandable impact teams (100px width, hidden by default)
- **Cost T-shirt:** Colored badge (70px width, hidden by default)
- **Last Activity:** Relative time (120px width, hidden by default)

**Updated columns:**
- **Value Score:** Uses radar chart from ValueScoreCell
- **Effort:** Now expandable with toggle logic and isExpanded prop
- **Budget:** Passes currency prop for proper EUR/GBP formatting

**Visibility configuration:**
- **Core 8 visible by default:** select, projectId, name, status, leadTeam, dates, valueScore, budgetHealth, committee
- **Hidden by default:** pm, isOwner, sponsor, effort, impact, costTshirt, lastActivity, stopped

**Column order:** Updated to include all new columns in logical sequence

**Files modified:**
- `frontend/src/components/portfolio/columns/portfolioColumns.tsx` (129 insertions, 16 deletions)

### Task 3: Add column pinning and expandable rows to PortfolioTable
**Status:** ✅ Complete
**Commit:** `952f369e`

Implemented column pinning and expandable row functionality:

**Column Pinning:**
- Imported `ColumnPinningState`, `ExpandedState`, `getExpandedRowModel`, `Column` type from tanstack/react-table
- Added `columnPinning` state with left array: `['select', 'projectId', 'name']`
- Created `getCommonPinningStyles` helper function returning CSSProperties with:
  - Sticky positioning for pinned columns
  - Left offset calculation from column.getStart('left')
  - z-index: 1 for pinned, 0 for regular
  - Background color on pinned columns to prevent transparency
  - Box shadow on last left-pinned column for visual separation
- Applied pinning styles to both TableHead and TableCell components

**Expandable Rows:**
- Imported EffortExpandedRow and ImpactExpandedRow components
- Added `expanded` state for tracking expanded rows
- Added `onExpandedChange: setExpanded` handler to table config
- Added `getExpandedRowModel()` to table instance
- Wrapped row rendering in fragment to include both main row and expanded row
- Conditional expanded row rendering based on `row.getIsExpanded()` and `_expandType`
- Expanded row spans all visible columns with colSpan
- Routes to appropriate expanded component (EffortExpandedRow or ImpactExpandedRow)

**Files modified:**
- `frontend/src/components/portfolio/PortfolioTable.tsx` (76 insertions, 25 deletions)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✅ All verification criteria met:
- `npm run build` completes successfully with no TypeScript errors
- First 3 columns (select, projectId, name) configured for sticky pinning
- Expandable row logic in place for effort and impact cells
- All new columns added with appropriate cell components
- Default visibility matches Core 8 specification

## Success Criteria

✅ Column pinning implemented for checkbox, ID, and name columns
✅ Expanding logic wired for effort/impact chevron interaction
✅ ValueScoreCell displays mini radar chart
✅ BudgetHealthCell shows progress bar with spent/total text and currency
✅ CommitteeCell shows level badge, progression dots, and state
✅ DateRangeCell shows "MMM yyyy - MMM yyyy" format
✅ LastActivityCell shows relative time ("2 hours ago" style)
✅ CostTshirtCell shows colored T-shirt badge
✅ IS Owner and Sponsor columns added for person names
✅ Default visibility: Core 8 visible, others hidden

## Next Steps

The portfolio table now has all columns integrated with:
- Rich mini-visualizations in cells
- Frozen first 3 columns for horizontal scroll
- Inline expandable rows for team breakdowns

**Potential follow-ups (future plans):**
- Backend API updates to return changeImpactTeams in portfolio endpoint
- Test with real data to verify expansion and pinning UX
- Column visibility toggle UI in toolbar
- Export functionality for table data

## Self-Check: PASSED

✅ Modified files exist:
- FOUND: frontend/src/lib/project-api.ts
- FOUND: frontend/src/components/portfolio/columns/portfolioColumns.tsx
- FOUND: frontend/src/components/portfolio/PortfolioTable.tsx

✅ Commits exist:
- FOUND: 3781d960 (Task 1 - PortfolioProject type update)
- FOUND: 7fa023d4 (Task 2 - Column definitions)
- FOUND: 952f369e (Task 3 - Pinning and expansion)

✅ Key features verified:
- PortfolioProject interface includes changeImpactTeams and _expandType
- portfolioColumns imports all new cell components
- All new columns present in column definitions with proper sizes
- defaultColumnVisibility configured with Core 8 visible
- PortfolioTable has getCommonPinningStyles function
- PortfolioTable renders EffortExpandedRow and ImpactExpandedRow conditionally
- columnPinning state pins select, projectId, name

All files modified, all commits verified. Plan execution complete.

## Self-Check Verification: PASSED

✅ **Files verified:**
- FOUND: frontend/src/lib/project-api.ts
- FOUND: frontend/src/components/portfolio/columns/portfolioColumns.tsx
- FOUND: frontend/src/components/portfolio/PortfolioTable.tsx

✅ **Commits verified:**
- FOUND: 3781d960 (Task 1)
- FOUND: 7fa023d4 (Task 2)
- FOUND: 952f369e (Task 3)

All claimed files and commits exist. Self-check passed.
