---
quick: 004
subsystem: frontend-ui
tags: [actuals, ui-redesign, receipts, progress-bar]
requires: [quick-003]
provides:
  - Cleaner actuals tab with receipts-only focus
  - Header stats with Total Receipts, Budget, Remaining
  - Visual progress bar showing budget usage percentage
  - Simplified receipts table with per-row and bulk delete
  - Receipts-only Excel export functionality
affects: []
tech-stack:
  added: []
  patterns:
    - AlertDialog for destructive confirmation (delete all)
    - Progress bar with dynamic color coding based on budget usage
    - Receipts-only actuals view (removed invoice visual)
key-files:
  created: []
  modified:
    - frontend/src/components/projects/tabs/ActualsTab.tsx
    - frontend/src/components/projects/ActualsTable.tsx
    - frontend/src/lib/actuals-api.ts
decisions:
  - decision: "Remove invoices from actuals tab visual"
    rationale: "Simplify UI to focus on receipts only - invoices noted in alert if attention needed"
  - decision: "Always load receipts on mount (no toggle)"
    rationale: "Simplify UX by removing show/hide toggle - receipts are core data for this tab"
  - decision: "Use AlertDialog for delete all confirmation"
    rationale: "Prevent accidental bulk deletion with explicit confirmation showing count"
  - decision: "Progress bar color codes based on percentage (green/orange/red)"
    rationale: "Visual indicator of budget health: green < 90%, orange 90-100%, red > 100%"
metrics:
  duration: "12m"
  completed: "2026-02-05"
---

# Quick Task 004: Redesign Actuals Tab

**One-liner:** Clean receipts-only actuals view with header stats, progress bar, simplified table, and bulk delete.

## Objective

Redesign the Actuals tab to show a cleaner receipts-only view with summary header, progress bar, and table with per-row delete plus bulk actions. Remove invoices from the visual display to simplify the interface.

## What Was Built

### 1. Header Stats Section (Task 1)

Replaced the old summary section with three prominent metrics in a row:
- **Total Receipts**: Formatted with inline currency (e.g., "GBP 12,500.00")
- **Budget**: Total budget allocation with currency
- **Remaining**: Budget remaining with color coding (red if negative/zero, green if positive)

### 2. Progress Bar (Task 1)

Added visual progress bar below header showing budget usage:
- Calculates percentage: `receipts / budget * 100`
- Color coding:
  - Green (primary): < 90% used
  - Orange: 90-100% used
  - Red (destructive): > 100% used (over budget)
- Shows percentage text above bar

### 3. Simplified Receipts Table (Task 2)

Rewrote ActualsTable as receipts-only component:
- **Removed**: Invoice handling, type badges, converted amount column
- **New columns**: ID, Date, Description, Amount, Currency, Delete
- **Column widths**: `[100px_100px_1fr_120px_60px_50px]`
- **Virtualization**: Kept for performance with 300px height container
- **Per-row delete**: Trash icon button in each row

### 4. Action Bar (Task 2)

Bottom action bar with two buttons:
- **Download Excel** (left): Exports receipts-only Excel file
- **Delete All Receipts** (right): Destructive style button for bulk delete

### 5. Delete All Functionality (Task 3)

Implemented bulk delete with safety measures:
- **Confirmation dialog**: AlertDialog shows count and warns action cannot be undone
- **Batch deletion**: Uses `Promise.all` to delete all receipts concurrently
- **Summary refresh**: Updates totals after deletion completes
- **Empty state**: Shows "No receipts recorded" when table empty

### 6. Export Function (Task 2)

Created `exportReceiptsExcel` function:
- Single sheet (Receipts only)
- Columns: Project ID, Project Name, Receipt Number, Amount, Currency, Date, Description, Import Batch, Created
- Filename: `{projectId}-receipts.xlsx`

## Key Changes

### Component Flow Simplification

**Before:**
- Summary shown always
- Toggle to show/hide details
- Fetch receipts and invoices on toggle
- Combined receipts + invoices table

**After:**
- Load summary and receipts on mount
- No toggle - table always visible
- Receipts-only table
- Invoices completely removed from visual (only alert if attention needed)

### State Management

Removed:
- `showDetails` state (no toggle)
- `invoices` state (receipts only)
- `detailsLoading` state (load on mount)
- Invoice type handling in delete function

Simplified:
- Single `receipts` state array
- `deleteAllOpen` state for confirmation dialog
- Combined fetch in single useEffect

## Technical Details

### Props Changes

**ActualsTable before:**
```typescript
{
  receipts: Receipt[];
  invoices: Invoice[];
  projectId: string;
  reportCurrency: string | null;
  onDelete: (type: 'receipt' | 'invoice', id: number) => void;
  disabled?: boolean;
}
```

**ActualsTable after:**
```typescript
{
  receipts: Receipt[];
  projectId: string;
  onDelete: (id: number) => void;
  onDeleteAll: () => void;
  disabled?: boolean;
}
```

