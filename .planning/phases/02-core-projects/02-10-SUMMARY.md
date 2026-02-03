---
phase: 02-core-projects
plan: 10
subsystem: ui
tags: [react, conflict-resolution, optimistic-locking, auto-save]

# Dependency graph
requires:
  - phase: 02-05
    provides: Auto-save hook with debounce
  - phase: 02-06
    provides: General tab with form controls
  - phase: 02-07
    provides: Teams tab with TeamChip component
  - phase: 02-08
    provides: Value tab with scoring cards
  - phase: 02-09
    provides: Change Impact tab, menu actions, create dialog
provides:
  - ConflictDialog for version conflict resolution
  - Read-only mode for stopped projects
  - Complete project editing experience
affects: [phase-03-budget, phase-04-governance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conflict state management with side-by-side comparison
    - Disabled prop propagation through component hierarchy
    - Conditional callback patterns for read-only state

key-files:
  created:
    - frontend/src/components/projects/ConflictDialog.tsx
  modified:
    - frontend/src/components/projects/ProjectSidebar.tsx
    - frontend/src/components/projects/ProjectTabs.tsx
    - frontend/src/components/projects/TeamChip.tsx
    - frontend/src/components/projects/ValueScoreCard.tsx
    - frontend/src/components/projects/tabs/GeneralTab.tsx
    - frontend/src/components/projects/tabs/PeopleTab.tsx
    - frontend/src/components/projects/tabs/TeamsTab.tsx
    - frontend/src/components/projects/tabs/ValueTab.tsx
    - frontend/src/components/projects/tabs/ChangeImpactTab.tsx

key-decisions:
  - "Conflict dialog shows side-by-side field comparison"
  - "Read-only mode disables all form inputs and hides action buttons"
  - "Optional onSizeChange in TeamChip for read-only chip display"

patterns-established:
  - "Disabled prop flow: sidebar -> tabs -> individual components"
  - "Conflict resolution: keep local retries with server version, keep server resets form"

# Metrics
duration: 10min
completed: 2026-02-03
---

# Phase 2 Plan 10: Conflict Dialog and Final Integration Summary

**ConflictDialog component with side-by-side version comparison and read-only mode for stopped projects**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-03T18:39:44Z
- **Completed:** 2026-02-03T18:49:24Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Created ConflictDialog component with side-by-side comparison of local vs server versions
- Integrated conflict handling into ProjectSidebar with 409 error detection
- Added read-only mode for stopped projects with disabled prop propagation through all tabs
- Updated TeamChip to conditionally render dropdown or static badge based on edit permissions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ConflictDialog component** - `742acd5` (feat)
2. **Task 2: Wire conflict handling into sidebar** - `cda93b8` (feat)
3. **Task 3: End-to-end verification** - Human checkpoint (documented below)

## Files Created/Modified
- `frontend/src/components/projects/ConflictDialog.tsx` - Side-by-side conflict resolution dialog
- `frontend/src/components/projects/ProjectSidebar.tsx` - Conflict state management, read-only mode
- `frontend/src/components/projects/ProjectTabs.tsx` - Added disabled prop pass-through
- `frontend/src/components/projects/TeamChip.tsx` - Optional onSizeChange for read-only display
- `frontend/src/components/projects/ValueScoreCard.tsx` - Added disabled prop to slider and textarea
- `frontend/src/components/projects/tabs/GeneralTab.tsx` - Added disabled prop to all inputs
- `frontend/src/components/projects/tabs/PeopleTab.tsx` - Added disabled prop to autocomplete
- `frontend/src/components/projects/tabs/TeamsTab.tsx` - Added disabled prop, conditional callbacks
- `frontend/src/components/projects/tabs/ValueTab.tsx` - Added disabled prop pass-through
- `frontend/src/components/projects/tabs/ChangeImpactTab.tsx` - Added disabled prop, conditional callbacks

## Decisions Made
- Conflict dialog shows differing fields with friendly labels (e.g., "Lead Team" instead of "leadTeamId")
- TeamChip renders static badge when onSizeChange is undefined (read-only mode)
- Read-only state derived from project.isStopped flag
- Auto-save is disabled when isReadOnly is true

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## Human Verification Required

**This plan includes a human verification checkpoint (Task 3).** The following end-to-end testing must be performed manually:

### Prerequisites
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to http://localhost:5173

### Create Project Flow
- Click "New Project" button
- Fill in name and select lead team
- Click Create
- Verify sidebar opens with new project
- Verify project ID is PRJ-2026-00001 format

### Edit Project Flow
- In General tab: change name, status, dates
- Verify save status shows "Saving..." then "Saved"
- In People tab: fill PM, IS Owner, Sponsor
- In Teams tab: add a team, change size, remove it
- In Value tab: expand card, adjust slider, add justification
- In Change Impact tab: add impact team
- Close sidebar, reopen project, verify all changes persisted

### Lifecycle Actions
- Click three-dot menu, select "Stop Project"
- Verify project shows "Stopped" badge
- Verify form becomes read-only (all inputs disabled)
- Click Reactivate to re-enable editing
- Try Delete, type project name to confirm

### Conflict Resolution (requires second browser window)
- Open same project in two browser windows
- Make different name change in each
- Save in window 1 (wait for "Saved")
- Edit and wait for auto-save in window 2
- Verify conflict dialog appears
- Choose "Keep My Version" or "Keep Server Version"
- Verify correct resolution behavior

### Expected Results
- All 5 tabs functional and data persists
- Auto-save works with visual status indicator
- Conflict dialog appears on version mismatch
- Stopped projects are read-only
- Create project generates correct ID format
- Stop/reactivate toggles state correctly
- Delete requires name confirmation

## Next Phase Readiness
- Complete project editing experience ready for Phase 3 (Budget)
- All CONTEXT.md decisions implemented
- Optimistic locking prevents data loss from concurrent edits

---
*Phase: 02-core-projects*
*Completed: 2026-02-03*
