# Eurostar Portfolio Tool

## What This Is

A portfolio management tool for Eurostar that allows tracking, prioritizing, and governing IT projects across the organization. It provides a GUI for portfolio operations and referential management, plus a full API for automation and external integration. Designed to support multi-dimensional scoring (value, effort, change impact, cost), budget tracking with line-level allocation, actuals import, and governance workflows.

## Core Value

Enable clear visibility into the IT project portfolio with accurate budget tracking and governance — if nothing else works, users must be able to see their projects, their budget status, and make informed prioritization decisions.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Project management with unique IDs (PRJ-YYYY-INC format)
- [ ] Referential management for departments, teams, statuses, outcomes, and other master data
- [ ] Multi-dimensional project scoring (value, effort, change impact, cost)
- [ ] Budget tracking with line-level allocation and guardrails
- [ ] Actuals import (receipts and invoices) via API and Excel
- [ ] Engagement Committee governance workflow
- [ ] Portfolio GUI with configurable table and sidebar detail view
- [ ] Admin GUI for referential CRUD with usage tracking
- [ ] Full REST API with complete GUI parity
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Audit history for project changes
- [ ] Alerts for overdue projects and budget thresholds
- [ ] Power BI integration via snowflake schema database views
- [ ] EntraID authentication with group-based authorization
- [ ] Dev mode to disable authentication for local development

### Out of Scope

- Delete projects with associated actuals — preserve financial traceability
- Complex permission model (department-scoped access) — v1 uses simple admin/user groups
- Referential audit history — less important than project history
- Mobile-specific UI — web-first

## Context

**Domain**: IT portfolio management for a railway company (Eurostar), tracking projects across Information Systems department teams.

**Users**:
- Portfolio managers operating day-to-day
- Administrators managing referentials
- External systems consuming the API
- Power BI for reporting

**Key entities**:
- Projects with properties across multiple sections (core info, teams, value, budget, actuals, governance)
- Referentials with stable IDs (departments, teams, statuses, outcomes, thresholds, currency exchange, cost centers, regex patterns)
- Budget lines imported from Excel with CAPEX/OPEX classification
- Actuals (receipts and invoices) imported via API/Excel

**Company structure**:
- Two companies: THIF and EIL
- Department: Information Systems
- Teams: Cyber Security, Operations Systems, Corporate HR and Finance Systems, Customer Systems, Data & Middleware, Digital Technology, IT Service

**Currency**: EUR and GBP with exchange rate referential for reporting conversions (store in original currency)

## Constraints

- **Tech stack**: Full TypeScript (frontend + backend), PostgreSQL database — single language for simplicity
- **Deployment**: Must run fully locally (Docker + local tools) and deploy to Azure Container Apps/Kubernetes
- **Simplicity**: Low volume business app — favor readability and simplicity over optimization
- **Authentication**: EntraID with token-based API auth, dev mode bypass for local development
- **Data integrity**: Store actuals in original currency, convert only at reporting level
- **Financial guardrails**: Block over-allocation from budget lines, alert on budget mismatches

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full TypeScript stack | Single language across frontend/backend for simplicity and team consistency | — Pending |
| PostgreSQL with snowflake views | Operational DB plus analytical views for Power BI integration | — Pending |
| EntraID authentication | Enterprise standard, integrates with existing Eurostar identity | — Pending |
| Store currency at source | Preserve data integrity, convert only for reporting | — Pending |
| Sleek modern UI (Linear/Notion style) | Professional, clean, aligned with modern tool expectations | — Pending |

---

## Detailed Specifications

### Project Entity

**Core Fields:**
- `projectId`: Immutable, human-readable (PRJ-YYYY-INC format)
- `name`: Project name
- `status`: Single-select from referential (Draft, Ready, On Track, Issues, At Risk, Completed) with color
- `startDate`: Date
- `endDate`: Date
- `leadTeam`: Single-select from teams referential
- `projectManager`: Text with autocomplete (from previous values)
- `isOwner`: Text with autocomplete (from previous values)
- `sponsor`: Text with autocomplete (separate list from PM/IS Owner)

**Teams & Effort Section:**
- `involvedTeams`: Multi-select with T-shirt size per team (XS < 50md, S < 50md, M < 150md, L < 250md, XL < 500md, XXL > 500md)
- Lead team must appear in involved teams with their effort
- Visual distinction for lead team in display

**Value Section:**
- Impact scores (1-5) for: Punctuality (T15), People Engagement, EBITDA, NPS, Safety
- Each with optional justification text
- Regulatory Compliance: Boolean flag (not scored)
- Scoring examples provided in referential for uniformity

**Change Impact Section:**
- Teams from same list as involved teams
- T-shirt size per team indicating change impact (who is affected, not who builds)

**Budget Section:**
- `totalOpex`: Decimal with currency (EUR/GBP)
- `totalCapex`: Decimal with currency (EUR/GBP)
- Budget line mappings: allocations from imported budget lines
- Guardrails: block over-allocation, alert on mismatch between declared totals and mapped amounts

