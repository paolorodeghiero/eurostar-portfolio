---
quick_task: 003
name: actuals-view-with-table-export-delete
type: execute
autonomous: true
files_modified:
  - frontend/src/components/projects/ActualsSummary.tsx
  - frontend/src/components/projects/ActualsTable.tsx
  - frontend/src/lib/actuals-api.ts
  - frontend/package.json
---

<objective>
Enhance the project actuals view: add toggle to show detailed actuals, display receipts and invoices in a scrollable virtualized table, add Excel export button, add delete button per line, and convert totals to project's reportCurrency.

Purpose: Enable users to view, manage, and export individual actual lines from a project, with proper currency conversion for reporting.
Output: Enhanced ActualsSummary with toggle, virtualized ActualsTable component, Excel export, delete functionality, and currency conversion.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

Existing files to modify:
@frontend/src/components/projects/ActualsSummary.tsx
@frontend/src/lib/actuals-api.ts

Patterns to follow:
@frontend/src/pages/admin/BudgetLinesPage.tsx (Excel import/export pattern, DataTable usage)
@frontend/src/components/admin/DataTable.tsx (table component pattern)
@backend/src/routes/actuals/receipts.ts (receipts endpoint with DELETE)
@backend/src/routes/actuals/invoices.ts (invoices endpoint with DELETE)
@backend/src/routes/projects/projects.ts (actuals summary endpoint)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install @tanstack/react-virtual and extend actuals API</name>
  <files>
    frontend/package.json
    frontend/src/lib/actuals-api.ts
  </files>
  <action>
1. Install @tanstack/react-virtual for virtualized scrolling:
   `cd frontend && npm install @tanstack/react-virtual`

2. Extend `frontend/src/lib/actuals-api.ts`:
   - Add interface `Receipt` with fields: id, projectId (string PRJ-xxx), projectName, receiptNumber, amount, currency, receiptDate, description, importBatch, createdAt
   - Add interface `Invoice` with same structure plus: competenceMonth, competenceMonthExtracted, competenceMonthOverride
   - Add `fetchProjectReceipts(projectInternalId: number): Promise<Receipt[]>` - calls GET /api/actuals/receipts?projectId={projectId} (needs to first fetch project to get PRJ-xxx id, or add new endpoint)
   - Add `fetchProjectInvoices(projectInternalId: number): Promise<Invoice[]>` - similar pattern
   - Add `deleteReceipt(id: number): Promise<void>` - DELETE /api/actuals/receipts/:id
   - Add `deleteInvoice(id: number): Promise<void>` - DELETE /api/actuals/invoices/:id
   - Add `exportActualsExcel(receipts: Receipt[], invoices: Invoice[], projectId: string): void` that uses xlsx library to create workbook with two sheets (Receipts, Invoices) and triggers download

Note: The existing receipt/invoice endpoints filter by projectId (PRJ-xxx format), so we need to pass the project's projectId string. The fetchProject call gives us this.
  </action>
  <verify>
    `cd frontend && npm ls @tanstack/react-virtual` shows package installed
    TypeScript compiles without errors: `cd frontend && npx tsc --noEmit`
  </verify>
  <done>
    @tanstack/react-virtual installed, actuals-api.ts has Receipt/Invoice interfaces and CRUD + export functions
  </done>
</task>

<task type="auto">
  <name>Task 2: Create ActualsTable component with virtualization</name>
  <files>
    frontend/src/components/projects/ActualsTable.tsx
  </files>
  <action>
Create new file `frontend/src/components/projects/ActualsTable.tsx`:

1. Props interface:
   ```typescript
   interface ActualsTableProps {
     receipts: Receipt[];
     invoices: Invoice[];
     projectId: string; // PRJ-xxx format for export filename
     reportCurrency: string | null; // null = no conversion
     budgetCurrency: string;
     onDelete: (type: 'receipt' | 'invoice', id: number) => void;
     disabled?: boolean; // for stopped projects
   }
   ```

2. Create table with two sections (Receipts header row, then receipt rows; Invoices header row, then invoice rows) OR use tabs for receipts/invoices

3. Use @tanstack/react-virtual for virtualized scrolling:
   - Container height: 300px max, scrollable
   - Row height: ~40px
   - useVirtualizer hook from @tanstack/react-virtual

4. Columns for receipts: Date, Number, Description, Amount (with currency conversion if reportCurrency differs from row currency), Actions (delete)

5. Columns for invoices: Date, Number, Description, Competence Month, Amount (converted), Actions (delete)

