# Project Research Summary

**Project:** Eurostar IT Portfolio Management Tool
**Domain:** Enterprise Portfolio Management / Business Intelligence
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

This is an IT portfolio management system designed for Eurostar's low-volume, high-governance environment. The recommended approach uses a modern TypeScript full-stack with Fastify (backend), React 19 (frontend), PostgreSQL with Drizzle ORM, and deep Power BI integration. The architecture centers on a monorepo structure with clear separation between operational schemas (OLTP) and analytical views (snowflake schema for BI), enabling both transactional workflows and executive reporting from a single source of truth.

The key technical decisions favor simplicity and maintainability over premature optimization: Fastify over NestJS (less complexity), Drizzle over Prisma (better for Azure Container Apps cold starts), and Zustand over Redux Toolkit (simpler state management for low-volume apps). Power BI integration is a first-class requirement, not an afterthought, which drives database schema design toward dimensional modeling from day one.

The most critical risks are over-complexity blocking adoption, scoring criteria that don't differentiate projects, and multi-currency budget tracking without preserving source currency. All three pitfalls can derail portfolio management tools but are preventable through deliberate design: start with 5-7 core metrics maximum, validate scoring dimensions on historical projects before implementation, and always store amounts in source currency with conversion metadata. The low-volume context (stable project count) is actually an advantage—it allows optimization for data quality and user experience over raw scalability.

## Key Findings

### Recommended Stack

The stack is optimized for enterprise TypeScript development with Azure deployment and Power BI integration. Node.js 20 LTS provides the foundation, with Fastify 5 chosen for its first-class TypeScript support, performance advantage over Express, and minimal overhead suitable for low-volume business apps. Drizzle ORM (0.45.1 stable) was selected over Prisma specifically for Azure Container Apps deployment, as its lightweight footprint (~7.4kb) minimizes cold start times compared to Prisma's heavier engine binary.

**Core technologies:**
- **TypeScript 5.9+**: Full-stack type safety with improved error reporting and V8 compile caching, enabling shared types between frontend and backend
- **Fastify 5**: Fast, low-overhead backend framework with native TypeScript support, 10x better performance than Express, targets Node 20+
- **React 19.2+**: Latest stable with improved concurrent rendering and hooks API, industry standard with massive ecosystem for enterprise apps
- **Drizzle ORM 0.45.1**: Lightweight, code-first ORM perfect for serverless/container environments, SQL-like query builder with excellent TypeScript inference
- **PostgreSQL 16+**: Robust enterprise database with snowflake schema views for Power BI DirectQuery, supporting both OLTP operations and analytical workloads
- **Vite 6**: Modern build tool with native ESM and TypeScript support, fast HMR for React development

**Frontend stack:**
- shadcn/ui with Tailwind CSS 4 for Linear/Notion-like modern UI components with full code ownership
- TanStack Query 5 for server state management (API data fetching, caching, background refetching)
- Zustand 5 for client state management (UI toggles, form state, local preferences)
- React Hook Form 7 with Zod 3 for type-safe form validation shared between frontend and backend

**Backend stack:**
- @azure/msal-node 2.x for EntraID authentication and JWT token validation
- Pino 10 for production-grade structured logging (fastest JSON logger for Node.js)
- @fastify/swagger for auto-generated OpenAPI 3.0 documentation from Zod schemas
- Vitest 4 for both frontend and backend testing with native TypeScript support

**Critical version alignments:**
- Fastify 5 + Vite 6 both require Node.js 20.19+ (dropped Node 18 support)
- React 19 requires TypeScript 5.2+ for type inference
- Vitest 4 is first version supporting Vite 6

### Expected Features

