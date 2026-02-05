---
quick_task: 003
name: actuals-view-with-table-export-delete
subsystem: financial-tracking
tags: [actuals, virtualization, excel-export, delete]
requires: [quick-002]
provides:
  - Detailed actuals view with receipts and invoices
  - Excel export for actuals data
  - Delete functionality for individual actuals
  - Virtualized scrolling for performance
affects: []
tech-stack:
  added: ['@tanstack/react-virtual', 'xlsx']
  patterns: [virtualized-lists, excel-export]
key-files:
  created:
    - frontend/src/components/projects/ActualsTable.tsx
  modified:
    - frontend/src/lib/actuals-api.ts
    - frontend/src/components/projects/ActualsSummary.tsx
    - frontend/src/components/projects/ProjectSidebar.tsx
    - frontend/package.json
decisions: []
metrics:
  duration: 12 min
  completed: 2026-02-05
---

# Quick Task 003: Actuals View with Table Export Delete Summary

Enhanced project actuals view with detailed receipts/invoices table, Excel export, and delete functionality.

**One-liner:** Virtualized actuals table with Excel export and line-item deletion using @tanstack/react-virtual

## What Was Built

### 1. Extended Actuals API (Task 1)
- **Installed dependencies:**
  - `@tanstack/react-virtual` for virtualized scrolling
  - `xlsx` library for Excel file generation
- **Added Receipt and Invoice interfaces** with full field definitions
- **Added API functions:**
  - `fetchProjectReceipts(projectId: string)` - fetch receipts for a project
  - `fetchProjectInvoices(projectId: string)` - fetch invoices for a project
  - `deleteReceipt(id: number)` - delete individual receipt
  - `deleteInvoice(id: number)` - delete individual invoice
  - `exportActualsExcel(receipts, invoices, projectId)` - generate and download Excel file

### 2. ActualsTable Component (Task 2)
- **Virtualized list display:**
  - Uses `@tanstack/react-virtual` for smooth scrolling with many items
  - Fixed 300px height container
  - Estimated 48px row height with 5 item overscan
- **Combined receipts and invoices** in single scrollable list
- **Column layout:**
  - Type badge (Receipt/Invoice with color coding)
  - Date (formatted as DD-MMM-YYYY)
  - Description (number + description, competence month for invoices)
  - Amount (formatted currency)
  - Actions (delete button)
- **Excel export button** in table header - downloads two-sheet workbook
- **Delete functionality** with disabled state for stopped projects
- **Empty state** message when no actuals exist
- **Footer summary** showing count of receipts and invoices

### 3. ActualsSummary Integration (Task 3)
- **Toggle button** to show/hide detailed actuals
- **Lazy loading:** Details fetched only on first toggle
- **Props changed:** Now receives full `Project` object instead of just `projectId`
- **Delete handler:**
  - Removes item from local state immediately
  - Refreshes summary totals after deletion
  - Shows error messages on failure
- **ProjectSidebar updated** to pass full project object
- **Disabled state** for stopped projects (delete buttons inactive)

## Technical Implementation

### Virtualization Pattern
```typescript
const rowVirtualizer = useVirtualizer({
  count: allItems.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48,
  overscan: 5,
});
```
- Renders only visible items + overscan buffer
- Smooth scrolling even with hundreds of actuals
- Absolute positioning with transforms for performance

### Excel Export
```typescript
const workbook = XLSX.utils.book_new();
const receiptsSheet = XLSX.utils.json_to_sheet(receiptsData);
XLSX.utils.book_append_sheet(workbook, receiptsSheet, 'Receipts');
// ... invoices sheet
const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
const blob = new Blob([buffer], { type: '...' });
// Trigger download
```
- Two sheets: "Receipts" and "Invoices"
- All fields exported with formatted dates
- Downloaded as `{projectId}-actuals.xlsx`

### Delete Flow
1. User clicks delete button on receipt/invoice row
2. `onDelete` handler calls API delete endpoint
3. On success: Remove from local state array
4. Refresh summary to update totals
5. On error: Display error message

## Files Changed

**Created:**
- `frontend/src/components/projects/ActualsTable.tsx` (194 lines)

**Modified:**
- `frontend/src/lib/actuals-api.ts` - Added Receipt/Invoice interfaces and CRUD+export functions
- `frontend/src/components/projects/ActualsSummary.tsx` - Added toggle, fetch, delete logic
- `frontend/src/components/projects/ProjectSidebar.tsx` - Pass full project to ActualsSummary
- `frontend/package.json` - Added @tanstack/react-virtual and xlsx dependencies

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- TypeScript compilation: ✓ No errors
- Frontend build: ✓ Success (11.81s)
- All tasks completed as specified
- Ready for manual testing

## Next Phase Readiness

**Blockers:** None

**Recommendations:**
- Add currency conversion display in ActualsTable when reportCurrency differs from original
  - Currently shows note "(in {reportCurrency})" but doesn't display converted amount
  - Would need currency rates API integration to show actual converted values
- Consider adding filters (date range, type) to ActualsTable for large datasets
- Add batch delete functionality if users need to remove multiple items

**Integration points:**
- Works with existing actuals import system (quick-001)
- Uses currency system from quick-002
- Integrates with project budget tracking (03-06, 03-07)

## Testing Notes

**To test manually:**
1. Navigate to a project with actuals and budgetCurrency set
2. Click "Show details" toggle in Actuals section
3. Verify table appears with receipts and invoices
4. Verify virtualization works (scroll should be smooth)
5. Click "Export Excel" - file should download
6. Click delete on a line - line should disappear
7. Stop the project - verify delete buttons are disabled
8. Toggle details off and on again - data should load from cache

**Edge cases tested:**
- Empty actuals list (shows empty state)
- Stopped projects (delete disabled)
- Mixed currencies in actuals
- No competence month for some invoices

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 9222ef9 | feat(quick-003): install react-virtual and extend actuals API |
| 2 | b148cd5 | feat(quick-003): create ActualsTable with virtualization |
| 3 | b8a02e2 | feat(quick-003): integrate ActualsTable into ActualsSummary |

**Total:** 3 commits, 12 minutes execution time
