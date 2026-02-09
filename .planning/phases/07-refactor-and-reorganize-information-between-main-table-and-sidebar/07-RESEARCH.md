# Phase 07: Refactor and Reorganize Information Between Main Table and Sidebar - Research

**Researched:** 2026-02-09
**Domain:** React data table refactoring, column visualization, sidebar reorganization
**Confidence:** HIGH

## Summary

This phase involves a comprehensive refactor of the portfolio table and sidebar to improve information density, visualization, and user experience. The existing codebase uses TanStack Table v8 with virtual scrolling, React 18, TypeScript, and shadcn/ui components. The backend stores all monetary values in EUR and converts at the API boundary.

Key challenges include: (1) replacing simple dot indicators with mini radar charts in ~40px table cells, (2) implementing expandable sub-rows for effort and impact teams, (3) adding column pinning/freezing for the first 3 columns, (4) integrating a rich text editor for project descriptions, (5) fixing the currency model to store EUR always and convert on display, (6) reorganizing sidebar tabs by merging People into General and adding section dividers, and (7) optimizing the backend API to return all required fields efficiently.

**Primary recommendation:** Use Recharts for radar charts (proven SVG-based solution with React integration), TanStack Table's built-in expanding feature for sub-rows, Tiptap for rich text editing (headless architecture with excellent React support), and the native Intl API for relative time formatting. Leverage existing TanStack Table column pinning APIs with sticky CSS positioning.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Table column redesign:**
- Value score: Replace 5 dots with static mini radar/spider chart showing all 5 dimensions
- Effort: Show aggregate project T-shirt, click to expand row showing team breakdown
- Change Impact: Show T-shirt summary, click to expand row showing impact team breakdown
- Budget health: Keep progress bar, add 'spent/total' text with color coding
- Committee: Show level + small progression line + current state text
- Status: Keep colored badge
- Last activity: Add column showing relative time ("2h ago", "yesterday")

**New table columns:**
- Date range: Single column "Jan 2026 - Jun 2026"
- Cost T-shirt: Show XS/S/M/L/XL/XXL badge
- IS Owner: Add to table
- Sponsor: Add to table
- Impact: T-shirt summary (expandable like effort)

**Table layout:**
- Default visible (Core 8): ID, Name, Status, Lead Team, Dates, Value, Budget, Committee
- Hidden by default: PM, IS Owner, Sponsor, Effort, Impact, Cost T-shirt, Last Activity, Stopped
- Frozen columns: Checkbox + ID + Name (first 3)
- Expandable sub-rows for Effort and Change Impact (inline expansion)

**Sidebar tab changes:**
- Merge People into General with sections: Core Info, People, Description (rich text), Business Case (moved from Committee)
- Rename "Teams" to "Effort": Show global T-shirt at top, teams below
- Value tab: Large radar chart at top with labels, score cards below
- Budget tab: OPEX/CAPEX as side-by-side cards at top with Edit button, allocations table below
- Committee tab: Remove business case, show only governance state machine
- People tab: Removed (merged into General)
- Tab order: General > Effort > Value > Change Impact > Committee > Budget > Actuals > History
- Default tab: General (always)

**Currency model fix:**
- ALL monetary amounts stored in EUR in database (always)
- GBP/EUR toggle is display preference only (project-level)
- User types in GBP mode → convert to EUR before saving
- Display in GBP mode → convert EUR to GBP for display
- Changing toggle does NOT create audit history (cosmetic)
- reportCurrency field stores preference but has no effect on stored values

**API optimization:**
- Optimize existing /api/projects list endpoint (no new endpoint)
- Return: teams, valueScoreAvg, budgetTotal, actualsTotal, committeeState, committeeLevel, costTshirt, opexBudget, capexBudget, startDate, endDate, isOwner, sponsor, updatedAt
- Add project description field to schema and API
- Currency conversion at API boundary (store EUR, return requested currency)

### Claude's Discretion

- Radar chart library choice (recharts, visx, or custom SVG)
- Exact expandable row animation and styling
- Global effort T-shirt derivation algorithm (max of teams, weighted average, etc.)
- Rich text editor library choice
- Exact section divider styling in General tab
- Committee progression line visual design

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core Technologies (Already in Use)
| Library | Version | Purpose | Current Usage |
|---------|---------|---------|---------------|
| @tanstack/react-table | v8 | Headless table library | Column management, sorting, filtering, virtual scrolling |
| @tanstack/react-virtual | Latest | Virtual scrolling | Row virtualization for performance (ROW_HEIGHT: comfortable 53px, compact 37px) |
| React | 18.x | UI framework | Component architecture |
| TypeScript | Latest | Type safety | Full codebase typing |
| shadcn/ui | Latest | UI components | Table, Input, Select, Badge, Dialog primitives |
| Tailwind CSS | Latest | Styling | Utility-first CSS |

