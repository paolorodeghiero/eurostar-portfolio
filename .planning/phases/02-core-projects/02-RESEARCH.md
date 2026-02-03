# Phase 2: Core Projects - Research

**Researched:** 2026-02-03
**Domain:** Project management UI (sidebar overlays, auto-save forms, multi-tab editing), optimistic locking, complex form patterns
**Confidence:** HIGH

## Summary

Phase 2 builds on the Phase 1 foundation to enable complete project management with multi-dimensional scoring. The research focuses on implementing a Linear-style sidebar overlay for project editing, auto-save with debounce patterns, optimistic locking for concurrent editing, and complex form components for team selection and value scoring.

Key findings:
- shadcn/ui Sheet component provides the sidebar overlay foundation with slide-in animation from right edge
- Auto-save requires a combination of debounce hooks (2-3 second delay), `useRef` for timer stability, and state machine for save status tracking
- Optimistic locking in Drizzle ORM requires manual implementation with version column and conditional WHERE clause
- shadcn/ui Tabs with `orientation="vertical"` creates the 5-tab layout pattern (General, People, Teams, Value, Change Impact)
- Combobox + Badge components combine for team chip selection with T-shirt size dropdowns
- Slider component works for 1-5 scoring with `min={1} max={5} step={1}`

**Primary recommendation:** Use shadcn/ui Sheet (side="right", ~500px width) with vertical Tabs inside, implement custom useAutoSave hook with debounce and save status state machine, add version column to projects table for optimistic locking with 409 Conflict responses.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | Latest | Sheet, Tabs, Slider, Combobox, DropdownMenu components | Already established in Phase 1, consistent design system |
| @tanstack/react-table | Latest | Portfolio table (already built in Phase 1) | Existing pattern for project listing |
| drizzle-orm | Latest | Database access, schema, queries | Already established in Phase 1 |
| react-router-dom | Latest | Routing, navigation | Already established in Phase 1 |

### New Components to Add
| Component | Installation | Purpose | When to Use |
|-----------|--------------|---------|-------------|
| Sheet | `npx shadcn@latest add sheet` | Sidebar overlay from right edge | Project edit panel |
| Tabs | `npx shadcn@latest add tabs` | Vertical tab navigation | 5 sections in sidebar |
| Slider | `npx shadcn@latest add slider` | 1-5 value scoring | Value tab outcome scoring |
| Combobox | `npx shadcn@latest add combobox` | Searchable team selection | Lead team picker |
| Tooltip | `npx shadcn@latest add tooltip` | Disabled button explanations | Delete disabled tooltip |
| Alert Dialog | `npx shadcn@latest add alert-dialog` | Delete confirmation, conflict resolution | Destructive actions |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | Latest | Debounced callbacks for auto-save | Alternative to custom hook |
| lucide-react | Latest (already installed) | Icons for UI | Menu, close, status indicators |

**Installation:**
```bash
# Add new shadcn/ui components
npx shadcn@latest add sheet tabs slider combobox tooltip alert-dialog

# Optional: use-debounce for stable debounce hook
npm install use-debounce
```

## Architecture Patterns

