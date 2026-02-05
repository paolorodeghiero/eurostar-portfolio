# Requirements: Eurostar Portfolio Tool

**Defined:** 2026-02-03
**Core Value:** Enable clear visibility into the IT project portfolio with accurate budget tracking and governance

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Authorization

- [ ] **AUTH-01**: User can log in via EntraID
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: Admin group members can access referential management
- [ ] **AUTH-04**: Regular users can access portfolio operations only
- [ ] **AUTH-05**: API validates EntraID tokens on each request
- [ ] **AUTH-06**: Dev mode disables authentication for local development

### Projects

- [ ] **PROJ-01**: User can create project with auto-generated ID (PRJ-YYYY-INC)
- [ ] **PROJ-02**: User can view project details in sidebar overlay
- [ ] **PROJ-03**: User can edit project core fields (name, status, dates, lead team)
- [ ] **PROJ-04**: User can edit project people (PM, IS Owner, Sponsor) with autocomplete
- [ ] **PROJ-05**: User can stop a project (status change)
- [ ] **PROJ-06**: User can delete project only if no actuals associated
- [ ] **PROJ-07**: Lead team appears in involved teams with effort

### Teams & Effort

- [ ] **TEAM-01**: User can add/remove involved teams with T-shirt effort size
- [ ] **TEAM-02**: Lead team is visually distinguished in involved teams display
- [ ] **TEAM-03**: Effort T-shirt sizes follow guidelines (XS<50md, S<50md, M<150md, L<250md, XL<500md, XXL>500md)

### Value Scoring

- [ ] **VALU-01**: User can score project impact (1-5) for each outcome
- [ ] **VALU-02**: User can add optional justification text per score
- [ ] **VALU-03**: User can toggle Regulatory Compliance flag
- [ ] **VALU-04**: Scoring examples from referential guide uniform scoring

### Change Impact

- [ ] **CHNG-01**: User can add/remove change impact teams with T-shirt size
- [ ] **CHNG-02**: Change impact uses same team list as involved teams

### Budget

- [ ] **BUDG-01**: User can set total OPEX and CAPEX with currency
- [ ] **BUDG-02**: User can map project to budget lines with allocation amounts
- [ ] **BUDG-03**: System blocks allocation exceeding budget line available amount
- [ ] **BUDG-04**: System alerts when mapped amounts don't match declared totals
- [ ] **BUDG-05**: Cost T-shirt derived automatically from total budget

### Budget Lines Import

- [ ] **BLIN-01**: Admin can import budget lines from Excel
- [ ] **BLIN-02**: Budget lines include Company, Department, Cost Center, Line Value, Line Amount, Currency, CAPEX/OPEX
- [ ] **BLIN-03**: Import available in Admin GUI

### Engagement Committee

- [ ] **GOVN-01**: Committee activation determined by budget thresholds (mandatory/optional/not necessary)
- [ ] **GOVN-02**: User can progress project through committee steps (Draft→Presented→Discussion→Approved/Rejected)
- [ ] **GOVN-03**: User can upload business case file
- [ ] **GOVN-04**: Committee step shown in portfolio table

### Actuals

- [ ] **ACTL-01**: User can import receipts via API or Excel
- [ ] **ACTL-02**: User can import invoices via API or Excel
- [ ] **ACTL-03**: Receipts validate ProjectId exists
- [ ] **ACTL-04**: Invoices derive CompetenceMonth from description via regex
- [ ] **ACTL-05**: System alerts when CompetenceMonth defaults (extraction failed)
- [ ] **ACTL-06**: User can manually override CompetenceMonth
- [ ] **ACTL-07**: Actuals stored in original currency
- [ ] **ACTL-08**: Actuals summary shown in project sidebar (read-only)

### Portfolio GUI

- [ ] **PGUI-01**: Main view shows configurable table with projects
- [ ] **PGUI-02**: User can show/hide columns
- [ ] **PGUI-03**: User can reorder columns
- [ ] **PGUI-04**: User can filter by any column
- [ ] **PGUI-05**: User can search across projects (global search)
- [ ] **PGUI-06**: Click row opens sidebar overlay with all sections
- [ ] **PGUI-07**: Table shows aggregate indicators (value, effort tags, budget health, committee step)
- [ ] **PGUI-08**: Top bar shows alerts with count badge
- [ ] **PGUI-09**: Top bar has link to Admin GUI
- [ ] **PGUI-10**: Top bar has upload actuals button