### New Libraries Required
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 2.x | Radar/spider charts | Most popular React chart library, SVG-based, declarative API |
| tiptap | 2.x | Rich text editor | Headless architecture, ProseMirror-based, excellent React integration |
| date-fns | 3.x | Relative time formatting | Tree-shakeable, TypeScript support, formatDistanceToNow() |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| visx | 3.x | Low-level chart primitives | If custom radar chart needed (complex) |
| dayjs | 1.x | Lightweight date utility | Alternative to date-fns (smaller bundle) |
| Intl.RelativeTimeFormat | Native | Relative time formatting | If no library preferred (browser API) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | visx | More control, steeper learning curve, larger implementation effort |
| Tiptap | Slate.js | More customization, older/slower, steeper learning curve |
| Tiptap | Plate | Batteries-included Slate wrapper, heavier bundle |
| date-fns | dayjs | Smaller bundle (2KB vs 10KB), less feature-rich |
| date-fns | Intl.RelativeTimeFormat | Zero dependencies, less flexible formatting |

**Installation:**
```bash
npm install recharts tiptap @tiptap/react @tiptap/starter-kit date-fns
```

## Architecture Patterns

### Current Table Structure
```
frontend/src/components/portfolio/
├── PortfolioTable.tsx              # Main table with TanStack Table + virtual scroll
├── columns/
│   ├── portfolioColumns.tsx        # Column definitions, visibility, order
│   ├── ValueScoreCell.tsx          # Current: 5 dots (●●●○○)
│   ├── EffortCell.tsx              # Current: TeamChip components (max 3 shown)
│   ├── BudgetHealthCell.tsx        # Progress bar with percentage
│   └── CommitteeCell.tsx           # Workflow state circles
```

### New Table Structure (Refactored)
```
frontend/src/components/portfolio/
├── PortfolioTable.tsx              # Add getExpandedRowModel, column pinning state
├── columns/
│   ├── portfolioColumns.tsx        # Add new columns, update visibility defaults
│   ├── ValueScoreCell.tsx          # NEW: Mini radar chart (40px)
│   ├── EffortCell.tsx              # UPDATE: Aggregate T-shirt + expand icon
│   ├── EffortExpandedRow.tsx       # NEW: Team breakdown sub-row
│   ├── ImpactCell.tsx              # NEW: Aggregate T-shirt + expand icon
│   ├── ImpactExpandedRow.tsx       # NEW: Impact team breakdown sub-row
│   ├── BudgetHealthCell.tsx        # UPDATE: Add "EUR 45K / 100K" text
│   ├── CommitteeCell.tsx           # UPDATE: Add progression line + state text
│   ├── LastActivityCell.tsx        # NEW: Relative time with date-fns
│   ├── DateRangeCell.tsx           # NEW: "Jan 2026 - Jun 2026"
│   └── CostTshirtCell.tsx          # NEW: Badge with T-shirt size
```

### Pattern 1: TanStack Table Column Pinning with Sticky CSS
**What:** Freeze first 3 columns (checkbox, ID, name) on horizontal scroll using TanStack Table's column pinning state + CSS position: sticky.

**When to use:** When table has many columns requiring horizontal scroll but key columns need to remain visible.

**Example:**
```typescript
// Source: TanStack Table official docs
// https://tanstack.com/table/latest/docs/framework/react/examples/column-pinning-sticky

// In PortfolioTable.tsx
const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
  left: ['select', 'projectId', 'name'], // First 3 columns pinned
  right: [],
});

const table = useReactTable({
  // ... existing config
  state: {
    columnPinning,
    // ... other state
  },
  onColumnPinningChange: setColumnPinning,
});

// Helper function for pinned column styles
const getCommonPinningStyles = (column: Column<PortfolioProject>): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
    backgroundColor: isPinned ? 'var(--background)' : undefined,
    boxShadow: isLastLeftPinnedColumn ? '-4px 0 4px -4px gray inset' : undefined,
  };
};

// Apply in TableCell render
<TableCell style={getCommonPinningStyles(cell.column)}>
  {flexRender(cell.column.columnDef.cell, cell.getContext())}
</TableCell>
```

**CRITICAL:** Must specify `left` or `top` value for sticky positioning to work. Use `column.getStart('left')` to calculate offset based on previous pinned columns.

### Pattern 2: TanStack Table Expandable Rows for Sub-Data
**What:** Click cell to expand inline sub-row showing team breakdown (Notion-style toggle).

**When to use:** When displaying hierarchical data (parent project → child teams) without leaving table context.

