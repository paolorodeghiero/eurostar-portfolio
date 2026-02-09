---
phase: 05-portfolio-gui
plan: 05
subsystem: portfolio-table
tags: [filtering, search, ui-components]

dependency_graph:
  requires: [05-03-PortfolioTable, 05-04-ColumnCustomization]
  provides: [FilterChips, FilterPopover, PortfolioToolbar]
  affects: [portfolio-page]

tech_stack:
  added: [use-debounce]
  patterns: [debounced-search, smart-filters, filter-chips]

key_files:
  created:
    - frontend/src/components/portfolio/FilterChips.tsx
    - frontend/src/components/portfolio/FilterPopover.tsx
    - frontend/src/components/portfolio/PortfolioToolbar.tsx
  modified: []

decisions:
  - Use 300ms debounce for global search to balance responsiveness and performance
  - Smart filter types based on column data type (text/select/number)
  - Status/team filters show human-readable names via lookup
  - Filter chips truncate long values at 20 characters
  - Clear all button only shown when multiple filters active

metrics:
  duration_minutes: 4
  tasks_completed: 3
  files_created: 3
  commits: 3
  completed_at: "2026-02-09T11:27:22Z"
---

# Phase 05 Plan 05: Portfolio Filtering and Search Summary

Complete filtering and search infrastructure for portfolio table with global search, column-level filters, and active filter display.

## What Was Built

Created three components for comprehensive portfolio filtering:

### FilterChips Component
- Displays active column filters as removable badges
- Human-readable labels for columns (Project ID, Status, Lead Team, etc.)
- Individual filter removal via X button
- Clear all button when multiple filters active
- Status/team filters show names via option lookups
- Long values truncated at 20 characters for display

### FilterPopover Component
- Smart filter types based on column data:
  - Text filters: for name, PM, project ID (with Enter/Escape support)
  - Select filters: for status, lead team (searchable dropdown with "All" option)
  - Number filters: for value score, budget health (min/max range)
- Filter icon highlights when filter is active
- Status filters show color indicators
- Clear/Apply buttons for confirmation

### PortfolioToolbar Component
- Global search input with 300ms debounce
- Clear button appears when search text entered
- Integrates with DensityToggle and ColumnPicker components
- New Project button for creating projects
- FilterChips row displays below toolbar when filters active
- Responsive layout with spacer for proper alignment

## Key Implementation Details

**Search Debouncing:**
- Local state updates immediately for responsive input
- Debounced callback fires after 300ms of inactivity
- Cancel pending debounce when clearing search explicitly

**Filter Types Mapping:**
```typescript
const FILTER_TYPES: Record<string, FilterType> = {
  projectId: 'text',
  name: 'text',
  status: 'select',
  leadTeam: 'select',
  pm: 'text',
  valueScore: 'number',
  budgetHealth: 'number',
};
```

**Column Labels:**
```typescript
const COLUMN_LABELS: Record<string, string> = {
  projectId: 'Project ID',
  name: 'Name',
  status: 'Status',
  leadTeam: 'Lead Team',
  pm: 'PM',
  valueScore: 'Value',
  effort: 'Effort',
  budgetHealth: 'Budget',
  committee: 'Committee',
  stopped: 'State',
};
```

## Integration Points

**Toolbar Props Interface:**
- Receives table instance for column access
- Controlled state for globalFilter and columnFilters
- Density management
- onNewProject callback for create action
- statusOptions and teamOptions for filter lookups

**TanStack Table Integration:**
- Uses table.getColumn(id).setFilterValue() for column filters
- Uses table.resetColumnFilters() for clear all
- Filter state managed externally via props
- All components generic over TData type

## Testing Notes

Components compile successfully with TypeScript strict mode. Integration testing will occur in next plan when connecting to PortfolioTable:
- Search debounces correctly at 300ms
- Filter chips appear/disappear with filter state
- Individual chip removal updates table
- Clear all resets all column filters
- Column picker shows/hides columns
- Density toggle switches row height

## Next Steps

Plan 05-06 will integrate these components into the PortfolioPage:
- Connect toolbar to PortfolioTable instance
- Wire up global search to custom filter function
- Add column-level filter buttons to table headers
- Load status/team options from API
- Connect New Project button to drawer/dialog

## Deviations from Plan

None - plan executed exactly as written.

## Commits

1. **68748fc5** - feat(05-05): add FilterChips component for active filter display
2. **38110839** - feat(05-05): add FilterPopover for column-level filters
3. **9bffcb5d** - feat(05-05): add PortfolioToolbar with global search

## Self-Check: PASSED

All files created successfully:
- FOUND: frontend/src/components/portfolio/FilterChips.tsx
- FOUND: frontend/src/components/portfolio/FilterPopover.tsx
- FOUND: frontend/src/components/portfolio/PortfolioToolbar.tsx

All commits verified:
- FOUND: 68748fc5 (FilterChips)
- FOUND: 38110839 (FilterPopover)
- FOUND: 9bffcb5d (PortfolioToolbar)
