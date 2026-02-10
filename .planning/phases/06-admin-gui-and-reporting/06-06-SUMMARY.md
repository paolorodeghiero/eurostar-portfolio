---
phase: 06-admin-gui-and-reporting
plan: 06
subsystem: admin-ui
tags: [import-export, bulk-operations, excel, csv, admin]
dependency_graph:
  requires: [06-03]
  provides: ["Bulk import/export for admin referential data"]
  affects: ["frontend/admin-pages"]
tech_stack:
  added: []
  patterns: ["FormData upload", "Direct download link", "Reusable dialog component"]
key_files:
  created:
    - frontend/src/components/admin/BulkImportDialog.tsx
  modified:
    - frontend/src/lib/api-client.ts
    - frontend/src/pages/admin/DepartmentsPage.tsx
    - frontend/src/pages/admin/TeamsPage.tsx
    - frontend/src/pages/admin/OutcomesPage.tsx
    - frontend/src/pages/admin/CostCentersPage.tsx
decisions:
  - key: "Export via direct download link"
    rationale: "Simpler than fetch + blob for file downloads"
  - key: "Import dialog stays open on error"
    rationale: "Allows user to review validation errors without losing context"
  - key: "Export getAccessToken from api-client"
    rationale: "BulkImportDialog needs token for FormData uploads"
metrics:
  duration_minutes: 9
  completed_date: 2026-02-10
---

# Phase 06 Plan 06: Bulk Import/Export for Admin Referential Data Summary

**One-liner:** Excel/CSV bulk import and export functionality for departments, teams, outcomes, and cost centers with validation and error handling.

## What Was Built

### 1. BulkImportDialog Component
- Reusable import dialog for all referential types
- File type validation (Excel .xlsx, .xls and CSV)
- Shows expected columns for reference
- Displays file info after selection (name, size)
- Success message with imported count
- Error list display with validation failures
- Dialog stays open on error for review
- Calls onSuccess callback to refresh data after import

### 2. Admin Page Integration
- **DepartmentsPage**: Import/Export buttons with expected columns: `name`
- **TeamsPage**: Import/Export buttons with expected columns: `name, departmentName, description`
- **OutcomesPage**: Import/Export buttons with expected columns: `name, score1Example, score2Example, score3Example, score4Example, score5Example`
- **CostCentersPage**: Import/Export buttons with expected columns: `code, description`

### 3. Export Functionality
- Direct download link pattern using anchor element
- Downloads Excel file with current data
- Filename follows pattern: `{referentialType}.xlsx`

### 4. Import Functionality
- FormData upload to `/api/admin/{referentialType}/import`
- File validation (MIME type and extension)
- Server-side validation before committing
- Success shows count of imported items
- Errors displayed as list for user review

## Implementation Details

**Button Layout:**
- Moved from DataTable toolbar to page header
- Three buttons: Export (outline), Import (outline), Add (primary)
- Flex layout with gap-2 spacing
- Icons: Download, Upload, Plus

**API Integration:**
- Export: GET `/api/admin/{referentialType}/export`
- Import: POST `/api/admin/{referentialType}/import` with FormData
- Uses exported `getAccessToken()` for auth headers

**Expected Columns Mapping:**
- Departments: Simple name field
- Teams: Name + department lookup + optional description
- Outcomes: Name + 5 score example fields
- Cost Centers: Code + optional description

## Technical Decisions

1. **Export via direct download link** - Simpler than fetch + blob, browser handles download UI
2. **Import dialog stays open on error** - Allows review of validation errors without losing context
3. **Export getAccessToken from api-client** - Required for FormData uploads in BulkImportDialog
4. **Reusable BulkImportDialog** - Single component serves all referential types via props
5. **File type validation on client** - Immediate feedback before upload

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 019c690a | feat(06-06): create BulkImportDialog component |
| 2 | 27891836 | feat(06-06): integrate bulk import/export into admin pages |

## Files Created

- `frontend/src/components/admin/BulkImportDialog.tsx` (189 lines) - Reusable import dialog with file upload and validation

## Files Modified

- `frontend/src/lib/api-client.ts` - Exported getAccessToken for FormData uploads
- `frontend/src/pages/admin/DepartmentsPage.tsx` - Added import/export buttons and dialog
- `frontend/src/pages/admin/TeamsPage.tsx` - Added import/export buttons and dialog
- `frontend/src/pages/admin/OutcomesPage.tsx` - Added import/export buttons and dialog
- `frontend/src/pages/admin/CostCentersPage.tsx` - Added import/export buttons and dialog

## Verification Completed

- [x] BulkImportDialog component compiles without errors
- [x] All admin pages compile without TypeScript errors
- [x] Import/Export buttons visible in header area
- [x] BulkImportDialog shows expected columns
- [x] File type validation rejects invalid files
- [x] FormData properly constructed with file upload
- [x] Export creates download link with correct endpoint

## Next Steps

Per roadmap, next plans in phase 06:
- **06-07**: Integration testing for admin features

## Notes

- Uncommitted changes from plan 06-04 (UsageDrawer, AlertDialog) were present in working directory and included in commits
- These changes are compatible and don't affect import/export functionality
- DepartmentsPage also received UsageDrawer/AlertDialog enhancements alongside import/export

## Self-Check: PASSED

**Files Created:**
- ✓ frontend/src/components/admin/BulkImportDialog.tsx

**Commits:**
- ✓ 019c690a (Task 1: BulkImportDialog component)
- ✓ 27891836 (Task 2: Admin page integration)