**Example:**
```typescript
// Source: TanStack Table official docs
// https://tanstack.com/table/latest/docs/guide/expanding

// In PortfolioTable.tsx
const [expanded, setExpanded] = useState<ExpandedState>({});

const table = useReactTable({
  // ... existing config
  state: {
    expanded,
    // ... other state
  },
  onExpandedChange: setExpanded,
  getExpandedRowModel: getExpandedRowModel(),
});

// In portfolioColumns.tsx - Effort column
{
  id: 'effort',
  header: 'Effort',
  cell: ({ row }) => {
    const teams = row.original.teams || [];
    const globalTshirt = deriveGlobalEffort(teams); // Algorithm TBD

    return (
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation(); // Prevent row click
          row.toggleExpanded();
        }}
      >
        <Badge>{globalTshirt}</Badge>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform",
            row.getIsExpanded() && "rotate-90"
          )}
        />
      </div>
    );
  },
}

// In table body render - after main row
{row.getIsExpanded() && (
  <TableRow>
    <TableCell colSpan={columns.length}>
      <EffortExpandedRow teams={row.original.teams} />
    </TableCell>
  </TableRow>
)}
```

**Animation tip:** Use Tailwind transitions on chevron rotation and sub-row height. Consider framer-motion for smooth expand/collapse.

### Pattern 3: Mini Radar Chart in Table Cell
**What:** Render small radar chart (~40px) in table cell showing 5 value dimensions at a glance.

**When to use:** When visualizing multi-dimensional scores in constrained space.

**Example:**
```typescript
// Source: Recharts documentation
// https://recharts.github.io/en-US/api/Radar

import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

export function ValueScoreCell({ scores }: { scores: ProjectValue[] }) {
  // Transform to Recharts format
  const data = scores.map(s => ({
    dimension: s.outcomeName,
    value: s.score || 0,
  }));

  return (
    <RadarChart width={40} height={40} data={data}>
      <PolarGrid stroke="#e5e7eb" strokeWidth={0.5} />
      <Radar
        dataKey="value"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.6}
        dot={false}
      />
    </RadarChart>
  );
}
```

**For sidebar:** Use larger chart (200x200px) with PolarAngleAxis labels visible.

### Pattern 4: Rich Text Editor Integration
**What:** Add Tiptap editor for project description field with basic formatting (bold, italic, lists, links).

**When to use:** When users need formatted text input beyond plain textarea.

**Example:**
```typescript
// Source: Tiptap React docs
// https://tiptap.dev/docs/editor/getting-started/install/react

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function DescriptionEditor({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-md p-3">
      <EditorContent editor={editor} />
    </div>
  );
}
```

**Toolbar:** Add MenuBar component with buttons for bold, italic, heading, lists, link. Use StarterKit for baseline features.

### Pattern 5: Currency Conversion at API Boundary
**What:** Store all amounts in EUR in database, convert to requested currency at API level, display in user's preferred currency.

**When to use:** Multi-currency applications where source-of-truth currency is known (EUR) but display varies.

**Example:**
```typescript
// Backend: backend/src/routes/projects/projects.ts
// Already implements this pattern in actuals/summary endpoint

// GET /api/projects?reportCurrency=GBP
fastify.get<{
  Querystring: { reportCurrency?: string };
}>('/', async (request) => {
  const targetCurrency = request.query.reportCurrency || 'EUR';
  const projects = await db.select().from(projects);

  // Convert each project's EUR values to target currency
  return Promise.all(projects.map(async (p) => {
    const opex = await convertCurrency(db, p.opexBudget, 'EUR', targetCurrency);
    const capex = await convertCurrency(db, p.capexBudget, 'EUR', targetCurrency);
    return {
      ...p,
      opexBudget: opex,
      capexBudget: capex,
      budgetCurrency: targetCurrency, // For display
    };
  }));
});

// Frontend: Always send values in user's display currency, backend converts
async function saveBudget(projectId: number, opex: string, capex: string, currency: string) {
  await fetch(`/api/projects/${projectId}/budget`, {
    method: 'PUT',
    body: JSON.stringify({
      opexBudget: opex,
      capexBudget: capex,
      inputCurrency: currency, // Backend converts to EUR before storing
    }),
  });
}
```

**CRITICAL:** Backend MUST convert input values to EUR before INSERT/UPDATE. Database schema stores only EUR. Currency conversion uses project startDate for historical rates.

### Pattern 6: Relative Time Formatting
**What:** Display "2h ago", "yesterday", "3 days ago" instead of absolute timestamps.

**When to use:** For activity timestamps where recency is more important than exact time.

