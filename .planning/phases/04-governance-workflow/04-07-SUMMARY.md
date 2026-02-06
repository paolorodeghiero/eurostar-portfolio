---
phase: 04-governance-workflow
plan: 07
subsystem: ui
tags: [react, committee-workflow, file-upload, state-machine, tabs]

# Dependency graph
requires:
  - phase: 04-03
    provides: Committee state machine and transitions API
  - phase: 04-04
    provides: Business case file upload/download endpoints
provides:
  - Committee tab UI component for workflow management
  - API client for committee operations
  - State transition buttons with validation
  - Business case file upload/download UI
affects: [04-10]

# Tech tracking
tech-stack:
  added: []
  patterns: [tab-component-pattern, file-upload-pattern]

key-files:
  created:
    - frontend/src/lib/project-committee-api.ts
    - frontend/src/components/projects/tabs/CommitteeTab.tsx
  modified:
    - frontend/src/components/projects/ProjectTabs.tsx

key-decisions:
  - "Workflow progress visualization uses step indicator with checkmarks"
  - "Committee tab placed after Change Impact, before Budget"
  - "Level colors: mandatory=red, optional=yellow, not_necessary=gray"

patterns-established:
  - "Tab component pattern: projectId + disabled props"
  - "File upload pattern: hidden input with ref, button click trigger"

# Metrics
duration: 6min
completed: 2026-02-06
---

# Phase 04 Plan 07: Committee Tab UI Summary

**Committee workflow tab with state machine transitions, file upload/download, and visual workflow progress indicator**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-06T16:42:51Z
- **Completed:** 2026-02-06T16:48:44Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Committee API client with all operations (fetchCommitteeStatus, transitionCommitteeState, uploadBusinessCase, downloadBusinessCase, deleteBusinessCase)
- CommitteeTab component with workflow visualization showing draft->presented->discussion->approved flow
- Committee level display with color-coded badges (mandatory/optional/not_necessary)
- State transition buttons with validation against allowed transitions
- Business case document upload/download/delete with PDF/DOCX support
- Disabled state handling for stopped projects

## Task Commits

Each task was committed atomically:

1. **Task 1: Create committee API client** - `61d52db2` (feat)
2. **Task 2: Create CommitteeTab component** - `1de56109` (feat)
3. **Task 3: Add Committee tab to ProjectTabs** - `2d547800` (feat)

## Files Created/Modified
- `frontend/src/lib/project-committee-api.ts` - API client with fetch, transition, upload, download, delete operations plus display constants
- `frontend/src/components/projects/tabs/CommitteeTab.tsx` - Committee workflow UI with state transitions, file management, progress visualization
- `frontend/src/components/projects/ProjectTabs.tsx` - Added Committee tab to sidebar navigation

## Decisions Made
- Workflow progress visualization uses horizontal step indicator with circle icons and arrows
- States shown as Draft -> Presented -> Discussion -> Approved with checkmarks for completed steps
- Rejected state shown separately with red badge (not part of main flow)
- Committee tab placed after Change Impact and before Budget in navigation
- Level colors match severity: mandatory=red, optional=yellow, not_necessary=gray
- State colors: draft=gray, presented=blue, discussion=yellow, approved=green, rejected=red

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Committee tab fully functional with API integration
- Ready for 04-10 testing and integration verification
- All workflow states supported with proper transition validation

---
*Phase: 04-governance-workflow*
*Completed: 2026-02-06*