**Must have (table stakes):**
- **Project CRUD with unique IDs** — foundational entity with stable referencing for integrations
- **Multi-dimensional scoring** — value, effort, change impact, cost scoring for prioritization (already in Eurostar scope)
- **Budget tracking with line-level allocation** — granular financial visibility (already in Eurostar scope)
- **Cost tracking with actuals import** — receipts/invoices import for actual vs. planned spending (already in Eurostar scope)
- **Approval workflows** — Engagement Committee governance with state transitions (already in Eurostar scope)
- **Referential management** — centralized master data for departments, teams, statuses, thresholds (already in Eurostar scope)
- **Configurable portfolio table** — customizable columns, filters, groupings per user role (already in Eurostar scope)
- **REST API** — integration foundation for external systems (already in Eurostar scope)
- **Audit trail** — full history tracking for compliance (already in Eurostar scope)
- **Alerts system** — proactive notifications for deadlines, approvals, budget thresholds (already in Eurostar scope)
- **Power BI integration** — embedded dashboards and DirectQuery to PostgreSQL (already in Eurostar scope)
- **Basic portfolio dashboard** — real-time view of portfolio health (needs implementation)
- **Access controls & permissions** — role-based authorization with row-level security (needs implementation)
- **Project status tracking** — timelines, milestones, progress monitoring (needs implementation)
- **Risk management** — track project risks with automated alerts (needs implementation)
- **Search and filtering** — find projects quickly by multiple criteria (needs implementation)
- **Export capabilities** — Excel/PDF export for offline analysis (needs implementation)

**Should have (competitive):**
- **Strategic alignment tracking** — map projects to business objectives and strategic goals
- **Resource management** — team capacity planning and allocation visibility
- **Cross-project dependency tracking** — visualize and manage inter-project dependencies
- **Portfolio health scoring** — single metric for executive-level portfolio health
- **Time-series analysis** — track portfolio trends and identify patterns over time
- **Custom approval workflows** — configurable multi-stage approval chains per project type

**Defer (v2+):**
- **AI-powered forecasting** — requires significant historical data to train predictive models
- **Scenario planning & what-if analysis** — complex feature requiring stable v1 foundation first
- **OKR mapping & decomposition** — builds on strategic alignment foundation from v1.x
- **Automated capacity planning** — requires AI capabilities plus resource management
- **Smart prioritization engine** — needs AI plus historical outcome data
- **Automated portfolio rebalancing** — requires all above plus mature governance model
- **Change impact simulation** — complex modeling requiring cross-project dependencies
- **Sustainability/ESG tracking** — niche requirement, add if customer demand emerges

**Note:** Eurostar already has most MVP features in scope. Research confirms these are table stakes for portfolio management tools. The focus should be on completing core features with excellent execution rather than adding differentiators prematurely.

### Architecture Approach

The architecture follows a standard layered approach optimized for monorepo development with Power BI integration: Presentation Layer (Portfolio GUI, Admin GUI, Power BI views) → API Layer (REST API with module-based structure) → Business Logic Layer (domain services: projects, budgets, actuals, workflow, referentials) → Data Access Layer (repository pattern) → Data Layer (PostgreSQL with dual schemas).

**Major components:**
1. **Portfolio GUI (React SPA)** — operations interface for project management, budget tracking, actuals entry, and workflow interactions
2. **Admin GUI (React SPA)** — referential data management for departments, teams, statuses, thresholds, strategic themes
3. **REST API Gateway (Fastify)** — single entry point with JWT authentication, OpenAPI documentation, and module-based routing (projects, budgets, actuals, workflow, referentials, reports endpoints)
4. **Project Service** — CRUD operations, lifecycle management, validation, integration with workflow engine
5. **Financial Service** — budget line management, actuals processing, variance calculation, threshold alerting
6. **Workflow Engine** — state machine for Engagement Committee approval flow with transition guards, delegation support, and notification triggers
7. **Referential Service** — master data management with cascade rules and impact analysis for organizational changes
8. **Repository Layer** — data access abstraction using Drizzle ORM, separating business logic from database operations
9. **PostgreSQL Schemas** — operational schema (normalized OLTP tables) plus analytical schema (snowflake views for Power BI DirectQuery)
10. **EntraID Integration** — OAuth 2.0 authentication with JWT token validation on every API request

**Key architectural patterns:**
- **Repository Pattern** for data access abstraction and testability
- **State Machine** for workflow transitions with explicit guards and actions
- **Snowflake Schema Views** for Power BI consumption without ETL pipeline
- **Module-Based API Structure** organizing endpoints by domain (projects, budgets, actuals, workflow, referentials)
- **Shared Types Package** enabling type safety between frontend and backend via monorepo