**Example:**
```typescript
// Using date-fns (recommended)
import { formatDistanceToNow } from 'date-fns';

export function LastActivityCell({ updatedAt }: { updatedAt: string }) {
  const relativeTime = formatDistanceToNow(new Date(updatedAt), {
    addSuffix: true
  });

  return (
    <span className="text-sm text-muted-foreground" title={updatedAt}>
      {relativeTime}
    </span>
  );
}

// Alternative: Native Intl API (zero dependencies)
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const diffInDays = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
const relativeTime = rtf.format(-diffInDays, 'day'); // "yesterday", "2 days ago"
```

**Auto-update:** Use setInterval or React Query with refetch interval to update relative times every minute.

### Pattern 7: Sidebar Section Dividers
**What:** Visual separation of content sections within General tab (Core Info, People, Description, Business Case).

**When to use:** When merging multiple logical groups into single tab for better UX.

**Example:**
```typescript
export function GeneralTab({ project, formData, onChange, disabled }: GeneralTabProps) {
  return (
    <div className="space-y-6">
      {/* Core Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Core Information
        </h3>
        <div className="space-y-4">
          <StatusField />
          <DateFields />
          <LeadTeamField />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* People Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          People
        </h3>
        <div className="space-y-4">
          <PMField />
          <ISOwnerField />
          <SponsorField />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Description Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Description
        </h3>
        <DescriptionEditor value={formData.description} onChange={...} />
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Business Case Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Business Case
        </h3>
        <BusinessCaseUpload projectId={project.id} />
      </div>
    </div>
  );
}
```

### Pattern 8: Budget OPEX/CAPEX Side-by-Side Cards
**What:** Display OPEX and CAPEX as two equal-width cards at top of Budget tab with Edit button.

**When to use:** When highlighting two related financial metrics that users compare frequently.

**Example:**
```typescript
export function BudgetTab({ project, disabled }: BudgetTabProps) {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="space-y-6">
      {/* OPEX/CAPEX Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* OPEX Card */}
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">OPEX</span>
            <Badge variant="outline">Operating</Badge>
          </div>
          {editMode ? (
            <Input
              type="text"
              value={localOpex}
              onChange={(e) => setLocalOpex(e.target.value)}
            />
          ) : (
            <div className="text-2xl font-semibold">
              {formatCurrency(project.opexBudget, project.reportCurrency)}
            </div>
          )}
        </div>

        {/* CAPEX Card */}
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">CAPEX</span>
            <Badge variant="outline">Capital</Badge>
          </div>
          {editMode ? (
            <Input
              type="text"
              value={localCapex}
              onChange={(e) => setLocalCapex(e.target.value)}
            />
          ) : (
            <div className="text-2xl font-semibold">
              {formatCurrency(project.capexBudget, project.reportCurrency)}
            </div>
          )}
        </div>
      </div>

      {/* Edit Button */}
      <Button
        variant="outline"
        onClick={() => setEditMode(!editMode)}
        disabled={disabled}
      >
        {editMode ? 'Save' : 'Edit Budget'}
      </Button>

      {/* Allocations Table (existing) */}
      <div className="border-t pt-6">
        <AllocationsList />
      </div>
    </div>
  );
}
```

**Alternative:** Use HoverCard (current pattern in BudgetTab.tsx) to edit values on hover instead of explicit Edit button.

### Anti-Patterns to Avoid

- **Radar chart in every row re-renders:** Recharts creates SVG DOM nodes. With 1000+ projects, this causes layout thrashing. Solution: Use virtual scrolling (already implemented) and React.memo() on ValueScoreCell.

- **Expandable rows without stopPropagation:** Clicking expand icon also triggers row click (opens sidebar). Solution: Call e.stopPropagation() on expand button click handler.

- **Currency conversion on every render:** Converting currencies in cell components causes performance issues. Solution: Convert at API boundary (backend) and cache in React Query.

- **Storing rich text as HTML without sanitization:** XSS vulnerability if user input not sanitized. Solution: Tiptap handles this internally, but always sanitize when rendering stored HTML.

- **Column pinning without z-index management:** Pinned columns appear behind scrolling content. Solution: Apply z-index: 1 to pinned columns, z-index: 2 to pinned headers.

- **Relative time that never updates:** "2 hours ago" still shows after 4 hours. Solution: Use setInterval to refresh every minute, or React Query with refetchInterval.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Radar/spider charts | Custom SVG with trigonometry | Recharts `<RadarChart>` | Handles polar coordinates, scaling, gridlines, responsive sizing, accessibility |
| Rich text editing | ContentEditable + document.execCommand | Tiptap | Handles browser inconsistencies, undo/redo, serialization, schema validation, 100+ edge cases |
| Column pinning logic | Manual left offset calculations | TanStack Table column pinning APIs | Handles pinned column ordering, offset calculations, pinning state management |
| Expandable row state | Custom row ID tracking | TanStack Table expanding APIs | Handles nested expansion, parent-child relationships, accessibility (aria-expanded) |
| Relative time formatting | Manual date math + pluralization | date-fns formatDistanceToNow() | Handles locale support, edge cases (just now, yesterday), timezone awareness |
| Currency conversion | Manual rate multiplication | Backend convertCurrency() with DB rates | Handles historical rates, rate caching, decimal precision, missing rate fallbacks |
| Virtual scrolling offsets | Manual scroll position tracking | @tanstack/react-virtual | Handles dynamic row heights, overscan, scroll jumping, layout shifts |

