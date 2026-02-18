# Roadmap: Eurostar Portfolio Tool

## Overview

This roadmap delivers a portfolio management tool for Eurostar IT projects from foundation to full production. Starting with authentication and core data structures, we progressively build project management, financial tracking, governance workflows, and finally user interfaces with Power BI integration. Each phase delivers verifiable capabilities, building naturally from foundational entities through complex workflows to complete user experiences.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Authentication** - Database schema, auth, and referentials
- [x] **Phase 2: Core Projects** - Project CRUD with teams, scoring, and change impact
- [x] **Phase 3: Financial Tracking** - Budget lines, actuals import, and financial calculations
- [x] **Phase 4: Governance & Workflow** - Engagement Committee workflow and audit trail
- [x] **Phase 5: Portfolio GUI** - Main user interface for portfolio operations
- [x] **Phase 6: Admin GUI & Reporting** - Admin interface, Power BI integration, and API documentation
- [x] **Phase 7: Refactor & Reorganize** - Table redesign, sidebar reorganization, currency model fix

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Establish authentication, database foundation, and master data management
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, REFD-01, REFD-02, REFD-03, REFD-04, REFD-05, REFD-06, REFD-07, REFD-08, REFD-09, REFD-10, ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05
**Success Criteria** (what must be TRUE):
  1. User can log in via EntraID and session persists across browser refresh
  2. Admin group members can access referential management while regular users cannot
  3. API validates EntraID tokens on every request and rejects invalid tokens
  4. Dev mode allows local development without authentication when enabled
  5. All referentials (departments, teams, statuses, outcomes, cost centers, thresholds, currency rates, regex patterns) can be created, edited, and deleted with usage protection
  6. Each referential item shows usage count and deletion is blocked when item is in use
**Plans**: 7 plans

Plans:
- [x] 01-01-PLAN.md - Project scaffolding + Database schema with all referential tables
- [x] 01-02-PLAN.md - Backend authentication plugin + dev mode bypass
- [x] 01-03-PLAN.md - Frontend MSAL authentication with session persistence
- [x] 01-04-PLAN.md - Referential CRUD API endpoints with usage tracking
- [x] 01-05-PLAN.md - Admin GUI with data tables and delete protection
- [x] 01-06-PLAN.md - Integration verification checkpoint
- [x] 01-07-PLAN.md - Human verification of all Phase 1 success criteria

### Phase 2: Core Projects
**Goal**: Enable complete project management with multi-dimensional scoring
**Depends on**: Phase 1
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, PROJ-07, TEAM-01, TEAM-02, TEAM-03, VALU-01, VALU-02, VALU-03, VALU-04, CHNG-01, CHNG-02, APID-01
**Success Criteria** (what must be TRUE):
  1. User can create projects with auto-generated IDs in PRJ-YYYY-INC format
  2. User can view and edit all project sections (core fields, people, teams & effort, value scores, change impact)
  3. Lead team automatically appears in involved teams with their effort size
  4. User can score projects across all value dimensions (1-5) with optional justification text
  5. User can add/remove involved teams and change impact teams with T-shirt sizes
  6. User can stop projects and delete projects only when no actuals are associated
  7. All project operations are available via REST API
**Plans**: 10 plans

Plans:
- [x] 02-01-PLAN.md - Database schema for projects and related tables
- [x] 02-02-PLAN.md - Install shadcn/ui components for sidebar and forms
- [x] 02-03-PLAN.md - Project CRUD API with optimistic locking
- [x] 02-04-PLAN.md - Project teams, values, and change impact API
- [x] 02-05-PLAN.md - Portfolio page with sidebar shell and auto-save hook
- [x] 02-06-PLAN.md - General and People tabs with form fields
- [x] 02-07-PLAN.md - Teams tab with chip interface
- [x] 02-08-PLAN.md - Value tab with scoring cards and slider
- [x] 02-09-PLAN.md - Change Impact tab, menu actions, and create dialog
- [x] 02-10-PLAN.md - Conflict resolution and integration verification

