---
phase: quick
plan: 006
subsystem: frontend-portfolio-ui
tags: [ux, columns, table]
dependencies:
  requires: []
  provides: [grouped-resource-columns]
  affects: [portfolio-table-layout]
tech-stack:
  added: []
  patterns: [column-reordering]
key-files:
  created: []
  modified:
    - frontend/src/components/portfolio/columns/portfolioColumns.tsx
decisions:
  - Column grouping prioritizes resource/effort metrics (Effort, Impact, Cost) for easier comparison
key-decisions: []
metrics:
  duration: 104
  completed: 2026-02-09
---

# Quick Task 006: Reorder Columns - Effort, Impact, Costs Summary

**One-liner:** Grouped Effort, Impact, and Cost columns together for easier resource metric comparison.

## Overview

Reorganized portfolio table column definitions to place Cost (costTshirt) immediately after Impact, creating a logical grouping of all resource and effort-related metrics. This improves the visual flow when analyzing projects that require comparing team effort, organizational impact, and cost estimates.

## Implementation Details

### Column Definition Reordering

Moved the Cost T-shirt column definition in the `portfolioColumns` array from its position between Committee and Last Activity to immediately after the Impact column. This ensures that when all columns are visible, the three resource-related metrics appear consecutively.

**New column sequence in array:**
- Effort (teams with size T-shirts)
- Impact (change impact teams)
- Cost (cost T-shirt)
- Budget Health (actuals vs budget)

### Default Column Order Update

Updated the `defaultColumnOrder` array to reflect the new logical grouping:

**Before:**
```
..., effort, impact, budgetHealth, committee, pm, isOwner, sponsor, costTshirt, ...
```

**After:**
```
..., effort, impact, costTshirt, budgetHealth, committee, pm, isOwner, sponsor, ...
```

This change affects:
- Initial column rendering order
- Column picker display order
- Drag-and-drop reordering reference

## Testing

### Verification Performed

1. **TypeScript Compilation:** Ran `npx tsc --noEmit` - passed with no errors
2. **File Structure:** Verified column definitions are properly ordered in the array
3. **Export Consistency:** Confirmed `defaultColumnOrder` matches the new logical grouping

### Expected Behavior

When users enable the Effort, Impact, and Cost columns in the column picker, they will appear consecutively in the table, making it easier to compare:
- Team effort sizes (XS through XXL)
- Organizational change impact (number of teams affected)
- Estimated project costs (T-shirt sizing)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 206d06a2 | Reordered columns to group Effort, Impact, and Cost together |

## Files Modified

- `frontend/src/components/portfolio/columns/portfolioColumns.tsx`: Moved costTshirt column definition and updated defaultColumnOrder array

## Impact

**User Experience:**
- Improved visual grouping of resource-related metrics
- Easier comparison when analyzing multiple projects
- More intuitive column picker ordering

**Technical:**
- No breaking changes
- No API modifications
- Column visibility defaults unchanged (these columns still hidden by default per Phase 07 decisions)

## Self-Check

Verifying implementation claims:

- [x] TypeScript compilation passes
- [x] Column definition moved to correct position
- [x] defaultColumnOrder array updated
- [x] Commit exists: 206d06a2
- [x] File modified: frontend/src/components/portfolio/columns/portfolioColumns.tsx

**Self-Check: PASSED**

All changes verified and complete.