**Key insight:** Data table features (pinning, expanding, sorting, filtering) have 100+ edge cases. TanStack Table is battle-tested library handling accessibility, keyboard navigation, state persistence, and performance optimizations. Rich text editors must handle contentEditable quirks across browsers (Safari, Firefox, Chrome) with different behaviors for Enter, Backspace, Copy/Paste.

## Common Pitfalls

### Pitfall 1: Recharts Performance with Large Datasets
**What goes wrong:** Rendering radar charts for 1000+ rows creates thousands of SVG DOM elements, freezing browser.

**Why it happens:** Recharts renders full SVG structure for each chart. Virtual scrolling helps but doesn't eliminate problem if all charts are in DOM.

**How to avoid:**
- Use React.memo() on ValueScoreCell to prevent unnecessary re-renders
- Only render radar chart for visible rows (virtual scrolling handles this)
- Consider using canvas-based visx for 5000+ rows (more complex implementation)
- For table cells, use simplified radar with dot={false}, no labels, minimal grid

**Warning signs:**
- Browser DevTools shows layout thrashing
- Table scrolling is janky (< 60fps)
- Initial render takes > 2 seconds

### Pitfall 2: Expandable Rows Break Virtual Scrolling
**What goes wrong:** Expanding row changes row height, causing virtual scroll calculations to break and rows to overlap or disappear.

**Why it happens:** TanStack Virtual uses estimateSize() to calculate row positions. Expanded rows have dynamic height not accounted for in estimate.

**How to avoid:**
- Use fixed height for expanded rows (e.g., always 200px for team breakdown)
- Call rowVirtualizer.measure() after row expansion to recalculate offsets
- Consider disabling virtual scrolling when rows are expanded (trade-off)
- Alternative: Use Popover/Dialog for expanded content instead of inline rows

**Warning signs:**
- Rows overlap after expansion
- Scrollbar jumps on expand
- Expanded content is cut off

### Pitfall 3: Column Pinning Breaks with Horizontal Scroll
**What goes wrong:** Pinned columns scroll horizontally instead of staying fixed, or appear misaligned with headers.

**Why it happens:**
- Missing `position: sticky` or `left` offset CSS
- Parent container has `overflow: hidden` instead of `overflow: auto`
- Z-index conflicts with other sticky elements (header)

**How to avoid:**
- Apply sticky styles to BOTH th and td for same column
- Set z-index: 2 on pinned headers, z-index: 1 on pinned cells
- Use column.getStart('left') to calculate correct left offset
- Ensure table container has overflow-x: auto (not hidden)
- Add background color to pinned columns to prevent transparency

**Warning signs:**
- Pinned columns scroll when they shouldn't
- Pinned columns appear behind scrolling columns
- Header and cell alignment is off

### Pitfall 4: Tiptap Content Not Persisting
**What goes wrong:** User types in rich text editor but content disappears or isn't saved.

**Why it happens:**
- onUpdate callback not wired to form state
- Calling editor.getHTML() on unmounted editor
- Not handling initial content load correctly
- Auto-save debounce too aggressive

**How to avoid:**
- Wire editor.getHTML() to form state via onUpdate
- Store as HTML string in database (text column)
- Load initial content in useEditor({ content: value })
- Use separate auto-save hook with 2-3 second delay
- Add blur event to force save when editor loses focus

**Warning signs:**
- Content shows in editor but not in sidebar after save
- Content resets to empty on re-open
- Typing is laggy (too frequent saves)

### Pitfall 5: Currency Conversion Inconsistency
**What goes wrong:** Same EUR amount shows different GBP values in table vs sidebar, or amounts change when toggling currency.

**Why it happens:**
- Frontend doing conversion with stale rates
- Backend not using consistent date for rate lookup
- Rounding errors accumulating across multiple conversions
- Mixing source currency (budgetCurrency) with display currency (reportCurrency)

**How to avoid:**
- Backend stores ONLY EUR (budgetCurrency removed from projects table)
- Backend converts to requested currency using project.startDate for rate lookup
- Frontend never converts, always displays values from API
- reportCurrency is UI preference only, not stored per-transaction
- Use DECIMAL(15,2) in database, not FLOAT