### Phase 3: Financial Tracking
**Goal**: Enable comprehensive budget management and actuals tracking
**Depends on**: Phase 2
**Requirements**: BUDG-01, BUDG-02, BUDG-03, BUDG-04, BUDG-05, BLIN-01, BLIN-02, BLIN-03, ACTL-01, ACTL-02, ACTL-03, ACTL-04, ACTL-05, ACTL-06, ACTL-07, ACTL-08, APID-03, APID-09
**Success Criteria** (what must be TRUE):
  1. Admin can import budget lines from Excel with company, department, cost center, line value, amount, currency, and CAPEX/OPEX classification
  2. User can set project total OPEX and CAPEX with currency and map to budget lines with allocation amounts
  3. System blocks allocations exceeding budget line available amounts
  4. System alerts when mapped amounts don't match declared totals
  5. Cost T-shirt is derived automatically from total budget (OPEX + CAPEX)
  6. User can import receipts and invoices via API or Excel in original currency
  7. System validates receipt ProjectIds exist and derives invoice CompetenceMonth from description via regex
  8. User can manually override CompetenceMonth and system alerts when extraction fails
  9. Actuals summary appears in project sidebar showing totals vs budget
**Plans**: 8 plans

Plans:
- [x] 03-01-PLAN.md - Database schema for financial tables (budget lines, allocations, receipts, invoices)
- [x] 03-02-PLAN.md - Budget lines API with Excel import and validation
- [x] 03-03-PLAN.md - Project budget API with allocation validation and cost T-shirt derivation
- [x] 03-04-PLAN.md - Actuals APIs for receipts and invoices with competence month extraction
- [x] 03-05-PLAN.md - Budget lines admin page with import dialog
- [x] 03-06-PLAN.md - Budget tab in project sidebar with allocations
- [x] 03-07-PLAN.md - Actuals summary and upload dialog
- [x] 03-08-PLAN.md - Integration verification checkpoint

### Phase 4: Governance & Workflow
**Goal**: Enable Engagement Committee workflow and complete audit trail
**Depends on**: Phase 3
**Requirements**: GOVN-01, GOVN-02, GOVN-03, GOVN-04, AUDT-01, AUDT-02, AUDT-03, ALRT-01, ALRT-02, ALRT-03, APID-04, APID-05, APID-06
**Success Criteria** (what must be TRUE):
  1. Committee activation is determined automatically by budget thresholds (mandatory/optional/not necessary)
  2. User can progress projects through all committee steps (Draft → Presented → Discussion → Approved/Rejected)
  3. User can upload business case files for committee review
  4. Committee step appears in portfolio table as aggregate indicator
  5. System tracks every project field change with who (email), when (timestamp), and what (field, old value, new value)
  6. History is viewable in project sidebar showing all changes
  7. Alerts appear for projects overdue (end date passed, not completed) and approaching budget limits
  8. All workflow transitions and audit queries are available via REST API
**Plans**: 10 plans

Plans:
- [x] 04-01-PLAN.md - Database schema for governance (committee columns, audit_log, alert_config)
- [x] 04-02-PLAN.md - PostgreSQL audit trigger with user context
- [x] 04-03-PLAN.md - Committee workflow API with state machine
- [x] 04-04-PLAN.md - Business case file upload/download API
- [x] 04-05-PLAN.md - Alerts API with configuration
- [x] 04-06-PLAN.md - Audit history API endpoint
- [x] 04-07-PLAN.md - Committee tab UI with state transitions
- [x] 04-08-PLAN.md - History tab UI with timeline
- [x] 04-09-PLAN.md - Alerts dropdown in top bar
- [x] 04-10-PLAN.md - Integration verification checkpoint

### Phase 5: Portfolio GUI
**Goal**: Deliver main user interface for all portfolio operations
**Depends on**: Phase 4
**Requirements**: PGUI-01, PGUI-02, PGUI-03, PGUI-04, PGUI-05, PGUI-06, PGUI-07, PGUI-08, PGUI-09, PGUI-10, UXUI-01, UXUI-02, UXUI-03
**Success Criteria** (what must be TRUE):
  1. Portfolio table displays all projects with configurable columns (show/hide, reorder)
  2. User can filter projects by any column and search globally across all projects
  3. Table shows aggregate indicators for value score, effort tags, budget health, actuals vs budget, and committee step
  4. Clicking any row opens sidebar overlay with all project sections (header, people, teams, value, change impact, budget, committee, actuals, history)
  5. Top bar shows alerts with count badge, link to Admin GUI, and upload actuals button
  6. User can save, cancel, stop, and delete projects from sidebar
  7. UI uses Eurostar brand colors (teal toolbar, cream accents) with modern sleek design
  8. All interactions maintain clean typography and generous whitespace
