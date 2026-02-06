# Roadmap: Eurostar Portfolio Tool

## Overview

This roadmap delivers a portfolio management tool for Eurostar IT projects from foundation to full production. Starting with authentication and core data structures, we progressively build project management, financial tracking, governance workflows, and finally user interfaces with Power BI integration. Each phase delivers verifiable capabilities, building naturally from foundational entities through complex workflows to complete user experiences.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Authentication** - Database schema, auth, and referentials
- [ ] **Phase 2: Core Projects** - Project CRUD with teams, scoring, and change impact
- [x] **Phase 3: Financial Tracking** - Budget lines, actuals import, and financial calculations
- [ ] **Phase 4: Governance & Workflow** - Engagement Committee workflow and audit trail
- [ ] **Phase 5: Portfolio GUI** - Main user interface for portfolio operations
- [ ] **Phase 6: Admin GUI & Reporting** - Admin interface, Power BI integration, and API documentation

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
**Plans**: 6 plans

Plans:
- [ ] 01-01-PLAN.md - Project scaffolding + Database schema with all referential tables
- [ ] 01-02-PLAN.md - Backend authentication plugin + dev mode bypass
- [ ] 01-03-PLAN.md - Frontend MSAL authentication with session persistence
- [ ] 01-04-PLAN.md - Referential CRUD API endpoints with usage tracking
- [ ] 01-05-PLAN.md - Admin GUI with data tables and delete protection
- [ ] 01-06-PLAN.md - Integration verification checkpoint

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
- [ ] 02-01-PLAN.md - Database schema for projects and related tables
- [ ] 02-02-PLAN.md - Install shadcn/ui components for sidebar and forms
- [ ] 02-03-PLAN.md - Project CRUD API with optimistic locking
- [ ] 02-04-PLAN.md - Project teams, values, and change impact API
- [ ] 02-05-PLAN.md - Portfolio page with sidebar shell and auto-save hook
- [ ] 02-06-PLAN.md - General and People tabs with form fields
- [ ] 02-07-PLAN.md - Teams tab with chip interface
- [ ] 02-08-PLAN.md - Value tab with scoring cards and slider
- [ ] 02-09-PLAN.md - Change Impact tab, menu actions, and create dialog
- [ ] 02-10-PLAN.md - Conflict resolution and integration verification

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
- [ ] 03-01-PLAN.md - Database schema for financial tables (budget lines, allocations, receipts, invoices)
- [ ] 03-02-PLAN.md - Budget lines API with Excel import and validation
- [ ] 03-03-PLAN.md - Project budget API with allocation validation and cost T-shirt derivation
- [ ] 03-04-PLAN.md - Actuals APIs for receipts and invoices with competence month extraction
- [ ] 03-05-PLAN.md - Budget lines admin page with import dialog
- [ ] 03-06-PLAN.md - Budget tab in project sidebar with allocations
- [ ] 03-07-PLAN.md - Actuals summary and upload dialog
- [ ] 03-08-PLAN.md - Integration verification checkpoint

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
- [ ] 04-01-PLAN.md - Database schema for governance (committee columns, audit_log, alert_config)
- [ ] 04-02-PLAN.md - PostgreSQL audit trigger with user context
- [ ] 04-03-PLAN.md - Committee workflow API with state machine
- [ ] 04-04-PLAN.md - Business case file upload/download API
- [ ] 04-05-PLAN.md - Alerts API with configuration
- [ ] 04-06-PLAN.md - Audit history API endpoint
- [ ] 04-07-PLAN.md - Committee tab UI with state transitions
- [ ] 04-08-PLAN.md - History tab UI with timeline
- [ ] 04-09-PLAN.md - Alerts dropdown in top bar
- [ ] 04-10-PLAN.md - Integration verification checkpoint

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
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD
- [ ] 05-04: TBD

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
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 6/6 | Complete | 2026-02-03 |
| 2. Core Projects | 10/10 | Complete | 2026-02-03 |
| 3. Financial Tracking | 8/8 | Complete | 2026-02-06 |
| 4. Governance & Workflow | 0/10 | Not started | - |
| 5. Portfolio GUI | 0/TBD | Not started | - |
| 6. Admin GUI & Reporting | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-03*
*Depth: standard (6 phases derived from 72 requirements)*
