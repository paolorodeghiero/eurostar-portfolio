---
phase: 02-core-projects
plan: 05
subsystem: ui
tags: [react, auto-save, debounce, sheet, sidebar, routing]

# Dependency graph
requires:
  - phase: 02-02
    provides: Teams combobox pattern
  - phase: 02-03
    provides: Project API endpoints
provides:
  - Portfolio page with project table
  - Project sidebar shell with auto-save
  - useAutoSave hook with debounce
  - project-api client functions
affects: [02-06, 02-07, 02-08, 02-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useAutoSave hook with debounce pattern for Linear-style editing
    - Sheet sidebar with sticky header/footer
    - Portfolio as home route with admin at /admin/*

key-files:
  created:
    - frontend/src/hooks/useAutoSave.ts
    - frontend/src/lib/project-api.ts
    - frontend/src/components/projects/ProjectSidebar.tsx
    - frontend/src/components/projects/ProjectHeader.tsx
    - frontend/src/components/projects/ProjectFooter.tsx
    - frontend/src/pages/portfolio/PortfolioPage.tsx
  modified:
    - frontend/src/App.tsx

key-decisions:
  - "useAutoSave hook uses 2500ms debounce delay per CONTEXT spec"
  - "Sheet component with custom header/footer for sidebar control"
  - "Portfolio route is now home (/), admin routes at /admin/*"
  - "409 conflict handling with structured error object for future conflict resolution modal"

patterns-established:
  - "useAutoSave: debounce with status tracking (idle/saving/saved/error)"
  - "Project sidebar: sticky header with ID/name, sticky footer with save status"
  - "apiClient usage in project-api.ts for authenticated requests"

# Metrics
duration: 8min
completed: 2026-02-03
---

# Phase 2 Plan 5: Portfolio Page with Project Sidebar Summary

**Portfolio page with project table, sidebar shell using Sheet component, and useAutoSave hook with 2.5s debounce for Linear-style auto-save UX**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-03
- **Completed:** 2026-02-03
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- useAutoSave hook with debounce (2500ms), status tracking, and saveNow() for immediate saves
- Project sidebar shell with sticky header (project ID, name, status) and sticky footer (save status indicator)
- Portfolio page as new home route showing all projects in a table
- Click-to-open sidebar functionality with project data loading

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useAutoSave hook and project API** - `e4576e8` (feat)
2. **Task 2: Create project sidebar shell components** - `03ec286` (feat)
3. **Task 3: Create portfolio page and wire routing** - `28c9492` (feat)

## Files Created/Modified
- `frontend/src/hooks/useAutoSave.ts` - Debounced auto-save hook with status tracking
- `frontend/src/lib/project-api.ts` - Project API client (fetchProjects, fetchProject, createProject, updateProject)
- `frontend/src/components/projects/ProjectHeader.tsx` - Sticky sidebar header with close button
- `frontend/src/components/projects/ProjectFooter.tsx` - Sticky sidebar footer with save status
- `frontend/src/components/projects/ProjectSidebar.tsx` - Main sidebar container with auto-save integration
- `frontend/src/pages/portfolio/PortfolioPage.tsx` - Portfolio table page with sidebar integration
- `frontend/src/App.tsx` - Updated routing: "/" = Portfolio, "/admin/*" = Admin

## Decisions Made
- Used Radix Sheet primitives directly (not wrapped component) to control close button placement
- Portfolio page uses simple Table component instead of DataTable (no sorting/filtering needed initially)
- project-api.ts handles 409 conflicts with structured error object for future conflict resolution modal
- Save status returns to idle after 2 seconds of showing "Saved"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Sidebar shell ready for tab content implementation (General, People, Teams, Value, Change Impact)
- Auto-save infrastructure in place for form fields
- Portfolio page ready for "Create Project" button and modal

---
*Phase: 02-core-projects*
*Completed: 2026-02-03*
