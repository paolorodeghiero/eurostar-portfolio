# Phase 6: Admin GUI & Reporting - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete admin interface enhancements, Power BI integration via PostgreSQL reporting views, and API documentation. This builds on the existing admin CRUD from Phase 1 and adds reporting capabilities, API docs, and admin UX improvements.

</domain>

<decisions>
## Implementation Decisions

### Reporting Views
- **Schema**: Single `reporting` schema (e.g., `reporting.dim_departments`, `reporting.fact_projects`)
- **View depth**: Both summary and detail levels for Power BI drill-down
- **Naming**: Verbose names with prefix (dim_*, fact_*)
- **Time dimension**: Basic (year, quarter, month) — fiscal year equals calendar year
- **Currency**: Include original currency column plus EUR converted amount
- **Dimensions**: All 9 referential types exposed as dimension views
- **Facts**: fact_projects (summary), fact_receipts, fact_invoices
- **Calculated fields**: Pre-calculate key metrics (budget_remaining, percent_used, days_until_end)

### API Documentation
- **Tooling**: @fastify/swagger for auto-generation from route schemas
- **Interactive**: Full Swagger UI at /docs with Try It buttons
- **Authentication**: Require EntraID token to access API docs
- **Examples**: Realistic examples with Eurostar-style data
- **Grouping**: Endpoints grouped by resource (Projects, Teams, Budget Lines, etc.)
- **Errors**: Detailed error documentation per endpoint with specific scenarios
- **Versioning**: Document as v1 with /api/v1 prefix
- **Export**: Expose /docs/openapi.json for programmatic access
- **Branding**: Full Eurostar theme match (teal, cream, logo, typography)
- **Navigation**: API link in main navbar next to Admin button, visible to all authenticated users

### Admin Enhancements
- **Usage visibility**: Show which projects use each referential item (Claude's discretion on UX)
- **Audit access**: Dedicated admin page showing all system changes across all projects
- **Bulk operations**: Import and export referential data (Excel/CSV)
- **Table features**: Simplified — basic search and sort only
- **Error display**: Better API error display in admin (Claude's discretion on presentation)

### Claude's Discretion
- Usage visibility UX pattern (inline expand vs side panel)
- Error display approach (toast vs banner vs modal based on severity)
- Swagger UI customization details within Eurostar theme

</decisions>

<specifics>
## Specific Ideas

- "I want the API documentation to have a look and feel similar to the application" — full Eurostar branding in Swagger UI
- API button in main navbar alongside Admin button for easy access

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-admin-gui-and-reporting*
*Context gathered: 2026-02-10*
