---
phase: 02-core-projects
plan: 01
subsystem: database
tags: [drizzle, postgresql, schema, projects, foreign-keys]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: base schema with departments, teams, statuses, outcomes tables
provides:
  - project_id_counters table for ID generation
  - projects table with optimistic locking
  - project_teams junction table with effort sizes
  - project_values junction table for outcome scoring
  - project_change_impact junction table
  - generateProjectId() utility function
affects: [02-core-projects, api-routes, project-forms]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Atomic ID generation via PostgreSQL upsert
    - Optimistic locking with version column
    - Cascade delete for project child records

key-files:
  created:
    - backend/src/lib/project-id-generator.ts
    - backend/drizzle/0001_nosy_rogue.sql
  modified:
    - backend/src/db/schema.ts

key-decisions:
  - "Use PostgreSQL upsert for atomic project ID generation"
  - "5-digit padded project IDs (PRJ-YYYY-00001)"
  - "Cascade delete on project child tables, restrict on reference tables"

patterns-established:
  - "Junction tables use composite unique constraints"
  - "Audit columns (createdBy, updatedBy) as varchar for flexibility"

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 02 Plan 01: Database Schema for Projects Summary

**PostgreSQL schema with projects table, 4 related junction tables, and atomic project ID generator (PRJ-YYYY-00001 format)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T18:00:29Z
- **Completed:** 2026-02-03T18:04:30Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Complete project schema with 5 new tables
- Atomic project ID generator using PostgreSQL upsert
- All foreign keys and cascade behaviors configured
- Migration generated and applied to database

## Task Commits

Each task was committed atomically:

1. **Task 1: Add project-related tables to schema** - `1cd2156` (feat)
2. **Task 2: Create project ID generator** - `d41f1c3` (feat)
3. **Task 3: Generate and run migration** - `f57f237` (feat)

## Files Created/Modified
- `backend/src/db/schema.ts` - Added 5 tables: project_id_counters, projects, project_teams, project_values, project_change_impact
- `backend/src/lib/project-id-generator.ts` - Atomic ID generation with PostgreSQL upsert
- `backend/drizzle/0001_nosy_rogue.sql` - Migration for all project tables
- `backend/drizzle/meta/0001_snapshot.json` - Schema snapshot

## Decisions Made
- Used PostgreSQL upsert (ON CONFLICT DO UPDATE) for atomic counter increment - ensures unique IDs under concurrent access
- 5-digit padding for project IDs allows up to 99,999 projects per year
- Cascade delete on junction tables so project deletion cleans up related records
- Restrict delete on reference tables (teams, statuses, outcomes) to prevent orphan references

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- ESM module resolution required .js extensions in imports (fixed in project-id-generator.ts)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema foundation complete for project CRUD API (Plan 02-03)
- Project ID generator ready for use in create project endpoint
- All relationships established for data integrity

---
*Phase: 02-core-projects*
*Completed: 2026-02-03*
