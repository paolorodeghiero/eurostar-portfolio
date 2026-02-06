---
phase: 04-governance-workflow
plan: 06
subsystem: audit-api
tags: [audit, history, api, drizzle]
dependency-graph:
  requires: [04-02]
  provides: [project-history-api]
  affects: [05-frontend-polish]
tech-stack:
  added: []
  patterns: [audit-history-query, field-label-mapping, pagination]
key-files:
  created:
    - backend/src/routes/projects/project-history.ts
  modified:
    - backend/src/routes/projects/index.ts
decisions:
  - id: history-field-labels
    choice: Map database column names to human-readable labels
    rationale: Better UX when displaying change history
  - id: history-pagination
    choice: Default 50 limit, max 100, with offset-based pagination
    rationale: Prevent large queries while supporting full history navigation
metrics:
  duration: 6m
  completed: 2026-02-06
---

# Phase 04 Plan 06: Project History API Summary

**One-liner:** GET /api/projects/:id/history endpoint querying audit_log with field labels and pagination

## What Was Built

### Project History Endpoint

Created `backend/src/routes/projects/project-history.ts`:

- **GET /api/projects/:id/history** - Returns formatted audit trail for a project
- Queries `audit_log` table filtering by `tableName='projects'` and `recordId`
- Sorts by `changedAt DESC` (newest first)
- Transforms raw JSONB changes into structured format with field labels

Key features:
- Field label mapping (e.g., `statusId` -> "Status", `opexBudget` -> "OPEX Budget")
- Pagination with `limit` (default 50, max 100) and `offset` query params
- Returns `pagination.total` for UI pagination controls
- Returns `pagination.hasMore` flag for infinite scroll patterns

Response structure:
```json
{
  "history": [
    {
      "id": 12,
      "timestamp": "2026-02-06T16:29:46.567Z",
      "user": "dev@eurostar.com",
      "operation": "UPDATE",
      "changes": [
        {
          "field": "businessCaseFile",
          "fieldLabel": "Business Case File",
          "oldValue": "...",
          "newValue": null
        }
      ]
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Route Registration

Updated `backend/src/routes/projects/index.ts`:
- Added import for `projectHistoryRoutes`
- Registered with `/projects` prefix (endpoint becomes `/api/projects/:id/history`)

## Verification Results

1. **Endpoint returns formatted history** - Confirmed with curl
2. **User email shown** - Shows `system` for seed/migration, actual email for authenticated changes
3. **Field labels applied** - `businessCaseFile` -> "Business Case File"
4. **Pagination works** - `?limit=2&offset=0` returns 2 results with `hasMore: true`
5. **Newest first** - Entries sorted by `changedAt DESC`
6. **404 for missing project** - `{"error":"Project not found"}` returned

## Deviations from Plan

None - plan executed exactly as written.

## Integration Notes

- Depends on audit trigger created in 04-02
- History populated by PostgreSQL trigger on projects table UPDATE/INSERT
- `changed_by` comes from `current_setting('app.current_user')` set by preHandler hook

## Next Phase Readiness

- Frontend can now build history view component
- Consider adding filtering by operation type (INSERT, UPDATE)
- Consider adding date range filtering for large histories