**Data flow design:**
- Operational writes go to normalized PostgreSQL tables (3NF) for transactional integrity
- Power BI reads from snowflake schema views that join operational tables for dimensional reporting
- Frontend state managed with hybrid approach: TanStack Query for server state (API data), Zustand for client state (UI toggles)
- Workflow transitions trigger notifications via async queue to avoid blocking approval actions

### Critical Pitfalls

1. **Over-complexity that blocks adoption** — Tools with 30+ metrics, complex intake forms, and extensive workflows lead to shadow spreadsheets and data quality issues. **Avoid by:** Starting with 5-7 core metrics maximum, making intake forms completable in <10 minutes, implementing "crawl, walk, run" approach (basic scoring → budget tracking → advanced analytics). Low volume means optimize for data quality over feature quantity.

2. **Scoring criteria that don't differentiate** — Multi-dimensional scoring where every project rates 6-8 on all dimensions makes prioritization meaningless. Questions combining multiple concepts ("strategic value AND user impact AND complexity") or lacking anchor points cause inconsistent evaluation. **Avoid by:** Each dimension must assess ONE concept only, define explicit anchor points (e.g., "Strategic Alignment: 1=no strategy link, 5=directly enables strategic objective, 10=business-critical"), test on 5-10 historical projects before launch to verify score distribution spans full range.

3. **Budget tracking without source currency** — Storing converted amounts (EUR→GBP at entry) loses original values. When exchange rates change or audits require source verification, data is irrecoverable. Creates discrepancies with finance systems. **Avoid by:** ALWAYS store amount in source currency with currency code (amount: 50000, currency: 'EUR'), store exchange rate and converted amount at time of entry for historical accuracy, convert to reporting currency ONLY at query/display time. Eurostar's multi-European operations make this critical for finance reconciliation.

4. **Actuals import without reconciliation** — Importing actuals from external systems without validation mechanisms means discrepancies, duplicates, or missing data go undetected until executive presentations. **Avoid by:** Implement import validation (expected vs. received record counts, sum checks, currency consistency), flag unmatched records, create reconciliation dashboard with import health metrics, maintain detailed import audit log, alert on anomalies (actuals >20% over budget, sudden spikes, missing monthly data). Low volume means reconciliation can be human-reviewed—build visible flags rather than silent failures.

5. **Governance workflow that becomes bottleneck** — Too rigid (single approver on vacation blocks everything) or too complex (6 steps, unclear ownership) means projects stuck in "pending approval" for weeks, leading to workflow bypass. **Avoid by:** Maximum 3 approval stages for standard projects, build delegation (approvers assign temporary deputies), include SLA tracking (flag items pending >5 business days), emergency fast-track path with post-approval audit, role-based flexibility (portfolio manager can reassign stuck items). Low volume means each delay is highly visible.

6. **Referential integrity without cascade rules** — Projects reference cost centers/teams via stable IDs (good!) but reorganizations create broken references. Blocking deletion causes stale data; allowing deletion creates orphaned records and reporting errors. **Avoid by:** Define cascade rules per relationship type (cost center changes update all projects with audit log; team dissolution requires reassignment before deletion; strategic goal retirement maintains historical reference with "archived" flag), build impact analysis view ("Deleting X affects 23 active projects"), distinguish soft delete (archived, historically reportable) vs. hard delete (data error).

7. **Audit history that obscures rather than illuminates** — Logging every field change creates thousands of entries. Finding "who changed budget from 100K to 150K?" requires sifting through "description typo fixed," "updated_at timestamp changed" noise. **Avoid by:** Categorize changes by materiality (Critical: budget, status, approvals; Standard: assignee, dates; Minor: comments, tags), build filtered views ("Show material changes only"), summarize related changes ("Budget package updated" not 3 separate entries), include business context ("Budget increased due to scope expansion"), add search/filter by user, date range, field, project. Low volume means audits are human-reviewed—optimize for investigator experience.

8. **Power BI integration as afterthought** — Application stores data in JSON fields, dynamic schemas, nested structures optimized for developer convenience. When connecting Power BI, 80% of time spent wrangling data structure; reports brittle and break with schema changes. **Avoid by:** Design PostgreSQL schema for reporting from start (normalized dimension tables, fact tables for metrics, avoid JSON for reportable data, include surrogate keys for slowly-changing dimensions), create database views optimizing common report patterns, establish schema change review process (assess reporting impact before altering tables), provide Power BI semantic model alongside tool. Power BI integration is key Eurostar requirement—schema must serve both application and analytics.

