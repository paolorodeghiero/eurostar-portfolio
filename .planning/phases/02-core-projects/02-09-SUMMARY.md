---
phase: 02-core-projects
plan: 09
subsystem: ui
tags: [react, typescript, dialog, dropdown-menu, change-impact, project-lifecycle]

# Dependency graph
requires:
  - phase: 02-04
    provides: Project sub-resource APIs (teams, values, change-impact)
  - phase: 02-05
    provides: Portfolio page with sidebar shell
provides:
  - Change Impact tab for project sidebar
  - Three-dot menu with Stop/Reactivate/Delete actions
  - Create Project dialog for quick project creation
affects: [03-budgets, 04-governance]

# Tech tracking
tech-stack:
  added: []
  patterns: [confirmation-dialog-pattern, lifecycle-actions]

key-files:
  created:
    - frontend/src/components/projects/tabs/ChangeImpactTab.tsx
    - frontend/src/components/projects/ProjectMenu.tsx
    - frontend/src/components/projects/CreateProjectDialog.tsx
  modified:
    - frontend/src/lib/project-api.ts
    - frontend/src/components/projects/ProjectHeader.tsx
    - frontend/src/components/projects/ProjectSidebar.tsx
    - frontend/src/components/projects/ProjectTabs.tsx
    - frontend/src/pages/portfolio/PortfolioPage.tsx

key-decisions:
  - "Delete confirmation requires typing exact project name"
  - "Stop action requires no confirmation (immediate)"
  - "Change impact teams use same TeamChip component as Teams tab"

patterns-established:
  - "Delete confirmation pattern: type entity name to confirm destructive action"
  - "Lifecycle action pattern: PATCH /:id/stop and /:id/reactivate for state changes"

# Metrics
duration: 7min
completed: 2026-02-03
---

# Phase 2 Plan 9: Change Impact, Menu, and Create Dialog Summary

**Change Impact tab with team chips, three-dot menu for project lifecycle actions, and quick create dialog for new projects**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-03T18:30:39Z
- **Completed:** 2026-02-03T18:37:12Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Change Impact tab showing teams with T-shirt sizes using TeamChip component
- Three-dot menu with Stop/Reactivate and Delete actions based on project state
- Delete confirmation requiring exact project name match
- Create Project dialog with name (required), lead team (required), and dates (optional)
- Full wiring from PortfolioPage through sidebar to all new components

## Task Commits

Each task was committed atomically:

1. **Task 1: Add change impact and lifecycle API functions** - `e0ad83f` (feat)
2. **Task 2: Create ChangeImpactTab and ProjectMenu** - `7ffc498` (feat)
3. **Task 3: Create CreateProjectDialog and wire everything** - `469555f` (feat)

## Files Created/Modified
- `frontend/src/lib/project-api.ts` - Added change impact CRUD and lifecycle API functions
- `frontend/src/components/projects/tabs/ChangeImpactTab.tsx` - Change impact team management with chips
- `frontend/src/components/projects/ProjectMenu.tsx` - Three-dot dropdown with lifecycle actions
- `frontend/src/components/projects/CreateProjectDialog.tsx` - Quick create modal for new projects
- `frontend/src/components/projects/ProjectHeader.tsx` - Updated to include ProjectMenu
- `frontend/src/components/projects/ProjectSidebar.tsx` - Added onDeleted callback support
- `frontend/src/components/projects/ProjectTabs.tsx` - Wired ChangeImpactTab
- `frontend/src/pages/portfolio/PortfolioPage.tsx` - Added New Project button and CreateProjectDialog

## Decisions Made
- Delete confirmation uses exact string match (not case-insensitive) for stronger confirmation
- Stop action is immediate with no confirmation per CONTEXT.md decisions
- Reactivate appears only for stopped projects
- Change impact teams have no "isLead" concept (all can be removed)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all components created and wired successfully.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Project lifecycle complete: create, edit, stop, reactivate, delete
- All five tabs functional in project sidebar
- Ready for budget tracking (Phase 3)
- Ready for governance workflows (Phase 4)

---
*Phase: 02-core-projects*
*Completed: 2026-02-03*