### Recommended Project Structure Addition
```
frontend/src/
├── components/
│   ├── projects/
│   │   ├── ProjectSidebar.tsx         # Sheet wrapper with tabs
│   │   ├── ProjectHeader.tsx          # Sticky header with ID, name, status, menu
│   │   ├── ProjectFooter.tsx          # Sticky footer with save status
│   │   ├── tabs/
│   │   │   ├── GeneralTab.tsx         # Core fields (name, dates, lead team)
│   │   │   ├── PeopleTab.tsx          # PM, IS Owner, Sponsor autocomplete
│   │   │   ├── TeamsTab.tsx           # Involved teams with T-shirt sizes
│   │   │   ├── ValueTab.tsx           # Outcome scoring cards
│   │   │   └── ChangeImpactTab.tsx    # Change impact teams
│   │   ├── TeamChip.tsx               # Team chip with size dropdown
│   │   ├── ValueScoreCard.tsx         # Collapsible outcome scoring card
│   │   └── ConflictDialog.tsx         # Side-by-side version comparison
│   └── ui/                            # shadcn components (existing)
├── hooks/
│   ├── useAutoSave.ts                 # Debounced auto-save with status
│   └── useOptimisticLock.ts           # Version conflict handling
├── pages/
│   └── portfolio/
│       └── PortfolioPage.tsx          # Main page with table + sidebar
└── lib/
    └── project-api.ts                 # Project-specific API functions

backend/src/
├── db/
│   └── schema.ts                      # Add projects + related tables
├── routes/
│   └── projects/
│       ├── index.ts                   # Router composition
│       ├── projects.ts                # Project CRUD with optimistic lock
│       ├── project-teams.ts           # Involved teams CRUD
│       ├── project-values.ts          # Value scores CRUD
│       └── project-change-impact.ts   # Change impact CRUD
└── lib/
    └── project-id-generator.ts        # PRJ-YYYY-INC ID generation
```

### Pattern 1: Sidebar Overlay with Sheet
**What:** Right-sliding Sheet component wrapping project edit form
**When to use:** Project view/edit interactions

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/sheet
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ProjectSidebarProps {
  projectId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSidebar({ projectId, open, onOpenChange }: ProjectSidebarProps) {
  // Auto-save on close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      saveProject(); // Trigger save before close
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-[500px] sm:w-[540px] p-0 flex flex-col"
        showCloseButton={false} // Custom header with close
      >
        <ProjectHeader project={project} onClose={() => onOpenChange(false)} />
        <div className="flex-1 overflow-auto">
          <ProjectTabs project={project} onChange={handleChange} />
        </div>
        <ProjectFooter saveStatus={saveStatus} />
      </SheetContent>
    </Sheet>
  );
}
```

### Pattern 2: Vertical Tabs with Completion Indicators
**What:** 5-tab vertical layout with completion % and error badges
**When to use:** Project edit form sections

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/tabs
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const tabs = [
  { id: 'general', label: 'General', completion: 100, errors: 0 },
  { id: 'people', label: 'People', completion: 66, errors: 0 },
  { id: 'teams', label: 'Teams', completion: 50, errors: 1 },
  { id: 'value', label: 'Value', completion: 80, errors: 0 },
  { id: 'change-impact', label: 'Change Impact', completion: 0, errors: 0 },
];

function ProjectTabs({ project, onChange }) {
  return (
    <Tabs defaultValue="general" orientation="vertical" className="flex h-full">
      <TabsList className="flex flex-col h-auto w-48 shrink-0 border-r p-2 space-y-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="w-full justify-start px-3 py-2"
          >
            <span className="flex-1 text-left">{tab.label}</span>
            <span className="text-xs text-muted-foreground">{tab.completion}%</span>
            {tab.errors > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {tab.errors}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="flex-1 p-4 overflow-auto">
        <TabsContent value="general"><GeneralTab project={project} onChange={onChange} /></TabsContent>
        <TabsContent value="people"><PeopleTab project={project} onChange={onChange} /></TabsContent>
        <TabsContent value="teams"><TeamsTab project={project} onChange={onChange} /></TabsContent>
        <TabsContent value="value"><ValueTab project={project} onChange={onChange} /></TabsContent>
        <TabsContent value="change-impact"><ChangeImpactTab project={project} onChange={onChange} /></TabsContent>
      </div>
    </Tabs>
  );
}
```

### Pattern 3: Auto-Save Hook with Debounce and Status
**What:** Custom hook managing debounced saves with status state machine
**When to use:** Project form auto-save

