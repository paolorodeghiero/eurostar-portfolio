---
phase: 04-governance-workflow
plan: 01
subsystem: database
tags: [drizzle, postgres, jsonb, governance, audit-trail, alerts]

# Dependency graph
requires:
  - phase: 03-financial-tracking
    provides: projects table, financial schema
provides:
  - Committee workflow columns on projects (committeeState, committeeLevel, businessCaseFile)
  - Audit log table for field-level change tracking with JSONB changes column
  - Alert configuration table for overdue/budget alerts
  - Committee thresholds seeded for EUR and GBP currencies
affects: [04-02, 04-03, 04-04, 04-05, 04-06, 04-07]

# Tech tracking
tech-stack:
  added: []
  patterns: [jsonb for flexible change tracking, governance workflow state machine]

key-files:
  created:
    - backend/drizzle/0006_previous_deadpool.sql
    - backend/drizzle/0007_yellow_valeria_richards.sql
  modified:
    - backend/src/db/schema.ts
    - backend/src/db/seed.ts

key-decisions:
  - "Committee columns added after costTshirt, before version in projects table"
  - "Audit log uses JSONB for changes to support flexible field tracking"
  - "GBP thresholds converted at ~0.85 rate from EUR"
  - "auditLog and alertConfig added to seed imports for future seed runs"

patterns-established:
  - "Governance tables follow Phase 4 naming convention"
  - "JSONB for flexible structured data storage"

# Metrics
duration: 8min
completed: 2026-02-06
---

# Phase 04 Plan 01: Governance Schema Summary

**Database schema for committee workflow with committeeState/committeeLevel/businessCaseFile columns, audit_log table with JSONB changes, and alert_config table seeded with EUR/GBP thresholds**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-06T16:00:00Z
- **Completed:** 2026-02-06T16:08:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Projects table extended with committee workflow columns (committeeState, committeeLevel, businessCaseFile)
- audit_log table created for comprehensive field-level change tracking
- alert_config table created for configurable overdue and budget alerts
- Committee thresholds seeded for both EUR and GBP currencies (6 total rows)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add committee columns to projects table** - `fb221b7d` (feat)
2. **Task 2: Create audit_log and alert_config tables** - `ad1039c7` (feat)
3. **Task 3: Generate migration, apply, and seed committee thresholds** - `b4ce1217` (feat)

## Files Created/Modified

- `backend/src/db/schema.ts` - Added committeeState, committeeLevel, businessCaseFile columns to projects; created auditLog and alertConfig tables; added jsonb import
- `backend/drizzle/0006_previous_deadpool.sql` - Migration for committee columns on projects
- `backend/drizzle/0007_yellow_valeria_richards.sql` - Migration for audit_log and alert_config tables
- `backend/src/db/seed.ts` - Added GBP committee thresholds, auditLog/alertConfig imports, governance table clearing

## Decisions Made

- **Committee columns placement:** Added after costTshirt, before version in projects table for logical grouping
- **JSONB for audit changes:** Enables flexible field tracking without schema changes
- **GBP threshold conversion:** Used ~0.85 EUR to GBP rate (0=42500 not_necessary, 42500=170000 optional, 170000+ mandatory)
- **Seed imports updated:** auditLog and alertConfig added to ensure clean seed runs include governance tables

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **drizzle-kit migrate conflict:** Initial migration attempt failed due to existing sequences. Resolved by applying schema changes directly via SQL with IF NOT EXISTS clauses.
- **drizzle-kit push interactive prompt:** Interactive mode not suitable for automation. Bypassed by creating direct SQL application script.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema foundation complete for committee workflow tracking
- Ready for plan 04-02: Committee level calculation logic
- Ready for plan 04-03: Audit trail trigger implementation
- auditLog table ready for PostgreSQL triggers
- alertConfig table ready for alert system implementation

---
*Phase: 04-governance-workflow*
*Completed: 2026-02-06*
