---
phase: quick
plan: 007
subsystem: portfolio-ui
tags: [ux, column-management, state-reset]
dependency_graph:
  requires: []
  provides: [column-order-reset-button]
  affects: [portfolio-table-toolbar]
tech_stack:
  added: []
  patterns: [conditional-rendering, state-comparison]
key_files:
  created: []
  modified:
    - frontend/src/components/portfolio/ColumnPicker.tsx
    - frontend/src/components/portfolio/PortfolioToolbar.tsx
    - frontend/src/pages/portfolio/PortfolioPage.tsx
decisions: []
metrics:
  duration: 5
  completed: 2026-02-09
---

# Quick Task 007: Reset Column Order Button

**One-liner:** Added conditional reset button in ColumnPicker that restores default column ordering when user has reordered columns.

## Overview

Added a reset column order button (RotateCcw icon) next to the column visibility picker in the portfolio toolbar. The button only appears when the current column order differs from the default, providing a quick way to restore the original column layout after drag-and-drop reordering.

## What Was Built

### Task 1: Add reset column order functionality to ColumnPicker
**Status:** Complete
**Commit:** a8cbd587

Updated ColumnPicker component to:
- Import `defaultColumnOrder` and `RotateCcw` icon
- Accept optional `columnOrder` and `onResetColumnOrder` props
- Compare current order with default using JSON.stringify
- Conditionally render ghost button (h-8 w-8 p-0) when order differs
- Wrap button and column picker in flex container

Updated PortfolioToolbar to:
- Accept `columnOrder` and `onResetColumnOrder` props
- Pass these props to ColumnPicker component

**Files modified:**
- frontend/src/components/portfolio/ColumnPicker.tsx
- frontend/src/components/portfolio/PortfolioToolbar.tsx

### Task 2: Wire up reset functionality in PortfolioPage
**Status:** Complete
**Commit:** 25272a77

Connected reset functionality in PortfolioPage:
- PortfolioPage already managed `columnOrder` state via useTableState hook
- Passed `columnOrder` state to PortfolioToolbar
- Passed reset callback: `() => setColumnOrder(defaultColumnOrder)`
- State automatically persists to localStorage via existing hook

**Files modified:**
- frontend/src/pages/portfolio/PortfolioPage.tsx

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Pattern: Conditional UI Based on State Comparison

The reset button uses JSON.stringify for simple array equality check:
```typescript
const hasCustomOrder = columnOrder && JSON.stringify(columnOrder) !== JSON.stringify(defaultColumnOrder);
```

This is acceptable for column order arrays (small, no deep nesting). For more complex objects, would need deep equality library.

### State Flow

1. User drags column headers → `setColumnOrder` updates state
2. useTableState hook persists to localStorage
3. ColumnPicker receives current order via props
4. Compares with defaultColumnOrder → shows/hides reset button
5. User clicks reset → parent calls `setColumnOrder(defaultColumnOrder)`
6. Button disappears (order matches default again)

### Styling Consistency

Reset button matches existing toolbar button patterns:
- `variant="ghost"` for secondary action
- `size="sm"` with `h-8` for toolbar alignment
- `w-8 p-0` for icon-only square button
- Title attribute for tooltip on hover

## Verification

- TypeScript compiles without errors
- Reset button appears in toolbar next to column picker
- Button only visible when column order differs from default
- Clicking reset restores defaultColumnOrder
- State persists correctly to localStorage via useTableState

## Success Criteria Met

- [x] Reset button appears only when column order has been modified
- [x] Clicking reset restores columns to defaultColumnOrder
- [x] State persists correctly to localStorage
- [x] Button uses consistent styling (ghost variant, RotateCcw icon)

## Self-Check

Verifying modified files and commits:

**Modified files:**
- FOUND: frontend/src/components/portfolio/ColumnPicker.tsx
- FOUND: frontend/src/components/portfolio/PortfolioToolbar.tsx
- FOUND: frontend/src/pages/portfolio/PortfolioPage.tsx

**Commits:**
- FOUND: a8cbd587 (feat(quick-007): add reset column order button to ColumnPicker)
- FOUND: 25272a77 (feat(quick-007): wire reset column order to PortfolioPage)

## Self-Check: PASSED

All files modified as expected and all commits exist in git history.