### Admin GUI

- [ ] **ADMN-01**: Admin can view list of referential types
- [ ] **ADMN-02**: Admin can CRUD items in each referential
- [ ] **ADMN-03**: Each item shows usage count
- [ ] **ADMN-04**: Admin can see which projects use an item
- [ ] **ADMN-05**: Delete blocked if item is in use

### Referentials

- [ ] **REFD-01**: Departments with name
- [ ] **REFD-02**: Teams with name, description, department
- [ ] **REFD-03**: Statuses with name and color
- [ ] **REFD-04**: Outcomes with name, score examples (1-5)
- [ ] **REFD-05**: Currency exchange rates with validity period
- [ ] **REFD-06**: Cost centers with code and description
- [ ] **REFD-07**: Committee budget thresholds (mandatory/optional/not necessary)
- [ ] **REFD-08**: Cost T-shirt thresholds (budget amounts)
- [ ] **REFD-09**: CompetenceMonth regex patterns by company
- [ ] **REFD-10**: All referentials have stable IDs

### Alerts

- [ ] **ALRT-01**: Alert for projects overdue (end date passed, not completed)
- [ ] **ALRT-02**: Alert for projects approaching budget limit (configurable threshold)
- [ ] **ALRT-03**: Alerts displayed in top bar with count

### Audit History

- [ ] **AUDT-01**: System tracks every project field change
- [ ] **AUDT-02**: Each change records who (email), when (timestamp), what (field, old, new)
- [ ] **AUDT-03**: History viewable in project sidebar

### API

- [ ] **APID-01**: REST API for all project operations
- [ ] **APID-02**: REST API for referential management
- [ ] **APID-03**: REST API for actuals import
- [ ] **APID-04**: REST API for committee workflow transitions
- [ ] **APID-05**: REST API for alerts retrieval
- [ ] **APID-06**: REST API for audit history
- [ ] **APID-07**: OpenAPI/Swagger documentation
- [ ] **APID-08**: API authenticated via EntraID tokens
- [ ] **APID-09**: REST API for budget lines import (admin only)

### Reporting

- [ ] **REPT-01**: PostgreSQL views expose data in snowflake schema
- [ ] **REPT-02**: Views in dedicated reporting schema
- [ ] **REPT-03**: Currency conversion in views using exchange rate referential

### Look & Feel

- [ ] **UXUI-01**: Eurostar brand colors (teal toolbar, cream accents)
- [ ] **UXUI-02**: Modern sleek design (Linear/Notion style)
- [ ] **UXUI-03**: Clean typography, generous whitespace

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Portfolio Enhancements

- **DASH-01**: Portfolio dashboard with summary stats (counts by status, budget totals)
- **EXPO-01**: Export portfolio table to Excel
- **EXPO-02**: Export portfolio table to PDF
- **RISK-01**: Risk tracking per project (risk items with severity)
- **RISK-02**: Risk-based alerts

### Strategic Alignment

- **STRA-01**: Strategic themes referential
- **STRA-02**: Map projects to strategic themes
- **STRA-03**: Filter/group portfolio by strategic theme

### Resource Management

- **RSRC-01**: Resource capacity planning
- **RSRC-02**: Cross-project resource conflicts detection

### Advanced Features

