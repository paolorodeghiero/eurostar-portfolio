# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Enable clear visibility into the IT project portfolio with accurate budget tracking and governance
**Current focus:** Phase 7 - Refactor and Reorganize Information

## Current Position

Phase: 7 of 7 (Refactor and Reorganize)
Plan: 10 of 10 (07-10)
Status: Complete
Last activity: 2026-02-09 - Completed quick-011: Committee effort layout

Progress: [████████████████████] 98% (51/52 total plans)
Quick tasks: 11 completed

## Performance Metrics

**Velocity:**
- Total plans completed: 51
- Average duration: 8 min
- Total execution time: 6.70 hours
- Quick tasks: 11 completed (avg 4 min)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 7 | 87m | 12m |
| 02 | 10 | 61m | 6m |
| 03 | 8 | 82m | 10m |
| 04 | 10 | 73m | 7m |
| 05 | 5 | 37m | 7m |
| 07 | 7 | 48m | 7m |

**Recent Trend:**
- Last 5 plans: 07-04 (4m), 07-07 (5m), 07-08 (13m), 07-09 (4m), 07-10 (3m)
- Trend: Phase 7 complete - UI enhancements with integration testing

*Updated after each plan completion*
| Phase 07 P01 | 15 | 2 tasks | 5 files |
| Phase 07 P04 | 4 | 2 tasks | 2 files |
| Phase 07 P07 | 5 | 2 tasks | 3 files |
| Phase 07 P08 | 13 | 3 tasks | 3 files |
| Phase 07 P03 | 12 | 3 tasks | 6 files |
| Phase 07 P09 | 4 | 2 tasks | 2 files |
| Phase 07 P05 | 8 | 3 tasks | 3 files |
| Phase 07 P10 | 3 | 2 tasks | 3 files |
| Phase quick P009 | 2 | 1 tasks | 1 files |

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
- Removed global header from App.tsx - each page/layout renders its own header (05-02)
- PortfolioHeader uses sticky positioning for fixed top bar during scroll (05-02)
- User identity shows initials from name (first + last) or first 2 chars of email (05-02)
- Admin link highlights when on admin routes using location.pathname check (05-02)
- Responsive design hides user name on small screens, shows only initials circle (05-02)
- [Phase 05]: Use @dnd-kit for column reordering instead of deprecated react-beautiful-dnd
- [Phase 05]: Mini-visualization cells (progress bars, dots, chips) for Linear/Notion-style data-dense table
- Use @dnd-kit instead of deprecated react-beautiful-dnd for column reordering (05-04)
- 8px activation distance prevents accidental drags when clicking to sort (05-04)
- Exclude 'select' column from hide options (always visible) (05-04)
- Prefix unused state setters with underscore until toolbar integration (05-04)
- 300ms debounce for global search balances responsiveness and performance (05-05)
- Smart filter types: text for names/IDs, select for status/team, number for scores (05-05)
- Filter chips truncate long values at 20 characters for readability (05-05)
- Clear all button only shown when multiple filters active (05-05)
- Sidebar uses 50vw with min-w-[400px] and max-w-[800px] for responsive half-screen display (05-06)
- Sidebar animations: 300ms opening (smooth), 200ms closing (snappy) (05-06)
- Bulk actions UI ready but backend endpoints deferred (export, status change, delete) (05-06)
- Virtual scrolling row heights: 53px comfortable, 37px compact (05-06)
- All monetary values (opex, capex, actuals) stored in EUR in database (07-01)
- Currency conversion at API boundary using reportCurrency query param for display (07-01)
- inputCurrency parameter in budget PUT endpoint converts to EUR before storing (07-01)
- actualsTotal calculated from receipts table SUM in EUR (07-01)
- convertCurrency helper returns null for null input amounts (07-01)
- Project startDate used as reference date for budget currency conversion (07-01)
- Recharts 3.7.0 for mini radar chart visualization in table cells (07-02)
- Date-fns 4.1.0 for relative time formatting (tree-shakeable) (07-02)
- Mini radar chart sized at 40x40px for compact table cell display (07-02)
- React.memo wrapper on all cell components for table scroll performance (07-02)
- Outcome names truncated to 3 characters for radar dimension labels (07-02)
- Tiptap with StarterKit for rich text editing (Bold, Italic, Lists, History) (07-06)
- Placeholder extension for empty editor state with native accessibility (07-06)
- Editor headings limited to H2 and H3 to maintain semantic hierarchy (07-06)
- DescriptionEditor outputs HTML via onChange for easy backend storage (07-06)
- [Phase 07]: Use Intl.NumberFormat with compact notation for K/M amount formatting in table cells (07-04)
- Replace HoverCard with explicit Edit button in BudgetTab for better UX discoverability (07-08)
- Large radar chart (250px) in ValueTab for value score overview with dimension labels (07-08)
- Global effort T-shirt in TeamsTab derived from maximum team size (07-08)
- [Phase 07]: Use compact progression dots (1.5px) instead of large circles for committee workflow in table cells (07-04)
- GeneralTab merged with People tab into four sections: Core Info, People, Description, Business Case (07-07)
- SectionHeader and SectionDivider components for visual organization in tab layouts (07-07)
- Business Case upload moved from CommitteeTab to GeneralTab for better discoverability (07-07)
- [Phase 07]: MAX algorithm for T-shirt aggregation (represents peak team effort) (07-03)
- [Phase 07]: Click-to-expand inline pattern for table cells instead of hover tooltip (07-03)
- [Phase 07]: Expandable cell pattern with aggregate view, expand chevron, and inline breakdown row (07-03)
- [Phase 07]: Remove Business Case from CommitteeTab to GeneralTab for clearer separation between governance and project details
- [Phase 07]: Rename Teams tab to Effort for better reflection of team involvement and sizing
- [Phase 07]: Remove People tab by merging into GeneralTab to reduce navigation complexity
- [Phase 07]: First 3 columns pinned (checkbox, ID, name) for horizontal scroll navigation
- [Phase 07]: Core 8 columns visible by default (ID, Name, Status, Lead, Dates, Value, Budget, Committee)
- TanStack Table meta callbacks for custom cell interactions that bypass row click (quick-008)
- Controlled tabs with value/onValueChange for programmatic tab switching (quick-008)
- Event stopPropagation pattern prevents row click when clicking nested cell elements (quick-008)

