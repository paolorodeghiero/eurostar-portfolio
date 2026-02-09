# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Enable clear visibility into the IT project portfolio with accurate budget tracking and governance
**Current focus:** Phase 4 - Governance & Workflow

## Current Position

Phase: 4 of 6 (Governance & Workflow)
Plan: 10 of 10 in current phase (04-01 through 04-09 done)
Status: In progress
Last activity: 2026-02-09 - Completed quick task 005: create a project global make command for the project including only a run dev, a db reset and a db seed commands

Progress: [█████████████░░░] 83% (34/41 total plans)
Quick tasks: 5 completed

## Performance Metrics

**Velocity:**
- Total plans completed: 34
- Average duration: 10 min
- Total execution time: 5.34 hours
- Quick tasks: 5 completed (avg 9 min)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 6 | 82m | 14m |
| 02 | 10 | 61m | 6m |
| 03 | 8 | 82m | 10m |
| 04 | 9 | 70m | 8m |

**Recent Trend:**
- Last 5 plans: 04-06 (6m), 04-07 (6m), 04-08 (4m), 04-09 (3m)
- Trend: Phase 4 wave 4 execution nearly complete

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Full TypeScript stack chosen for simplicity and team consistency
- PostgreSQL with snowflake views for Power BI integration
- EntraID authentication as enterprise standard
- Store currency at source, convert only for reporting
- Sleek modern UI (Linear/Notion style)
- Use PostgreSQL identity columns instead of serial (01-01)
- Use jwks-rsa for automatic Azure AD key rotation (01-02)
- Dev mode bypasses all auth for local development productivity (01-02)
- Admin role determined by Azure AD group membership (01-02)
- MSAL v5 with localStorage caching for session persistence (01-03)
- Popup-based login flow for better UX (01-03)
- Created db plugin to attach drizzle to Fastify instance (01-04)
- Usage counts return 0 placeholder until projects table exists (01-04)
- Use shadcn/ui patterns with class-variance-authority for component variants (01-05)
- Eurostar brand colors via CSS custom properties (01-05)
- DataTable built with @tanstack/react-table for sorting/filtering control (01-05)
- Admin layout with sidebar navigation for 9 referential types (01-06)
- Each CRUD page follows consistent pattern with DataTable, Dialog, and inline form (01-06)
- Delete button disabled when usageCount > 0 to prevent orphan references (01-06)
- Command + Popover pattern for combobox team selection (02-02)
- use-debounce library for auto-save to avoid stale closure bugs (02-02)
- PostgreSQL upsert for atomic project ID generation (02-01)
- Cascade delete on project child tables, restrict on reference tables (02-01)
- Upsert pattern for project values using onConflictDoUpdate (02-04)
- Lead team protection: cannot be removed from involved teams (02-04)
- useAutoSave hook uses 2500ms debounce delay for Linear-style UX (02-05)
- Portfolio route is home (/), admin routes at /admin/* (02-05)
- 409 conflict handling with structured error for future conflict modal (02-05)
- Select component uses standard shadcn pattern from radix-ui (02-06)
- PersonAutocomplete uses Command+Popover pattern for consistent UX (02-06)
- Tab components receive project, formData, onChange props for controlled state (02-06)
- TeamChip component with teal styling for lead team distinction (02-07)
- TeamsTab uses Command+Popover for searchable team add (02-07)
- Score dots use primary color for filled, gray for empty (02-08)
- Default score 3 (middle) for new outcomes (02-08)
- 1000ms debounce for value score saves (02-08)
- Delete confirmation requires typing exact project name (02-09)
- Stop action is immediate with no confirmation (02-09)
- Change impact teams reuse TeamChip component (02-09)
- Conflict dialog shows side-by-side field comparison (02-10)
- Read-only mode disables all inputs and hides action buttons for stopped projects (02-10)
- Optional onSizeChange in TeamChip allows static read-only display (02-10)
- Store all monetary amounts as NUMERIC(15,2) never as JavaScript Number (03-01)
- Store currency alongside amounts using ISO 4217 codes (03-01)
- Competence month for invoices supports extraction flag and manual override (03-01)
- Unique constraints prevent duplicate budget line and actuals imports (03-01)
- Excel validation uses magic bytes (504b0304 for xlsx, d0cf11e0 for xls) (03-02)
- Import validates referential data before insert (departments, cost centers, currencies must exist) (03-02)
- Bulk imports use transactions for all-or-nothing behavior (03-02)
- DELETE blocked when budget line has allocations (409 conflict) (03-02)
- No PUT/update endpoint for budget lines - import-only, delete and re-import to fix errors (03-02)
- Currency formatting uses Intl.NumberFormat matching currency code from data (03-05)
- Available amount highlighted red when zero or negative (03-05)
- Delete button disabled with tooltip when allocatedAmount > 0 (03-05)
- Import dialog stays open on errors to show validation results (03-05)
- Fiscal year filter defaults to current year (03-05)
- Inline editing for allocation amounts: click to edit, blur/Enter saves, Escape cancels (03-06)
- Immediate save for allocations (no debounce) since discrete actions (03-06)
- Filter available budget lines to only show those with available > 0 (03-06)
- Color-coded T-shirt badges: XS=gray, S=blue, M=green, L=yellow, XL=orange, XXL=red (03-06)
- Actuals summary only shown in sidebar if budgetCurrency is set (03-07)
- Upload Actuals button in portfolio page toolbar as global action (03-07)
- Excel upload endpoints separate from JSON import endpoints (03-07)
- Summary endpoint calculates percentUsed and budgetRemaining server-side (03-07)
- Template download endpoints provide Excel files with headers and example data (quick-001)
- Column documentation uses collapsible table pattern in import dialogs (quick-001)
- Templates accessible via direct anchor links with download attribute (quick-001)
- Store reportCurrency as nullable field for backward compatibility (quick-002)
- Only GBP and EUR supported for reporting (business requirement) (quick-002)
- Use Intl.NumberFormat for proper currency symbol formatting (quick-002)
- Show original amount in small text when converted (quick-002)
- Query currency rates with date-based validity check (validFrom/validTo) (quick-002)
- Remove invoices from actuals tab visual - receipts-only focus (quick-004)
- Always load receipts on mount (no toggle) for simpler UX (quick-004)
- AlertDialog for delete all confirmation with explicit count (quick-004)
- Progress bar color codes: green < 90%, orange 90-100%, red > 100% (quick-004)
- Receipts require: projectId, receiptNumber, company, purchaseOrder, amount, currency, date (quick-005)
- Invoices require: projectId, company, invoiceNumber, purchaseOrder, amount, currency, date (quick-005)
- Invoice unique constraint on (company, invoiceNumber), receipt on (company, receiptNumber) (quick-005)
- Committee columns added after costTshirt, before version in projects table (04-01)
- Audit log uses JSONB for changes to support flexible field tracking (04-01)
- GBP thresholds converted at ~0.85 rate from EUR (04-01)
- auditLog and alertConfig added to seed imports for future seed runs (04-01)
- State machine exports COMMITTEE_TRANSITIONS map for transparent transition rules (04-03)
- canTransition allows null -> draft as initial state entry (04-03)
- determineCommitteeLevel uses currency-specific thresholds from database (04-03)
- Committee level auto-updates on any budget change (04-03)
- Use set_config() for programmatic PostgreSQL session variable setting (04-02)
- Trigger ignores version/timestamp columns to reduce audit noise (04-02)
- GIN index on changes JSONB for efficient audit queries (04-02)
- preHandler hook pattern for setting PostgreSQL session context (04-02)
- UUID filenames prevent path traversal and filename collisions (04-04)
- Stream-based upload avoids memory accumulation for large files (04-04)
- MIME type validation alongside extension check for defense in depth (04-04)
- Alert severity 'critical' for >30 days overdue or >100% budget used (04-05)
- Exclude cancelled status along with completed/closed from overdue alerts (04-05)
- Default budget threshold at 90% for budget_limit alerts (04-05)
- Map database column names to human-readable labels for history display (04-06)
- History pagination default 50, max 100, offset-based (04-06)
- Timeline uses vertical line with dots for entry connections (04-08)
- Operation colors: green for INSERT, blue for UPDATE, red for DELETE (04-08)
- Relative timestamps show 'Just now', 'X minutes ago', 'X days ago' for recent entries (04-08)
- Load more pagination with 20 entries per page (04-08)
- Polling interval default 60 seconds for alerts (04-09)
- Badge shows 99+ for count over 99 (04-09)
- Click alert navigates to project sidebar (04-09)
- Workflow progress visualization uses step indicator with checkmarks (04-07)
- Committee tab placed after Change Impact, before Budget (04-07)
- Level colors: mandatory=red, optional=yellow, not_necessary=gray (04-07)

### Pending Todos

4 pending — `/gsd:check-todos` to review

### Blockers/Concerns

None currently.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Import Excel template download and column docs | 2026-02-05 | b5be368 | [001-import-excel-template-and-column-docs](./quick/001-import-excel-template-and-column-docs/) |
| 002 | Project currency conversion system | 2026-02-05 | 25bf585 | [002-project-currency-conversion-system](./quick/002-project-currency-conversion-system/) |
| 003 | Actuals view with table export delete | 2026-02-05 | b8a02e2 | [003-actuals-view-with-table-export-delete](./quick/003-actuals-view-with-table-export-delete/) |
| 004 | Redesign actuals tab | 2026-02-05 | 01592ab | [004-redesign-actuals-tab](./quick/004-redesign-actuals-tab/) |
| 005 | Create project-global Makefile | 2026-02-09 | f304e432 | [005-create-a-project-global-make-command-for](./quick/005-create-a-project-global-make-command-for/) |

## Session Continuity

Last session: 2026-02-09
Stopped at: Completed quick-005-PLAN.md (Create project-global Makefile)
Resume file: None
Next: Execute 04-10 (Integration Testing)

---
*State initialized: 2026-02-03*
*Last updated: 2026-02-09*
