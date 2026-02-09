# Phase 05: Portfolio GUI - Research

**Researched:** 2026-02-09
**Domain:** React data table with advanced filtering, sorting, virtualization, and sidebar integration
**Confidence:** HIGH

## Summary

Phase 5 builds a production-quality portfolio table using TanStack Table v8 with TanStack Virtual v3 for performance, supporting configurable columns, multi-column sorting, smart filtering, and integrated sidebar editing. The implementation leverages existing shadcn/ui components, established patterns from Phases 1-4, and follows industry-standard table UI patterns popularized by Linear, Notion, and Material Design.

**Primary recommendation:** Build a memoized, virtualized table with localStorage-persisted state using TanStack Table v8's built-in features (column visibility, ordering, filtering, sorting, row selection). Integrate existing ProjectSidebar with Sheet component customized to 50% width. Avoid hand-rolling drag-and-drop, date pickers, or filter UI patterns—use proven community solutions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Table layout & columns:**
- Default view: full (8-10 columns) — ProjectId, Name, Status, Lead Team, PM, Value Score, Effort, Budget Health, Committee, Actuals
- Aggregate indicators use mini visualizations in cells (not text/badges)
  - Budget health: thin horizontal progress bar (green/orange/red matching existing thresholds)
  - Value score: 5 filled/empty dots (reuse existing score dots pattern)
  - Effort: team tags with T-shirt badges (reuse existing TeamChip)
  - Committee: step indicator
- Column show/hide via column picker dropdown button
- Column reorder via drag-and-drop on headers, persisted to localStorage
- Row density toggle: comfortable (~15 rows visible) and compact (~25 rows visible), user switchable
- Checkbox selection on rows for bulk actions (export, status change)
- Virtual scroll for smooth performance (no pagination)

**Filtering & search:**
- Global search bar in top bar area, searches ALL text fields and categories
- Live filtering as you type with ~300ms debounce
- Column-level filters via click on column header (opens filter popover)
- Smart filter types per column: dropdown for status/team, text input for name, date range presets for dates, numeric range for budget
- Date filter presets: "This month", "This quarter", "Overdue", plus custom range
- Active filters displayed as removable chips above table
- Row count shown at top of table near search/filter area

**Sorting:**
- Multi-column sort: Shift+click to add secondary sort columns, with numbered indicators
- Default sort: Project ID descending (newest first)
- Sort/filter state persisted to localStorage across sessions

**Sidebar behavior:**
- Sidebar takes full right half of screen (50% width)
- Slides in from right with smooth animation
- Clicking different table row while sidebar is open instantly switches to that project
- Tab order: fixed as built
- Auto-save with existing 2500ms debounce
- No keyboard shortcuts