## Implications for Roadmap

Based on research, suggested phase structure optimized for dependency management and pitfall avoidance:

### Phase 1: Foundation & Core Entities
**Rationale:** Everything depends on database schema, authentication, and basic entities. Cannot build services without entities; cannot test APIs without auth. Establish patterns with simpler domains (referentials) before complex domains (workflow).

**Delivers:**
- PostgreSQL operational schema (projects, departments, teams, statuses, budget lines, actuals tables)
- Shared TypeScript types package (entity interfaces, DTOs, enums)
- EntraID integration with JWT middleware and basic auth guards
- Referentials module (CRUD for departments, teams, statuses, thresholds)
- Projects module (CRUD for core project entity)
- Multi-dimensional scoring system with validated dimensions
- Multi-currency data model with source currency preservation

**Features addressed:** Project CRUD, Referential management, Multi-dimensional scoring

**Pitfalls avoided:**
- **Over-complexity:** Validate scoring dimensions on sample projects before building additional features; limit to 5-7 core metrics
- **Scoring doesn't differentiate:** Test on 10 historical projects, verify score distribution spans range
- **Budget without source currency:** Implement multi-currency model from start (retrofitting is painful)
- **Power BI as afterthought:** Design schema for reporting requirements from day one

**Research flag:** Standard patterns (well-documented TypeScript REST API, PostgreSQL schema design). No deeper research needed.

**Estimated effort:** 2-3 weeks

---

### Phase 2: Financial Tracking
**Rationale:** Builds on projects module (must exist first). Financial logic is complex and benefits from established API patterns. Budget and actuals are table stakes features for portfolio management.

**Delivers:**
- Budget lines module with line-level allocation
- Actuals module with receipts/invoices import capability
- Import validation and reconciliation mechanisms
- Financial calculations (variance, budget utilization, threshold checks)
- Currency conversion with historical rate preservation
- Reconciliation dashboard showing import health metrics

**Features addressed:** Budget tracking, Cost tracking with actuals import, Alerts system (for budget thresholds)

**Pitfalls avoided:**
- **Actuals import without reconciliation:** Build validation as core feature (expected vs. received counts, sum checks, anomaly detection)
- **Budget without source currency:** Already addressed in Phase 1 schema, enforced in financial calculations

**Research flag:** May need research on financial system integration patterns if specific ERP/finance system is identified. Otherwise standard patterns.

**Estimated effort:** 2-3 weeks

---

### Phase 3: Workflow Engine & Governance
**Rationale:** Depends on projects and budgets being complete (workflow operates on these entities). Most complex business logic. Ties everything together. Blocking frontend completion, so budget extra time.

**Delivers:**
- Workflow module with state machine pattern
- Engagement Committee approval flow (submission, review, approval, rejection)
- Transition guards and validation rules
- Delegation support for approvers
- SLA tracking with alerts for pending items >5 business days
- Notification service with email alerts for workflow events
- Audit logging for all state transitions

**Features addressed:** Approval workflows, Audit trail, Alerts system (for workflow events)

**Pitfalls avoided:**
- **Governance workflow bottleneck:** Maximum 3 approval stages, built-in delegation, SLA tracking, emergency fast-track path
- **Audit history obscures:** Categorize changes by materiality (workflow transitions are critical), include business context, build filtered views

**Research flag:** Likely needs research on state machine implementation patterns in TypeScript (XState vs. custom implementation). Phase research recommended.

**Estimated effort:** 3-4 weeks

---

### Phase 4: Frontend Applications
**Rationale:** Can start after Phase 1 (core API exists) but needs Phase 2-3 complete for full functionality. Admin GUI is simpler and tests architecture patterns. Portfolio GUI is most complex.

**Delivers:**
- Type-safe API client package generated from backend schemas
- Admin GUI for referential data management (simpler UI, validates patterns)
- Portfolio GUI for projects, budgets, actuals, workflow interactions
- Configurable portfolio table with user-customizable views
- Basic portfolio dashboard with real-time metrics
- Access controls & permissions with role-based UI
- Search and filtering functionality

