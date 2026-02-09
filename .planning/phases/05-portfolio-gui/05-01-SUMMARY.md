---
phase: 05-portfolio-gui
plan: 01
subsystem: frontend-portfolio-table
tags: [portfolio, table-columns, visualization, tanstack-table, dnd-kit]

dependencies:
  requires:
    - "02-05: Project API and types (Project interface)"
    - "02-07: TeamChip component for effort display"
    - "02-08: ScoreDots pattern from ValueScoreCard"
  provides:
    - "useTableState hook for localStorage-persisted table state"
    - "Portfolio table column definitions with mini-visualizations"
    - "BudgetHealthCell: progress bar for budget health"
    - "ValueScoreCell: 5 dots for value scores"
    - "EffortCell: team chips with T-shirt sizes"
    - "CommitteeCell: step indicator for workflow"
    - "Checkbox component for row selection"
  affects:
    - "05-02: PortfolioTable will use these column definitions"
    - "05-03: Filter/sort components will reference column IDs"

tech_stack:
  added:
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - "@radix-ui/react-checkbox (for checkbox component)"
  patterns:
    - "localStorage persistence with error handling"
    - "TanStack Table v8 column definitions"
    - "Mini-visualization cells for data-dense table"
    - "shadcn/ui checkbox pattern"

key_files:
  created:
    - "frontend/src/hooks/useTableState.ts"
    - "frontend/src/components/portfolio/columns/portfolioColumns.tsx"
    - "frontend/src/components/portfolio/columns/BudgetHealthCell.tsx"
    - "frontend/src/components/portfolio/columns/ValueScoreCell.tsx"
    - "frontend/src/components/portfolio/columns/EffortCell.tsx"
    - "frontend/src/components/portfolio/columns/CommitteeCell.tsx"
    - "frontend/src/components/ui/checkbox.tsx"
  modified:
    - "frontend/package.json (added dependencies)"

decisions:
  - decision: "Use @dnd-kit instead of react-beautiful-dnd"
    rationale: "react-beautiful-dnd is deprecated, dnd-kit is actively maintained"
    alternatives: ["react-beautiful-dnd (deprecated)", "react-dnd (more complex)"]
  - decision: "Generic useTableState hook with localStorage persistence"
    rationale: "Reusable across any table, graceful error handling for QuotaExceededError"
    alternatives: ["Inline localStorage calls", "Redux/Zustand global state"]
  - decision: "Mini-visualization cells for data density"
    rationale: "Linear/Notion-style compact display, visual scanning efficiency"
    alternatives: ["Plain text only", "Full-size visualizations"]
  - decision: "Checkbox component added during execution"
    rationale: "Required for table row selection, missing from initial shadcn setup"
    alternatives: ["Wait for next plan", "Use native HTML checkbox"]

metrics:
  tasks_completed: 4
  files_created: 7
  files_modified: 2
  duration_minutes: 7
  commits: 5
  completed_date: "2026-02-09"
---

# Phase 05 Plan 01: Portfolio Table Columns and State Summary

**One-liner:** TanStack Table column definitions with mini-visualizations (progress bars, dots, chips, step indicators) and localStorage-persisted table state hook with dnd-kit for column reordering.

## What Was Built

Created the foundation for the portfolio table with complete column definitions and visualization components:

1. **useTableState Hook** - Generic localStorage persistence with error handling
2. **Column Definitions** - 11 columns with proper accessors, filters, and sorting
3. **Mini-Visualization Cells:**
   - BudgetHealthCell: Progress bar with color-coded health (green < 90%, orange 90-100%, red > 100%)
   - ValueScoreCell: 5 dots display matching ScoreDots pattern
   - EffortCell: Team chips (max 3 visible) with T-shirt sizes
   - CommitteeCell: Step indicator for workflow states
4. **dnd-kit Installation** - For future column drag-and-drop reordering
5. **Checkbox Component** - Added during execution for row selection

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Install dnd-kit dependencies | 5dfd5854 | package.json, package-lock.json |
| 2 | Create useTableState hook | 4cd1e8cb | useTableState.ts |
| 3 | Create mini-visualization cells | d251a545 | BudgetHealthCell.tsx, ValueScoreCell.tsx, EffortCell.tsx, CommitteeCell.tsx |
| 4 | Create portfolioColumns definitions | ea43c606 | portfolioColumns.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing checkbox component**
- **Found during:** Task 4 (portfolioColumns creation)
- **Issue:** Checkbox component required for row selection didn't exist in shadcn/ui setup
- **Fix:** Created checkbox.tsx using shadcn/ui pattern with @radix-ui/react-checkbox primitive
- **Files created:** frontend/src/components/ui/checkbox.tsx
- **Dependency added:** @radix-ui/react-checkbox
- **Commit:** ee35ccb0
- **Rationale:** Cannot complete portfolioColumns without checkbox component (blocking issue per Rule 3)