**Top bar & navigation:**
- Minimal top bar: Eurostar logo, Upload Actuals button, Alerts bell dropdown, Admin link, User identity
- Teal background (#006B6B) with white text/icons
- Sticky (fixed at top when table scrolls)
- Logo links to portfolio home (/)
- Admin link/icon navigates to /admin
- User identity: initials circle + name from EntraID token
- "New Project" button lives above the table (not in top bar), opens modal dialog with essential fields, then opens sidebar for full editing
- Upload Actuals stays in top bar

### Claude's Discretion

- Exact animation timing and easing for sidebar
- Loading skeleton design for table
- Error states and empty table state messaging
- Bulk action UI for checkbox selection
- Exact column picker dropdown design
- Row hover/highlight styling

### Deferred Ideas (OUT OF SCOPE)

- Saved filter presets — future enhancement
- Keyboard shortcuts for sidebar navigation — not needed for v1
- Export to Excel from portfolio table — consider for Phase 6 or quick task
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | 8.21.3 | Table state management, sorting, filtering | Industry standard for headless tables, already installed and used in admin DataTable |
| @tanstack/react-virtual | 3.13.18 | Virtual scrolling for performance | Official TanStack solution for virtualizing rows, already installed |
| use-debounce | 10.1.0 | Debounce search input | Lightweight, simple API, already used in useAutoSave hook |
| lucide-react | 0.563.0 | Icons | Already used throughout project, consistent icon library |
| @radix-ui/react-popover | 1.1.15 | Filter popovers on column headers | Already installed, shadcn/ui primitive |
| @radix-ui/react-dialog | 1.1.15 | New Project modal, Sheet for sidebar | Already installed and used in ProjectSidebar |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/core | 6.x (install) | Drag-and-drop column reordering | Recommended by TanStack Table docs, modern hooks-based DnD library |
| @dnd-kit/sortable | 8.x (install) | Sortable list utilities for columns | Works with @dnd-kit/core for column reordering |
| cmdk | 1.1.1 | Command menu for filter dropdowns | Already installed, used in Command component for filterable lists |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | react-beautiful-dnd | react-beautiful-dnd is in maintenance mode, @dnd-kit is more actively maintained and lighter |
| TanStack Virtual | react-window | react-window is simpler but less flexible, TanStack Virtual integrates better with TanStack Table |
| use-debounce | lodash.debounce | use-debounce is hooks-based and lighter, lodash adds unnecessary weight |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── pages/
│   └── PortfolioPage.tsx          # Main portfolio view (home route)
├── components/
│   ├── portfolio/
│   │   ├── PortfolioTable.tsx     # Main table component
│   │   ├── PortfolioToolbar.tsx   # Search, filters, new project button
│   │   ├── PortfolioHeader.tsx    # Top teal bar with alerts, upload, admin, user
│   │   ├── ColumnPicker.tsx       # Show/hide columns dropdown
│   │   ├── FilterChips.tsx        # Active filter badges
│   │   ├── DensityToggle.tsx      # Comfortable/compact toggle
│   │   ├── BulkActionsToolbar.tsx # Floating toolbar when rows selected
│   │   └── columns/
│   │       ├── portfolioColumns.tsx    # Column definitions
│   │       ├── BudgetHealthCell.tsx    # Mini progress bar
│   │       ├── ValueScoreCell.tsx      # 5 dots display
│   │       ├── EffortCell.tsx          # Team chips with T-shirts
│   │       └── CommitteeCell.tsx       # Step indicator
│   ├── projects/
│   │   └── ProjectSidebar.tsx     # Existing, customize Sheet width
│   └── ui/
│       └── skeleton.tsx           # Already exists
└── hooks/
    ├── useTableState.ts           # localStorage persistence for table state
    └── usePortfolioFilters.ts     # Column-level filter logic
```

### Pattern 1: Memoized Table with TanStack Table v8
**What:** Use useMemo for columns and data arrays to prevent infinite re-renders
**When to use:** Always in TanStack Table implementations
**Example:**
```typescript
// Source: TanStack Table FAQ - https://tanstack.com/table/latest/docs/faq
import { useMemo } from 'react';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

function PortfolioTable({ projects }: { projects: Project[] }) {
  // CRITICAL: Memoize columns and data to avoid infinite loops
  const columns = useMemo(() => portfolioColumns, []);
  const data = useMemo(() => projects, [projects]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // ... other options
  });

  // ...
}
```

### Pattern 2: Virtual Scrolling Integration
**What:** Combine TanStack Virtual's useVirtualizer with TanStack Table for smooth performance with 100+ rows
**When to use:** When table has >50 rows or user expects instant response with large datasets
**Example:**
```typescript
// Source: TanStack Virtual docs - https://tanstack.com/virtual/v3/docs/framework/react/examples/table
import { useVirtualizer } from '@tanstack/react-virtual';