**Features addressed:** Configurable portfolio table, Portfolio dashboard, Access controls, Search and filtering

**Pitfalls avoided:**
- **Over-complexity:** Intake forms completable in <10 minutes, progressive disclosure of advanced features
- **Referential integrity:** Impact analysis UI before allowing deletions, managed cascade workflows

**Research flag:** Standard React patterns with shadcn/ui and TanStack Query. No deeper research needed.

**Estimated effort:** 3-4 weeks

---

### Phase 5: Power BI Integration & Reporting
**Rationale:** Requires complete operational schema (Phase 1-3 data). Query optimization needs real data patterns from usage. Can iterate as more data accumulates.

**Delivers:**
- Snowflake schema views in `bi.*` schema (fact and dimension views)
- Power BI DirectQuery connection with read-only user
- Sample reports and dashboards validating data structure
- Power BI semantic model documentation
- Query performance optimization (indexes, materialized views if needed)
- Export capabilities (Excel/PDF) for offline analysis

**Features addressed:** Power BI integration, Export capabilities

**Pitfalls avoided:**
- **Power BI as afterthought:** Schema already designed for reporting (Phase 1), this phase connects to report-ready structure
- **N+1 queries in snowflake views:** Proper joins with indexes, query execution plan monitoring

**Research flag:** May need research on Power BI DirectQuery optimization patterns and row-level security implementation. Phase research recommended.

**Estimated effort:** 2-3 weeks

---

### Phase 6: Enhanced Features (Post-MVP)
**Rationale:** Add after core is working and users are onboarded. Validate actual usage patterns before building advanced features.

**Delivers:**
- Strategic alignment tracking (map projects to business objectives)
- Resource management with capacity planning
- Cross-project dependency tracking
- Portfolio health scoring (single executive metric)
- Time-series analysis for trend identification
- Mobile responsive design
- Advanced filtering & saved views

**Features addressed:** Strategic alignment, Resource management, Portfolio health scoring, Time-series analysis

**Research flag:** Strategic alignment and resource management both likely need phase research (complex domains, integration patterns unclear).

**Estimated effort:** 4-6 weeks

---

### Phase Ordering Rationale

**Dependency chain:**
Phase 1 (Foundation) → Phase 2 (Financial) → Phase 3 (Workflow) → Phase 4 (Frontend) → Phase 5 (Power BI) → Phase 6 (Enhanced)

**Critical path:** Phase 1 → Phase 3 → Phase 4 → Phase 5 (approximately 10-14 weeks minimum)

**Parallelization opportunities:**
- Phase 2 (Financial) can overlap with Phase 3 (Workflow) if team has 2+ backend developers
- Phase 4 (Frontend) can start as soon as Phase 1 completes, running parallel to Phase 2-3
- Phase 5 (Power BI) can be deferred if reporting isn't launch-critical, though it's a key Eurostar requirement

**Architecture-driven ordering:**
- Repository pattern established in Phase 1 with simpler domains (referentials)
- State machine pattern introduced in Phase 3 (most complex logic)
- Snowflake schema views in Phase 5 built on stable operational schema
- Frontend phases benefit from backend API stability (why they come later)

**Pitfall mitigation:**
- Phase 1 addresses 4 of 8 critical pitfalls (over-complexity, scoring, currency, Power BI schema)
- Phase 2 addresses actuals reconciliation before it becomes production issue
- Phase 3 addresses workflow bottleneck and audit history before user adoption
- Phase 5 validates Power BI integration assumptions while there's still time to adjust