**2. [Rule 1 - Bug] Fixed TypeScript type errors in column definitions**
- **Found during:** Task 4 TypeScript compilation
- **Issue:** `ColumnDef<PortfolioProject, unknown>[]` type too strict, causing type mismatches
- **Fix:** Changed to `ColumnDef<PortfolioProject, any>[]` and added null coalescing for committee cell
- **Files modified:** portfolioColumns.tsx
- **Commit:** ea43c606 (same as Task 4)
- **Rationale:** Type error prevented compilation (Rule 1 auto-fix)

## Implementation Highlights

### useTableState Hook
```typescript
// Generic, reusable, error-safe localStorage persistence
export function useTableState<T>(key: string, initialState: T): [T, (state: T | ((prev: T) => T)) => void]
```
- Same signature as useState for drop-in replacement
- Try/catch for QuotaExceededError and private browsing
- Supports function updates
- Console warnings instead of crashes

### Column Definitions Architecture
- **PortfolioProject interface** extends Project with computed fields (valueScoreAvg, budgetTotal, actualsTotal, committeeState, committeeLevel)
- **11 columns total:** select, projectId, name, status, leadTeam, pm, valueScore, effort, budgetHealth, committee, stopped
- **Custom filterFn** for status and leadTeam (dropdown filter compatibility)
- **Custom sortingFn** for budgetHealth (sort by percentage)
- **Size hints** for virtual scroll estimations
- **defaultColumnVisibility** hides 'stopped' column by default
- **defaultColumnOrder** array for dnd-kit integration

### Mini-Visualization Patterns
- **Budget Health:** Progress bar capped at 100% width, percentage display outside
- **Value Score:** 5 dots (filled/empty) matching existing ScoreDots pattern
- **Effort:** TeamChip reuse with "+N more" overflow indicator
- **Committee:** Step indicator with checkmarks for completed states, special rejected styling

## Verification Results

✅ All verification criteria met:
- @dnd-kit/core and @dnd-kit/sortable installed and listed in package.json
- TypeScript compiles without errors
- All 6 required files created and exist
- useTableState exports correctly
- All 4 cell components export correctly
- portfolioColumns exports 3 constants: portfolioColumns, defaultColumnVisibility, defaultColumnOrder

## Self-Check

**Files created:**
```bash
FOUND: frontend/src/hooks/useTableState.ts
FOUND: frontend/src/components/portfolio/columns/portfolioColumns.tsx
FOUND: frontend/src/components/portfolio/columns/BudgetHealthCell.tsx
FOUND: frontend/src/components/portfolio/columns/ValueScoreCell.tsx
FOUND: frontend/src/components/portfolio/columns/EffortCell.tsx
FOUND: frontend/src/components/portfolio/columns/CommitteeCell.tsx
FOUND: frontend/src/components/ui/checkbox.tsx
```

**Commits exist:**
```bash
FOUND: 5dfd5854 (Task 1: dnd-kit install)
FOUND: 4cd1e8cb (Task 2: useTableState)
FOUND: d251a545 (Task 3: cell components)
FOUND: ee35ccb0 (Deviation: checkbox)
FOUND: ea43c606 (Task 4: portfolioColumns)
```

## Self-Check: PASSED

All claimed files exist and all commits are present in git history.

## Next Steps

Plan 05-02 will create the PortfolioTable component that uses these column definitions, integrates useTableState for persistence, and implements virtual scrolling with @tanstack/react-virtual.

## Notes for Future Plans

- **PortfolioProject interface** may need backend endpoint updates to return computed fields (valueScoreAvg, budgetTotal, actualsTotal, committeeState, committeeLevel)
- **Checkbox component** now available for use in other components
- **useTableState** is generic and can be reused for any localStorage-persisted state
- **Column IDs** for filter components: 'status', 'leadTeam', 'pm', 'valueScore', 'effort', 'budgetHealth', 'committee'
- **dnd-kit** installed but not yet used - will be integrated in column reordering feature
