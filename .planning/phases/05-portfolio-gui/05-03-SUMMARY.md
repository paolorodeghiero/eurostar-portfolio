---
phase: 05-portfolio-gui
plan: 03
subsystem: frontend-portfolio-table
tags: [portfolio, table, virtual-scrolling, tanstack-table, tanstack-virtual, performance]

dependencies:
  requires:
    - "05-01: Portfolio table column definitions and useTableState hook"
    - "02-05: Project API and types"
    - "@tanstack/react-table v8 for state management"
    - "@tanstack/react-virtual v3 for virtual scrolling"
  provides:
    - "PortfolioTable component with virtual scrolling"
    - "fetchPortfolioProjects API function with computed fields"
    - "PortfolioProject interface with computed fields"
    - "Multi-column sorting with Shift+click"
    - "Row selection and highlighting"
    - "Density toggle support (comfortable/compact)"
    - "localStorage persistence for table state"
  affects:
    - "05-04: Toolbar components will use table instance methods"
    - "05-05: PortfolioPage will integrate this table"

tech_stack:
  added:
    - "Skeleton component (shadcn/ui pattern)"
  patterns:
    - "TanStack Table v8 with controlled state"
    - "TanStack Virtual v3 with estimateSize and overscan"
    - "Client-side computed fields (temporary until backend endpoint)"
    - "Sticky header with z-index for scroll performance"
    - "Virtual scroll padding rows for smooth scrolling"
    - "Loading skeleton with responsive row count"

key_files:
  created:
    - "frontend/src/components/portfolio/PortfolioTable.tsx"
    - "frontend/src/components/ui/skeleton.tsx"
  modified:
    - "frontend/src/lib/project-api.ts (added PortfolioProject interface and fetchPortfolioProjects)"

decisions:
  - decision: "Client-side computed fields until backend endpoint exists"
    rationale: "Backend /api/projects/portfolio endpoint doesn't exist yet, compute valueScoreAvg and budgetTotal client-side as temporary solution"
    alternatives: ["Wait for backend endpoint", "Create backend endpoint now"]
  - decision: "Skeleton component added during execution"
    rationale: "Required for PortfolioTable loading state, missing from initial shadcn setup"
    alternatives: ["Skip loading skeleton", "Use plain div placeholders"]
  - decision: "Comment out unused tableApi for now"
    rationale: "API methods will be needed by toolbar components in future plans, but cause TypeScript warnings if declared now"
    alternatives: ["Export via forwardRef", "Remove entirely and add later"]

metrics:
  tasks_completed: 2
  files_created: 2
  files_modified: 1
  duration_minutes: 13
  commits: 3
  completed_date: "2026-02-09"
---

# Phase 05 Plan 03: Portfolio Table with Virtual Scrolling Summary

**One-liner:** Core PortfolioTable component with TanStack Table v8 state management, TanStack Virtual v3 for smooth performance, multi-column sorting, row selection, density toggle, and localStorage persistence.

## What Was Built

Created the centerpiece portfolio table component with enterprise-grade performance features:

1. **PortfolioTable Component** - Main table with virtual scrolling
   - TanStack Table v8 for powerful state management
   - TanStack Virtual v3 for rendering performance (handles hundreds of rows)
   - Multi-column sort with Shift+click and numbered indicators
   - Default sort: Project ID descending (newest first)
   - Row selection with highlighted selected row
   - Density toggle: comfortable (53px) / compact (37px)
   - Sticky header stays visible during scroll
   - Loading skeleton and empty state handling

2. **Portfolio API Extension** - Computed fields for table display
   - PortfolioProject interface extending Project
   - fetchPortfolioProjects with client-side computation
   - Calculates valueScoreAvg from project values
   - Calculates budgetTotal from OPEX + CAPEX
   - TODO comment for future backend endpoint optimization

3. **Skeleton Component** - Loading state UI primitive
   - shadcn/ui pattern with animate-pulse
   - Used by TableLoadingSkeleton for responsive loading display

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Extend project-api.ts with portfolio fetch | e9ab4987 | project-api.ts |
| 2 | Create PortfolioTable with virtual scrolling | 03bc65d7 | PortfolioTable.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing skeleton component**
- **Found during:** Task 2 (PortfolioTable creation)
- **Issue:** Skeleton component required for TableLoadingSkeleton didn't exist in shadcn/ui setup
- **Fix:** Created skeleton.tsx using shadcn/ui pattern with animate-pulse and bg-muted styling
- **Files created:** frontend/src/components/ui/skeleton.tsx
- **Commit:** 04721991
- **Rationale:** Cannot complete PortfolioTable without skeleton for loading state (blocking issue per Rule 3)