**Example:**
```typescript
// Source: https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e
// Source: https://www.developerway.com/posts/debouncing-in-react
import { useRef, useCallback, useState, useEffect } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // Default 2000ms
  enabled?: boolean;
}

export function useAutoSave<T>({ data, onSave, delay = 2000, enabled = true }: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<T>(data);
  const onSaveRef = useRef(onSave);

  // Keep onSave callback fresh to avoid stale closures
  onSaveRef.current = onSave;

  const save = useCallback(async (dataToSave: T) => {
    setStatus('saving');
    setError(null);

    try {
      await onSaveRef.current(dataToSave);
      lastSavedRef.current = dataToSave;
      setStatus('saved');

      // Return to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setStatus('error');
    }
  }, []);

  // Debounced effect
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return;
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      save(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Immediate save (for close/blur)
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (JSON.stringify(data) !== JSON.stringify(lastSavedRef.current)) {
      save(data);
    }
  }, [data, save]);

  // Status text for footer
  const statusText = {
    idle: '',
    saving: 'Saving...',
    saved: 'Saved',
    error: `Error: ${error}`,
  }[status];

  return { status, statusText, error, saveNow };
}
```

### Pattern 4: Optimistic Locking with Version Field
**What:** Version column check during updates, 409 on conflict
**When to use:** Project updates (both GUI and API)

**Schema:**
```typescript
// Source: Drizzle ORM documentation + optimistic locking best practices
import { pgTable, integer, varchar, timestamp } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar('project_id', { length: 20 }).notNull().unique(), // PRJ-2026-00001
  name: varchar('name', { length: 255 }).notNull(),
  // ... other fields
  version: integer('version').notNull().default(1), // Optimistic lock
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Backend Update:**
```typescript
// Source: https://orm.drizzle.team/docs/update
import { eq, and, sql } from 'drizzle-orm';

async function updateProject(
  db: Database,
  projectId: number,
  updates: Partial<Project>,
  expectedVersion: number
) {
  const result = await db
    .update(projects)
    .set({
      ...updates,
      version: sql`${projects.version} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.version, expectedVersion) // Only if version matches
      )
    )
    .returning();

  if (result.length === 0) {
    // Either not found or version conflict
    const [current] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!current) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    // Version conflict - return current state for comparison
    throw {
      statusCode: 409,
      message: 'Version conflict',
      currentVersion: current.version,
      currentData: current,
    };
  }

  return result[0];
}
```

**Frontend Conflict Handler:**
```typescript
// Conflict resolution state
const [conflictState, setConflictState] = useState<{
  localData: Project;
  serverData: Project;
} | null>(null);

async function handleSave(data: Project) {
  try {
    await apiClient(`/api/projects/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, expectedVersion: data.version }),
    });
  } catch (error) {
    if (error.statusCode === 409) {
      // Show conflict resolution dialog
      setConflictState({
        localData: data,
        serverData: error.currentData,
      });
    } else {
      throw error;
    }
  }
}
```

### Pattern 5: Team Chip with T-Shirt Size Dropdown
**What:** Badge/chip component with inline size selector
**When to use:** Involved teams and change impact teams

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/combobox
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";

const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

interface TeamChipProps {
  team: { id: number; name: string };
  size: string;
  isLead?: boolean;
  onSizeChange: (size: string) => void;
  onRemove?: () => void;
}

export function TeamChip({ team, size, isLead, onSizeChange, onRemove }: TeamChipProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full border px-3 py-1",
      isLead && "bg-eurostar-teal/10 border-eurostar-teal"
    )}>
      <span className="text-sm font-medium">{team.name}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80 ml-1"
          >
            {size}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {TSHIRT_SIZES.map((s) => (
            <DropdownMenuItem key={s} onClick={() => onSizeChange(s)}>
              {s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {!isLead && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
```

### Pattern 6: Value Score Card with Slider
**What:** Collapsible card showing outcome score with expandable edit mode
**When to use:** Value tab scoring interface

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/slider
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ValueScoreCardProps {
  outcome: {
    id: number;
    name: string;
    score1Example: string;
    score2Example: string;
    score3Example: string;
    score4Example: string;
    score5Example: string;
  };
  score: number;
  justification: string;
  onChange: (score: number, justification: string) => void;
}