function PortfolioTable() {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, // Comfortable density: 53px, Compact: 37px
    overscan: 10, // Buffer rows for smooth scrolling
  });

  return (
    <div ref={tableContainerRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Row cells */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Pattern 3: Column Visibility with Dropdown Picker
**What:** Use TanStack Table's columnVisibility state with a command menu dropdown
**When to use:** When users need to show/hide columns
**Example:**
```typescript
// Source: shadcn/ui Data Table - https://ui.shadcn.com/docs/components/radix/data-table
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({});

const table = useReactTable({
  // ...
  state: { columnVisibility },
  onColumnVisibilityChange: setColumnVisibility,
});

function ColumnPicker() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Columns</Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandGroup>
            {table.getAllLeafColumns().map((column) => (
              <CommandItem
                key={column.id}
                onSelect={() => column.toggleVisibility()}
              >
                <Checkbox checked={column.getIsVisible()} />
                {column.id}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### Pattern 4: Column Reordering with dnd-kit
**What:** Use @dnd-kit/sortable for drag-and-drop column reordering, update TanStack Table's columnOrder state
**When to use:** User-customizable column order
**Example:**
```typescript
// Source: TanStack Table Column Ordering Guide - https://tanstack.com/table/latest/docs/guide/column-ordering
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

const [columnOrder, setColumnOrder] = useState<string[]>(
  columns.map(c => c.id)
);

const table = useReactTable({
  // ...
  state: { columnOrder },
  onColumnOrderChange: setColumnOrder,
});

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const oldIndex = columnOrder.indexOf(active.id as string);
    const newIndex = columnOrder.indexOf(over.id as string);
    const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
    setColumnOrder(newOrder);
  }
}

return (
  <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
      {/* Table headers */}
    </SortableContext>
  </DndContext>
);
```

### Pattern 5: Multi-Column Sort with Shift+Click
**What:** Industry-standard Shift+Click for adding secondary sort columns
**When to use:** Always for multi-column sorting
**Example:**
```typescript
// Source: Material React Table - https://www.material-react-table.com/docs/guides/sorting
const [sorting, setSorting] = useState<SortingState>([
  { id: 'id', desc: true } // Default: Project ID descending
]);

const table = useReactTable({
  // ...
  state: { sorting },
  onSortingChange: setSorting,
  enableMultiSort: true,
  enableSortingRemoval: false, // Prevent unsorted state
});

function SortableHeader({ column }: { column: Column }) {
  const sortIndex = sorting.findIndex(s => s.id === column.id);

  return (
    <button onClick={(e) => column.toggleSorting(undefined, e.shiftKey)}>
      {column.id}
      {sortIndex >= 0 && <span>{sortIndex + 1}</span>}
      <ArrowUpDown />
    </button>
  );
}
```

### Pattern 6: localStorage State Persistence
**What:** Custom hook to persist table state (sort, filter, column visibility, column order) to localStorage
**When to use:** When users expect their preferences to persist across sessions
**Example:**
```typescript
// Custom hook pattern
function useTableState<T>(key: string, initialState: T): [T, (state: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialState;
    } catch {
      return initialState;
    }
  });

  const updateState = useCallback((newState: T) => {
    setState(newState);
    try {
      localStorage.setItem(key, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save table state:', error);
    }
  }, [key]);

  return [state, updateState];
}

// Usage
const [columnVisibility, setColumnVisibility] = useTableState('portfolio-columns', {});
const [columnOrder, setColumnOrder] = useTableState('portfolio-order', defaultColumnIds);
const [sorting, setSorting] = useTableState('portfolio-sort', [{ id: 'id', desc: true }]);
```

### Pattern 7: Debounced Global Search
**What:** Use use-debounce library with 300ms delay for live search
**When to use:** Search inputs that filter large datasets
**Example:**
```typescript
// Source: use-debounce library - already used in project
import { useDebouncedCallback } from 'use-debounce';

const [globalFilter, setGlobalFilter] = useState('');

const debouncedSetGlobalFilter = useDebouncedCallback(
  (value: string) => {
    setGlobalFilter(value);
  },
  300 // 300ms debounce - industry standard for search
);

return (
  <Input
    placeholder="Search projects..."
    onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
  />
);
```

### Pattern 8: Bulk Selection Toolbar
**What:** Floating toolbar that appears when rows are selected
**When to use:** Bulk actions (export, status change, delete)
**Example:**
```typescript
// Source: shadcn/ui bulk actions block - https://www.shadcn.io/blocks/tables-bulk-actions
const [rowSelection, setRowSelection] = useState<RowSelection>({});

const table = useReactTable({
  // ...
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  enableRowSelection: true,
});

