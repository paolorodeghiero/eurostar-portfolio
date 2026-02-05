---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/routes/budget-lines.ts
  - backend/src/routes/actuals.ts
  - frontend/src/pages/admin/BudgetLinesPage.tsx
  - frontend/src/components/ActualsUploadDialog.tsx
autonomous: true

must_haves:
  truths:
    - "User can download Excel template for budget lines import"
    - "User can download Excel template for receipts import"
    - "User can download Excel template for invoices import"
    - "User can see column documentation before uploading"
  artifacts:
    - path: "backend/src/routes/budget-lines.ts"
      provides: "GET /template endpoint returning xlsx"
    - path: "backend/src/routes/actuals.ts"
      provides: "GET /receipts/template and /invoices/template endpoints"
    - path: "frontend/src/pages/admin/BudgetLinesPage.tsx"
      provides: "Template download button and column docs in import dialog"
    - path: "frontend/src/components/ActualsUploadDialog.tsx"
      provides: "Template download buttons and column docs in both tabs"
  key_links:
    - from: "frontend dialogs"
      to: "backend /template endpoints"
      via: "direct link download"
      pattern: "href=.*template"
---

<objective>
Add template download and column documentation to Excel import screens.

Purpose: Help users understand the required format before uploading, reducing import errors.
Output: Download template buttons and inline column documentation in all three import dialogs (budget lines, receipts, invoices).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/src/lib/excel-parser.ts
@backend/src/routes/budget-lines.ts
@backend/src/routes/actuals.ts
@frontend/src/pages/admin/BudgetLinesPage.tsx
@frontend/src/components/ActualsUploadDialog.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add backend template generation endpoints</name>
  <files>
    backend/src/routes/budget-lines.ts
    backend/src/routes/actuals.ts
  </files>
  <action>
    Add GET endpoints that return Excel template files:

    1. In budget-lines.ts add GET /api/budget-lines/template:
       - Use xlsx library (already installed) to create workbook
       - Add single sheet with header row: Company, Department, CostCenter, LineValue, Amount, Currency, Type, FiscalYear
       - Add one example row: THIF, IT Department, CC001, Software, 10000, EUR, CAPEX, 2026
       - Return as xlsx download with Content-Disposition header

    2. In actuals.ts add GET /api/actuals/receipts/template:
       - Headers: ProjectId, ReceiptNumber, Amount, Currency, Date, Description
       - Example: PRJ-2026-00001, REC-001, 5000, EUR, 2026-01-15, Office supplies

    3. In actuals.ts add GET /api/actuals/invoices/template:
       - Headers: ProjectId, InvoiceNumber, Amount, Currency, Date, Description, Company
       - Example: PRJ-2026-00001, INV-001, 15000, EUR, 2026-01-20, Consulting services, Acme Corp

    Template generation pattern:
    ```typescript
    const workbook = XLSX.utils.book_new();
    const data = [
      ['Header1', 'Header2', ...],
      ['Example1', 'Example2', ...]
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Template');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="template.xlsx"');
    return reply.send(buffer);
    ```
  </action>
  <verify>
    curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/budget-lines/template returns 200
    curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/actuals/receipts/template returns 200
    curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/actuals/invoices/template returns 200
    Downloaded files open in Excel with correct headers
  </verify>
  <done>Three template endpoints return valid Excel files with headers and example rows</done>
</task>

<task type="auto">
  <name>Task 2: Add template download and column docs to import dialogs</name>
  <files>
    frontend/src/pages/admin/BudgetLinesPage.tsx
    frontend/src/components/ActualsUploadDialog.tsx
  </files>
  <action>
    Update the import dialogs to include:

    1. In BudgetLinesPage.tsx import dialog (lines 348-429):
       - Add Download icon from lucide-react
       - After the file input, add a "Download Template" link styled as text button
       - Use anchor tag with href="/api/budget-lines/template" and download attribute
       - Add column documentation section below the file input showing:
         | Column | Type | Required | Description |
         |--------|------|----------|-------------|
         | Company | Text | Yes | Company code (e.g., THIF, EIL) |
         | Department | Text | Yes | Must match existing department name |
         | CostCenter | Text | Yes | Must match existing cost center code |
         | LineValue | Text | Yes | Budget line identifier |
         | Amount | Number | Yes | Positive number |
         | Currency | Text | Yes | 3-letter ISO code (EUR, GBP, USD) |
         | Type | Text | Yes | CAPEX or OPEX |
         | FiscalYear | Number | Yes | Year (2020-2100) |

    2. In ActualsUploadDialog.tsx:
       - In receipts tab: Add template download link to /api/actuals/receipts/template
       - Add receipts column docs:
         | Column | Type | Required | Description |
         | ProjectId | Text | Yes | Format: PRJ-YYYY-XXXXX |
         | ReceiptNumber | Text | No | Optional reference number |
         | Amount | Number | Yes | Positive number |
         | Currency | Text | Yes | 3-letter ISO code |
         | Date | Text | Yes | Format: YYYY-MM-DD |
         | Description | Text | No | Optional description |

       - In invoices tab: Add template download link to /api/actuals/invoices/template
       - Add invoices column docs:
         | Column | Type | Required | Description |
         | ProjectId | Text | Yes | Format: PRJ-YYYY-XXXXX |
         | InvoiceNumber | Text | Yes | Unique invoice number |
         | Amount | Number | Yes | Positive number |
         | Currency | Text | Yes | 3-letter ISO code |
         | Date | Text | Yes | Format: YYYY-MM-DD |
         | Description | Text | Yes | Invoice description |
         | Company | Text | No | Vendor company name |

    Style the column docs as a collapsible section (use Collapsible from ui) with default collapsed state.
    Use a simple table with muted colors (text-muted-foreground, text-xs).
    Template download link should be styled with Download icon and "Download Template" text.
  </action>
  <verify>
    1. Open http://localhost:5173/admin/budget-lines
    2. Click "Import Excel" button
    3. Verify "Download Template" link is visible and clicking it downloads budget-lines-template.xlsx
    4. Verify column documentation table is visible (expand if collapsed)
    5. Navigate to Portfolio page, click Upload Actuals
    6. In Receipts tab: verify template download and column docs
    7. In Invoices tab: verify template download and column docs
  </verify>
  <done>
    All three import dialogs (budget lines, receipts, invoices) have:
    - Working template download link
    - Column documentation showing required format
  </done>
</task>

</tasks>

<verification>
- Backend: All three GET /template endpoints return 200 with valid xlsx content
- Frontend: Template links work and download Excel files
- Frontend: Column documentation is visible and accurate
- No TypeScript errors: npm run build succeeds in both frontend and backend
</verification>

<success_criteria>
- User can download template before attempting import
- User can see exactly what columns are expected and their formats
- Templates contain headers matching the validation schema
- Templates contain example data to guide users
</success_criteria>

<output>
After completion, create `.planning/quick/001-import-excel-template-and-column-docs/001-SUMMARY.md`
</output>