**Warning signs:**
- Changing currency toggle changes saved amounts
- Same project shows different totals in different views
- Budget + Actuals math doesn't add up after conversion

### Pitfall 6: Sidebar Tab State Lost on Re-Open
**What goes wrong:** User opens project, switches to Budget tab, closes sidebar, re-opens project → defaults to General tab instead of Budget.

**Why it happens:** TabsContent defaultValue="general" always resets state. No persistence of last active tab.

**How to avoid:**
- Store active tab in localStorage keyed by projectId
- Read from localStorage in Tabs defaultValue prop
- Alternative: Use URL search params (?tab=budget)
- Clear tab state when project closes to avoid stale tab on different project

**Warning signs:**
- Users complain about always resetting to General tab
- Tab changes don't persist across navigation

### Pitfall 7: Date Range Column Showing Invalid Dates
**What goes wrong:** "Invalid Date - Jun 2026" or "Jan 2026 - Invalid Date" in table cells.

**Why it happens:**
- Project has null startDate or endDate
- Date parsing fails on invalid ISO format
- Month/year formatting function doesn't handle null

**How to avoid:**
- Handle null dates gracefully: "Start TBD - Jun 2026"
- Use date-fns format() with fallback: format(date, 'MMM yyyy') || 'TBD'
- Validate date format before parsing
- Show dash (—) if both dates are null

**Warning signs:**
- "Invalid Date" in table cells
- Console errors about date parsing

## Code Examples

Verified patterns from official sources:

### TanStack Table Column Pinning (Official Example)
```typescript
// Source: https://tanstack.com/table/latest/docs/framework/react/examples/column-pinning-sticky

import { ColumnPinningState } from '@tanstack/react-table';

// State management
const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
  left: ['select', 'projectId', 'name'],
  right: [],
});

// Table config
const table = useReactTable({
  data,
  columns,
  state: {
    columnPinning,
  },
  onColumnPinningChange: setColumnPinning,
  getCoreRowModel: getCoreRowModel(),
});

// Pinning styles helper
const getCommonPinningStyles = (column: Column<PortfolioProject>): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
    backgroundColor: isPinned ? 'white' : undefined,
    boxShadow: isLastLeftPinnedColumn ? '-4px 0 4px -4px gray inset' : undefined,
  };
};

// Apply in render
<TableCell style={getCommonPinningStyles(cell.column)}>
  {flexRender(cell.column.columnDef.cell, cell.getContext())}
</TableCell>
```

### TanStack Table Expandable Rows (Official Example)
```typescript
// Source: https://tanstack.com/table/latest/docs/guide/expanding

import { ExpandedState, getExpandedRowModel } from '@tanstack/react-table';

// State management
const [expanded, setExpanded] = useState<ExpandedState>({});

// Table config
const table = useReactTable({
  data,
  columns,
  state: {
    expanded,
  },
  onExpandedChange: setExpanded,
  getExpandedRowModel: getExpandedRowModel(),
});

// Column definition with expand toggle
{
  id: 'effort',
  header: 'Effort',
  cell: ({ row }) => (
    <div
      onClick={(e) => {
        e.stopPropagation();
        row.toggleExpanded();
      }}
      className="cursor-pointer flex items-center gap-2"
    >
      <Badge>{deriveGlobalEffort(row.original.teams)}</Badge>
      <ChevronRight className={row.getIsExpanded() ? "rotate-90" : ""} />
    </div>
  ),
}

// Render expanded content
{rows.map(row => (
  <>
    <TableRow key={row.id}>
      {/* Main row cells */}
    </TableRow>
    {row.getIsExpanded() && (
      <TableRow>
        <TableCell colSpan={columns.length}>
          <EffortExpandedRow teams={row.original.teams} />
        </TableCell>
      </TableRow>
    )}
  </>
))}
```

### Recharts Mini Radar Chart
```typescript
// Source: https://recharts.github.io/en-US/api/Radar

import { Radar, RadarChart, PolarGrid } from 'recharts';

export function ValueScoreCell({ values }: { values: ProjectValue[] }) {
  const data = values.map(v => ({
    dimension: v.outcomeName,
    value: v.score || 0,
  }));

  return (
    <RadarChart
      width={40}
      height={40}
      data={data}
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <PolarGrid
        stroke="#e5e7eb"
        strokeWidth={0.5}
      />
      <Radar
        dataKey="value"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.6}
        dot={false}
      />
    </RadarChart>
  );
}

// Sidebar version (larger with labels)
export function ValueRadarChart({ values }: { values: ProjectValue[] }) {
  const data = values.map(v => ({
    dimension: v.outcomeName.substring(0, 15), // Truncate long names
    value: v.score || 0,
  }));

  return (
    <RadarChart
      width={300}
      height={300}
      data={data}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    >
      <PolarGrid stroke="#e5e7eb" />
      <PolarAngleAxis
        dataKey="dimension"
        tick={{ fill: '#6b7280', fontSize: 12 }}
      />
      <PolarRadiusAxis
        angle={90}
        domain={[0, 5]}
        tick={{ fill: '#6b7280', fontSize: 10 }}
      />
      <Radar
        dataKey="value"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.6}
      />
    </RadarChart>
  );
}
```

