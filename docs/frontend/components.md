# Component Documentation

## Component Tree Overview

```
App
  BrowserRouter
    DevAuthProvider
      AppContent
        AuthProvider (production only)
          PortfolioPage
            PortfolioHeader
              AlertsDropdown
            PortfolioToolbar
              FilterChips
              DensityToggle
              ColumnPicker
            PortfolioTable (via DraggableHeaderContext)
              TableHeader with DraggableHeader
              TableBody with virtualized rows
            BulkActionsToolbar
            ProjectSidebar (Sheet)
              ProjectHeader
              ProjectTabs
                GeneralTab
                PeopleTab
                TeamsTab
                ValueTab
                BudgetTab
                ActualsTab
                ChangeImpactTab
                CommitteeTab
                HistoryTab
              ProjectFooter
            CreateProjectDialog
            ActualsUploadDialog
          AdminLayout
            Outlet (nested admin pages)
              DataTable
              ReferentialForm
```

## UI Components (components/ui/)

Primitive components built on Radix UI with Tailwind styling. Follow the shadcn/ui pattern.

| Component | Source | Description |
|-----------|--------|-------------|
| button | Radix Slot | Variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon |
| input | Native | Styled text input |
| label | Radix Label | Form label |
| select | Radix Select | Dropdown select with trigger, content, item |
| checkbox | Radix Checkbox | Checkmark control |
| dialog | Radix Dialog | Modal overlay with header, content, footer |
| sheet | Radix Dialog | Slide-out panel (used for project sidebar) |
| alert-dialog | Radix AlertDialog | Confirmation modal |
| dropdown-menu | Radix DropdownMenu | Context menu |
| popover | Radix Popover | Positioned popup |
| hover-card | Radix HoverCard | Hover-triggered card |
| tabs | Radix Tabs | Tab navigation |
| tooltip | Radix Tooltip | Hover tooltip |
| collapsible | Radix Collapsible | Expand/collapse panel |
| slider | Radix Slider | Range input |
| command | cmdk | Command palette / autocomplete |
| table | Native | Table primitives (Table, TableHeader, TableBody, TableRow, TableHead, TableCell) |
| badge | Native | Colored label |
| alert | Native | Alert box |
| skeleton | Native | Loading placeholder |
| textarea | Native | Multi-line text input |

### Button Props Pattern

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean  // Render as child component (Radix Slot)
}
```

Variants controlled via `class-variance-authority`:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: { default, destructive, outline, secondary, ghost, link },
      size: { default, sm, lg, icon },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

## Portfolio Components (components/portfolio/)

### PortfolioTable
Main data table using TanStack Table with virtual scrolling.

**Props:**
```typescript
interface PortfolioTableProps {
  data: PortfolioProject[];
  loading?: boolean;
  onRowClick?: (project: PortfolioProject) => void;
  selectedProjectId?: number | null;
}
```

**Features:**
- Virtual scrolling via `useVirtualizer`
- Multi-column sorting (Shift+click)
- Column visibility toggling
- Column reordering via drag-and-drop
- Row selection with checkboxes
- Persisted state (sorting, visibility, order, density) via `useTableState`

### Column Components (columns/)

| Component | Column | Description |
|-----------|--------|-------------|
| ValueScoreCell | valueScore | Mini radar chart showing outcome scores |
| EffortCell | effort | Team count with t-shirt sizes breakdown |
| ImpactCell | impact | Change impact teams count |
| BudgetHealthCell | budgetHealth | Progress bar with spent/budget |
| CommitteeCell | committee | Step indicator (state + level) |
| DateRangeCell | dates | Formatted date range |
| CostTshirtCell | costTshirt | T-shirt size badge |
| LastActivityCell | lastActivity | Relative time (e.g., "2 days ago") |

### PortfolioToolbar
Search, filters, and actions toolbar.

**Props:**
```typescript
interface PortfolioToolbarProps {
  table: Table<PortfolioProject>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  columnFilters: ColumnFiltersState;
  density: Density;
  onDensityChange: (density: Density) => void;
  onNewProject: () => void;
  statusOptions: { id: number; name: string; color: string }[];
  teamOptions: { id: number; name: string }[];
  columnOrder: string[];
  onResetColumnOrder: () => void;
}
```

### FilterPopover
Column-specific filter control rendered in headers.

### DraggableHeader / DraggableHeaderContext
Drag-and-drop column reordering using dnd-kit.

### DensityToggle
Toggle between `comfortable` (53px rows) and `compact` (37px rows).

### ColumnPicker
Checkbox list to show/hide columns.

### BulkActionsToolbar
Actions for selected rows (shown when rows are selected).

### PortfolioHeader
Top navigation bar with alerts dropdown and upload button.

## Project Components (components/projects/)

### ProjectSidebar
Slide-out panel for viewing/editing a project. Uses Radix Dialog as sheet.

**Props:**
```typescript
interface ProjectSidebarProps {
  projectId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: () => void;
  onDeleted?: () => void;
  defaultTab?: string;
}
```

**Features:**
- Auto-save with debounce via `useAutoSave`
- Conflict detection and resolution (409 handling)
- Read-only mode for stopped/completed projects

### ProjectTabs
Tab container for project detail sections.

**Tabs:**
- General: Status, dates, lead team, description, business case
- People: PM, IS Owner, Sponsor
- Teams (Effort): Team assignments with t-shirt sizes
- Value: Outcome scores with radar chart
- Budget: OPEX/CAPEX budgets by line
- Actuals: Uploaded actual costs
- Change Impact: Impacted teams
- Committee: Committee level and state
- History: Activity log

### Tab Component Props Pattern

```typescript
interface TabProps {
  project: Project;
  formData: Partial<Project>;
  onChange: (updates: Partial<Project>) => void;
  onProjectUpdated?: () => void;
  disabled?: boolean;
}
```

### ConflictDialog
Modal for resolving optimistic concurrency conflicts.

### CreateProjectDialog
Modal form for creating new projects.

### DescriptionEditor
Tiptap-based rich text editor for project description.

## Admin Components (components/admin/)

### DataTable
Generic CRUD table component using TanStack Table.

**Props:**
```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onAdd?: () => void;
  addButtonLabel?: string;
  filterPlaceholder?: string;
  emptyMessage?: string;
}
```

### ReferentialForm
Dialog form for creating/editing referential data entities.

### BulkImportDialog
Excel file upload for bulk importing referential data.

### UsageDrawer
Side drawer showing where a referential item is used (projects using it).

## Authentication Components

### AuthProvider
Wraps app with `MsalProvider` and handles session validation on load.

### DevAuthProvider
Detects dev mode (backend returns dev user without token) and provides context.

### LoginButton
Azure AD sign-in button using MSAL redirect flow.

### UserMenu
Dropdown showing user info and sign-out option.

## Shared Component Patterns

### cn() Utility
All components use `cn()` from `@/lib/utils` for conditional class merging:
```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  props.className
)} />
```

### forwardRef Pattern
UI primitives use `React.forwardRef` for ref forwarding:
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // ...
  }
);
Button.displayName = "Button";
```

### Controlled Components
Form components follow controlled pattern with value/onChange props or similar.
