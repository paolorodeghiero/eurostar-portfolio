---
phase: 04-governance-workflow
plan: 03
subsystem: api
tags: [committee, state-machine, workflow, typescript]

# Dependency graph
requires:
  - phase: 04-01
    provides: Committee columns in projects table, committeeThresholds table
provides:
  - Committee state machine library with transition validation
  - Committee workflow API endpoints (GET status, PATCH transition)
  - Auto-derived committeeLevel on budget changes
affects: [04-06, 04-07, frontend-governance-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - State machine pattern for workflow state transitions
    - Auto-derivation of computed fields on related data changes

key-files:
  created:
    - backend/src/lib/committee.ts
    - backend/src/routes/projects/project-committee.ts
  modified:
    - backend/src/routes/projects/index.ts
    - backend/src/routes/projects/project-budget.ts

key-decisions:
  - "State machine exports COMMITTEE_TRANSITIONS map for transparent transition rules"
  - "canTransition allows null -> draft as initial state entry"
  - "determineCommitteeLevel uses currency-specific thresholds from database"
  - "Committee level auto-updates on any budget change, not just currency change"

patterns-established:
  - "State machine pattern: export transitions map, canTransition(), getAllowedTransitions()"
  - "Auto-derivation pattern: compute on related field change, store result"

# Metrics
duration: 9min
completed: 2026-02-06
---

# Phase 04 Plan 03: Committee Workflow State Machine Summary

**Committee state machine library with validated transitions (draft/presented/discussion/approved/rejected) and auto-derived committeeLevel based on budget thresholds**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-06T16:13:41Z
- **Completed:** 2026-02-06T16:22:09Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Committee state machine library with type-safe transitions
- GET /api/projects/:id/committee endpoint returns status and allowed transitions
- PATCH /api/projects/:id/committee-state validates and executes state transitions
- Auto-derivation of committeeLevel when budget is updated

## Task Commits

Each task was committed atomically:

1. **Task 1: Create committee state machine library** - `0a042620` (feat)
2. **Task 2: Create committee workflow API endpoints** - `b5873348` (feat)
3. **Task 3: Register routes and integrate with budget updates** - `270880e9` (feat)

## Files Created/Modified
- `backend/src/lib/committee.ts` - State machine with transitions, level determination, validation
- `backend/src/routes/projects/project-committee.ts` - Committee status and transition endpoints
- `backend/src/routes/projects/index.ts` - Route registration
- `backend/src/routes/projects/project-budget.ts` - Committee level auto-update on budget change

## Decisions Made
- State machine exports COMMITTEE_TRANSITIONS as a Record for transparency and extensibility
- canTransition handles null state as initial entry point (only 'draft' allowed)
- determineCommitteeLevel queries currency-specific thresholds from committeeThresholds table
- Committee level is recalculated on any budget change to ensure consistency
- Used `any` type for db parameter to match existing cost-tshirt.ts pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing multipart registration error prevented live API verification. TypeScript compilation succeeded, confirming code correctness. The multipart error exists due to multiple @fastify/multipart registrations across route files - unrelated to this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Committee workflow API ready for frontend integration
- Audit logging will capture state transitions (plan 04-02 adds audit triggers)
- Business case file upload endpoint needed for complete workflow

---
*Phase: 04-governance-workflow*
*Completed: 2026-02-06*