// Dot visualization for collapsed state
function ScoreDots({ score }: { score: number }) {
  return (
    <span className="font-mono">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < score ? 'text-eurostar-teal' : 'text-gray-300'}>
          {i < score ? '●' : '○'}
        </span>
      ))}
    </span>
  );
}

export function ValueScoreCard({ outcome, score, justification, onChange }: ValueScoreCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exampleText = {
    1: outcome.score1Example,
    2: outcome.score2Example,
    3: outcome.score3Example,
    4: outcome.score4Example,
    5: outcome.score5Example,
  }[score] || '';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full p-4 border rounded-lg hover:bg-gray-50 text-left">
        <div className="flex justify-between items-center">
          <span className="font-medium">{outcome.name}</span>
          <ScoreDots score={score} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="p-4 border border-t-0 rounded-b-lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Score (1-5)</label>
            <Slider
              value={[score]}
              onValueChange={([v]) => onChange(v, justification)}
              min={1}
              max={5}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 - Minimal</span>
              <span>5 - Transformational</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
            <strong>Example for score {score}:</strong> {exampleText}
          </div>

          <div>
            <label className="text-sm font-medium">Justification (optional)</label>
            <textarea
              value={justification}
              onChange={(e) => onChange(score, e.target.value)}
              className="w-full mt-1 p-2 border rounded-md text-sm"
              rows={3}
              placeholder="Why did you choose this score?"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Pattern 7: Project ID Generation (PRJ-YYYY-INC)
**What:** Auto-generate project IDs in format PRJ-YYYY-00001
**When to use:** Project creation

**Backend Implementation:**
```typescript
// PostgreSQL function + sequence approach
import { sql } from 'drizzle-orm';

// Create sequence for each year (done via migration)
// CREATE SEQUENCE project_id_seq_2026 START 1;

async function generateProjectId(db: Database): Promise<string> {
  const year = new Date().getFullYear();

  // Get next sequence value
  const [result] = await db.execute(
    sql`SELECT nextval(${`project_id_seq_${year}`}::regclass) as seq`
  );

  const seq = (result as { seq: bigint }).seq;
  const paddedSeq = String(seq).padStart(5, '0');

  return `PRJ-${year}-${paddedSeq}`;
}

// Alternative: Use a counter table
export const projectIdCounters = pgTable('project_id_counters', {
  year: integer('year').primaryKey(),
  lastId: integer('last_id').notNull().default(0),
});

async function generateProjectIdWithTable(db: Database): Promise<string> {
  const year = new Date().getFullYear();

  // Upsert and return new value atomically
  const [result] = await db
    .insert(projectIdCounters)
    .values({ year, lastId: 1 })
    .onConflictDoUpdate({
      target: projectIdCounters.year,
      set: { lastId: sql`${projectIdCounters.lastId} + 1` },
    })
    .returning({ lastId: projectIdCounters.lastId });

  const paddedSeq = String(result.lastId).padStart(5, '0');
  return `PRJ-${year}-${paddedSeq}`;
}
```

### Anti-Patterns to Avoid

- **Re-creating debounced function on each render:** Always use `useCallback` or `useRef` to stabilize debounced save functions. Without this, debouncing doesn't work.
- **Saving on every keystroke without debounce:** Network floods and poor UX. Always debounce auto-save.
- **Ignoring version conflicts:** Silent overwrites lose data. Always check version and show conflict dialog.
- **Using setTimeout ID in state:** `useRef` is the correct place for timer IDs, not `useState`.
- **Auto-saving invalid data:** Validate before save, show inline errors, block save on validation failure.
- **Relying on Sheet `onOpenChange` alone for close:** Escape key and click-outside need separate handling for auto-save.
- **Multiple `useState` calls for form state:** Use `useReducer` or a form library for complex forms with many related fields.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced callbacks | Custom setTimeout logic | `use-debounce` library or stable custom hook | Edge cases with stale closures, cleanup, re-renders |
| Slide-in sidebar | Custom CSS animation | shadcn/ui Sheet component | Accessibility, focus management, animation handled |
| Vertical tabs | Custom tab implementation | shadcn/ui Tabs with `orientation="vertical"` | Keyboard navigation, ARIA, state management |
| Combobox/autocomplete | Custom dropdown with search | shadcn/ui Combobox | Filter logic, keyboard nav, accessibility |
| 1-5 slider | Custom range input | shadcn/ui Slider with `min={1} max={5} step={1}` | Touch support, accessibility, styling |
| Conflict resolution UI | Custom comparison view | AlertDialog with structured layout | Focus management, modal patterns |
| Form validation | Manual error checking | Zod + controlled inputs | Type-safe, declarative rules |
| State machine for save status | Multiple `useState` booleans | Single status state or useReducer | Impossible states prevented |

**Key insight:** shadcn/ui provides composable primitives that handle accessibility, keyboard navigation, and animation. The auto-save pattern requires careful debounce implementation to avoid stale closures and unnecessary re-renders.

## Common Pitfalls

### Pitfall 1: Stale Closures in Debounced Save
**What goes wrong:** Debounced save function captures old form state, saving stale data
**Why it happens:** JavaScript closures capture variable values at creation time; without `useRef` or proper dependencies, the callback sees old data
**How to avoid:**
- Store save callback in `useRef` and update it on each render
- Use `useRef` for the data to save, updated in the effect
- Or use libraries like `use-debounce` that handle this correctly
**Warning signs:** Saved data is missing recent changes, inconsistent save behavior

### Pitfall 2: Race Condition Between Auto-Save and Manual Close
**What goes wrong:** User closes sidebar while auto-save is pending; data may be lost or double-saved
**Why it happens:** Multiple async operations without coordination
**How to avoid:**
- Cancel pending timeout on close, then immediately trigger save
- Wait for in-progress save to complete before closing
- Track "save in progress" state to prevent concurrent saves
**Warning signs:** Data loss on quick close, duplicate API calls

### Pitfall 3: Optimistic Lock Version Mismatch After Create
**What goes wrong:** Newly created project immediately shows version conflict on first edit
**Why it happens:** Frontend doesn't receive the initial version value from create response
**How to avoid:**
- Always return full project object (including version) from create endpoint
- Update frontend state with returned data, not just local copy
**Warning signs:** 409 errors immediately after project creation

### Pitfall 4: Sheet Focus Trap Breaks Tab Navigation
**What goes wrong:** Keyboard users can't navigate between tabs inside the Sheet
**Why it happens:** Sheet's focus trap can interfere with Tabs keyboard navigation
**How to avoid:**
- Test keyboard navigation thoroughly
- Ensure TabsList and TabsTriggers are within focus trap correctly
- Use proper DOM structure (TabsList before TabsContent)
**Warning signs:** Arrow keys don't switch tabs, focus escapes the sheet

### Pitfall 5: Team Chip Dropdown Closes Sheet
**What goes wrong:** Clicking dropdown in team chip closes the entire Sheet overlay
**Why it happens:** Event bubbling causes Sheet to interpret click as "outside" click
**How to avoid:**
- Use `stopPropagation()` on dropdown trigger events
- Ensure DropdownMenu is rendered in a portal (default behavior)
- Test click interactions thoroughly
**Warning signs:** Dropdown opens briefly then entire sidebar closes

### Pitfall 6: Auto-Save Saves Invalid Data
**What goes wrong:** Incomplete or invalid project data is saved, corrupting database state
**Why it happens:** Auto-save triggers on any change without validation
**How to avoid:**
- Validate before save in the auto-save hook
- Only auto-save when form is valid (no validation errors)
- Show validation errors inline, never save invalid state
**Warning signs:** Database contains partial/invalid records, API returns 400 errors

### Pitfall 7: Tooltip on Disabled DropdownMenuItem
**What goes wrong:** Can't show "Cannot delete: has actuals" tooltip on disabled delete option
**Why it happens:** Disabled elements don't receive mouse events; Radix tooltip doesn't work on disabled items
**How to avoid:**
- Wrap disabled item in a `<span>` and apply tooltip to the wrapper
- Or use a non-disabled item with custom styling and click prevention
- Test hover behavior on disabled items
**Warning signs:** No tooltip appears on hover over disabled delete button

## Code Examples

Verified patterns from official sources:

### Complete Auto-Save Integration
```typescript
// Source: Combined from https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e and https://www.developerway.com/posts/debouncing-in-react

function ProjectSidebar({ projectId, open, onOpenChange }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData | null>(null);

  // Load project data
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId).then((p) => {
        setProject(p);
        setFormData(projectToFormData(p));
      });
    }
  }, [projectId]);

  // Auto-save hook
  const { status, statusText, saveNow } = useAutoSave({
    data: formData,
    onSave: async (data) => {
      if (!project) return;
      const updated = await updateProject(project.id, data, project.version);
      setProject(updated); // Update version for next save
    },
    delay: 2500, // 2.5 second debounce
    enabled: !!project && !!formData,
  });

  // Handle close - save first
  const handleClose = () => {
    saveNow(); // Immediate save
    onOpenChange(false);
  };

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleClose]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right" className="w-[500px] p-0 flex flex-col">
        <ProjectHeader project={project} onClose={handleClose} />
        <div className="flex-1 overflow-auto">
          {formData && (
            <ProjectTabs
              formData={formData}
              onChange={setFormData}
              validationErrors={validationErrors}
            />
          )}
        </div>
        <ProjectFooter statusText={statusText} status={status} />
      </SheetContent>
    </Sheet>
  );
}
```

### Conflict Resolution Dialog
```typescript
// Source: Optimistic locking pattern + AlertDialog
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ConflictDialogProps {
  open: boolean;
  localData: Project;
  serverData: Project;
  onKeepLocal: () => void;
  onKeepServer: () => void;
  onCancel: () => void;
}

export function ConflictDialog({
  open, localData, serverData, onKeepLocal, onKeepServer, onCancel
}: ConflictDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Save Conflict</AlertDialogTitle>
          <AlertDialogDescription>
            This project was modified by someone else while you were editing.
            Choose which version to keep.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Your Version</h4>
            <p className="text-sm text-muted-foreground">
              Last edited by you just now
            </p>
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
              {JSON.stringify(localData, null, 2)}
            </pre>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Server Version</h4>
            <p className="text-sm text-muted-foreground">
              Modified by {serverData.updatedBy} at {formatDate(serverData.updatedAt)}
            </p>
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
              {JSON.stringify(serverData, null, 2)}
            </pre>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="outline" onClick={onKeepServer}>
            Keep Server Version
          </AlertDialogAction>
          <AlertDialogAction onClick={onKeepLocal}>
            Keep My Version
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Three-Dot Menu with Disabled Tooltip Workaround
```typescript
// Source: https://github.com/shadcn-ui/ui/issues/1022 workaround
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreVertical, Square, Trash2, RotateCcw } from "lucide-react";

