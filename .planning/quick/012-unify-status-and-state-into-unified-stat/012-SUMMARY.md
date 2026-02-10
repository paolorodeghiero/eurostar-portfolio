---
phase: quick
plan: 012
subsystem: core-projects
tags: [status-management, lifecycle, schema-refactor]
dependency-graph:
  requires: [statuses-table, projects-table]
  provides: [unified-status-system, status-based-readonly]
  affects: [project-lifecycle, admin-ui, project-sidebar]
tech-stack:
  added: []
  patterns: [status-driven-readonly, system-status-protection]
key-files:
  created: []
  modified:
    - backend/src/db/schema.ts
    - backend/src/db/seed.ts
    - backend/src/routes/admin/statuses.ts
    - backend/src/routes/projects/projects.ts
    - frontend/src/lib/project-api.ts
    - frontend/src/pages/admin/StatusesPage.tsx
    - frontend/src/components/projects/ProjectMenu.tsx
    - frontend/src/components/projects/ProjectSidebar.tsx
decisions:
  - Use status.isReadOnly instead of separate isStopped boolean
  - System statuses (Draft/Stopped/Completed) cannot be deleted
  - Stop/Reactivate moved from menu to status dropdown
  - previousStatusId tracks status before stop for reactivation
metrics:
  duration_minutes: 9
  completed: 2026-02-10
  tasks_completed: 3
  files_modified: 8
  commits: 2
---

# Quick Task 012: Unify Status and State into Unified State Summary

**One-liner:** Moved project stop/reactivate lifecycle into unified status system with read-only and system status flags

## What Was Built

Unified project lifecycle management by moving stop/reactivate behavior into the status system. System statuses (Draft, Stopped, Completed) are now protected from deletion, and read-only mode is controlled by status.isReadOnly flag instead of the deprecated isStopped boolean.

### Schema Changes

**statuses table:**
- Added `is_system_status` boolean (marks Draft/Stopped/Completed)
- Added `is_read_only` boolean (marks Stopped/Completed)

**projects table:**
- Added `previous_status_id` integer (stores status before stop for reactivation)
- Kept `is_stopped` for backward compatibility (deprecated)

**Seed data:**
- Added "Stopped" status (color: #DC2626, displayOrder: 7)
- Marked Draft/Stopped/Completed as system statuses
- Marked Stopped/Completed as read-only

### Backend Changes

**Admin Statuses API:**
- GET endpoints return isSystemStatus and isReadOnly fields
- POST/PUT prevent setting isSystemStatus via API (server-controlled)
- DELETE blocks system status deletion with 400 error

**Projects API:**
- GET endpoints include status.isReadOnly and status.isSystemStatus in responses
- PATCH /:id/stop saves current statusId to previousStatusId, transitions to Stopped
- PATCH /:id/reactivate restores previousStatusId or defaults to Draft
- PUT /:id prevents updates when current status.isReadOnly is true (403 error)

### Frontend Changes

**StatusesPage:**
- Shows "System" badge for system statuses
- Shows "Read-only" text indicator for read-only statuses
- Disables delete button for system statuses with tooltip

**ProjectMenu:**
- Removed Stop/Reactivate menu items
- Only Delete remains (status changes via status dropdown)

**ProjectSidebar:**
- Changed isReadOnly detection from `project.isStopped` to `project.status.isReadOnly`
- Read-only mode now driven by status flag

**project-api.ts:**
- Added isSystemStatus and isReadOnly to status interface
- Marked isStopped as deprecated with comment

## Key Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Keep isStopped column | Backward compatibility during transition | Minimal - column will be removed in future migration |
| System statuses cannot be deleted | Prevent breaking project lifecycle state machine | Admin UI shows disabled delete with tooltip |
| Stop/Reactivate via status change | Unified UX - all status changes in one place | Simplified menu, clearer lifecycle model |
| previousStatusId for reactivation | Preserve context of what status project was in | Better UX when reactivating stopped projects |
| Read-only based on status flag | Extensible - any future status can be read-only | Completed projects now also read-only by default |

## Deviations from Plan

None - plan executed exactly as written.

## Testing Performed

**Backend:**
- ✓ `npm run build` compiles without errors
- ✓ Database migration applied successfully
- ✓ Seed data creates 7 statuses with correct flags
- ✓ Database verification confirms is_system_status and is_read_only columns exist
- ✓ Verified Draft/Stopped/Completed have isSystemStatus=true
- ✓ Verified Stopped/Completed have isReadOnly=true

**Frontend:**
- ✓ `npm run build` compiles without errors
- ✓ TypeScript types updated for status.isSystemStatus and status.isReadOnly

## Migration Notes

**Database Migration:** `0008_fearless_juggernaut.sql`
- Adds is_system_status boolean DEFAULT false NOT NULL
- Adds is_read_only boolean DEFAULT false NOT NULL
- Adds previous_status_id integer with FK to statuses ON DELETE SET NULL

**Backward Compatibility:**
- isStopped column preserved (marked deprecated)
- Stop/reactivate endpoints still work but now use status transitions
- Old API consumers still see isStopped=true for stopped projects

## Next Steps

1. Update Power BI views to use status.isReadOnly instead of isStopped
2. Create future migration to drop isStopped column after transition period
3. Consider adding more read-only statuses (e.g., "Archived", "Cancelled")
4. Add audit log entries for status transitions

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 0642a51a | feat(quick-012): add isSystemStatus and isReadOnly to statuses schema | schema.ts, seed.ts, statuses.ts, projects.ts, migration |
| 75286b28 | feat(quick-012): update frontend for unified status system | project-api.ts, StatusesPage.tsx, ProjectMenu.tsx, ProjectSidebar.tsx |

## Self-Check: PASSED

✓ Schema changes verified in database
✓ Seed data contains 7 statuses with correct flags
✓ System statuses (Draft/Stopped/Completed) have isSystemStatus=true
✓ Read-only statuses (Stopped/Completed) have isReadOnly=true
✓ previousStatusId column exists in projects table
✓ Backend builds without errors
✓ Frontend builds without errors
✓ All commits exist in git history