**Plans**: 6 plans

Plans:
- [x] 05-01-PLAN.md - Install dnd-kit, useTableState hook, column definitions with mini-visualization cells
- [x] 05-02-PLAN.md - PortfolioHeader top bar with Eurostar branding
- [x] 05-03-PLAN.md - PortfolioTable with virtual scrolling and sorting
- [x] 05-04-PLAN.md - Column picker, density toggle, draggable column headers
- [x] 05-05-PLAN.md - Global search, column filters, filter chips
- [x] 05-06-PLAN.md - Full integration and verification checkpoint

### Phase 6: Admin GUI & Reporting
**Goal**: Complete admin interface, Power BI integration, and API documentation
**Depends on**: Phase 5
**Requirements**: APID-02, APID-07, APID-08, REPT-01, REPT-02, REPT-03
**Success Criteria** (what must be TRUE):
  1. Admin GUI displays list of all referential types with CRUD tables per type
  2. Admin can see which projects use each referential item before attempting deletion
  3. PostgreSQL views expose data in snowflake schema within dedicated reporting schema
  4. Views perform currency conversion using exchange rate referential for reporting
  5. Power BI can connect via DirectQuery to reporting schema
  6. OpenAPI/Swagger documentation is available showing all endpoints with examples and error responses
  7. All API endpoints require EntraID token authentication matching frontend
**Plans**: 7 plans

Plans:
- [x] 06-01-PLAN.md - Swagger/OpenAPI setup with Eurostar branding and EntraID auth
- [x] 06-02-PLAN.md - PostgreSQL reporting views (dim_*, fact_*) for Power BI
- [x] 06-03-PLAN.md - Admin backend: audit log endpoint, usage endpoints, bulk import/export
- [x] 06-04-PLAN.md - Frontend: API link in navbar, UsageDrawer component
- [x] 06-05-PLAN.md - AuditLogPage, AlertDialog confirmations, UsageDrawer integration
- [x] 06-06-PLAN.md - Bulk import/export UI for admin referential pages
- [x] 06-07-PLAN.md - Integration verification and phase completion

### Phase 7: Refactor and Reorganize Information Between Main Table and Sidebar
**Goal**: Refactor portfolio table with new visualizations (radar charts, expandable rows, column pinning) and reorganize sidebar tabs (merge People into General, rename Teams to Effort, add Description field, fix currency model)
**Depends on**: Phase 6
**Success Criteria** (what must be TRUE):
  1. Value column shows mini radar chart instead of dots
  2. Effort and Impact columns show aggregate T-shirt with expandable sub-rows
  3. Budget column shows progress bar plus spent/total text
  4. Committee column shows level badge, progression dots, and state text
  5. First 3 columns (checkbox, ID, name) are frozen on horizontal scroll
  6. New columns available: Dates, IS Owner, Sponsor, Cost T-shirt, Last Activity
  7. GeneralTab contains merged sections: Core Info, People, Description (rich text), Business Case
  8. Teams tab renamed to Effort with global T-shirt at top
  9. Value tab shows large radar chart with dimension labels
  10. Budget tab shows OPEX/CAPEX as side-by-side cards
  11. All monetary values stored in EUR, converted at API boundary for display
**Plans**: 10 plans