const selectedCount = Object.keys(rowSelection).length;

return (
  <>
    {selectedCount > 0 && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-2 flex items-center gap-4">
        <span>{selectedCount} selected</span>
        <Button size="sm" variant="secondary">Export</Button>
        <Button size="sm" variant="secondary">Change Status</Button>
        <Button size="sm" variant="destructive">Delete</Button>
      </div>
    )}
  </>
);
```

### Pattern 9: Custom Sheet Width for Sidebar
**What:** Override shadcn Sheet width to 50% using Tailwind classes
**When to use:** Sidebar needs to be wider than default Sheet size
**Example:**
```typescript
// Source: shadcn Sheet customization - https://ui.shadcn.com/docs/components/radix/sheet
import { Sheet, SheetContent } from '@/components/ui/sheet';

<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="right" className="w-[50vw] sm:max-w-none">
    <ProjectSidebar projectId={selectedProjectId} />
  </SheetContent>
</Sheet>
```

### Anti-Patterns to Avoid

- **Defining columns inside component body:** Causes infinite re-renders. Always use useMemo.
- **Mutating data in place:** Breaks React's change detection. Use immutable updates.
- **Over-virtualizing:** Don't virtualize tables with <50 rows or <12 columns—adds overhead for no benefit.
- **Storing sensitive data in localStorage:** Never store tokens or sensitive data—localStorage is vulnerable to XSS. Only store UI preferences.
- **Ignoring loading states:** Always show skeleton or spinner while fetching data.
- **Manual drag-and-drop implementation:** Use @dnd-kit instead—handles edge cases, accessibility, touch events.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop column reordering | Custom drag listeners, position tracking | @dnd-kit/core + @dnd-kit/sortable | Handles touch events, accessibility, edge cases, keyboard support, drop zones, collision detection |
| Virtual scrolling | Manual scroll position calculation, DOM manipulation | @tanstack/react-virtual | Handles variable row heights, horizontal scroll, overscan, scroll restoration, resize observers |
| Date range picker with presets | Custom calendar UI, date parsing | date-range-picker-for-shadcn community component | Includes "This month", "This quarter", calendar selection, text input, date comparison mode |
| Column-level filter UI | Custom popover logic, filter state management | TanStack Table's getFilteredRowModel + shadcn Popover/Command | Handles filter functions, multiple filter modes, filter state, UI primitives |
| Debounced search | Custom setTimeout/clearTimeout logic | use-debounce library | Handles cleanup, React lifecycle, cancellation, memory leaks |
| Table state persistence | Manual localStorage read/write, JSON serialization | Custom useTableState hook with error handling | Handles parse errors, storage quota, private browsing mode, serialization edge cases |

**Key insight:** Tables with advanced features have 100+ edge cases (keyboard nav, accessibility, touch events, loading states, error states, empty states, responsive behavior, performance optimization). TanStack Table + ecosystem handles these—don't rebuild.

## Common Pitfalls

### Pitfall 1: Infinite Re-renders from Non-Memoized Columns
**What goes wrong:** Defining columns array inside component body causes useReactTable to see "new" columns on every render, triggering infinite loop
**Why it happens:** TanStack Table uses columns as a dependency—reference changes cause re-initialization
**How to avoid:** Always wrap columns and data with useMemo
**Warning signs:** Browser freezes, React devtools shows hundreds of renders per second, console warnings about max update depth

### Pitfall 2: State Loss During Virtual Scrolling
**What goes wrong:** Form inputs lose values when rows scroll out of view and are unmounted
**Why it happens:** Virtual scrolling unmounts invisible rows—local component state is destroyed
**How to avoid:** Lift all state up to parent or external store (React Context, Zustand). Never store row data in row components.
**Warning signs:** User types in cell, scrolls away, scrolls back—value is gone

### Pitfall 3: localStorage Quota Exceeded
**What goes wrong:** Storing too much data in localStorage throws QuotaExceededError, breaking app
**Why it happens:** localStorage has 5-10MB limit, JSON.stringify can create large strings
**How to avoid:**
  - Only store UI preferences (column visibility, order, sort, filter), not data
  - Wrap localStorage.setItem in try/catch
  - Implement fallback to in-memory state
**Warning signs:** App works in development (small dataset) but breaks in production (large filter history)

### Pitfall 4: JSON.parse XSS Vulnerability
**What goes wrong:** Malicious user injects code into localStorage, JSON.parse executes it via dangerouslySetInnerHTML
**Why it happens:** localStorage is accessible to any JavaScript—XSS can modify it
**How to avoid:**
  - Never use dangerouslySetInnerHTML with localStorage data
  - Validate/sanitize localStorage data before use
  - Use TypeScript types to ensure expected structure
  - Only store primitive values and simple objects
**Warning signs:** Security audit flags localStorage usage, JSON.parse without validation

### Pitfall 5: Incorrect Virtualization Configuration
**What goes wrong:** Rows jump during scroll, blank spaces appear, scroll position resets
**Why it happens:** Incorrect estimateSize, missing overscan, or wrong scroll element reference
**How to avoid:**
  - Set estimateSize to match actual row height (measure in devtools)
  - Use overscan: 10 for smooth scrolling
  - Ensure scroll container has fixed height and overflow: auto
  - Test with large datasets (1000+ rows)
**Warning signs:** Jumpy scrolling, rows flashing in/out, scroll bar behavior weird

### Pitfall 6: Multi-Column Sort Without Shift Key Detection
**What goes wrong:** Clicking a column header replaces previous sort instead of adding secondary sort
**Why it happens:** Not checking e.shiftKey in click handler
**How to avoid:** Pass e.shiftKey as second argument to column.toggleSorting()
**Warning signs:** Users complain they can't sort by multiple columns

### Pitfall 7: Filter State Not Synchronized with UI
**What goes wrong:** Active filter chips don't match actual filters, removing chip doesn't clear filter
**Why it happens:** Maintaining separate filter state instead of deriving from table state
**How to avoid:** Use table.getState().columnFilters as single source of truth, derive chip display from it
**Warning signs:** Chips show wrong filters, clicking "remove" doesn't work, filters persist after clearing

### Pitfall 8: Missing Loading Skeletons
**What goes wrong:** Table shows empty state flash before data loads, jarring user experience
**Why it happens:** Not handling loading state, showing empty message while fetching
**How to avoid:**
  - Show skeleton rows (10-15) while loading
  - Keep table structure intact (headers visible)
  - Use shadcn Skeleton component in cells
**Warning signs:** Flash of "No projects" message, layout shift when data loads

### Pitfall 9: Poor Density Toggle Implementation
**What goes wrong:** Changing density causes scroll position reset, selected rows clear, filters reset
**Why it happens:** Re-mounting table component instead of updating CSS classes
**How to avoid:**
  - Change row height via CSS class on table container
  - Update rowVirtualizer.estimateSize dynamically
  - Don't remount table component
**Warning signs:** Scroll jumps to top, table state resets when changing density

### Pitfall 10: Column Ordering Breaking Column Pinning
**What goes wrong:** Reordering columns causes pinned columns to unpin or appear in wrong order
**Why it happens:** columnOrder and columnPinning states conflict
**How to avoid:** If not using column pinning (we're not in Phase 5), don't worry. If adding later, ensure columnOrder respects pinned column zones (left, center, right).
**Warning signs:** Dragging columns causes unexpected repositioning

## Code Examples

Verified patterns from official sources:

### Mini Visualization Cells (Reuse Existing Components)

**Value Score Dots (Already Exists):**
```typescript
// Source: frontend/src/components/projects/ValueScoreCard.tsx
function ScoreDots({ score }: { score: number }) {
  return (
    <span className="font-mono tracking-wide text-lg">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < score ? 'text-primary' : 'text-gray-300'}
        >
          {i < score ? '\u25CF' : '\u25CB'}
        </span>
      ))}
    </span>
  );
}

