# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Enable clear visibility into the IT project portfolio with accurate budget tracking and governance
**Current focus:** Phase 2 - Core Projects

## Current Position

Phase: 2 of 6 (Core Projects)
Plan: 7 of 10 in current phase
Status: In progress
Last activity: 2026-02-03 - Completed 02-07-PLAN.md (Teams tab with chips)

Progress: [████████████░] ~95%

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 10 min
- Total execution time: 2.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 6 | 82m | 14m |
| 02 | 7 | 37m | 5m |

**Recent Trend:**
- Last 5 plans: 02-03 (4m), 02-04 (3m), 02-05 (8m), 02-06 (8m), 02-07 (6m)
- Trend: Execution time consistent

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-03
Stopped at: Completed 02-07-PLAN.md (Teams tab with chips)
Resume file: None

---
*State initialized: 2026-02-03*
*Last updated: 2026-02-03*