6. Currency conversion display:
   - If reportCurrency is set and different from row.currency: show converted amount with small original amount below
   - Use pattern from quick-002: `formatCurrency(converted, reportCurrency)` with `<span className="text-xs text-muted-foreground">({formatCurrency(original, originalCurrency)})</span>`
   - Conversion rates should be fetched via the summary endpoint which already does conversion, OR we pass pre-converted amounts

7. Delete button:
   - Trash2 icon, ghost variant, destructive color
   - Disabled when `disabled` prop is true
   - On click: call `onDelete(type, id)`

8. Excel export button in header:
   - Download icon, positioned at top right
   - On click: call exportActualsExcel from actuals-api.ts

9. Empty state: "No actuals recorded" message

Style: Match existing DataTable patterns but simpler (no sorting needed for this view).
  </action>
  <verify>
    TypeScript compiles: `cd frontend && npx tsc --noEmit`
    File exists and exports ActualsTable component
  </verify>
  <done>
    ActualsTable.tsx created with virtualized scrolling, currency conversion display, delete buttons, and Excel export
  </done>
</task>

<task type="auto">
  <name>Task 3: Integrate ActualsTable into ActualsSummary with toggle</name>
  <files>
    frontend/src/components/projects/ActualsSummary.tsx
  </files>
  <action>
Modify `frontend/src/components/projects/ActualsSummary.tsx`:

1. Add new state:
   ```typescript
   const [showDetails, setShowDetails] = useState(false);
   const [receipts, setReceipts] = useState<Receipt[]>([]);
   const [invoices, setInvoices] = useState<Invoice[]>([]);
   const [detailsLoading, setDetailsLoading] = useState(false);
   ```

2. Add props to receive from parent:
   - `project: Project` (full project object to get projectId string, reportCurrency, isStopped)
   - Keep `projectId: number` for backward compat but prefer project object

3. Add toggle button in header (next to currency badge):
   - ChevronDown/ChevronUp icon
   - Text: "Show details" / "Hide details"
   - On click: toggle showDetails, if becoming true and receipts/invoices empty, fetch them

4. When showDetails becomes true:
   - Fetch receipts via fetchProjectReceipts (need project.projectId string)
   - Fetch invoices via fetchProjectInvoices
   - Set detailsLoading during fetch

5. When showDetails is true, render ActualsTable below the summary stats:
   ```tsx
   {showDetails && (
     <ActualsTable
       receipts={receipts}
       invoices={invoices}
       projectId={project.projectId}
       reportCurrency={project.reportCurrency}
       budgetCurrency={project.budgetCurrency}
       onDelete={handleDelete}
       disabled={project.isStopped}
     />
   )}
   ```

6. Implement handleDelete:
   - Call deleteReceipt or deleteInvoice based on type
   - On success: remove from local state, optionally refetch summary
   - Show error toast or inline error on failure

7. Update summary totals to use reportCurrency if set:
   - The backend already returns amounts in budgetCurrency
   - For display, if reportCurrency differs, we need conversion
   - Option A: Backend summary endpoint adds converted totals
   - Option B: Frontend does conversion (simpler for now)
   - For now: just display in budgetCurrency, note in UI that detailed view shows conversions

8. Update ActualsSummary call in ProjectSidebar.tsx to pass full project:
   ```tsx
   <ActualsSummary project={project} />
   ```
  </action>
  <verify>
    TypeScript compiles: `cd frontend && npx tsc --noEmit`
    Dev server runs: `cd frontend && npm run dev` (check for errors in console)
    Manual test: Open project sidebar, click "Show details", see table with receipts/invoices
  </verify>
  <done>
    ActualsSummary has toggle to show/hide ActualsTable, delete works, Excel export works, currency conversion displayed
  </done>
</task>

</tasks>

<verification>
1. `cd frontend && npm run build` completes without errors
2. Open app, navigate to project with actuals and budgetCurrency set
3. Click "Show details" toggle - table appears with receipts and invoices
4. Verify virtualization works (scroll should be smooth even with many items)
5. Click Excel download - file downloads with two sheets
6. Click delete on a line - line disappears from table
7. Stop a project and verify delete buttons are disabled
</verification>

<success_criteria>
- Toggle shows/hides detailed actuals table
- Table displays receipts and invoices with virtualized scrolling
- Excel export downloads file with Receipts and Invoices sheets
- Delete button removes individual lines (disabled for stopped projects)
- Amounts show conversion when reportCurrency differs from original currency
- No TypeScript errors, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/003-actuals-view-with-table-export-delete/003-SUMMARY.md`
</output>