### Delete All Implementation

```typescript
const handleDeleteAll = async () => {
  try {
    // Delete all receipts concurrently
    await Promise.all(receipts.map(r => deleteReceipt(r.id)));
    setReceipts([]);
    // Refresh summary
    const updatedSummary = await fetchProjectActualsSummary(project.id);
    setSummary(updatedSummary);
    setDeleteAllOpen(false);
  } catch (err) {
    console.error('Failed to delete all receipts:', err);
    setError(err instanceof Error ? err.message : 'Failed to delete all receipts');
    setDeleteAllOpen(false);
  }
};
```

## Verification Results

✅ Build succeeds with no TypeScript errors
✅ Header shows three stats with currency inline
✅ Progress bar renders with correct color coding
✅ Receipts table displays with simplified columns
✅ Per-row delete removes receipt and updates summary
✅ Download Excel exports receipts-only file
✅ Delete All shows confirmation dialog with count
✅ No invoices visible in the tab

## Files Modified

| File | Changes | Lines Changed |
|------|---------|---------------|
| `frontend/src/components/projects/tabs/ActualsTab.tsx` | Redesigned with header stats, progress bar, receipts-only focus, delete all dialog | ~240 → ~210 |
| `frontend/src/components/projects/ActualsTable.tsx` | Receipts-only table with simplified columns, action bar | ~193 → ~176 |
| `frontend/src/lib/actuals-api.ts` | Added `exportReceiptsExcel` function | +22 lines |

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | be5d50a | feat(quick-004): redesign actuals tab with header stats and progress bar |
| 2 | 01592ab | feat(quick-004): simplify actuals table to receipts-only with new columns |

## Decisions Made

### 1. Remove Invoices from Visual Display

**Decision:** Completely remove invoices from the actuals tab visual.

**Rationale:**
- Simplifies the interface significantly
- Receipts are the primary actuals data for project tracking
- Invoices only needed for competence month review (shown in alert if needed)
- Reduces cognitive load by focusing on one data type

**Impact:**
- Cleaner, more focused UI
- Easier to understand at a glance
- Invoice data still tracked in backend, just not in this view

### 2. Always Load Receipts on Mount

**Decision:** Load receipts immediately on mount, remove show/hide toggle.

**Rationale:**
- Toggle adds unnecessary interaction step
- Users visiting Actuals tab expect to see actuals data
- No performance concern - virtualization handles large lists
- Consistent with other tabs (budget, teams always show data)

**Impact:**
- One less click for users
- Simpler component logic
- More consistent UX across tabs

### 3. Progress Bar Color Coding

**Decision:** Use three-tier color system based on budget usage percentage.

**Colors:**
- Green (primary): < 90% used - healthy
- Orange: 90-100% used - approaching limit
- Red (destructive): > 100% used - over budget

**Rationale:**
- Provides immediate visual feedback on budget health
- Red for over budget matches user expectations (danger)
- Orange warning zone gives heads up before overspending
- Uses existing design system colors (primary, orange-500, destructive)

**Impact:**
- Budget status visible at a glance
- No need to calculate percentage mentally
- Aligns with common UI patterns for status indicators

### 4. Delete All with Confirmation

**Decision:** Use AlertDialog for delete all confirmation showing exact count.

**Rationale:**
- Bulk deletion is destructive and irreversible
- Showing count makes impact explicit ("delete all 47 receipts")
- AlertDialog is standard pattern for destructive actions
- Cancel button provides escape route if clicked accidentally

**Impact:**
- Prevents accidental data loss
- Clear communication of action impact
- Consistent with platform patterns (delete project uses same)

## Next Phase Readiness

### Strengths

✅ **Simplified UX**: Much cleaner interface focused on receipts
✅ **Visual feedback**: Progress bar provides immediate budget status
✅ **Safety**: Confirmation dialog prevents accidental bulk deletion
✅ **Performance**: Virtualization handles large receipt lists
✅ **Export**: Receipts-only Excel export for external analysis

### Notes

📝 **Invoice tracking**: Invoices still tracked in backend and API, just removed from this view. Alert shown if any need competence month review.

📝 **Delete All performance**: Uses `Promise.all` for concurrent deletion. For very large lists (100+ receipts), might want to consider batch deletion with progress indicator.

📝 **Empty state**: Shows "No receipts recorded" when empty. Could be enhanced with upload CTA button if needed.

## Alignment with Vision

This redesign aligns with the "sleek modern UI" goal from PROJECT.md by:
- Focusing on essential information (receipts, budget, remaining)
- Providing visual feedback (progress bar colors)
- Removing complexity (toggle, invoice mixing)
- Following established patterns (AlertDialog, virtualized table)

The clean, focused interface makes budget tracking more accessible and reduces cognitive load for users checking project actuals.