Plans:
- [x] 07-01-PLAN.md - Add description field and fix currency model (backend)
- [x] 07-02-PLAN.md - Install recharts/date-fns and create ValueScoreCell, LastActivityCell, DateRangeCell, CostTshirtCell
- [x] 07-03-PLAN.md - Create expandable EffortCell/ImpactCell with sub-rows
- [x] 07-04-PLAN.md - Update BudgetHealthCell and CommitteeCell visualizations
- [x] 07-05-PLAN.md - Integrate columns, add column pinning and expandable rows to table
- [x] 07-06-PLAN.md - Install Tiptap and create DescriptionEditor
- [x] 07-07-PLAN.md - Merge People into GeneralTab with sections
- [x] 07-08-PLAN.md - Update TeamsTab, ValueTab, BudgetTab with new layouts
- [x] 07-09-PLAN.md - Update CommitteeTab and ProjectTabs configuration
- [x] 07-10-PLAN.md - Integration and verification checkpoint

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 7/7 | Complete | 2026-02-09 |
| 2. Core Projects | 10/10 | Complete | 2026-02-03 |
| 3. Financial Tracking | 8/8 | Complete | 2026-02-06 |
| 4. Governance & Workflow | 10/10 | Complete | 2026-02-09 |
| 5. Portfolio GUI | 6/6 | Complete | 2026-02-09 |
| 6. Admin GUI & Reporting | 7/7 | Complete | 2026-02-15 |
| 7. Refactor & Reorganize | 10/10 | Complete | 2026-02-09 |

### Phase 8: Data import script

**Goal:** Create maintainable import scripts with three-stage pipeline (extract, validate, load) for loading TPO Portfolio.xlsx data into the portfolio system
**Depends on:** Phase 7
**Success Criteria** (what must be TRUE):
  1. Extract stage reads TPO Portfolio.xlsx and generates CSV staging files per entity
  2. Validate stage checks schema compliance and referential integrity against database
  3. Load stage inserts/updates projects with interactive conflict resolution
  4. YAML mapping configs externalize status, team, outcome, and T-shirt size transformations
  5. L/M/H values map to T-shirt sizes: L to S, M to M, H to L
  6. Missing teams/departments are auto-created during import
  7. Child entities use merge strategy (add new, keep existing, never delete)
  8. Dry-run mode previews changes without database modification
  9. Import tracking columns mark imported projects for future updates
**Plans:** 6 plans

Plans:
- [ ] 08-01-PLAN.md - Setup import infrastructure, dependencies, and database migration
- [ ] 08-02-PLAN.md - Create YAML mapping configs and mapping loader utility
- [ ] 08-03-PLAN.md - Extract stage: Excel reader, CSV writer, entity extraction
- [ ] 08-04-PLAN.md - Validate stage: Schema and referential integrity checking
- [ ] 08-05-PLAN.md - Load stage: Database insertion with conflict resolution
- [ ] 08-06-PLAN.md - Combined orchestrator, npm scripts, and Makefile targets

### Phase 9: Import budget file

**Goal:** [To be planned]
**Depends on:** Phase 8
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 9 to break down)

### Phase 10: Add test suite including frontend non-regression tests

**Goal:** Comprehensive test suite with Vitest for unit/integration tests, Playwright for E2E and visual regression, MSW for API mocking, and CI/CD integration
**Depends on:** Phase 9
**Requirements:** TEST-INFRA, TEST-BACKEND-API, TEST-BACKEND-UNIT, TEST-FRONTEND-COMPONENT, TEST-FRONTEND-UNIT, TEST-E2E, TEST-VISUAL, TEST-CI
**Success Criteria** (what must be TRUE):
  1. Running `npm test` in both frontend and backend executes Vitest with coverage reporting
  2. Backend API tests use Fastify injection against test database with isolated fixtures
  3. Frontend component tests use React Testing Library with MSW for API mocking
  4. E2E tests verify critical user journeys (auth, project CRUD, admin operations)
  5. Visual regression tests capture screenshots of all pages/routes
  6. CI runs all tests on every PR with PostgreSQL service container
  7. Coverage reports aim for 80%+ and are posted to PRs
**Plans:** 6 plans

Plans:
- [x] 10-01-PLAN.md — Test infrastructure setup (Vitest for frontend/backend)
- [ ] 10-02-PLAN.md — Backend API integration tests and unit tests
- [ ] 10-03-PLAN.md — Frontend component tests with MSW
- [ ] 10-04-PLAN.md — E2E tests with Playwright
- [ ] 10-05-PLAN.md — Visual regression tests
- [ ] 10-06-PLAN.md — CI/CD integration and verification

---
*Roadmap created: 2026-02-03*
*Depth: standard (6 phases derived from 72 requirements)*
