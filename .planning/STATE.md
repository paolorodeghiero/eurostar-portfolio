# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Enable clear visibility into the IT project portfolio with accurate budget tracking and governance
**Current focus:** Phase 2 - Core Projects (Complete)

## Current Position

Phase: 3 of 6 (Financial Tracking)
Plan: 2 of 8 in current phase
Status: In progress
Last activity: 2026-02-05 - Completed 03-02-PLAN.md (Budget Lines Admin API)

Progress: [███████░░░░░░░░░] 44% (18/41 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 18
- Average duration: 10 min
- Total execution time: 3.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 6 | 82m | 14m |
| 02 | 10 | 61m | 6m |
| 03 | 2 | 43m | 22m |

**Recent Trend:**
- Last 5 plans: 02-08 (7m), 02-09 (7m), 02-10 (10m), 03-01 (23m), 03-02 (20m)
- Trend: Phase 3 longer (schema/import setup)

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

### Pending Todos

2 pending — `/gsd:check-todos` to review

### Blockers/Concerns

- Database migration 0002 not applied - requires Docker/PostgreSQL running (03-01)
- Migration file ready, can be applied with: `docker compose up -d && cd backend && npx drizzle-kit push`

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 03-02-PLAN.md (Budget Lines Admin API)
Resume file: None

---
*State initialized: 2026-02-03*
*Last updated: 2026-02-05*
