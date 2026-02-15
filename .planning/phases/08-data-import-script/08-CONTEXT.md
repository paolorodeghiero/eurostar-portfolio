# Phase 8: Data import script - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Create maintainable import scripts in a dedicated `import/` folder for loading data from TPO Portfolio.xlsx into the portfolio system. Scripts extract data to staging CSVs for review, use YAML mapping configs, and support incremental imports with conflict handling.

**Source:** TPO Portfolio.xlsx (234 rows, Input sheet)
**Entities:** Projects, Teams & Effort, Value Scores, Change Impact, Budget, Statuses, People

</domain>

<decisions>
## Implementation Decisions

### Entity Mapping Strategy
- L/M/H values map directly to T-shirt sizes: L→S, M→M, H→L
- Status mappings pre-defined upfront in YAML before import (review all Excel statuses first)
- Team/department names: normalize during extraction, try to map to existing, create missing referentials automatically
- Value outcomes: propose mapping to existing outcomes, validate before loading

### CSV Staging Workflow
- One CSV per entity: projects.csv, teams.csv, value_scores.csv, change_impact.csv, etc.
- Folder structure: `import/staging/`, `import/mappings/`, `import/scripts/`
- CSVs gitignored, only mappings and scripts committed
- Schema validation during extraction (required fields, data types, referential integrity)
- Reporting: console summary + markdown report (extraction_report.md)
- Combined script with stages: `--extract`, `--validate`, `--load` flags
- Dry-run support: `--dry-run` shows what would be inserted/updated without DB changes
- Mapping configs in YAML format (status-mapping.yaml, team-mapping.yaml, etc.)

### Incremental Behavior
- Existing projects: prompt per conflict (skip, update, or overwrite)
- Import tracking: database marker columns (importedAt, importSource) on projects table
- Child entities (teams, values, impact): merge strategy - add new, keep existing, never delete
- Removed projects: report only - generate list of projects in DB but not in Excel, no action taken

### Missing Data Handling
- Empty required fields: use sensible defaults (TBD, Unknown)
- Date formats: parse known formats (Q1-Q4, YYYY, YYYY-MM, exact dates) - map to start of period
- Missing referentials (teams, departments): create automatically during import
- Empty budget amounts: import as zero

### Claude's Discretion
- Exact CSV column names and structure
- Validation error message formatting
- Conflict prompt UI (console-based)
- Default values for each field type
- Date parsing edge cases

</decisions>

<specifics>
## Specific Ideas

- "Create temporary folders of CSV data per entity before extraction so they can be reviewed"
- "Maintain mapping configuration in repository for working on them incrementally"
- "Ask questions while extracting the data for mapping where relevant"
- Scripts should evolve over time - modular design for future sources

### Source File Structure (TPO Portfolio.xlsx - Input sheet)
Key columns identified:
- Core: Status (1), Team (2), IS Portfolio Ref ID (3), Project (4), eurostar dpt Owner (5)
- Dates: Starting Date (6), Delivery Date (8), Duration (10)
- Value: Safety (13), NPS (14), EBITDA (17), Regulatory (18), Value Score (19)
- Effort: 8 IS teams (21-28), Resource Score (30)
- Impact: 11 departments (32-42), CHANGE Impact Score (43)
- Budget: OPEX (51), CAPEX (52), Total (54)
- People: IS Owner (48), OK comBoard (49)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-data-import-script*
*Context gathered: 2026-02-15*