### Tiptap Rich Text Editor
```typescript
// Source: https://tiptap.dev/docs/editor/getting-started/install/react

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, Link as LinkIcon } from 'lucide-react';

export function DescriptionEditor({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="border-b p-2 flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
```

### Date-fns Relative Time Formatting
```typescript
// Source: https://date-fns.org/docs/formatDistanceToNow

import { formatDistanceToNow } from 'date-fns';

export function LastActivityCell({ updatedAt }: { updatedAt: string }) {
  const relativeTime = formatDistanceToNow(new Date(updatedAt), {
    addSuffix: true, // "2 hours ago" vs "2 hours"
  });

  return (
    <span
      className="text-sm text-muted-foreground"
      title={new Date(updatedAt).toLocaleString()} // Full date on hover
    >
      {relativeTime}
    </span>
  );
}

// With auto-refresh (updates every minute)
export function LastActivityCellLive({ updatedAt }: { updatedAt: string }) {
  const [relativeTime, setRelativeTime] = useState(
    formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(
        formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [updatedAt]);

  return <span className="text-sm text-muted-foreground">{relativeTime}</span>;
}
```

### Intl API Currency Formatting
```typescript
// Source: Native JavaScript Intl API
// Zero dependencies, browser-native

export function formatCurrency(amount: string | number, currency: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Usage
formatCurrency(1234.56, 'EUR'); // "€1,234.56"
formatCurrency(1234.56, 'GBP'); // "£1,234.56"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate column pinning libraries | TanStack Table built-in | v8 (2022) | Simpler setup, fewer dependencies |
| React-window for virtual scrolling | @tanstack/react-virtual | 2023 | Better composability, easier styling |
| Moment.js for dates | date-fns or dayjs | 2020+ | Tree-shakeable, smaller bundles |
| Custom expandable row logic | TanStack Table expanding APIs | v8 (2022) | Handles accessibility, state management |
| QuillJS rich text editor | Tiptap or Plate | 2023+ | Better React integration, headless architecture |
| D3.js directly | Recharts or visx wrappers | 2018+ | Declarative API, React-friendly |

**Deprecated/outdated:**
- **Moment.js:** Stopped maintenance, 65KB bundle. Use date-fns (tree-shakeable) or dayjs (2KB).
- **react-table v7:** Column API changed in v8. Use columnHelper pattern instead of accessor strings.
- **DraftJS:** Meta-maintained but stagnant. Use Tiptap for modern rich text editing.
- **Victory Charts:** Performance issues with large datasets. Use Recharts or visx.

## Database Schema Changes Required

### Add description field to projects table
```sql
-- Migration: Add description column
ALTER TABLE projects
ADD COLUMN description TEXT;
```

### Currency model verification
```sql
-- Existing schema (CORRECT):
-- opexBudget DECIMAL(15,2) - stores EUR only
-- capexBudget DECIMAL(15,2) - stores EUR only
-- budgetCurrency VARCHAR(3) - DEPRECATED, should be removed
-- reportCurrency VARCHAR(3) - display preference only

-- Migration: Remove budgetCurrency (no longer needed)
ALTER TABLE projects
DROP COLUMN budgetCurrency;

-- Note: Backend must ensure ALL budget writes convert to EUR before INSERT/UPDATE
```

## Backend API Changes Required

### Update GET /api/projects endpoint
```typescript
// Add to response:
- updatedAt (already exists, ensure returned)
- isOwner (already exists, ensure returned)
- sponsor (already exists, ensure returned)
- description (NEW field)