### Pending Todos

5 pending — `/gsd:check-todos` to review

### Roadmap Evolution

- Phase 7 added: Refactor and reorganize information between main table and sidebar

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
| 006 | Reorder columns - Effort, Impact, Costs | 2026-02-09 | 206d06a2 | [006-reorder-columns-effort-impact-costs](./quick/006-reorder-columns-effort-impact-costs/) |
| 007 | Reset column order button | 2026-02-09 | 25272a77 | [007-reset-column-order-button](./quick/007-reset-column-order-button/) |
| 008 | Value radar hover and click | 2026-02-09 | 3edd2dfb | [008-value-radar-hover-click](./quick/008-value-radar-hover-click/) |
| 009 | Reorder sidebar sections | 2026-02-09 | 720e5dd5 | [009-reorder-sidebar-sections](./quick/009-reorder-sidebar-sections/) |
| 010 | Change Impact/Effort layout | 2026-02-09 | bd927544 | [010-change-impact-effort-layout](./quick/010-change-impact-effort-layout/) |
| 011 | Committee effort layout | 2026-02-09 | 4f11267a | [011-committee-effort-layout](./quick/011-committee-effort-layout/) |

## Session Continuity

Last session: 2026-02-09
Stopped at: Completed quick-011: Committee effort layout
Resume file: None
Next: Phase 6 (Admin GUI & Reporting) is the only remaining phase

---
*State initialized: 2026-02-03*
*Last updated: 2026-02-09 (quick-011 complete)*