## Implementation Highlights

### PortfolioTable Architecture

**State Management:**
- Persisted via useTableState: sorting, columnVisibility, columnOrder, density
- Non-persisted (reset on refresh): columnFilters, globalFilter, rowSelection
- Default sort: `[{ id: 'projectId', desc: true }]` (newest first)

**Virtual Scrolling:**
```typescript
const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => rowHeight, // 53px comfortable, 37px compact
  overscan: 10, // Buffer rows for smooth scrolling
});
```

**Multi-Column Sort:**
- Click header: primary sort
- Shift+click header: add secondary sort
- Numbered indicators show sort priority (1, 2, 3...)
- enableMultiSort: true in table config
- enableSortingRemoval: false (always maintain sort direction)

**Row Selection:**
- Click row: calls onRowClick callback
- Selected row highlighted with bg-primary/10
- Checkbox column for multi-select (infrastructure ready, UI will use in future)

**Performance Features:**
- Sticky header (z-10) stays visible during scroll
- Virtual scroll padding rows for smooth infinite scroll
- useMemo for columns and data to prevent infinite re-renders
- getRowId using stable project.id for row identity

### Computed Fields Pattern

Client-side computation (temporary):
```typescript
// Calculate value score average
const values = project.values || [];
const valueScoreAvg = values.length > 0
  ? values.reduce((sum, v) => sum + v.score, 0) / values.length
  : null;

// Calculate budget total
const opex = project.opexBudget ? parseFloat(project.opexBudget) : 0;
const capex = project.capexBudget ? parseFloat(project.capexBudget) : 0;
const budgetTotal = opex + capex > 0 ? opex + capex : null;
```

TODO: Backend should provide `/api/projects/portfolio` endpoint with pre-computed fields for better performance at scale.

### Loading States

**Skeleton:** Shows when `loading && data.length === 0`
- Responsive row count: 20 rows (compact) / 12 rows (comfortable)
- Column count capped at 10 for performance

**Empty State:** Shows when `!loading && data.length === 0`
- Friendly message encouraging project creation

## Verification Results

All success criteria met:

✅ PortfolioTable component renders with virtual scrolling
✅ Multi-column sort with Shift+click and numbered indicators
✅ Default sort is Project ID descending (newest first)
✅ Row click triggers onRowClick callback
✅ Selected row is highlighted (bg-primary/10)
✅ Row density changes row heights (comfortable: 53px, compact: 37px)
✅ Sorting state persists to localStorage via useTableState
✅ Loading skeleton and empty state display correctly
✅ TypeScript compiles without errors
✅ Frontend build succeeds (2m 29s)

## Self-Check

**Files created:**
```
FOUND: frontend/src/components/portfolio/PortfolioTable.tsx
FOUND: frontend/src/components/ui/skeleton.tsx
```

**Files modified:**
```
FOUND: frontend/src/lib/project-api.ts
```

**Commits exist:**
```
FOUND: e9ab4987 (Task 1: portfolio API extension)
FOUND: 04721991 (Deviation: skeleton component)
FOUND: 03bc65d7 (Task 2: PortfolioTable component)
```

## Self-Check: PASSED

All claimed files exist and all commits are present in git history.

## Next Steps

**Plan 05-04** will create the toolbar components:
- Global search input
- Status and team dropdown filters
- Column visibility toggle
- Density toggle button
- Bulk actions for selected rows

**Plan 05-05** will integrate PortfolioTable into PortfolioPage:
- Layout with header, toolbar, table, and sidebar
- Connect data fetching with React Query
- Row click handler to show project sidebar
- Loading and error states

## Notes for Future Plans

**Backend Optimization:**
- Create `/api/projects/portfolio` endpoint to compute valueScoreAvg, budgetTotal, actualsTotal server-side
- Aggregate data at database level for better performance with large datasets
- Include committeeState, committeeLevel, costTshirt fields in response

**Table API Methods:**
- Currently commented out to avoid TypeScript warnings
- Will be exposed via ref or context in Plan 05-04 for toolbar integration
- Methods needed: setGlobalFilter, setColumnFilters, setColumnVisibility, setDensity

**Performance at Scale:**
- Virtual scrolling handles 100s of rows smoothly
- For 1000s of rows, consider server-side pagination
- Current client-side computation acceptable for typical portfolio size (50-200 projects)
