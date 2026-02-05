---
quick: 004
type: execute
files_modified:
  - frontend/src/components/projects/tabs/ActualsTab.tsx
  - frontend/src/components/projects/ActualsTable.tsx
  - frontend/src/lib/actuals-api.ts
autonomous: true
---

<objective>
Redesign the Actuals tab to show a cleaner receipts-only view with summary header, progress bar, and table with per-row delete plus bulk actions.

Purpose: Simplify the actuals display by removing invoices from the visual and presenting a clear overview with total receipts, budget, remaining amount at top.
Output: Redesigned ActualsTab with header stats, progress bar, receipts-only table, export Excel and delete all buttons.
</objective>

<context>
@.planning/STATE.md
@frontend/src/components/projects/tabs/ActualsTab.tsx (current implementation)
@frontend/src/components/projects/ActualsTable.tsx (current virtualized table)
@frontend/src/lib/actuals-api.ts (API functions and types)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Redesign ActualsTab header section</name>
  <files>frontend/src/components/projects/tabs/ActualsTab.tsx</files>
  <action>
Rewrite ActualsTab.tsx to show a cleaner layout:

1. **Header section** - Three key metrics in a row:
   - Total Receipts: formatted with project currency inline (e.g., "GBP 12,500.00")
   - Budget: formatted with project currency
   - Remaining: formatted with project currency (red if negative/zero, green if positive)

2. **Progress bar** - Below header:
   - Shows percentage of budget used (receipts / budget * 100)
   - Primary color when < 90%, orange when 90-100%, red when > 100%
   - Show percentage text above bar

3. Remove the Show/Hide Details toggle - always show table directly.
4. Remove invoices from the summary calculation display (only show receipts).
5. Remove the "Invoices Total" line and "Total Actuals" line (only receipts matter).
6. Keep the budget currency check (if not set, show message to set it first).

Use Intl.NumberFormat for currency formatting with the displayCurrency (reportCurrency || budgetCurrency).
  </action>
  <verify>
- Build succeeds: `cd frontend && npm run build`
- Header shows three stats: Total Receipts, Budget, Remaining
- Progress bar renders below header with correct percentage
  </verify>
  <done>
Header displays total receipts, budget, remaining with currency inline. Progress bar shows budget usage percentage with color coding.
  </done>
</task>

<task type="auto">
  <name>Task 2: Simplify ActualsTable to receipts-only with new columns</name>
  <files>frontend/src/components/projects/ActualsTable.tsx, frontend/src/lib/actuals-api.ts</files>
  <action>
Rewrite ActualsTable.tsx as a receipts-only table:

1. **Remove invoice handling entirely** - Props change to only accept receipts:
   ```typescript
   interface ActualsTableProps {
     receipts: Receipt[];
     projectId: string;
     displayCurrency: string;
     onDelete: (id: number) => void;
     onDeleteAll: () => void;
     disabled?: boolean;
   }
   ```

2. **Table columns** (simplified):
   - ID: receipt number or "No number"
   - Date: receiptDate formatted as "05 Feb 2026"
   - Description: description or "No description"
   - Amount: show original amount with currency (e.g., "EUR 500.00")
   - Currency: just the ISO code (e.g., "EUR")
   - Delete: trash icon button per row

3. **Column widths**:
   `[100px_100px_1fr_120px_60px_50px]` for ID, Date, Description, Amount, Currency, Delete

4. **Bottom action bar** with two buttons:
   - "Download Excel" button (left aligned) - calls exportActualsExcel (update to receipts only)
   - "Delete All Receipts" button (right aligned, destructive style) - calls onDeleteAll

5. Update exportActualsExcel in actuals-api.ts to only export receipts (single sheet):
   - Rename function to exportReceiptsExcel
   - Remove invoices parameter and sheet
   - Update download filename to `{projectId}-receipts.xlsx`

6. Keep virtualization for large lists (300px height container).
  </action>
  <verify>
- Build succeeds: `cd frontend && npm run build`
- Table shows ID, Date, Description, Amount, Currency, Delete columns
- Bottom bar has Download Excel and Delete All buttons
  </verify>
  <done>
ActualsTable shows receipts only with simplified columns. Export function updated to receipts-only. Delete per row and delete all buttons functional.
  </done>
</task>

<task type="auto">
  <name>Task 3: Wire up delete all and integrate components</name>
  <files>frontend/src/components/projects/tabs/ActualsTab.tsx, frontend/src/lib/actuals-api.ts</files>
  <action>
1. Add deleteAllReceipts API function in actuals-api.ts:
   ```typescript
   export async function deleteAllReceipts(projectId: string): Promise<void> {
     return apiClient<void>(`/api/actuals/receipts?projectId=${projectId}`, {
       method: 'DELETE',
     });
   }
   ```
   Note: This requires backend endpoint. If endpoint doesn't exist, implement client-side batch delete using Promise.all with individual deleteReceipt calls.

2. In ActualsTab.tsx:
   - Fetch receipts on mount (no toggle, always load)
   - Pass handleDelete and handleDeleteAll to ActualsTable
   - handleDeleteAll: delete all receipts, refresh summary
   - Remove invoices state and fetching entirely
   - Remove showDetails state (always show table)

3. Add confirmation dialog for Delete All:
   - Use AlertDialog from shadcn/ui
   - Title: "Delete all receipts?"
   - Description: "This will permanently delete all {count} receipts for this project. This action cannot be undone."
   - Cancel and destructive "Delete All" buttons

4. Update the component flow:
   - Load summary on mount
   - Load receipts on mount (not behind toggle)
   - Render header stats -> progress bar -> table -> action buttons
  </action>
  <verify>
- Build succeeds: `cd frontend && npm run build`
- Delete individual receipt updates table and summary
- Delete All shows confirmation dialog
- After Delete All, table is empty and summary shows 0
  </verify>
  <done>
Delete all functionality wired up with confirmation dialog. Components integrated with no toggle state. Full flow: stats -> progress -> table -> actions.
  </done>
</task>

</tasks>

<verification>
1. `cd frontend && npm run build` - no TypeScript errors
2. Open project sidebar, navigate to Actuals tab
3. See header with Total Receipts, Budget, Remaining (currency inline)
4. See progress bar showing budget usage percentage
5. See receipts table with ID, Date, Description, Amount, Currency, Delete columns
6. Click Download Excel - downloads receipts-only Excel file
7. Click Delete All - see confirmation dialog, confirm deletes all receipts
8. No invoices visible anywhere in the tab
</verification>

<success_criteria>
- Actuals tab shows header stats (receipts, budget, remaining) with currency inline
- Progress bar shows budget usage percentage with color coding
- Receipts table displays with correct columns
- Per-row delete removes receipt and updates summary
- Download Excel exports receipts-only file
- Delete All shows confirmation and removes all receipts
- No invoices in the visual (data or UI references removed)
</success_criteria>

<output>
After completion, create `.planning/quick/004-redesign-actuals-tab/004-SUMMARY.md`
</output>