**Key risk:** Workflow Engine (Phase 3) is most complex and blocks frontend completion. Estimated 3-4 weeks but could extend to 5-6 weeks. Budget buffer here.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Workflow):** State machine implementation patterns in TypeScript/Fastify—evaluate XState library vs. custom implementation, delegation/SLA tracking patterns
- **Phase 5 (Power BI):** DirectQuery optimization for large fact tables, row-level security implementation with EntraID integration, semantic model best practices
- **Phase 6 (Strategic Alignment):** OKR mapping patterns, strategic goal decomposition strategies, how other tools handle goal hierarchies
- **Phase 6 (Resource Management):** Capacity planning algorithms, skill matching patterns, workload balancing approaches

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** REST API with Fastify, PostgreSQL schema design, EntraID authentication—all well-documented
- **Phase 2 (Financial):** CRUD operations with validation, file import patterns—standard patterns
- **Phase 4 (Frontend):** React with shadcn/ui, TanStack Query, form handling—established patterns with extensive documentation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official releases verified for all major technologies (TypeScript 5.9, Node 20 LTS, React 19.2, Fastify 5, Drizzle 0.45.1, Vite 6). Version compatibility matrix confirmed. MSAL library official Microsoft documentation. |
| Features | HIGH | Comprehensive analysis of 2026 portfolio management tools shows Eurostar scope aligns with industry table stakes. MVP features are all standard; differentiators appropriately deferred. Competitive analysis confirms positioning. |
| Architecture | MEDIUM | Standard patterns well-documented (repository pattern, REST API, monorepo structure). Snowflake schema for Power BI confirmed via Microsoft docs. Specific to Eurostar: workflow engine pattern needs validation, cascade rules for referentials require design refinement. |
| Pitfalls | HIGH | All 8 critical pitfalls sourced from documented project failures and best practices. Multi-currency handling, scoring validation, governance bottlenecks consistently cited across sources. Prevention strategies verified against successful implementations. |

**Overall confidence:** HIGH

### Gaps to Address

**Workflow engine implementation details:** Research identifies state machine pattern as recommended but doesn't specify whether to use XState library (more opinionated, built-in visualization) vs. custom implementation (lighter, more flexible). Decision needed during Phase 3 planning based on complexity of Engagement Committee rules.

**EntraID group-based permissions:** Stack research confirms @azure/msal-node for authentication but doesn't detail how to map EntraID security groups to application roles (portfolio manager, committee member, project owner). Need to research Microsoft Graph API integration during Phase 1 planning for role assignment.

**Power BI row-level security:** Architecture research recommends RLS for multi-tenant data isolation but doesn't specify implementation pattern with EntraID users. Gap between "configure RLS in Power BI" and "how to pass EntraID context to PostgreSQL views." Research during Phase 5 planning.

**Referential cascade rules specifics:** Pitfalls identify need for cascade rules but exact rules depend on Eurostar organizational change patterns (how often cost centers reorganize, how teams are dissolved, whether strategic goals are retired or archived). Validate with stakeholders during Phase 1 design before implementation.

**Historical data for scoring validation:** Pitfall prevention requires testing scoring dimensions on 5-10 historical projects before implementation. Gap if Eurostar doesn't have historical project data or if it's in spreadsheets requiring manual extraction. Identify data source early in Phase 1.

**Finance system integration specifics:** Actuals import designed generically (CSV/Excel) but integration may require specific ERP/finance system APIs. Gap if finance system has required integration patterns (SAP, Oracle, etc.) that differ from file import. Identify finance system during Phase 2 planning.

## Sources

### Primary (HIGH confidence)
- TypeScript 5.9, Node.js 20 LTS, React 19.2, Fastify 5, Vite 6, Drizzle ORM official documentation and release notes
- Microsoft Learn: EntraID authentication flows, Azure Container Apps, Power BI DirectQuery, semantic models
- Official npm packages verified: @azure/msal-node 2.x, TanStack Query 5.90+, Vitest 4.x, Pino 10.x, shadcn/ui with React 19 support

### Secondary (MEDIUM confidence)
- Industry analysis: Best IT Portfolio Management Software 2026, Top 6 AI-Powered Strategic Portfolio Management Platforms, 10 PPM Trends for 2026
- Architecture patterns: Enterprise PPM architecture guides, REST API design best practices, modular monolith vs. microservices 2026 analysis
- Pitfalls: Common mistakes in PPM implementation, project prioritization anti-patterns, multi-currency reporting complexities, governance failure patterns

### Tertiary (LOW confidence)
- Specific workflow engine library comparisons (needs validation during Phase 3)
- Power BI optimization techniques for large datasets (needs validation during Phase 5)
- Resource management algorithms (deferred to Phase 6, needs research if prioritized)

---
*Research completed: 2026-02-03*
*Ready for roadmap: yes*