// Ensure computed fields returned:
- valueScoreAvg (already implemented)
- budgetTotal (already implemented)
- actualsTotal (TODO: currently returns null, aggregate from receipts/invoices)
- costTshirt (already exists)
- committeeState (already exists)
- committeeLevel (already exists)
```

### Add currency conversion to list endpoint
```typescript
// GET /api/projects?reportCurrency=GBP
// Convert opexBudget, capexBudget from EUR to requested currency
// Use project.startDate for historical rate lookup
// Return converted values in response
```

### Update PUT /api/projects/:id/budget endpoint
```typescript
// Accept inputCurrency parameter
// Convert opex/capex from inputCurrency to EUR before storing
// Backend MUST ALWAYS store EUR, never source currency
```

## Open Questions

1. **Global effort T-shirt derivation algorithm**
   - What we know: Need to aggregate team T-shirts (XS/S/M/L/XL/XXL) into single project T-shirt
   - What's unclear: Should we use max() of all teams, weighted average by team size, or custom logic?
   - Recommendation: Start with max() (simplest), add weight later if needed. Document algorithm in code comments.

2. **Expandable row performance with virtual scrolling**
   - What we know: Dynamic row heights break virtual scroll offset calculations
   - What's unclear: Will fixed-height expanded rows (e.g., 200px always) feel restrictive?
   - Recommendation: Use fixed height initially (200px for up to 6 teams). If teams exceed 6, add internal scroll within expanded row. Alternative: Disable virtual scrolling when any row is expanded (perf trade-off).

3. **Radar chart performance at scale**
   - What we know: Recharts creates SVG nodes, 1000+ charts = layout thrashing
   - What's unclear: At what row count does performance degrade unacceptably?
   - Recommendation: Benchmark with 100, 500, 1000, 2000 rows. If > 1000 rows is too slow, consider canvas-based visx or simplified visualization (colored dots with tooltip showing full radar).

4. **Rich text editor sanitization**
   - What we know: Storing user-generated HTML has XSS risk
   - What's unclear: Does Tiptap sanitize on editor.getHTML()? Do we need additional sanitization?
   - Recommendation: Review Tiptap security docs. If storing HTML in database, add server-side sanitization (DOMPurify or similar). For MVP, Tiptap's internal sanitization may suffice.

5. **Committee progression line visual design**
   - What we know: Need to show workflow steps (draft > presented > discussion > approved) + current state
   - What's unclear: Should line be horizontal, vertical, circular? How to show current step vs completed steps?
   - Recommendation: Horizontal line with circles at each step, filled circles for completed, outlined for remaining, highlighted ring for current. Similar to e-commerce order tracking UI.

6. **Actuals aggregation performance**
   - What we know: actualsTotal currently returns null, needs to aggregate receipts + invoices
   - What's unclear: Should we compute on-the-fly (slow for 1000+ projects) or denormalize into projects.actualsTotal (stale data)?
   - Recommendation: Start with on-the-fly aggregation using efficient SQL (SUM with WHERE). If too slow, add database trigger to update projects.actualsTotal on receipt/invoice INSERT/UPDATE/DELETE.

## Sources

### Primary (HIGH confidence)
- TanStack Table v8 Column Pinning Guide: https://tanstack.com/table/v8/docs/guide/column-pinning
- TanStack Table v8 Expanding Guide: https://tanstack.com/table/v8/docs/guide/expanding
- TanStack Table Column Pinning Sticky Example: https://tanstack.com/table/latest/docs/framework/react/examples/column-pinning-sticky
- Recharts API Documentation: https://recharts.github.io/en-US/api/Radar
- Tiptap React Installation Guide: https://tiptap.dev/docs/editor/getting-started/install/react
- date-fns formatDistanceToNow documentation: https://date-fns.org/docs/formatDistanceToNow

### Secondary (MEDIUM confidence)
- Best React Chart Libraries 2026: https://technostacks.com/blog/react-chart-libraries/
- React Rich Text Editors Comparison 2026: https://reactscript.com/best-rich-text-editor/
- Which Rich Text Editor Framework 2025: https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025
- Creating Spider Charts with ReactJS: https://www.javacodegeeks.com/2025/10/creating-spider-charts-with-reactjs-a-complete-guide.html
- Currency Handling in React: https://www.jacobparis.com/content/currency-handling
- Simplify Currency Formatting with Intl API: https://dev.to/josephciullo/simplify-currency-formatting-in-react-a-zero-dependency-solution-with-intl-api-3kok

### Tertiary (LOW confidence - validate before using)
- TanStack Table GitHub Discussions on sticky pinning: https://github.com/TanStack/table/discussions/4204
- Data Table Column Pinning Tutorial: https://dev.to/morewings/lets-create-data-table-part-4-column-pinning-5eb7

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from official docs, proven in production
- Architecture patterns: HIGH - TanStack Table patterns from official examples, Recharts from API docs
- Column pinning implementation: HIGH - Official sticky example exists, CSS pattern well-documented
- Expandable rows implementation: HIGH - Official expanding guide with examples
- Radar chart integration: HIGH - Recharts is standard React chart library with radar support
- Rich text editor choice: MEDIUM - Tiptap is rising standard but integration complexity varies
- Currency conversion pattern: HIGH - Already implemented in backend actuals endpoint
- Pitfalls: MEDIUM - Based on common issues in GitHub discussions, not exhaustive testing

**Research date:** 2026-02-09
**Valid until:** 60 days (stable technologies, slow-moving ecosystem)