// Use in column definition
{
  id: 'valueScore',
  header: 'Value',
  cell: ({ row }) => <ScoreDots score={row.original.valueScore} />,
}
```

**Budget Health Progress Bar (New, Reuse Existing Colors):**
```typescript
// Reuse existing budget health logic from BudgetTab
function BudgetHealthCell({ spent, budget }: { spent: number; budget: number }) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const color = percentage < 90 ? 'bg-green-500' : percentage <= 100 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}
```

**Effort Team Chips (Already Exists):**
```typescript
// Source: frontend/src/components/projects/TeamChip.tsx
import { TeamChip } from '@/components/projects/TeamChip';

{
  id: 'effort',
  header: 'Effort',
  cell: ({ row }) => (
    <div className="flex gap-1 flex-wrap">
      {row.original.teams.map(team => (
        <TeamChip
          key={team.id}
          teamName={team.name}
          size={team.size}
          isLead={team.id === row.original.leadTeamId}
        />
      ))}
    </div>
  ),
}
```

### Removable Filter Chips

```typescript
// Source: Material UI Chip pattern - https://mui.com/material-ui/react-chip/
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

function FilterChips({ table }: { table: Table<Project> }) {
  const filters = table.getState().columnFilters;

  if (filters.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <Badge key={filter.id} variant="secondary" className="gap-1">
          {filter.id}: {String(filter.value)}
          <button
            onClick={() => {
              table.getColumn(filter.id)?.setFilterValue(undefined);
            }}
            className="hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <button
          onClick={() => table.resetColumnFilters()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
```

### Table Loading Skeleton

```typescript
// Source: shadcn/ui table loading block - https://www.shadcn.io/blocks/tables-loading
import { Skeleton } from '@/components/ui/skeleton';

function TableLoadingSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 15 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 8 }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Row Density Toggle

```typescript
// Source: shadcn/ui density toggle block - https://www.shadcn.io/blocks/tables-density
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Density = 'comfortable' | 'compact';

function DensityToggle({ density, onDensityChange }: {
  density: Density;
  onDensityChange: (density: Density) => void;
}) {
  return (
    <ToggleGroup type="single" value={density} onValueChange={onDensityChange}>
      <ToggleGroupItem value="comfortable" aria-label="Comfortable">
        Comfortable
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label="Compact">
        Compact
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

// Update virtualizer estimateSize based on density
const rowHeight = density === 'comfortable' ? 53 : 37;

const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => rowHeight,
  overscan: 10,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-table v7 | @tanstack/react-table v8 | 2022 | Complete rewrite with TypeScript, better tree-shaking, smaller bundle, improved API |
| react-beautiful-dnd | @dnd-kit | 2021-2023 | Modern hooks-based API, better performance, active maintenance |
| Custom debounce with setTimeout | use-debounce hook | 2020+ | Handles React lifecycle, cleanup, cancellation automatically |
| react-window | @tanstack/react-virtual | 2023+ | Better integration with TanStack ecosystem, more flexible API |
| Pagination | Virtual scrolling | 2024+ | Users expect infinite scroll, better UX, modern table standard |
| Text-based indicators | Mini visualizations | 2024+ | Linear/Notion style, information-dense but clean, modern table UI |
| Single-column sort | Multi-column sort with Shift+Click | 2022+ | Industry standard (MUI, AG Grid, Material React Table) |

**Deprecated/outdated:**
- **react-beautiful-dnd:** Maintenance mode since 2021, replaced by @dnd-kit
- **react-table v7:** Replaced by v8, incompatible API
- **localStorage without error handling:** Modern apps must handle QuotaExceededError, private browsing
- **Pagination for all tables:** Virtual scrolling preferred for <1000 rows, pagination for server-side

## Open Questions

1. **Date range picker component source**
   - What we know: Community component date-range-picker-for-shadcn exists with presets
   - What's unclear: Whether to vendor (copy into project) or install as dependency
   - Recommendation: Vendor the component (copy source) for full control—shadcn philosophy is copy, not install

2. **Column filter persistence granularity**
   - What we know: Filter state should persist to localStorage
   - What's unclear: Should we persist actual filter values or just filter presence?
   - Recommendation: Persist filter values—users expect filters to remain when they reload. Include timestamp, clear filters older than 7 days.

3. **Bulk actions API endpoints**
   - What we know: Bulk actions toolbar needed for selected rows
   - What's unclear: Backend API design for bulk status change, bulk delete
   - Recommendation: Defer to implementation—likely needs new endpoints like PATCH /projects/bulk-status, DELETE /projects/bulk

4. **Empty state messaging**
   - What we know: Need empty state when no projects exist
   - What's unclear: Copy, illustration, CTAs
   - Recommendation: Simple message "No projects yet" + "Create New Project" button. Defer illustration to Claude's discretion during implementation.

## Sources

### Primary (HIGH confidence)
- [TanStack Table v8 Column Visibility Guide](https://tanstack.com/table/v8/docs/guide/column-visibility) - Column visibility implementation
- [TanStack Table v8 Column Ordering Guide](https://tanstack.com/table/v8/docs/guide/column-ordering) - Column reordering patterns
- [TanStack Table v8 Row Selection Guide](https://tanstack.com/table/v8/docs/guide/row-selection) - Row selection with checkboxes
- [TanStack Table v8 FAQ](https://tanstack.com/table/latest/docs/faq) - Common mistakes and memoization
- [TanStack Virtual v3 React Table Example](https://tanstack.com/virtual/v3/docs/framework/react/examples/table) - Virtual scrolling integration
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) - Table component patterns
- [shadcn/ui Sheet](https://ui.shadcn.com/docs/components/radix/sheet) - Sidebar/Sheet customization

### Secondary (MEDIUM confidence)
- [Date Range Picker for shadcn GitHub](https://github.com/johnpolacek/date-range-picker-for-shadcn) - Date range picker with presets
- [shadcn/ui Tables Bulk Actions Block](https://www.shadcn.io/blocks/tables-bulk-actions) - Bulk selection toolbar
- [shadcn/ui Tables Loading Block](https://www.shadcn.io/blocks/tables-loading) - Loading skeleton pattern
- [shadcn/ui Tables Density Block](https://www.shadcn.io/blocks/tables-density) - Density toggle implementation
- [Material React Table Density Toggle](https://www.material-react-table.com/docs/guides/density-toggle) - Density toggle specs
- [Material React Table Sorting Guide](https://www.material-react-table.com/docs/guides/sorting) - Multi-column sort pattern
- [MUI X Data Grid Sorting](https://mui.com/x/react-data-grid/sorting/) - Shift+Click multi-sort standard
- [Medium: Building Performant Virtualized Tables](https://medium.com/codex/building-a-performant-virtualized-table-with-tanstack-react-table-and-tanstack-react-virtual-f267d84fbca7) - Virtual scroll integration patterns
- [Medium: Debounce Your Search React Input Optimization](https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b) - Debounce best practices
- [Josh Comeau: Persisting React State in localStorage](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) - localStorage patterns

### Tertiary (LOW confidence - informational only)
- [GitHub Discussion: TanStack Table Column DnD](https://github.com/TanStack/table/discussions/3953) - Community DnD discussions
- [Substack: Virtual Scrolling Architecture](https://stefsdevnotes.substack.com/p/virtual-scrolling-architecture-react) - State management pitfalls
- [Web Security React: XSS in React](https://web-security-react.readthedocs.io/en/latest/pages/xss_in_react.html) - XSS risks with localStorage
- [nulldog: JWT in localStorage Security Risks](https://nulldog.com/jwt-in-localstorage-with-react-security-risks-best-practices) - localStorage security

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries already installed and documented, TanStack Table v8 is stable and widely adopted
- Architecture patterns: HIGH - Patterns verified from official TanStack docs, shadcn/ui blocks, and existing project code
- Pitfalls: HIGH - Based on official FAQs, GitHub issues, and common developer experiences documented in multiple sources
- Don't hand-roll: HIGH - Clear community consensus on using @dnd-kit, TanStack Virtual, and established component libraries
- Code examples: HIGH - Examples from official docs, existing project components, and verified community patterns

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - TanStack libraries are stable, patterns are mature)