- **DPND-01**: Cross-project dependency tracking
- **HLTH-01**: Portfolio health scoring (single metric)
- **TRND-01**: Time-series analysis (portfolio trends)
- **MOBL-01**: Mobile responsive design

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Delete projects with actuals | Preserve financial traceability |
| Department-scoped permissions | v1 uses simple admin/user groups; complex ACL deferred |
| Referential audit history | Less important than project history |
| Mobile-specific UI | Web-first approach |
| Task-level tracking | Use PM tools (Jira) integration instead |
| Built-in chat/docs | Integrate with Teams/SharePoint instead |
| Real-time updates | Near-real-time via refresh sufficient for low volume |
| AI-powered forecasting | Requires historical data; defer to v2+ |
| Scenario planning | Complex feature; defer to v2+ |
| Gantt charts | Power BI handles visual reporting |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| PROJ-01 | Phase 2 | Pending |
| PROJ-02 | Phase 2 | Pending |
| PROJ-03 | Phase 2 | Pending |
| PROJ-04 | Phase 2 | Pending |
| PROJ-05 | Phase 2 | Pending |
| PROJ-06 | Phase 2 | Pending |
| PROJ-07 | Phase 2 | Pending |
| TEAM-01 | Phase 2 | Pending |
| TEAM-02 | Phase 2 | Pending |
| TEAM-03 | Phase 2 | Pending |
| VALU-01 | Phase 2 | Pending |
| VALU-02 | Phase 2 | Pending |
| VALU-03 | Phase 2 | Pending |
| VALU-04 | Phase 2 | Pending |
| CHNG-01 | Phase 2 | Pending |
| CHNG-02 | Phase 2 | Pending |
| BUDG-01 | Phase 3 | Complete |
| BUDG-02 | Phase 3 | Complete |
| BUDG-03 | Phase 3 | Complete |
| BUDG-04 | Phase 3 | Complete |
| BUDG-05 | Phase 3 | Complete |
| BLIN-01 | Phase 3 | Complete |
| BLIN-02 | Phase 3 | Complete |
| BLIN-03 | Phase 3 | Complete |
| GOVN-01 | Phase 4 | Pending |
| GOVN-02 | Phase 4 | Pending |
| GOVN-03 | Phase 4 | Pending |
| GOVN-04 | Phase 4 | Pending |
| ACTL-01 | Phase 3 | Complete |
| ACTL-02 | Phase 3 | Complete |
| ACTL-03 | Phase 3 | Complete |
| ACTL-04 | Phase 3 | Complete |
| ACTL-05 | Phase 3 | Complete |
| ACTL-06 | Phase 3 | Complete |
| ACTL-07 | Phase 3 | Complete |
| ACTL-08 | Phase 3 | Complete |
| PGUI-01 | Phase 5 | Pending |
| PGUI-02 | Phase 5 | Pending |
| PGUI-03 | Phase 5 | Pending |
| PGUI-04 | Phase 5 | Pending |
| PGUI-05 | Phase 5 | Pending |
| PGUI-06 | Phase 5 | Pending |
| PGUI-07 | Phase 5 | Pending |
| PGUI-08 | Phase 5 | Pending |
| PGUI-09 | Phase 5 | Pending |
| PGUI-10 | Phase 5 | Pending |
| ADMN-01 | Phase 1 | Pending |
| ADMN-02 | Phase 1 | Pending |
| ADMN-03 | Phase 1 | Pending |
| ADMN-04 | Phase 1 | Pending |
| ADMN-05 | Phase 1 | Pending |
| REFD-01 | Phase 1 | Pending |
| REFD-02 | Phase 1 | Pending |
| REFD-03 | Phase 1 | Pending |
| REFD-04 | Phase 1 | Pending |
| REFD-05 | Phase 1 | Pending |
| REFD-06 | Phase 1 | Pending |
| REFD-07 | Phase 1 | Pending |
| REFD-08 | Phase 1 | Pending |
| REFD-09 | Phase 1 | Pending |
| REFD-10 | Phase 1 | Pending |
| ALRT-01 | Phase 4 | Pending |
| ALRT-02 | Phase 4 | Pending |
| ALRT-03 | Phase 4 | Pending |
| AUDT-01 | Phase 4 | Pending |
| AUDT-02 | Phase 4 | Pending |
| AUDT-03 | Phase 4 | Pending |
| APID-01 | Phase 2 | Pending |
| APID-02 | Phase 6 | Pending |
| APID-03 | Phase 3 | Complete |
| APID-04 | Phase 4 | Pending |
| APID-05 | Phase 4 | Pending |
| APID-06 | Phase 4 | Pending |
| APID-07 | Phase 6 | Pending |
| APID-08 | Phase 6 | Pending |
| APID-09 | Phase 3 | Complete |
| REPT-01 | Phase 6 | Pending |
| REPT-02 | Phase 6 | Pending |
| REPT-03 | Phase 6 | Pending |
| UXUI-01 | Phase 5 | Pending |
| UXUI-02 | Phase 5 | Pending |
| UXUI-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 72 total
- Mapped to phases: 72
- Unmapped: 0 (100% coverage achieved)

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after roadmap creation*