function ProjectMenu({ project, onStop, onReactivate, onDelete }: Props) {
  const hasActuals = project.actualsCount > 0;
  const isStopped = project.status === 'stopped';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isStopped && (
          <DropdownMenuItem onClick={onStop}>
            <Square className="h-4 w-4 mr-2" />
            Stop Project
          </DropdownMenuItem>
        )}

        {isStopped && (
          <DropdownMenuItem onClick={onReactivate}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reactivate
          </DropdownMenuItem>
        )}

        {/* Workaround: Wrap in span for tooltip on disabled item */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DropdownMenuItem
                onClick={onDelete}
                disabled={hasActuals}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </span>
          </TooltipTrigger>
          {hasActuals && (
            <TooltipContent>
              Cannot delete: project has {project.actualsCount} actual(s) recorded
            </TooltipContent>
          )}
        </Tooltip>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual setTimeout debounce | `use-debounce` library or stable custom hook with useRef | 2023+ | Eliminates stale closure bugs |
| CSS slide animations | Radix Sheet with built-in animations | 2022+ | Better accessibility, focus management |
| Radio buttons for scoring | Slider component with discrete steps | 2024+ | Better UX for 1-5 scoring |
| Last-write-wins | Optimistic locking with version field | Standard practice | Prevents silent data loss |
| Save button workflows | Auto-save with debounce | 2023+ (Linear/Notion style) | Better UX, no lost changes |
| Modal dialogs for editing | Sidebar/sheet overlays | 2024+ (Linear style) | Context preserved, better flow |

**Deprecated/outdated:**
- **Formik for auto-save:** While Formik works, modern patterns use simpler hooks or React Hook Form
- **Redux for form state:** Local state with hooks preferred for form management
- **Polling for conflict detection:** Optimistic locking at save time is standard

## Open Questions

Things that couldn't be fully resolved:

1. **Exact debounce timing**
   - What we know: 2-3 seconds per CONTEXT.md, research shows 1-2 seconds common
   - What's unclear: Optimal value for this specific UX
   - Recommendation: Start with 2500ms, adjust based on user feedback

2. **Conflict resolution UX refinement**
   - What we know: Side-by-side comparison required per CONTEXT.md
   - What's unclear: Exactly what fields to highlight as different, merge capabilities
   - Recommendation: Show JSON diff initially, iterate on field-by-field comparison

3. **Project ID sequence per year reset**
   - What we know: Format is PRJ-YYYY-INC
   - What's unclear: Should sequence reset to 1 each year, or continue globally?
   - Recommendation: Reset per year (e.g., PRJ-2026-00001, PRJ-2027-00001) - use counter table approach

4. **Validation blocking auto-save vs immediate feedback**
   - What we know: "Validation errors block save and show inline" per CONTEXT.md
   - What's unclear: Should invalid fields prevent any save, or save valid fields?
   - Recommendation: Block all save when any validation error exists, show errors inline immediately

## Sources

### Primary (HIGH confidence)
- [shadcn/ui Sheet Documentation](https://ui.shadcn.com/docs/components/sheet) - Official docs
- [shadcn/ui Tabs Documentation](https://ui.shadcn.com/docs/components/tabs) - Official docs
- [shadcn/ui Slider Documentation](https://ui.shadcn.com/docs/components/slider) - Official docs
- [shadcn/ui Combobox Documentation](https://ui.shadcn.com/docs/components/combobox) - Official docs
- [shadcn/ui DropdownMenu Documentation](https://ui.shadcn.com/docs/components/dropdown-menu) - Official docs
- [Drizzle ORM Update Documentation](https://orm.drizzle.team/docs/update) - Official docs

### Secondary (MEDIUM confidence)
- [React Debounce Patterns](https://www.developerway.com/posts/debouncing-in-react) - Comprehensive guide on debounce pitfalls
- [useAutoSave Hook with Debounce](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e) - Auto-save pattern
- [Optimistic Locking Implementation](https://medium.com/@gaddamnaveen192/understanding-optimistic-locking-a-key-to-handling-data-conflicts-63c086b850d5) - Version field pattern
- [shadcn/ui Tooltip on Disabled Elements Issue](https://github.com/shadcn-ui/ui/issues/1022) - Workaround for disabled tooltips

### Tertiary (LOW confidence)
- Various StackOverflow discussions on project ID generation patterns
- Community patterns for Linear-style UIs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing shadcn/ui components already established in Phase 1
- Architecture patterns: HIGH - Based on official shadcn/ui documentation and established React patterns
- Auto-save implementation: MEDIUM-HIGH - Patterns well-documented, but integration requires testing
- Optimistic locking: MEDIUM - Standard pattern, but Drizzle ORM doesn't have built-in support

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - UI patterns stable, component versions may update)

**Key areas requiring validation:**
- Debounce timing may need adjustment based on user testing
- Conflict resolution UX may need iteration
- Sheet + Tabs keyboard navigation needs thorough testing