**Engagement Committee Section:**
- Steps: Draft → Presented → Discussion → Approved/Rejected
- Business case file upload
- Activation based on configurable budget thresholds (mandatory/optional/not necessary)
- Single committee

**Cost Scoring:**
- T-shirt size derived automatically from total budget (OPEX + CAPEX)
- Thresholds configured in referential (EUR amounts)

### Referentials

All referentials have stable IDs, usage count, and delete protection when in use.

**Departments & Teams:**
- Department has name
- Team has name, description/examples, belongs to department

**Initial Teams (Information Systems):**
- Cyber Security
- Operations Systems (Supervision, Depot, Train)
- Corporate, HR and Finance Systems
- Customer Systems (Loyalty, Cust Service, OBS & Stations)
- Data & Middleware
- Digital Technology (Website, App, Inventory)
- IT Service (infrastructure, service desk)

**Statuses:**
- Draft, Ready, On Track, Issues, At Risk, Completed
- Each with associated color

**Outcomes (for value scoring):**
- Punctuality (T15), People Engagement, EBITDA, NPS, Safety — scored 1-5 with examples
- Regulatory Compliance — boolean

**Other Referentials:**
- Currency exchange rates (EUR/GBP) with validity period (start/end date)
- Cost centers (code + description)
- Budget thresholds for Engagement Committee (amount triggers mandatory/optional/not necessary)
- Cost T-shirt thresholds (budget amounts for XS/S/M/L/XL/XXL)
- CompetenceMonth regex patterns (by company: THIF, EIL)

### Budget Lines

Imported from Excel:
- Company, Department, Cost Center, Line Value, Line Amount, Currency
- CAPEX/OPEX classification

### Actuals

**Receipts:**
- ProjectId (must match existing project)
- Amount (decimal)
- Currency (EUR/GBP)
- Supplier (string)
- Purchase Order (string)
- Company (THIF/EIL)
- Cost Center (string, validated against referential)
- Date
- Person (optional)
- Item (optional)

**Invoices:**
- DocumentId
- Purchase Order
- Company (THIF/EIL)
- Cost Center
- Amount (decimal)
- Currency (EUR/GBP)
- InvoiceDate
- CompetenceMonth (YYYY-MM, derived from description via regex, defaults to InvoiceDate - 1 month with alert, manually overridable)
- Description

Import via API or Excel. Store in original currency.

### GUI

**Portfolio GUI (main):**
- Main view: Configurable table (show/hide columns, reorder, filter)
- Default columns: ProjectId, Project Name, Lead Team, Status, IS Owner, aggregate section indicators
- Aggregate indicators: Value score, Effort (team tags with T-shirts), Budget health, Actuals vs budget, Committee step
- Click row → sidebar overlay with full detail sections
- Sidebar sections: Header, People, Teams & Effort, Value, Change Impact, Budget, Engagement Committee, Actuals (read-only summary), History
- Actions: Save, Cancel, Stop project, Delete (only if no actuals)
- Minimal inline editing in table

**Top bar:**
- Link to Admin/Referential GUI
- Upload actuals button
- Alerts section with count badge

**Alerts:**
- Projects overdue (end date passed, not completed)
- Projects approaching budget limit (configurable threshold %)

**Admin GUI:**
- List of referential types
- CRUD table per type
- Usage count per item
- Click to see which projects use item
- Delete blocked if usage > 0

### API

Full REST API with complete GUI parity:
- Projects CRUD (create, read, update, stop, delete with guardrails)
- Budget line mappings
- Actuals import (receipts, invoices)
- Engagement Committee workflow transitions
- Referential management
- Alerts retrieval
- Historical/audit data
- Portfolio queries with filtering

OpenAPI/Swagger documentation with clear examples and error responses.
EntraID token authentication (same as frontend).

### Audit History

For projects:
- Track every change: field, old value, new value
- Who (email from EntraID token)
- When (timestamp)
- Viewable in project detail sidebar

### Reporting

**Internal (minimal):**
- Main table with filters
- Alerts
- Summary stats

**External (primary):**
- PostgreSQL views in dedicated schema
- Snowflake schema structure for semantic modeling
- Power BI connection

### Authentication & Authorization

- EntraID (Azure AD) login
- Group-based authorization:
  - Regular users group: portfolio operations
  - Admin group: referential management
- Email from token as identity key for audit
- API protected with same EntraID tokens
- Dev mode: startup config flag disables auth for local development

### Look & Feel

- Eurostar brand: teal/petrol green (#006B6B) toolbar, cream/off-white accents
- Modern, clean, sleek — inspired by Linear/Notion
- Generous whitespace, subtle shadows, smooth transitions
- Clean typography, minimal chrome
- Logo: eurostar-logo.png (teal background with cream star and text)

---
*Last updated: 2025-02-03 after initialization*
